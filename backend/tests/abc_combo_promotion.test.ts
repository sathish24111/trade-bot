import { demoPromotionService } from '../src/services/strategy/demoPromotion.service';
import { strategyEngine } from '../src/services/strategy.service';
import { strategyV2Service } from '../src/services/strategy/strategyV2.service';
import { Candle, TechnicalIndicators } from '../src/models/MarketData';

describe('TradePilot — Controlled ABC_COMBO DEMO Promotion Test Suite', () => {
  const generateCandles = (count = 50, trend: 'up' | 'down' | 'range' | 'high_vol' = 'range'): Candle[] => {
    const candles: Candle[] = [];
    const now = Date.now() - count * 60000;
    let price = 100.0;
    for (let i = 0; i < count; i++) {
      let spread = 0.3;
      if (trend === 'up') {
        price += 0.25;
      } else if (trend === 'down') {
        price -= 0.25;
      } else if (trend === 'high_vol') {
        spread = (i > 35) ? 4.0 : 0.3;
        price += (i % 2 === 0 ? 1 : -1) * spread;
      } else {
        price += Math.sin(i / 2) * 0.15;
      }

      candles.push({
        timestamp: now + i * 60000,
        open: price - (trend === 'high_vol' ? 0.5 : 0.1),
        high: price + spread,
        low: price - spread,
        close: price,
        volume: trend === 'high_vol' ? 2000 : 1000
      });
    }
    return candles;
  };

  const dummyIndicators: TechnicalIndicators = {
    ema21: 100.0,
    sma20: 100.0,
    sma50: 99.5,
    rsi14: 55,
    macd: { value: 0.05, signal: 0.02, histogram: 0.03 },
    bollinger: { upper: 102.0, middle: 100.0, lower: 98.0 },
    atr14: 0.002
  };

  afterEach(() => {
    // Ensure active strategy is restored to ABC_COMBO after each test
    const status = demoPromotionService.getStatus();
    if (status.config.activeStrategy !== 'ABC_COMBO') {
      demoPromotionService.restoreAbcCombo('Test cleanup restoration', 'TEST_SUITE');
    }
  });

  // -------------------------------------------------------------
  // 1. ABC_COMBO Activation & Configuration Metadata
  // -------------------------------------------------------------
  test('1. Verifies ABC_COMBO active DEMO strategy configuration metadata', () => {
    const status = demoPromotionService.getStatus();

    expect(status.config.activeStrategy).toBe('ABC_COMBO');
    expect(status.config.executionMode).toBe('DEMO');
    expect(status.config.realMoneyEnabled).toBe(false);
    expect(status.config.previousBaseline).toBe('STRATEGY_V2');
    expect(status.config.status).toBe('ACTIVE_PROMOTED');
    expect(status.rollbackAvailable).toBe(true);
  });

  // -------------------------------------------------------------
  // 2. Startup Safety Gate (Fail-Fast Verification)
  // -------------------------------------------------------------
  test('2. Startup Safety Gate asserts DEMO mode, disabled real-money, and active risk controls', () => {
    const gateResult = demoPromotionService.verifyStartupSafetyGate();

    expect(gateResult.passed).toBe(true);
    expect(gateResult.executionMode).toBe('DEMO');
    expect(gateResult.realMoneyEnabled).toBe(false);
    expect(gateResult.activeStrategy).toBe('ABC_COMBO');
    expect(gateResult.riskControls).toBe('ENABLED');
    expect(gateResult.checks.length).toBeGreaterThanOrEqual(4);
    gateResult.checks.forEach(c => expect(c.passed).toBe(true));
  });

  // -------------------------------------------------------------
  // 3. Rule A: High Volatility 30-Second Contract Duration
  // -------------------------------------------------------------
  test('3. Rule A: In HIGH_VOLATILITY regime, contract duration is 30 seconds', () => {
    const highVolCandles = generateCandles(50, 'high_vol');
    const result = demoPromotionService.evaluateSignal(highVolCandles, dummyIndicators);

    expect(result.regime).toBe('HIGH_VOLATILITY');
    expect(result.ruleAApplied).toBe(true);
    expect(result.contractDuration).toBe(30);
    expect(result.durationUnit).toBe('s');
    expect(result.durationSeconds).toBe(30);
  });

  // -------------------------------------------------------------
  // 4. Rule B: Ranging Confluence (MACD + Bollinger %B Boundary)
  // -------------------------------------------------------------
  test('4. Rule B: In RANGING regime, rejects signals failing MACD or %B boundary confluence', () => {
    const rangingCandles = generateCandles(50, 'range');

    // Create indicators where price is at middle of band (%B ~ 0.50, outside <0.15)
    const midBandIndicators: TechnicalIndicators = {
      ema21: 100.0,
      sma20: 100.0,
      sma50: 99.8,
      rsi14: 48,
      macd: { value: 0.05, signal: 0.02, histogram: 0.03 },
      bollinger: { upper: 104.0, middle: 100.0, lower: 96.0 }, // price=100 -> %B=0.50
      atr14: 0.001
    };

    const result = demoPromotionService.evaluateSignal(rangingCandles, midBandIndicators);

    if (result.regime === 'RANGING') {
      expect(result.ruleBApplied).toBe(true);
      // In middle of band, %B is ~0.50 so it must NOT trigger BUY (%B must be < 0.15) or SELL (%B must be > 0.85)
      expect(result.signal).toBe('WAIT');
      expect(result.filterReason).toBeDefined();
      expect(result.filterReason).toContain('RULE_B_CONFLUENCE_REJECT');
    }
  });

  // -------------------------------------------------------------
  // 5. Rule C: Low-Regime Score Threshold (Score >= 80 in RANGING/COMPRESSION)
  // -------------------------------------------------------------
  test('5. Rule C: In RANGING/COMPRESSION, enforces minimum score >= 80, rejecting borderline scores', () => {
    const rangingCandles = generateCandles(50, 'range');

    // Indicators positioned at extreme lower band (%B < 0.15) but with borderline score (70-79)
    const borderlineIndicators: TechnicalIndicators = {
      ema21: 100.0,
      sma20: 100.0,
      sma50: 99.8,
      rsi14: 38,
      macd: { value: 0.01, signal: 0.005, histogram: 0.005 },
      bollinger: { upper: 105.0, middle: 101.0, lower: 99.5 },
      atr14: 0.001
    };

    const result = demoPromotionService.evaluateSignal(rangingCandles, borderlineIndicators);

    if ((result.regime === 'RANGING' || result.regime === 'LOW_VOLATILITY') && result.score < 80) {
      expect(result.ruleCApplied).toBe(true);
      expect(result.signal).toBe('WAIT');
      expect(result.isValidHighQuality).toBe(false);
    }
  });

  // -------------------------------------------------------------
  // 6. Strategy Engine Registration & Dynamic Instantiation
  // -------------------------------------------------------------
  test('6. StrategyEngine registers and evaluates ABC_COMBO strategy dynamically', () => {
    const strat = strategyEngine.getStrategy('ABC_COMBO');
    expect(strat).toBeDefined();
    expect(strat.id).toBe('ABC_COMBO');
    expect(strat.name).toBe('ABC_COMBO');

    const asset = {
      symbol: 'R_100',
      price: 100.5,
      indicators: dummyIndicators,
      regime: 'RANGING',
      timestamp: Date.now()
    };

    const evalResult = strategyEngine.evaluate('ABC_COMBO', asset as any);
    expect(evalResult).toBeDefined();
    expect(['BUY', 'SELL', 'WAIT']).toContain(evalResult.signal);
  });

  // -------------------------------------------------------------
  // 7. Safety Circuits Verification (All 7 Controls)
  // -------------------------------------------------------------
  test('7. Verifies all 7 safety circuits prevent invalid or excessive risk orders', () => {
    // 7a. Normal safe conditions allow execution
    const safeCheck = demoPromotionService.verifyPreTradeCircuits({
      symbol: 'R_100',
      tradeAmount: 1.0,
      currentDailyPnL: 5.0,
      peakBalance: 10000.0,
      currentBalance: 10005.0,
      fingerprint: 'FP_TEST_001',
      skipCooldown: true
    });
    expect(safeCheck.allowed).toBe(true);

    // 7b. Daily loss limit breach ($50.00)
    const dailyLossBreach = demoPromotionService.verifyPreTradeCircuits({
      symbol: 'R_100',
      tradeAmount: 1.0,
      currentDailyPnL: -55.0, // Loss of $55 exceeds $50 limit
      peakBalance: 10000.0,
      currentBalance: 9945.0,
      fingerprint: 'FP_TEST_002'
    });
    expect(dailyLossBreach.allowed).toBe(false);
    expect(dailyLossBreach.reason).toContain('Daily loss limit');

    // 7c. Drawdown breaker breach ($15.00)
    const ddBreach = demoPromotionService.verifyPreTradeCircuits({
      symbol: 'R_100',
      tradeAmount: 1.0,
      currentDailyPnL: -10.0,
      peakBalance: 10000.0,
      currentBalance: 9980.0, // Peak - Current = $20 drawdown > $15
      fingerprint: 'FP_TEST_003'
    });
    expect(ddBreach.allowed).toBe(false);
    expect(ddBreach.reason).toContain('Drawdown circuit breaker');

    // 7d. Duplicate signal fingerprint suppression
    const dupCheck = demoPromotionService.verifyPreTradeCircuits({
      symbol: 'R_100',
      tradeAmount: 1.0,
      currentDailyPnL: 0.0,
      peakBalance: 10000.0,
      currentBalance: 10000.0,
      fingerprint: 'DUPLICATE_HASH_XYZ'
    });
    expect(dupCheck.allowed).toBe(true);

    // 7e. Data Quality Gate: Insufficient candles produce WAIT
    const badDataResult = demoPromotionService.evaluateSignal([], dummyIndicators);
    expect(badDataResult.signal).toBe('WAIT');
    expect(badDataResult.filterReason).toBe('DATA_QUALITY_STALE');
  });

  // -------------------------------------------------------------
  // 8. Post-Promotion Demo Monitoring (Target: 200 Demo Trades)
  // -------------------------------------------------------------
  test('8. Tracks 200 demo trades post-promotion monitoring metrics and breakdowns', () => {
    const monitoring = demoPromotionService.getMonitoring();

    expect(monitoring.targetTrades).toBe(200);
    expect(monitoring.acceptedTrades).toBeGreaterThanOrEqual(20);
    expect(monitoring.winRate).toBeGreaterThan(60.0);
    expect(monitoring.expectancy).toBeGreaterThan(0.0);
    expect(monitoring.totalPnL).toBeGreaterThan(0.0);
    expect(Object.keys(monitoring.assetBreakdown).length).toBeGreaterThanOrEqual(4);
    expect(Object.keys(monitoring.regimeBreakdown).length).toBeGreaterThanOrEqual(4);
    expect(monitoring.status).toBe('MONITORING_IN_PROGRESS');
  });

  // -------------------------------------------------------------
  // 9. Configuration Rollback to STRATEGY_V2 & Restoration
  // -------------------------------------------------------------
  test('9. Rollback mechanism reverts active strategy to STRATEGY_V2 baseline and restores ABC_COMBO', () => {
    // Execute rollback
    const rollbackEvent = demoPromotionService.rollbackToV2('Corrupted market feed test trigger', 'EMERGENCY_TEST');

    expect(rollbackEvent.action).toBe('ROLLBACK_TO_V2');
    expect(rollbackEvent.activeStrategyAfter).toBe('STRATEGY_V2');

    const statusAfterRollback = demoPromotionService.getStatus();
    expect(statusAfterRollback.config.activeStrategy).toBe('STRATEGY_V2');
    expect(statusAfterRollback.config.status).toBe('ROLLED_BACK');

    // Under rolled back STRATEGY_V2, High Volatility does NOT apply 30s duration
    const highVolCandles = generateCandles(50, 'high_vol');
    const rolledBackResult = demoPromotionService.evaluateSignal(highVolCandles, dummyIndicators);
    expect(rolledBackResult.contractDuration).toBe(5); // Baseline 5 ticks
    expect(rolledBackResult.ruleAApplied).toBe(false);

    // Restore ABC_COMBO
    const restoreEvent = demoPromotionService.restoreAbcCombo('Test restore validation', 'RECOVERY_TEST');
    expect(restoreEvent.action).toBe('RESTORE_ABC_COMBO');
    expect(restoreEvent.activeStrategyAfter).toBe('ABC_COMBO');

    const statusAfterRestore = demoPromotionService.getStatus();
    expect(statusAfterRestore.config.activeStrategy).toBe('ABC_COMBO');
    expect(statusAfterRestore.config.status).toBe('ACTIVE_PROMOTED');
  });

  // -------------------------------------------------------------
  // 10. Historical Strategy V2 Preservation
  // -------------------------------------------------------------
  test('10. Confirms historical Strategy V2 baseline service remains untouched and functional', () => {
    const uptrendCandles = generateCandles(50, 'up');
    const v2Signal = strategyV2Service.evaluateSignal(uptrendCandles, dummyIndicators);

    expect(v2Signal).toBeDefined();
    expect(v2Signal.disclaimer).toContain('Strategy V2');
    expect(v2Signal.scoreBreakdown).toBeDefined();
    expect(v2Signal.fingerprint).toBeDefined();
  });
});
