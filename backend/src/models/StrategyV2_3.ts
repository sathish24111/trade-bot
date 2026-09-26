import { MarketRegimeV2, SignalScoreBreakdown, ResearchCategoryMetrics, PaperTradeJournalEntry } from './StrategyV2';
import { ConfidenceInterval95 } from './StrategyV2_2';

export type V2_3_PromotionStatus =
  | 'READY_FOR_MANUAL_REVIEW'
  | 'CONTINUE_RESEARCH'
  | 'INCONSISTENT';

export interface MultiSessionTradeEntry extends PaperTradeJournalEntry {
  sessionId: string;
  datasetId: 'V2.3_MULTI_SESSION' | string;
  experimentVersion: string;
  experimentVariant: string;
  sessionIndex: number;
}

export interface SessionMetrics {
  sessionId: string;
  sessionIndex: number;
  sessionDate: string;
  hypothesisTested: 'HYPOTHESIS_A' | 'HYPOTHESIS_B' | 'HYPOTHESIS_C' | 'CONTROL_ALL' | string;
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
  waitPercentage: number;
  sessionOutcome: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  degradationDetected: boolean;
  degradationReason?: string;
}

export interface HypothesisConsistencySummary {
  hypothesisId: 'HYPOTHESIS_A' | 'HYPOTHESIS_B' | 'HYPOTHESIS_C';
  hypothesisName: string;
  controlVariant: string;
  experimentVariant: string;
  condition: string;
  totalSessionsEvaluated: number;
  positiveSessions: number;
  negativeSessions: number;
  neutralSessions: number;
  totalObservations: number;
  controlWinRate: number;
  experimentWinRate: number;
  controlTotalPnL: number;
  experimentTotalPnL: number;
  controlExpectancy: number;
  experimentExpectancy: number;
  experimentProfitFactor: number;
  maxDrawdown: number;
  maxConsecutiveLosses: number;
  meanSessionPnL: number;
  medianSessionPnL: number;
  stdDevSessionPnL: number;
  bestSessionPnL: number;
  worstSessionPnL: number;
  winRateConfidenceInterval: ConfidenceInterval95;
  expectancyConfidenceInterval: { lower: number; upper: number };
  sampleStatus: 'ADEQUATE_SAMPLE' | 'LIMITED_SAMPLE' | 'INSUFFICIENT_SAMPLE';
  oosStatus: 'OOS_VALIDATED' | 'MARGINAL' | 'OOS_NOT_VALIDATED';
  promotionGateStatus: V2_3_PromotionStatus;
  promotionRationale: string;
}

export interface CrossAssetSessionMetrics {
  asset: string;
  tradesCount: number;
  wins: number;
  losses: number;
  winRate: number;
  confidenceInterval95: ConfidenceInterval95;
  totalPnL: number;
  expectancy: number;
  maxDrawdown: number;
  sampleStatus: 'ADEQUATE_SAMPLE' | 'LIMITED_SAMPLE' | 'INSUFFICIENT_SAMPLE';
}

export interface CrossRegimeSessionMetrics {
  regime: MarketRegimeV2;
  tradesCount: number;
  wins: number;
  losses: number;
  winRate: number;
  confidenceInterval95: ConfidenceInterval95;
  totalPnL: number;
  expectancy: number;
  maxDrawdown: number;
  sampleStatus: 'ADEQUATE_SAMPLE' | 'LIMITED_SAMPLE' | 'INSUFFICIENT_SAMPLE';
}

export interface FailureAnalysisRecord {
  sessionId: string;
  hypothesisId: string;
  tradeId: string;
  asset: string;
  regime: MarketRegimeV2;
  duration: string;
  score: number;
  indicatorConfirmations: string[];
  volatility: string;
  consecutiveLosses: number;
  diagnosis: string;
}

export interface V2_3_MultiSessionDashboard {
  datasetMetadata: {
    datasetId: string;
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
  sessionsList: SessionMetrics[];
  hypotheses: {
    hypothesisA: HypothesisConsistencySummary;
    hypothesisB: HypothesisConsistencySummary;
    hypothesisC: HypothesisConsistencySummary;
  };
  crossAssetAnalysis: Record<string, CrossAssetSessionMetrics>;
  crossRegimeAnalysis: Record<string, CrossRegimeSessionMetrics>;
  oosValidation: {
    datasetSplits: {
      train: { period: string; count: number; winRate: number; expectancy: number; pnl: number };
      validation: { period: string; count: number; winRate: number; expectancy: number; pnl: number };
      outOfSample: { period: string; count: number; winRate: number; expectancy: number; pnl: number };
    };
    leakageVerification: {
      lookaheadFree: boolean;
      parameterLeakageFree: boolean;
      regimeLeakageFree: boolean;
      experimentAssignmentLeakageFree: boolean;
      details: string;
    };
    degradationRatio: number;
    verdict: 'OOS_VALIDATED' | 'OOS_NOT_VALIDATED' | 'MARGINAL';
  };
  failureAnalysis: FailureAnalysisRecord[];
  promotionGateSummary: {
    productionStrategyStatus: string;
    gateDecisions: Array<{
      hypothesisId: string;
      hypothesisName: string;
      status: V2_3_PromotionStatus;
      criteriaChecks: {
        multiSessionTested: boolean;
        noSafetyViolations: boolean;
        noLeakage: boolean;
        oosPositive: boolean;
        multiSessionConsistent: boolean;
        crossAssetConsistent: boolean;
        adequateSample: boolean;
        drawdownAcceptable: boolean;
      };
      decisionRationale: string;
    }>;
    governanceRule: string;
  };
  safetyStatus: {
    demoPaperOnly: boolean;
    dailyLossLimitEnforced: boolean;
    drawdownBreakerEnforced: boolean;
    consecutiveLossBreakerEnforced: boolean;
    volatilityLockoutActive: boolean;
    staleFeedProtectionActive: boolean;
    dataQualityGateActive: boolean;
    activePositionLockActive: boolean;
    cooldownIntervalActive: boolean;
    duplicateSignalSuppressionActive: boolean;
    signalValidityChecked: boolean;
    disclaimer: string;
  };
  disclaimer: string;
}
