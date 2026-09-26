import { Candle, TechnicalIndicators, DemoSignalType } from './MarketData';
import { MarketRegimeV2, SignalScoreBreakdown, StrategyV2Parameters, ResearchCategoryMetrics } from './StrategyV2';

export type ExperimentGroupId =
  | 'A_HIGH_VOLATILITY_DURATION'
  | 'B_RANGING_CONFLUENCE'
  | 'C_LOW_REGIME_THRESHOLD';

export type ExperimentVariantId = 'A1' | 'A2' | 'A3' | 'A4' | 'B1' | 'B2' | 'C1' | 'C2';

export type ExperimentStatus = 'BASELINE' | 'EXPERIMENT';

export type ValidationStatus =
  | 'BASELINE'
  | 'INSUFFICIENT_SAMPLE'
  | 'VALIDATED'
  | 'NOT_VALIDATED'
  | 'NOT_ENOUGH_DATA';

export interface ResearchExperimentVariant {
  id: ExperimentVariantId;
  experimentGroup: ExperimentGroupId;
  label: string;
  condition: string;
  parameterDescription: string;
  status: ExperimentStatus;
  validationStatus: ValidationStatus;
  totalTrades: number;
  acceptedSignals: number;
  rejectedSignals: number;
  rejectionReasons?: Record<string, number>;
  wins: number;
  losses: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  expectancy: number;
  totalPnL: number;
  maxDrawdown: number;
  maxConsecutiveLosses: number;
  waitPercentage: number;
  averageDuration: string;
  lossReductionVsBaseline: number;
  sampleStatus: 'ADEQUATE' | 'INSUFFICIENT_SAMPLE' | 'NOT_ENOUGH_DATA';
  sampleWarning?: string;
  assetBreakdown: Record<string, ResearchCategoryMetrics>;
  regimeBreakdown: Record<string, ResearchCategoryMetrics>;
  scoreBucketBreakdown: Record<string, ResearchCategoryMetrics>;
  disclaimer: string;
}

export interface V2_1_SignalEvaluationResult {
  signal: DemoSignalType;
  score: number;
  regime: MarketRegimeV2;
  scoreBreakdown: SignalScoreBreakdown;
  bollingerPercentB: number;
  isAccepted: boolean;
  rejectionReason?: string;
  experimentRuleApplied?: string;
  targetDuration: string;
  contractDurationTicksOrSeconds: number;
  disclaimer: string;
}

export interface V2_1_OOSValidationResult {
  splits: {
    train: { period: string; count: number; winRate: number; expectancy: number; pnl: number };
    validation: { period: string; count: number; winRate: number; expectancy: number; pnl: number };
    outOfSample: { period: string; count: number; winRate: number; expectancy: number; pnl: number };
  };
  leakageCheck: {
    lookaheadFree: boolean;
    noFutureCandleAccess: boolean;
    noParameterLeakage: boolean;
    noDuplicateTrades: boolean;
    noFutureInformationInRegimes: boolean;
    details: string;
  };
  degradationRatio: number;
  verdict: 'VALIDATED' | 'MARGINAL' | 'NOT_VALIDATED';
  disclaimer: string;
}

export interface V2_1_LossReductionSummary {
  hypothesis1Reduction: string;
  hypothesis2Reduction: string;
  hypothesis3Reduction: string;
  overallObservations: string[];
}

export interface V2_1_SafetyStatus {
  demoPaperOnly: boolean;
  dataQualityVerified: boolean;
  volatilityStateOk: boolean;
  dailyLossLimitOk: boolean;
  drawdownLimitOk: boolean;
  consecutiveLossBreakerOk: boolean;
  activePositionLockOk: boolean;
  cooldownOk: boolean;
  duplicateSignalSuppressionOk: boolean;
  signalValidityOk: boolean;
  disclaimer: string;
}

export interface V2_1_ResearchLabDashboard {
  experimentsMatrix: ResearchExperimentVariant[];
  durationExperiment: {
    variants: ResearchExperimentVariant[];
    summary: string;
  };
  rangingConfluenceExperiment: {
    variants: ResearchExperimentVariant[];
    rejectedSignalsCount: number;
    summary: string;
  };
  thresholdExperiment: {
    variants: ResearchExperimentVariant[];
    summary: string;
  };
  oosValidation: V2_1_OOSValidationResult;
  lossReductionSummary: V2_1_LossReductionSummary;
  safetyStatus: V2_1_SafetyStatus;
  disclaimer: string;
}
