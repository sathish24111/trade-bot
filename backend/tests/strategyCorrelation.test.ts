import { strategyCorrelationService } from '../src/services/research/strategyCorrelation.service';

describe('Phase 8: Strategy Correlation Suite', () => {
  test('Strategy correlation matrix returns Pearson values between -1.0 and 1.0', async () => {
    const matrix = await strategyCorrelationService.calculateStrategyCorrelationMatrix({
      asset: 'BTC/USD',
      timeframe: '5m'
    });

    expect(matrix).toBeDefined();
    expect(matrix.strategies.length).toBeGreaterThanOrEqual(2);
    expect(matrix.matrix.length).toBe(matrix.strategies.length);

    // Diagonal elements must be exactly 1.0 (self-correlation)
    for (let i = 0; i < matrix.strategies.length; i++) {
      expect(matrix.matrix[i][i]).toBeCloseTo(1.0, 5);
      for (let j = 0; j < matrix.strategies.length; j++) {
        const val = matrix.matrix[i][j];
        expect(val).toBeGreaterThanOrEqual(-1.0);
        expect(val).toBeLessThanOrEqual(1.0);
        // Symmetric matrix
        expect(val).toBeCloseTo(matrix.matrix[j][i], 5);
      }
    }
  });

  test('Rolling correlation computes time-series windows properly', () => {
    const sampleReturnsA = [0.01, 0.02, -0.01, 0.03, -0.02, 0.01, 0.04, -0.01, 0.02, -0.03, 0.01, 0.02];
    const sampleReturnsB = [0.02, 0.01, -0.02, 0.02, -0.01, 0.02, 0.03, -0.02, 0.01, -0.01, 0.02, 0.01];

    const rolling = strategyCorrelationService.calculateRollingCorrelation(
      sampleReturnsA,
      sampleReturnsB,
      5
    );

    expect(Array.isArray(rolling)).toBe(true);
    expect(rolling.length).toBeGreaterThan(0);
    for (const pt of rolling) {
      expect(pt.timestamp).toBeDefined();
      expect(pt.correlation).toBeGreaterThanOrEqual(-1.0);
      expect(pt.correlation).toBeLessThanOrEqual(1.0);
    }
  });

  test('Regime correlations segment behavior across market regimes', () => {
    const regimeResults = strategyCorrelationService.calculateRegimeCorrelations();

    expect(Array.isArray(regimeResults)).toBe(true);
    expect(regimeResults.length).toBeGreaterThan(0);
    for (const r of regimeResults) {
      expect(r.regime).toBeDefined();
      expect(r.correlation).toBeGreaterThanOrEqual(-1.0);
      expect(r.correlation).toBeLessThanOrEqual(1.0);
      expect(r.sampleSize).toBeGreaterThanOrEqual(0);
    }
  });
});
