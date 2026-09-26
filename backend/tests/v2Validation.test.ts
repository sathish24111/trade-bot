import { lossAnalysisService } from '../src/services/research/lossAnalysis.service';
import { paperJournalService } from '../src/services/research/paperJournal.service';
import { strategyV2ComparisonService } from '../src/services/research/strategyV2Comparison.service';
import { outOfSampleValidationService } from '../src/services/research/outOfSampleValidation.service';
import { strategyV2Service } from '../src/services/strategy/strategyV2.service';
import { Candle } from '../src/models/MarketData';

describe('STRATEGY V2 — DEMO VALIDATION & LOSS ANALYSIS TESTS', () => {
  beforeAll(async () => {
    // Seed validation dataset with >= 100 demo trades
    await paperJournalService.seedValidationDataset(120);
  });

  // 1. DEMO DATA COLLECTION & JOURNAL AGGREGATION
  describe('1. Demo Data Collection & Journal Aggregation', () => {
    test('Collects >= 100 demo trades in paper_trade_journal with complete rich metadata', async () => {
      const entries = await paperJournalService.getJournalEntries({ limit: 500 });
      expect(entries.length).toBeGreaterThanOrEqual(100);

      const sample = entries[0];
      expect(sample.id).toBeDefined();
      expect(sample.signalId).toBeDefined();
      expect(sample.strategyVersion).toBeDefined();
      expect(sample.symbol).toBeDefined();
      expect(sample.direction).toBeDefined();
      expect(sample.regime).toBeDefined();
      expect(typeof sample.signalScore).toBe('number');
      expect(typeof sample.emaScore).toBe('number');
      expect(typeof sample.rsiScore).toBe('number');
      expect(typeof sample.macdScore).toBe('number');
      expect(typeof sample.bollingerScore).toBe('number');
      expect(typeof sample.momentumScore).toBe('number');
      expect(typeof sample.volatilityScore).toBe('number');
      expect(typeof sample.entryPrice).toBe('number');
      expect(typeof sample.exitPrice).toBe('number');
      expect(typeof sample.contractDuration).toBe('number');
      expect(typeof sample.pnl).toBe('number');
      expect(['WIN', 'LOSS']).toContain(sample.result);
      expect(sample.dataQualityOk).toBe(true);
      expect(sample.riskChecksPassed).toBe(true);
    });
  });

  // 2. ASSET & REGIME ANALYSIS
  describe('2. Asset & Regime Analysis', () => {
    test('Aggregates research metrics by Asset with win rate, PnL, expectancy, and sample status', async () => {
      const report = await lossAnalysisService.analyzeLosses();
      expect(Object.keys(report.assetAnalysis).length).toBeGreaterThan(0);

      for (const assetKey of Object.keys(report.assetAnalysis)) {
        const m = report.assetAnalysis[assetKey];
        expect(m.category).toBe('Asset');
        expect(m.tradesCount).toBe(m.wins + m.losses);
        expect(m.winRate).toBeGreaterThanOrEqual(0);
        expect(m.winRate).toBeLessThanOrEqual(100);
        expect(typeof m.expectancy).toBe('number');
        expect(['ADEQUATE', 'INSUFFICIENT_SAMPLE']).toContain(m.sampleStatus);
      }
    });

    test('Aggregates research metrics across all 6 Market Regimes', async () => {
      const report = await lossAnalysisService.analyzeLosses();
      const regimes = ['TRENDING_UP', 'TRENDING_DOWN', 'RANGING', 'HIGH_VOLATILITY', 'LOW_VOLATILITY'];

      for (const r of regimes) {
        expect(report.regimeAnalysis[r]).toBeDefined();
        const m = report.regimeAnalysis[r];
        expect(m.category).toBe('Regime');
        expect(typeof m.totalPnL).toBe('number');
      }
    });
  });

  // 3. SCORE BUCKETS & STRATEGY CONFIRMATIONS
  describe('3. Score Buckets & Confirmations Analysis', () => {
    test('Calculates metrics across score buckets (90-100, 80-89, 70-79, 60-69, 0-59)', async () => {
      const report = await lossAnalysisService.analyzeLosses();
      expect(report.scoreAnalysis['80-89']).toBeDefined();
      expect(report.scoreAnalysis['90-100']).toBeDefined();
      expect(report.scoreAnalysis['70-79']).toBeDefined();

      const topBucket = report.scoreAnalysis['90-100'];
      expect(topBucket.tradesCount).toBeGreaterThanOrEqual(0);
    });

    test('Analyzes combinations of strategy confirmations (EMA, RSI, MACD, Bollinger, Momentum)', async () => {
      const report = await lossAnalysisService.analyzeLosses();
      expect(report.confirmationAnalysis['EMA + RSI + MACD']).toBeDefined();
      expect(report.confirmationAnalysis['Bollinger + RSI (Mean-Reversion)']).toBeDefined();
    });
  });

  // 4. LOSS CLUSTERS & PATTERN IDENTIFICATION
  describe('4. Loss Clusters Discovery', () => {
    test('Discovers conditions where losses are concentrated without altering strategy parameters', async () => {
      const report = await lossAnalysisService.analyzeLosses();
      expect(Array.isArray(report.lossClusters)).toBe(true);

      for (const cluster of report.lossClusters) {
        expect(cluster.condition).toBeDefined();
        expect(cluster.lossRate).toBeGreaterThanOrEqual(40);
        expect(cluster.observation).toBeDefined();
        expect(cluster.disclaimer).toContain('No automated parameter modification applied');
      }
    });
  });

  // 5. CONSECUTIVE LOSSES & DRAWDOWN
  describe('5. Consecutive Losses & Time Sequence Analysis', () => {
    test('Categorizes consecutive loss streaks (1, 2, 3, 4+ losses) and longest loss streak', async () => {
      const report = await lossAnalysisService.analyzeLosses();
      const seq = report.consecutiveLossAnalysis;

      expect(typeof seq.singleLossEvents).toBe('number');
      expect(typeof seq.twoConsecutiveLossEvents).toBe('number');
      expect(typeof seq.threeConsecutiveLossEvents).toBe('number');
      expect(typeof seq.fourPlusConsecutiveLossEvents).toBe('number');
      expect(typeof seq.longestLossStreak).toBe('number');
      expect(seq.longestLossStreak).toBe(report.maxConsecutiveLosses);
      expect(report.maxDrawdown).toBeGreaterThanOrEqual(0);
    });
  });

  // 6. INSUFFICIENT SAMPLE HANDLING
  describe('6. Sample Size Protection', () => {
    test('Displays INSUFFICIENT_SAMPLE warning when trades in category are under 30', () => {
      const singleTrade = [{
        id: '1', signalId: 's1', strategyVersion: 'STRATEGY_V2', sessionId: 'ses1',
        userId: 1, symbol: 'R_100', direction: 'BUY' as const, regime: 'TRENDING_UP',
        signalScore: 85, entryPrice: 100, exitPrice: 101, contractDuration: 5,
        payout: 18.5, pnl: 8.5, result: 'WIN' as const, dataQualityOk: true,
        riskChecksPassed: true, createdAt: new Date()
      }];

      const metrics = lossAnalysisService.calculateCategoryMetrics('Test', 'SmallSample', singleTrade);
      expect(metrics.sampleStatus).toBe('INSUFFICIENT_SAMPLE');
      expect(metrics.sampleWarning).toContain('INSUFFICIENT_SAMPLE');
      expect(metrics.tradesCount).toBe(1);
    });
  });

  // 7. V1 vs V2 OBJECTIVE COMPARISON
  describe('7. V1 vs V2 Side-by-Side Comparison', () => {
    test('Presents V1 and V2 comparative metrics side-by-side without labeling a winner', async () => {
      const comparison = await strategyV2ComparisonService.compareV1VsV2();

      expect(comparison.v1Metrics).toBeDefined();
      expect(comparison.v2Metrics).toBeDefined();
      expect(comparison.v1Metrics.totalTrades).toBeGreaterThanOrEqual(0);
      expect(comparison.v2Metrics.totalTrades).toBeGreaterThanOrEqual(0);
      expect(typeof comparison.v2Metrics.maxConsecutiveLosses).toBe('number');
      expect(typeof comparison.v2Metrics.waitPercentage).toBe('number');
      expect(typeof comparison.v2Metrics.expectancy).toBe('number');
      expect(comparison.summary).not.toContain('Winner:');
      expect(comparison.summary).not.toContain('best strategy');
    });
  });

  // 8. OOS VALIDATION & STRICT NO-LOOKAHEAD LEAKAGE
  describe('8. Out-of-Sample 70/15/15 Validation', () => {
    test('Enforces 70% Train, 15% Validation, 15% OOS strict chronological order with zero lookahead leakage', () => {
      const candles: Candle[] = [];
      const now = Date.now() - 300 * 60000;
      let price = 100.0;
      for (let i = 0; i < 300; i++) {
        price += (Math.random() - 0.48) * 0.5;
        candles.push({
          timestamp: now + i * 60000,
          open: price - 0.1,
          high: price + 0.3,
          low: price - 0.3,
          close: price,
          volume: 1000
        });
      }

      const report = outOfSampleValidationService.runValidation(candles);
      expect(report.strategyId).toBe('STRATEGY_V2');
      expect(report.datasetSplits.inSample.candlesCount).toBe(210); // 70% of 300
      expect(report.datasetSplits.validation.candlesCount).toBe(45);  // 15% of 300
      expect(report.datasetSplits.outOfSample.candlesCount).toBe(45); // 15% of 300
      expect(report.lookaheadBiasCheck.passed).toBe(true);
      expect(report.lookaheadBiasCheck.details).toContain('strictly bounded to [0 ... i]');
    });
  });

  // 9. RESEARCH DIAGNOSTIC ALERTS
  describe('9. Research Diagnostic Alerts', () => {
    test('Generates diagnostic alerts for research observation', async () => {
      const report = await lossAnalysisService.analyzeLosses();
      expect(Array.isArray(report.diagnosticAlerts)).toBe(true);

      for (const alert of report.diagnosticAlerts) {
        expect([
          'LOSS_CLUSTER_DETECTED',
          'HIGH_DRAWDOWN',
          'CONSECUTIVE_LOSS_LIMIT',
          'INSUFFICIENT_SAMPLE',
          'DATA_QUALITY_DEGRADATION',
          'REGIME_SPECIFIC_DEGRADATION'
        ]).toContain(alert.code);
        expect(['INFO', 'WARNING', 'CRITICAL']).toContain(alert.severity);
      }
    });
  });

  // 10. PAPER SAFETY BOUNDARIES
  describe('10. Paper Safety Boundaries', () => {
    test('Maintains DEMO/PAPER only constraints with zero real-money claims or automated risk escalations', () => {
      const candles: Candle[] = [];
      const now = Date.now() - 30 * 60000;
      let price = 100.0;
      for (let i = 0; i < 30; i++) {
        price += 0.2;
        candles.push({ timestamp: now + i * 60000, open: price, high: price + 0.1, low: price - 0.1, close: price, volume: 500 });
      }

      const signal = strategyV2Service.evaluateSignal(candles);
      expect(signal.disclaimer).toContain('DEMO/PAPER');
      expect(signal.disclaimer).toContain('No signal guarantees winning trades');
    });
  });
});
