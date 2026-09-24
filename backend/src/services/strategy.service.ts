import { MarketAsset, TechnicalIndicators, Candle } from '../models/MarketData';
import { indicatorService } from './indicator.service';

export interface StrategyParameters {
  [key: string]: number | boolean | string;
}

export interface ParameterDefinition {
  key: string;
  label: string;
  type: 'number' | 'boolean' | 'string';
  defaultValue: number | boolean | string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  description?: string;
}

export interface StrategySignalResult {
  signal: 'BUY' | 'SELL' | 'WAIT';
  confidence: number;
  reason: string;
  indicators: TechnicalIndicators;
  disclaimer: string;
  parametersUsed?: StrategyParameters;
}

export interface TradingStrategy {
  id: string;
  name: string;
  description: string;
  defaultParameters: StrategyParameters;
  parameterDefinitions: ParameterDefinition[];

  generateSignal(
    candles: Candle[],
    indicators: TechnicalIndicators,
    parameters?: StrategyParameters
  ): StrategySignalResult;

  evaluate(
    price: number,
    indicators: TechnicalIndicators,
    parameters?: StrategyParameters
  ): StrategySignalResult;
}

const STRATEGY_DISCLAIMER =
  'Strategy confidence and metrics are algorithmically computed in DEMO/PAPER mode. No signal guarantees profit.';

// 1. EMA + RSI Strategy
export class EMA_RSI_Strategy implements TradingStrategy {
  id = 'EMA_RSI';
  name = 'EMA_RSI';
  description = 'Trend following EMA filter combined with Wilder RSI momentum bounds';

  defaultParameters: StrategyParameters = {
    emaPeriod: 21,
    rsiPeriod: 14,
    rsiOversold: 30,
    rsiOverbought: 70
  };

  parameterDefinitions: ParameterDefinition[] = [
    { key: 'emaPeriod', label: 'EMA Period', type: 'number', defaultValue: 21, min: 5, max: 80, step: 5 },
    { key: 'rsiPeriod', label: 'RSI Period', type: 'number', defaultValue: 14, min: 7, max: 28, step: 1 },
    { key: 'rsiOversold', label: 'RSI Oversold Level', type: 'number', defaultValue: 30, min: 15, max: 45, step: 5 },
    { key: 'rsiOverbought', label: 'RSI Overbought Level', type: 'number', defaultValue: 70, min: 55, max: 85, step: 5 }
  ];

  generateSignal(
    candles: Candle[],
    indicators: TechnicalIndicators,
    parameters?: StrategyParameters
  ): StrategySignalResult {
    const params = { ...this.defaultParameters, ...parameters };
    const price = candles.length > 0 ? candles[candles.length - 1].close : 0;

    let emaVal = indicators.ema21;
    let rsiVal = indicators.rsi14;

    // Recalculate indicators if custom periods differ from defaults and candles are available
    if (candles.length >= Number(params.emaPeriod)) {
      const closes = candles.map(c => c.close);
      const emaArr = indicatorService.calculateEMA(closes, Number(params.emaPeriod));
      emaVal = emaArr[emaArr.length - 1];
    }
    if (candles.length > Number(params.rsiPeriod)) {
      const closes = candles.map(c => c.close);
      const rsiArr = indicatorService.calculateRSI(closes, Number(params.rsiPeriod));
      rsiVal = rsiArr[rsiArr.length - 1];
    }

    const updatedInd: TechnicalIndicators = {
      ...indicators,
      ema21: Number(emaVal.toFixed(5)),
      rsi14: Number(rsiVal.toFixed(1))
    };

    return this.evaluate(price, updatedInd, params);
  }

  evaluate(
    price: number,
    indicators: TechnicalIndicators,
    parameters?: StrategyParameters
  ): StrategySignalResult {
    const params = { ...this.defaultParameters, ...parameters };
    const emaPeriod = Number(params.emaPeriod);
    const rsiOversold = Number(params.rsiOversold);
    const rsiOverbought = Number(params.rsiOverbought);

    const ema = indicators.ema21;
    const rsi = indicators.rsi14;

    let signal: 'BUY' | 'SELL' | 'WAIT' = 'WAIT';
    let confidence = 50;
    let reason = '';

    if (rsi <= rsiOversold) {
      // Oversold mean-reversion bounce
      signal = 'BUY';
      confidence = Math.min(88, Math.round(75 + (rsiOversold - rsi) * 1.2));
      reason = `RSI (${rsi}) in extreme oversold territory (<=${rsiOversold}); mean-reversion bounce BUY`;
    } else if (rsi >= rsiOverbought) {
      // Overbought mean-reversion pullback
      signal = 'SELL';
      confidence = Math.min(88, Math.round(75 + (rsi - rsiOverbought) * 1.2));
      reason = `RSI (${rsi}) in extreme overbought territory (>=${rsiOverbought}); mean-reversion pullback SELL`;
    } else if (price >= ema) {
      // Bullish trend filter
      if (rsi >= 45) {
        signal = 'BUY';
        confidence = Math.min(85, Math.round(65 + (rsi - 45) * 0.8));
        reason = `Bullish trend: Price (${price}) >= EMA${emaPeriod} (${ema}) with RSI (${rsi}) confirming upward momentum`;
      } else {
        // Minor pullback in uptrend -> dip buy
        signal = 'BUY';
        confidence = 68;
        reason = `Dip buy opportunity: Price above EMA${emaPeriod} with RSI (${rsi}) consolidating`;
      }
    } else {
      // Bearish trend filter
      if (rsi <= 55) {
        signal = 'SELL';
        confidence = Math.min(85, Math.round(65 + (55 - rsi) * 0.8));
        reason = `Bearish trend: Price (${price}) < EMA${emaPeriod} (${ema}) with RSI (${rsi}) confirming downward momentum`;
      } else {
        // Minor rally in downtrend -> fade rally
        signal = 'SELL';
        confidence = 68;
        reason = `Rally fade opportunity: Price below EMA${emaPeriod} with RSI (${rsi}) rejection`;
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

// 2. MACD Strategy
export class MACD_Strategy implements TradingStrategy {
  id = 'MACD';
  name = 'MACD';
  description = 'MACD line and signal crossover momentum tracking';

  defaultParameters: StrategyParameters = {
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9
  };

  parameterDefinitions: ParameterDefinition[] = [
    { key: 'fastPeriod', label: 'Fast EMA Period', type: 'number', defaultValue: 12, min: 6, max: 20, step: 2 },
    { key: 'slowPeriod', label: 'Slow EMA Period', type: 'number', defaultValue: 26, min: 20, max: 40, step: 2 },
    { key: 'signalPeriod', label: 'Signal EMA Period', type: 'number', defaultValue: 9, min: 5, max: 15, step: 1 }
  ];

  generateSignal(
    candles: Candle[],
    indicators: TechnicalIndicators,
    parameters?: StrategyParameters
  ): StrategySignalResult {
    const params = { ...this.defaultParameters, ...parameters };
    const price = candles.length > 0 ? candles[candles.length - 1].close : 0;

    let macd = indicators.macd;
    if (candles.length >= Number(params.slowPeriod)) {
      const closes = candles.map(c => c.close);
      const macdObj = indicatorService.calculateMACD(
        closes,
        Number(params.fastPeriod),
        Number(params.slowPeriod),
        Number(params.signalPeriod)
      );
      const lastIdx = closes.length - 1;
      macd = {
        value: Number(macdObj.macdLine[lastIdx].toFixed(5)),
        signal: Number(macdObj.signalLine[lastIdx].toFixed(5)),
        histogram: Number(macdObj.histogram[lastIdx].toFixed(5))
      };
    }

    const updatedInd: TechnicalIndicators = { ...indicators, macd };
    return this.evaluate(price, updatedInd, params);
  }

  evaluate(
    price: number,
    indicators: TechnicalIndicators,
    parameters?: StrategyParameters
  ): StrategySignalResult {
    const params = { ...this.defaultParameters, ...parameters };
    const { macd } = indicators;
    let signal: 'BUY' | 'SELL' | 'WAIT' = 'WAIT';
    let confidence = 50;
    let reason = '';

    if (macd.histogram > 0 || macd.value >= macd.signal) {
      signal = 'BUY';
      confidence = Math.min(86, 68 + Math.round(Math.min(18, Math.abs(macd.histogram) * 120)));
      reason = `Bullish MACD: Line (${macd.value}) above signal (${macd.signal}) with positive histogram (${macd.histogram})`;
    } else {
      signal = 'SELL';
      confidence = Math.min(86, 68 + Math.round(Math.min(18, Math.abs(macd.histogram) * 120)));
      reason = `Bearish MACD: Line (${macd.value}) below signal (${macd.signal}) with negative histogram (${macd.histogram})`;
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

// 3. Bollinger Bands Strategy
export class Bollinger_Strategy implements TradingStrategy {
  id = 'BOLLINGER_BANDS';
  name = 'BOLLINGER_BANDS';
  description = 'Statistical mean-reversion bounces off upper and lower Bollinger volatility bands';

  defaultParameters: StrategyParameters = {
    period: 20,
    stdDevMultiplier: 2.0
  };

  parameterDefinitions: ParameterDefinition[] = [
    { key: 'period', label: 'SMA Period', type: 'number', defaultValue: 20, min: 10, max: 40, step: 2 },
    { key: 'stdDevMultiplier', label: 'StdDev Multiplier', type: 'number', defaultValue: 2.0, min: 1.2, max: 3.0, step: 0.2 }
  ];

  generateSignal(
    candles: Candle[],
    indicators: TechnicalIndicators,
    parameters?: StrategyParameters
  ): StrategySignalResult {
    const params = { ...this.defaultParameters, ...parameters };
    const price = candles.length > 0 ? candles[candles.length - 1].close : 0;

    let bollinger = indicators.bollinger;
    if (candles.length >= Number(params.period)) {
      const closes = candles.map(c => c.close);
      const bbObj = indicatorService.calculateBollingerBands(
        closes,
        Number(params.period),
        Number(params.stdDevMultiplier)
      );
      const lastIdx = closes.length - 1;
      bollinger = {
        upper: Number(bbObj.upper[lastIdx].toFixed(5)),
        middle: Number(bbObj.middle[lastIdx].toFixed(5)),
        lower: Number(bbObj.lower[lastIdx].toFixed(5))
      };
    }

    const updatedInd: TechnicalIndicators = { ...indicators, bollinger };
    return this.evaluate(price, updatedInd, params);
  }

  evaluate(
    price: number,
    indicators: TechnicalIndicators,
    parameters?: StrategyParameters
  ): StrategySignalResult {
    const params = { ...this.defaultParameters, ...parameters };
    const { bollinger, rsi14 } = indicators;
    let signal: 'BUY' | 'SELL' | 'WAIT' = 'WAIT';
    let confidence = 50;
    let reason = '';

    const channelWidth = bollinger.upper - bollinger.lower || 1;
    const posInChannel = (price - bollinger.lower) / channelWidth; // 0 = at lower band, 1 = at upper band

    if (posInChannel <= 0.5) {
      // In lower half of Bollinger channel -> mean reversion bounce upwards
      signal = 'BUY';
      confidence = Math.min(88, Math.round(66 + (0.5 - posInChannel) * 40));
      reason = `Price (${price}) in lower Bollinger channel (${(posInChannel * 100).toFixed(1)}% of width); mean-reversion BUY targeting SMA (${bollinger.middle})`;
    } else {
      // In upper half of Bollinger channel -> mean reversion pullback downwards
      signal = 'SELL';
      confidence = Math.min(88, Math.round(66 + (posInChannel - 0.5) * 40));
      reason = `Price (${price}) in upper Bollinger channel (${(posInChannel * 100).toFixed(1)}% of width); mean-reversion SELL targeting SMA (${bollinger.middle})`;
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

// 4. Multi-Indicator Consensus Strategy
export class MultiIndicator_Strategy implements TradingStrategy {
  id = 'MULTI_INDICATOR';
  name = 'MULTI_INDICATOR';
  description = 'Consensus voting across EMA, RSI, MACD, and Bollinger Bands with confirmation threshold';

  defaultParameters: StrategyParameters = {
    emaPeriod: 21,
    rsiPeriod: 14,
    minConfirmations: 2
  };

  parameterDefinitions: ParameterDefinition[] = [
    { key: 'emaPeriod', label: 'EMA Period', type: 'number', defaultValue: 21, min: 10, max: 50, step: 5 },
    { key: 'rsiPeriod', label: 'RSI Period', type: 'number', defaultValue: 14, min: 7, max: 21, step: 1 },
    { key: 'minConfirmations', label: 'Minimum Confirmations', type: 'number', defaultValue: 2, min: 2, max: 4, step: 1 }
  ];

  generateSignal(
    candles: Candle[],
    indicators: TechnicalIndicators,
    parameters?: StrategyParameters
  ): StrategySignalResult {
    const params = { ...this.defaultParameters, ...parameters };
    const price = candles.length > 0 ? candles[candles.length - 1].close : 0;
    return this.evaluate(price, indicators, params);
  }

  evaluate(
    price: number,
    indicators: TechnicalIndicators,
    parameters?: StrategyParameters
  ): StrategySignalResult {
    const params = { ...this.defaultParameters, ...parameters };
    const { ema21, rsi14, macd, bollinger } = indicators;

    let buyVotes = 0;
    let sellVotes = 0;
    const voteDetails: string[] = [];

    // 1. EMA
    if (price >= ema21) {
      buyVotes++;
      voteDetails.push('Price>=EMA21');
    } else {
      sellVotes++;
      voteDetails.push('Price<EMA21');
    }

    // 2. RSI
    if (rsi14 >= 50 || rsi14 <= 30) {
      buyVotes++;
      voteDetails.push('RSI Bullish/Oversold');
    } else {
      sellVotes++;
      voteDetails.push('RSI Bearish/Overbought');
    }

    // 3. MACD
    if (macd.histogram >= 0 || macd.value >= macd.signal) {
      buyVotes++;
      voteDetails.push('MACD Bullish');
    } else {
      sellVotes++;
      voteDetails.push('MACD Bearish');
    }

    // 4. Bollinger
    if (price <= bollinger.middle) {
      buyVotes++;
      voteDetails.push('Bollinger Lower');
    } else {
      sellVotes++;
      voteDetails.push('Bollinger Upper');
    }

    let signal: 'BUY' | 'SELL' = buyVotes >= sellVotes ? 'BUY' : 'SELL';
    const winningVotes = Math.max(buyVotes, sellVotes);
    const confidence = winningVotes === 4 ? 88 : winningVotes === 3 ? 78 : 68;
    const reason = `Consensus ${signal} (${winningVotes}/4 signals: ${voteDetails.join(', ')})`;

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

// Strategy Engine
export class StrategyEngine {
  private strategies: Map<string, TradingStrategy> = new Map();

  constructor() {
    this.register(new EMA_RSI_Strategy());
    this.register(new MACD_Strategy());
    this.register(new Bollinger_Strategy());
    this.register(new MultiIndicator_Strategy());
  }

  register(strategy: TradingStrategy) {
    this.strategies.set(strategy.id.toUpperCase(), strategy);
    this.strategies.set(strategy.name.toUpperCase(), strategy);
  }

  getStrategy(name: string): TradingStrategy {
    const key = name.toUpperCase().replace(/\s*\+\s*/g, '_').replace(/\s+/g, '_');
    return this.strategies.get(key) || this.strategies.get('EMA_RSI')!;
  }

  evaluate(strategyName: string, asset: MarketAsset, parameters?: StrategyParameters): StrategySignalResult {
    return this.evaluateAsset(strategyName, asset, parameters);
  }

  evaluateAsset(strategyName: string, asset: MarketAsset, parameters?: StrategyParameters): StrategySignalResult {
    const strat = this.getStrategy(strategyName);
    return strat.evaluate(asset.price, asset.indicators, parameters);
  }

  evaluateFromCandles(
    strategyName: string,
    candles: Candle[],
    parameters?: StrategyParameters
  ): StrategySignalResult {
    if (candles.length === 0) {
      return {
        signal: 'WAIT',
        confidence: 0,
        reason: 'No candle data available',
        indicators: indicatorService.calculateAllIndicators([]),
        disclaimer: STRATEGY_DISCLAIMER
      };
    }
    const indicators = indicatorService.calculateAllIndicators(candles);
    const strat = this.getStrategy(strategyName);
    return strat.generateSignal(candles, indicators, parameters);
  }

  getAllStrategyNames(): string[] {
    return Array.from(new Set(Array.from(this.strategies.values()).map(s => s.id)));
  }

  getAllStrategies(): TradingStrategy[] {
    return Array.from(new Set(Array.from(this.strategies.values())));
  }
}

export const strategyEngine = new StrategyEngine();
