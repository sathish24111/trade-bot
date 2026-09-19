"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.regimeService = exports.RegimeService = void 0;
const indicator_service_1 = require("../indicator.service");
class RegimeService {
    /**
     * Classifies the market regime for a specific candle index with strict look-ahead bias prevention.
     * Only uses candles.slice(0, currentIndex + 1).
     */
    classifyRegime(candles, currentIndex) {
        const historicalSlice = candles.slice(0, currentIndex + 1);
        const targetCandle = candles[currentIndex];
        if (historicalSlice.length < 20) {
            return {
                regime: 'RANGING',
                timestamp: targetCandle.timestamp,
                atr: 0,
                atrAvg: 0,
                bollingerWidth: 0,
                emaSlope: 0,
                description: 'Insufficient history for regime classification; default to RANGING'
            };
        }
        const indicators = indicator_service_1.indicatorService.calculateAllIndicators(historicalSlice);
        const currentAtr = indicators.atr14;
        // Calculate rolling average ATR over the last up to 50 candles
        const atrHistory = [];
        const lookback = Math.min(50, historicalSlice.length - 15);
        for (let j = 0; j < lookback; j++) {
            const idx = historicalSlice.length - 1 - j;
            if (idx >= 15) {
                const subSlice = historicalSlice.slice(0, idx + 1);
                const subIndicators = indicator_service_1.indicatorService.calculateAllIndicators(subSlice);
                atrHistory.push(subIndicators.atr14);
            }
        }
        const atrAvg = atrHistory.length > 0
            ? atrHistory.reduce((sum, v) => sum + v, 0) / atrHistory.length
            : currentAtr;
        // Bollinger Band width: (upper - lower) / middle
        const bb = indicators.bollinger;
        const bollingerWidth = bb.middle > 0 ? (bb.upper - bb.lower) / bb.middle : 0;
        // EMA slope over the last 5 bars
        let emaSlope = 0;
        if (historicalSlice.length >= 26) {
            const prevSliceCloses = historicalSlice.slice(0, historicalSlice.length - 5).map(c => c.close);
            const prevEmaArr = indicator_service_1.indicatorService.calculateEMA(prevSliceCloses, 21);
            const prevEma = prevEmaArr.length > 0 ? prevEmaArr[prevEmaArr.length - 1] : indicators.ema21;
            emaSlope = indicators.ema21 - prevEma;
        }
        // Regime Decision Logic
        let regime;
        let description;
        if (atrAvg > 0 && currentAtr > 1.4 * atrAvg) {
            regime = 'HIGH_VOLATILITY';
            description = `ATR (${currentAtr.toFixed(4)}) is > 1.4x rolling average (${atrAvg.toFixed(4)}), signaling elevated market volatility.`;
        }
        else if (atrAvg > 0 && currentAtr < 0.7 * atrAvg) {
            regime = 'LOW_VOLATILITY';
            description = `ATR (${currentAtr.toFixed(4)}) is < 0.7x rolling average (${atrAvg.toFixed(4)}), signaling subdued, low-volatility conditions.`;
        }
        else {
            // Trend vs Range: Look at EMA vs SMA50 and Bollinger Band width
            const emaVsSma50Diff = Math.abs(indicators.ema21 - indicators.sma50);
            const trendStrengthPct = indicators.sma50 > 0 ? (emaVsSma50Diff / indicators.sma50) * 100 : 0;
            if (trendStrengthPct > 0.35 || Math.abs(emaSlope) > (targetCandle.close * 0.0015)) {
                regime = 'TRENDING';
                description = `EMA21 divergence (${indicators.ema21.toFixed(4)}) vs SMA50 (${indicators.sma50.toFixed(4)}) signals established directional momentum.`;
            }
            else {
                regime = 'RANGING';
                description = `Bollinger Bands width (${(bollingerWidth * 100).toFixed(2)}%) and flat moving averages indicate sideways consolidation.`;
            }
        }
        return {
            regime,
            timestamp: targetCandle.timestamp,
            atr: Number(currentAtr.toFixed(5)),
            atrAvg: Number(atrAvg.toFixed(5)),
            bollingerWidth: Number(bollingerWidth.toFixed(4)),
            emaSlope: Number(emaSlope.toFixed(5)),
            description
        };
    }
    /**
     * Evaluates performance of historical backtest trades broken down by market regime at entry.
     */
    aggregatePerformanceByRegime(trades, regimeMap) {
        const regimes = ['TRENDING', 'RANGING', 'HIGH_VOLATILITY', 'LOW_VOLATILITY'];
        const buckets = new Map();
        for (const r of regimes) {
            buckets.set(r, []);
        }
        for (const trade of trades) {
            const reg = regimeMap.get(trade.timestamp) || 'RANGING';
            const list = buckets.get(reg) || [];
            list.push(trade);
            buckets.set(reg, list);
        }
        const result = [];
        for (const r of regimes) {
            const bucketTrades = buckets.get(r) || [];
            const total = bucketTrades.length;
            const winning = bucketTrades.filter(t => t.pnl > 0);
            const losing = bucketTrades.filter(t => t.pnl < 0);
            const winRate = total > 0 ? Number(((winning.length / total) * 100).toFixed(2)) : 0;
            const grossProfit = winning.reduce((sum, t) => sum + t.pnl, 0);
            const grossLoss = Math.abs(losing.reduce((sum, t) => sum + t.pnl, 0));
            const netPnl = Number((grossProfit - grossLoss).toFixed(2));
            const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : (grossProfit > 0 ? 99.99 : 0);
            const avgWin = winning.length > 0 ? grossProfit / winning.length : 0;
            const avgLoss = losing.length > 0 ? grossLoss / losing.length : 0;
            const winProb = total > 0 ? winning.length / total : 0;
            const lossProb = total > 0 ? losing.length / total : 0;
            const expectancy = Number((winProb * avgWin - lossProb * avgLoss).toFixed(2));
            result.push({
                regime: r,
                tradesCount: total,
                winningTrades: winning.length,
                losingTrades: losing.length,
                winRate,
                netPnl,
                profitFactor,
                expectancy
            });
        }
        return result;
    }
}
exports.RegimeService = RegimeService;
exports.regimeService = new RegimeService();
