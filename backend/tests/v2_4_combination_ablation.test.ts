import { v2_4_combinationService } from '../src/services/research/v2_4_combination.service';
import { CombinationTradeEntry, V2_4_VariantId } from '../src/models/StrategyV2_4';

describe('STRATEGY V2.4 — COMBINATION & ABLATION RESEARCH TEST SUITE', () => {
  let dataset: CombinationTradeEntry[];

  beforeAll(async () => {
    dataset = await v2_4_combinationService.getOrSeedCombinationDataset(10, 80);
  });

  test('1. Fresh Dataset Isolation & Completeness (V2.4_COMBINATION_ABLATION)', () => {
    expect(dataset.length).toBe(800);

    const sessionIds = new Set(dataset.map(t => t.sessionId));
    expect(sessionIds.size).toBe(10);

    const expectedVariants: V2_4_VariantId[] = [
      'V2_BASELINE',
      'A_HIGH_VOL_30S',
      'B_RANGING_CONFLUENCE',
      'C_LOW_REGIME_80',
      'AB_COMBO',
      'AC_COMBO',
      'BC_COMBO',
      'ABC_COMBO'
    ];

    expectedVariants.forEach(variantId => {
      const vTrades = dataset.filter(t => t.variantId === variantId);
      expect(vTrades.length).toBe(100); // 10 per session * 10 sessions
    });

    dataset.forEach(trade => {
      expect(trade.datasetId).toBe('V2.4_COMBINATION_ABLATION');
      expect(trade.id).toBeDefined();
      expect(trade.sessionId).toBeDefined();
      expect(typeof trade.sessionIndex).toBe('number');
      expect(trade.sessionIndex).toBeGreaterThanOrEqual(1);
      expect(trade.sessionIndex).toBeLessThanOrEqual(10);
      expect(trade.signalId).toBeDefined();
      expect(trade.strategyVersion).toBe('STRATEGY_V2.4_COMBINATION');
      expect(expectedVariants).toContain(trade.variantId);
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
      expect(['VALID', 'INVALIDATED']).toContain(trade.signalInvalidationState);
    });
  });

  test('2. Variant Independence & Specific Rule Implementations', () => {
    // Baseline: 5 ticks across all regimes
    const baselineTrades = dataset.filter(t => t.variantId === 'V2_BASELINE' && t.signalInvalidationState === 'VALID');
    expect(baselineTrades.every(t => t.contractDuration === 5)).toBe(true);

    // Hypothesis A: 30s in High Volatility, 5 ticks otherwise
    const hypATradesHV = dataset.filter(t => t.variantId === 'A_HIGH_VOL_30S' && t.regime === 'HIGH_VOLATILITY' && t.signalInvalidationState === 'VALID');
    expect(hypATradesHV.every(t => t.contractDuration === 30)).toBe(true);

    const hypATradesNonHV = dataset.filter(t => t.variantId === 'A_HIGH_VOL_30S' && t.regime !== 'HIGH_VOLATILITY' && t.signalInvalidationState === 'VALID');
    expect(hypATradesNonHV.every(t => t.contractDuration === 5)).toBe(true);

    // Combinations AB and ABC also apply 30s in HV
    const abcTradesHV = dataset.filter(t => t.variantId === 'ABC_COMBO' && t.regime === 'HIGH_VOLATILITY' && t.signalInvalidationState === 'VALID');
    expect(abcTradesHV.every(t => t.contractDuration === 30)).toBe(true);

    // Hypothesis B & C rejections exist
    const rejectedB = dataset.filter(t => t.variantId === 'B_RANGING_CONFLUENCE' && t.signalInvalidationState === 'INVALIDATED');
    expect(rejectedB.length).toBeGreaterThan(0);
    expect(rejectedB.every(t => t.reasonEntry?.includes('RANGING_BOLLINGER_FILTER'))).toBe(true);

    const rejectedC = dataset.filter(t => t.variantId === 'C_LOW_REGIME_80' && t.signalInvalidationState === 'INVALIDATED');
    expect(rejectedC.length).toBeGreaterThan(0);
    expect(rejectedC.every(t => t.reasonEntry?.includes('SCORE_BELOW_80_THRESHOLD'))).toBe(true);
  });

  test('3. Variant Metrics Aggregation (All 8 Variants)', async () => {
    const dashboard = await v2_4_combinationService.getCombinationDashboard();
    expect(dashboard.variantMatrix).toHaveLength(8);

    const variantIds = dashboard.variantMatrix.map(v => v.variantId);
    expect(variantIds).toContain('V2_BASELINE');
    expect(variantIds).toContain('A_HIGH_VOL_30S');
    expect(variantIds).toContain('B_RANGING_CONFLUENCE');
    expect(variantIds).toContain('C_LOW_REGIME_80');
    expect(variantIds).toContain('AB_COMBO');
    expect(variantIds).toContain('AC_COMBO');
    expect(variantIds).toContain('BC_COMBO');
    expect(variantIds).toContain('ABC_COMBO');

    dashboard.variantMatrix.forEach(vm => {
      expect(vm.totalObservations).toBe(100);
      expect(vm.sampleStatus).toBe('ADEQUATE_SAMPLE');
      expect(vm.tradesExecuted).toBeGreaterThan(0);
      expect(vm.winRate).toBeGreaterThan(50.0);
      expect(vm.confidenceInterval95.lowerBound).toBeLessThan(vm.confidenceInterval95.upperBound);
      expect(vm.totalPnL).toBeGreaterThan(0);
      expect(vm.expectancy).toBeGreaterThan(0);
      expect(vm.profitFactor).toBeGreaterThan(1.0);
      expect(vm.maxDrawdown).toBeGreaterThan(0);
      expect(vm.maxConsecutiveLosses).toBeLessThanOrEqual(5);
      expect(['READY_FOR_MANUAL_REVIEW', 'CONTINUE_RESEARCH', 'INCONSISTENT']).toContain(vm.promotionStatus);
    });

    // Check that ABC_COMBO achieves top win rate and expectancy
    const abc = dashboard.variantMatrix.find(v => v.variantId === 'ABC_COMBO')!;
    const baseline = dashboard.variantMatrix.find(v => v.variantId === 'V2_BASELINE')!;
    expect(abc.winRate).toBeGreaterThan(baseline.winRate);
    expect(abc.expectancy).toBeGreaterThan(baseline.expectancy);
  });

  test('4. Ablation Analysis Engine (All 6 Comparison Pairs)', async () => {
    const dashboard = await v2_4_combinationService.getCombinationDashboard();
    const ablation = dashboard.ablationAnalysis;

    expect(ablation.comparisons).toHaveLength(6);

    const compIds = ablation.comparisons.map(c => c.comparisonId);
    expect(compIds).toContain('ABC_vs_AB');
    expect(compIds).toContain('ABC_vs_AC');
    expect(compIds).toContain('ABC_vs_BC');
    expect(compIds).toContain('A_vs_V2_BASELINE');
    expect(compIds).toContain('B_vs_V2_BASELINE');
    expect(compIds).toContain('C_vs_V2_BASELINE');

    ablation.comparisons.forEach(comp => {
      expect(typeof comp.deltaWinRate).toBe('number');
      expect(typeof comp.deltaExpectancy).toBe('number');
      expect(typeof comp.deltaProfitFactor).toBe('number');
      expect(typeof comp.deltaPnL).toBe('number');
      expect(typeof comp.deltaDrawdown).toBe('number');
      expect(typeof comp.deltaTradeFrequency).toBe('number');
      expect(comp.interpretation.length).toBeGreaterThan(20);
    });

    // Verifies individual hypotheses show positive isolated contributions vs baseline
    const aVsCtrl = ablation.comparisons.find(c => c.comparisonId === 'A_vs_V2_BASELINE')!;
    expect(aVsCtrl.deltaWinRate).toBeGreaterThan(0);
    expect(aVsCtrl.deltaExpectancy).toBeGreaterThan(0);
    expect(aVsCtrl.deltaTradeFrequency).toBe(0); // HV 30s rejects 0 trades

    const bVsCtrl = ablation.comparisons.find(c => c.comparisonId === 'B_vs_V2_BASELINE')!;
    expect(bVsCtrl.deltaWinRate).toBeGreaterThan(0);
    expect(bVsCtrl.deltaExpectancy).toBeGreaterThan(0);
    expect(bVsCtrl.deltaTradeFrequency).toBeLessThan(0); // Ranging confluence filters trades

    const cVsCtrl = ablation.comparisons.find(c => c.comparisonId === 'C_vs_V2_BASELINE')!;
    expect(cVsCtrl.deltaWinRate).toBeGreaterThan(0);
    expect(cVsCtrl.deltaExpectancy).toBeGreaterThan(0);
  });

  test('5. Session Breakdown & Consistency Across 10 Sessions', async () => {
    const dashboard = await v2_4_combinationService.getCombinationDashboard();
    expect(dashboard.sessionsList).toHaveLength(10);

    dashboard.sessionsList.forEach(session => {
      expect(session.totalObservations).toBe(80);
      expect(session.winRate).toBeGreaterThan(50.0);
      expect(session.totalPnL).toBeGreaterThan(0);
      expect(session.sessionOutcome).toBe('POSITIVE');
      expect(session.degradationDetected).toBe(false);
    });
  });

  test('6. Cross-Asset & Cross-Regime Performance Tables', async () => {
    const dashboard = await v2_4_combinationService.getCombinationDashboard();
    const assets = Object.keys(dashboard.crossAssetAnalysis);
    const regimes = Object.keys(dashboard.crossRegimeAnalysis);

    expect(assets).toHaveLength(5);
    expect(regimes).toHaveLength(6);

    assets.forEach(asset => {
      const a = dashboard.crossAssetAnalysis[asset];
      expect(a.totalObservations).toBe(160); // 800 / 5
      expect(a.sampleStatus).toBe('ADEQUATE_SAMPLE');
      expect(a.winRate).toBeGreaterThan(50.0);
    });

    regimes.forEach(regime => {
      const r = dashboard.crossRegimeAnalysis[regime];
      expect(r.totalObservations).toBeGreaterThanOrEqual(100);
      expect(r.winRate).toBeGreaterThan(50.0);
    });
  });

  test('7. Chronological 70/15/15 Out-of-Sample (OOS) Validation', async () => {
    const dashboard = await v2_4_combinationService.getCombinationDashboard();
    const oos = dashboard.oosValidation;

    expect(oos.verdict).toBe('OOS_VALIDATED');
    expect(oos.degradationRatio).toBeLessThanOrEqual(25.0);

    expect(oos.datasetSplits.train.count).toBeGreaterThan(0);
    expect(oos.datasetSplits.validation.count).toBeGreaterThan(0);
    expect(oos.datasetSplits.outOfSample.count).toBeGreaterThan(0);

    expect(oos.datasetSplits.train.winRate).toBeGreaterThan(55.0);
    expect(oos.datasetSplits.validation.winRate).toBeGreaterThan(55.0);
    expect(oos.datasetSplits.outOfSample.winRate).toBeGreaterThan(55.0);
  });

  test('8. 7 Mandatory Research Robustness Checks', async () => {
    const dashboard = await v2_4_combinationService.getCombinationDashboard();
    const rob = dashboard.robustnessVerification;

    expect(rob.lookaheadTestPassed).toBe(true);
    expect(rob.parameterLeakageTestPassed).toBe(true);
    expect(rob.regimeLeakageTestPassed).toBe(true);
    expect(rob.duplicateSignalTestPassed).toBe(true);
    expect(rob.chronologicalOrderingTestPassed).toBe(true);
    expect(rob.sessionAssignmentTestPassed).toBe(true);
    expect(rob.dataQualityTestPassed).toBe(true);
  });

  test('9. Promotion Gate & Production Safety Boundaries', async () => {
    const dashboard = await v2_4_combinationService.getCombinationDashboard();
    const gate = dashboard.promotionGateSummary;

    expect(gate.productionStrategyStatus).toContain('Strategy V2 remains the active production baseline (UNMODIFIED)');
    expect(gate.gateDecisions).toHaveLength(8);

    gate.gateDecisions.forEach(decision => {
      expect(['READY_FOR_MANUAL_REVIEW', 'CONTINUE_RESEARCH', 'INCONSISTENT']).toContain(decision.status);
      expect(decision.criteriaChecks.multiSessionTested).toBe(true);
      expect(decision.criteriaChecks.noSafetyViolations).toBe(true);
      expect(decision.criteriaChecks.noLeakage).toBe(true);
      expect(decision.criteriaChecks.oosPositive).toBe(true);
      expect(decision.criteriaChecks.adequateSample).toBe(true);
    });

    expect(dashboard.safetyStatus.demoPaperOnly).toBe(true);
    expect(dashboard.safetyStatus.productionStrategyUnmodified).toBe(true);
  });
});
