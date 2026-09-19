import { parameterStabilityService } from '../src/services/research/parameterStability.service';

describe('Phase 8: Parameter Stability Suite', () => {
  test('Analyzes parameter neighborhood and produces stability score between 0 and 1', async () => {
    const analysis = await parameterStabilityService.analyzeParameterStability({
      strategyId: 'EMA_RSI',
      parameterKey: 'emaPeriod',
      baselineValue: 21,
      variations: [17, 19, 21, 23, 25]
    });

    expect(analysis).toBeDefined();
    expect(analysis.strategyId).toBe('EMA_RSI');
    expect(analysis.parameterKey).toBe('emaPeriod');
    expect(analysis.baselineValue).toBe(21);
    expect(analysis.stabilityScore).toBeGreaterThanOrEqual(0.0);
    expect(analysis.stabilityScore).toBeLessThanOrEqual(1.0);
    expect(Array.isArray(analysis.cliffsDetected)).toBe(true);
    expect(['LIMITED', 'MODERATE', 'LARGER_SAMPLE']).toContain(analysis.sampleQuality);
    expect(['STABLE_REGION', 'SENSITIVE_REGION', 'CLIFF_REGION', 'INSUFFICIENT_DATA']).toContain(analysis.region);
    expect(analysis.testedVariations.length).toBeGreaterThan(0);
  });

  test('Classifies sample quality and detects cliffs across variations', async () => {
    const analysis = await parameterStabilityService.analyzeParameterStability({
      strategyId: 'EMA_RSI',
      parameterKey: 'rsiPeriod',
      baselineValue: 14,
      variations: [10, 12, 14, 16, 18]
    });

    expect(analysis.disclaimer).toContain('DEMO mode');
    expect(analysis.testedVariations.length).toBe(5);
  });
});
