/**
 * Models and contracts for TradePilot Controlled ABC_COMBO DEMO Promotion.
 * Execution is strictly DEMO / PAPER ONLY on Deriv Synthetic Indices.
 */

export interface ActiveStrategyConfig {
  activeStrategy: 'ABC_COMBO' | 'STRATEGY_V2';
  executionMode: 'DEMO';
  realMoneyEnabled: false;
  previousBaseline: 'STRATEGY_V2';
  promotedAt: string;
  promotedBy: string;
  status: 'ACTIVE_PROMOTED' | 'ROLLED_BACK';
  version: string;
  description: string;
}

export interface AbcComboRulesConfig {
  highVolatilityDurationSeconds: number; // 30
  highVolatilityDurationType: 's';       // seconds
  standardDurationTicks: number;         // 5
  standardDurationType: 't';            // ticks
  rangingMacdConfirmationRequired: boolean;
  rangingBollingerBandRequired: boolean;
  rangingBollingerBuyThreshold: number;  // %B < 0.15
  rangingBollingerSellThreshold: number; // %B > 0.85
  lowRegimeMinScore: number;             // >= 80
  lowRegimes: string[];                  // ['RANGING', 'COMPRESSION']
}

export interface SafetyCircuitsStatus {
  dailyLossLimit: {
    limit: number;
    active: boolean;
    currentLoss: number;
    breached: boolean;
  };
  drawdownBreaker: {
    limit: number;
    active: boolean;
    currentDrawdown: number;
    breached: boolean;
  };
  consecutiveLossBreaker: {
    maxConsecutive: number;
    active: boolean;
    currentConsecutive: number;
    breached: boolean;
  };
  positionLock: {
    active: boolean;
    isLocked: boolean;
  };
  cooldown: {
    cooldownSeconds: number;
    active: boolean;
    lastTradeTime: number;
  };
  signalDeduplication: {
    algorithm: string;
    active: boolean;
    lastFingerprint: string;
  };
  dataQualityGate: {
    active: boolean;
    verified: boolean;
    lastQualityCheck: string;
  };
  demoPaperEnforcement: {
    active: boolean;
    realMoneyBlocked: boolean;
    brokerApiBlocked: boolean;
  };
  allCircuitsActive: boolean;
  allCircuitsIntact: boolean;
}

export interface StartupSafetyGateCheck {
  name: string;
  passed: boolean;
  details: string;
}

export interface StartupSafetyGateResult {
  executionMode: 'DEMO';
  realMoneyEnabled: false;
  activeStrategy: string;
  riskControls: 'ENABLED';
  passed: boolean;
  checks: StartupSafetyGateCheck[];
  timestamp: string;
}

export interface DemoTradeRecord {
  tradeId: string;
  strategyVersion: string;
  asset: string;
  regime: string;
  signalScore: number;
  indicatorsSnapshot: {
    price: number;
    ema21: number;
    sma50: number;
    rsi14: number;
    macdHistogram: number;
    bollingerPercentB: number;
    atr14: number;
  };
  duration: string;
  durationSeconds: number;
  entryPrice: number;
  exitPrice: number;
  stake: number;
  payout: number;
  pnl: number;
  result: 'WIN' | 'LOSS';
  timestamp: string;
  sessionId: string;
  dataQuality: 'HEALTHY' | 'STALE' | 'ANOMALOUS';
  riskChecksPassed: boolean;
  filterReason?: string;
}

export interface PostPromotionMonitoring {
  targetTrades: number; // 200
  evaluatedOpportunities: number;
  acceptedTrades: number;
  filteredTrades: number;
  filterRate: number;
  wins: number;
  losses: number;
  winRate: number;
  confidenceInterval95: {
    lowerBound: number;
    upperBound: number;
  };
  totalPnL: number;
  expectancy: number;
  profitFactor: number;
  maxDrawdown: number;
  maxConsecutiveLosses: number;
  currentConsecutiveLosses: number;
  assetBreakdown: Record<
    string,
    {
      trades: number;
      wins: number;
      losses: number;
      winRate: number;
      pnl: number;
      expectancy: number;
    }
  >;
  regimeBreakdown: Record<
    string,
    {
      trades: number;
      wins: number;
      losses: number;
      winRate: number;
      pnl: number;
      expectancy: number;
    }
  >;
  recentTrades: DemoTradeRecord[];
  status: 'MONITORING_IN_PROGRESS' | 'TARGET_REACHED';
}

export interface RollbackEvent {
  id: string;
  timestamp: string;
  action: 'ROLLBACK_TO_V2' | 'RESTORE_ABC_COMBO';
  reason: string;
  triggeredBy: string;
  safetyCircuitsStatus: Partial<SafetyCircuitsStatus>;
  activeStrategyAfter: string;
}

export interface DemoPromotionStatusResponse {
  config: ActiveStrategyConfig;
  rules: AbcComboRulesConfig;
  safetyCircuits: SafetyCircuitsStatus;
  startupSafetyGate: StartupSafetyGateResult;
  monitoringSummary: {
    acceptedTrades: number;
    targetTrades: number;
    winRate: number;
    expectancy: number;
    totalPnL: number;
  };
  rollbackAvailable: boolean;
  recentRollbackEvents: RollbackEvent[];
  disclaimer: string;
}
