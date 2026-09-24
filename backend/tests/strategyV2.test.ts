import { strategyV2Service, DEFAULT_STRATEGY_V2_PARAMS } from '../src/services/strategy/strategyV2.service';
import { outOfSampleValidationService } from '../src/services/research/outOfSampleValidation.service';
import { strategyV2ComparisonService } from '../src/services/research/strategyV2Comparison.service';
import { paperJournalService } from '../src/services/research/paperJournal.service';
import { Candle } from '../src/models/MarketData';
import { indicatorService } from '../src/services/indicator.service';

describe('Strategy V2 — Quality-First Adaptive Paper Trading Strategy Tests', () => {
  const generateUptrendCandles = (count = 50): Candle[] => {
    const candles: Candle[] = [];
    const now = Date.now() - count * 60000;
    let price = 100.0;
    for (let i = 0; i < count; i++) {
      price += 0.25; // steady uptrend
      candles.push({
        timestamp: now + i * 60000,
        open: price - 0.1,
        high: price + 0.3,
        low: price - 0.2,
        close: price,
        volume: 1000
      });
    }
    return candles;
  };

  const generateDowntrendCandles = (count = 50): Candle[] => {
    const candles: Candle[] = [];
    const now = Date.now() - count * 60000;
    let price = 100.0;
    for (let i = 0; i < count; i++) {
      price -= 0.25; // steady downtrend
      candles.push({
        timestamp: now + i * 60000,
        open: price + 0.1,
        high: price + 0.2,
        low: price - 0.3,
        close: price,
        volume: 1000
      });
    }
    return candles;
  };

  const generateRangingCandles = (count = 50): Candle[] => {
    const candles: Candle[] = [];
    const now = Date.now() - count * 60000;
    for (let i = 0; i < count; i++) {
      const price = 100.0 + Math.sin(i / 2) * 0.5;
      candles.push({
        timestamp: now + i * 60000,
        open: price - 0.1,
        high: price + 0.2,
        low: price - 0.2,
        close: price,
        volume: 500
      });
    }
    return candles;
  };

  const generateHighVolCandles = (count = 50): Candle[] => {
    const candles: Candle[] = [];
    const now = Date.now() - count * 60000;
    let price = 100.0;
    for (let i = 0; i < count; i++) {
      const spread = (i > 35) ? 4.0 : 0.3;
      price += (i % 2 === 0 ? 1 : -1) * spread;
      candles.push({
        timestamp: now + i * 60000,
        open: price - 0.5,
        high: price + spread,
        low: price - spread,
        close: price,
        volume: 2000
      });
    }
    return candles;
  };

  // 1. REGIME CLASSIFICATION TESTS
  describe('1. Market Regime Classification', () => {
    test('Classifies TRENDING_UP during sustained upward price sequence', () => {
      const candles = generateUptrendCandles(50);
      const regime = strategyV2Service.classifyRegime(candles);
      expect(regime).toBe('TRENDING_UP');
    });

    test('Classifies TRENDING_DOWN during sustained downward price sequence', () => {
      const candles = generateDowntrendCandles(50);
      const regime = strategyV2Service.classifyRegime(candles);
      expect(regime).toBe('TRENDING_DOWN');
    });

    test('Classifies HIGH_VOLATILITY when ATR spikes significantly', () => {
      const candles = generateHighVolCandles(50);
      const regime = strategyV2Service.classifyRegime(candles);
      expect(regime).toBe('HIGH_VOLATILITY');
    });

    test('Classifies UNKNOWN when candle count is insufficient (< 20)', () => {
      const candles = generateUptrendCandles(10);
      const regime = strategyV2Service.classifyRegime(candles);
      expect(regime).toBe('UNKNOWN');
    });
  });

  // 2. SIGNAL QUALITY ENGINE TESTS
  describe('2. Signal Quality Scoring Engine (0-100 Points)', () => {
    test('Computes normalized score with all 6 component weights summing up to 100 max', () => {
      const candles = generateUptrendCandles(50);
      const indicators = indicatorService.calculateAllIndicators(candles);
      const currentPrice = candles[candles.length - 1].close;

      const scoreBreakdown = strategyV2Service.computeSignalScore(
        'BUY',
        currentPrice,
        candles,
        indicators,
        'TRENDING_UP',
        DEFAULT_STRATEGY_V2_PARAMS
      );

      expect(scoreBreakdown.emaScore).toBeLessThanOrEqual(25);
      expect(scoreBreakdown.rsiScore).toBeLessThanOrEqual(20);
      expect(scoreBreakdown.macdScore).toBeLessThanOrEqual(20);
      expect(scoreBreakdown.bollingerScore).toBeLessThanOrEqual(15);
      expect(scoreBreakdown.momentumScore).toBeLessThanOrEqual(10);
      expect(scoreBreakdown.volatilityScore).toBeLessThanOrEqual(10);

      const computedSum =
        scoreBreakdown.emaScore +
        scoreBreakdown.rsiScore +
        scoreBreakdown.macdScore +
        scoreBreakdown.bollingerScore +
        scoreBreakdown.momentumScore +
        scoreBreakdown.volatilityScore;

      expect(scoreBreakdown.totalScore).toBe(computedSum);
      expect(scoreBreakdown.totalScore).toBeGreaterThanOrEqual(0);
      expect(scoreBreakdown.totalScore).toBeLessThanOrEqual(100);
      expect(scoreBreakdown.confirmationsCount).toBeGreaterThanOrEqual(0);
      expect(scoreBreakdown.reasons.length).toBeGreaterThan(0);
    });

    test('Categorizes into proper score buckets (80-100, 70-79, 60-69, 0-59)', () => {
      const candles = generateUptrendCandles(50);
      const indicators = indicatorService.calculateAllIndicators(candles);
      const currentPrice = candles[candles.length - 1].close;

      const scoreBreakdown = strategyV2Service.computeSignalScore(
        'BUY',
        currentPrice,
        candles,
        indicators,
        'TRENDING_UP',
        DEFAULT_STRATEGY_V2_PARAMS
      );

      if (scoreBreakdown.totalScore >= 80) {
        expect(scoreBreakdown.scoreBucket).toBe('80-100 (HIGH_QUALITY)');
      } else if (scoreBreakdown.totalScore >= 70) {
        expect(scoreBreakdown.scoreBucket).toBe('70-79 (CANDIDATE)');
      } else if (scoreBreakdown.totalScore >= 60) {
        expect(scoreBreakdown.scoreBucket).toBe('60-69 (WEAK)');
      } else {
        expect(scoreBreakdown.scoreBucket).toBe('0-59 (WAIT)');
      }
    });

    test('Signals WAIT when market regime is UNKNOWN', () => {
      const shortCandles = generateUptrendCandles(5);
      const result = strategyV2Service.evaluateSignal(shortCandles);

      expect(result.signal).toBe('WAIT');
      expect(result.regime).toBe('UNKNOWN');
      expect(result.score).toBe(0);
      expect(result.isValidHighQuality).toBe(false);
    });
  });

  // 3. REGIME-SPECIFIC STRATEGY EXECUTION
  describe('3. Regime-Specific Strategy Execution', () => {
    test('Allows only BUY signals in TRENDING_UP regime', () => {
      const candles = generateUptrendCandles(50);
      const result = strategyV2Service.evaluateSignal(candles);
      if (result.signal !== 'WAIT') {
        expect(result.signal).toBe('BUY');
      }
      expect(result.regime).toBe('TRENDING_UP');
    });

    test('Allows only SELL signals in TRENDING_DOWN regime', () => {
      const candles = generateDowntrendCandles(50);
      const result = strategyV2Service.evaluateSignal(candles);
      if (result.signal !== 'WAIT') {
        expect(result.signal).toBe('SELL');
      }
      expect(result.regime).toBe('TRENDING_DOWN');
    });

    test('Enforces elevated threshold (>= 85) in HIGH_VOLATILITY regime', () => {
      const candles = generateHighVolCandles(50);
      const result = strategyV2Service.evaluateSignal(candles);
      if (result.isValidHighQuality) {
        expect(result.score).toBeGreaterThanOrEqual(85);
      }
    });
  });

  // 4. ANTI-OVERTRADING & FINGERPRINTING
  describe('4. Anti-Overtrading & Signal Fingerprinting', () => {
    test('Generates deterministic SHA-256 fingerprint for duplicate suppression', () => {
      const fp1 = strategyV2Service.generateFingerprint('R_100', 'BUY', 'TRENDING_UP', 100.25, 1700000000000);
      const fp2 = strategyV2Service.generateFingerprint('R_100', 'BUY', 'TRENDING_UP', 100.25, 1700000000000);
      const fp3 = strategyV2Service.generateFingerprint('R_100', 'SELL', 'TRENDING_UP', 100.25, 1700000000000);

      expect(fp1).toBe(fp2);
      expect(fp1).not.toBe(fp3);
      expect(fp1.length).toBe(16);
    });

    test('Detects signal invalidation when regime shifts or price drifts', () => {
      const candles = generateUptrendCandles(50);
      const originalSignal = strategyV2Service.evaluateSignal(candles);

      const checkValid = strategyV2Service.isSignalInvalidated(
        originalSignal,
        candles[candles.length - 1].close,
        originalSignal.indicators,
        originalSignal.regime
      );
      expect(checkValid.invalidated).toBe(false);

      // Invalidate by regime shift
      const checkRegimeShift = strategyV2Service.isSignalInvalidated(
        originalSignal,
        candles[candles.length - 1].close,
        originalSignal.indicators,
        'TRENDING_DOWN'
      );
      expect(checkRegimeShift.invalidated).toBe(true);
      expect(checkRegimeShift.reason).toContain('Regime shifted');
    });
  });

  // 5. OUT-OF-SAMPLE VALIDATION & CLIFF DETECTION
  describe('5. Out-of-Sample 70/15/15 Validation', () => {
    test('Splits dataset into 70% In-Sample, 15% Validation, and 15% OOS strictly forward-looking', () => {
      const candles = generateUptrendCandles(200);
      const report = outOfSampleValidationService.runValidation(candles);

      expect(report.strategyId).toBe('STRATEGY_V2');
      expect(report.lookaheadBiasCheck.passed).toBe(true);
      expect(report.datasetSplits.inSample.candlesCount).toBe(140);
      expect(report.datasetSplits.validation.candlesCount).toBe(30);
      expect(report.datasetSplits.outOfSample.candlesCount).toBe(30);
      expect(['PASS', 'MARGINAL', 'FAIL']).toContain(report.verdict);
    });

    test('Generates parameter sensitivity matrix and detects parameter stability', () => {
      const candles = generateUptrendCandles(200);
      const report = outOfSampleValidationService.runValidation(candles);

      expect(report.parameterSensitivityGrid.length).toBeGreaterThan(0);
      expect(typeof report.cliffDetection.cliffsDetected).toBe('number');
      expect(report.cliffDetection.stableRegion).toBeDefined();
    });
  });

  // 6. V1 vs V2 COMPARISON & INSUFFICIENT SAMPLE
  describe('6. V1 vs V2 Comparative Analytics', () => {
    test('Includes INSUFFICIENT_SAMPLE warning when trades count is under 30', async () => {
      const comparison = await strategyV2ComparisonService.compareV1VsV2();

      expect(comparison.v1Metrics).toBeDefined();
      expect(comparison.v2Metrics).toBeDefined();
      expect(comparison.scoreBucketBreakdown).toBeDefined();
      expect(comparison.regimeBreakdown).toBeDefined();

      if (comparison.v1Metrics.totalTrades < 30 || comparison.v2Metrics.totalTrades < 30) {
        expect(comparison.warnings.some(w => w.includes('INSUFFICIENT_SAMPLE'))).toBe(true);
      }
    });
  });

  // 7. SAFETY BOUNDARY VERIFICATION
  describe('7. Safety Boundary Verification', () => {
    test('Strategy V2 strictly enforces DEMO/PAPER research mode with zero real-money claims', () => {
      const candles = generateUptrendCandles(50);
      const result = strategyV2Service.evaluateSignal(candles);

      expect(result.disclaimer).toContain('DEMO/PAPER');
      expect(result.disclaimer).toContain('No signal guarantees winning trades');
    });
  });
});
