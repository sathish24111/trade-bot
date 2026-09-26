"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runResearchBacktest = runResearchBacktest;
exports.runOptimization = runOptimization;
exports.getOptimizationRun = getOptimizationRun;
exports.runWalkForward = runWalkForward;
exports.getWalkForwardRun = getWalkForwardRun;
exports.runOosTest = runOosTest;
exports.runMonteCarlo = runMonteCarlo;
exports.compareResearchStrategies = compareResearchStrategies;
exports.getMarketRegimes = getMarketRegimes;
exports.getRiskProfiles = getRiskProfiles;
exports.calculatePositionSize = calculatePositionSize;
exports.uploadDataset = uploadDataset;
exports.listDatasets = listDatasets;
exports.getDatasetById = getDatasetById;
exports.runCrossAssetValidation = runCrossAssetValidation;
exports.runCrossTimeframeValidation = runCrossTimeframeValidation;
exports.runSensitivityHeatmap = runSensitivityHeatmap;
exports.runStressTest = runStressTest;
exports.createPortfolio = createPortfolio;
exports.listPortfolios = listPortfolios;
exports.simulatePortfolio = simulatePortfolio;
exports.createExperiment = createExperiment;
exports.listExperiments = listExperiments;
exports.updateExperimentStatus = updateExperimentStatus;
exports.logExperimentTrade = logExperimentTrade;
exports.compareExperiment = compareExperiment;
exports.getExperimentTimeline = getExperimentTimeline;
exports.generateResearchReport = generateResearchReport;
exports.exportDataCsv = exportDataCsv;
exports.listResearchStrategies = listResearchStrategies;
exports.getResearchStrategy = getResearchStrategy;
exports.getEnsemble = getEnsemble;
exports.createOrUpdateEnsemble = createOrUpdateEnsemble;
exports.getStrategyCorrelation = getStrategyCorrelation;
exports.getRiskAttribution = getRiskAttribution;
exports.getParameterStability = getParameterStability;
exports.cloneExperiment = cloneExperiment;
exports.addExperimentTags = addExperimentTags;
exports.getReplay = getReplay;
exports.getTradeDiagnostics = getTradeDiagnostics;
exports.getPerformanceStages = getPerformanceStages;
exports.submitResearchJob = submitResearchJob;
exports.listResearchJobs = listResearchJobs;
exports.getResearchJobStatus = getResearchJobStatus;
exports.pauseResearchJob = pauseResearchJob;
exports.resumeResearchJob = resumeResearchJob;
exports.cancelResearchJob = cancelResearchJob;
exports.executeNextResearchJob = executeNextResearchJob;
exports.createResearchSchedule = createResearchSchedule;
exports.listResearchSchedules = listResearchSchedules;
exports.toggleResearchSchedule = toggleResearchSchedule;
exports.getDriftTrends = getDriftTrends;
exports.getResearchRecommendations = getResearchRecommendations;
exports.generateRecommendationsForStrategy = generateRecommendationsForStrategy;
exports.dismissRecommendation = dismissRecommendation;
exports.getStrategyEvidenceMatrix = getStrategyEvidenceMatrix;
exports.compareExperimentConfigs = compareExperimentConfigs;
exports.getExperimentLineage = getExperimentLineage;
exports.inspectPaperWatchdog = inspectPaperWatchdog;
exports.getWatchdogEvents = getWatchdogEvents;
exports.resumeWatchdogStrategy = resumeWatchdogStrategy;
exports.triggerAnomalyInvestigation = triggerAnomalyInvestigation;
exports.getAnomalyInvestigations = getAnomalyInvestigations;
exports.runStressMatrix = runStressMatrix;
exports.getLatestStressMatrix = getLatestStressMatrix;
exports.runPortfolioWhatIf = runPortfolioWhatIf;
exports.getPortfolioWhatIfRuns = getPortfolioWhatIfRuns;
exports.recordRegimeTransition = recordRegimeTransition;
exports.getRegimeTransitions = getRegimeTransitions;
exports.generateDailyResearchReport = generateDailyResearchReport;
exports.generateWeeklyResearchReport = generateWeeklyResearchReport;
exports.listDailyResearchReports = listDailyResearchReports;
exports.listWeeklyResearchReports = listWeeklyResearchReports;
exports.evaluateStrategyV2Signal = evaluateStrategyV2Signal;
exports.compareStrategyV1VsV2 = compareStrategyV1VsV2;
exports.validateStrategyV2Oos = validateStrategyV2Oos;
exports.getStrategyV2Journal = getStrategyV2Journal;
exports.getStrategyV2LossAnalysis = getStrategyV2LossAnalysis;
exports.getStrategyV2LossClusters = getStrategyV2LossClusters;
exports.getStrategyV2DiagnosticAlerts = getStrategyV2DiagnosticAlerts;
exports.getStrategyV2ValidationReport = getStrategyV2ValidationReport;
exports.collectDemoTrades = collectDemoTrades;
exports.getStrategyV2_1LabDashboard = getStrategyV2_1LabDashboard;
exports.getStrategyV2_1ExperimentMatrix = getStrategyV2_1ExperimentMatrix;
exports.getStrategyV2_1DurationExperiment = getStrategyV2_1DurationExperiment;
exports.getStrategyV2_1RangingExperiment = getStrategyV2_1RangingExperiment;
exports.getStrategyV2_1ThresholdExperiment = getStrategyV2_1ThresholdExperiment;
exports.getStrategyV2_1OosValidation = getStrategyV2_1OosValidation;
exports.evaluateStrategyV2_1Signal = evaluateStrategyV2_1Signal;
exports.getStrategyV2_2FreshDashboard = getStrategyV2_2FreshDashboard;
exports.getStrategyV2_2ExperimentMatrix = getStrategyV2_2ExperimentMatrix;
exports.getStrategyV2_2Breakdowns = getStrategyV2_2Breakdowns;
exports.getStrategyV2_2ConfidenceIntervals = getStrategyV2_2ConfidenceIntervals;
exports.getStrategyV2_2OosValidation = getStrategyV2_2OosValidation;
exports.collectFreshDatasetV2_2 = collectFreshDatasetV2_2;
exports.getStrategyV2_3MultiSessionDashboard = getStrategyV2_3MultiSessionDashboard;
exports.getStrategyV2_3SessionsList = getStrategyV2_3SessionsList;
exports.getStrategyV2_3HypothesesSummary = getStrategyV2_3HypothesesSummary;
exports.getStrategyV2_3CrossAsset = getStrategyV2_3CrossAsset;
exports.getStrategyV2_3CrossRegime = getStrategyV2_3CrossRegime;
exports.getStrategyV2_3OosValidation = getStrategyV2_3OosValidation;
exports.getStrategyV2_3PromotionGate = getStrategyV2_3PromotionGate;
exports.collectMultiSessionDatasetV2_3 = collectMultiSessionDatasetV2_3;
exports.getStrategyV2_4CombinationDashboard = getStrategyV2_4CombinationDashboard;
exports.getStrategyV2_4Variants = getStrategyV2_4Variants;
exports.getStrategyV2_4Ablation = getStrategyV2_4Ablation;
exports.getStrategyV2_4OosValidation = getStrategyV2_4OosValidation;
exports.getStrategyV2_4PromotionGate = getStrategyV2_4PromotionGate;
exports.collectCombinationDatasetV2_4 = collectCombinationDatasetV2_4;
const backtesting_service_1 = require("../services/backtesting.service");
const optimization_service_1 = require("../services/research/optimization.service");
const walkForward_service_1 = require("../services/research/walkForward.service");
const monteCarlo_service_1 = require("../services/research/monteCarlo.service");
const regime_service_1 = require("../services/research/regime.service");
const positionSizing_service_1 = require("../services/research/positionSizing.service");
const market_service_1 = require("../services/market.service");
const dataset_service_1 = require("../services/research/dataset.service");
const multiTimeframe_service_1 = require("../services/research/multiTimeframe.service");
const stressTest_service_1 = require("../services/research/stressTest.service");
const portfolio_service_1 = require("../services/research/portfolio.service");
const experiment_service_1 = require("../services/research/experiment.service");
const reporting_service_1 = require("../services/research/reporting.service");
const database_1 = require("../config/database");
const SAFETY_METADATA = {
    mode: 'PAPER',
    isRealMoney: false,
    brokerConnected: false,
    historical: true,
    isPrediction: false
};
/**
 * Enhanced Backtest with advanced risk metrics, regime breakdown, and monthly performance.
 */
async function runResearchBacktest(req, res) {
    try {
        const userId = req.user.userId;
        const { asset, timeframe = '5m', strategy, candles, initialBalance = 10000, tradeAmount = 100, parameters, spread, slippage, fee } = req.body;
        if (!asset || !strategy) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters: asset and strategy are required.'
            });
        }
        const result = await backtesting_service_1.backtestingService.runBacktest({
            userId,
            asset,
            timeframe,
            strategy,
            candles,
            initialBalance: parseFloat(initialBalance),
            tradeAmount: parseFloat(tradeAmount),
            parameters,
            spread: spread !== undefined ? parseFloat(spread) : undefined,
            slippage: slippage !== undefined ? parseFloat(slippage) : undefined,
            fee: fee !== undefined ? parseFloat(fee) : undefined
        });
        res.json({
            success: true,
            ...SAFETY_METADATA,
            result
        });
    }
    catch (err) {
        res.status(400).json({
            success: false,
            error: err.message || 'Research backtest execution failed.'
        });
    }
}
/**
 * Grid-Search Parameter Optimization with Train / Validation / Test split.
 */
async function runOptimization(req, res) {
    try {
        const userId = req.user.userId;
        const { asset, timeframe = '5m', strategy, parameterRanges = {}, trainSplitRatio = 0.70, valSplitRatio = 0.15, testSplitRatio = 0.15, initialBalance = 10000, tradeAmount = 100 } = req.body;
        if (!asset || !strategy) {
            return res.status(400).json({
                success: false,
                error: 'Asset and strategy parameters are required.'
            });
        }
        const result = await optimization_service_1.optimizationService.runOptimization({
            userId,
            asset,
            timeframe,
            strategy,
            parameterRanges,
            trainSplitRatio: parseFloat(trainSplitRatio),
            valSplitRatio: parseFloat(valSplitRatio),
            testSplitRatio: parseFloat(testSplitRatio),
            initialBalance: parseFloat(initialBalance),
            tradeAmount: parseFloat(tradeAmount)
        });
        res.json({
            success: true,
            ...SAFETY_METADATA,
            result
        });
    }
    catch (err) {
        res.status(400).json({
            success: false,
            error: err.message || 'Optimization execution failed.'
        });
    }
}
/**
 * Retrieve stored optimization run by ID.
 */
async function getOptimizationRun(req, res) {
    try {
        const { id } = req.params;
        const [runs] = await database_1.pool.query('SELECT * FROM optimization_runs WHERE id = ?', [id]);
        if (!runs || runs.length === 0) {
            return res.status(404).json({ success: false, error: 'Optimization run not found' });
        }
        const [results] = await database_1.pool.query('SELECT * FROM optimization_results WHERE run_id = ? ORDER BY total_pnl DESC', [id]);
        res.json({
            success: true,
            ...SAFETY_METADATA,
            run: runs[0],
            results
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
/**
 * Walk-Forward Analysis over rolling windows.
 */
async function runWalkForward(req, res) {
    try {
        const userId = req.user.userId;
        const { asset, timeframe = '5m', strategy, parameterRanges = {}, trainCandles = 50, testCandles = 20, stepCandles = 20, initialBalance = 10000, tradeAmount = 100, walkForwardMethod, minWindowsRequired } = req.body;
        if (!asset || !strategy) {
            return res.status(400).json({
                success: false,
                error: 'Asset and strategy are required for walk-forward analysis.'
            });
        }
        const result = await walkForward_service_1.walkForwardService.runWalkForward({
            userId,
            asset,
            timeframe,
            strategy,
            parameterRanges,
            trainCandles: parseInt(trainCandles, 10),
            testCandles: parseInt(testCandles, 10),
            stepCandles: parseInt(stepCandles, 10),
            initialBalance: parseFloat(initialBalance),
            tradeAmount: parseFloat(tradeAmount),
            walkForwardMethod,
            minWindowsRequired: minWindowsRequired !== undefined ? parseInt(minWindowsRequired, 10) : undefined
        });
        res.json({
            success: true,
            ...SAFETY_METADATA,
            result
        });
    }
    catch (err) {
        res.status(400).json({
            success: false,
            error: err.message || 'Walk-forward analysis failed.'
        });
    }
}
/**
 * Retrieve stored walk-forward run by ID.
 */
async function getWalkForwardRun(req, res) {
    try {
        const { id } = req.params;
        const [runs] = await database_1.pool.query('SELECT * FROM walk_forward_runs WHERE id = ?', [id]);
        if (!runs || runs.length === 0) {
            return res.status(404).json({ success: false, error: 'Walk-forward run not found' });
        }
        const [windows] = await database_1.pool.query('SELECT * FROM walk_forward_results WHERE run_id = ? ORDER BY window_index ASC', [id]);
        res.json({
            success: true,
            ...SAFETY_METADATA,
            run: runs[0],
            windows
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
/**
 * Dedicated Out-Of-Sample (OOS) Test.
 */
async function runOosTest(req, res) {
    try {
        const userId = req.user.userId;
        const { asset, timeframe = '5m', strategy, parameters, splitRatio = 0.70, initialBalance = 10000, tradeAmount = 100 } = req.body;
        if (!asset || !strategy) {
            return res.status(400).json({ success: false, error: 'Asset and strategy are required.' });
        }
        let candles = await market_service_1.marketService.getCandles(asset, timeframe, 150);
        candles = backtesting_service_1.backtestingService.validateAndCleanCandles(candles);
        const splitIdx = Math.floor(candles.length * parseFloat(splitRatio));
        const inSampleCandles = candles.slice(0, splitIdx);
        const outSampleCandles = candles.slice(splitIdx);
        const isResult = await backtesting_service_1.backtestingService.runBacktest({
            userId,
            asset,
            timeframe,
            strategy,
            candles: inSampleCandles,
            initialBalance: parseFloat(initialBalance),
            tradeAmount: parseFloat(tradeAmount),
            parameters
        }, false);
        const oosResult = await backtesting_service_1.backtestingService.runBacktest({
            userId,
            asset,
            timeframe,
            strategy,
            candles: outSampleCandles,
            initialBalance: parseFloat(initialBalance),
            tradeAmount: parseFloat(tradeAmount),
            parameters
        }, false);
        const degradation = isResult.totalPnlPercent !== 0
            ? ((oosResult.totalPnlPercent - isResult.totalPnlPercent) / Math.abs(isResult.totalPnlPercent)) * 100
            : 0;
        res.json({
            success: true,
            ...SAFETY_METADATA,
            inSample: isResult,
            outOfSample: oosResult,
            degradationPercent: Number(degradation.toFixed(2)),
            disclaimer: 'Out-of-sample testing measures performance on unseen historical data. It does not predict future market outcomes.'
        });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message || 'OOS test failed.' });
    }
}
/**
 * Monte Carlo Trade-Sequence Resampling.
 */
async function runMonteCarlo(req, res) {
    try {
        const userId = req.user.userId;
        const { trades, iterations = 500, initialBalance = 10000, strategy, seed } = req.body;
        if (!trades || !Array.isArray(trades) || trades.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'A non-empty list of historical trades is required for Monte Carlo simulation.'
            });
        }
        const result = await monteCarlo_service_1.monteCarloService.runSimulation({
            trades,
            iterations: parseInt(iterations, 10),
            initialBalance: parseFloat(initialBalance),
            seed: seed !== undefined ? parseInt(seed, 10) : undefined
        }, userId, strategy);
        res.json({
            success: true,
            ...SAFETY_METADATA,
            result
        });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message || 'Monte Carlo simulation failed.' });
    }
}
/**
 * Advanced Multi-Strategy Comparison.
 */
async function compareResearchStrategies(req, res) {
    try {
        const userId = req.user.userId;
        const { asset, timeframe = '5m', count = 120, initialBalance = 10000 } = req.query;
        if (!asset) {
            return res.status(400).json({ success: false, error: 'Asset query parameter is required.' });
        }
        const strategies = ['EMA_RSI', 'MACD', 'BOLLINGER_BANDS', 'MULTI_INDICATOR'];
        const comparisons = [];
        for (const strat of strategies) {
            try {
                const bResult = await backtesting_service_1.backtestingService.runBacktest({
                    userId,
                    asset,
                    timeframe,
                    strategy: strat,
                    initialBalance: parseFloat(initialBalance)
                }, false);
                comparisons.push({
                    strategy: strat,
                    initialBalance: bResult.initialBalance,
                    finalBalance: bResult.finalBalance,
                    totalPnl: bResult.totalPnl,
                    totalPnlPercent: bResult.totalPnlPercent,
                    totalTrades: bResult.totalTrades,
                    winRate: bResult.winRate,
                    profitFactor: bResult.profitFactor,
                    maxDrawdown: bResult.maxDrawdown,
                    sharpeRatio: bResult.advancedMetrics?.sharpeRatio ?? null,
                    sortinoRatio: bResult.advancedMetrics?.sortinoRatio ?? null,
                    calmarRatio: bResult.advancedMetrics?.calmarRatio ?? null,
                    sampleSizeRating: bResult.advancedMetrics?.sampleSizeRating ?? 'ADEQUATE',
                    sampleSizeWarning: bResult.advancedMetrics?.sampleSizeWarning
                });
            }
            catch (e) {
                console.error(`Comparison error for ${strat}:`, e.message);
            }
        }
        res.json({
            success: true,
            ...SAFETY_METADATA,
            asset,
            timeframe,
            comparisons,
            disclaimer: 'Comparative metrics are simulated paper trades across historical data. No strategy guarantees profit.'
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
/**
 * Market Regime classification across historical candles.
 */
async function getMarketRegimes(req, res) {
    try {
        const { asset = 'EUR/USD', timeframe = '5m', count = '100' } = req.query;
        let candles = await market_service_1.marketService.getCandles(asset, timeframe, parseInt(count, 10));
        candles = backtesting_service_1.backtestingService.validateAndCleanCandles(candles);
        const regimes = [];
        for (let i = 20; i < candles.length; i++) {
            regimes.push(regime_service_1.regimeService.classifyRegime(candles, i));
        }
        res.json({
            success: true,
            ...SAFETY_METADATA,
            asset,
            timeframe,
            totalCandles: candles.length,
            currentRegime: regimes[regimes.length - 1],
            history: regimes
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
/**
 * Get Supported Risk Profiles.
 */
async function getRiskProfiles(req, res) {
    try {
        const profiles = positionSizing_service_1.positionSizingService.getRiskProfiles();
        res.json({
            success: true,
            ...SAFETY_METADATA,
            profiles
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
/**
 * Calculate Position Sizing for paper trading.
 */
async function calculatePositionSize(req, res) {
    try {
        const { profile = 'BALANCED', accountBalance = 10000, entryPrice, stopLossPrice } = req.body;
        if (!entryPrice || !stopLossPrice) {
            return res.status(400).json({
                success: false,
                error: 'entryPrice and stopLossPrice are required.'
            });
        }
        const calculation = positionSizing_service_1.positionSizingService.calculatePositionSize(profile, parseFloat(accountBalance), parseFloat(entryPrice), parseFloat(stopLossPrice));
        res.json({
            success: true,
            ...SAFETY_METADATA,
            calculation
        });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
// ==========================================
// PHASE 5: DATASET MANAGEMENT & VALIDATION
// ==========================================
async function uploadDataset(req, res) {
    try {
        const { name, asset, timeframe = '5m', candles = [] } = req.body;
        if (!name || !asset) {
            return res.status(400).json({ success: false, error: 'name and asset are required.' });
        }
        const result = await dataset_service_1.datasetService.registerDataset(name, asset, timeframe, candles);
        res.json({
            success: true,
            ...SAFETY_METADATA,
            metadata: result.metadata,
            validationReport: result.validationReport
        });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
async function listDatasets(req, res) {
    try {
        const { asset, timeframe } = req.query;
        const datasets = await dataset_service_1.datasetService.listDatasets(asset, timeframe);
        res.json({
            success: true,
            ...SAFETY_METADATA,
            datasets
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getDatasetById(req, res) {
    try {
        const { id } = req.params;
        const dataset = await dataset_service_1.datasetService.getDataset(id);
        if (!dataset) {
            return res.status(404).json({ success: false, error: 'Dataset not found.' });
        }
        res.json({
            success: true,
            ...SAFETY_METADATA,
            dataset
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
// ==========================================
// PHASE 5: MULTI-ASSET & TIMEFRAME VALIDATION
// ==========================================
async function runCrossAssetValidation(req, res) {
    try {
        const { strategy, assets = ['BTC/USD', 'ETH/USD', 'EUR/USD'], timeframe = '5m', parameters, candleCount = 100 } = req.body;
        if (!strategy) {
            return res.status(400).json({ success: false, error: 'strategy is required.' });
        }
        const result = await multiTimeframe_service_1.multiTimeframeService.runCrossAssetValidation(strategy, assets, timeframe, parameters, parseInt(candleCount));
        res.json({
            success: true,
            ...SAFETY_METADATA,
            result
        });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
async function runCrossTimeframeValidation(req, res) {
    try {
        const { strategy, asset = 'BTC/USD', timeframes = ['1m', '5m', '15m', '1h'], parameters, candleCount = 100 } = req.body;
        if (!strategy) {
            return res.status(400).json({ success: false, error: 'strategy is required.' });
        }
        const result = await multiTimeframe_service_1.multiTimeframeService.runCrossTimeframeValidation(strategy, asset, timeframes, parameters, parseInt(candleCount));
        res.json({
            success: true,
            ...SAFETY_METADATA,
            result
        });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
// ==========================================
// PHASE 5: PARAMETER SENSITIVITY & HEATMAP
// ==========================================
async function runSensitivityHeatmap(req, res) {
    try {
        const userId = req.user.userId;
        const { strategy, asset = 'BTC/USD', timeframe = '5m', param1Name, param1Range, param2Name, param2Range, baseParameters, candleCount = 100 } = req.body;
        if (!strategy || !param1Name || !param1Range || !param2Name || !param2Range) {
            return res.status(400).json({
                success: false,
                error: 'strategy, param1Name, param1Range, param2Name, and param2Range are required.'
            });
        }
        const result = await optimization_service_1.optimizationService.generateSensitivityHeatmap({
            userId,
            strategy,
            asset,
            timeframe,
            param1Name,
            param1Range,
            param2Name,
            param2Range,
            baseParameters,
            candleCount: parseInt(candleCount)
        });
        res.json({
            success: true,
            ...SAFETY_METADATA,
            result
        });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
// ==========================================
// PHASE 5: STRESS TESTING
// ==========================================
async function runStressTest(req, res) {
    try {
        const userId = req.user.userId;
        const { strategy, asset = 'BTC/USD', timeframe = '5m', parameters, candleCount = 100 } = req.body;
        if (!strategy) {
            return res.status(400).json({ success: false, error: 'strategy is required.' });
        }
        const report = await stressTest_service_1.stressTestService.runStressTest(strategy, asset, timeframe, parameters, parseInt(candleCount), userId);
        res.json({
            success: true,
            ...SAFETY_METADATA,
            report
        });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
// ==========================================
// PHASE 5: PORTFOLIO PAPER SIMULATION
// ==========================================
async function createPortfolio(req, res) {
    try {
        const userId = req.user.userId;
        const { name, initialCapital, allocations, maxPortfolioDrawdownPercent } = req.body;
        if (!name || !initialCapital || !allocations) {
            return res.status(400).json({ success: false, error: 'name, initialCapital, and allocations are required.' });
        }
        const portfolio = await portfolio_service_1.portfolioService.createPortfolio({
            userId,
            name,
            initialCapital: parseFloat(initialCapital),
            allocations,
            maxPortfolioDrawdownPercent: maxPortfolioDrawdownPercent ? parseFloat(maxPortfolioDrawdownPercent) : undefined
        });
        res.json({
            success: true,
            ...SAFETY_METADATA,
            portfolio
        });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
async function listPortfolios(req, res) {
    try {
        const userId = req.user.userId;
        const portfolios = await portfolio_service_1.portfolioService.listPortfolios(userId);
        res.json({
            success: true,
            ...SAFETY_METADATA,
            portfolios
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function simulatePortfolio(req, res) {
    try {
        const { portfolioId } = req.params;
        const { timeframe = '5m', candleCount } = req.query;
        const count = candleCount ? parseInt(candleCount, 10) : 100;
        const simulation = await portfolio_service_1.portfolioService.simulatePortfolio(portfolioId, timeframe, count);
        res.json({
            success: true,
            ...SAFETY_METADATA,
            simulation
        });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
// ==========================================
// PHASE 5: PAPER EXPERIMENTS & JOURNAL
// ==========================================
async function createExperiment(req, res) {
    try {
        const userId = req.user.userId;
        const { name, strategy, asset = 'BTC/USD', timeframe = '5m', parameters, startBalance = 10000 } = req.body;
        if (!name || !strategy) {
            return res.status(400).json({ success: false, error: 'name and strategy are required.' });
        }
        const experiment = await experiment_service_1.experimentService.createExperiment({
            userId,
            name,
            strategy,
            asset,
            timeframe,
            parameters,
            startBalance: parseFloat(startBalance)
        });
        res.json({
            success: true,
            ...SAFETY_METADATA,
            experiment
        });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
async function listExperiments(req, res) {
    try {
        const userId = req.user.userId;
        const experiments = await experiment_service_1.experimentService.listExperiments(userId);
        res.json({
            success: true,
            ...SAFETY_METADATA,
            experiments
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function updateExperimentStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ success: false, error: 'status is required.' });
        }
        const experiment = await experiment_service_1.experimentService.updateStatus(id, status);
        res.json({
            success: true,
            ...SAFETY_METADATA,
            experiment
        });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
async function logExperimentTrade(req, res) {
    try {
        const { id } = req.params;
        const { direction, entryPrice, exitPrice, amount, slippage, fees, journalNotes, entryTime, exitTime } = req.body;
        if (!direction || !entryPrice || !exitPrice || !amount) {
            return res.status(400).json({ success: false, error: 'direction, entryPrice, exitPrice, and amount are required.' });
        }
        const trade = await experiment_service_1.experimentService.logTrade({
            experimentId: id,
            direction,
            entryPrice: parseFloat(entryPrice),
            exitPrice: parseFloat(exitPrice),
            amount: parseFloat(amount),
            slippage: slippage ? parseFloat(slippage) : undefined,
            fees: fees ? parseFloat(fees) : undefined,
            journalNotes,
            entryTime,
            exitTime
        });
        res.json({
            success: true,
            ...SAFETY_METADATA,
            trade
        });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
async function compareExperiment(req, res) {
    try {
        const { id } = req.params;
        const comparison = await experiment_service_1.experimentService.compareBacktestVsPaper(id);
        res.json({
            success: true,
            ...SAFETY_METADATA,
            comparison
        });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
async function getExperimentTimeline(req, res) {
    try {
        const { id } = req.params;
        const { experimentTimelineService } = await Promise.resolve().then(() => __importStar(require('../services/research/experimentTimeline.service')));
        const timeline = await experimentTimelineService.getTimeline(id);
        res.json({
            success: true,
            ...SAFETY_METADATA,
            experimentId: id,
            timeline,
            totalEvents: timeline.length
        });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
// ==========================================
// PHASE 5: RESEARCH REPORTS & EXPORTS
// ==========================================
async function generateResearchReport(req, res) {
    try {
        const userId = req.user.userId;
        const { strategy, asset = 'BTC/USD', timeframe = '5m', candleCount = 100 } = req.body;
        if (!strategy) {
            return res.status(400).json({ success: false, error: 'strategy is required.' });
        }
        const report = await reporting_service_1.reportingService.generateComprehensiveReport({
            strategy,
            asset,
            timeframe,
            candleCount: parseInt(candleCount),
            userId
        });
        res.json({
            success: true,
            ...SAFETY_METADATA,
            report
        });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
async function exportDataCsv(req, res) {
    try {
        const { rows = [], filename = 'tradepilot_research_export.csv' } = req.body;
        const csvContent = reporting_service_1.reportingService.exportToCsv(rows);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csvContent);
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
// ==========================================
// PHASE 8: ADVANCED RESEARCH LAB & CONTROL
// ==========================================
async function listResearchStrategies(req, res) {
    try {
        const { strategyEngine } = await Promise.resolve().then(() => __importStar(require('../services/strategy.service')));
        const { experimentLabService } = await Promise.resolve().then(() => __importStar(require('../services/research/experimentLab.service')));
        const strats = strategyEngine.getAllStrategies();
        const result = strats.map(s => {
            const configHash = experimentLabService.generateConfigHash({
                strategyId: s.id,
                parameters: s.defaultParameters
            });
            return {
                strategyId: s.id,
                name: s.name,
                version: '1.0.0',
                description: s.description,
                enabled: true,
                parameters: s.defaultParameters,
                parameterDefinitions: s.parameterDefinitions,
                configHash,
                indicatorDependencies: s.id === 'EMA_RSI' ? ['EMA', 'RSI'] : s.id === 'MACD' ? ['MACD'] : s.id === 'BOLLINGER_BANDS' ? ['BollingerBands'] : ['EMA', 'RSI', 'MACD'],
                riskConfiguration: { riskPerTrade: 0.01, maxDailyLossPct: 0.05 },
                mode: 'PAPER'
            };
        });
        res.json({
            success: true,
            ...SAFETY_METADATA,
            strategies: result,
            total: result.length
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getResearchStrategy(req, res) {
    try {
        const { strategyEngine } = await Promise.resolve().then(() => __importStar(require('../services/strategy.service')));
        const { experimentLabService } = await Promise.resolve().then(() => __importStar(require('../services/research/experimentLab.service')));
        const s = strategyEngine.getStrategy(req.params.id);
        const configHash = experimentLabService.generateConfigHash({
            strategyId: s.id,
            parameters: s.defaultParameters
        });
        res.json({
            success: true,
            ...SAFETY_METADATA,
            strategy: {
                strategyId: s.id,
                name: s.name,
                version: '1.0.0',
                description: s.description,
                enabled: true,
                parameters: s.defaultParameters,
                parameterDefinitions: s.parameterDefinitions,
                configHash,
                indicatorDependencies: ['EMA', 'RSI'],
                riskConfiguration: { riskPerTrade: 0.01, maxDailyLossPct: 0.05 }
            }
        });
    }
    catch (err) {
        res.status(404).json({ success: false, error: err.message });
    }
}
async function getEnsemble(req, res) {
    try {
        const { strategyEnsembleService } = await Promise.resolve().then(() => __importStar(require('../services/research/strategyEnsemble.service')));
        const config = await strategyEnsembleService.getEnsembleConfig();
        const conflicts = await strategyEnsembleService.getConflicts();
        res.json({
            success: true,
            ...SAFETY_METADATA,
            ensemble: config,
            recentConflicts: conflicts
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function createOrUpdateEnsemble(req, res) {
    try {
        const { strategyEnsembleService } = await Promise.resolve().then(() => __importStar(require('../services/research/strategyEnsemble.service')));
        const saved = await strategyEnsembleService.saveEnsembleConfig(req.body);
        res.status(201).json({
            success: true,
            ...SAFETY_METADATA,
            ensemble: saved
        });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
async function getStrategyCorrelation(req, res) {
    try {
        const { strategyCorrelationService } = await Promise.resolve().then(() => __importStar(require('../services/research/strategyCorrelation.service')));
        const asset = req.query.asset || 'BTC/USD';
        const timeframe = req.query.timeframe || '5m';
        const correlationMatrix = await strategyCorrelationService.calculateStrategyCorrelationMatrix({
            asset,
            timeframe
        });
        const regimeCorrelations = strategyCorrelationService.calculateRegimeCorrelations();
        res.json({
            success: true,
            ...SAFETY_METADATA,
            correlationMatrix,
            regimeCorrelations
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getRiskAttribution(req, res) {
    try {
        const { riskAttributionService } = await Promise.resolve().then(() => __importStar(require('../services/research/riskAttribution.service')));
        const defaultAllocations = [
            { strategyId: 'EMA_RSI', asset: 'BTC/USD', allocationPct: 0.40, targetCapital: 4000 },
            { strategyId: 'MACD', asset: 'ETH/USD', allocationPct: 0.35, targetCapital: 3500 },
            { strategyId: 'BOLLINGER_BANDS', asset: 'BTC/USD', allocationPct: 0.25, targetCapital: 2500 }
        ];
        const allocations = req.body?.allocations || defaultAllocations;
        const attribution = riskAttributionService.calculateRiskAttribution({ allocations });
        res.json({
            success: true,
            ...SAFETY_METADATA,
            attribution
        });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
async function getParameterStability(req, res) {
    try {
        const { parameterStabilityService } = await Promise.resolve().then(() => __importStar(require('../services/research/parameterStability.service')));
        const strategyId = req.query.strategyId || 'EMA_RSI';
        const parameterKey = req.query.parameterKey || 'emaPeriod';
        const baselineValue = req.query.baselineValue ? parseInt(req.query.baselineValue, 10) : 21;
        const stability = await parameterStabilityService.analyzeParameterStability({
            strategyId,
            parameterKey,
            baselineValue
        });
        res.json({
            success: true,
            ...SAFETY_METADATA,
            stability
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function cloneExperiment(req, res) {
    try {
        const { experimentLabService } = await Promise.resolve().then(() => __importStar(require('../services/research/experimentLab.service')));
        const cloned = await experimentLabService.cloneExperiment(req.params.id, req.body?.name);
        res.status(201).json({
            success: true,
            ...SAFETY_METADATA,
            clone: cloned
        });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
async function addExperimentTags(req, res) {
    try {
        const { experimentLabService } = await Promise.resolve().then(() => __importStar(require('../services/research/experimentLab.service')));
        const { tag, notes } = req.body;
        const tagged = await experimentLabService.addExperimentTag(req.params.id, tag || 'BASELINE', notes);
        res.json({
            success: true,
            ...SAFETY_METADATA,
            tagged
        });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
async function getReplay(req, res) {
    try {
        const { paperReplayService } = await Promise.resolve().then(() => __importStar(require('../services/research/paperReplay.service')));
        const action = req.query.action || 'init';
        const speed = req.query.speed ? parseInt(req.query.speed, 10) : 1;
        let state;
        if (action === 'init') {
            state = await paperReplayService.initReplay({
                experimentId: req.params.id,
                speed
            });
        }
        else if (action === 'step') {
            state = paperReplayService.stepNext(req.query.sessionId);
        }
        else if (action === 'prev') {
            state = paperReplayService.stepPrevious(req.query.sessionId);
        }
        else if (action === 'play') {
            state = paperReplayService.play(req.query.sessionId, speed);
        }
        else if (action === 'pause') {
            state = paperReplayService.pause(req.query.sessionId);
        }
        else if (action === 'reset') {
            state = paperReplayService.reset(req.query.sessionId);
        }
        else {
            state = paperReplayService.getState(req.query.sessionId);
        }
        res.json({
            success: true,
            ...SAFETY_METADATA,
            replay: state
        });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
async function getTradeDiagnostics(req, res) {
    try {
        const { tradeDiagnosticsService } = await Promise.resolve().then(() => __importStar(require('../services/research/tradeDiagnostics.service')));
        const diagnostic = await tradeDiagnosticsService.getTradeDiagnostic(req.params.tradeId);
        res.json({
            success: true,
            ...SAFETY_METADATA,
            diagnostic
        });
    }
    catch (err) {
        res.status(404).json({ success: false, error: err.message });
    }
}
async function getPerformanceStages(req, res) {
    try {
        const { paperResearchComparisonService } = await Promise.resolve().then(() => __importStar(require('../services/research/paperResearchComparison.service')));
        const comparison = await paperResearchComparisonService.getPerformanceStagesComparison(req.params.id);
        res.json({
            success: true,
            ...SAFETY_METADATA,
            comparison
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
// ==========================================
// ==========================================
// PHASE 9: AUTONOMOUS RESEARCH ORCHESTRATOR
// ==========================================
async function submitResearchJob(req, res) {
    try {
        const { researchOrchestratorService } = await Promise.resolve().then(() => __importStar(require('../services/research/researchOrchestrator.service')));
        const job = await researchOrchestratorService.createJob(req.body);
        res.json({ success: true, ...SAFETY_METADATA, job });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
async function listResearchJobs(req, res) {
    try {
        const { researchOrchestratorService } = await Promise.resolve().then(() => __importStar(require('../services/research/researchOrchestrator.service')));
        const jobs = await researchOrchestratorService.listJobs(req.query.status);
        res.json({ success: true, ...SAFETY_METADATA, jobs });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getResearchJobStatus(req, res) {
    try {
        const { researchOrchestratorService } = await Promise.resolve().then(() => __importStar(require('../services/research/researchOrchestrator.service')));
        const job = await researchOrchestratorService.getJob(req.params.id);
        if (!job)
            return res.status(404).json({ success: false, error: 'Job not found' });
        res.json({ success: true, ...SAFETY_METADATA, job });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function pauseResearchJob(req, res) {
    try {
        const { researchOrchestratorService } = await Promise.resolve().then(() => __importStar(require('../services/research/researchOrchestrator.service')));
        const job = await researchOrchestratorService.pauseJob(req.params.id);
        res.json({ success: true, ...SAFETY_METADATA, job });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
async function resumeResearchJob(req, res) {
    try {
        const { researchOrchestratorService } = await Promise.resolve().then(() => __importStar(require('../services/research/researchOrchestrator.service')));
        const job = await researchOrchestratorService.resumeJob(req.params.id);
        res.json({ success: true, ...SAFETY_METADATA, job });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
async function cancelResearchJob(req, res) {
    try {
        const { researchOrchestratorService } = await Promise.resolve().then(() => __importStar(require('../services/research/researchOrchestrator.service')));
        const job = await researchOrchestratorService.cancelJob(req.params.id, req.body.reason);
        res.json({ success: true, ...SAFETY_METADATA, job });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
async function executeNextResearchJob(req, res) {
    try {
        const { researchOrchestratorService } = await Promise.resolve().then(() => __importStar(require('../services/research/researchOrchestrator.service')));
        const job = await researchOrchestratorService.createJob({
            type: 'FULL_RESEARCH_PIPELINE',
            parameters: {
                strategy: req.body.strategyId || 'EMA_RSI',
                asset: req.body.asset || 'BTC/USD',
                timeframe: req.body.timeframe || '5m'
            }
        });
        const result = await researchOrchestratorService.runFullPipeline(job);
        res.json({ success: true, ...SAFETY_METADATA, pipelineResult: result });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
// Schedules
async function createResearchSchedule(req, res) {
    try {
        const { researchSchedulerService } = await Promise.resolve().then(() => __importStar(require('../services/research/researchScheduler.service')));
        const schedule = await researchSchedulerService.createSchedule(req.body);
        res.json({ success: true, ...SAFETY_METADATA, schedule });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
async function listResearchSchedules(req, res) {
    try {
        const { researchSchedulerService } = await Promise.resolve().then(() => __importStar(require('../services/research/researchScheduler.service')));
        const schedules = await researchSchedulerService.listSchedules();
        res.json({ success: true, ...SAFETY_METADATA, schedules });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function toggleResearchSchedule(req, res) {
    try {
        const { researchSchedulerService } = await Promise.resolve().then(() => __importStar(require('../services/research/researchScheduler.service')));
        const success = await researchSchedulerService.updateScheduleStatus(req.params.id, Boolean(req.body.enabled));
        res.json({ success, ...SAFETY_METADATA });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
// Drift Trends
async function getDriftTrends(req, res) {
    try {
        const { driftTrendService } = await Promise.resolve().then(() => __importStar(require('../services/research/driftTrend.service')));
        const analysis = driftTrendService.analyzeDriftTrend({
            strategyId: req.params.strategyId,
            asset: req.query.asset || 'BTC/USD',
            trades: req.body.trades || [{ pnl: 50 }, { pnl: -20 }, { pnl: 40 }, { pnl: 60 }, { pnl: 30 }, { pnl: -10 }, { pnl: 45 }]
        });
        res.json({ success: true, ...SAFETY_METADATA, analysis });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
// Research Recommendations
async function getResearchRecommendations(req, res) {
    try {
        const { researchRecommendationService } = await Promise.resolve().then(() => __importStar(require('../services/research/researchRecommendation.service')));
        const recommendations = await researchRecommendationService.listRecommendations(req.query.status);
        res.json({ success: true, ...SAFETY_METADATA, recommendations });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function generateRecommendationsForStrategy(req, res) {
    try {
        const { researchRecommendationService } = await Promise.resolve().then(() => __importStar(require('../services/research/researchRecommendation.service')));
        const rec = await researchRecommendationService.evaluateTrigger({
            trigger: req.body.trigger || 'SIGNIFICANT_DRIFT',
            reason: req.body.reason || `Automated research trigger evaluated for ${req.params.strategyId}`,
            evidence: req.body.evidence || 'Observed rolling window drift degradation',
            suggestedJob: req.body.suggestedJob || 'WALK_FORWARD',
            parameters: { strategy: req.params.strategyId }
        });
        res.json({ success: true, ...SAFETY_METADATA, generatedCount: 1, recommendations: [rec] });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function dismissRecommendation(req, res) {
    try {
        const { researchRecommendationService } = await Promise.resolve().then(() => __importStar(require('../services/research/researchRecommendation.service')));
        const success = await researchRecommendationService.dismissRecommendation(req.params.id);
        res.json({ success, ...SAFETY_METADATA });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
// Evidence Quality & Strategy Evidence Matrix
async function getStrategyEvidenceMatrix(req, res) {
    try {
        const { evidenceQualityService } = await Promise.resolve().then(() => __importStar(require('../services/research/evidenceQuality.service')));
        const matrix = await evidenceQualityService.getEvidenceMatrix();
        res.json({ success: true, ...SAFETY_METADATA, matrix });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
// Experiment Diff & Lineage
async function compareExperimentConfigs(req, res) {
    try {
        const { experimentDiffService } = await Promise.resolve().then(() => __importStar(require('../services/research/experimentDiff.service')));
        const diff = await experimentDiffService.diffExperiments(req.params.expA, req.params.expB);
        res.json({ success: true, ...SAFETY_METADATA, diff });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
async function getExperimentLineage(req, res) {
    try {
        const { experimentDiffService } = await Promise.resolve().then(() => __importStar(require('../services/research/experimentDiff.service')));
        const lineage = await experimentDiffService.getLineageTree(req.params.id);
        res.json({ success: true, ...SAFETY_METADATA, lineage });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
// Paper Watchdog
async function inspectPaperWatchdog(req, res) {
    try {
        const { paperExperimentWatchdogService } = await Promise.resolve().then(() => __importStar(require('../services/research/paperExperimentWatchdog.service')));
        const result = await paperExperimentWatchdogService.inspectExperiments();
        res.json({ success: true, ...SAFETY_METADATA, result });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getWatchdogEvents(req, res) {
    try {
        const { paperExperimentWatchdogService } = await Promise.resolve().then(() => __importStar(require('../services/research/paperExperimentWatchdog.service')));
        const events = await paperExperimentWatchdogService.getEvents(req.query.experimentId);
        res.json({ success: true, ...SAFETY_METADATA, events });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function resumeWatchdogStrategy(req, res) {
    try {
        const { paperExperimentWatchdogService } = await Promise.resolve().then(() => __importStar(require('../services/research/paperExperimentWatchdog.service')));
        const success = await paperExperimentWatchdogService.resumeExperiment(req.params.strategyId, req.body.justification || 'Manual controlled resumption from watchdog pause');
        res.json({ success, ...SAFETY_METADATA });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
// Anomaly Investigations
async function triggerAnomalyInvestigation(req, res) {
    try {
        const { anomalyInvestigationService } = await Promise.resolve().then(() => __importStar(require('../services/research/anomalyInvestigation.service')));
        const investigation = await anomalyInvestigationService.triggerInvestigation({
            anomalyId: req.body.anomalyId || `ANOM_${Date.now()}`,
            asset: req.body.asset || 'BTC/USD',
            strategyId: req.body.strategyId || 'EMA_RSI'
        });
        res.json({ success: true, ...SAFETY_METADATA, investigation });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
async function getAnomalyInvestigations(req, res) {
    try {
        const { anomalyInvestigationService } = await Promise.resolve().then(() => __importStar(require('../services/research/anomalyInvestigation.service')));
        const investigations = await anomalyInvestigationService.listInvestigations();
        res.json({ success: true, ...SAFETY_METADATA, investigations });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
// Stress Matrix
async function runStressMatrix(req, res) {
    try {
        const { stressMatrixService } = await Promise.resolve().then(() => __importStar(require('../services/research/stressMatrix.service')));
        const result = await stressMatrixService.computeStressMatrix({
            strategyId: req.body.strategyId || 'EMA_RSI',
            matrixType: req.body.matrixType || 'COST_X_SLIPPAGE'
        });
        res.json({ success: true, ...SAFETY_METADATA, result });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
async function getLatestStressMatrix(req, res) {
    try {
        const { stressMatrixService } = await Promise.resolve().then(() => __importStar(require('../services/research/stressMatrix.service')));
        const result = await stressMatrixService.getLatestMatrix(req.params.strategyId);
        res.json({ success: true, ...SAFETY_METADATA, result });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
// Portfolio What-If
async function runPortfolioWhatIf(req, res) {
    try {
        const { portfolioWhatIfService } = await Promise.resolve().then(() => __importStar(require('../services/research/portfolioWhatIf.service')));
        const result = await portfolioWhatIfService.simulateWhatIf({
            scenarioName: req.body.scenarioName || 'Custom Scenario',
            scenario: req.body.scenario || {}
        });
        res.json({ success: true, ...SAFETY_METADATA, result });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
async function getPortfolioWhatIfRuns(req, res) {
    try {
        const { portfolioWhatIfService } = await Promise.resolve().then(() => __importStar(require('../services/research/portfolioWhatIf.service')));
        const runs = await portfolioWhatIfService.listRuns();
        res.json({ success: true, ...SAFETY_METADATA, runs });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
// Regime Transitions
async function recordRegimeTransition(req, res) {
    try {
        const { regimeTransitionService } = await Promise.resolve().then(() => __importStar(require('../services/research/regimeTransition.service')));
        const event = await regimeTransitionService.recordTransition({
            asset: req.body.asset || 'BTC/USD',
            previousRegime: req.body.previousRegime || 'RANGING',
            newRegime: req.body.newRegime || 'TRENDING',
            confidenceScore: req.body.confidenceScore || 85.0,
            triggerIndicators: req.body.triggerIndicators || {},
            affectedStrategies: req.body.affectedStrategies || ['EMA_RSI']
        });
        res.json({ success: true, ...SAFETY_METADATA, event });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
async function getRegimeTransitions(req, res) {
    try {
        const { regimeTransitionService } = await Promise.resolve().then(() => __importStar(require('../services/research/regimeTransition.service')));
        const events = await regimeTransitionService.getRecentTransitions(req.query.asset);
        res.json({ success: true, ...SAFETY_METADATA, events });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
// Automated Reports
async function generateDailyResearchReport(req, res) {
    try {
        const { automatedReportService } = await Promise.resolve().then(() => __importStar(require('../services/research/automatedReport.service')));
        const report = await automatedReportService.generateDailyReport(req.body.reportDate);
        res.json({ success: true, ...SAFETY_METADATA, report });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function generateWeeklyResearchReport(req, res) {
    try {
        const { automatedReportService } = await Promise.resolve().then(() => __importStar(require('../services/research/automatedReport.service')));
        const report = await automatedReportService.generateWeeklyReport(req.body.weekStartDate);
        res.json({ success: true, ...SAFETY_METADATA, report });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function listDailyResearchReports(req, res) {
    try {
        const { automatedReportService } = await Promise.resolve().then(() => __importStar(require('../services/research/automatedReport.service')));
        const reports = await automatedReportService.getDailyReports();
        res.json({ success: true, ...SAFETY_METADATA, reports });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function listWeeklyResearchReports(req, res) {
    try {
        const { automatedReportService } = await Promise.resolve().then(() => __importStar(require('../services/research/automatedReport.service')));
        const reports = await automatedReportService.getWeeklyReports();
        res.json({ success: true, ...SAFETY_METADATA, reports });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
// ==========================================
// STRATEGY V2: QUALITY-FIRST ADAPTIVE ENGINE
// ==========================================
async function evaluateStrategyV2Signal(req, res) {
    try {
        const { strategyV2Service } = await Promise.resolve().then(() => __importStar(require('../services/strategy/strategyV2.service')));
        const { derivMarketProvider } = await Promise.resolve().then(() => __importStar(require('../services/market/derivMarket.provider')));
        const { marketService } = await Promise.resolve().then(() => __importStar(require('../services/market.service')));
        let candles = req.body.candles;
        const symbol = req.body.symbol || 'R_100';
        if (!candles || candles.length === 0) {
            candles = await derivMarketProvider.getCandles(symbol, '1m', 50);
            if (!candles || candles.length < 20) {
                candles = await marketService.getCandles(symbol, '1m', 50);
            }
        }
        const result = strategyV2Service.evaluateSignal(candles, req.body.indicators, req.body.parameters);
        res.json({
            success: true,
            ...SAFETY_METADATA,
            signalResult: result
        });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
async function compareStrategyV1VsV2(req, res) {
    try {
        const { strategyV2ComparisonService } = await Promise.resolve().then(() => __importStar(require('../services/research/strategyV2Comparison.service')));
        const userId = req.user?.userId || (req.query.userId ? Number(req.query.userId) : undefined);
        const symbol = req.query.symbol;
        const comparison = await strategyV2ComparisonService.compareV1VsV2(userId, symbol);
        res.json({
            success: true,
            ...SAFETY_METADATA,
            comparison
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function validateStrategyV2Oos(req, res) {
    try {
        const { outOfSampleValidationService } = await Promise.resolve().then(() => __importStar(require('../services/research/outOfSampleValidation.service')));
        const { derivMarketProvider } = await Promise.resolve().then(() => __importStar(require('../services/market/derivMarket.provider')));
        const { marketService } = await Promise.resolve().then(() => __importStar(require('../services/market.service')));
        let candles = req.body.candles;
        const symbol = req.body.symbol || 'R_100';
        if (!candles || candles.length < 50) {
            candles = await derivMarketProvider.getCandles(symbol, '1m', 300);
            if (!candles || candles.length < 50) {
                candles = await marketService.getCandles(symbol, '1m', 300);
            }
        }
        const report = outOfSampleValidationService.runValidation(candles, req.body.parameters);
        res.json({
            success: true,
            ...SAFETY_METADATA,
            report
        });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}
async function getStrategyV2Journal(req, res) {
    try {
        const { paperJournalService } = await Promise.resolve().then(() => __importStar(require('../services/research/paperJournal.service')));
        const entries = await paperJournalService.getJournalEntries({
            strategyVersion: req.query.strategyVersion,
            userId: req.user?.userId,
            symbol: req.query.symbol,
            regime: req.query.regime,
            limit: req.query.limit ? Number(req.query.limit) : 100
        });
        res.json({
            success: true,
            ...SAFETY_METADATA,
            entries,
            total: entries.length
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getStrategyV2LossAnalysis(req, res) {
    try {
        const { lossAnalysisService } = await Promise.resolve().then(() => __importStar(require('../services/research/lossAnalysis.service')));
        const userId = req.user?.userId || (req.query.userId ? Number(req.query.userId) : undefined);
        const symbol = req.query.symbol;
        const report = await lossAnalysisService.analyzeLosses(userId, symbol);
        res.json({
            success: true,
            ...SAFETY_METADATA,
            report
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getStrategyV2LossClusters(req, res) {
    try {
        const { lossAnalysisService } = await Promise.resolve().then(() => __importStar(require('../services/research/lossAnalysis.service')));
        const userId = req.user?.userId || (req.query.userId ? Number(req.query.userId) : undefined);
        const symbol = req.query.symbol;
        const report = await lossAnalysisService.analyzeLosses(userId, symbol);
        res.json({
            success: true,
            ...SAFETY_METADATA,
            lossClusters: report.lossClusters,
            consecutiveLossAnalysis: report.consecutiveLossAnalysis
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getStrategyV2DiagnosticAlerts(req, res) {
    try {
        const { lossAnalysisService } = await Promise.resolve().then(() => __importStar(require('../services/research/lossAnalysis.service')));
        const userId = req.user?.userId || (req.query.userId ? Number(req.query.userId) : undefined);
        const symbol = req.query.symbol;
        const report = await lossAnalysisService.analyzeLosses(userId, symbol);
        res.json({
            success: true,
            ...SAFETY_METADATA,
            alerts: report.diagnosticAlerts,
            total: report.diagnosticAlerts.length
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getStrategyV2ValidationReport(req, res) {
    try {
        const { lossAnalysisService } = await Promise.resolve().then(() => __importStar(require('../services/research/lossAnalysis.service')));
        const { strategyV2ComparisonService } = await Promise.resolve().then(() => __importStar(require('../services/research/strategyV2Comparison.service')));
        const { outOfSampleValidationService } = await Promise.resolve().then(() => __importStar(require('../services/research/outOfSampleValidation.service')));
        const { derivMarketProvider } = await Promise.resolve().then(() => __importStar(require('../services/market/derivMarket.provider')));
        const { marketService } = await Promise.resolve().then(() => __importStar(require('../services/market.service')));
        const userId = req.user?.userId;
        const symbol = req.query.symbol || 'R_100';
        // 1. Loss Analysis
        const lossReport = await lossAnalysisService.analyzeLosses(userId, symbol);
        // 2. V1 vs V2 Comparison
        const comparison = await strategyV2ComparisonService.compareV1VsV2(userId, symbol);
        // 3. OOS Validation
        let candles = await derivMarketProvider.getCandles(symbol, '1m', 300);
        if (!candles || candles.length < 50) {
            candles = await marketService.getCandles(symbol, '1m', 300);
        }
        const oosReport = outOfSampleValidationService.runValidation(candles);
        res.json({
            success: true,
            ...SAFETY_METADATA,
            validationDashboard: {
                overview: {
                    totalTrades: lossReport.totalTrades,
                    wins: lossReport.totalWins,
                    losses: lossReport.totalLosses,
                    winRate: lossReport.overallWinRate,
                    totalPnL: lossReport.overallPnL,
                    expectancy: lossReport.overallExpectancy,
                    maxDrawdown: lossReport.maxDrawdown,
                    maxConsecutiveLosses: lossReport.maxConsecutiveLosses,
                    sampleStatus: lossReport.totalTrades >= 30 ? 'ADEQUATE' : 'INSUFFICIENT_SAMPLE'
                },
                assetAnalysis: lossReport.assetAnalysis,
                regimeAnalysis: lossReport.regimeAnalysis,
                scoreAnalysis: lossReport.scoreAnalysis,
                confirmationAnalysis: lossReport.confirmationAnalysis,
                durationAnalysis: lossReport.durationAnalysis,
                consecutiveLossAnalysis: lossReport.consecutiveLossAnalysis,
                lossClusters: lossReport.lossClusters,
                v1VsV2Comparison: comparison,
                oosValidation: oosReport,
                diagnosticAlerts: lossReport.diagnosticAlerts,
                disclaimer: 'Strategy V2 Demo Validation & Loss Analysis Dashboard. All metrics are computed strictly for research in DEMO/PAPER mode.'
            }
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function collectDemoTrades(req, res) {
    try {
        const { paperJournalService } = await Promise.resolve().then(() => __importStar(require('../services/research/paperJournal.service')));
        const count = req.body.count ? Number(req.body.count) : 120;
        const seeded = await paperJournalService.seedValidationDataset(count);
        res.json({
            success: true,
            ...SAFETY_METADATA,
            message: `Successfully collected ${seeded.length} demo validation trades in paper journal.`,
            collectedCount: seeded.length
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
/**
 * =====================================================================
 * STRATEGY V2.1 CONTROLLED RESEARCH EXPERIMENT ENDPOINTS
 * =====================================================================
 */
async function getStrategyV2_1LabDashboard(req, res) {
    try {
        const { v2_1_experimentService } = await Promise.resolve().then(() => __importStar(require('../services/research/v2_1_experiment.service')));
        const dashboard = await v2_1_experimentService.getResearchLabDashboard();
        res.json({
            success: true,
            ...SAFETY_METADATA,
            researchLabDashboard: dashboard
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getStrategyV2_1ExperimentMatrix(req, res) {
    try {
        const { v2_1_experimentService } = await Promise.resolve().then(() => __importStar(require('../services/research/v2_1_experiment.service')));
        const dashboard = await v2_1_experimentService.getResearchLabDashboard();
        res.json({
            success: true,
            ...SAFETY_METADATA,
            experimentsMatrix: dashboard.experimentsMatrix
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getStrategyV2_1DurationExperiment(req, res) {
    try {
        const { v2_1_experimentService } = await Promise.resolve().then(() => __importStar(require('../services/research/v2_1_experiment.service')));
        const trades = await v2_1_experimentService.getExperimentTrades();
        const result = v2_1_experimentService.runExperimentA(trades);
        res.json({
            success: true,
            ...SAFETY_METADATA,
            durationExperiment: result
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getStrategyV2_1RangingExperiment(req, res) {
    try {
        const { v2_1_experimentService } = await Promise.resolve().then(() => __importStar(require('../services/research/v2_1_experiment.service')));
        const trades = await v2_1_experimentService.getExperimentTrades();
        const result = v2_1_experimentService.runExperimentB(trades);
        res.json({
            success: true,
            ...SAFETY_METADATA,
            rangingExperiment: result
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getStrategyV2_1ThresholdExperiment(req, res) {
    try {
        const { v2_1_experimentService } = await Promise.resolve().then(() => __importStar(require('../services/research/v2_1_experiment.service')));
        const trades = await v2_1_experimentService.getExperimentTrades();
        const result = v2_1_experimentService.runExperimentC(trades);
        res.json({
            success: true,
            ...SAFETY_METADATA,
            thresholdExperiment: result
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getStrategyV2_1OosValidation(req, res) {
    try {
        const { v2_1_experimentService } = await Promise.resolve().then(() => __importStar(require('../services/research/v2_1_experiment.service')));
        const trades = await v2_1_experimentService.getExperimentTrades();
        const result = v2_1_experimentService.evaluateOOSValidation(trades);
        res.json({
            success: true,
            ...SAFETY_METADATA,
            oosValidation: result
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function evaluateStrategyV2_1Signal(req, res) {
    try {
        const { v2_1_experimentService } = await Promise.resolve().then(() => __importStar(require('../services/research/v2_1_experiment.service')));
        const { candles, indicators, rangingConfluenceEnabled, lowRegimeMinScore, highVolatilityDuration } = req.body;
        const result = v2_1_experimentService.evaluateSignalV2_1(candles, indicators, {
            rangingConfluenceEnabled,
            lowRegimeMinScore,
            highVolatilityDuration
        });
        res.json({
            success: true,
            ...SAFETY_METADATA,
            result
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
/**
 * =====================================================================
 * STRATEGY V2.2 EXTENDED FRESH VALIDATION ENDPOINTS
 * =====================================================================
 */
async function getStrategyV2_2FreshDashboard(req, res) {
    try {
        const { v2_2_freshValidationService } = await Promise.resolve().then(() => __importStar(require('../services/research/v2_2_fresh_validation.service')));
        const dashboard = await v2_2_freshValidationService.getFreshValidationDashboard();
        res.json({
            success: true,
            ...SAFETY_METADATA,
            freshValidationDashboard: dashboard
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getStrategyV2_2ExperimentMatrix(req, res) {
    try {
        const { v2_2_freshValidationService } = await Promise.resolve().then(() => __importStar(require('../services/research/v2_2_fresh_validation.service')));
        const dashboard = await v2_2_freshValidationService.getFreshValidationDashboard();
        res.json({
            success: true,
            ...SAFETY_METADATA,
            experimentMatrix: dashboard.experimentMatrix
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getStrategyV2_2Breakdowns(req, res) {
    try {
        const { v2_2_freshValidationService } = await Promise.resolve().then(() => __importStar(require('../services/research/v2_2_fresh_validation.service')));
        const dashboard = await v2_2_freshValidationService.getFreshValidationDashboard();
        res.json({
            success: true,
            ...SAFETY_METADATA,
            assetAnalysis: dashboard.assetAnalysis,
            regimeAnalysis: dashboard.regimeAnalysis,
            scoreAnalysis: dashboard.scoreAnalysis,
            durationAnalysis: dashboard.durationAnalysis
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getStrategyV2_2ConfidenceIntervals(req, res) {
    try {
        const { v2_2_freshValidationService } = await Promise.resolve().then(() => __importStar(require('../services/research/v2_2_fresh_validation.service')));
        const dashboard = await v2_2_freshValidationService.getFreshValidationDashboard();
        res.json({
            success: true,
            ...SAFETY_METADATA,
            confidenceIntervalsSummary: dashboard.confidenceIntervalsSummary
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getStrategyV2_2OosValidation(req, res) {
    try {
        const { v2_2_freshValidationService } = await Promise.resolve().then(() => __importStar(require('../services/research/v2_2_fresh_validation.service')));
        const dashboard = await v2_2_freshValidationService.getFreshValidationDashboard();
        res.json({
            success: true,
            ...SAFETY_METADATA,
            oosValidation: dashboard.oosValidation
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function collectFreshDatasetV2_2(req, res) {
    try {
        const { v2_2_freshValidationService } = await Promise.resolve().then(() => __importStar(require('../services/research/v2_2_fresh_validation.service')));
        const count = req.body.count ? Number(req.body.count) : 160;
        const freshTrades = await v2_2_freshValidationService.getOrSeedFreshDataset(count);
        res.json({
            success: true,
            ...SAFETY_METADATA,
            message: `Successfully collected ${freshTrades.length} fresh demo trades under dataset V2.2_FRESH.`,
            collectedCount: freshTrades.length,
            datasetId: 'V2.2_FRESH'
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
/**
 * =====================================================================
 * STRATEGY V2.3 MULTI-SESSION VALIDATION & PROMOTION GATE ENDPOINTS
 * =====================================================================
 */
async function getStrategyV2_3MultiSessionDashboard(req, res) {
    try {
        const { v2_3_multiSessionService } = await Promise.resolve().then(() => __importStar(require('../services/research/v2_3_multisession.service')));
        const dashboard = await v2_3_multiSessionService.getMultiSessionDashboard();
        res.json({
            success: true,
            ...SAFETY_METADATA,
            multiSessionDashboard: dashboard
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getStrategyV2_3SessionsList(req, res) {
    try {
        const { v2_3_multiSessionService } = await Promise.resolve().then(() => __importStar(require('../services/research/v2_3_multisession.service')));
        const dashboard = await v2_3_multiSessionService.getMultiSessionDashboard();
        res.json({
            success: true,
            ...SAFETY_METADATA,
            sessionsList: dashboard.sessionsList,
            totalSessions: dashboard.sessionsList.length
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getStrategyV2_3HypothesesSummary(req, res) {
    try {
        const { v2_3_multiSessionService } = await Promise.resolve().then(() => __importStar(require('../services/research/v2_3_multisession.service')));
        const dashboard = await v2_3_multiSessionService.getMultiSessionDashboard();
        res.json({
            success: true,
            ...SAFETY_METADATA,
            hypotheses: dashboard.hypotheses
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getStrategyV2_3CrossAsset(req, res) {
    try {
        const { v2_3_multiSessionService } = await Promise.resolve().then(() => __importStar(require('../services/research/v2_3_multisession.service')));
        const dashboard = await v2_3_multiSessionService.getMultiSessionDashboard();
        res.json({
            success: true,
            ...SAFETY_METADATA,
            crossAssetAnalysis: dashboard.crossAssetAnalysis
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getStrategyV2_3CrossRegime(req, res) {
    try {
        const { v2_3_multiSessionService } = await Promise.resolve().then(() => __importStar(require('../services/research/v2_3_multisession.service')));
        const dashboard = await v2_3_multiSessionService.getMultiSessionDashboard();
        res.json({
            success: true,
            ...SAFETY_METADATA,
            crossRegimeAnalysis: dashboard.crossRegimeAnalysis
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getStrategyV2_3OosValidation(req, res) {
    try {
        const { v2_3_multiSessionService } = await Promise.resolve().then(() => __importStar(require('../services/research/v2_3_multisession.service')));
        const dashboard = await v2_3_multiSessionService.getMultiSessionDashboard();
        res.json({
            success: true,
            ...SAFETY_METADATA,
            oosValidation: dashboard.oosValidation
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getStrategyV2_3PromotionGate(req, res) {
    try {
        const { v2_3_multiSessionService } = await Promise.resolve().then(() => __importStar(require('../services/research/v2_3_multisession.service')));
        const dashboard = await v2_3_multiSessionService.getMultiSessionDashboard();
        res.json({
            success: true,
            ...SAFETY_METADATA,
            promotionGateSummary: dashboard.promotionGateSummary
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function collectMultiSessionDatasetV2_3(req, res) {
    try {
        const { v2_3_multiSessionService } = await Promise.resolve().then(() => __importStar(require('../services/research/v2_3_multisession.service')));
        const sessions = req.body.sessions ? Number(req.body.sessions) : 10;
        const tradesPerSession = req.body.tradesPerSession ? Number(req.body.tradesPerSession) : 55;
        const trades = await v2_3_multiSessionService.getOrSeedMultiSessionDataset(sessions, tradesPerSession);
        res.json({
            success: true,
            ...SAFETY_METADATA,
            message: `Successfully generated ${trades.length} multi-session demo trades across ${sessions} sessions under dataset V2.3_MULTI_SESSION.`,
            totalTrades: trades.length,
            sessionsCount: sessions,
            datasetId: 'V2.3_MULTI_SESSION'
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
/**
 * =====================================================================
 * STRATEGY V2.4 COMBINATION & ABLATION RESEARCH ENDPOINTS
 * =====================================================================
 */
async function getStrategyV2_4CombinationDashboard(req, res) {
    try {
        const { v2_4_combinationService } = await Promise.resolve().then(() => __importStar(require('../services/research/v2_4_combination.service')));
        const dashboard = await v2_4_combinationService.getCombinationDashboard();
        res.json({
            success: true,
            ...SAFETY_METADATA,
            combinationDashboard: dashboard
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getStrategyV2_4Variants(req, res) {
    try {
        const { v2_4_combinationService } = await Promise.resolve().then(() => __importStar(require('../services/research/v2_4_combination.service')));
        const dashboard = await v2_4_combinationService.getCombinationDashboard();
        res.json({
            success: true,
            ...SAFETY_METADATA,
            variants: dashboard.variantMatrix,
            totalVariants: dashboard.variantMatrix.length
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getStrategyV2_4Ablation(req, res) {
    try {
        const { v2_4_combinationService } = await Promise.resolve().then(() => __importStar(require('../services/research/v2_4_combination.service')));
        const dashboard = await v2_4_combinationService.getCombinationDashboard();
        res.json({
            success: true,
            ...SAFETY_METADATA,
            ablationAnalysis: dashboard.ablationAnalysis
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getStrategyV2_4OosValidation(req, res) {
    try {
        const { v2_4_combinationService } = await Promise.resolve().then(() => __importStar(require('../services/research/v2_4_combination.service')));
        const dashboard = await v2_4_combinationService.getCombinationDashboard();
        res.json({
            success: true,
            ...SAFETY_METADATA,
            oosValidation: dashboard.oosValidation,
            robustnessVerification: dashboard.robustnessVerification
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function getStrategyV2_4PromotionGate(req, res) {
    try {
        const { v2_4_combinationService } = await Promise.resolve().then(() => __importStar(require('../services/research/v2_4_combination.service')));
        const dashboard = await v2_4_combinationService.getCombinationDashboard();
        res.json({
            success: true,
            ...SAFETY_METADATA,
            promotionGateSummary: dashboard.promotionGateSummary
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
async function collectCombinationDatasetV2_4(req, res) {
    try {
        const { v2_4_combinationService } = await Promise.resolve().then(() => __importStar(require('../services/research/v2_4_combination.service')));
        const sessions = req.body.sessions ? Number(req.body.sessions) : 10;
        const tradesPerSession = req.body.tradesPerSession ? Number(req.body.tradesPerSession) : 80;
        const trades = await v2_4_combinationService.getOrSeedCombinationDataset(sessions, tradesPerSession);
        res.json({
            success: true,
            ...SAFETY_METADATA,
            message: `Successfully generated ${trades.length} combination/ablation demo observations across ${sessions} sessions under dataset V2.4_COMBINATION_ABLATION.`,
            totalTrades: trades.length,
            sessionsCount: sessions,
            datasetId: 'V2.4_COMBINATION_ABLATION'
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
