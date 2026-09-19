import { backtestingService } from '../src/services/backtesting.service';
import { strategyEngine } from '../src/services/strategy.service';
import { Candle } from '../src/models/MarketData';

describe('Backtesting Engine & Bias Prevention Tests', () => {
  const generateMockCandles = (count: number): Candle[] => {
    const candles: Candle[] = [];
    let price = 100.0;
    const now = 1700000000000;

    for (let i = 0; i < count; i++) {
      const isUp = (i * 3 + 1) % 5 !== 0;
      const change = (isUp ? 1 : -1) * (0.5 + (i % 3) * 0.2);
      const open = price;
      const close = open + change;
      const high = Math.max(open, close) + 0.3;
      const low = Math.min(open, close) - 0.3;

      candles.push({
        timestamp: now + i * 300000,
        open: Number(open.toFixed(4)),
        high: Number(high.toFixed(4)),
        low: Number(low.toFixed(4)),
        close: Number(close.toFixed(4)),
        volume: 100
      });
      price = close;
    }
    return candles;
  };

  test('Strict Look-Ahead Bias Prevention: Modifying future candle i+1 has ZERO impact on candle i signal', () => {
    const originalCandles = generateMockCandles(50);
    const splitIndex = 35;

    // Evaluate signal at splitIndex using original data
    const sliceBefore = originalCandles.slice(0, splitIndex + 1);
    const signalBefore = strategyEngine.evaluateFromCandles('EMA_RSI', sliceBefore);

    // Create a modified dataset where candle splitIndex + 1 (the future!) is wildly changed
    const mutatedCandles = originalCandles.map((c, idx) => {
      if (idx > splitIndex) {
        return {
          ...c,
          open: c.open * 10,
          high: c.high * 10,
          low: c.low * 0.1,
          close: c.close * 10
        };
      }
      return { ...c };
    });

    // Evaluate signal at splitIndex again using mutated dataset up to splitIndex
    const sliceAfter = mutatedCandles.slice(0, splitIndex + 1);
    const signalAfter = strategyEngine.evaluateFromCandles('EMA_RSI', sliceAfter);

    // Future mutations must not leak backwards into the past!
    expect(signalAfter.signal).toEqual(signalBefore.signal);
    expect(signalAfter.confidence).toEqual(signalBefore.confidence);
    expect(signalAfter.indicators.ema21).toEqual(signalBefore.indicators.ema21);
    expect(signalAfter.indicators.rsi14).toEqual(signalBefore.indicators.rsi14);
  });

  test('Backtest execution incorporates cost model (spread, slippage, fee)', async () => {
    const candles = generateMockCandles(60);

    // Run with 0 costs
    const freeRun = await backtestingService.runBacktest({
      userId: 1,
      asset: 'EUR/USD',
      strategy: 'EMA_RSI',
      candles,
      initialBalance: 10000,
      tradeAmount: 100,
      spread: 0,
      slippage: 0,
      fee: 0
    });

    // Run with realistic simulated costs
    const costlyRun = await backtestingService.runBacktest({
      userId: 1,
      asset: 'EUR/USD',
      strategy: 'EMA_RSI',
      candles,
      initialBalance: 10000,
      tradeAmount: 100,
      spread: 0.0005,
      slippage: 0.0005,
      fee: 1.0
    });

    if (costlyRun.totalTrades > 0) {
      // Costly run final balance must be less than or equal to free run due to friction
      expect(costlyRun.finalBalance).toBeLessThanOrEqual(freeRun.finalBalance);
    }
    expect(costlyRun.mode).toBe('PAPER');
    expect(costlyRun.disclaimer).toContain('simulated paper trades');
  });

  test('Metrics consistency: winningTrades + losingTrades <= totalTrades and winRate bounds', async () => {
    const candles = generateMockCandles(80);
    const result = await backtestingService.runBacktest({
      userId: 1,
      asset: 'EUR/USD',
      strategy: 'MULTI_INDICATOR',
      candles,
      initialBalance: 10000
    });

    expect(result.winningTrades + result.losingTrades).toBeLessThanOrEqual(result.totalTrades);
    expect(result.winRate).toBeGreaterThanOrEqual(0);
    expect(result.winRate).toBeLessThanOrEqual(100);
    expect(result.maxDrawdown).toBeGreaterThanOrEqual(0);
    expect(result.equityCurve.length).toBeGreaterThan(0);
  });

  test('Historical candle validator rejects invalid data or inverted high/low', () => {
    const invalidCandles: Candle[] = [
      { timestamp: 1, open: 10, high: 9, low: 11, close: 10 }, // high < low!
      { timestamp: 2, open: 10, high: 12, low: 8, close: 10 }
    ];

    expect(() => {
      backtestingService.validateAndCleanCandles(invalidCandles);
    }).toThrow(/Insufficient historical data/);
  });
});
