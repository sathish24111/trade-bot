/**
 * Phase 7 Domain Models: Live Read-Only Market Data, Push Notifications & Adaptive Paper-Trading Intelligence
 * Strict PAPER safety: No broker execution, zero real money trading.
 */

export type MarketProviderState = 'HEALTHY' | 'DEGRADED' | 'FAILED' | 'RECOVERING' | 'DISABLED';

export type ProviderDataStatus = 'LIVE_READ_ONLY' | 'SIMULATED' | 'DELAYED' | 'STALE' | 'FAILED' | 'UNAVAILABLE';

export interface NormalizedMarketTick {
  asset: string;
  timestamp: number;
  price: number;
  bid?: number;
  ask?: number;
  volume?: number;
  provider: string;
  status: ProviderDataStatus;
  isLive: boolean;
}

export interface ProviderHealthInfo {
  provider: string;
  connectionStatus: MarketProviderState;
  lastMessageTime?: number;
  lastCandleTime?: number;
  latencyMs: number;
  messageRate: number;
  reconnectCount: number;
  errorCount: number;
  dataAgeMs: number;
  gapCount: number;
  invalidCount: number;
  duplicateCount: number;
  uptimePercent: number;
  availabilityPercent: number;
  avgLatencyMs: number;
  maxLatencyMs: number;
  failoverCount: number;
  fallbackActive: boolean;
  activeProviderName: string;
}

export interface DataQualityValidation {
  isValid: boolean;
  reason?: string;
  timestampOk: boolean;
  priceOk: boolean;
  ohlcOk: boolean;
  volumeOk: boolean;
  sequenceOk: boolean;
  duplicate: boolean;
  gapDetected: boolean;
  abnormalJump: boolean;
  stale: boolean;
}

export type NotificationCategory =
  | 'CRITICAL_RISK'
  | 'STRATEGY_DRIFT'
  | 'MARKET_DATA'
  | 'SYSTEM_HEALTH'
  | 'EXPERIMENT'
  | 'PAPER_TRADE'
  | 'ANOMALY';

export type NotificationDeliveryStatus = 'PENDING' | 'SENT' | 'FAILED' | 'INVALID_TOKEN';

export interface NotificationDevice {
  id?: number;
  userId: number;
  deviceToken: string;
  platform: 'ANDROID' | 'IOS' | 'WEB';
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastSeenAt?: string;
}

export interface NotificationPreferences {
  id?: number;
  userId: number;
  notificationsEnabled: boolean;
  criticalRisk: boolean;
  strategyDrift: boolean;
  marketData: boolean;
  systemHealth: boolean;
  paperTrade: boolean;
  experiment: boolean;
  anomaly: boolean;
  updatedAt?: string;
}

export interface NotificationPayload {
  category: NotificationCategory;
  title: string;
  body: string;
  metadata?: Record<string, any>;
  userId?: number;
}

export type StrategyControlAction = 'NORMAL' | 'THROTTLE' | 'PAUSE' | 'BLOCK';

export interface StrategyPolicyConfig {
  strategyId: string;
  version?: number;
  driftThresholds: {
    watchExpDropPct: number;
    significantExpDropPct: number;
    criticalExpDropPct: number;
  };
  riskThresholds: {
    maxDailyLossPct: number;
    maxDrawdownPct: number;
    maxConsecutiveLosses: number;
  };
  throttleRules: {
    watchRiskMultiplier: number;
    significantRiskMultiplier: number;
    cooldownSeconds: number;
    maxSignalsPerHour?: number;
  };
  pauseRules: {
    autoPauseOnCriticalDrift: boolean;
    autoPauseOnCriticalRisk: boolean;
  };
  recoveryRules: {
    minObservationMinutes: number;
    requireConsecutiveWins?: number;
    requireHealthyMarketHealth: boolean;
    autoResume: boolean;
  };
  enabled: boolean;
}

export interface StrategyAdaptationEvent {
  id?: number;
  strategyId: string;
  previousState: string;
  newState: string;
  triggerEvent: string;
  reason: string;
  automatic: boolean;
  metadata?: any;
  createdAt?: string;
}

export interface ExperimentTimelineEvent {
  id?: number;
  experimentId: string;
  sequence: number;
  eventType: string;
  title: string;
  details: any;
  timestamp: string | Date;
}
