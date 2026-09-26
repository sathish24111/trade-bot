import { MarketRegimeV2, PaperTradeJournalEntry } from './StrategyV2';
import { ConfidenceInterval95 } from './StrategyV2_2';

export type V2_4_VariantId =
  | 'V2_BASELINE'
  | 'A_HIGH_VOL_30S'
  | 'B_RANGING_CONFLUENCE'
  | 'C_LOW_REGIME_80'
  | 'AB_COMBO'
  | 'AC_COMBO'
  | 'BC_COMBO'
  | 'ABC_COMBO';

export type V2_4_PromotionStatus =
  | 'READY_FOR_MANUAL_REVIEW'
  | 'CONTINUE_RESEARCH'
  | 'INCONSISTENT';

export type V2_4_AblationComparisonId =
  | 'ABC_vs_AB'
  | 'ABC_vs_AC'
  | 'ABC_vs_BC'
  | 'A_vs_V2_BASELINE'
  | 'B_vs_V2_BASELINE'
  | 'C_vs_V2_BASELINE';

export interface CombinationTradeEntry extends PaperTradeJournalEntry {
  sessionId: string;
  sessionIndex: number;
  datasetId: 'V2.4_COMBINATION_ABLATION' | string;
  variantId: V2_4_VariantId;
  variantName: string;
  reasonEntry?: string;
  reasonExit?: string;
}

export interface V2_4_VariantMetrics {
  variantId: V2_4_VariantId;
  label: string;
  type: 'CONTROL' | 'INDIVIDUAL' | 'COMBINATION';
  description: string;
  activeHypotheses: string[];
  totalObservations: number;
  acceptedSignals: number;
  rejectedSignals: number;
  rejectionReasons: Record<string, number>;
  tradesExecuted: number;
  wins: number;
  losses: number;
  winRate: number;
  confidenceInterval95: ConfidenceInterval95;
  totalPnL: number;
  averagePnL: number;
  expectancy: number;
  profitFactor: number;
  maxDrawdown: number;
  maxConsecutiveLosses: number;
  waitPercentage: number;
  averageTradeDuration: string;
  medianTradeDuration: string;
  sampleStatus: 'ADEQUATE_SAMPLE' | 'LIMITED_SAMPLE' | 'INSUFFICIENT_SAMPLE';
  promotionStatus: V2_4_PromotionStatus;
  promotionRationale: string;
  disclaimer: string;
}

export interface AblationComparisonRecord {
  comparisonId: V2_4_AblationComparisonId;
  title: string;
  targetVariant: V2_4_VariantId;
  referenceVariant: V2_4_VariantId;
  ablatedComponent: string;
  deltaWinRate: number; // target - reference
  deltaExpectancy: number;
  deltaProfitFactor: number;
  deltaPnL: number;
  deltaDrawdown: number;
  deltaConsecutiveLosses: number;
  deltaTradeFrequency: number; // target accepted% - reference accepted%
  interpretation: string;
  isContributionPositive: boolean;
}

export interface CrossAssetMetricsV2_4 {
  asset: string;
  totalObservations: number;
  tradesExecuted: number;
  wins: number;
  losses: number;
  winRate: number;
  confidenceInterval95: ConfidenceInterval95;
  totalPnL: number;
  expectancy: number;
  maxDrawdown: number;
  sampleStatus: 'ADEQUATE_SAMPLE' | 'LIMITED_SAMPLE' | 'INSUFFICIENT_SAMPLE';
}

export interface CrossRegimeMetricsV2_4 {
  regime: MarketRegimeV2;
  totalObservations: number;
  tradesExecuted: number;
  wins: number;
  losses: number;
  winRate: number;
  confidenceInterval95: ConfidenceInterval95;
  totalPnL: number;
  expectancy: number;
  maxDrawdown: number;
  sampleStatus: 'ADEQUATE_SAMPLE' | 'LIMITED_SAMPLE' | 'INSUFFICIENT_SAMPLE';
}

export interface V2_4_SessionMetrics {
  sessionId: string;
  sessionIndex: number;
  sessionDate: string;
  totalObservations: number;
  acceptedTrades: number;
  rejectedSignals: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnL: number;
  expectancy: number;
  profitFactor: number;
  maxDrawdown: number;
  maxConsecutiveLosses: number;
  sessionOutcome: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  degradationDetected: boolean;
  degradationReason?: string;
}

export interface V2_4_OOSValidation {
  datasetSplits: {
    train: { period: string; count: number; winRate: number; expectancy: number; pnl: number };
    validation: { period: string; count: number; winRate: number; expectancy: number; pnl: number };
    outOfSample: { period: string; count: number; winRate: number; expectancy: number; pnl: number };
  };
  leakageVerification: {
    lookaheadFree: boolean;
    parameterLeakageFree: boolean;
    regimeLeakageFree: boolean;
    duplicateSignalsFree: boolean;
    chronologicalOrderingPreserved: boolean;
    sessionAssignmentDeterministic: boolean;
    dataQualityChecksPassed: boolean;
    details: string;
  };
  degradationRatio: number;
  verdict: 'OOS_VALIDATED' | 'OOS_NOT_VALIDATED' | 'MARGINAL';
}

export interface V2_4_PromotionGateSummary {
  productionStrategyStatus: string;
  gateDecisions: Array<{
    variantId: V2_4_VariantId;
    label: string;
    status: V2_4_PromotionStatus;
    criteriaChecks: {
      multiSessionTested: boolean;
      noSafetyViolations: boolean;
      noLeakage: boolean;
      oosPositive: boolean;
      adequateSample: boolean;
      drawdownAcceptable: boolean;
      consecutiveLossesAcceptable: boolean;
      expectancyPositive: boolean;
    };
    decisionRationale: string;
  }>;
  governanceNotice: string;
}

export interface V2_4_CombinationDashboard {
  datasetMetadata: {
    datasetId: 'V2.4_COMBINATION_ABLATION';
    totalObservations: number;
    totalSessions: number;
    startDate: string;
    endDate: string;
    assetsIncluded: string[];
    regimesIncluded: string[];
    disclaimer: string;
  };
  overview: {
    totalSessions: number;
    totalObservations: number;
    totalVariants: number;
    overallWinRate: number;
    overallPnL: number;
    overallExpectancy: number;
    overallProfitFactor: number;
    maxDrawdown: number;
    maxConsecutiveLosses: number;
    positiveSessionsCount: number;
    negativeSessionsCount: number;
    neutralSessionsCount: number;
  };
  variantMatrix: V2_4_VariantMetrics[];
  ablationAnalysis: {
    comparisons: AblationComparisonRecord[];
    summaryFindings: string[];
    optimalConfiguration: {
      variantId: V2_4_VariantId;
      rationale: string;
    };
  };
  sessionsList: V2_4_SessionMetrics[];
  crossAssetAnalysis: Record<string, CrossAssetMetricsV2_4>;
  crossRegimeAnalysis: Record<string, CrossRegimeMetricsV2_4>;
  oosValidation: V2_4_OOSValidation;
  robustnessVerification: {
    lookaheadTestPassed: boolean;
    parameterLeakageTestPassed: boolean;
    regimeLeakageTestPassed: boolean;
    duplicateSignalTestPassed: boolean;
    chronologicalOrderingTestPassed: boolean;
    sessionAssignmentTestPassed: boolean;
    dataQualityTestPassed: boolean;
    details: string;
  };
  promotionGateSummary: V2_4_PromotionGateSummary;
  safetyStatus: {
    demoPaperOnly: boolean;
    dailyLossLimitEnforced: boolean;
    drawdownBreakerEnforced: boolean;
    consecutiveLossBreakerEnforced: boolean;
    activePositionLockActive: boolean;
    cooldownIntervalActive: boolean;
    duplicateSignalSuppressionActive: boolean;
    dataQualityGateActive: boolean;
    productionStrategyUnmodified: boolean;
    disclaimer: string;
  };
  disclaimer: string;
}
