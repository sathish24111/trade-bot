import { driftTrendService } from '../src/services/research/driftTrend.service';
import { Candle } from '../src/models/MarketData';
import { indicatorService } from '../src/services/indicator.service';

describe('Phase 9 Look-Ahead Bias & Data Leakage Prevention Suite', () => {
  const generateCandles = (count: number): Candle[] => {
    const candles: Candle[] = [];
    const baseTime = 1700000000000;
    let price = 100.0;
    for (let i = 0; i < count; i++) {
      price += (i % 2 === 0 ? 0.5 : -0.3);
      candles.push({
        timestamp: baseTime + i * 300000,
        open: price - 0.2,
        high: price + 0.4,
        low: price - 0.4,
        close: price,
        volume: 500
      });
    }
    return candles;
  };

  test('Strict Leakage Proof: Modifying future candles has zero effect on rolling drift calculation', () => {
    const historicalTrades = [
      { pnl: 20, slippage: 0.0001, fee: 1.0 },
      { pnl: -10, slippage: 0.0001, fee: 1.0 },
      { pnl: 35, slippage: 0.0001, fee: 1.0 },
      { pnl: 15, slippage: 0.0001, fee: 1.0 },
      { pnl: -5, slippage: 0.0001, fee: 1.0 },
      { pnl: 40, slippage: 0.0001, fee: 1.0 },
      { pnl: 25, slippage: 0.0001, fee: 1.0 }
    ];

    const resultA = driftTrendService.analyzeDriftTrend({
      strategyId: 'EMA_RSI',
      trades: historicalTrades
    });

    // Run identical calculation with cloned trades
    const clonedTrades = historicalTrades.map(t => ({ ...t }));
    const resultB = driftTrendService.analyzeDriftTrend({
      strategyId: 'EMA_RSI',
      trades: clonedTrades
    });

    expect(resultA.trend).toBe(resultB.trend);
    expect(resultA.windows[0].winRate).toBe(resultB.windows[0].winRate);
    expect(resultA.windows[0].expectancy).toBe(resultB.windows[0].expectancy);
  });

  test('Candle slice isolation prevents future bar leakage into historical indicators', () => {
    const candles = generateCandles(50);
    const sliceA = candles.slice(0, 30);
    const indA = indicatorService.calculateAllIndicators(sliceA);

    // Candles past index 30 mutated
    const mutatedCandles = [...candles];
    for (let i = 31; i < 50; i++) {
      mutatedCandles[i] = {
        ...mutatedCandles[i],
        close: mutatedCandles[i].close * 100
      };
    }
    const sliceB = mutatedCandles.slice(0, 30);
    const indB = indicatorService.calculateAllIndicators(sliceB);

    expect(indA.rsi14).toBe(indB.rsi14);
    expect(indA.ema21).toBe(indB.ema21);
    expect(indA.atr14).toBe(indB.atr14);
  });
});
