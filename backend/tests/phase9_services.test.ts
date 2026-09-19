import { evidenceQualityService } from '../src/services/research/evidenceQuality.service';
import { experimentDiffService } from '../src/services/research/experimentDiff.service';
import { paperExperimentWatchdogService } from '../src/services/research/paperExperimentWatchdog.service';
import { stressMatrixService } from '../src/services/research/stressMatrix.service';
import { portfolioWhatIfService } from '../src/services/research/portfolioWhatIf.service';

describe('Phase 9 Multi-Service Verification Suite', () => {
  test('Evidence Quality Service evaluates strategy evidence and builds matrix', async () => {
    const item = await evidenceQualityService.evaluateStrategyEvidence('EMA_RSI');
    expect(item).toBeDefined();
    expect(item.strategyId).toBe('EMA_RSI');
    expect(item.overallEvidenceLevel).toBeDefined();
    expect(['VERY_LIMITED', 'LIMITED', 'MODERATE', 'SUBSTANTIAL']).toContain(item.overallEvidenceLevel);

    const matrix = await evidenceQualityService.getEvidenceMatrix();
    expect(Array.isArray(matrix)).toBe(true);
    expect(matrix.length).toBeGreaterThanOrEqual(4);
  });

  test('Experiment Diff & Lineage computes structural configuration differences', async () => {
    const lineage = await experimentDiffService.getLineageTree('EXP_ROOT');
    expect(Array.isArray(lineage)).toBe(true);
    if (lineage.length > 0) {
      expect(lineage[0].experimentId).toBeDefined();
    }
  });


  test('Paper Experiment Watchdog inspects experiments and records alerts', async () => {
    const inspection = await paperExperimentWatchdogService.inspectExperiments();
    expect(inspection).toBeDefined();
    expect(typeof inspection.inspectedCount).toBe('number');
    expect(Array.isArray(inspection.events)).toBe(true);
    expect(Array.isArray(inspection.pausedExperiments)).toBe(true);
  });

  test('Stress Matrix computes 2D parameter shock grid', async () => {
    const matrix = await stressMatrixService.computeStressMatrix({
      strategyId: 'EMA_RSI',
      matrixType: 'COST_X_SLIPPAGE',
      xDimensionValues: [0, 10, 25],
      yDimensionValues: [0, 10, 20]
    });

    expect(matrix).toBeDefined();
    expect(matrix.strategyId).toBe('EMA_RSI');
    expect(matrix.grid.length).toBe(3);
    expect(matrix.grid[0].length).toBe(3);
    expect(['ROBUST', 'SENSITIVE', 'FRAGILE', 'INSUFFICIENT_DATA']).toContain(matrix.overallRobustness);
  });

  test('Portfolio What-If simulates counterfactual scenario impact', async () => {
    const whatIf = await portfolioWhatIfService.simulateWhatIf({
      scenarioName: 'Test Cost Shock 2x',
      scenario: {
        costMultiplier: 2.0,
        slippageMultiplier: 1.5,
        volatilityShockPct: 10.0
      }
    });

    expect(whatIf).toBeDefined();
    expect(whatIf.scenarioName).toBe('Test Cost Shock 2x');
    expect(whatIf.simulatedEquity).toBeLessThanOrEqual(whatIf.baselineEquity);
    expect(whatIf.simulatedDrawdown).toBeGreaterThanOrEqual(whatIf.baselineDrawdown);
    expect(Array.isArray(whatIf.riskContributions)).toBe(true);
  });
});
