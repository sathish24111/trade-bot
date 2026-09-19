"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizationService = exports.OptimizationService = void 0;
const crypto_1 = require("crypto");
const database_1 = require("../../config/database");
const backtesting_service_1 = require("../backtesting.service");
const market_service_1 = require("../market.service");
const metrics_service_1 = require("./metrics.service");
const OPTIMIZATION_DISCLAIMER = 'Optimization results are simulated paper trades using historical market data. Optimization tests multiple historical parameter combinations; it does NOT predict future market behavior or guarantee profit.';
class OptimizationService {
    /**
     * Generates Cartesian product combinations from parameter ranges dictionary.
     */
    generateCombinations(ranges) {
        const keys = Object.keys(ranges);
        if (keys.length === 0)
            return [{}];
        const results = [];
        const helper = (depth, current) => {
            if (depth === keys.length) {
                results.push({ ...current });
                return;
            }
            const key = keys[depth];
            const values = ranges[key] || [];
            if (values.length === 0) {
                helper(depth + 1, current);
            }
            else {
                for (const val of values) {
                    current[key] = val;
                    helper(depth + 1, current);
                }
            }
        };
        helper(0, {});
        return results;
    }
    /**
     * Runs parameter grid search optimization with train / validation / test splits.
     * Parameter selection is strictly based on train/val sets to prevent data snooping on test set.
     */
    async runOptimization(config) {
        const { userId, asset, timeframe = '5m', strategy, parameterRanges, trainSplitRatio = 0.70, valSplitRatio = 0.15, testSplitRatio = 0.15, initialBalance = 10000, tradeAmount = 100 } = config;
        // 1. Fetch and clean historical candles
        let candles = await market_service_1.marketService.getCandles(asset, timeframe, 200);
        candles = backtesting_service_1.backtestingService.validateAndCleanCandles(candles);
        if (candles.length < 75) {
            throw new Error(`Insufficient candle data for 3-way split optimization. Found ${candles.length} candles, minimum 75 required.`);
        }
        // 2. Chronological Train / Val / Test Partitioning
        const trainEnd = Math.floor(candles.length * trainSplitRatio);
        const valEnd = Math.floor(candles.length * (trainSplitRatio + valSplitRatio));
        const trainCandles = candles.slice(0, trainEnd);
        const valCandles = candles.slice(trainEnd, valEnd);
        const testCandles = candles.slice(valEnd);
        if (trainCandles.length < 25 || valCandles.length < 15 || testCandles.length < 15) {
            throw new Error('Split ratios resulted in partitions too small for valid indicator calculation.');
        }
        // 3. Generate parameter combinations (cap at 100 to prevent CPU exhaustion)
        let combinations = this.generateCombinations(parameterRanges);
        if (combinations.length > 100) {
            combinations = combinations.slice(0, 100);
        }
        if (combinations.length === 0) {
            combinations = [{}];
        }
        const combinationResults = [];
        for (let i = 0; i < combinations.length; i++) {
            const params = combinations[i];
            const combId = `comb-${i + 1}-${(0, crypto_1.randomUUID)().substring(0, 8)}`;
            // A. In-Sample Training Backtest
            const trainRes = await backtesting_service_1.backtestingService.runBacktest({
                userId,
                asset,
                timeframe,
                strategy,
                candles: trainCandles,
                initialBalance,
                tradeAmount,
                parameters: params
            }, false);
            const trainMetrics = metrics_service_1.metricsService.calculateMetrics(trainRes.trades, trainRes.equityCurve, initialBalance);
            // B. Validation Backtest
            const valRes = await backtesting_service_1.backtestingService.runBacktest({
                userId,
                asset,
                timeframe,
                strategy,
                candles: valCandles,
                initialBalance,
                tradeAmount,
                parameters: params
            }, false);
            const valMetrics = metrics_service_1.metricsService.calculateMetrics(valRes.trades, valRes.equityCurve, initialBalance);
            // C. Out-Of-Sample Test Backtest
            const testRes = await backtesting_service_1.backtestingService.runBacktest({
                userId,
                asset,
                timeframe,
                strategy,
                candles: testCandles,
                initialBalance,
                tradeAmount,
                parameters: params
            }, false);
            const testMetrics = metrics_service_1.metricsService.calculateMetrics(testRes.trades, testRes.equityCurve, initialBalance);
            // D. Overfitting Assessment: Compare Train vs Test Performance
            const trainReturn = trainMetrics.returnPercent;
            const testReturn = testMetrics.returnPercent;
            const baseline = Math.max(Math.abs(trainReturn), 1.0);
            const deltaOos = (testReturn - trainReturn) / baseline;
            let overfittingRisk = 'LOW';
            if (deltaOos < -0.50 || (trainReturn > 1.0 && testReturn < -0.5)) {
                overfittingRisk = 'HIGH';
            }
            else if (deltaOos < -0.25 || (trainReturn > 0.5 && testReturn < 0)) {
                overfittingRisk = 'MODERATE';
            }
            combinationResults.push({
                combinationId: combId,
                parameters: params,
                trainMetrics,
                valMetrics,
                testMetrics,
                overfittingScore: Number(deltaOos.toFixed(3)),
                overfittingRisk,
                isRecommended: false
            });
        }
        // 4. Select recommended candidate based strictly on Train + Validation metrics
        // Scoring: Validation Sharpe if available, else Val Net PnL + Train Net PnL
        let bestIdx = 0;
        let bestScore = -Infinity;
        for (let i = 0; i < combinationResults.length; i++) {
            const item = combinationResults[i];
            const valScore = item.valMetrics?.sharpeRatio ?? (item.valMetrics?.netPnl ?? -100);
            const trainScore = item.trainMetrics.sharpeRatio ?? (item.trainMetrics.netPnl ?? -100);
            const combinedScore = valScore * 0.7 + trainScore * 0.3;
            if (combinedScore > bestScore) {
                bestScore = combinedScore;
                bestIdx = i;
            }
        }
        if (combinationResults.length > 0) {
            combinationResults[bestIdx].isRecommended = true;
        }
        // Check if best candidate exhibits overfitting
        let overfittingWarning = undefined;
        if (combinationResults[bestIdx]?.overfittingRisk === 'HIGH') {
            overfittingWarning =
                '⚠ Possible Overfitting: Selected parameter combination performed substantially better on historical training data than on out-of-sample data. Historical performance does not guarantee future results.';
        }
        const runId = (0, crypto_1.randomUUID)();
        const result = {
            id: runId,
            userId,
            asset,
            timeframe,
            strategy,
            totalCombinations: combinationResults.length,
            trainCandlesCount: trainCandles.length,
            valCandlesCount: valCandles.length,
            testCandlesCount: testCandles.length,
            results: combinationResults,
            overfittingWarning,
            disclaimer: OPTIMIZATION_DISCLAIMER,
            mode: 'PAPER',
            isRealMoney: false,
            brokerConnected: false,
            historical: true,
            isPrediction: false
        };
        // 5. Asynchronously persist optimization run to MySQL
        this.persistOptimizationRun(result).catch(err => {
            console.error('Failed to persist optimization run:', err.message);
        });
        return result;
    }
    /**
     * Persists optimization run and top combination results to MySQL database.
     */
    async persistOptimizationRun(run) {
        const connection = await database_1.pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query(`INSERT INTO optimization_runs (
          id, user_id, strategy, asset, timeframe, parameter_space,
          best_parameters, best_metric_value, total_iterations,
          train_ratio, val_ratio, test_ratio, overfitting_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                run.id,
                run.userId,
                run.strategy,
                run.asset,
                run.timeframe,
                JSON.stringify(run.results.map(r => r.parameters)),
                JSON.stringify(run.results.find(r => r.isRecommended)?.parameters || {}),
                run.results.find(r => r.isRecommended)?.testMetrics?.returnPercent ?? 0,
                run.totalCombinations,
                0.70,
                0.15,
                0.15,
                run.results.find(r => r.isRecommended)?.overfittingScore ?? 0
            ]);
            for (const item of run.results) {
                await connection.query(`INSERT INTO optimization_results (
            id, run_id, parameters, is_in_sample, total_pnl, win_rate,
            profit_factor, sharpe_ratio, sortino_ratio, max_drawdown, total_trades
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                    item.combinationId,
                    run.id,
                    JSON.stringify(item.parameters),
                    item.isRecommended ? 0 : 1,
                    item.testMetrics?.netPnl ?? item.trainMetrics.netPnl,
                    item.testMetrics?.winRate ?? item.trainMetrics.winRate,
                    item.testMetrics?.profitFactor ?? item.trainMetrics.profitFactor,
                    item.testMetrics?.sharpeRatio ?? null,
                    item.testMetrics?.sortinoRatio ?? null,
                    item.testMetrics?.maxDrawdownPercent ?? item.trainMetrics.maxDrawdownPercent,
                    item.testMetrics?.totalTrades ?? item.trainMetrics.totalTrades
                ]);
            }
            await connection.commit();
        }
        catch (err) {
            await connection.rollback();
            throw err;
        }
        finally {
            connection.release();
        }
    }
    /**
     * Generates 2D parameter sensitivity heatmap matrix and detects cliff-drop overfitting risks.
     */
    async generateSensitivityHeatmap(config) {
        const { strategy, asset, timeframe, param1Name, param1Range, param2Name, param2Range, baseParameters = {}, candleCount = 100 } = config;
        const matrix = [];
        const candles = await market_service_1.marketService.getCandles(asset, timeframe, candleCount);
        const cleaned = backtesting_service_1.backtestingService.validateAndCleanCandles(candles);
        for (const p1 of param1Range) {
            for (const p2 of param2Range) {
                const testParams = {
                    ...baseParameters,
                    [param1Name]: p1,
                    [param2Name]: p2
                };
                const sim = await backtesting_service_1.backtestingService.runBacktest({
                    asset,
                    strategy,
                    candles: cleaned,
                    parameters: testParams,
                    initialBalance: 10000,
                    tradeAmount: 100
                }, false);
                const metricVal = sim.advancedMetrics && sim.advancedMetrics.sharpeRatio !== null
                    ? sim.advancedMetrics.sharpeRatio
                    : sim.netPnl;
                matrix.push({
                    param1Value: p1,
                    param2Value: p2,
                    metricValue: Number(metricVal.toFixed(2)),
                    winRate: sim.winRate,
                    tradesCount: sim.totalTrades
                });
            }
        }
        let cliffDropCount = 0;
        let stableRegionCount = 0;
        for (let i = 0; i < matrix.length; i++) {
            const current = matrix[i];
            const neighbors = matrix.filter((other) => other !== current &&
                Math.abs(other.param1Value - current.param1Value) <= 1.05 * (param1Range[1] - param1Range[0] || 1) &&
                Math.abs(other.param2Value - current.param2Value) <= 1.05 * (param2Range[1] - param2Range[0] || 1));
            for (const n of neighbors) {
                if (current.metricValue > 0 && n.metricValue <= current.metricValue * 0.4) {
                    cliffDropCount++;
                }
                else if (Math.abs(current.metricValue - n.metricValue) <= 0.25 * Math.abs(current.metricValue)) {
                    stableRegionCount++;
                }
            }
        }
        const sensitivityDetected = cliffDropCount > 2 || (matrix.length > 4 && stableRegionCount < cliffDropCount);
        const sensitivityWarning = sensitivityDetected
            ? '⚠ Parameter Sensitivity Detected: Strategy performance varies drastically across adjacent parameter increments.'
            : undefined;
        return {
            param1Name,
            param2Name,
            matrix,
            sensitivityDetected,
            sensitivityWarning,
            stableRegionCount,
            cliffDropCount
        };
    }
}
exports.OptimizationService = OptimizationService;
exports.optimizationService = new OptimizationService();
