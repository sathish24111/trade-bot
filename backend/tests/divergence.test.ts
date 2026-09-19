import { divergenceService } from '../src/services/monitoring/divergence.service';
import { experimentService } from '../src/services/research/experiment.service';

describe('Backtest vs Paper Divergence Engine Tests', () => {
  test('generates structured multi-dimensional divergence report', async () => {
    // Create an experiment first
    const exp = await experimentService.createExperiment({
      userId: 1,
      name: 'Divergence Test Experiment',
      strategy: 'EMA_RSI',
      asset: 'BTC/USD',
      timeframe: '5m'
    });

    const report = await divergenceService.analyzeDivergence(exp.id);
    expect(report).toBeDefined();
    expect(report.experimentId).toBe(exp.id);
    expect(report.strategy).toBe('EMA_RSI');
    expect(report.backtest).toBeDefined();
    expect(report.paper).toBeDefined();
    expect(report.divergence).toBeDefined();
    expect(report.divergence.slippageDivergencePct).toBeDefined();
    expect(report.classification).toBeDefined();
  });
});
