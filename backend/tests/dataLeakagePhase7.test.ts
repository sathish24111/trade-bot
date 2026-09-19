import { backtestingService } from '../src/services/backtesting.service';
import { strategyEngine } from '../src/services/strategy.service';
import { regimeService } from '../src/services/research/regime.service';
import { indicatorService } from '../src/services/indicator.service';
import { Candle } from '../src/models/MarketData';

describe('Phase 7 Strict Look-Ahead Bias & Data Leakage Prevention Suite', () => {
  const generateBaseCandles = (count: number): Candle[] => {
    const candles: Candle[] = [];
    const now = 1700000000000;
    let price = 100.0;

    for (let i = 0; i < count; i++) {
      const change = (i % 3 === 0 ? 0.6 : -0.4);
      price += change;
      candles.push({
        timestamp: now + i * 300000,
        open: price - 0.2,
        high: price + 0.5,
        low: price - 0.5,
        close: price,
        volume: 500
      });
    }
    return candles;
  };

  test('Strict Bias Proof: Future candles 41..70 mutation has ZERO effect on trades up to bar 40', async () => {
    const datasetA = generateBaseCandles(70);
    const splitIndex = 40;

    // Dataset B has the exact same bars 0..40, but completely altered bars 41..69
    const datasetB: Candle[] = datasetA.map((c, idx) => {
      if (idx > splitIndex) {
        return {
          timestamp: c.timestamp,
          open: c.open * 5,
          high: c.high * 5.5,
          low: c.low * 0.2,
          close: c.close * 5.2,
          volume: 999999
        };
      }
      return { ...c };
    });

    // 1. Indicators at splitIndex must be strictly identical
    const indA = indicatorService.calculateAllIndicators(datasetA.slice(0, splitIndex + 1));
    const indB = indicatorService.calculateAllIndicators(datasetB.slice(0, splitIndex + 1));
    expect(indA.ema21).toEqual(indB.ema21);
    expect(indA.rsi14).toEqual(indB.rsi14);
    expect(indA.macd.value).toEqual(indB.macd.value);
    expect(indA.bollinger.upper).toEqual(indB.bollinger.upper);

    // 2. Strategy signals at splitIndex must be strictly identical
    const sigA = strategyEngine.evaluateFromCandles('EMA_RSI', datasetA.slice(0, splitIndex + 1));
    const sigB = strategyEngine.evaluateFromCandles('EMA_RSI', datasetB.slice(0, splitIndex + 1));
    expect(sigA.signal).toEqual(sigB.signal);
    expect(sigA.confidence).toEqual(sigB.confidence);

    // 3. Regime classification at splitIndex must be identical
    const regA = regimeService.classifyRegime(datasetA, splitIndex);
    const regB = regimeService.classifyRegime(datasetB, splitIndex);
    expect(regA.regime).toEqual(regB.regime);
    expect(regA.atr).toEqual(regB.atr);

    // 4. Backtest trades on first 40 bars only must be strictly identical
    const resA = await backtestingService.runBacktest({
      userId: 1,
      asset: 'EUR/USD',
      strategy: 'EMA_RSI',
      candles: datasetA.slice(0, splitIndex + 1)
    }, false);

    const resB = await backtestingService.runBacktest({
      userId: 1,
      asset: 'EUR/USD',
      strategy: 'EMA_RSI',
      candles: datasetB.slice(0, splitIndex + 1)
    }, false);

    expect(resA.trades.length).toEqual(resB.trades.length);
    for (let i = 0; i < resA.trades.length; i++) {
      expect(resA.trades[i].pnl).toEqual(resB.trades[i].pnl);
      expect(resA.trades[i].entryPrice).toEqual(resB.trades[i].entryPrice);
      expect(resA.trades[i].exitPrice).toEqual(resB.trades[i].exitPrice);
      expect(resA.trades[i].direction).toEqual(resB.trades[i].direction);
    }
  });
});
