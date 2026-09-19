"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.multiTimeframeService = exports.MultiTimeframeService = void 0;
const backtesting_service_1 = require("../backtesting.service");
const indicator_service_1 = require("../indicator.service");
class MultiTimeframeService {
    /**
     * Resamples or aligns higher timeframe candles with primary timeframe candles,
     * guaranteeing zero look-ahead bias by strictly considering only closed higher timeframe bars.
     */
    filterSignalsWithHigherTrend(primaryCandles, htfCandles, config) {
        const period = config.higherTrendEmaPeriod || 50;
        // Calculate EMA on the higher timeframe closed candles
        const htfCloses = htfCandles.map((c) => c.close);
        const htfEma = indicator_service_1.indicatorService.calculateEMA(htfCloses, period);
        const alignedTrend = [];
        // For each primary candle, find the latest HTF candle that closed strictly at or before primary candle timestamp
        let htfIdx = 0;
        for (let i = 0; i < primaryCandles.length; i++) {
            const pTime = primaryCandles[i].timestamp;
            // Advance htfIdx as long as next HTF candle closed <= pTime
            while (htfIdx + 1 < htfCandles.length &&
                htfCandles[htfIdx + 1].timestamp <= pTime) {
                htfIdx++;
            }
            if (htfIdx < htfCandles.length && htfCandles[htfIdx].timestamp <= pTime) {
                const emaVal = htfEma[htfIdx];
                const htfClose = htfCandles[htfIdx].close;
                if (emaVal !== null) {
                    if (htfClose > emaVal) {
                        alignedTrend.push('BULLISH');
                    }
                    else if (htfClose < emaVal) {
                        alignedTrend.push('BEARISH');
                    }
                    else {
                        alignedTrend.push('NEUTRAL');
                    }
                }
                else {
                    alignedTrend.push('NEUTRAL');
                }
            }
            else {
                alignedTrend.push('NEUTRAL');
            }
        }
        return { alignedTrend };
    }
    /**
     * Validates a strategy across multiple assets (Multi-Asset Robustness Matrix).
     */
    async runCrossAssetValidation(strategy, assets, timeframe = '5m', parameters, candleCount = 100) {
        const results = [];
        for (const asset of assets) {
            try {
                const backtest = await backtesting_service_1.backtestingService.runBacktest({
                    asset,
                    timeframe,
                    strategy,
                    initialBalance: 10000,
                    tradeAmount: 100,
                    riskPercent: 1.0,
                    parameters,
                    candleCount
                });
                results.push({
                    asset,
                    tradesCount: backtest.totalTrades,
                    winRate: backtest.winRate,
                    netPnl: backtest.netPnl,
                    profitFactor: backtest.profitFactor,
                    sharpeRatio: backtest.advancedMetrics ? backtest.advancedMetrics.sharpeRatio : null,
                    maxDrawdownPercent: backtest.maxDrawdown
                });
            }
            catch {
                results.push({
                    asset,
                    tradesCount: 0,
                    winRate: 0,
                    netPnl: 0,
                    profitFactor: 0,
                    sharpeRatio: null,
                    maxDrawdownPercent: 0
                });
            }
        }
        const validWinRates = results.filter((r) => r.tradesCount > 0).map((r) => r.winRate);
        const avgWinRate = validWinRates.length > 0
            ? validWinRates.reduce((a, b) => a + b, 0) / validWinRates.length
            : 0;
        const validSharpes = results
            .filter((r) => r.sharpeRatio !== null)
            .map((r) => r.sharpeRatio);
        const avgSharpe = validSharpes.length > 0
            ? validSharpes.reduce((a, b) => a + b, 0) / validSharpes.length
            : null;
        const robustAssetsCount = results.filter((r) => r.winRate >= 50 && r.netPnl >= 0).length;
        const fragileAssetsCount = results.length - robustAssetsCount;
        return {
            strategy,
            assets: results,
            averageWinRate: Math.round(avgWinRate * 100) / 100,
            averageSharpe: avgSharpe !== null ? Math.round(avgSharpe * 100) / 100 : null,
            robustAssetsCount,
            fragileAssetsCount,
            mode: 'PAPER',
            isRealMoney: false
        };
    }
    /**
     * Validates a strategy across multiple timeframes for a single asset.
     */
    async runCrossTimeframeValidation(strategy, asset, timeframes = ['1m', '5m', '15m', '1h'], parameters, candleCount = 100) {
        const list = [];
        for (const tf of timeframes) {
            try {
                const backtest = await backtesting_service_1.backtestingService.runBacktest({
                    asset,
                    timeframe: tf,
                    strategy,
                    initialBalance: 10000,
                    tradeAmount: 100,
                    riskPercent: 1.0,
                    parameters,
                    candleCount
                });
                list.push({
                    timeframe: tf,
                    tradesCount: backtest.totalTrades,
                    winRate: backtest.winRate,
                    netPnl: backtest.netPnl,
                    profitFactor: backtest.profitFactor,
                    sharpeRatio: backtest.advancedMetrics ? backtest.advancedMetrics.sharpeRatio : null,
                    maxDrawdownPercent: backtest.maxDrawdown
                });
            }
            catch {
                list.push({
                    timeframe: tf,
                    tradesCount: 0,
                    winRate: 0,
                    netPnl: 0,
                    profitFactor: 0,
                    sharpeRatio: null,
                    maxDrawdownPercent: 0
                });
            }
        }
        return {
            strategy,
            asset,
            timeframes: list,
            mode: 'PAPER',
            isRealMoney: false
        };
    }
}
exports.MultiTimeframeService = MultiTimeframeService;
exports.multiTimeframeService = new MultiTimeframeService();
