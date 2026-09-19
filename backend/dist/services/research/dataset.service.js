"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.datasetService = exports.DatasetService = void 0;
const crypto_1 = require("crypto");
const database_1 = require("../../config/database");
class DatasetService {
    inMemoryDatasets = new Map();
    /**
     * Helper to parse timeframe string into expected interval in seconds.
     */
    getTimeframeSeconds(timeframe) {
        const tf = (timeframe || '1m').toLowerCase().trim();
        if (tf.endsWith('m')) {
            const mins = parseInt(tf.replace('m', ''), 10) || 1;
            return mins * 60;
        }
        if (tf.endsWith('h')) {
            const hours = parseInt(tf.replace('h', ''), 10) || 1;
            return hours * 3600;
        }
        if (tf.endsWith('d')) {
            const days = parseInt(tf.replace('d', ''), 10) || 1;
            return days * 86400;
        }
        return 60;
    }
    /**
     * Validates raw candle records, filters duplicates and corrupted bars,
     * performs gap detection without data fabrication, and calculates SHA-256 checksum.
     */
    validateCandles(rawCandles, timeframe) {
        const totalCandles = rawCandles.length;
        const warnings = [];
        const gaps = [];
        if (totalCandles === 0) {
            return {
                cleanedCandles: [],
                report: {
                    passed: false,
                    totalCandles: 0,
                    duplicateTimestamps: 0,
                    outOfOrderCandles: 0,
                    invalidOhlcCandles: 0,
                    gapCount: 0,
                    maxGapDurationSec: 0,
                    gaps: [],
                    sha256Checksum: '',
                    warnings: ['Dataset contains 0 candles']
                }
            };
        }
        // 1. Check if original candles are out of order
        let outOfOrderCount = 0;
        for (let i = 1; i < rawCandles.length; i++) {
            if (rawCandles[i].timestamp < rawCandles[i - 1].timestamp) {
                outOfOrderCount++;
            }
        }
        // Sort ascending by timestamp
        const sorted = [...rawCandles].sort((a, b) => a.timestamp - b.timestamp);
        // 2. Validate OHLC integrity & Deduplicate timestamps
        let duplicateCount = 0;
        let invalidOhlcCount = 0;
        const validBars = [];
        const seenTimestamps = new Set();
        for (const c of sorted) {
            if (seenTimestamps.has(c.timestamp)) {
                duplicateCount++;
                continue; // deduplicate
            }
            seenTimestamps.add(c.timestamp);
            // Check OHLC integrity
            const isOhlcValid = c.high >= c.low &&
                c.high >= c.open &&
                c.high >= c.close &&
                c.low <= c.open &&
                c.low <= c.close &&
                c.volume >= 0;
            if (!isOhlcValid) {
                invalidOhlcCount++;
                continue; // discard corrupted bar
            }
            validBars.push(c);
        }
        // 3. Timeframe-aware gap detection (Never synthesize fake bars)
        const expectedStepSec = this.getTimeframeSeconds(timeframe);
        let maxGapSec = 0;
        for (let i = 1; i < validBars.length; i++) {
            const prev = validBars[i - 1];
            const curr = validBars[i];
            const diffSec = Math.round((curr.timestamp - prev.timestamp) / 1000);
            // If gap exceeds 1.5x expected interval
            if (diffSec > expectedStepSec * 1.5) {
                const missing = Math.max(1, Math.round(diffSec / expectedStepSec) - 1);
                gaps.push({
                    expectedTimestamp: prev.timestamp + expectedStepSec * 1000,
                    actualTimestamp: curr.timestamp,
                    gapDurationSeconds: diffSec,
                    missingEstimatedCandles: missing
                });
                if (diffSec > maxGapSec) {
                    maxGapSec = diffSec;
                }
            }
        }
        if (gaps.length > 0) {
            warnings.push(`DATA_GAP_DETECTED: ${gaps.length} gaps identified in dataset. Max gap: ${maxGapSec}s.`);
        }
        if (outOfOrderCount > 0) {
            warnings.push(`Dataset had ${outOfOrderCount} out-of-order candles which were sorted chronologically.`);
        }
        if (duplicateCount > 0) {
            warnings.push(`Deduplicated ${duplicateCount} candles with identical timestamps.`);
        }
        if (invalidOhlcCount > 0) {
            warnings.push(`Removed ${invalidOhlcCount} candles with invalid OHLC relationships.`);
        }
        // 4. SHA-256 Checksum calculation over clean canonical bars
        const hash = (0, crypto_1.createHash)('sha256');
        for (const b of validBars) {
            hash.update(`${b.timestamp},${b.open.toFixed(6)},${b.high.toFixed(6)},${b.low.toFixed(6)},${b.close.toFixed(6)},${b.volume.toFixed(2)};`);
        }
        const sha256Checksum = hash.digest('hex');
        const passed = invalidOhlcCount === 0 && validBars.length > 0;
        const report = {
            passed,
            totalCandles: validBars.length,
            duplicateTimestamps: duplicateCount,
            outOfOrderCandles: outOfOrderCount,
            invalidOhlcCandles: invalidOhlcCount,
            gapCount: gaps.length,
            maxGapDurationSec: maxGapSec,
            gaps,
            sha256Checksum,
            warnings
        };
        return { cleanedCandles: validBars, report };
    }
    /**
     * Strict train / validation / test partitioning.
     * By default, testPartition is locked against optimization algorithms.
     */
    partitionDataset(candles, trainRatio = 0.70, valRatio = 0.15, testRatio = 0.15) {
        const total = candles.length;
        if (total === 0) {
            return { train: [], val: [], test: [] };
        }
        const trainEnd = Math.max(1, Math.floor(total * trainRatio));
        const valEnd = Math.max(trainEnd + 1, Math.floor(total * (trainRatio + valRatio)));
        const train = candles.slice(0, trainEnd);
        const val = candles.slice(trainEnd, valEnd);
        const test = candles.slice(valEnd);
        return { train, val, test };
    }
    /**
     * Registers, validates, and persists a dataset in memory and database.
     */
    async registerDataset(name, asset, timeframe, candles, source = 'simulated') {
        const normCandles = candles.map((c) => ({
            timestamp: typeof c.timestamp === 'string' ? new Date(c.timestamp).getTime() : c.timestamp,
            open: Number(c.open),
            high: Number(c.high),
            low: Number(c.low),
            close: Number(c.close),
            volume: Number(c.volume || 100),
            timeframe,
            source: c.source || source,
            isComplete: true
        }));
        const { cleanedCandles, report } = this.validateCandles(normCandles, timeframe);
        const id = `ds_${(0, crypto_1.randomUUID)().replace(/-/g, '').substring(0, 16)}`;
        const startTime = cleanedCandles.length > 0 ? new Date(cleanedCandles[0].timestamp).toISOString() : new Date().toISOString();
        const endTime = cleanedCandles.length > 0 ? new Date(cleanedCandles[cleanedCandles.length - 1].timestamp).toISOString() : new Date().toISOString();
        const metadata = {
            id,
            name,
            asset,
            timeframe,
            candleCount: cleanedCandles.length,
            startTime,
            endTime,
            sha256Checksum: report.sha256Checksum,
            isValidated: report.passed,
            createdAt: new Date().toISOString()
        };
        const partitions = this.partitionDataset(cleanedCandles);
        const dataset = {
            metadata,
            candles: cleanedCandles,
            trainPartition: partitions.train,
            valPartition: partitions.val,
            testPartition: partitions.test,
            isTestLocked: true
        };
        // Cache in memory
        this.inMemoryDatasets.set(id, dataset);
        // Persist to MySQL if available
        try {
            await database_1.pool.query(`INSERT INTO historical_datasets (id, name, asset, timeframe, candle_count, start_time, end_time, sha256_checksum, is_validated)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                id,
                name,
                asset,
                timeframe,
                metadata.candleCount,
                startTime,
                endTime,
                metadata.sha256Checksum,
                metadata.isValidated
            ]);
            await database_1.pool.query(`INSERT INTO dataset_validation_results (id, dataset_id, passed, total_candles, missing_candles, duplicate_timestamps, out_of_order_candles, gap_count, max_gap_duration_sec, report_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                `val_${(0, crypto_1.randomUUID)().replace(/-/g, '').substring(0, 16)}`,
                id,
                report.passed,
                report.totalCandles,
                report.gaps.reduce((acc, g) => acc + g.missingEstimatedCandles, 0),
                report.duplicateTimestamps,
                report.outOfOrderCandles,
                report.gapCount,
                report.maxGapDurationSec,
                JSON.stringify(report)
            ]);
        }
        catch (err) {
            console.warn(`[DatasetService] Could not persist dataset to MySQL, operating in memory: ${err.message}`);
        }
        return { metadata, validationReport: report, dataset };
    }
    /**
     * Retrieves dataset by ID.
     */
    async getDataset(id) {
        if (this.inMemoryDatasets.has(id)) {
            return this.inMemoryDatasets.get(id);
        }
        try {
            const [rows] = await database_1.pool.query(`SELECT * FROM historical_datasets WHERE id = ?`, [id]);
            if (rows.length === 0)
                return null;
            const row = rows[0];
            const metadata = {
                id: row.id,
                name: row.name,
                asset: row.asset,
                timeframe: row.timeframe,
                candleCount: row.candle_count,
                startTime: row.start_time,
                endTime: row.end_time,
                sha256Checksum: row.sha256_checksum,
                isValidated: !!row.is_validated,
                createdAt: row.created_at
            };
            // Return empty partition structure if not in memory
            return {
                metadata,
                candles: [],
                trainPartition: [],
                valPartition: [],
                testPartition: [],
                isTestLocked: true
            };
        }
        catch {
            return null;
        }
    }
    /**
     * Lists available datasets.
     */
    async listDatasets(asset, timeframe) {
        const list = [];
        // From memory
        for (const ds of this.inMemoryDatasets.values()) {
            if (asset && ds.metadata.asset !== asset)
                continue;
            if (timeframe && ds.metadata.timeframe !== timeframe)
                continue;
            list.push(ds.metadata);
        }
        // Also fetch any from DB not in memory
        try {
            let query = `SELECT * FROM historical_datasets WHERE 1=1`;
            const params = [];
            if (asset) {
                query += ` AND asset = ?`;
                params.push(asset);
            }
            if (timeframe) {
                query += ` AND timeframe = ?`;
                params.push(timeframe);
            }
            query += ` ORDER BY created_at DESC`;
            const [rows] = await database_1.pool.query(query, params);
            for (const row of rows) {
                if (!list.some((item) => item.id === row.id)) {
                    list.push({
                        id: row.id,
                        name: row.name,
                        asset: row.asset,
                        timeframe: row.timeframe,
                        candleCount: row.candle_count,
                        startTime: row.start_time,
                        endTime: row.end_time,
                        sha256Checksum: row.sha256_checksum,
                        isValidated: !!row.is_validated,
                        createdAt: row.created_at
                    });
                }
            }
        }
        catch {
            // ignore db errors, memory list will be returned
        }
        return list;
    }
}
exports.DatasetService = DatasetService;
exports.datasetService = new DatasetService();
