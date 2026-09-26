import { MarketRegimeV2, SignalScoreBreakdown, ResearchCategoryMetrics, PaperTradeJournalEntry } from './StrategyV2';

export type V2_2_VariantId =
  | 'V2_BASELINE'
  | 'V2.2_HIGH_VOL_30S'
  | 'V2.2_RANGING_CONFLUENCE'
  | 'V2.2_LOW_REGIME_80';

export type V2_2_SampleStatus =
  | 'INSUFFICIENT_SAMPLE' // < 30
  | 'LIMITED_SAMPLE'      // 30 - 99
  | 'ADEQUATE_SAMPLE';    // >= 100

export type V2_2_ObservationLabel =
  | 'OBSERVED_POSITIVE'
  | 'OBSERVED_NEGATIVE'
  | 'INSUFFICIENT_SAMPLE'
  | 'OOS_VALIDATED'
  | 'OOS_NOT_VALIDATED';

export type V2_2_PromotionStatus =
  | 'BASELINE'
  | 'CANDIDATE_FOR_FURTHER_TESTING'
  | 'NOT_READY_FOR_FURTHER_TESTING'
  | 'INSUFFICIENT_SAMPLE';

export interface ConfidenceInterval95 {
  pointEstimate: number; // e.g. 65.0%
  lowerBound: number;    // e.g. 52.4%
  upperBound: number;    // e.g. 76.1%
  marginOfError: number; // e.g. 11.8%
  sampleSize: number;
}

export interface FreshValidationTradeEntry extends PaperTradeJournalEntry {
  datasetId: 'V2.2_FRESH' | string;
  experimentVariant: V2_2_VariantId | string;
  evaluatedOpportunityIndex: number;
}

export interface V2_2_VariantMetrics {
  id: V2_2_VariantId;
  label: string;
  role: 'CONTROL' | 'EXPERIMENT';
  condition: string;
  parameterDescription: string;
  totalOpportunities: number;
  acceptedTrades: number;
  rejectedSignals: number;
  rejectionReasons: Record<string, number>;
  wins: number;
  losses: number;
  winRate: number;
  confidenceInterval95: ConfidenceInterval95;
  totalPnL: number;
  averagePnL: number;
  expectancy: number;
  averageWinningTrade: number;
  averageLosingTrade: number;
  profitFactor: number;
  maxDrawdown: number;
  maxConsecutiveLosses: number;
  waitPercentage: number;
  rejectedPercentage: number;
  sampleStatus: V2_2_SampleStatus;
  sampleWarning?: string;
  observationLabel: V2_2_ObservationLabel;
  promotionStatus: V2_2_PromotionStatus;
  promotionRationale: string;
  disclaimer: string;
}

export interface V2_2_BreakdownCategory {
  key: string;
  category: 'Asset' | 'Regime' | 'Score' | 'Duration';
  tradesCount: number;
  wins: number;
  losses: number;
  winRate: number;
  confidenceInterval95: ConfidenceInterval95;
  totalPnL: number;
  expectancy: number;
  maxDrawdown: number;
  sampleStatus: V2_2_SampleStatus;
  sampleWarning?: string;
}

export interface V2_2_FreshValidationDashboard {
  datasetMetadata: {
    datasetId: string;
    totalFreshTrades: number;
    startDate: string;
    endDate: string;
    assetsIncluded: string[];
    regimesIncluded: string[];
    isDistinctFromV2_0: boolean;
    disclaimer: string;
  };
  experimentMatrix: V2_2_VariantMetrics[];
  assetAnalysis: Record<string, V2_2_BreakdownCategory>;
  regimeAnalysis: Record<string, V2_2_BreakdownCategory>;
  scoreAnalysis: Record<string, V2_2_BreakdownCategory>;
  durationAnalysis: Record<string, V2_2_BreakdownCategory>;
  confidenceIntervalsSummary: {
    variantCIs: Record<string, ConfidenceInterval95>;
    observationNote: string;
  };
  oosValidation: {
    datasetSplits: {
      train: { period: string; count: number; winRate: number; expectancy: number; pnl: number };
      validation: { period: string; count: number; winRate: number; expectancy: number; pnl: number };
      outOfSample: { period: string; count: number; winRate: number; expectancy: number; pnl: number };
    };
    leakageVerification: {
      lookaheadFree: boolean;
      parameterLeakageFree: boolean;
      futureCandleAccessBlocked: boolean;
      details: string;
    };
    degradationRatio: number;
    verdict: 'OOS_VALIDATED' | 'OOS_NOT_VALIDATED' | 'MARGINAL';
  };
  safetyStatus: {
    demoPaperOnly: boolean;
    dailyLossLimitEnforced: boolean;
    drawdownLimitEnforced: boolean;
    consecutiveLossBreakerEnforced: boolean;
    volatilityLockoutActive: boolean;
    staleFeedProtectionActive: boolean;
    activePositionLockActive: boolean;
    cooldownIntervalActive: boolean;
    duplicateSignalSuppressionActive: boolean;
    signalValidityChecked: boolean;
    dataQualityGateActive: boolean;
    disclaimer: string;
  };
  promotionGateSummary: {
    productionStrategyStatus: string;
    candidates: Array<{
      variant: string;
      status: V2_2_PromotionStatus;
      rationale: string;
    }>;
    decisionRule: string;
  };
  disclaimer: string;
}
