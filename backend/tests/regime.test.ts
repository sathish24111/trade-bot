import { regimeService } from '../src/services/research/regime.service';
import { Candle } from '../src/models/MarketData';
import { BacktestTrade } from '../src/services/backtesting.service';

describe('Phase 4 Market Regime Analysis Tests', () => {
  const generateRegimeCandles = (): Candle[] => {
    const candles: Candle[] = [];
    const now = 1700000000000;
    let price = 100.0;

    for (let i = 0; i < 60; i++) {
      // Create price changes
      const isHighVol = i > 45;
      const spread = isHighVol ? 3.0 : 0.4;
      price += (i % 2 === 0 ? 1 : -1) * spread;

      candles.push({
        timestamp: now + i * 300000,
        open: price - 0.2,
        high: price + spread,
        low: price - spread,
        close: price,
        volume: 1000
      });
    }
    return candles;
  };

  test('Classifies regime with zero look-ahead bias', () => {
    const candles = generateRegimeCandles();
    const result = regimeService.classifyRegime(candles, 30);

    expect(['TRENDING', 'RANGING', 'HIGH_VOLATILITY', 'LOW_VOLATILITY']).toContain(result.regime);
    expect(result.timestamp).toBe(candles[30].timestamp);
    expect(typeof result.atr).toBe('number');
    expect(typeof result.bollingerWidth).toBe('number');
  });

  test('Detects elevated volatility when ATR jumps significantly', () => {
    const candles = generateRegimeCandles();
    // Index 55 is in the high volatility phase
    const result = regimeService.classifyRegime(candles, 55);
    expect(result.regime).toBe('HIGH_VOLATILITY');
  });

  test('Aggregates performance by regime accurately', () => {
    const trades: BacktestTrade[] = [
      { id: '1', asset: 'EUR/USD', direction: 'BUY', entryPrice: 1, exitPrice: 1.1, amount: 100, pnl: 50, result: 'WIN', timestamp: 'ts1' },
      { id: '2', asset: 'EUR/USD', direction: 'SELL', entryPrice: 1, exitPrice: 1.05, amount: 100, pnl: -20, result: 'LOSS', timestamp: 'ts2' },
      { id: '3', asset: 'EUR/USD', direction: 'BUY', entryPrice: 1, exitPrice: 1.08, amount: 100, pnl: 30, result: 'WIN', timestamp: 'ts3' }
    ];

    const regimeMap = new Map<string, any>([
      ['ts1', 'TRENDING'],
      ['ts2', 'TRENDING'],
      ['ts3', 'RANGING']
    ]);

    const performance = regimeService.aggregatePerformanceByRegime(trades, regimeMap);

    const trending = performance.find(p => p.regime === 'TRENDING')!;
    expect(trending.tradesCount).toBe(2);
    expect(trending.winningTrades).toBe(1);
    expect(trending.losingTrades).toBe(1);
    expect(trending.netPnl).toBe(30);

    const ranging = performance.find(p => p.regime === 'RANGING')!;
    expect(ranging.tradesCount).toBe(1);
    expect(ranging.netPnl).toBe(30);
  });
});
