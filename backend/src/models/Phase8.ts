import { DemoSignalType, MarketAsset } from './MarketData';

export const SAFETY_METADATA = {
  mode: 'PAPER',
  isRealMoney: false,
  brokerConnected: false
} as const;

export type EnsembleAggregationMode = 'MAJORITY' | 'WEIGHTED' | 'CONSENSUS' | 'INDEPENDENT';

export interface StrategyConfigSnapshot {
  strategyId: string;
  version: string;
  parameters: Record<string, any>;
  risk: {
    riskPerTrade: number;
    maxDailyLossPct?: number;
    stopLossDistancePct?: number;
  };
  indicatorDependencies: string[];
  enabled: boolean;
  configHash: string; // SHA-256
  createdAt?: string;
}

export interface EnsembleConfig {
  id: string;
  name: string;
  aggregationMode: EnsembleAggregationMode;
  strategies: {
    strategyId: string;
    weight: number; // 0.0 to 1.0 (sums to 1.0 for WEIGHTED)
  }[];
  minConfirmations?: number; // for CONSENSUS
  enabled: boolean;
  createdAt?: string;
}

export interface EnsembleSignalResult {
  ensembleId: string;
  asset: string;
  timestamp: string;
  aggregationMode: EnsembleAggregationMode;
  finalSignal: DemoSignalType;
  confidence: number;
  voteBreakdown: {
    strategyId: string;
    signal: DemoSignalType;
    confidence: number;
    weight: number;
  }[];
  conflictDetected: boolean;
  explanation: string;
  mode: 'PAPER';
  isRealMoney: false;
  brokerConnected: false;
}

export interface SignalConflictEvent {
  id?: number;
  ensembleId?: string;
  asset: string;
  timestamp: string;
  regime: string;
  disagreeingSignals: {
    strategyId: string;
    signal: DemoSignalType;
    confidence: number;
  }[];
  resolvedSignal: DemoSignalType;
  resolutionMethod: EnsembleAggregationMode;
}

export interface StrategyCorrelationMatrix {
  strategies: string[];
  matrix: number[][]; // Pearson correlation values [-1.0 to 1.0]
  timeframe: string;
  asset: string;
  sampleTrades: number;
  generatedAt: string;
}

export interface RollingCorrelationRecord {
  timestamp: string;
  strategyA: string;
  strategyB: string;
  correlation: number;
  windowBars: number;
}

export interface RegimeCorrelationBreakdown {
  regime: string;
  correlation: number;
  sampleSize: number;
}

export interface PortfolioAllocation {
  strategyId: string;
  asset: string;
  allocationPct: number; // e.g. 40% (0.40)
  targetCapital: number;
}

export interface RiskAttributionBreakdown {
  portfolioId?: string;
  totalPortfolioRisk: number; // 100%
  strategyAttributions: {
    strategyId: string;
    riskContributionPct: number;
    returnContributionPct: number;
    drawdownContributionPct: number;
  }[];
  assetAttributions: {
    asset: string;
    riskContributionPct: number;
  }[];
  regimeAttributions: {
    regime: string;
    riskContributionPct: number;
  }[];
  concentrationRisk: {
    herfindahlIndex: number; // HHI
    riskRating: 'LOW' | 'MODERATE' | 'HIGH';
  };
  generatedAt: string;
}

export type StabilityRegion = 'STABLE_REGION' | 'SENSITIVE_REGION' | 'CLIFF_REGION' | 'INSUFFICIENT_DATA';

export interface ParameterStabilityResult {
  strategyId: string;
  parameterKey: string;
  baselineValue: any;
  stabilityScore: number; // 0.0 to 1.0
  region: StabilityRegion;
  testedVariations: {
    value: any;
    winRate: number;
    returnPct: number;
    expectancy: number;
    maxDrawdown: number;
    tradeCount: number;
    deltaFromBaseline: number;
  }[];
  cliffsDetected: {
    fromValue: any;
    toValue: any;
    metricDropPct: number;
    severity: 'MODERATE' | 'SEVERE';
  }[];
  sampleQuality: 'LIMITED' | 'MODERATE' | 'LARGER_SAMPLE';
  disclaimer: string;
}

export interface CliffDetectionEvent {
  strategyId: string;
  parameterKey: string;
  previousValue: any;
  newValue: any;
  metricChangePct: number;
  metricName: string;
  severity: 'WARNING' | 'CRITICAL';
  timestamp: string;
}

export type SampleSizeQuality = 'LIMITED' | 'MODERATE' | 'LARGER_SAMPLE';

export interface ConfidenceInterval {
  metric: string;
  pointEstimate: number;
  confidenceLevel: number; // e.g. 0.95
  lowerBound: number;
  upperBound: number;
  isSufficientSample: boolean;
}

export interface MonteCarloPercentiles {
  iterations: number;
  p5: number;
  p25: number;
  p50: number; // median
  p75: number;
  p95: number;
  worstObserved: number;
  ruinProbabilityPct: number;
}

export interface PerformanceStagesComparison {
  experimentId: string;
  strategyId: string;
  stages: {
    stage: 'BACKTEST' | 'VALIDATION' | 'OOS' | 'WALK_FORWARD' | 'PAPER';
    winRate: number;
    returnPct: number;
    maxDrawdown: number;
    expectancy: number;
    profitFactor: number;
    tradeCount: number;
    sampleQuality: SampleSizeQuality;
    slippage: number;
    fees: number;
    riskUtilization: number;
  }[];
  divergencePoint?: {
    fromStage: string;
    toStage: string;
    metric: string;
    dropPct: number;
  };
}

export interface DecisionStep {
  step: number;
  name: string;
  timestamp: string;
  details: Record<string, any>;
}

export interface TradeDiagnosticRecord {
  tradeId: string;
  asset: string;
  strategyId: string;
  signal: DemoSignalType;
  entryPrice: number;
  exitPrice: number;
  amount: number;
  pnl: number;
  result: 'WIN' | 'LOSS';
  marketRegime: string;
  indicatorSnapshot: {
    ema21?: number;
    rsi14?: number;
    macd?: { macd: number; signal: number; histogram: number };
    bollingerBands?: { upper: number; middle: number; lower: number };
    atr?: number;
  };
  decisionPath: DecisionStep[];
  mae: number; // Maximum Adverse Excursion (price or %)
  mfe: number; // Maximum Favorable Excursion (price or %)
  slippage: number;
  fees: number;
  holdingTimeSeconds: number;
  mode: 'PAPER';
  isRealMoney: false;
  brokerConnected: false;
}

export type ReplaySpeed = 1 | 2 | 5 | 10;
export type ReplayStatus = 'IDLE' | 'PLAYING' | 'PAUSED' | 'COMPLETED';

export interface ReplaySessionState {
  sessionId: string;
  experimentId: string;
  currentIndex: number;
  totalBars: number;
  currentBarTimestamp: string;
  speed: ReplaySpeed;
  status: ReplayStatus;
  currentPrice: number;
  activeSignals: DemoSignalType[];
  simulatedTrades: any[];
}

export interface ResearchComparisonView {
  comparisonId: string;
  name: string;
  runs: {
    runId: string;
    strategyId: string;
    asset: string;
    timeframe: string;
    parameters: Record<string, any>;
    tradeCount: number;
    returnPct: number;
    maxDrawdown: number;
    sharpe: number | null;
    sortino: number | null;
    profitFactor: number;
    expectancy: number;
    winRate: number;
    parameterStability: number;
    sampleQuality: SampleSizeQuality;
    oosReturn?: number;
    paperReturn?: number;
  }[];
  note: 'OBJECTIVE_MEASUREMENTS_ONLY_NO_RANKINGS_OR_WINNERS';
  createdAt: string;
}

export type ResearchJobState = 'CREATED' | 'QUEUED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface ResearchJob {
  id: string;
  type: string;
  state: ResearchJobState;
  progressPct: number;
  processedBars: number;
  totalBars: number;
  processedTrades: number;
  estimatedRemainingSeconds?: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  metadata?: Record<string, any>;
}
