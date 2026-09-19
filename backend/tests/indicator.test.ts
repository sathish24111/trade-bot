import { indicatorService } from '../src/services/indicator.service';
import { Candle } from '../src/models/MarketData';

describe('Technical Indicator Math Verification', () => {
  test('calculateSMA correctly calculates Simple Moving Average', () => {
    const values = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
    const sma5 = indicatorService.calculateSMA(values, 5);

    // First 4 should be 0 (insufficient period)
    expect(sma5[0]).toBe(0);
    expect(sma5[3]).toBe(0);
    // Index 4: (10+11+12+13+14)/5 = 12
    expect(sma5[4]).toBe(12);
    // Index 5: (11+12+13+14+15)/5 = 13
    expect(sma5[5]).toBe(13);
    // Index 9: (15+16+17+18+19)/5 = 17
    expect(sma5[9]).toBe(17);
  });

  test('calculateEMA correctly applies exponential weighting', () => {
    const values = [10, 10, 10, 10, 10, 20, 20, 20, 20, 20];
    const ema5 = indicatorService.calculateEMA(values, 5);

    expect(ema5[4]).toBe(10); // Seeded with SMA
    expect(ema5[5]).toBeGreaterThan(10);
    expect(ema5[5]).toBeLessThan(20);
    expect(ema5[9]).toBeGreaterThan(ema5[5]);
  });

  test('calculateRSI stays within [0, 100] and reacts to momentum', () => {
    // Strictly increasing sequence
    const upPrices = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
    const rsiUp = indicatorService.calculateRSI(upPrices, 14);
    const lastUpRsi = rsiUp[rsiUp.length - 1];
    expect(lastUpRsi).toBe(100);

    // Strictly decreasing sequence
    const downPrices = [25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10];
    const rsiDown = indicatorService.calculateRSI(downPrices, 14);
    const lastDownRsi = rsiDown[rsiDown.length - 1];
    expect(lastDownRsi).toBe(0);
  });

  test('calculateMACD calculates line, signal, and histogram correctly', () => {
    const prices = Array.from({ length: 40 }, (_, i) => 100 + Math.sin(i / 3) * 10);
    const macd = indicatorService.calculateMACD(prices, 12, 26, 9);

    expect(macd.macdLine.length).toBe(prices.length);
    expect(macd.signalLine.length).toBe(prices.length);
    expect(macd.histogram.length).toBe(prices.length);

    // Histogram must equal macdLine - signalLine for valid indices
    for (let i = 30; i < prices.length; i++) {
      expect(macd.histogram[i]).toBeCloseTo(macd.macdLine[i] - macd.signalLine[i], 4);
    }
  });

  test('calculateBollingerBands maintains upper > middle > lower bands', () => {
    const prices = [
      100, 102, 101, 103, 104, 102, 105, 106, 104, 103,
      105, 107, 108, 106, 109, 110, 108, 107, 111, 112,
      110, 109, 113, 114, 112
    ];
    const bb = indicatorService.calculateBollingerBands(prices, 20, 2);

    for (let i = 20; i < prices.length; i++) {
      expect(bb.upper[i]).toBeGreaterThanOrEqual(bb.middle[i]);
      expect(bb.middle[i]).toBeGreaterThanOrEqual(bb.lower[i]);
    }
  });

  test('calculateATR computes positive non-zero True Range volatility', () => {
    const candles: Candle[] = Array.from({ length: 30 }, (_, i) => ({
      timestamp: 1000 + i * 60000,
      open: 100 + i,
      high: 103 + i,
      low: 99 + i,
      close: 102 + i,
      volume: 1000
    }));

    const atr = indicatorService.calculateATR(candles, 14);
    expect(atr.length).toBe(candles.length);
    for (let i = 14; i < candles.length; i++) {
      expect(atr[i]).toBeGreaterThan(0);
    }
  });

  test('calculateAllIndicators aggregates all technical indicators into structure', () => {
    const candles: Candle[] = Array.from({ length: 60 }, (_, i) => ({
      timestamp: 1000 + i * 60000,
      open: 1.0800 + i * 0.0002,
      high: 1.0810 + i * 0.0002,
      low: 1.0790 + i * 0.0002,
      close: 1.0805 + i * 0.0002,
      volume: 500
    }));

    const indicators = indicatorService.calculateAllIndicators(candles);

    expect(indicators.ema21).toBeGreaterThan(0);
    expect(indicators.sma20).toBeGreaterThan(0);
    expect(indicators.sma50).toBeGreaterThan(0);
    expect(indicators.rsi14).toBeGreaterThanOrEqual(0);
    expect(indicators.rsi14).toBeLessThanOrEqual(100);
    expect(indicators.macd).toBeDefined();
    expect(indicators.bollinger.upper).toBeGreaterThan(indicators.bollinger.lower);
    expect(indicators.atr14).toBeGreaterThan(0);
  });
});
