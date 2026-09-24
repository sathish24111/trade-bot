import { Candle, TechnicalIndicators, DemoSignalType } from './MarketData';

export type MarketRegimeV2 =
  | 'TRENDING_UP'
  | 'TRENDING_DOWN'
  | 'RANGING'
  | 'HIGH_VOLATILITY'
  | 'LOW_VOLATILITY'
  | 'UNKNOWN';

export type SignalScoreBucket =
  | '0-59 (WAIT)'
  | '60-69 (WEAK)'
  | '70-79 (CANDIDATE)'
  | '80-100 (HIGH_QUALITY)';

export interface SignalScoreBreakdown {
  emaScore: number;        // 0-25 points
  rsiScore: number;        // 0-20 points
  macdScore: number;       // 0-20 points
  bollingerScore: number;  // 0-15 points
  momentumScore: number;   // 0-10 points
  volatilityScore: number; // 0-10 points
  totalScore: number;      // 0-100 points
  scoreBucket: SignalScoreBucket;
  confirmationsCount: number;
  contributingIndicators: string[];
  reasons: string[];
}

export interface StrategyV2Parameters {
  emaFast: number;           // default 9
  emaSlow: number;           // default 21
  emaTrend: number;          // default 50
  rsiPeriod: number;         // default 14
  rsiOversold: number;       // default 30
  rsiOverbought: number;     // default 70
  macdFast: number;          // default 12
  macdSlow: number;          // default 26
  macdSignal: number;        // default 9
  bbPeriod: number;          // default 20
  bbDeviation: number;       // default 2.0
  minSignalScore: number;    // default 80
  cooldownSeconds: number;   // default 30
  minPriceMovement: number;  // default 0.0002
  minConfirmations: number;  // default 3
  [key: string]: number | boolean | string | undefined;
}

export interface StrategyV2SignalResult {
  signal: DemoSignalType;
  score: number;             // 0-100 normalized quality score
  regime: MarketRegimeV2;
  scoreBreakdown: SignalScoreBreakdown;
  fingerprint: string;
  isCandidate: boolean;
  isValidHighQuality: boolean;
  reasons: string[];
  indicators: TechnicalIndicators;
  disclaimer: string;
  parametersUsed: StrategyV2Parameters;
  timestamp: number;
  direction?: 'BUY' | 'SELL';
  evaluatedPrice?: number;
}

export interface TradeEligibilityCheck {
  eligible: boolean;
  reason: string;
  isDuplicate: boolean;
  isCooldownActive: boolean;
  isMinMovementSatisfied: boolean;
  isActivePositionLocked: boolean;
  isRiskAllowed: boolean;
}

export interface PaperTradeJournalEntry {
  id: string;
  signalId: string;
  strategyVersion: 'STRATEGY_V1' | 'STRATEGY_V2' | string;
  sessionId: string;
  userId: number;
  symbol: string;
  regime: MarketRegimeV2 | string;
  direction: 'BUY' | 'SELL' | 'WAIT';
  signalScore: number;
  scoreBreakdown?: SignalScoreBreakdown | Record<string, any>;
  indicatorValues?: TechnicalIndicators | Record<string, any>;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  result: 'WIN' | 'LOSS';
  durationSeconds: number;
  dataQualityOk: boolean;
  riskChecksPassed: boolean;
  createdAt: Date;
}

export interface StrategyComparisonMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  averageTradePnL: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpeRatio: number;
  sampleSizeStatus?: 'ADEQUATE' | 'MODERATE' | 'INSUFFICIENT_SAMPLE';
  sampleSizeWarning?: string;
}

export interface StrategyV1VsV2ComparisonResult {
  v1Metrics: StrategyComparisonMetrics;
  v2Metrics: StrategyComparisonMetrics;
  regimeBreakdown: Record<string, { v1Metrics: StrategyComparisonMetrics; v2Metrics: StrategyComparisonMetrics }>;
  scoreBucketBreakdown: Record<SignalScoreBucket, StrategyComparisonMetrics>;
  assetBreakdown: Record<string, { v1Metrics: StrategyComparisonMetrics; v2Metrics: StrategyComparisonMetrics }>;
  tradeReductionPct: number;
  summary: string;
  warnings: string[];
  disclaimer: string;
}

export interface ParameterSensitivityPoint {
  paramName?: string;
  paramValue?: number;
  params?: Partial<StrategyV2Parameters>;
  inSampleWinRate?: number;
  oosWinRate?: number;
  cliffDetected: boolean;
  cliffSeverity?: 'MODERATE' | 'SEVERE';
}

export interface OutOfSampleValidationReport {
  strategyId: string;
  datasetSplits: {
    inSample: {
      period: string;
      candlesCount: number;
      metrics: StrategyComparisonMetrics;
    };
    validation: {
      period: string;
      candlesCount: number;
      metrics: StrategyComparisonMetrics;
    };
    outOfSample: {
      period: string;
      candlesCount: number;
      metrics: StrategyComparisonMetrics;
    };
  };
  lookaheadBiasCheck: {
    passed: boolean;
    details: string;
  };
  degradationFactor: number;
  maxDrawdownExpansion: number;
  parameterSensitivityGrid: ParameterSensitivityPoint[];
  cliffDetection: {
    cliffsDetected: number;
    stableRegion: string;
    notes: string;
  };
  verdict: 'PASS' | 'MARGINAL' | 'FAIL';
  disclaimer: string;
}
