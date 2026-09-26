import { MarketRegimeV2, PaperTradeJournalEntry } from './StrategyV2';
import { ConfidenceInterval95 } from './StrategyV2_2';

export type V2_5_ValidationGateStatus =
  | 'VALIDATION_PASSED'
  | 'VALIDATION_INCONCLUSIVE'
  | 'VALIDATION_FAILED';

export interface V2_5_ValidationTradeEntry extends PaperTradeJournalEntry {
  sessionId: string;
  sessionIndex: number;
  datasetId: 'V2.5_FINAL_FRESH_VALIDATION';
  strategyId: 'V2_BASELINE' | 'ABC_COMBO';
  reasonEntry?: string;
  reasonExit?: string;
  confluencePassed?: boolean;
  scoreThresholdPassed?: boolean;
  opportunityId: string;
}

export interface V2_5_StrategyMetrics {
  strategyId: 'V2_BASELINE' | 'ABC_COMBO';
  label: string;
  totalObservations: number;
  acceptedTrades: number;
  filteredOpportunities: number;
  tradeAcceptanceRate: number;
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
  averageTradeDuration: string;
  medianTradeDuration: string;
  sampleStatus: 'ADEQUATE_SAMPLE' | 'LIMITED_SAMPLE' | 'INSUFFICIENT_SAMPLE';
  disclaimer: string;
}

export interface V2_5_HeadToHeadComparison {
  baselineMetrics: V2_5_StrategyMetrics;
  candidateMetrics: V2_5_StrategyMetrics;
  deltaWinRate: number; // candidate - baseline
  deltaExpectancy: number;
  deltaProfitFactor: number;
  deltaPnL: number;
  deltaMaxDrawdown: number;
  deltaConsecutiveLosses: number;
  deltaTradeAcceptance: number; // candidate acceptance - baseline acceptance
  interpretation: string;
  isSuperior: boolean;
}

export interface V2_5_SessionMetrics {
  sessionId: string;
  sessionIndex: number;
  sessionDate: string;
  totalOpportunities: number;
  baselineAccepted: number;
  candidateAccepted: number;
  filteredTrades: number;
  baselineWins: number;
  baselineLosses: number;
  candidateWins: number;
  candidateLosses: number;
  baselineWinRate: number;
  candidateWinRate: number;
  baselinePnL: number;
  candidatePnL: number;
  baselineExpectancy: number;
  candidateExpectancy: number;
  candidateProfitFactor: number;
  candidateMaxDrawdown: number;
  candidateMaxConsecutiveLosses: number;
  sessionOutcome: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  degradationDetected: boolean;
  degradationReason?: string;
}

export interface V2_5_CrossAssetMetrics {
  asset: string;
  totalObservations: number;
  baselineAccepted: number;
  candidateAccepted: number;
  baselineWins: number;
  baselineLosses: number;
  candidateWins: number;
  candidateLosses: number;
  baselineWinRate: number;
  candidateWinRate: number;
  candidateConfidenceInterval95: ConfidenceInterval95;
  baselinePnL: number;
  candidatePnL: number;
  baselineExpectancy: number;
  candidateExpectancy: number;
  candidateProfitFactor: number;
  candidateMaxDrawdown: number;
  sampleStatus: 'ADEQUATE_SAMPLE' | 'LIMITED_SAMPLE' | 'INSUFFICIENT_SAMPLE';
}

export interface V2_5_CrossRegimeMetrics {
  regime: MarketRegimeV2;
  totalObservations: number;
  baselineAccepted: number;
  candidateAccepted: number;
  baselineWins: number;
  baselineLosses: number;
  candidateWins: number;
  candidateLosses: number;
  baselineWinRate: number;
  candidateWinRate: number;
  candidateConfidenceInterval95: ConfidenceInterval95;
  baselinePnL: number;
  candidatePnL: number;
  baselineExpectancy: number;
  candidateExpectancy: number;
  candidateProfitFactor: number;
  candidateMaxDrawdown: number;
  sampleStatus: 'ADEQUATE_SAMPLE' | 'LIMITED_SAMPLE' | 'INSUFFICIENT_SAMPLE';
  regimeAssessment: 'OPTIMAL' | 'ACCEPTABLE' | 'WEAK' | 'CHOPPY';
}

export interface V2_5_OOSSplitMetrics {
  period: string;
  count: number;
  winRate: number;
  expectancy: number;
  pnl: number;
}

export interface V2_5_OOSValidation {
  datasetSplits: {
    train: V2_5_OOSSplitMetrics;
    validation: V2_5_OOSSplitMetrics;
    holdout: V2_5_OOSSplitMetrics;
  };
  degradationRatio: number;
  degradationThreshold: number;
  verdict: 'OOS_VALIDATED' | 'OOS_NOT_VALIDATED' | 'MARGINAL';
}

export interface V2_5_RobustnessChecklist {
  lookaheadPrevention: boolean;
  parameterLeakagePrevention: boolean;
  regimeLeakagePrevention: boolean;
  duplicateSignalPrevention: boolean;
  chronologicalOrdering: boolean;
  sessionAssignmentIntegrity: boolean;
  dataQualityProtection: boolean;
  noFutureTimestamp: boolean;
  noFutureCandle: boolean;
  noOutcomeFiltering: boolean;
  noPostHocTuning: boolean;
  allPassed: boolean;
  details: string;
}

export interface V2_5_RiskSafetyValidation {
  dailyLossLimitActive: boolean;
  drawdownBreakerActive: boolean;
  consecutiveLossBreakerActive: boolean;
  activePositionLockActive: boolean;
  cooldownIntervalActive: boolean;
  duplicateSignalSuppressionActive: boolean;
  dataQualityGateActive: boolean;
  demoPaperEnforcement: boolean;
  safetyBreached: boolean;
  triggeredMechanisms: string[];
}

export interface V2_5_FinalValidationGate {
  gateStatus: V2_5_ValidationGateStatus;
  productionStrategyStatus: string;
  candidateStatus: string;
  criteriaChecks: {
    scaleExceeds1000Observations: boolean;
    multiSessionConsistent: boolean;
    oosHoldoutValidated: boolean;
    expectancySuperior: boolean;
    drawdownAcceptable: boolean;
    consecutiveLossStreakAcceptable: boolean;
    robustnessAllPassed: boolean;
    safetyControlsMaintained: boolean;
  };
  decisionRationale: string;
  governanceNotice: string;
}

export interface V2_5_FinalValidationDashboard {
  datasetMetadata: {
    datasetId: 'V2.5_FINAL_FRESH_VALIDATION';
    totalObservations: number;
    totalSessions: number;
    startDate: string;
    endDate: string;
    assetsIncluded: string[];
    regimesIncluded: string[];
    disclaimer: string;
  };
  headToHead: V2_5_HeadToHeadComparison;
  sessionsList: V2_5_SessionMetrics[];
  crossAssetAnalysis: Record<string, V2_5_CrossAssetMetrics>;
  crossRegimeAnalysis: Record<string, V2_5_CrossRegimeMetrics>;
  oosValidation: V2_5_OOSValidation;
  robustnessChecklist: V2_5_RobustnessChecklist;
  riskSafetyValidation: V2_5_RiskSafetyValidation;
  finalValidationGate: V2_5_FinalValidationGate;
  disclaimer: string;
}
