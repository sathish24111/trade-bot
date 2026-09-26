import { v2_3_multiSessionService } from '../src/services/research/v2_3_multisession.service';
import { MultiSessionTradeEntry } from '../src/models/StrategyV2_3';

describe('STRATEGY V2.3 — MULTI-SESSION VALIDATION & PROMOTION GATE TEST SUITE', () => {
  let multiSessionDataset: MultiSessionTradeEntry[];

  beforeAll(async () => {
    multiSessionDataset = await v2_3_multiSessionService.getOrSeedMultiSessionDataset(10, 55);
  });

  test('1. Multi-Session Dataset Isolation & Completeness (V2.3_MULTI_SESSION)', () => {
    expect(multiSessionDataset.length).toBe(550);

    const sessionIds = new Set(multiSessionDataset.map(t => t.sessionId));
    expect(sessionIds.size).toBe(10);

    multiSessionDataset.forEach(trade => {
      expect(trade.datasetId).toBe('V2.3_MULTI_SESSION');
      expect(trade.id).toBeDefined();
      expect(trade.sessionId).toBeDefined();
      expect(typeof trade.sessionIndex).toBe('number');
      expect(trade.sessionIndex).toBeGreaterThanOrEqual(1);
      expect(trade.sessionIndex).toBeLessThanOrEqual(10);
      expect(trade.signalId).toBeDefined();
      expect(trade.strategyVersion).toBe('STRATEGY_V2.3_MULTI_SESSION');
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

  test('2. Multi-Session Rotation & Hypothesis Assignment', () => {
    // Check that each session has the expected experiment assigned
    const session1Trades = multiSessionDataset.filter(t => t.sessionIndex === 1);
    const session2Trades = multiSessionDataset.filter(t => t.sessionIndex === 2);
    const session3Trades = multiSessionDataset.filter(t => t.sessionIndex === 3);

    expect(session1Trades.some(t => t.experimentVariant === 'V2.3_HIGH_VOL_30S')).toBe(true);
    expect(session2Trades.some(t => t.experimentVariant === 'V2.3_RANGING_CONFLUENCE')).toBe(true);
    expect(session3Trades.some(t => t.experimentVariant === 'V2.3_LOW_REGIME_80')).toBe(true);
  });

  test('3. Hypothesis Summary & Consistency Evaluation', async () => {
    const dashboard = await v2_3_multiSessionService.getMultiSessionDashboard();
    const { hypothesisA, hypothesisB, hypothesisC } = dashboard.hypotheses;

    expect(hypothesisA.hypothesisId).toBe('HYPOTHESIS_A');
    expect(hypothesisA.experimentVariant).toContain('V2.3_HIGH_VOL_30S');
    expect(hypothesisA.totalSessionsEvaluated).toBeGreaterThanOrEqual(3);
    expect(hypothesisA.totalObservations).toBeGreaterThanOrEqual(50);
    expect(['READY_FOR_MANUAL_REVIEW', 'CONTINUE_RESEARCH', 'INCONSISTENT']).toContain(hypothesisA.promotionGateStatus);

    expect(hypothesisB.hypothesisId).toBe('HYPOTHESIS_B');
    expect(hypothesisB.experimentVariant).toContain('V2.3_RANGING_CONFLUENCE');
    expect(hypothesisB.totalSessionsEvaluated).toBeGreaterThanOrEqual(3);

    expect(hypothesisC.hypothesisId).toBe('HYPOTHESIS_C');
    expect(hypothesisC.experimentVariant).toContain('V2.3_LOW_REGIME_80');
    expect(hypothesisC.totalSessionsEvaluated).toBeGreaterThanOrEqual(3);
  });

  test('4. Session Degradation & Performance State Tracking', async () => {
    const dashboard = await v2_3_multiSessionService.getMultiSessionDashboard();
    expect(dashboard.sessionsList).toHaveLength(10);

    dashboard.sessionsList.forEach(session => {
      expect(session.totalObservations).toBe(55);
      expect(session.winRate).toBeGreaterThanOrEqual(0);
      expect(session.winRate).toBeLessThanOrEqual(100);
      expect(typeof session.totalPnL).toBe('number');
      expect(typeof session.expectancy).toBe('number');
      expect(typeof session.profitFactor).toBe('number');
      expect(typeof session.maxDrawdown).toBe('number');
      expect(typeof session.degradationDetected).toBe('boolean');
      expect(['POSITIVE', 'NEGATIVE', 'NEUTRAL']).toContain(session.sessionOutcome);
    });
  });

  test('5. Cross-Asset & Cross-Regime Session Consistency', async () => {
    const dashboard = await v2_3_multiSessionService.getMultiSessionDashboard();
    const assets = Object.keys(dashboard.crossAssetAnalysis);
    const regimes = Object.keys(dashboard.crossRegimeAnalysis);

    expect(assets.length).toBeGreaterThan(0);
    expect(regimes.length).toBeGreaterThan(0);
    expect(assets).toContain('R_10');
    expect(assets).toContain('R_100');

    assets.forEach(assetKey => {
      const a = dashboard.crossAssetAnalysis[assetKey];
      expect(a.tradesCount).toBeGreaterThan(0);
      expect(a.winRate).toBeGreaterThanOrEqual(0);
      expect(a.winRate).toBeLessThanOrEqual(100);
    });

    regimes.forEach(regimeKey => {
      const r = dashboard.crossRegimeAnalysis[regimeKey];
      expect(r.tradesCount).toBeGreaterThan(0);
      expect(r.winRate).toBeGreaterThanOrEqual(0);
    });
  });

  test('6. Chronological 70/15/15 Fresh OOS Split (Zero Leakage)', async () => {
    const dashboard = await v2_3_multiSessionService.getMultiSessionDashboard();
    const oos = dashboard.oosValidation;

    expect(oos.leakageVerification.lookaheadFree).toBe(true);
    expect(oos.leakageVerification.parameterLeakageFree).toBe(true);
    expect(oos.leakageVerification.regimeLeakageFree).toBe(true);
    expect(oos.leakageVerification.experimentAssignmentLeakageFree).toBe(true);

    expect(oos.datasetSplits.train.count).toBe(385); // 70% of 550
    expect(oos.datasetSplits.validation.count).toBe(82);  // 15% of 550
    expect(oos.datasetSplits.outOfSample.count).toBe(83); // 15% of 550

    expect(oos.datasetSplits.train.winRate).toBeGreaterThan(0);
    expect(oos.datasetSplits.validation.winRate).toBeGreaterThan(0);
    expect(oos.datasetSplits.outOfSample.winRate).toBeGreaterThan(0);
  });

  test('7. Promotion-Gate Evaluation Criteria & Governance Integrity', async () => {
    const dashboard = await v2_3_multiSessionService.getMultiSessionDashboard();
    const gate = dashboard.promotionGateSummary;

    expect(gate.gateDecisions).toHaveLength(3);
    expect(gate.productionStrategyStatus).toContain('Strategy V2 remains the active production baseline');
    expect(dashboard.safetyStatus.demoPaperOnly).toBe(true);

    gate.gateDecisions.forEach(decision => {
      expect(['HYPOTHESIS_A', 'HYPOTHESIS_B', 'HYPOTHESIS_C']).toContain(decision.hypothesisId);
      expect(['READY_FOR_MANUAL_REVIEW', 'CONTINUE_RESEARCH', 'INCONSISTENT']).toContain(decision.status);
      expect(decision.criteriaChecks.noSafetyViolations).toBe(true);
      expect(decision.criteriaChecks.noLeakage).toBe(true);
      expect(decision.criteriaChecks.oosPositive).toBe(true);
      expect(decision.criteriaChecks.multiSessionTested).toBe(true);
    });
  });

  test('8. Statistical & Sample Protection Boundaries', () => {
    expect(v2_3_multiSessionService.getSampleStatus(10)).toBe('INSUFFICIENT_SAMPLE');
    expect(v2_3_multiSessionService.getSampleStatus(29)).toBe('INSUFFICIENT_SAMPLE');
    expect(v2_3_multiSessionService.getSampleStatus(30)).toBe('LIMITED_SAMPLE');
    expect(v2_3_multiSessionService.getSampleStatus(99)).toBe('LIMITED_SAMPLE');
    expect(v2_3_multiSessionService.getSampleStatus(100)).toBe('ADEQUATE_SAMPLE');

    const ci = v2_3_multiSessionService.calculateConfidenceInterval95(65, 100);
    expect(ci.lowerBound).toBeGreaterThan(50);
    expect(ci.upperBound).toBeLessThan(80);
    expect(ci.lowerBound).toBeLessThan(ci.upperBound);
  });
});
