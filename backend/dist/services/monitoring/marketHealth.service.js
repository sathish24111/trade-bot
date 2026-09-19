"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketHealthService = exports.MarketHealthService = void 0;
const database_1 = require("../../config/database");
const market_service_1 = require("../market.service");
class MarketHealthService {
    healthCache = new Map();
    // Configurable health thresholds
    STALE_THRESHOLD_MS = 60 * 1000; // 60s
    DELAYED_THRESHOLD_MS = 10 * 1000; // 10s
    LATENCY_THRESHOLD_MS = 2000; // 2s
    /**
     * Evaluates and records the health of a specific asset and timeframe market data stream.
     * Zero candle fabrication: flags gaps without synthesizing fake bars.
     */
    async evaluateAssetHealth(asset, timeframe = '5m') {
        const key = `${asset}_${timeframe}`;
        const startTime = Date.now();
        try {
            const candles = await market_service_1.marketService.getCandles(asset, timeframe, 30);
            const latencyMs = Date.now() - startTime;
            const now = Date.now();
            if (!candles || candles.length === 0) {
                const info = {
                    provider: 'TradePilot-SimulatedEngine',
                    asset,
                    timeframe,
                    lastCandleTimestamp: new Date(0).toISOString(),
                    lastReceivedTimestamp: new Date(now).toISOString(),
                    dataAgeMs: now,
                    latencyMs,
                    candleCount: 0,
                    missingCandles: 0,
                    duplicateCandles: 0,
                    invalidCandles: 0,
                    status: 'UNAVAILABLE',
                    details: 'No candle data returned from provider'
                };
                this.healthCache.set(key, info);
                await this.persistHealthEvent(info);
                return info;
            }
            // Check candles for duplicates, invalid OHLC, and gaps
            let duplicates = 0;
            let invalids = 0;
            let missingCandles = 0;
            const timestamps = new Set();
            for (let i = 0; i < candles.length; i++) {
                const c = candles[i];
                if (timestamps.has(c.timestamp)) {
                    duplicates++;
                }
                else {
                    timestamps.add(c.timestamp);
                }
                // OHLC integrity
                if (c.high < c.low || c.high < c.open || c.high < c.close || c.low > c.open || c.low > c.close) {
                    invalids++;
                }
                // Gap check between consecutive candles
                if (i > 0) {
                    const prevTime = candles[i - 1].timestamp;
                    const currTime = c.timestamp;
                    const stepMs = this.getExpectedStepMs(timeframe);
                    if (currTime - prevTime > stepMs * 1.5) {
                        missingCandles += Math.max(1, Math.round((currTime - prevTime) / stepMs) - 1);
                    }
                }
            }
            const lastCandle = candles[candles.length - 1];
            const lastCandleTime = lastCandle.timestamp;
            const dataAgeMs = Math.max(0, now - lastCandleTime);
            let status = 'HEALTHY';
            let details = 'Data stream is continuous, fresh, and consistent.';
            if (invalids > 0) {
                status = 'INVALID';
                details = `Detected ${invalids} corrupted OHLC bars.`;
            }
            else if (missingCandles > 0) {
                status = 'GAP_DETECTED';
                details = `Detected ${missingCandles} missing bars. Data gaps logged without fabrication.`;
            }
            else if (dataAgeMs > this.STALE_THRESHOLD_MS) {
                status = 'STALE';
                details = `Data age (${Math.round(dataAgeMs / 1000)}s) exceeds stale threshold (${this.STALE_THRESHOLD_MS / 1000}s).`;
            }
            else if (dataAgeMs > this.DELAYED_THRESHOLD_MS || latencyMs > this.LATENCY_THRESHOLD_MS) {
                status = 'DELAYED';
                details = `Feed latency (${latencyMs}ms) or age (${Math.round(dataAgeMs / 1000)}s) is elevated.`;
            }
            else {
                status = 'SIMULATED';
                details = 'Simulated market feed active and functioning normally.';
            }
            const info = {
                provider: 'TradePilot-SimulatedEngine',
                asset,
                timeframe,
                lastCandleTimestamp: new Date(lastCandle.timestamp).toISOString(),
                lastReceivedTimestamp: new Date(now).toISOString(),
                dataAgeMs,
                latencyMs,
                candleCount: candles.length,
                missingCandles,
                duplicateCandles: duplicates,
                invalidCandles: invalids,
                status,
                details
            };
            this.healthCache.set(key, info);
            await this.persistHealthEvent(info);
            return info;
        }
        catch (err) {
            const info = {
                provider: 'TradePilot-SimulatedEngine',
                asset,
                timeframe,
                lastCandleTimestamp: new Date(0).toISOString(),
                lastReceivedTimestamp: new Date().toISOString(),
                dataAgeMs: -1,
                latencyMs: -1,
                candleCount: 0,
                missingCandles: 0,
                duplicateCandles: 0,
                invalidCandles: 0,
                status: 'UNAVAILABLE',
                details: `Market data error: ${err.message}`
            };
            this.healthCache.set(key, info);
            return info;
        }
    }
    /**
     * Retrieves latest health status for all standard monitored assets.
     */
    async getAllMarketHealth() {
        const assets = ['BTC/USD', 'ETH/USD', 'EUR/USD', 'GBP/USD'];
        const results = [];
        for (const asset of assets) {
            const health = await this.evaluateAssetHealth(asset, '5m');
            results.push(health);
        }
        return results;
    }
    /**
     * Persists health event into database.
     */
    async persistHealthEvent(info) {
        try {
            await database_1.pool.query(`INSERT INTO market_health_events 
         (provider, asset, timeframe, status, latency_ms, data_age_ms, missing_candles, duplicate_candles, invalid_candles, details)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                info.provider,
                info.asset,
                info.timeframe,
                info.status,
                info.latencyMs,
                info.dataAgeMs,
                info.missingCandles,
                info.duplicateCandles,
                info.invalidCandles,
                info.details || null
            ]);
        }
        catch {
            // In-memory fallback handles DB errors gracefully
        }
    }
    getExpectedStepMs(timeframe) {
        switch (timeframe) {
            case '1m': return 60 * 1000;
            case '5m': return 5 * 60 * 1000;
            case '15m': return 15 * 60 * 1000;
            case '1h': return 60 * 60 * 1000;
            case '1d': return 24 * 60 * 60 * 1000;
            default: return 5 * 60 * 1000;
        }
    }
    getProviderDiagnostics() {
        const { providerFailoverService } = require('../market/providerFailover.service');
        return providerFailoverService.getHealthInfo();
    }
}
exports.MarketHealthService = MarketHealthService;
exports.marketHealthService = new MarketHealthService();
