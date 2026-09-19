"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitorService = exports.MonitorService = void 0;
const market_service_1 = require("../market.service");
const strategy_service_1 = require("../strategy.service");
const marketHealth_service_1 = require("./marketHealth.service");
const riskMonitor_service_1 = require("./riskMonitor.service");
const strategyControl_service_1 = require("./strategyControl.service");
class MonitorService {
    /**
     * Evaluates the real-time paper trading monitoring state for a given asset and strategy.
     * Strictly uses closed (completed) candles for strategy signals (zero look-ahead).
     */
    async getMonitorOverview(asset = 'BTC/USD', strategy = 'EMA_RSI') {
        const candles = await market_service_1.marketService.getCandles(asset, '5m', 50);
        const health = await marketHealth_service_1.marketHealthService.evaluateAssetHealth(asset, '5m');
        let currentCandle = null;
        let completedCandle = null;
        let currentPrice = 50000.0;
        let previousPrice = 50000.0;
        if (candles.length > 0) {
            currentCandle = candles[candles.length - 1];
            currentPrice = currentCandle.close;
            if (candles.length > 1) {
                completedCandle = candles[candles.length - 2];
                previousPrice = completedCandle.close;
            }
            else {
                previousPrice = currentCandle.open;
            }
        }
        const priceChange = Math.round((currentPrice - previousPrice) * 100) / 100;
        const changePercent = previousPrice > 0 ? Math.round(((currentPrice - previousPrice) / previousPrice) * 100 * 100) / 100 : 0.0;
        // Evaluate strategy signal strictly using completed candle history
        let activeSignal = 'WAIT';
        let signalConfidence = 50;
        const isAllowed = strategyControl_service_1.strategyControlService.isSignalGenerationAllowed(strategy);
        if (isAllowed && candles.length >= 2) {
            // Pass candles up to completed candle (index 0 to length - 2) to eliminate intra-bar repainting
            const closedHistory = candles.slice(0, candles.length - 1);
            const evalResult = strategy_service_1.strategyEngine.evaluateFromCandles(strategy, closedHistory);
            activeSignal = evalResult.signal;
            signalConfidence = evalResult.confidence;
        }
        // Fetch live risk snapshot
        const riskState = riskMonitor_service_1.riskMonitorService.getLatestState();
        return {
            asset,
            currentPrice,
            previousPrice,
            priceChange,
            changePercent,
            currentCandle,
            completedCandle,
            activeSignal,
            signalConfidence,
            strategy,
            currentPosition: null, // Simulated idle position
            unrealizedPnl: 0.0,
            realizedPnl: riskState.dailyPnL,
            dailyPnl: riskState.dailyPnL,
            drawdown: riskState.currentDrawdown,
            exposure: riskState.portfolioExposure,
            riskUtilization: riskState.riskUtilization,
            tradeCount: riskState.positionCount,
            winningTrades: 0,
            losingTrades: riskState.consecutiveLosses,
            currentRegime: riskState.marketRegime,
            dataFreshness: health.status,
            mode: 'PAPER',
            isRealMoney: false,
            brokerConnected: false
        };
    }
}
exports.MonitorService = MonitorService;
exports.monitorService = new MonitorService();
