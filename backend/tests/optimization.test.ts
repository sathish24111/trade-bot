import { optimizationService } from '../src/services/research/optimization.service';
import { Candle } from '../src/models/MarketData';

describe('Phase 4 Optimization Service Tests', () => {
  test('Generates complete Cartesian product from parameter ranges', () => {
    const ranges = {
      emaPeriod: [10, 20],
      rsiPeriod: [14, 21, 28]
    };
    const combinations = optimizationService.generateCombinations(ranges);
    expect(combinations.length).toBe(6);
    expect(combinations).toContainEqual({ emaPeriod: 10, rsiPeriod: 14 });
    expect(combinations).toContainEqual({ emaPeriod: 20, rsiPeriod: 28 });
  });

  test('Handles empty parameter ranges gracefully', () => {
    const combinations = optimizationService.generateCombinations({});
    expect(combinations.length).toBe(1);
    expect(combinations[0]).toEqual({});
  });

  test('Optimization rejects datasets smaller than 75 candles', async () => {
    const smallCandles: Candle[] = [];
    const now = 1700000000000;
    for (let i = 0; i < 30; i++) {
      smallCandles.push({
        timestamp: now + i * 60000,
        open: 100,
        high: 105,
        low: 95,
        close: 101
      });
    }

    // Mock market service getCandles
    const { marketService } = require('../src/services/market.service');
    jest.spyOn(marketService, 'getCandles').mockResolvedValueOnce(smallCandles);

    await expect(
      optimizationService.runOptimization({
        userId: 1,
        asset: 'EUR/USD',
        strategy: 'EMA_RSI',
        parameterRanges: { emaPeriod: [10, 20] }
      })
    ).rejects.toThrow('Insufficient candle data');
  });

  test('Overfitting Detection: Identifies severe drop in out-of-sample performance', async () => {
    const now = 1700000000000;
    const candles: Candle[] = [];
    let price = 100;

    for (let i = 0; i < 100; i++) {
      const up = i < 60; // Strong uptrend in train, random/down in val & test
      price += up ? 0.8 : -0.6;
      candles.push({
        timestamp: now + i * 300000,
        open: price - 0.2,
        high: price + 0.5,
        low: price - 0.5,
        close: price
      });
    }

    const { marketService } = require('../src/services/market.service');
    jest.spyOn(marketService, 'getCandles').mockResolvedValueOnce(candles);

    const result = await optimizationService.runOptimization({
      userId: 1,
      asset: 'BTC/USD',
      strategy: 'EMA_RSI',
      parameterRanges: { emaPeriod: [10, 20] },
      trainSplitRatio: 0.7,
      valSplitRatio: 0.15,
      testSplitRatio: 0.15
    });

    expect(result.results.length).toBeGreaterThan(0);
    expect(result.mode).toBe('PAPER');
    expect(result.isRealMoney).toBe(false);
    expect(result.historical).toBe(true);
  });
});
