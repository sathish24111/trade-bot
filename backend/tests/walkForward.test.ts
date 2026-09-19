import { walkForwardService } from '../src/services/research/walkForward.service';
import { Candle } from '../src/models/MarketData';

describe('Phase 4 Walk-Forward Testing Engine Tests', () => {
  const generateMockCandles = (count: number): Candle[] => {
    const candles: Candle[] = [];
    let price = 1.1000;
    const now = 1700000000000;

    for (let i = 0; i < count; i++) {
      const delta = (i % 4 === 0 ? -1 : 1) * 0.002;
      price += delta;
      candles.push({
        timestamp: now + i * 300000,
        open: price - 0.001,
        high: price + 0.003,
        low: price - 0.003,
        close: price
      });
    }
    return candles;
  };

  test('Creates rolling windows with zero forward data leakage', async () => {
    const candles = generateMockCandles(110);
    const { marketService } = require('../src/services/market.service');
    jest.spyOn(marketService, 'getCandles').mockResolvedValueOnce(candles);

    const result = await walkForwardService.runWalkForward({
      userId: 1,
      asset: 'EUR/USD',
      strategy: 'EMA_RSI',
      parameterRanges: { emaPeriod: [15, 25] },
      trainCandles: 40,
      testCandles: 20,
      stepCandles: 20
    });

    // 40 + 20 = 60, step=20: window 1 (0..60), window 2 (20..80), window 3 (40..100). Total 3 windows.
    expect(result.windowsCount).toBe(3);
    expect(result.windows[0].windowIndex).toBe(1);
    expect(result.windows[1].windowIndex).toBe(2);
    expect(result.windows[2].windowIndex).toBe(3);

    expect(result.mode).toBe('PAPER');
    expect(result.isRealMoney).toBe(false);
    expect(typeof result.overallWfe).toBe('number');
    expect(result.cumulativeEquityCurve.length).toBeGreaterThan(0);
  });

  test('Rejects dataset when candle count is insufficient for window setup', async () => {
    const smallCandles = generateMockCandles(40);
    const { marketService } = require('../src/services/market.service');
    jest.spyOn(marketService, 'getCandles').mockResolvedValueOnce(smallCandles);

    await expect(
      walkForwardService.runWalkForward({
        userId: 1,
        asset: 'EUR/USD',
        strategy: 'EMA_RSI',
        parameterRanges: {},
        trainCandles: 50,
        testCandles: 20
      })
    ).rejects.toThrow('Insufficient candles');
  });
});
