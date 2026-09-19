import { monteCarloService } from '../src/services/research/monteCarlo.service';
import { BacktestTrade } from '../src/services/backtesting.service';

describe('Phase 4 Monte Carlo Simulation Tests', () => {
  const sampleTrades: BacktestTrade[] = [
    { id: '1', asset: 'EUR/USD', direction: 'BUY', entryPrice: 1.1, exitPrice: 1.11, amount: 100, pnl: 40, result: 'WIN', timestamp: '2025-01-01' },
    { id: '2', asset: 'EUR/USD', direction: 'BUY', entryPrice: 1.1, exitPrice: 1.09, amount: 100, pnl: -30, result: 'LOSS', timestamp: '2025-01-02' },
    { id: '3', asset: 'EUR/USD', direction: 'SELL', entryPrice: 1.1, exitPrice: 1.09, amount: 100, pnl: 35, result: 'WIN', timestamp: '2025-01-03' },
    { id: '4', asset: 'EUR/USD', direction: 'BUY', entryPrice: 1.1, exitPrice: 1.12, amount: 100, pnl: 50, result: 'WIN', timestamp: '2025-01-04' },
    { id: '5', asset: 'EUR/USD', direction: 'BUY', entryPrice: 1.1, exitPrice: 1.08, amount: 100, pnl: -45, result: 'LOSS', timestamp: '2025-01-05' },
    { id: '6', asset: 'EUR/USD', direction: 'SELL', entryPrice: 1.1, exitPrice: 1.09, amount: 100, pnl: 25, result: 'WIN', timestamp: '2025-01-06' }
  ];

  test('Deterministic seed produces repeatable Monte Carlo distribution', async () => {
    const run1 = await monteCarloService.runSimulation({
      trades: sampleTrades,
      iterations: 200,
      initialBalance: 10000,
      seed: 42
    });

    const run2 = await monteCarloService.runSimulation({
      trades: sampleTrades,
      iterations: 200,
      initialBalance: 10000,
      seed: 42
    });

    expect(run1.finalBalanceDistribution.median).toBe(run2.finalBalanceDistribution.median);
    expect(run1.finalBalanceDistribution.p5).toBe(run2.finalBalanceDistribution.p5);
    expect(run1.worstCaseDrawdown).toBe(run2.worstCaseDrawdown);
  });

  test('Percentile ordering holds: p5 <= p25 <= median <= p75 <= p95', async () => {
    const result = await monteCarloService.runSimulation({
      trades: sampleTrades,
      iterations: 300,
      initialBalance: 10000,
      seed: 123
    });

    const b = result.finalBalanceDistribution;
    expect(b.p5).toBeLessThanOrEqual(b.p25);
    expect(b.p25).toBeLessThanOrEqual(b.median);
    expect(b.median).toBeLessThanOrEqual(b.p75);
    expect(b.p75).toBeLessThanOrEqual(b.p95);

    const d = result.maxDrawdownDistribution;
    expect(d.p5).toBeLessThanOrEqual(d.p25);
    expect(d.p25).toBeLessThanOrEqual(d.median);
    expect(d.median).toBeLessThanOrEqual(d.p75);
    expect(d.p75).toBeLessThanOrEqual(d.p95);
    expect(result.worstCaseDrawdown).toBeGreaterThanOrEqual(d.median);
  });

  test('Rejects empty trade history', async () => {
    await expect(
      monteCarloService.runSimulation({
        trades: [],
        iterations: 100
      })
    ).rejects.toThrow('Cannot run Monte Carlo simulation without historical trades');
  });
});
