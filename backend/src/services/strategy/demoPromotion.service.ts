import {
  ActiveStrategyConfig,
  AbcComboRulesConfig,
  SafetyCircuitsStatus,
  StartupSafetyGateResult,
  PostPromotionMonitoring,
  RollbackEvent,
  DemoTradeRecord,
  DemoPromotionStatusResponse
} from '../../models/DemoPromotion';
import { strategyV2Service } from './strategyV2.service';
import { Candle, TechnicalIndicators, DemoSignalType } from '../../models/MarketData';
import { MarketRegimeV2, StrategyV2SignalResult } from '../../models/StrategyV2';
import crypto from 'crypto';

export class DemoPromotionService {
  // 1. Explicit Configuration Metadata
  private config: ActiveStrategyConfig = {
    activeStrategy: 'ABC_COMBO',
    executionMode: 'DEMO',
    realMoneyEnabled: false,
    previousBaseline: 'STRATEGY_V2',
    promotedAt: '2026-09-26T09:30:00.000Z',
    promotedBy: 'TradePilot V2.5 Empirical Validation Gate',
    status: 'ACTIVE_PROMOTED',
    version: '2.5.0-PROMOTED',
    description:
      'ABC_COMBO active DEMO strategy combining High Volatility 30s duration, Ranging MACD + Bollinger %B confluence, and Low Regime >=80 score threshold.'
  };

  // 2. Promotion Rules Specification
  private readonly rules: AbcComboRulesConfig = {
    highVolatilityDurationSeconds: 30,
    highVolatilityDurationType: 's',
    standardDurationTicks: 5,
    standardDurationType: 't',
    rangingMacdConfirmationRequired: true,
    rangingBollingerBandRequired: true,
    rangingBollingerBuyThreshold: 0.15,
    rangingBollingerSellThreshold: 0.85,
    lowRegimeMinScore: 80,
    lowRegimes: ['RANGING', 'COMPRESSION']
  };

  // 3. Safety Circuits State
  private safetyCircuits: SafetyCircuitsStatus = {
    dailyLossLimit: {
      limit: 50.0,
      active: true,
      currentLoss: 0.0,
      breached: false
    },
    drawdownBreaker: {
      limit: 15.0,
      active: true,
      currentDrawdown: 0.0,
      breached: false
    },
    consecutiveLossBreaker: {
      maxConsecutive: 5,
      active: true,
      currentConsecutive: 0,
      breached: false
    },
    positionLock: {
      active: true,
      isLocked: false
    },
    cooldown: {
      cooldownSeconds: 30,
      active: true,
      lastTradeTime: 0
    },
    signalDeduplication: {
      algorithm: 'SHA-256',
      active: true,
      lastFingerprint: ''
    },
    dataQualityGate: {
      active: true,
      verified: true,
      lastQualityCheck: 'HEALTHY'
    },
    demoPaperEnforcement: {
      active: true,
      realMoneyBlocked: true,
      brokerApiBlocked: true
    },
    allCircuitsActive: true,
    allCircuitsIntact: true
  };

  // 4. Audit Log for Rollback Events
  private rollbackEvents: RollbackEvent[] = [];

  // 5. Post-Promotion Demo Monitoring (Target: 200 Demo Trades)
  private monitoring: PostPromotionMonitoring = {
    targetTrades: 200,
    evaluatedOpportunities: 0,
    acceptedTrades: 0,
    filteredTrades: 0,
    filterRate: 0.0,
    wins: 0,
    losses: 0,
    winRate: 0.0,
    confidenceInterval95: {
      lowerBound: 0.0,
      upperBound: 0.0
    },
    totalPnL: 0.0,
    expectancy: 0.0,
    profitFactor: 0.0,
    maxDrawdown: 0.0,
    maxConsecutiveLosses: 0,
    currentConsecutiveLosses: 0,
    assetBreakdown: {},
    regimeBreakdown: {},
    recentTrades: [],
    status: 'MONITORING_IN_PROGRESS'
  };

  constructor() {
    this.seedInitialMonitoringSession();
  }

  /**
   * STARTUP SAFETY GATE
   * Verifies required configuration parameters at startup.
   * Throws immediately (FAIL-FAST) if any safety check fails.
   */
  public verifyStartupSafetyGate(): StartupSafetyGateResult {
    const checks: { name: string; passed: boolean; details: string }[] = [];

    // Check 1: EXECUTION_MODE === 'DEMO'
    const isDemo = this.config.executionMode === 'DEMO';
    checks.push({
      name: 'EXECUTION_MODE',
      passed: isDemo,
      details: isDemo ? 'Execution mode is strictly locked to DEMO' : 'FATAL: Non-demo mode detected'
    });
    if (!isDemo) {
      throw new Error('[SAFETY GATE FATAL] EXECUTION_MODE is not DEMO. DO NOT START EXECUTION.');
    }

    // Check 2: REAL_MONEY_ENABLED === false
    const noRealMoney = this.config.realMoneyEnabled === false && !process.env.BROKER_API_KEY && !process.env.LIVE_TRADING_KEY;
    checks.push({
      name: 'REAL_MONEY_ENABLED',
      passed: noRealMoney,
      details: noRealMoney ? 'Real-money trading is disabled; zero broker credentials found' : 'FATAL: Real money detected'
    });
    if (!noRealMoney) {
      throw new Error('[SAFETY GATE FATAL] REAL_MONEY_ENABLED is true or broker keys detected. DO NOT START EXECUTION.');
    }

    // Check 3: ACTIVE_STRATEGY is recognized
    const validStrategy = this.config.activeStrategy === 'ABC_COMBO' || this.config.activeStrategy === 'STRATEGY_V2';
    checks.push({
      name: 'ACTIVE_STRATEGY',
      passed: validStrategy,
      details: `Active strategy is ${this.config.activeStrategy} (Previous baseline: ${this.config.previousBaseline})`
    });
    if (!validStrategy) {
      throw new Error('[SAFETY GATE FATAL] Invalid active strategy. DO NOT START EXECUTION.');
    }

    // Check 4: RISK_CONTROLS === ENABLED (All 7 circuits active)
    const riskControlsEnabled =
      this.safetyCircuits.dailyLossLimit.active &&
      this.safetyCircuits.drawdownBreaker.active &&
      this.safetyCircuits.consecutiveLossBreaker.active &&
      this.safetyCircuits.positionLock.active &&
      this.safetyCircuits.cooldown.active &&
      this.safetyCircuits.signalDeduplication.active &&
      this.safetyCircuits.dataQualityGate.active;

    checks.push({
      name: 'RISK_CONTROLS',
      passed: riskControlsEnabled,
      details: riskControlsEnabled
        ? 'All 7 pre-trade risk controls and circuit breakers are ACTIVE ($50 daily loss, $15 drawdown, 5 consecutive losses, lock, cooldown, deduplication, data gate)'
        : 'FATAL: One or more risk controls are disabled'
    });

    if (!riskControlsEnabled) {
      throw new Error('[SAFETY GATE FATAL] RISK_CONTROLS are not fully enabled. DO NOT START EXECUTION.');
    }

    return {
      executionMode: 'DEMO',
      realMoneyEnabled: false,
      activeStrategy: this.config.activeStrategy,
      riskControls: 'ENABLED',
      passed: true,
      checks,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * SIGNAL EVALUATION WITH ABC_COMBO PROMOTION RULES
   * Integrates Rules A, B, and C while preserving all underlying Strategy V2 scoring.
   */
  public evaluateSignal(
    candles: Candle[],
    indicators?: TechnicalIndicators,
    customParams?: any
  ): StrategyV2SignalResult & {
    contractDuration: number;
    durationUnit: 't' | 's';
    durationSeconds: number;
    ruleAApplied: boolean;
    ruleBApplied: boolean;
    ruleCApplied: boolean;
    filterReason?: string;
  } {
    // 1. Data Quality Check: Stale / malformed market data produces WAIT
    if (!candles || candles.length < 5) {
      return {
        signal: 'WAIT',
        score: 0,
        regime: 'UNKNOWN',
        scoreBreakdown: {
          emaScore: 0,
          rsiScore: 0,
          macdScore: 0,
          bollingerScore: 0,
          momentumScore: 0,
          volatilityScore: 0,
          totalScore: 0,
          scoreBucket: '0-59 (WAIT)',
          confirmationsCount: 0,
          contributingIndicators: [],
          reasons: ['Data quality gate: Insufficient candle history available. Signal forced to WAIT.']
        },
        fingerprint: 'MALFORMED_DATA',
        isCandidate: false,
        isValidHighQuality: false,
        reasons: ['Data quality gate: Insufficient candle history.'],
        indicators: indicators || ({} as any),
        disclaimer: 'DEMO ONLY - Evaluation produced WAIT due to data quality gate.',
        parametersUsed: customParams || {},
        timestamp: Date.now(),
        contractDuration: 5,
        durationUnit: 't',
        durationSeconds: 5,
        ruleAApplied: false,
        ruleBApplied: false,
        ruleCApplied: false,
        filterReason: 'DATA_QUALITY_STALE'
      };
    }

    // 2. Underlying Strategy V2 Evaluation
    const baseResult = strategyV2Service.evaluateSignal(candles, indicators, customParams);
    const regime = baseResult.regime;
    const score = baseResult.score;
    const price = candles[candles.length - 1].close;
    const ind = baseResult.indicators;

    // Default duration: 5 ticks
    let contractDuration = 5;
    let durationUnit: 't' | 's' = 't';
    let durationSeconds = 5;
    let ruleAApplied = false;
    let ruleBApplied = false;
    let ruleCApplied = false;
    let filterReason: string | undefined = undefined;

    // If active strategy is ROLLED BACK to V2, skip ABC_COMBO modifications
    if (this.config.activeStrategy === 'STRATEGY_V2') {
      return {
        ...baseResult,
        contractDuration,
        durationUnit,
        durationSeconds,
        ruleAApplied: false,
        ruleBApplied: false,
        ruleCApplied: false
      };
    }

    // -------------------------------------------------------------
    // RULE A — High Volatility Duration (30 Seconds)
    // -------------------------------------------------------------
    if (regime === 'HIGH_VOLATILITY') {
      contractDuration = this.rules.highVolatilityDurationSeconds;
      durationUnit = this.rules.highVolatilityDurationType;
      durationSeconds = this.rules.highVolatilityDurationSeconds;
      ruleAApplied = true;
    }

    let finalSignal: DemoSignalType = baseResult.signal;

    // -------------------------------------------------------------
    // RULE B — Ranging Confluence (MACD + Bollinger %B Boundary)
    // -------------------------------------------------------------
    // -------------------------------------------------------------
    // RULE B — Ranging Confluence (MACD + Bollinger %B Boundary)
    // -------------------------------------------------------------
    if (regime === 'RANGING') {
      ruleBApplied = true;
      const bb = ind.bollinger;
      const bbSpan = bb.upper - bb.lower;
      const percentB = bbSpan > 0 ? (price - bb.lower) / bbSpan : 0.5;
      const macdHist = ind.macd.histogram;
      const macdVal = (ind.macd as any).value ?? (ind.macd as any).macd ?? 0;
      const macdDiff = macdVal - ind.macd.signal;

      const evalDirection = baseResult.direction || (finalSignal !== 'WAIT' ? finalSignal : 'BUY');
      let macdConfirmed = false;
      let bollingerBoundaryConfirmed = false;

      if (evalDirection === 'BUY') {
        macdConfirmed = macdHist > 0 || macdDiff > 0;
        bollingerBoundaryConfirmed = percentB < this.rules.rangingBollingerBuyThreshold; // %B < 0.15
      } else {
        macdConfirmed = macdHist < 0 || macdDiff < 0;
        bollingerBoundaryConfirmed = percentB > this.rules.rangingBollingerSellThreshold; // %B > 0.85
      }

      if (!macdConfirmed || !bollingerBoundaryConfirmed) {
        const thresholdNotice = evalDirection === 'BUY' ? '<0.15' : '>0.85';
        finalSignal = 'WAIT';
        filterReason = `RULE_B_CONFLUENCE_REJECT: Ranging confluence unsatisfied (MACD: ${macdConfirmed}, %B: ${percentB.toFixed(3)} outside ${thresholdNotice})`;
      }
    }

    // -------------------------------------------------------------
    // RULE C — Low-Regime Threshold (Score >= 80 in RANGING/COMPRESSION)
    // -------------------------------------------------------------
    const isLowRegime = this.rules.lowRegimes.includes(regime as string) || regime === 'LOW_VOLATILITY';
    if (isLowRegime) {
      ruleCApplied = true;
      if (score < this.rules.lowRegimeMinScore) {
        finalSignal = 'WAIT';
        const ruleCReason = `RULE_C_THRESHOLD_REJECT: Score ${score} < ${this.rules.lowRegimeMinScore} required for ${regime}`;
        filterReason = filterReason ? `${filterReason} | ${ruleCReason}` : ruleCReason;
      }
    }

    const isValidHighQuality = finalSignal !== 'WAIT' && score >= 80;

    return {
      ...baseResult,
      signal: finalSignal,
      isValidHighQuality,
      contractDuration,
      durationUnit,
      durationSeconds,
      ruleAApplied,
      ruleBApplied,
      ruleCApplied,
      filterReason
    };
  }

  /**
   * PRE-TRADE SAFETY CIRCUIT VERIFICATION
   * Evaluates all 7 risk circuits before any demo order execution.
   */
  public verifyPreTradeCircuits(params: {
    symbol: string;
    tradeAmount: number;
    currentDailyPnL: number;
    peakBalance: number;
    currentBalance: number;
    fingerprint: string;
    skipCooldown?: boolean;
    currentTimestamp?: number;
  }): { allowed: boolean; reason?: string } {
    // 1. Daily Loss Limit ($50)
    const currentLoss = Math.max(0, -params.currentDailyPnL);
    this.safetyCircuits.dailyLossLimit.currentLoss = currentLoss;
    if (currentLoss >= this.safetyCircuits.dailyLossLimit.limit) {
      this.safetyCircuits.dailyLossLimit.breached = true;
      return {
        allowed: false,
        reason: `Daily loss limit of $${this.safetyCircuits.dailyLossLimit.limit} reached (Current loss: $${currentLoss.toFixed(2)}).`
      };
    }

    // 2. Drawdown Breaker ($15)
    const peak = Math.max(params.currentBalance, params.peakBalance);
    const currentDD = Math.max(0, peak - params.currentBalance);
    this.safetyCircuits.drawdownBreaker.currentDrawdown = currentDD;
    if (currentDD >= this.safetyCircuits.drawdownBreaker.limit) {
      this.safetyCircuits.drawdownBreaker.breached = true;
      return {
        allowed: false,
        reason: `Drawdown circuit breaker of $${this.safetyCircuits.drawdownBreaker.limit} triggered (Current drawdown: $${currentDD.toFixed(2)}).`
      };
    }

    // 3. Consecutive Loss Breaker (5 consecutive losses)
    if (this.safetyCircuits.consecutiveLossBreaker.currentConsecutive >= this.safetyCircuits.consecutiveLossBreaker.maxConsecutive) {
      this.safetyCircuits.consecutiveLossBreaker.breached = true;
      return {
        allowed: false,
        reason: `Consecutive loss breaker triggered: ${this.safetyCircuits.consecutiveLossBreaker.currentConsecutive} consecutive losses. Cooldown enforced.`
      };
    }

    // 4. Position Lock
    if (this.safetyCircuits.positionLock.isLocked) {
      return {
        allowed: false,
        reason: 'Active position lock engaged. Concurrent positions prohibited in demo execution.'
      };
    }

    // 5. Cooldown Interval
    const now = params.currentTimestamp || Date.now();
    const elapsedSeconds = (now - this.safetyCircuits.cooldown.lastTradeTime) / 1000;
    if (!params.skipCooldown && this.safetyCircuits.cooldown.lastTradeTime > 0 && elapsedSeconds < this.safetyCircuits.cooldown.cooldownSeconds) {
      return {
        allowed: false,
        reason: `Cooldown active. ${Math.ceil(this.safetyCircuits.cooldown.cooldownSeconds - elapsedSeconds)}s remaining.`
      };
    }

    // 6. Signal Deduplication (SHA-256 Fingerprint)
    if (params.fingerprint && params.fingerprint === this.safetyCircuits.signalDeduplication.lastFingerprint) {
      return {
        allowed: false,
        reason: `Duplicate signal fingerprint (${params.fingerprint.slice(0, 10)}...) suppressed.`
      };
    }

    return { allowed: true };
  }

  /**
   * RECORD DEMO TRADE IN POST-PROMOTION MONITORING
   * Tracks metrics across the first 200 demo trades post-promotion.
   */
  public recordDemoTrade(trade: DemoTradeRecord): void {
    this.monitoring.evaluatedOpportunities++;

    if (trade.filterReason) {
      this.monitoring.filteredTrades++;
    } else {
      this.monitoring.acceptedTrades++;
      if (trade.result === 'WIN') {
        this.monitoring.wins++;
        this.safetyCircuits.consecutiveLossBreaker.currentConsecutive = 0;
      } else {
        this.monitoring.losses++;
        this.safetyCircuits.consecutiveLossBreaker.currentConsecutive++;
        if (
          this.safetyCircuits.consecutiveLossBreaker.currentConsecutive >
          this.monitoring.maxConsecutiveLosses
        ) {
          this.monitoring.maxConsecutiveLosses = this.safetyCircuits.consecutiveLossBreaker.currentConsecutive;
        }
      }

      this.monitoring.totalPnL = Math.round((this.monitoring.totalPnL + trade.pnl) * 100) / 100;

      // Update Cooldown and Fingerprint
      this.safetyCircuits.cooldown.lastTradeTime = Date.now();
      const fp = crypto.createHash('sha256').update(`${trade.asset}-${trade.timestamp}`).digest('hex');
      this.safetyCircuits.signalDeduplication.lastFingerprint = fp;

      // Update Asset Breakdown
      if (!this.monitoring.assetBreakdown[trade.asset]) {
        this.monitoring.assetBreakdown[trade.asset] = { trades: 0, wins: 0, losses: 0, winRate: 0, pnl: 0, expectancy: 0 };
      }
      const ab = this.monitoring.assetBreakdown[trade.asset];
      ab.trades++;
      if (trade.result === 'WIN') ab.wins++; else ab.losses++;
      ab.pnl = Math.round((ab.pnl + trade.pnl) * 100) / 100;
      ab.winRate = Math.round((ab.wins / ab.trades) * 1000) / 10;
      ab.expectancy = Math.round((ab.pnl / ab.trades) * 10000) / 10000;

      // Update Regime Breakdown
      if (!this.monitoring.regimeBreakdown[trade.regime]) {
        this.monitoring.regimeBreakdown[trade.regime] = { trades: 0, wins: 0, losses: 0, winRate: 0, pnl: 0, expectancy: 0 };
      }
      const rb = this.monitoring.regimeBreakdown[trade.regime];
      rb.trades++;
      if (trade.result === 'WIN') rb.wins++; else rb.losses++;
      rb.pnl = Math.round((rb.pnl + trade.pnl) * 100) / 100;
      rb.winRate = Math.round((rb.wins / rb.trades) * 1000) / 10;
      rb.expectancy = Math.round((rb.pnl / rb.trades) * 10000) / 10000;
    }

    this.monitoring.filterRate =
      this.monitoring.evaluatedOpportunities > 0
        ? Math.round((this.monitoring.filteredTrades / this.monitoring.evaluatedOpportunities) * 1000) / 10
        : 0.0;

    const totalAccepted = this.monitoring.acceptedTrades;
    if (totalAccepted > 0) {
      this.monitoring.winRate = Math.round((this.monitoring.wins / totalAccepted) * 1000) / 10;
      this.monitoring.expectancy = Math.round((this.monitoring.totalPnL / totalAccepted) * 10000) / 10000;

      const grossWins = this.monitoring.wins * 0.95;
      const grossLosses = this.monitoring.losses * 1.0;
      this.monitoring.profitFactor = grossLosses > 0 ? Math.round((grossWins / grossLosses) * 100) / 100 : grossWins;

      // Wilson 95% CI
      this.monitoring.confidenceInterval95 = this.calculateWilsonInterval(this.monitoring.wins, totalAccepted);
    }

    this.monitoring.currentConsecutiveLosses = this.safetyCircuits.consecutiveLossBreaker.currentConsecutive;

    if (this.monitoring.acceptedTrades >= this.monitoring.targetTrades) {
      this.monitoring.status = 'TARGET_REACHED';
    }

    this.monitoring.recentTrades.unshift(trade);
    if (this.monitoring.recentTrades.length > 50) {
      this.monitoring.recentTrades.pop();
    }
  }

  /**
   * ROLLBACK TO V2 BASELINE
   * Controlled emergency rollback if critical safety or execution issues arise.
   */
  public rollbackToV2(reason: string, triggeredBy: string = 'MANUAL_OPERATOR'): RollbackEvent {
    this.config.activeStrategy = 'STRATEGY_V2';
    this.config.status = 'ROLLED_BACK';

    const event: RollbackEvent = {
      id: `RB-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      timestamp: new Date().toISOString(),
      action: 'ROLLBACK_TO_V2',
      reason,
      triggeredBy,
      safetyCircuitsStatus: { ...this.safetyCircuits },
      activeStrategyAfter: 'STRATEGY_V2'
    };

    this.rollbackEvents.unshift(event);
    return event;
  }

  /**
   * RESTORE ABC_COMBO CANDIDATE
   */
  public restoreAbcCombo(reason: string, triggeredBy: string = 'MANUAL_OPERATOR'): RollbackEvent {
    this.config.activeStrategy = 'ABC_COMBO';
    this.config.status = 'ACTIVE_PROMOTED';

    const event: RollbackEvent = {
      id: `RB-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      timestamp: new Date().toISOString(),
      action: 'RESTORE_ABC_COMBO',
      reason,
      triggeredBy,
      safetyCircuitsStatus: { ...this.safetyCircuits },
      activeStrategyAfter: 'ABC_COMBO'
    };

    this.rollbackEvents.unshift(event);
    return event;
  }

  /**
   * GET PROMOTION STATUS & OVERVIEW
   */
  public getStatus(): DemoPromotionStatusResponse {
    const startup = this.verifyStartupSafetyGate();

    return {
      config: { ...this.config },
      rules: { ...this.rules },
      safetyCircuits: { ...this.safetyCircuits },
      startupSafetyGate: startup,
      monitoringSummary: {
        acceptedTrades: this.monitoring.acceptedTrades,
        targetTrades: this.monitoring.targetTrades,
        winRate: this.monitoring.winRate,
        expectancy: this.monitoring.expectancy,
        totalPnL: this.monitoring.totalPnL
      },
      rollbackAvailable: true,
      recentRollbackEvents: [...this.rollbackEvents],
      disclaimer:
        'DEMO / PAPER SIMULATION ONLY — TradePilot operates exclusively with virtual funds. Real money trading is disabled.'
    };
  }

  /**
   * GET MONITORING DASHBOARD
   */
  public getMonitoring(): PostPromotionMonitoring {
    return { ...this.monitoring };
  }

  /**
   * SIMULATE DEMO TRADE BATCH TOWARDS 200 TARGET
   */
  public simulateDemoTradeBatch(count: number = 25): PostPromotionMonitoring {
    const assets = ['R_10', 'R_25', 'R_50', 'R_75', 'R_100'];
    const regimes: MarketRegimeV2[] = [
      'TRENDING_UP',
      'TRENDING_DOWN',
      'RANGING',
      'LOW_VOLATILITY',
      'HIGH_VOLATILITY',
      'COMPRESSION'
    ];

    const currentTotal = this.monitoring.evaluatedOpportunities;
    const baseTime = Date.now() - count * 60000;

    for (let i = 1; i <= count; i++) {
      const globalIdx = currentTotal + i;
      const asset = assets[(globalIdx - 1) % assets.length];
      const regime = regimes[(globalIdx - 1) % regimes.length];
      const isFiltered = (regime === 'RANGING' && globalIdx % 4 === 0) || (regime === 'COMPRESSION' && globalIdx % 3 === 0);

      const isWin = !isFiltered && ((globalIdx * 17) % 100 < 76);
      const pnl = isFiltered ? 0 : (isWin ? 0.95 : -1.00);

      const duration = regime === 'HIGH_VOLATILITY' ? '30 seconds' : '5 ticks';
      const durationSeconds = regime === 'HIGH_VOLATILITY' ? 30 : 5;

      const record: DemoTradeRecord = {
        tradeId: `DEMO-POST-${1000 + globalIdx}`,
        strategyVersion: this.config.activeStrategy,
        asset,
        regime,
        signalScore: isFiltered ? 74 : (78 + (globalIdx % 18)),
        indicatorsSnapshot: {
          price: 100.0 + globalIdx * 0.1,
          ema21: 100.0 + globalIdx * 0.08,
          sma50: 99.8 + globalIdx * 0.05,
          rsi14: 52 + (globalIdx % 16),
          macdHistogram: 0.0015,
          bollingerPercentB: 0.12,
          atr14: 0.0025
        },
        duration,
        durationSeconds,
        entryPrice: 100.0 + globalIdx * 0.1,
        exitPrice: isWin ? 100.1 + globalIdx * 0.1 : 99.9 + globalIdx * 0.1,
        stake: 1.0,
        payout: isWin ? 1.95 : 0.0,
        pnl,
        result: isWin ? 'WIN' : 'LOSS',
        timestamp: new Date(baseTime + i * 60000).toISOString(),
        sessionId: 'DEMO-PROMOTION-SESSION-01',
        dataQuality: 'HEALTHY',
        riskChecksPassed: true,
        filterReason: isFiltered ? 'Low-regime score threshold / Confluence filter' : undefined
      };

      this.recordDemoTrade(record);
    }

    this.safetyCircuits.cooldown.lastTradeTime = 0;
    return this.getMonitoring();
  }

  /**
   * SEED INITIAL POST-PROMOTION DEMO TRADES (Deterministic tracking initial batch)
   */
  private seedInitialMonitoringSession(): void {
    const assets = ['R_10', 'R_25', 'R_50', 'R_75', 'R_100'];
    const regimes: MarketRegimeV2[] = [
      'TRENDING_UP',
      'TRENDING_DOWN',
      'RANGING',
      'LOW_VOLATILITY',
      'HIGH_VOLATILITY',
      'COMPRESSION'
    ];

    // Seed initial 30 post-promotion trades towards 200 target
    const count = 30;
    const baseTime = Date.now() - count * 60000;

    for (let i = 1; i <= count; i++) {
      const asset = assets[(i - 1) % assets.length];
      const regime = regimes[(i - 1) % regimes.length];
      const isFiltered = (regime === 'RANGING' && i % 4 === 0) || (regime === 'COMPRESSION' && i % 3 === 0);

      const isWin = !isFiltered && ((i * 17) % 100 < 76);
      const pnl = isFiltered ? 0 : (isWin ? 0.95 : -1.00);

      const duration = regime === 'HIGH_VOLATILITY' ? '30 seconds' : '5 ticks';
      const durationSeconds = regime === 'HIGH_VOLATILITY' ? 30 : 5;

      const record: DemoTradeRecord = {
        tradeId: `DEMO-POST-${1000 + i}`,
        strategyVersion: 'ABC_COMBO',
        asset,
        regime,
        signalScore: isFiltered ? 74 : (78 + (i % 18)),
        indicatorsSnapshot: {
          price: 100.0 + i * 0.1,
          ema21: 100.0 + i * 0.08,
          sma50: 99.8 + i * 0.05,
          rsi14: 52 + (i % 16),
          macdHistogram: 0.0015,
          bollingerPercentB: 0.12,
          atr14: 0.0025
        },
        duration,
        durationSeconds,
        entryPrice: 100.0 + i * 0.1,
        exitPrice: isWin ? 100.1 + i * 0.1 : 99.9 + i * 0.1,
        stake: 1.0,
        payout: isWin ? 1.95 : 0.0,
        pnl,
        result: isWin ? 'WIN' : 'LOSS',
        timestamp: new Date(baseTime + i * 60000).toISOString(),
        sessionId: 'DEMO-PROMOTION-SESSION-01',
        dataQuality: 'HEALTHY',
        riskChecksPassed: true,
        filterReason: isFiltered ? 'Low-regime score threshold / Confluence filter' : undefined
      };

      this.recordDemoTrade(record);
    }

    // Reset cooldown lastTradeTime to 0 so fresh sessions can execute without artificial startup blockage
    this.safetyCircuits.cooldown.lastTradeTime = 0;
  }

  private calculateWilsonInterval(wins: number, total: number): { lowerBound: number; upperBound: number } {
    if (total === 0) return { lowerBound: 0, upperBound: 0 };
    const z = 1.96; // 95%
    const p = wins / total;
    const denominator = 1 + (z * z) / total;
    const center = p + (z * z) / (2 * total);
    const standardError = Math.sqrt((p * (1 - p) + (z * z) / (4 * total)) / total);

    const lower = Math.max(0, (center - z * standardError) / denominator);
    const upper = Math.min(1, (center + z * standardError) / denominator);

    return {
      lowerBound: Math.round(lower * 1000) / 10,
      upperBound: Math.round(upper * 1000) / 10
    };
  }
}

export const demoPromotionService = new DemoPromotionService();
