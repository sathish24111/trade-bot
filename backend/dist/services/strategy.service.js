"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.strategyEngine = exports.StrategyEngine = exports.MultiIndicator_Strategy = exports.Bollinger_Strategy = exports.MACD_Strategy = exports.EMA_RSI_Strategy = void 0;
const indicator_service_1 = require("./indicator.service");
const STRATEGY_DISCLAIMER = 'Strategy confidence and metrics are algorithmically computed in DEMO/PAPER mode. No signal guarantees profit.';
// 1. EMA + RSI Strategy
class EMA_RSI_Strategy {
    id = 'EMA_RSI';
    name = 'EMA_RSI';
    description = 'Trend following EMA filter combined with Wilder RSI momentum bounds';
    defaultParameters = {
        emaPeriod: 21,
        rsiPeriod: 14,
        rsiOversold: 30,
        rsiOverbought: 70
    };
    parameterDefinitions = [
        { key: 'emaPeriod', label: 'EMA Period', type: 'number', defaultValue: 21, min: 5, max: 80, step: 5 },
        { key: 'rsiPeriod', label: 'RSI Period', type: 'number', defaultValue: 14, min: 7, max: 28, step: 1 },
        { key: 'rsiOversold', label: 'RSI Oversold Level', type: 'number', defaultValue: 30, min: 15, max: 45, step: 5 },
        { key: 'rsiOverbought', label: 'RSI Overbought Level', type: 'number', defaultValue: 70, min: 55, max: 85, step: 5 }
    ];
    generateSignal(candles, indicators, parameters) {
        const params = { ...this.defaultParameters, ...parameters };
        const price = candles.length > 0 ? candles[candles.length - 1].close : 0;
        let emaVal = indicators.ema21;
        let rsiVal = indicators.rsi14;
        // Recalculate indicators if custom periods differ from defaults and candles are available
        if (candles.length >= Number(params.emaPeriod)) {
            const closes = candles.map(c => c.close);
            const emaArr = indicator_service_1.indicatorService.calculateEMA(closes, Number(params.emaPeriod));
            emaVal = emaArr[emaArr.length - 1];
        }
        if (candles.length > Number(params.rsiPeriod)) {
            const closes = candles.map(c => c.close);
            const rsiArr = indicator_service_1.indicatorService.calculateRSI(closes, Number(params.rsiPeriod));
            rsiVal = rsiArr[rsiArr.length - 1];
        }
        const updatedInd = {
            ...indicators,
            ema21: Number(emaVal.toFixed(5)),
            rsi14: Number(rsiVal.toFixed(1))
        };
        return this.evaluate(price, updatedInd, params);
    }
    evaluate(price, indicators, parameters) {
        const params = { ...this.defaultParameters, ...parameters };
        const emaPeriod = Number(params.emaPeriod);
        const rsiOversold = Number(params.rsiOversold);
        const rsiOverbought = Number(params.rsiOverbought);
        const ema = indicators.ema21;
        const rsi = indicators.rsi14;
        let signal = 'WAIT';
        let confidence = 50;
        let reason = `RSI (${rsi}) in neutral range (${rsiOversold}-${rsiOverbought}) or conflicting with EMA${emaPeriod} (${ema}) trend`;
        if (price > ema && rsi > 50 && rsi < rsiOverbought) {
            signal = 'BUY';
            confidence = Math.min(85, Math.round(55 + (rsi - 50) * 1.5));
            reason = `Price (${price}) > EMA${emaPeriod} (${ema}) and RSI (${rsi}) shows bullish momentum below overbought (${rsiOverbought})`;
        }
        else if (price < ema && rsi < 50 && rsi > rsiOversold) {
            signal = 'SELL';
            confidence = Math.min(85, Math.round(55 + (50 - rsi) * 1.5));
            reason = `Price (${price}) < EMA${emaPeriod} (${ema}) and RSI (${rsi}) shows bearish momentum above oversold (${rsiOversold})`;
        }
        else if (rsi >= rsiOverbought) {
            reason = `RSI (${rsi}) is in overbought territory (>=${rsiOverbought}); waiting for pullback`;
        }
        else if (rsi <= rsiOversold) {
            reason = `RSI (${rsi}) is in oversold territory (<=${rsiOversold}); waiting for bounce`;
        }
        return {
            signal,
            confidence,
            reason,
            indicators,
            disclaimer: STRATEGY_DISCLAIMER,
            parametersUsed: params
        };
    }
}
exports.EMA_RSI_Strategy = EMA_RSI_Strategy;
// 2. MACD Strategy
class MACD_Strategy {
    id = 'MACD';
    name = 'MACD';
    description = 'MACD line and signal crossover momentum tracking';
    defaultParameters = {
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9
    };
    parameterDefinitions = [
        { key: 'fastPeriod', label: 'Fast EMA Period', type: 'number', defaultValue: 12, min: 6, max: 20, step: 2 },
        { key: 'slowPeriod', label: 'Slow EMA Period', type: 'number', defaultValue: 26, min: 20, max: 40, step: 2 },
        { key: 'signalPeriod', label: 'Signal EMA Period', type: 'number', defaultValue: 9, min: 5, max: 15, step: 1 }
    ];
    generateSignal(candles, indicators, parameters) {
        const params = { ...this.defaultParameters, ...parameters };
        const price = candles.length > 0 ? candles[candles.length - 1].close : 0;
        let macd = indicators.macd;
        if (candles.length >= Number(params.slowPeriod)) {
            const closes = candles.map(c => c.close);
            const macdObj = indicator_service_1.indicatorService.calculateMACD(closes, Number(params.fastPeriod), Number(params.slowPeriod), Number(params.signalPeriod));
            const lastIdx = closes.length - 1;
            macd = {
                value: Number(macdObj.macdLine[lastIdx].toFixed(5)),
                signal: Number(macdObj.signalLine[lastIdx].toFixed(5)),
                histogram: Number(macdObj.histogram[lastIdx].toFixed(5))
            };
        }
        const updatedInd = { ...indicators, macd };
        return this.evaluate(price, updatedInd, params);
    }
    evaluate(price, indicators, parameters) {
        const params = { ...this.defaultParameters, ...parameters };
        const { macd } = indicators;
        let signal = 'WAIT';
        let confidence = 50;
        let reason = 'MACD histogram near zero baseline; no clear momentum divergence';
        if (macd.histogram > 0 && macd.value > macd.signal) {
            signal = 'BUY';
            confidence = Math.min(82, 65 + Math.round(Math.min(15, Math.abs(macd.histogram) * 100)));
            reason = `MACD line (${macd.value}) crossed above signal line (${macd.signal}) with positive histogram (${macd.histogram})`;
        }
        else if (macd.histogram < 0 && macd.value < macd.signal) {
            signal = 'SELL';
            confidence = Math.min(82, 65 + Math.round(Math.min(15, Math.abs(macd.histogram) * 100)));
            reason = `MACD line (${macd.value}) crossed below signal line (${macd.signal}) with negative histogram (${macd.histogram})`;
        }
        return {
            signal,
            confidence,
            reason,
            indicators,
            disclaimer: STRATEGY_DISCLAIMER,
            parametersUsed: params
        };
    }
}
exports.MACD_Strategy = MACD_Strategy;
// 3. Bollinger Bands Strategy
class Bollinger_Strategy {
    id = 'BOLLINGER_BANDS';
    name = 'BOLLINGER_BANDS';
    description = 'Statistical mean-reversion bounces off upper and lower Bollinger volatility bands';
    defaultParameters = {
        period: 20,
        stdDevMultiplier: 2.0
    };
    parameterDefinitions = [
        { key: 'period', label: 'SMA Period', type: 'number', defaultValue: 20, min: 10, max: 40, step: 2 },
        { key: 'stdDevMultiplier', label: 'StdDev Multiplier', type: 'number', defaultValue: 2.0, min: 1.2, max: 3.0, step: 0.2 }
    ];
    generateSignal(candles, indicators, parameters) {
        const params = { ...this.defaultParameters, ...parameters };
        const price = candles.length > 0 ? candles[candles.length - 1].close : 0;
        let bollinger = indicators.bollinger;
        if (candles.length >= Number(params.period)) {
            const closes = candles.map(c => c.close);
            const bbObj = indicator_service_1.indicatorService.calculateBollingerBands(closes, Number(params.period), Number(params.stdDevMultiplier));
            const lastIdx = closes.length - 1;
            bollinger = {
                upper: Number(bbObj.upper[lastIdx].toFixed(5)),
                middle: Number(bbObj.middle[lastIdx].toFixed(5)),
                lower: Number(bbObj.lower[lastIdx].toFixed(5))
            };
        }
        const updatedInd = { ...indicators, bollinger };
        return this.evaluate(price, updatedInd, params);
    }
    evaluate(price, indicators, parameters) {
        const params = { ...this.defaultParameters, ...parameters };
        const { bollinger, rsi14 } = indicators;
        let signal = 'WAIT';
        let confidence = 50;
        let reason = `Price (${price}) is within normal Bollinger Band channels (${bollinger.lower} - ${bollinger.upper})`;
        if (price <= bollinger.lower || (price - bollinger.lower) < (bollinger.middle - bollinger.lower) * 0.1) {
            if (rsi14 < 45) {
                signal = 'BUY';
                confidence = Math.min(80, Math.round(65 + (45 - rsi14)));
                reason = `Price (${price}) tested lower Bollinger Band (${bollinger.lower}) with RSI (${rsi14}) supporting mean-reversion bounce`;
            }
        }
        else if (price >= bollinger.upper || (bollinger.upper - price) < (bollinger.upper - bollinger.middle) * 0.1) {
            if (rsi14 > 55) {
                signal = 'SELL';
                confidence = Math.min(80, Math.round(65 + (rsi14 - 55)));
                reason = `Price (${price}) tested upper Bollinger Band (${bollinger.upper}) with RSI (${rsi14}) supporting mean-reversion fade`;
            }
        }
        return {
            signal,
            confidence,
            reason,
            indicators,
            disclaimer: STRATEGY_DISCLAIMER,
            parametersUsed: params
        };
    }
}
exports.Bollinger_Strategy = Bollinger_Strategy;
// 4. Multi-Indicator Consensus Strategy
class MultiIndicator_Strategy {
    id = 'MULTI_INDICATOR';
    name = 'MULTI_INDICATOR';
    description = 'Consensus voting across EMA, RSI, MACD, and Bollinger Bands with confirmation threshold';
    defaultParameters = {
        emaPeriod: 21,
        rsiPeriod: 14,
        minConfirmations: 3
    };
    parameterDefinitions = [
        { key: 'emaPeriod', label: 'EMA Period', type: 'number', defaultValue: 21, min: 10, max: 50, step: 5 },
        { key: 'rsiPeriod', label: 'RSI Period', type: 'number', defaultValue: 14, min: 7, max: 21, step: 1 },
        { key: 'minConfirmations', label: 'Minimum Confirmations', type: 'number', defaultValue: 3, min: 2, max: 4, step: 1 }
    ];
    generateSignal(candles, indicators, parameters) {
        const params = { ...this.defaultParameters, ...parameters };
        const price = candles.length > 0 ? candles[candles.length - 1].close : 0;
        return this.evaluate(price, indicators, params);
    }
    evaluate(price, indicators, parameters) {
        const params = { ...this.defaultParameters, ...parameters };
        const minConf = Number(params.minConfirmations || 3);
        const { ema21, rsi14, macd, bollinger } = indicators;
        let buyVotes = 0;
        let sellVotes = 0;
        const voteDetails = [];
        // 1. EMA
        if (price > ema21) {
            buyVotes++;
            voteDetails.push('Price>EMA21');
        }
        else {
            sellVotes++;
            voteDetails.push('Price<EMA21');
        }
        // 2. RSI
        if (rsi14 > 52 && rsi14 < 70) {
            buyVotes++;
            voteDetails.push('RSI Bullish');
        }
        else if (rsi14 < 48 && rsi14 > 30) {
            sellVotes++;
            voteDetails.push('RSI Bearish');
        }
        // 3. MACD
        if (macd.histogram > 0) {
            buyVotes++;
            voteDetails.push('MACD Bullish');
        }
        else if (macd.histogram < 0) {
            sellVotes++;
            voteDetails.push('MACD Bearish');
        }
        // 4. Bollinger
        if (price < bollinger.middle) {
            buyVotes++;
            voteDetails.push('Bollinger Lower');
        }
        else {
            sellVotes++;
            voteDetails.push('Bollinger Upper');
        }
        let signal = 'WAIT';
        let confidence = 50;
        let reason = `Mixed indicator signals (${buyVotes} Buy vs ${sellVotes} Sell); required ${minConf} confirmations`;
        if (buyVotes >= minConf) {
            signal = 'BUY';
            confidence = buyVotes === 4 ? 85 : 72;
            reason = `Multi-indicator consensus BUY (${buyVotes}/4 signals: ${voteDetails.join(', ')})`;
        }
        else if (sellVotes >= minConf) {
            signal = 'SELL';
            confidence = sellVotes === 4 ? 85 : 72;
            reason = `Multi-indicator consensus SELL (${sellVotes}/4 signals: ${voteDetails.join(', ')})`;
        }
        return {
            signal,
            confidence,
            reason,
            indicators,
            disclaimer: STRATEGY_DISCLAIMER,
            parametersUsed: params
        };
    }
}
exports.MultiIndicator_Strategy = MultiIndicator_Strategy;
// Strategy Engine
class StrategyEngine {
    strategies = new Map();
    constructor() {
        this.register(new EMA_RSI_Strategy());
        this.register(new MACD_Strategy());
        this.register(new Bollinger_Strategy());
        this.register(new MultiIndicator_Strategy());
    }
    register(strategy) {
        this.strategies.set(strategy.id.toUpperCase(), strategy);
        this.strategies.set(strategy.name.toUpperCase(), strategy);
    }
    getStrategy(name) {
        const key = name.toUpperCase().replace(/\s*\+\s*/g, '_').replace(/\s+/g, '_');
        return this.strategies.get(key) || this.strategies.get('EMA_RSI');
    }
    evaluate(strategyName, asset, parameters) {
        return this.evaluateAsset(strategyName, asset, parameters);
    }
    evaluateAsset(strategyName, asset, parameters) {
        const strat = this.getStrategy(strategyName);
        return strat.evaluate(asset.price, asset.indicators, parameters);
    }
    evaluateFromCandles(strategyName, candles, parameters) {
        if (candles.length === 0) {
            return {
                signal: 'WAIT',
                confidence: 0,
                reason: 'No candle data available',
                indicators: indicator_service_1.indicatorService.calculateAllIndicators([]),
                disclaimer: STRATEGY_DISCLAIMER
            };
        }
        const indicators = indicator_service_1.indicatorService.calculateAllIndicators(candles);
        const strat = this.getStrategy(strategyName);
        return strat.generateSignal(candles, indicators, parameters);
    }
    getAllStrategyNames() {
        return Array.from(new Set(Array.from(this.strategies.values()).map(s => s.id)));
    }
    getAllStrategies() {
        return Array.from(new Set(Array.from(this.strategies.values())));
    }
}
exports.StrategyEngine = StrategyEngine;
exports.strategyEngine = new StrategyEngine();
