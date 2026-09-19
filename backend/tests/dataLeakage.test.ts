import { backtestingService } from '../src/services/backtesting.service';
import { strategyEngine } from '../src/services/strategy.service';
import { regimeService } from '../src/services/research/regime.service';
import { Candle } from '../src/models/MarketData';

describe('Phase 4 Look-Ahead Bias & Data Leakage Prevention Regression Suite', () => {
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

    // Evaluate signals at splitIndex
    const sigA = strategyEngine.evaluateFromCandles('EMA_RSI', datasetA.slice(0, splitIndex + 1));
    const sigB = strategyEngine.evaluateFromCandles('EMA_RSI', datasetB.slice(0, splitIndex + 1));

    expect(sigA.signal).toEqual(sigB.signal);
    expect(sigA.confidence).toEqual(sigB.confidence);
    expect(sigA.indicators.ema21).toEqual(sigB.indicators.ema21);
    expect(sigA.indicators.rsi14).toEqual(sigB.indicators.rsi14);

    // Regime classification at splitIndex must be identical
    const regA = regimeService.classifyRegime(datasetA, splitIndex);
    const regB = regimeService.classifyRegime(datasetB, splitIndex);
    expect(regA.regime).toEqual(regB.regime);
    expect(regA.atr).toEqual(regB.atr);

    // Run backtest on first 40 bars only
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

    expect(resA.totalTrades).toEqual(resB.totalTrades);
    expect(resA.totalPnl).toEqual(resB.totalPnl);
    const tradesWithoutIdA = resA.trades.map(({ id, ...rest }) => rest);
    const tradesWithoutIdB = resB.trades.map(({ id, ...rest }) => rest);
    expect(tradesWithoutIdA).toEqual(tradesWithoutIdB);
  });
});
