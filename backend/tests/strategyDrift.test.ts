import { strategyDriftService } from '../src/services/monitoring/strategyDrift.service';

describe('Strategy Drift Service Tests', () => {
  test('calculates drift comparing backtest baseline to paper trading results', async () => {
    const metric = await strategyDriftService.calculateDrift({
      strategy: 'EMA_RSI',
      asset: 'BTC/USD',
      timeframe: '5m',
      paperTrades: [
        { pnl: 50.0, amount: 1000.0, result: 'WIN' },
        { pnl: 40.0, amount: 1000.0, result: 'WIN' },
        { pnl: -30.0, amount: 1000.0, result: 'LOSS' }
      ]
    });

    expect(metric).toBeDefined();
    expect(metric.strategy).toBe('EMA_RSI');
    expect(metric.asset).toBe('BTC/USD');
    expect(metric.backtestWinRate).toBeGreaterThanOrEqual(0.0);
    expect(metric.paperWinRate).toBe(66.67);
    expect(['STABLE', 'WATCH', 'SIGNIFICANT', 'CRITICAL']).toContain(metric.classification);
  });

  test('classifies severe performance drop as CRITICAL drift', async () => {
    const metric = await strategyDriftService.calculateDrift({
      strategy: 'EMA_RSI',
      asset: 'BTC/USD',
      timeframe: '5m',
      paperTrades: [
        { pnl: -50.0, amount: 1000.0, result: 'LOSS' },
        { pnl: -40.0, amount: 1000.0, result: 'LOSS' },
        { pnl: -30.0, amount: 1000.0, result: 'LOSS' },
        { pnl: -20.0, amount: 1000.0, result: 'LOSS' }
      ]
    });

    expect(metric.paperWinRate).toBe(0.0);
    expect(metric.winRateDrift).toBeGreaterThan(20.0);
    expect(metric.classification).toBe('CRITICAL');
  });
});
