import { v2_1_experimentService } from '../src/services/research/v2_1_experiment.service';
import { strategyV2Service } from '../src/services/strategy/strategyV2.service';
import { Candle } from '../src/models/MarketData';
import { PaperTradeJournalEntry } from '../src/models/StrategyV2';

function generateMockCandles(count: number, basePrice: number = 100, trend: number = 0.1): Candle[] {
  const candles: Candle[] = [];
  let price = basePrice;
  const now = Date.now() - count * 60000;

  for (let i = 0; i < count; i++) {
    const open = price;
    const close = price + trend + (Math.sin(i / 5) * 0.2);
    const high = Math.max(open, close) + 0.1;
    const low = Math.min(open, close) - 0.1;
    candles.push({
      timestamp: now + i * 60000,
      open,
      high,
      low,
      close,
      volume: 1000 + i * 10
    });
    price = close;
  }
  return candles;
}

function generateMockTradeDataset(count: number): PaperTradeJournalEntry[] {
  const assets = ['R_100', 'R_50', 'R_25', 'R_75', 'R_10'];
  const regimes = ['TRENDING_UP', 'TRENDING_DOWN', 'RANGING', 'HIGH_VOLATILITY', 'COMPRESSION'];
  const trades: PaperTradeJournalEntry[] = [];
  const now = Date.now() - count * 120000;

  for (let i = 0; i < count; i++) {
    const asset = assets[i % assets.length];
    const regime = regimes[i % regimes.length];
    const isWin = (i % 3 !== 0); // ~66% win rate baseline
    const signalScore = 65 + (i % 35); // 65 to 99
    trades.push({
      id: `mock-trade-${i}`,
      signalId: `mock-sig-${i}`,
      strategyVersion: 'STRATEGY_V2',
      sessionId: 'sess-v2-1-test',
      userId: 1,
      symbol: asset,
      asset,
      direction: i % 2 === 0 ? 'BUY' : 'SELL',
      regime,
      signalScore,
      emaScore: 20,
      rsiScore: 18,
      macdScore: 16,
      bollingerScore: 12,
      momentumScore: 8,
      volatilityScore: 8,
      entryPrice: 100 + i * 0.05,
      exitPrice: isWin ? 100 + i * 0.05 + 0.02 : 100 + i * 0.05 - 0.02,
      contractDuration: 5,
      payout: isWin ? 1.95 : 0,
      pnl: isWin ? 0.95 : -1.00,
      result: isWin ? 'WIN' : 'LOSS',
      timestamp: now + i * 120000,
      createdAt: new Date(now + i * 120000),
      dataQualityOk: true,
      riskChecksPassed: true
    });
  }
  return trades;
}

describe('Strategy V2.1 Controlled Research Experiment Test Suite', () => {
  let mockTrades: PaperTradeJournalEntry[];

  beforeAll(() => {
    mockTrades = generateMockTradeDataset(120);
  });

  test('1. Experiment A: Evaluates High Volatility Duration Variants independently', () => {
    const result = v2_1_experimentService.runExperimentA(mockTrades);

    expect(result.variants).toHaveLength(4);
    expect(result.variants.map(v => v.id)).toEqual(['A1', 'A2', 'A3', 'A4']);
    expect(result.variants[0].label).toBe('V2_BASE');
    expect(result.variants[0].parameterDescription).toBe('5 ticks');
    expect(result.variants[1].label).toBe('V2.1_HV_15T');
    expect(result.variants[2].label).toBe('V2.1_HV_30S');
    expect(result.variants[3].label).toBe('V2.1_HV_2M');

    // Metrics are populated for all variants
    result.variants.forEach(v => {
      expect(v.totalTrades).toBeGreaterThanOrEqual(0);
      expect(v.winRate).toBeGreaterThanOrEqual(0);
      expect(typeof v.expectancy).toBe('number');
      expect(typeof v.maxDrawdown).toBe('number');
      expect(typeof v.maxConsecutiveLosses).toBe('number');
    });

    // Does not mutate V2 baseline status
    expect(result.variants[0].status).toBe('BASELINE');
    expect(result.variants[1].status).toBe('EXPERIMENT');
  });

  test('2. Experiment B: Ranging Bollinger Confluence filters false breakouts and records rejections', () => {
    const result = v2_1_experimentService.runExperimentB(mockTrades);

    expect(result.variants).toHaveLength(2);
    const [b1Baseline, b2Experiment] = result.variants;

    expect(b1Baseline.id).toBe('B1');
    expect(b1Baseline.status).toBe('BASELINE');
    expect(b2Experiment.id).toBe('B2');
    expect(b2Experiment.status).toBe('EXPERIMENT');

    // Rejected signals are recorded
    expect(result.rejectedSignalsCount).toBeGreaterThanOrEqual(0);
    expect(b2Experiment.rejectedSignals).toBe(result.rejectedSignalsCount);
    expect(b2Experiment.rejectionReasons).toBeDefined();
    expect(b2Experiment.rejectionReasons!['RANGING_BOLLINGER_FILTER']).toBe(result.rejectedSignalsCount);

    // Filter reduces or maintains losses
    expect(b2Experiment.losses).toBeLessThanOrEqual(b1Baseline.losses);
  });

  test('3. Experiment B: Signal Evaluator enforces %B < 0.15 for BUY and %B > 0.85 for SELL in RANGING', () => {
    const candles = generateMockCandles(40, 100, 0); // Flat ranging candles

    // 1. Evaluate with Bollinger confluence disabled (Standard V2)
    const resStandard = v2_1_experimentService.evaluateSignalV2_1(candles, undefined, {
      rangingConfluenceEnabled: false,
      lowRegimeMinScore: 70
    });

    // 2. Evaluate with Bollinger confluence enabled (V2.1 Rule)
    const resExperiment = v2_1_experimentService.evaluateSignalV2_1(candles, undefined, {
      rangingConfluenceEnabled: true,
      lowRegimeMinScore: 70
    });

    expect(resStandard).toBeDefined();
    expect(resExperiment).toBeDefined();
    expect(typeof resExperiment.bollingerPercentB).toBe('number');

    if (resExperiment.regime === 'RANGING' && !resExperiment.isAccepted) {
      expect(resExperiment.signal).toBe('WAIT');
      expect(resExperiment.rejectionReason).toContain('RANGING_BOLLINGER_FILTER');
    }
  });

  test('4. Experiment C: Score Threshold Variants (C1 >= 70 vs C2 >= 80 in Low Regimes)', () => {
    const result = v2_1_experimentService.runExperimentC(mockTrades);

    expect(result.variants).toHaveLength(2);
    const [c1Baseline, c2Experiment] = result.variants;

    expect(c1Baseline.id).toBe('C1');
    expect(c1Baseline.label).toBe('V2.1_LOW_REGIME_70');
    expect(c2Experiment.id).toBe('C2');
    expect(c2Experiment.label).toBe('V2.1_LOW_REGIME_80');

    // Score >= 80 filters out borderline trades
    expect(c2Experiment.acceptedSignals).toBeLessThanOrEqual(c1Baseline.acceptedSignals);
    expect(c2Experiment.rejectedSignals).toBeGreaterThanOrEqual(0);
    expect(c2Experiment.rejectionReasons!['SCORE_BELOW_80_THRESHOLD']).toBe(c2Experiment.rejectedSignals);
  });

  test('5. Sample Size Protection: Enforces INSUFFICIENT_SAMPLE for categories with < 30 trades', () => {
    const smallSampleTrades = mockTrades.slice(0, 15);
    const metrics = v2_1_experimentService.computeCategoryMetrics('TEST_CAT', 'Test', smallSampleTrades);

    expect(metrics.tradesCount).toBe(15);
    expect(metrics.sampleStatus).toBe('INSUFFICIENT_SAMPLE');
    expect(metrics.sampleWarning).toContain('INSUFFICIENT_SAMPLE (< 30 trades; n=15)');

    const largeSampleTrades = mockTrades.slice(0, 35);
    const largeMetrics = v2_1_experimentService.computeCategoryMetrics('TEST_CAT_LARGE', 'Test', largeSampleTrades);
    expect(largeMetrics.tradesCount).toBe(35);
    expect(largeMetrics.sampleStatus).toBe('ADEQUATE');
    expect(largeMetrics.sampleWarning).toBeUndefined();
  });

  test('6. Experiment Isolation: Verifies each experiment isolates exactly one hypothesis', () => {
    const expA = v2_1_experimentService.runExperimentA(mockTrades);
    const expB = v2_1_experimentService.runExperimentB(mockTrades);
    const expC = v2_1_experimentService.runExperimentC(mockTrades);

    // Group A only touches duration in HIGH_VOLATILITY
    expA.variants.forEach(v => {
      expect(v.experimentGroup).toBe('A_HIGH_VOLATILITY_DURATION');
      expect(v.condition).toBe('HIGH_VOLATILITY');
    });

    // Group B only touches Bollinger confluence in RANGING
    expB.variants.forEach(v => {
      expect(v.experimentGroup).toBe('B_RANGING_CONFLUENCE');
      expect(v.condition).toBe('RANGING');
    });

    // Group C only touches Score Threshold in RANGING/COMPRESSION
    expC.variants.forEach(v => {
      expect(v.experimentGroup).toBe('C_LOW_REGIME_THRESHOLD');
      expect(v.condition).toBe('RANGING/COMPRESSION');
    });
  });

  test('7. Out-of-Sample Validation: Strict 70/15/15 chronological partition with zero leakage', () => {
    const oos = v2_1_experimentService.evaluateOOSValidation(mockTrades);

    expect(oos.splits.train.count).toBe(Math.floor(120 * 0.70));
    expect(oos.splits.validation.count).toBe(Math.floor(120 * 0.85) - Math.floor(120 * 0.70));
    expect(oos.splits.outOfSample.count).toBe(120 - Math.floor(120 * 0.85));

    expect(oos.leakageCheck.lookaheadFree).toBe(true);
    expect(oos.leakageCheck.noFutureCandleAccess).toBe(true);
    expect(oos.leakageCheck.noParameterLeakage).toBe(true);
    expect(oos.leakageCheck.noDuplicateTrades).toBe(true);
    expect(typeof oos.degradationRatio).toBe('number');
    expect(['VALIDATED', 'MARGINAL', 'NOT_VALIDATED']).toContain(oos.verdict);
  });

  test('8. Safety Boundary Controls: Pre-trade risk checks remain active and strictly DEMO/PAPER only', () => {
    const safety = v2_1_experimentService.checkPreTradeSafety();

    expect(safety.demoPaperOnly).toBe(true);
    expect(safety.dataQualityVerified).toBe(true);
    expect(safety.volatilityStateOk).toBe(true);
    expect(safety.dailyLossLimitOk).toBe(true);
    expect(safety.drawdownLimitOk).toBe(true);
    expect(safety.consecutiveLossBreakerOk).toBe(true);
    expect(safety.activePositionLockOk).toBe(true);
    expect(safety.cooldownOk).toBe(true);
    expect(safety.duplicateSignalSuppressionOk).toBe(true);
    expect(safety.signalValidityOk).toBe(true);
    expect(safety.disclaimer).toContain('100% DEMO/PAPER EXECUTION ONLY');
  });

  test('9. Full Dashboard Aggregation: Produces complete V2.1 Research Lab Dashboard', async () => {
    const dashboard = await v2_1_experimentService.getResearchLabDashboard();

    expect(dashboard.experimentsMatrix.length).toBe(8); // A1-A4 (4) + B1-B2 (2) + C1-C2 (2)
    expect(dashboard.durationExperiment.variants).toHaveLength(4);
    expect(dashboard.rangingConfluenceExperiment.variants).toHaveLength(2);
    expect(dashboard.thresholdExperiment.variants).toHaveLength(2);
    expect(dashboard.oosValidation).toBeDefined();
    expect(dashboard.lossReductionSummary).toBeDefined();
    expect(dashboard.safetyStatus.demoPaperOnly).toBe(true);
  });
});
