/**
 * TradePilot Phase 6 — Domain Models for Advanced Paper-Trading Intelligence,
 * Real-Time Monitoring & Strategy Drift Detection.
 *
 * ALL EXECUTION STRICTLY REMAINS PAPER/DEMO ONLY (TRADING_MODE=PAPER).
 */

export type MarketDataHealthStatus =
  | 'HEALTHY'
  | 'DELAYED'
  | 'STALE'
  | 'GAP_DETECTED'
  | 'INVALID'
  | 'UNAVAILABLE'
  | 'SIMULATED';

export interface MarketHealthInfo {
  provider: string;
  asset: string;
  timeframe: string;
  lastCandleTimestamp: string;
  lastReceivedTimestamp: string;
  dataAgeMs: number;
  latencyMs: number;
  candleCount: number;
  missingCandles: number;
  duplicateCandles: number;
  invalidCandles: number;
  status: MarketDataHealthStatus;
  details?: string;
}

export type SignalStatus =
  | 'GENERATED'
  | 'EXECUTED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'REJECTED_BY_RISK';

export interface PaperSignal {
  signalId: string;
  asset: string;
  timeframe: string;
  strategy: string;
  timestamp: string;
  direction: 'BUY' | 'SELL' | 'WAIT';
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  riskAmount: number;
  confidence: number;
  marketRegime: string;
  indicatorSnapshot: Record<string, any>;
  status: SignalStatus;
  rejectionReason?: string;
}

export interface SignalOutcome {
  signalId: string;
  actualEntryPrice: number;
  actualExitPrice: number;
  returnPct: number;
  maxFavorableExcursion: number;
  maxAdverseExcursion: number;
  holdingTimeSeconds: number;
  result: 'WIN' | 'LOSS';
  pnl: number;
}

export interface SignalAnalyticsReport {
  totalSignals: number;
  executedSignals: number;
  expiredSignals: number;
  rejectedSignals: number;
  winRate: number;
  avgReturn: number;
  avgMFE: number;
  avgMAE: number;
  avgHoldingTime: number;
  profitFactor: number;
  expectancy: number;
  conversionRate: number;
  regimePerformance: Record<string, { total: number; wins: number; winRate: number }>;
}

export type DriftClassification = 'STABLE' | 'WATCH' | 'SIGNIFICANT' | 'CRITICAL';

export interface StrategyDriftMetric {
  strategy: string;
  asset: string;
  timeframe: string;
  backtestWinRate: number;
  paperWinRate: number;
  winRateDrift: number;
  expectancyDrift: number;
  profitFactorDrift: number;
  drawdownDrift: number;
  sampleSize: number;
  classification: DriftClassification;
  statusMessage: string;
}

export type DivergenceClassification =
  | 'NO_SIGNIFICANT_DIVERGENCE'
  | 'MARKET_DATA_DRIFT'
  | 'SIGNAL_DRIFT'
  | 'EXECUTION_DRIFT'
  | 'SLIPPAGE_DRIFT'
  | 'COST_DRIFT'
  | 'RISK_DRIFT'
  | 'REGIME_DRIFT'
  | 'MIXED';

export interface DivergenceReport {
  experimentId: string;
  strategy: string;
  asset: string;
  timeframe: string;
  backtest: Record<string, any>;
  paper: Record<string, any>;
  divergence: {
    marketDataDivergencePct: number;
    entryDivergencePct: number;
    exitDivergencePct: number;
    slippageDivergencePct: number;
    feeDivergencePct: number;
    signalDivergencePct: number;
    timingDivergenceSec: number;
    riskDivergencePct: number;
    regimeDivergence: string;
  };
  classification: DivergenceClassification;
  summary: string;
}

export interface PortfolioExposureLimits {
  maxPortfolioExposure: number; // e.g. 0.80 (80%)
  maxAssetExposure: number;     // e.g. 0.40 (40%)
  maxStrategyExposure: number;  // e.g. 0.50 (50%)
  maxDailyLossPercent: number;  // e.g. 0.05 (5%)
  maxDrawdownPercent: number;   // e.g. 0.10 (10%)
  maxConcurrentPositions: number; // e.g. 3
}

export interface PortfolioExposureSummary {
  portfolioId: string;
  totalEquity: number;
  cashBalance: number;
  usedCapital: number;
  availableCapital: number;
  grossExposure: number;
  netExposure: number;
  assetExposure: Record<string, number>;
  strategyExposure: Record<string, number>;
  correlationExposure: number;
  riskExposure: number;
  dailyLoss: number;
  currentDrawdown: number;
  limitsBreached: string[];
  isNewTradeBlocked: boolean;
  status: string;
}

export type RiskState = 'NORMAL' | 'ELEVATED' | 'HIGH' | 'LIMIT_REACHED';

export interface RiskDashboardState {
  dailyPnL: number;
  dailyLossPct: number;
  currentDrawdown: number;
  maxDrawdown: number;
  riskPerTrade: number;
  totalOpenRisk: number;
  portfolioExposure: number;
  positionCount: number;
  consecutiveLosses: number;
  volatility: number;
  atr: number;
  marketRegime: string;
  riskUtilization: number;
  riskState: RiskState;
}

export type AlertSeverity = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';

export type AlertType =
  | 'STALE_MARKET_DATA'
  | 'DATA_GAP'
  | 'HIGH_VOLATILITY'
  | 'RISK_LIMIT'
  | 'DAILY_LOSS_LIMIT'
  | 'DRAWDOWN_WARNING'
  | 'STRATEGY_DRIFT'
  | 'SIGNIFICANT_DIVERGENCE'
  | 'ABNORMAL_SLIPPAGE'
  | 'CONSECUTIVE_LOSSES'
  | 'PORTFOLIO_EXPOSURE'
  | 'EXPERIMENT_COMPLETED'
  | 'EXPERIMENT_FAILED'
  | 'SYSTEM_RECOVERY'
  | 'MARKET_PROVIDER_FAILOVER'
  | 'STRATEGY_AUTO_PAUSED';

export interface PaperAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  timestamp: string;
  asset?: string;
  strategy?: string;
  message: string;
  metadata?: Record<string, any>;
  acknowledged: boolean;
  resolved: boolean;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export type StrategyState = 'enabled' | 'disabled' | 'paused';

export interface StrategyControlState {
  strategy: string;
  name: string;
  state: StrategyState;
  updatedAt: string;
  reason?: string;
  user?: string;
}

export interface StrategyAuditRecord {
  id: number;
  strategy: string;
  oldState: StrategyState;
  newState: StrategyState;
  timestamp: string;
  reason?: string;
  userId?: number;
}

export type AnomalyType =
  | 'PRICE_SPIKE'
  | 'VOLUME_SPIKE'
  | 'ABNORMAL_SPREAD'
  | 'ABNORMAL_SLIPPAGE'
  | 'SUDDEN_VOLATILITY'
  | 'REPEATED_SIGNALS'
  | 'IMPOSSIBLE_PRICE'
  | 'DUPLICATE_TRADES'
  | 'DUPLICATE_CANDLES'
  | 'INVALID_VALUES'
  | 'UNEXPECTED_PNL_JUMP'
  | 'UNEXPECTED_POSITION_SIZE'
  | 'WS_EVENT_DUPLICATION';

export interface MarketAnomaly {
  id: string;
  type: AnomalyType;
  timestamp: string;
  asset: string;
  severity: AlertSeverity;
  observedValue: string | number;
  expectedRange: string;
  explanation: string;
  resolved: boolean;
}

export interface ComponentHealth {
  name: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  latencyMs: number;
  details?: string;
}

export interface SystemHealthStatus {
  overall: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  components: ComponentHealth[];
  heartbeatTimestamp: string;
}

export interface WebSocketEventEnvelope {
  event: string;
  sequence: number;
  timestamp: string;
  mode: 'PAPER';
  isRealMoney: false;
  brokerConnected: false;
  payload: any;
}
