import { v2_2_freshValidationService } from '../src/services/research/v2_2_fresh_validation.service';
import { FreshValidationTradeEntry } from '../src/models/StrategyV2_2';

describe('STRATEGY V2.2 — EXTENDED FRESH VALIDATION TEST SUITE', () => {
  let freshDataset: FreshValidationTradeEntry[];

  beforeAll(async () => {
    freshDataset = await v2_2_freshValidationService.getOrSeedFreshDataset(160);
  });

  test('1. Fresh Dataset Isolation & Completeness (V2.2_FRESH)', () => {
    expect(freshDataset.length).toBeGreaterThanOrEqual(100);
    expect(freshDataset.length).toBe(160);

    freshDataset.forEach(trade => {
      expect(trade.datasetId).toBe('V2.2_FRESH');
      expect(trade.id).toBeDefined();
      expect(trade.signalId).toBeDefined();
      expect(trade.strategyVersion).toBe('STRATEGY_V2.2_VALIDATION');
      expect(trade.experimentVariant).toBeDefined();
      expect(['R_10', 'R_25', 'R_50', 'R_75', 'R_100']).toContain(trade.asset);
      expect(['BUY', 'SELL']).toContain(trade.direction);
      expect(['TRENDING_UP', 'TRENDING_DOWN', 'RANGING', 'HIGH_VOLATILITY', 'COMPRESSION', 'LOW_VOLATILITY']).toContain(trade.regime);
      expect(typeof trade.signalScore).toBe('number');
      expect(typeof trade.emaScore).toBe('number');
      expect(typeof trade.rsiScore).toBe('number');
      expect(typeof trade.macdScore).toBe('number');
      expect(typeof trade.bollingerScore).toBe('number');
      expect(typeof trade.momentumScore).toBe('number');
      expect(typeof trade.volatilityScore).toBe('number');
      expect(typeof trade.entryPrice).toBe('number');
      expect(typeof trade.exitPrice).toBe('number');
      expect(typeof trade.contractDuration).toBe('number');
      expect(typeof trade.payout).toBe('number');
      expect(typeof trade.pnl).toBe('number');
      expect(['WIN', 'LOSS']).toContain(trade.result);
      expect(typeof trade.timestamp).toBe('number');
      expect(trade.dataQuality).toBe('HEALTHY');
      expect(trade.riskChecksPassed).toBe(true);
      expect(trade.signalInvalidationState).toBe('VALID');
    });
  });

  test('2. Experiment Rotation & Opportunity Tracking', () => {
    const variants = freshDataset.map(t => t.experimentVariant);
    const controlCount = variants.filter(v => v === 'V2_BASELINE').length;
    const expACount = variants.filter(v => v === 'V2.2_HIGH_VOL_30S').length;
    const expBCount = variants.filter(v => v === 'V2.2_RANGING_CONFLUENCE').length;
    const expCCount = variants.filter(v => v === 'V2.2_LOW_REGIME_80').length;

    expect(controlCount).toBe(40);
    expect(expACount).toBe(40);
    expect(expBCount).toBe(40);
    expect(expCCount).toBe(40);

    // Verifies opportunities are rotated sequentially without clustering
    for (let i = 0; i < 8; i += 4) {
      expect(freshDataset[i].experimentVariant).toBe('V2_BASELINE');
      expect(freshDataset[i + 1].experimentVariant).toBe('V2.2_HIGH_VOL_30S');
      expect(freshDataset[i + 2].experimentVariant).toBe('V2.2_RANGING_CONFLUENCE');
      expect(freshDataset[i + 3].experimentVariant).toBe('V2.2_LOW_REGIME_80');
    }
  });

  test('3. Variant Isolation (No mixing of independent variables)', async () => {
    const dashboard = await v2_2_freshValidationService.getFreshValidationDashboard();
    const matrix = dashboard.experimentMatrix;

    expect(matrix).toHaveLength(4);
    const [control, expA, expB, expC] = matrix;

    expect(control.role).toBe('CONTROL');
    expect(control.condition).toBe('ALL_REGIMES');

    expect(expA.role).toBe('EXPERIMENT');
    expect(expA.condition).toBe('HIGH_VOLATILITY');
    expect(expA.parameterDescription).toContain('30-second duration');

    expect(expB.role).toBe('EXPERIMENT');
    expect(expB.condition).toBe('RANGING');
    expect(expB.parameterDescription).toContain('Bollinger Confluence');

    expect(expC.role).toBe('EXPERIMENT');
    expect(expC.condition).toBe('RANGING/COMPRESSION');
    expect(expC.parameterDescription).toContain('Score threshold >= 80');
  });

  test('4. Sample-Size Protection Rules (< 30, 30-99, >= 100)', () => {
    expect(v2_2_freshValidationService.getSampleStatus(15)).toBe('INSUFFICIENT_SAMPLE');
    expect(v2_2_freshValidationService.getSampleStatus(29)).toBe('INSUFFICIENT_SAMPLE');
    expect(v2_2_freshValidationService.getSampleStatus(30)).toBe('LIMITED_SAMPLE');
    expect(v2_2_freshValidationService.getSampleStatus(75)).toBe('LIMITED_SAMPLE');
    expect(v2_2_freshValidationService.getSampleStatus(99)).toBe('LIMITED_SAMPLE');
    expect(v2_2_freshValidationService.getSampleStatus(100)).toBe('ADEQUATE_SAMPLE');
    expect(v2_2_freshValidationService.getSampleStatus(250)).toBe('ADEQUATE_SAMPLE');
  });

  test('5. 95% Confidence Interval Calculation for Win Rate', () => {
    // 60 wins out of 100
    const ci100 = v2_2_freshValidationService.calculateConfidenceInterval95(60, 100);
    expect(ci100.pointEstimate).toBe(60.0);
    expect(ci100.lowerBound).toBeLessThan(60.0);
    expect(ci100.upperBound).toBeGreaterThan(60.0);
    expect(ci100.marginOfError).toBeCloseTo(9.6, 0); // ~9.6% margin

    // 0 wins or 0 total handles gracefully
    const ciEmpty = v2_2_freshValidationService.calculateConfidenceInterval95(0, 0);
    expect(ciEmpty.pointEstimate).toBe(0);
  });

  test('6. Categorical Breakdowns (Asset, Regime, Score, Duration)', () => {
    const breakdowns = v2_2_freshValidationService.computeBreakdowns(freshDataset);

    expect(Object.keys(breakdowns.assetAnalysis)).toEqual(['R_10', 'R_25', 'R_50', 'R_75', 'R_100']);
    expect(Object.keys(breakdowns.regimeAnalysis)).toContain('HIGH_VOLATILITY');
    expect(Object.keys(breakdowns.scoreAnalysis)).toContain('80-89');
    expect(Object.keys(breakdowns.durationAnalysis)).toContain('30 seconds');

    // Check each breakdown includes confidence interval and sample status
    Object.values(breakdowns.assetAnalysis).forEach(b => {
      expect(b.confidenceInterval95).toBeDefined();
      expect(b.sampleStatus).toBeDefined();
    });
  });

  test('7. Chronological OOS 70/15/15 Validation on Fresh Dataset with Zero Leakage', () => {
    const oos = v2_2_freshValidationService.evaluateFreshOOSValidation(freshDataset);

    expect(oos.datasetSplits.train.count).toBe(Math.floor(160 * 0.70));
    expect(oos.datasetSplits.validation.count).toBe(Math.floor(160 * 0.85) - Math.floor(160 * 0.70));
    expect(oos.datasetSplits.outOfSample.count).toBe(160 - Math.floor(160 * 0.85));

    expect(oos.leakageVerification.lookaheadFree).toBe(true);
    expect(oos.leakageVerification.parameterLeakageFree).toBe(true);
    expect(oos.leakageVerification.futureCandleAccessBlocked).toBe(true);
    expect(['OOS_VALIDATED', 'MARGINAL', 'OOS_NOT_VALIDATED']).toContain(oos.verdict);
  });

  test('8. Safety Boundaries & Demo-Only Enforcement', async () => {
    const dashboard = await v2_2_freshValidationService.getFreshValidationDashboard();
    const safety = dashboard.safetyStatus;

    expect(safety.demoPaperOnly).toBe(true);
    expect(safety.dailyLossLimitEnforced).toBe(true);
    expect(safety.drawdownLimitEnforced).toBe(true);
    expect(safety.consecutiveLossBreakerEnforced).toBe(true);
    expect(safety.volatilityLockoutActive).toBe(true);
    expect(safety.staleFeedProtectionActive).toBe(true);
    expect(safety.activePositionLockActive).toBe(true);
    expect(safety.cooldownIntervalActive).toBe(true);
    expect(safety.duplicateSignalSuppressionActive).toBe(true);
    expect(safety.signalValidityChecked).toBe(true);
    expect(safety.dataQualityGateActive).toBe(true);
    expect(safety.disclaimer).toContain('100% DEMO/PAPER ONLY');
  });

  test('9. Promotion Gate: V2 Remains Active Baseline, No Automated Mutation', async () => {
    const dashboard = await v2_2_freshValidationService.getFreshValidationDashboard();
    const gate = dashboard.promotionGateSummary;

    expect(gate.productionStrategyStatus).toContain('Strategy V2 remains the active production baseline (UNMODIFIED)');
    expect(gate.decisionRule).toContain('separate manual decision is required');

    gate.candidates.forEach(c => {
      expect(['CANDIDATE_FOR_FURTHER_TESTING', 'NOT_READY_FOR_FURTHER_TESTING', 'INSUFFICIENT_SAMPLE']).toContain(c.status);
    });
  });

  test('10. Full Dashboard Aggregation', async () => {
    const dashboard = await v2_2_freshValidationService.getFreshValidationDashboard();

    expect(dashboard.datasetMetadata.datasetId).toBe('V2.2_FRESH');
    expect(dashboard.datasetMetadata.totalFreshTrades).toBe(160);
    expect(dashboard.experimentMatrix.length).toBe(4);
    expect(dashboard.confidenceIntervalsSummary.variantCIs['V2_BASELINE']).toBeDefined();
    expect(dashboard.oosValidation).toBeDefined();
    expect(dashboard.promotionGateSummary).toBeDefined();
  });
});
