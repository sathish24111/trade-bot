import { DemoSignalType } from './MarketData';

export const SAFETY_METADATA_PHASE9 = {
  mode: 'PAPER',
  isRealMoney: false,
  brokerConnected: false
} as const;

// 1. Research Job States & Priorities
export type ResearchJobStatus =
  | 'CREATED'
  | 'QUEUED'
  | 'RUNNING'
  | 'PAUSED'
  | 'RETRYING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type ResearchJobPriority = 'LOW' | 'NORMAL' | 'HIGH';

export type ResearchJobType =
  | 'BACKTEST'
  | 'OOS_VALIDATION'
  | 'WALK_FORWARD'
  | 'PARAMETER_STABILITY'
  | 'STRESS_TEST'
  | 'MONTE_CARLO'
  | 'REGIME_ANALYSIS'
  | 'CORRELATION_ANALYSIS'
  | 'PORTFOLIO_SIMULATION'
  | 'PAPER_COMPARISON'
  | 'DRIFT_ANALYSIS'
  | 'REPLAY'
  | 'FULL_RESEARCH_PIPELINE';

export interface ResearchJob {
  jobId: string;
  experimentId: string;
  type: ResearchJobType;
  priority: ResearchJobPriority;
  status: ResearchJobStatus;
  progress: number; // 0 to 100
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  configHash: string;
  parameters: Record<string, any>;
  parentJobId?: string;
  dependencyJobId?: string;
  lastCompletedStage?: string;
  checkpoint?: Record<string, any>;
  result?: any;
  retryCount?: number;
  cancellationReason?: string;
  mode: 'PAPER';
  isRealMoney: false;
  brokerConnected: false;
}

// 2. Full Research Pipeline Stages
export type PipelineStageName =
  | 'DATASET_VALIDATION'
  | 'BACKTEST'
  | 'DATA_SPLIT_70_15_15'
  | 'VALIDATION'
  | 'OUT_OF_SAMPLE'
  | 'WALK_FORWARD'
  | 'PARAMETER_STABILITY'
  | 'STRESS_TEST'
  | 'MONTE_CARLO'
  | 'REGIME_ANALYSIS'
  | 'CORRELATION'
  | 'PORTFOLIO_SIMULATION'
  | 'PAPER_COMPARISON'
  | 'FINAL_REPORT';

export interface PipelineStageResult {
  stage: PipelineStageName;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  startedAt?: string;
  completedAt?: string;
  output?: any;
  error?: string;
}

export interface FullResearchPipelineResult {
  pipelineId: string;
  strategyId: string;
  asset: string;
  timeframe: string;
  stages: PipelineStageResult[];
  overallStatus: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  startedAt: string;
  completedAt?: string;
  disclaimer: string;
}

// 3. Research Scheduler
export type ScheduleFrequency = 'HOURLY' | 'DAILY' | 'WEEKLY' | 'CUSTOM';

export interface ResearchSchedule {
  id: string;
  name: string;
  jobType: ResearchJobType;
  strategyId: string;
  datasetId?: string;
  schedule: ScheduleFrequency;
  customCron?: string;
  enabled: boolean;
  lastRun?: string;
  nextRun: string;
  createdAt: string;
  updatedAt: string;
}

// 4. Strategy Drift Trend
export type DriftTrendClassification = 'IMPROVING' | 'STABLE' | 'DEGRADING' | 'INSUFFICIENT_DATA';

export interface RollingTradeWindowMetrics {
  windowSize: 7 | 20 | 50 | 100;
  tradesCount: number;
  winRate: number;
  expectancy: number;
  profitFactor: number;
  maxDrawdown: number;
  averageSlippage: number;
  averageFees: number;
  signalConversion: number;
  driftPercentage: number;
}

export interface StrategyDriftTrendResult {
  strategyId: string;
  asset: string;
  windows: RollingTradeWindowMetrics[];
  trend: DriftTrendClassification;
  weeklyDeltas: number[]; // e.g. [-2.1, -5.0, -8.3]
  calculatedAt: string;
  disclaimer: string;
}

// 5. Research Recommendations
export type ResearchTriggerType =
  | 'SIGNIFICANT_DRIFT'
  | 'PARAMETER_CLIFF'
  | 'HIGH_CORRELATION'
  | 'HIGH_DRAWDOWN'
  | 'PROVIDER_FAILURE'
  | 'REGIME_TRANSITION';

export interface ResearchRecommendation {
  id: string;
  trigger: ResearchTriggerType;
  reason: string;
  evidence: string;
  suggestedResearchJob: ResearchJobType;
  suggestedParameters: Record<string, any>;
  priority: ResearchJobPriority;
  timestamp: string;
  status: 'PENDING' | 'SCHEDULED' | 'EXECUTED' | 'DISMISSED';
}

// 6. Evidence Quality Score & Matrix
export type EvidenceQualityLevel = 'VERY_LIMITED' | 'LIMITED' | 'MODERATE' | 'SUBSTANTIAL';

export interface StrategyEvidenceItem {
  strategyId: string;
  name: string;
  datasetQuality: 'VALID' | 'DEGRADED' | 'INSUFFICIENT';
  sampleSizeRating: 'LIMITED' | 'MODERATE' | 'LARGER_SAMPLE';
  sampleTradesCount: number;
  oosTested: boolean;
  walkForwardTested: boolean;
  stressTested: boolean;
  monteCarloSimulated: boolean;
  parameterStabilityTested: boolean;
  paperDataQuality: 'LIMITED' | 'MODERATE' | 'SUBSTANTIAL';
  driftStatus: 'STABLE' | 'WATCH' | 'CRITICAL';
  overallEvidenceLevel: EvidenceQualityLevel;
}

// 7. Experiment Lineage & Diffing
export interface ExperimentLineageNode {
  experimentId: string;
  name: string;
  strategyId: string;
  parentExperimentId?: string;
  rootExperimentId: string;
  lineageDepth: number;
  changeDescription: string;
  createdAt: string;
  children?: ExperimentLineageNode[];
}

export interface ConfigDiffItem {
  field: string;
  valueA: any;
  valueB: any;
  isModified: boolean;
}

export interface ExperimentDiffResult {
  experimentAId: string;
  experimentBId: string;
  strategyDiff: ConfigDiffItem[];
  parameterDiff: ConfigDiffItem[];
  riskDiff: ConfigDiffItem[];
  datasetDiff: ConfigDiffItem[];
  generatedAt: string;
}

// 8. Paper Experiment Watchdog & Recovery
export type WatchdogAlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface PaperWatchdogEvent {
  id: number;
  experimentId: string;
  checkType:
    | 'STALE_DATA'
    | 'MISSING_TRADES'
    | 'ABNORMAL_FREQUENCY'
    | 'RISK_LIMIT'
    | 'DRAWDOWN'
    | 'UNEXPECTED_PNL'
    | 'STRATEGY_DRIFT'
    | 'PROVIDER_HEALTH';
  severity: WatchdogAlertSeverity;
  message: string;
  details: Record<string, any>;
  actionTaken: 'NONE' | 'THROTTLED' | 'PAUSED' | 'AUTO_RECOVERED';
  timestamp: string;
}

// 9. Anomaly Investigation
export type AnomalyRootCause =
  | 'MARKET_DATA'
  | 'STRATEGY'
  | 'EXECUTION_SIMULATION'
  | 'RISK'
  | 'PROVIDER'
  | 'SYSTEM'
  | 'UNKNOWN';

export type InvestigationEvidenceStatus = 'CONFIRMED' | 'LIKELY' | 'POSSIBLE' | 'UNKNOWN';

export interface AnomalyInvestigationReport {
  investigationId: string;
  anomalyId: string;
  asset: string;
  strategyId?: string;
  timestamp: string;
  evidenceStatus: InvestigationEvidenceStatus;
  classifiedRootCause: AnomalyRootCause;
  collectedEvidence: {
    marketDataSnapshot: any;
    signalSnapshot: any;
    tradeSnapshot: any;
    riskState: any;
    providerState: any;
    systemEvents: any[];
  };
  diagnosticSummary: string;
  suggestedAction: string;
}

// 10. Advanced Risk Stress Matrix
export type StressMatrixClassification = 'ROBUST' | 'SENSITIVE' | 'FRAGILE' | 'INSUFFICIENT_DATA';

export interface StressMatrixCell {
  xDimensionValue: number | string;
  yDimensionValue: number | string;
  returnPct: number;
  maxDrawdown: number;
  expectancy: number;
  status: StressMatrixClassification;
}

export interface StressMatrixResult {
  strategyId: string;
  matrixType: 'COST_X_SLIPPAGE' | 'RISK_X_VOLATILITY';
  xDimensionName: string;
  yDimensionName: string;
  grid: StressMatrixCell[][];
  overallRobustness: StressMatrixClassification;
  generatedAt: string;
  disclaimer: string;
}

// 11. Portfolio What-If Simulation
export interface WhatIfScenarioInput {
  portfolioId?: string;
  reallocations?: { strategyId: string; asset: string; newAllocationPct: number }[];
  disabledStrategies?: string[];
  costMultiplier?: number;
  slippageMultiplier?: number;
  volatilityShockPct?: number;
  correlationSurgePct?: number;
}

export interface WhatIfScenarioResult {
  scenarioName: string;
  baselineEquity: number;
  simulatedEquity: number;
  baselineDrawdown: number;
  simulatedDrawdown: number;
  equityDeltaPct: number;
  drawdownDeltaPct: number;
  riskContributions: { strategyId: string; contributionPct: number }[];
  disclaimer: string;
}

// 12. Structural Market Regime Transition
export interface RegimeTransitionEvent {
  id?: number;
  asset: string;
  previousRegime: string;
  newRegime: string;
  transitionTimestamp: string;
  confidenceScore: number;
  triggerIndicators: Record<string, any>;
  affectedStrategies: string[];
}

// 13. Automated Daily & Weekly Reports
export interface DailyResearchReport {
  id: string;
  reportDate: string;
  marketDataHealth: string;
  providerStatusSummary: string;
  strategyActivity: { strategyId: string; signalCount: number; tradeCount: number }[];
  paperTradesSummary: { totalTrades: number; winningTrades: number; winRate: number; totalPnl: number };
  riskAndDrawdown: { maxDrawdown: number; dailyLossPct: number; riskState: string };
  driftAlerts: string[];
  anomaliesDetected: number;
  activeResearchJobs: number;
  researchRecommendations: string[];
  generatedAt: string;
}

export interface WeeklyResearchReport {
  id: string;
  weekStarting: string;
  weekEnding: string;
  performanceEvolution: any[];
  strategyDriftOverview: any[];
  parameterStabilitySummary: any[];
  regimeTransitionsSummary: any[];
  portfolioCorrelationSummary: any[];
  riskAttributionSummary: any[];
  stressTestFindings: string[];
  paperVsOosDivergence: any[];
  sampleSizeEvolution: any[];
  researchCoverageSummary: string;
  knownLimitations: string[];
  generatedAt: string;
}
