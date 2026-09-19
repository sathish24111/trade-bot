import { metricsService } from '../src/services/research/metrics.service';
import { BacktestTrade, BacktestEquityPoint } from '../src/services/backtesting.service';

describe('Phase 4 Metrics Service Tests', () => {
  const mockTrades: BacktestTrade[] = [
    {
      id: 't1',
      asset: 'EUR/USD',
      direction: 'BUY',
      entryPrice: 1.1000,
      exitPrice: 1.1050,
      amount: 100,
      pnl: 50,
      result: 'WIN',
      timestamp: '2025-01-10T10:00:00Z'
    },
    {
      id: 't2',
      asset: 'EUR/USD',
      direction: 'SELL',
      entryPrice: 1.1050,
      exitPrice: 1.1020,
      amount: 100,
      pnl: 30,
      result: 'WIN',
      timestamp: '2025-01-11T12:00:00Z'
    },
    {
      id: 't3',
      asset: 'EUR/USD',
      direction: 'BUY',
      entryPrice: 1.1020,
      exitPrice: 1.0980,
      amount: 100,
      pnl: -40,
      result: 'LOSS',
      timestamp: '2025-01-15T15:00:00Z'
    },
    {
      id: 't4',
      asset: 'EUR/USD',
      direction: 'BUY',
      entryPrice: 1.0980,
      exitPrice: 1.1040,
      amount: 100,
      pnl: 60,
      result: 'WIN',
      timestamp: '2025-02-05T09:00:00Z'
    }
  ];

  const mockEquityCurve: BacktestEquityPoint[] = [
    { timestamp: '2025-01-10T10:00:00Z', balance: 10000, equity: 10000, drawdownPercent: 0 },
    { timestamp: '2025-01-11T12:00:00Z', balance: 10050, equity: 10050, drawdownPercent: 0 },
    { timestamp: '2025-01-12T12:00:00Z', balance: 10080, equity: 10080, drawdownPercent: 0 },
    { timestamp: '2025-01-15T15:00:00Z', balance: 10040, equity: 10040, drawdownPercent: 0.4 },
    { timestamp: '2025-02-05T09:00:00Z', balance: 10100, equity: 10100, drawdownPercent: 0 }
  ];

  test('Calculates accurate return, win rate, and expectancy metrics', () => {
    const metrics = metricsService.calculateMetrics(mockTrades, mockEquityCurve, 10000);

    expect(metrics.totalTrades).toBe(4);
    expect(metrics.winningTrades).toBe(3);
    expect(metrics.losingTrades).toBe(1);
    expect(metrics.winRate).toBe(75.0);
    expect(metrics.grossProfit).toBe(140);
    expect(metrics.grossLoss).toBe(40);
    expect(metrics.netPnl).toBe(100);
    expect(metrics.returnPercent).toBe(1.0);
    expect(metrics.finalBalance).toBe(10100);

    // Average win = 140 / 3 = 46.67
    expect(metrics.averageWin).toBe(46.67);
    // Average loss = 40 / 1 = 40.0
    expect(metrics.averageLoss).toBe(40.0);
    // Expectancy = (0.75 * 46.67) - (0.25 * 40) = 35 - 10 = 25.0
    expect(metrics.expectancy).toBeCloseTo(25.0, 0);
  });

  test('Institutional Ratios: Computes Sharpe and Sortino with sample variance', () => {
    const metrics = metricsService.calculateMetrics(mockTrades, mockEquityCurve, 10000);

    expect(metrics.sharpeRatio).not.toBeNull();
    expect(typeof metrics.sharpeRatio).toBe('number');
    expect(metrics.sortinoRatio).not.toBeNull();
    expect(typeof metrics.sortinoRatio).toBe('number');
  });

  test('Edge Case: Single trade or zero variance returns null for Sharpe and Sortino', () => {
    const singleTrade: BacktestTrade[] = [
      {
        id: 'single',
        asset: 'EUR/USD',
        direction: 'BUY',
        entryPrice: 1.1000,
        exitPrice: 1.1050,
        amount: 100,
        pnl: 50,
        result: 'WIN',
        timestamp: '2025-01-10T10:00:00Z'
      }
    ];

    const metrics = metricsService.calculateMetrics(singleTrade, mockEquityCurve, 10000);
    expect(metrics.sharpeRatio).toBeNull();
    expect(metrics.sortinoRatio).toBeNull();
    expect(metrics.sampleSizeRating).toBe('VERY_SMALL');
    expect(metrics.sampleSizeWarning).toContain('<10 trades');
  });

  test('Edge Case: Zero max drawdown returns null for Calmar ratio', () => {
    const zeroDdCurve: BacktestEquityPoint[] = [
      { timestamp: '2025-01-10T10:00:00Z', balance: 10000, equity: 10000, drawdownPercent: 0 },
      { timestamp: '2025-01-11T10:00:00Z', balance: 10100, equity: 10100, drawdownPercent: 0 }
    ];
    const metrics = metricsService.calculateMetrics(mockTrades, zeroDdCurve, 10000);
    expect(metrics.calmarRatio).toBeNull();
  });

  test('Consecutive win and loss streaks are counted accurately', () => {
    const streakTrades: BacktestTrade[] = [
      { id: '1', asset: 'A', direction: 'BUY', entryPrice: 1, exitPrice: 2, amount: 10, pnl: 10, result: 'WIN', timestamp: '2025-01-01' },
      { id: '2', asset: 'A', direction: 'BUY', entryPrice: 1, exitPrice: 2, amount: 10, pnl: 10, result: 'WIN', timestamp: '2025-01-02' },
      { id: '3', asset: 'A', direction: 'BUY', entryPrice: 1, exitPrice: 2, amount: 10, pnl: 10, result: 'WIN', timestamp: '2025-01-03' },
      { id: '4', asset: 'A', direction: 'BUY', entryPrice: 1, exitPrice: 2, amount: 10, pnl: -10, result: 'LOSS', timestamp: '2025-01-04' },
      { id: '5', asset: 'A', direction: 'BUY', entryPrice: 1, exitPrice: 2, amount: 10, pnl: -10, result: 'LOSS', timestamp: '2025-01-05' }
    ];

    const metrics = metricsService.calculateMetrics(streakTrades, mockEquityCurve, 10000);
    expect(metrics.maxConsecutiveWins).toBe(3);
    expect(metrics.maxConsecutiveLosses).toBe(2);
  });

  test('Aggregates monthly performance into chronological buckets', () => {
    const monthly = metricsService.aggregateMonthlyPerformance(mockTrades, 10000);
    expect(monthly.length).toBe(2);
    expect(monthly[0].month).toBe('2025-01');
    expect(monthly[0].tradesCount).toBe(3);
    expect(monthly[0].netPnl).toBe(40); // 50 + 30 - 40

    expect(monthly[1].month).toBe('2025-02');
    expect(monthly[1].tradesCount).toBe(1);
    expect(monthly[1].netPnl).toBe(60);
  });
});
