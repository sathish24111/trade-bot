"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportingService = exports.ReportingService = void 0;
const crypto_1 = require("crypto");
const backtesting_service_1 = require("../backtesting.service");
const market_service_1 = require("../market.service");
const dataset_service_1 = require("./dataset.service");
const monteCarlo_service_1 = require("./monteCarlo.service");
const optimization_service_1 = require("./optimization.service");
const stressTest_service_1 = require("./stressTest.service");
const walkForward_service_1 = require("./walkForward.service");
const REPORT_DISCLAIMER = 'RESEARCH REPORT DISCLAIMER: All performance metrics, simulations, and stress tests are calculated strictly using simulated paper trading and historical market data. Past performance is NOT indicative of future results. TradePilot does not execute live broker transactions and makes NO guarantee of profit or risk elimination.';
class ReportingService {
    /**
     * Converts an array of objects into a standard CSV formatted string.
     */
    exportToCsv(rows) {
        if (!rows || rows.length === 0) {
            return '';
        }
        const headers = Object.keys(rows[0]);
        const lines = [headers.join(',')];
        for (const row of rows) {
            const line = headers.map((h) => {
                const val = row[h];
                if (val === null || val === undefined)
                    return '';
                const str = String(val).replace(/"/g, '""');
                return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
            });
            lines.push(line.join(','));
        }
        return lines.join('\n');
    }
    /**
     * Generates a comprehensive evidence-based research report for a strategy.
     */
    async generateComprehensiveReport(config) {
        const { strategy, asset, timeframe, candleCount = 100, userId = 1 } = config;
        // 1. Fetch & validate dataset
        const candles = await market_service_1.marketService.getCandles(asset, timeframe, candleCount);
        const { cleanedCandles, report: datasetValReport } = dataset_service_1.datasetService.validateCandles(candles.map((c) => ({
            timestamp: typeof c.timestamp === 'string' ? new Date(c.timestamp).getTime() : c.timestamp,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
            volume: c.volume || 100,
            timeframe,
            source: 'simulated',
            isComplete: true
        })), timeframe);
        // Partition into train (70%) and test (30%)
        const partitions = dataset_service_1.datasetService.partitionDataset(cleanedCandles, 0.70, 0.0, 0.30);
        // 2. In-Sample backtest
        const inSampleBt = await backtesting_service_1.backtestingService.runBacktest({
            userId,
            asset,
            timeframe,
            strategy,
            candles: partitions.train.map((c) => ({
                timestamp: c.timestamp,
                open: c.open,
                high: c.high,
                low: c.low,
                close: c.close,
                volume: c.volume
            })),
            initialBalance: 10000
        }, false);
        // 3. Out-of-Sample backtest
        const outSampleBt = await backtesting_service_1.backtestingService.runBacktest({
            userId,
            asset,
            timeframe,
            strategy,
            candles: partitions.test.map((c) => ({
                timestamp: c.timestamp,
                open: c.open,
                high: c.high,
                low: c.low,
                close: c.close,
                volume: c.volume
            })),
            initialBalance: 10000
        }, false);
        // 4. Parameter Sensitivity
        const paramSensitivity = await optimization_service_1.optimizationService.generateSensitivityHeatmap({
            strategy,
            asset,
            timeframe,
            param1Name: 'fastEmaPeriod',
            param1Range: [8, 10, 12],
            param2Name: 'slowEmaPeriod',
            param2Range: [20, 25, 30],
            candleCount
        });
        // 5. Walk-Forward Run
        const wfRun = await walkForward_service_1.walkForwardService.runWalkForward({
            userId,
            asset,
            timeframe,
            strategy,
            parameterRanges: { fastEmaPeriod: [9, 12], slowEmaPeriod: [21, 26] },
            trainCandles: 40,
            testCandles: 15,
            stepCandles: 15,
            walkForwardMethod: 'ROLLING'
        });
        // 6. Stress Test
        const stressReport = await stressTest_service_1.stressTestService.runStressTest(strategy, asset, timeframe, undefined, candleCount, userId);
        // 7. Monte Carlo on in-sample trades
        const mcResult = await monteCarlo_service_1.monteCarloService.runSimulation({
            trades: inSampleBt.trades,
            iterations: 200,
            initialBalance: 10000
        });
        // Executive summary & conclusion
        const isWfeHealthy = wfRun.overallWfe >= 40;
        const isCostResilient = !stressReport.costSensitivityDetected;
        const isParamStable = !paramSensitivity.sensitivityDetected;
        const executiveSummary = `Historical evaluation of strategy ${strategy} on ${asset} (${timeframe}) across ${cleanedCandles.length} candles. Dataset SHA-256: ${datasetValReport.sha256Checksum.substring(0, 12)}...`;
        let evidenceBasedConclusion;
        if (isWfeHealthy && isCostResilient && isParamStable) {
            evidenceBasedConclusion =
                'Strategy demonstrates consistent statistical stability across walk-forward windows and retains profitability under moderate simulated execution friction. Parameter plateau exhibits low overfitting risk.';
        }
        else if (isCostResilient) {
            evidenceBasedConclusion =
                'Strategy exhibits moderate empirical resilience, but shows parameter sensitivity or degradation in forward windows. Further out-of-sample data is recommended prior to extensive paper testing.';
        }
        else {
            evidenceBasedConclusion =
                'Strategy shows significant sensitivity to simulated transaction costs or parameter variations. Risk of historical curve-fitting is elevated; strategy is fragile under stress conditions.';
        }
        return {
            reportId: `rep_${(0, crypto_1.randomUUID)().replace(/-/g, '').substring(0, 16)}`,
            generatedAt: new Date().toISOString(),
            strategy,
            asset,
            timeframe,
            datasetValidation: datasetValReport,
            inSampleMetrics: inSampleBt.advancedMetrics,
            outOfSampleMetrics: outSampleBt.advancedMetrics,
            parameterSensitivity: paramSensitivity,
            walkForwardMetrics: {
                method: wfRun.walkForwardMethod || 'ROLLING',
                windowsCount: wfRun.windowsCount,
                wfeScore: wfRun.overallWfe,
                cumulativeOosPnl: wfRun.cumulativeOosPnl
            },
            stressTestReport: stressReport,
            monteCarloSummary: {
                medianBalance: mcResult.finalBalanceDistribution.median,
                p5Balance: mcResult.finalBalanceDistribution.p5,
                worstCaseDrawdown: mcResult.worstCaseDrawdown,
                ruinProbabilityPercent: mcResult.ruinProbabilityPercent
            },
            executiveSummary,
            evidenceBasedConclusion,
            disclaimer: REPORT_DISCLAIMER,
            mode: 'PAPER',
            isRealMoney: false,
            brokerConnected: false
        };
    }
}
exports.ReportingService = ReportingService;
exports.reportingService = new ReportingService();
