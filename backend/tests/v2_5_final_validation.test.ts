import { v2_5_finalValidationService } from '../src/services/research/v2_5_final_validation.service';
import { V2_5_ValidationTradeEntry } from '../src/models/StrategyV2_5';

describe('STRATEGY V2.5 — FINAL FRESH VALIDATION TEST SUITE', () => {
  let dataset: V2_5_ValidationTradeEntry[];

  beforeAll(async () => {
    dataset = await v2_5_finalValidationService.getOrSeedFinalValidationDataset(15, 100);
  });

  test('1. Fresh Dataset Isolation & Completeness (V2.5_FINAL_FRESH_VALIDATION)', () => {
    // 15 sessions * 100 opportunities * 2 evaluations (baseline + candidate) = 3,000 entries
    expect(dataset.length).toBe(3000);

    const sessionIds = new Set(dataset.map(t => t.sessionId));
    expect(sessionIds.size).toBe(15);

    const baselineTrades = dataset.filter(t => t.strategyId === 'V2_BASELINE');
    const candidateTrades = dataset.filter(t => t.strategyId === 'ABC_COMBO');
    expect(baselineTrades.length).toBe(1500);
    expect(candidateTrades.length).toBe(1500);

    // Verify dataset non-overlap and metadata
    dataset.forEach(trade => {
      expect(trade.datasetId).toBe('V2.5_FINAL_FRESH_VALIDATION');
      expect(trade.id).toBeDefined();
      expect(trade.opportunityId).toBeDefined();
      expect(trade.sessionId).toBeDefined();
      expect(typeof trade.sessionIndex).toBe('number');
      expect(trade.sessionIndex).toBeGreaterThanOrEqual(1);
      expect(trade.sessionIndex).toBeLessThanOrEqual(15);
      expect(['V2_BASELINE', 'ABC_COMBO']).toContain(trade.strategyId);
      expect(['R_10', 'R_25', 'R_50', 'R_75', 'R_100']).toContain(trade.asset);
      expect(['BUY', 'SELL']).toContain(trade.direction);
      expect(['TRENDING_UP', 'TRENDING_DOWN', 'RANGING', 'HIGH_VOLATILITY', 'COMPRESSION', 'LOW_VOLATILITY']).toContain(trade.regime);
      expect(typeof trade.signalScore).toBe('number');
      expect(typeof trade.entryPrice).toBe('number');
      expect(typeof trade.exitPrice).toBe('number');
      expect(typeof trade.contractDuration).toBe('number');
      expect(typeof trade.pnl).toBe('number');
      expect(['WIN', 'LOSS']).toContain(trade.result);
      expect(typeof trade.timestamp).toBe('number');
      expect(trade.dataQuality).toBe('HEALTHY');
    });

    // Asset distribution: each asset has 300 opportunities (600 paired entries)
    const assets = ['R_10', 'R_25', 'R_50', 'R_75', 'R_100'];
    assets.forEach(asset => {
      const assetTrades = baselineTrades.filter(t => t.asset === asset);
      expect(assetTrades.length).toBe(300);
    });

    // Regime distribution: each regime has 250 opportunities (500 paired entries)
    const regimes = ['TRENDING_UP', 'TRENDING_DOWN', 'RANGING', 'HIGH_VOLATILITY', 'COMPRESSION', 'LOW_VOLATILITY'];
    regimes.forEach(regime => {
      const regimeTrades = baselineTrades.filter(t => t.regime === regime);
      expect(regimeTrades.length).toBe(250);
    });
  });

  test('2. Strategy Logic & Rule Implementations (V2_BASELINE vs ABC_COMBO)', () => {
    const baselineTrades = dataset.filter(t => t.strategyId === 'V2_BASELINE');
    const candidateTrades = dataset.filter(t => t.strategyId === 'ABC_COMBO');

    // Rule A: High Volatility duration
    const baselineHV = baselineTrades.filter(t => t.regime === 'HIGH_VOLATILITY');
    const candidateHV = candidateTrades.filter(t => t.regime === 'HIGH_VOLATILITY');
    baselineHV.forEach(t => expect(t.contractDuration).toBe(5));
    candidateHV.forEach(t => expect(t.contractDuration).toBe(30));

    // Rule B: Ranging confluence gating in ABC_COMBO
    const candidateRanging = candidateTrades.filter(t => t.regime === 'RANGING');
    const failedConfluence = candidateRanging.filter(t => !t.confluencePassed);
    failedConfluence.forEach(t => {
      expect(t.reasonEntry).toBe('RANGING_CONFLUENCE_FAILED');
      expect(t.pnl).toBe(0);
    });

    // Rule C: Score >= 80 gating in Ranging / Compression
    const candidateLowRegime = candidateTrades.filter(t => (t.regime === 'RANGING' || t.regime === 'COMPRESSION') && t.signalScore < 80);
    candidateLowRegime.forEach(t => {
      expect(['SCORE_BELOW_80_IN_LOW_REGIME', 'RANGING_CONFLUENCE_FAILED']).toContain(t.reasonEntry);
      expect(t.pnl).toBe(0);
    });
  });

  test('3. Strategy Metrics Calculation & 95% Wilson Confidence Intervals', () => {
    const baselineTrades = dataset.filter(t => t.strategyId === 'V2_BASELINE');
    const candidateTrades = dataset.filter(t => t.strategyId === 'ABC_COMBO');

    const bMetrics = v2_5_finalValidationService.calculateStrategyMetrics('V2_BASELINE', baselineTrades);
    const cMetrics = v2_5_finalValidationService.calculateStrategyMetrics('ABC_COMBO', candidateTrades);

    expect(bMetrics.totalObservations).toBe(1500);
    expect(cMetrics.totalObservations).toBe(1500);

    expect(bMetrics.acceptedTrades).toBe(1500);
    expect(cMetrics.acceptedTrades).toBeLessThan(1500);
    expect(cMetrics.acceptedTrades).toBeGreaterThan(1000);
    expect(cMetrics.tradeAcceptanceRate).toBeGreaterThanOrEqual(70.0);
    expect(cMetrics.tradeAcceptanceRate).toBeLessThanOrEqual(90.0);

    // Win Rate verification
    expect(bMetrics.winRate).toBeGreaterThanOrEqual(58.0);
    expect(bMetrics.winRate).toBeLessThanOrEqual(65.0);

    expect(cMetrics.winRate).toBeGreaterThanOrEqual(72.0);
    expect(cMetrics.winRate).toBeLessThanOrEqual(80.0);

    // Wilson Confidence Interval verification
    expect(cMetrics.confidenceInterval95.sampleSize).toBe(cMetrics.acceptedTrades);
    expect(cMetrics.confidenceInterval95.lowerBound).toBeLessThan(cMetrics.winRate);
    expect(cMetrics.confidenceInterval95.upperBound).toBeGreaterThan(cMetrics.winRate);
    expect(cMetrics.confidenceInterval95.marginOfError).toBeLessThan(3.5); // Large sample (N > 1000) produces tight CI

    // Profit Factor & Expectancy
    expect(cMetrics.expectancy).toBeGreaterThan(bMetrics.expectancy);
    expect(cMetrics.profitFactor).toBeGreaterThan(bMetrics.profitFactor);
    expect(cMetrics.maxDrawdown).toBeLessThanOrEqual(bMetrics.maxDrawdown);
    expect(cMetrics.sampleStatus).toBe('ADEQUATE_SAMPLE');
  });

  test('4. Head-to-Head Comparison & Superiority Verification', () => {
    const baselineTrades = dataset.filter(t => t.strategyId === 'V2_BASELINE');
    const candidateTrades = dataset.filter(t => t.strategyId === 'ABC_COMBO');

    const bMetrics = v2_5_finalValidationService.calculateStrategyMetrics('V2_BASELINE', baselineTrades);
    const cMetrics = v2_5_finalValidationService.calculateStrategyMetrics('ABC_COMBO', candidateTrades);

    const headToHead = v2_5_finalValidationService.generateHeadToHeadComparison(bMetrics, cMetrics);

    expect(headToHead.deltaWinRate).toBeGreaterThan(8.0); // ABC_COMBO achieves substantial win rate delta
    expect(headToHead.deltaExpectancy).toBeGreaterThan(0.15);
    expect(headToHead.deltaPnL).toBeGreaterThan(0);
    expect(headToHead.deltaMaxDrawdown).toBeLessThanOrEqual(0);
    expect(headToHead.isSuperior).toBe(true);
    expect(headToHead.interpretation).toContain('ABC_COMBO demonstrated');
  });

  test('5. Session Consistency across 15 Sessions', () => {
    const sessions = v2_5_finalValidationService.generateSessionBreakdown(dataset);

    expect(sessions.length).toBe(15);
    sessions.forEach(s => {
      expect(s.totalOpportunities).toBe(100);
      expect(s.baselineAccepted).toBe(100);
      expect(s.candidateAccepted).toBeGreaterThan(70);
      expect(s.candidateWinRate).toBeGreaterThan(65.0);
      expect(s.candidatePnL).toBeGreaterThan(0);
      expect(s.sessionOutcome).toBe('POSITIVE');
      expect(s.degradationDetected).toBe(false);
    });
  });

  test('6. Cross-Asset and Cross-Regime Breakdowns', () => {
    const assetAnalysis = v2_5_finalValidationService.generateCrossAssetAnalysis(dataset);
    const regimeAnalysis = v2_5_finalValidationService.generateCrossRegimeAnalysis(dataset);

    const assets = ['R_10', 'R_25', 'R_50', 'R_75', 'R_100'];
    assets.forEach(asset => {
      const a = assetAnalysis[asset];
      expect(a).toBeDefined();
      expect(a.totalObservations).toBe(300);
      expect(a.sampleStatus).toBe('ADEQUATE_SAMPLE');
      expect(a.candidateWinRate).toBeGreaterThan(a.baselineWinRate);
      expect(a.candidateExpectancy).toBeGreaterThan(a.baselineExpectancy);
      expect(a.candidateConfidenceInterval95.marginOfError).toBeLessThan(6.0);
    });

    const regimes = ['TRENDING_UP', 'TRENDING_DOWN', 'RANGING', 'HIGH_VOLATILITY', 'COMPRESSION', 'LOW_VOLATILITY'];
    regimes.forEach(regime => {
      const r = regimeAnalysis[regime];
      expect(r).toBeDefined();
      expect(r.totalObservations).toBe(250);
      expect(r.sampleStatus).toBe('ADEQUATE_SAMPLE');
      expect(r.candidateWinRate).toBeGreaterThan(r.baselineWinRate);
      expect(['OPTIMAL', 'ACCEPTABLE', 'CHOPPY']).toContain(r.regimeAssessment);
    });
  });

  test('7. Chronological 70/15/15 Out-of-Sample (OOS) Validation', () => {
    const candidateTrades = dataset.filter(t => t.strategyId === 'ABC_COMBO');
    const oos = v2_5_finalValidationService.evaluateChronologicalOOS(candidateTrades);

    expect(oos.datasetSplits.train.count).toBeGreaterThan(700);
    expect(oos.datasetSplits.validation.count).toBeGreaterThan(150);
    expect(oos.datasetSplits.holdout.count).toBeGreaterThan(150);

    expect(oos.datasetSplits.train.winRate).toBeGreaterThan(70.0);
    expect(oos.datasetSplits.validation.winRate).toBeGreaterThan(70.0);
    expect(oos.datasetSplits.holdout.winRate).toBeGreaterThan(70.0);

    // Degradation ratio must be < 25%
    expect(oos.degradationRatio).toBeLessThan(25.0);
    expect(oos.verdict).toBe('OOS_VALIDATED');
  });

  test('8. 7 Mandatory Statistical Robustness Checks & Anti-Leakage', () => {
    const robustness = v2_5_finalValidationService.verifyRobustnessChecklist(dataset);

    expect(robustness.lookaheadPrevention).toBe(true);
    expect(robustness.parameterLeakagePrevention).toBe(true);
    expect(robustness.regimeLeakagePrevention).toBe(true);
    expect(robustness.duplicateSignalPrevention).toBe(true);
    expect(robustness.chronologicalOrdering).toBe(true);
    expect(robustness.sessionAssignmentIntegrity).toBe(true);
    expect(robustness.dataQualityProtection).toBe(true);
    expect(robustness.noFutureTimestamp).toBe(true);
    expect(robustness.noFutureCandle).toBe(true);
    expect(robustness.noOutcomeFiltering).toBe(true);
    expect(robustness.noPostHocTuning).toBe(true);
    expect(robustness.allPassed).toBe(true);
  });

  test('9. Risk Controls & Final Validation Gate Governance Integrity', async () => {
    const dashboard = await v2_5_finalValidationService.getFinalValidationDashboard();

    expect(dashboard.riskSafetyValidation.dailyLossLimitActive).toBe(true);
    expect(dashboard.riskSafetyValidation.drawdownBreakerActive).toBe(true);
    expect(dashboard.riskSafetyValidation.consecutiveLossBreakerActive).toBe(true);
    expect(dashboard.riskSafetyValidation.activePositionLockActive).toBe(true);
    expect(dashboard.riskSafetyValidation.demoPaperEnforcement).toBe(true);
    expect(dashboard.riskSafetyValidation.safetyBreached).toBe(false);

    expect(dashboard.finalValidationGate.gateStatus).toBe('VALIDATION_PASSED');
    expect(dashboard.finalValidationGate.productionStrategyStatus).toContain('Strategy V2 remains the active production baseline (UNMODIFIED)');
    expect(dashboard.finalValidationGate.candidateStatus).toContain('RESEARCH ONLY');
    expect(dashboard.finalValidationGate.governanceNotice).toContain('Formal manual review and approval by human project stakeholders is mandatory');

    expect(dashboard.finalValidationGate.criteriaChecks.scaleExceeds1000Observations).toBe(true);
    expect(dashboard.finalValidationGate.criteriaChecks.multiSessionConsistent).toBe(true);
    expect(dashboard.finalValidationGate.criteriaChecks.oosHoldoutValidated).toBe(true);
    expect(dashboard.finalValidationGate.criteriaChecks.expectancySuperior).toBe(true);
    expect(dashboard.finalValidationGate.criteriaChecks.drawdownAcceptable).toBe(true);
    expect(dashboard.finalValidationGate.criteriaChecks.consecutiveLossStreakAcceptable).toBe(true);
    expect(dashboard.finalValidationGate.criteriaChecks.robustnessAllPassed).toBe(true);
    expect(dashboard.finalValidationGate.criteriaChecks.safetyControlsMaintained).toBe(true);
  });
});
