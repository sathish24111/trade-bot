import { BacktestTrade, BacktestEquityPoint } from '../services/backtesting.service';
import { StrategyParameters } from '../services/strategy.service';

export type MarketRegimeType = 'TRENDING' | 'RANGING' | 'HIGH_VOLATILITY' | 'LOW_VOLATILITY';

export type SampleSizeRating = 'VERY_SMALL' | 'LIMITED' | 'MODERATE' | 'ADEQUATE';

export interface MonthlyPerformance {
  month: string; // YYYY-MM
  tradesCount: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  netPnl: number;
  returnPercent: number;
  maxDrawdown: number;
}

export interface AdvancedMetrics {
  // Return & Volume
  initialBalance: number;
  finalBalance: number;
  netPnl: number;
  returnPercent: number;
  grossProfit: number;
  grossLoss: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  // Risk & Drawdown
  maxDrawdownPercent: number;
  maxDrawdownDurationBars: number;
  averageDrawdownPercent: number;
  recoveryFactor: number | null;
  // Trade Quality & Expectancy
  averageWin: number;
  averageLoss: number;
  winLossRatio: number | null;
  profitFactor: number;
  expectancy: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  // Institutional Risk-Adjusted Ratios (null when denominator is 0, trades < 2, or variance 0)
  sharpeRatio: number | null;
  sortinoRatio: number | null;
  calmarRatio: number | null;
  // Sample Size Assessment
  sampleSizeRating: SampleSizeRating;
  sampleSizeWarning?: string;
  // Monthly Breakdown
  monthlyPerformance: MonthlyPerformance[];
}

export interface RegimeClassification {
  regime: MarketRegimeType;
  timestamp: number;
  atr: number;
  atrAvg: number;
  bollingerWidth: number;
  emaSlope: number;
  description: string;
}

export interface RegimePerformance {
  regime: MarketRegimeType;
  tradesCount: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  netPnl: number;
  profitFactor: number;
  expectancy: number;
}

export interface ParameterStabilityScore {
  parameterKey: string;
  varianceScore: number; // lower variance across adjacent parameter steps = more stable
  isStable: boolean;
}

export interface OptimizationRunConfig {
  userId: number;
  asset: string;
  timeframe?: string;
  strategy: string;
  parameterRanges: Record<string, number[]>; // e.g. { emaPeriod: [10, 20, 30], rsiOverbought: [65, 70, 75] }
  trainSplitRatio?: number; // default 0.70
  valSplitRatio?: number;   // default 0.15
  testSplitRatio?: number;  // default 0.15
  initialBalance?: number;
  tradeAmount?: number;
}

export interface OptimizationCombinationResult {
  combinationId: string;
  parameters: StrategyParameters;
  trainMetrics: AdvancedMetrics;
  valMetrics?: AdvancedMetrics;
  testMetrics?: AdvancedMetrics;
  overfittingScore: number; // delta drop from train to test
  overfittingRisk: 'LOW' | 'MODERATE' | 'HIGH';
  isRecommended: boolean;
}

export interface OptimizationRunResult {
  id: string;
  userId: number;
  asset: string;
  timeframe: string;
  strategy: string;
  totalCombinations: number;
  trainCandlesCount: number;
  valCandlesCount: number;
  testCandlesCount: number;
  results: OptimizationCombinationResult[];
  overfittingWarning?: string;
  disclaimer: string;
  mode: 'PAPER';
  isRealMoney: false;
  brokerConnected: false;
  historical: true;
  isPrediction: false;
}

export interface WalkForwardWindowResult {
  windowIndex: number;
  trainStartDate: string;
  trainEndDate: string;
  testStartDate: string;
  testEndDate: string;
  bestParameters: StrategyParameters;
  inSampleMetrics: AdvancedMetrics;
  outOfSampleMetrics: AdvancedMetrics;
  windowWfe: number; // (OOS return / IS return) * 100
}

export interface WalkForwardRunResult {
  id: string;
  userId: number;
  asset: string;
  timeframe: string;
  strategy: string;
  trainCandles: number;
  testCandles: number;
  stepCandles: number;
  windowsCount: number;
  windows: WalkForwardWindowResult[];
  overallWfe: number;
  cumulativeOosPnl: number;
  cumulativeOosReturnPercent: number;
  cumulativeEquityCurve: BacktestEquityPoint[];
  robustnessSummary: string;
  walkForwardMethod?: WalkForwardMethod;
  windowGuardWarning?: string;
  disclaimer: string;
  mode: 'PAPER';
  isRealMoney: false;
  brokerConnected: false;
  historical: true;
  isPrediction: false;
}

export interface MonteCarloSimulationRequest {
  trades: BacktestTrade[];
  iterations?: number; // 100, 500, or 1000
  initialBalance?: number;
  seed?: number; // deterministic test seed
}

export interface MonteCarloPercentiles {
  p5: number;
  p25: number;
  median: number;
  p75: number;
  p95: number;
}

export interface MonteCarloResult {
  iterations: number;
  initialBalance: number;
  finalBalanceDistribution: MonteCarloPercentiles;
  maxDrawdownDistribution: MonteCarloPercentiles;
  worstCaseDrawdown: number;
  ruinProbabilityPercent: number; // simulated loss >= 50%
  disclaimer: string;
  mode: 'PAPER';
  isRealMoney: false;
  historical: true;
  isPrediction: false;
}

export interface RiskProfile {
  name: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
  riskPerTradePercent: number; // e.g. 0.5, 1.0, 2.0
  maxDailyLossPercent: number; // e.g. 2.0, 3.0, 5.0
  maxDrawdownLimitPercent: number; // e.g. 5.0, 10.0, 15.0
  maxConcurrentTrades: number; // 1
  description: string;
}

export interface PositionSizingCalculation {
  riskProfile: RiskProfile;
  accountBalance: number;
  entryPrice: number;
  stopLossPrice: number;
  riskAmount: number;
  stopLossDistance: number;
  stopLossPercent: number;
  suggestedPositionSize: number;
  mode: 'PAPER';
}

export interface RobustnessAnalysisResult {
  strategy: string;
  sampleSizeRating: SampleSizeRating;
  sampleSizeWarning?: string;
  parameterStabilityRating: 'HIGH' | 'MODERATE' | 'LOW';
  oosConsistencyRatio: number | null;
  drawdownStabilityRating: 'STABLE' | 'MODERATE' | 'UNSTABLE';
  regimeAdaptabilityRating: 'ALL_REGIMES' | 'REGIME_DEPENDENT' | 'VULNERABLE';
  overfittingRisk: 'LOW' | 'MODERATE' | 'HIGH';
  disclaimer: string;
  evaluationType: 'ROBUSTNESS_ANALYSIS';
  mode: 'PAPER';
}

// ==========================================
// PHASE 5: LARGE-SCALE VALIDATION & ANALYTICS
// ==========================================

export interface HistoricalCandle {
  timestamp: number; // Unix timestamp in ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeframe: string;
  source: string;
  isComplete: boolean;
}

export interface DataGapInfo {
  expectedTimestamp: number;
  actualTimestamp: number;
  gapDurationSeconds: number;
  missingEstimatedCandles: number;
}

export interface DatasetValidationReport {
  passed: boolean;
  totalCandles: number;
  duplicateTimestamps: number;
  outOfOrderCandles: number;
  invalidOhlcCandles: number;
  gapCount: number;
  maxGapDurationSec: number;
  gaps: DataGapInfo[];
  sha256Checksum: string;
  warnings: string[];
}

export interface DatasetMetadata {
  id: string;
  name: string;
  asset: string;
  timeframe: string;
  candleCount: number;
  startTime: string;
  endTime: string;
  sha256Checksum: string;
  isValidated: boolean;
  storagePath?: string;
  createdAt: string;
}

export interface ResearchDataset {
  metadata: DatasetMetadata;
  candles: HistoricalCandle[];
  trainPartition: HistoricalCandle[];
  valPartition: HistoricalCandle[];
  testPartition: HistoricalCandle[]; // strictly locked for final out-of-sample verification
  isTestLocked: boolean;
}

export interface MultiTimeframeConfig {
  primaryTimeframe: string;
  higherTimeframe: string;
  higherTrendEmaPeriod?: number;
}

export interface MultiAssetResult {
  asset: string;
  tradesCount: number;
  winRate: number;
  netPnl: number;
  profitFactor: number;
  sharpeRatio: number | null;
  maxDrawdownPercent: number;
}

export interface CrossAssetMatrixResult {
  strategy: string;
  assets: MultiAssetResult[];
  averageWinRate: number;
  averageSharpe: number | null;
  robustAssetsCount: number;
  fragileAssetsCount: number;
  mode: 'PAPER';
  isRealMoney: false;
}

export interface CrossTimeframeMatrixResult {
  strategy: string;
  asset: string;
  timeframes: {
    timeframe: string;
    tradesCount: number;
    winRate: number;
    netPnl: number;
    profitFactor: number;
    sharpeRatio: number | null;
    maxDrawdownPercent: number;
  }[];
  mode: 'PAPER';
  isRealMoney: false;
}

export interface HeatmapPoint {
  param1Value: number;
  param2Value: number;
  metricValue: number;
  winRate: number;
  tradesCount: number;
}

export interface ParameterSensitivityResult {
  param1Name: string;
  param2Name: string;
  matrix: HeatmapPoint[];
  sensitivityDetected: boolean;
  sensitivityWarning?: string; // '⚠ Parameter Sensitivity Detected'
  stableRegionCount: number;
  cliffDropCount: number;
}

export type WalkForwardMethod = 'ANCHORED' | 'ROLLING';

export interface StressTestScenario {
  costMultiplier: number; // 1.0, 1.5, 2.0, 3.0
  slippagePips: number;   // 0, 1, 2, 3
  riskPercent: number;    // 0.5, 1.0, 2.0, 3.0
  netPnl: number;
  winRate: number;
  profitFactor: number;
  maxDrawdownPercent: number;
  costSensitivityDetected: boolean;
}

export interface StressTestReport {
  strategy: string;
  baselinePnl: number;
  scenarios: StressTestScenario[];
  costSensitivityDetected: boolean;
  warning?: string; // '⚠ Cost Sensitivity Detected'
  disclaimer: string;
  mode: 'PAPER';
  isRealMoney: false;
}

export interface PortfolioAllocation {
  asset: string;
  strategy: string;
  weightPercent: number;
  allocatedCapital: number;
}

export interface PortfolioConfig {
  id: string;
  userId: number;
  name: string;
  initialCapital: number;
  allocations: PortfolioAllocation[];
  maxPortfolioDrawdownPercent: number;
}

export interface PortfolioPosition {
  id: string;
  portfolioId: string;
  asset: string;
  strategy: string;
  weightPct: number;
  allocatedCapital: number;
  currentPnl: number;
}

export interface PortfolioEquityPoint {
  timestamp: string;
  equity: number;
  drawdownPct: number;
}

export interface CorrelationMatrix {
  assets: string[];
  matrix: number[][]; // Pearson correlation matrix [-1.0, 1.0]
}

export interface PortfolioSimulationResult {
  id: string;
  name: string;
  initialCapital: number;
  currentEquity: number;
  netPnl: number;
  returnPercent: number;
  maxDrawdownPercent: number;
  sharpeRatio: number | null;
  correlationMatrix: CorrelationMatrix;
  equityCurve: PortfolioEquityPoint[];
  allocations: PortfolioAllocation[];
  riskLimitReached: boolean;
  riskLimitMessage?: string; // 'PORTFOLIO_RISK_LIMIT_REACHED'
  disclaimer: string;
  mode: 'PAPER';
  isRealMoney: false;
}

export type ExperimentStatus = 'CREATED' | 'RUNNING' | 'PAUSED' | 'COMPLETED';

export interface PaperExperiment {
  id: string;
  userId: number;
  name: string;
  strategy: string;
  asset: string;
  timeframe: string;
  configHash: string;
  parameters: StrategyParameters;
  status: ExperimentStatus;
  startBalance: number;
  currentBalance: number;
  totalTrades: number;
  winRate: number;
  pnl: number;
  createdAt: string;
  completedAt?: string;
}

export interface PaperExperimentTrade {
  id: string;
  experimentId: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  amount: number;
  pnl: number;
  slippage: number;
  fees: number;
  result: 'WIN' | 'LOSS';
  journalNotes?: string;
  entryTime: string;
  exitTime: string;
}

export interface BacktestVsPaperComparison {
  experimentId: string;
  strategy: string;
  backtestWinRate: number;
  paperWinRate: number;
  winRateDeviation: number;
  backtestProfitFactor: number;
  paperProfitFactor: number;
  backtestSharpe: number | null;
  paperSharpe: number | null;
  slippageDragPercent: number;
  feeDragPercent: number;
  divergenceAssessment: 'CONSISTENT' | 'MODERATE_DIVERGENCE' | 'HIGH_DIVERGENCE';
  warning?: string;
}

export interface ComprehensiveResearchReport {
  reportId: string;
  generatedAt: string;
  strategy: string;
  asset: string;
  timeframe: string;
  datasetValidation: DatasetValidationReport;
  inSampleMetrics: AdvancedMetrics;
  outOfSampleMetrics: AdvancedMetrics;
  parameterSensitivity: ParameterSensitivityResult;
  walkForwardMetrics: {
    method: WalkForwardMethod;
    windowsCount: number;
    wfeScore: number;
    cumulativeOosPnl: number;
  };
  stressTestReport: StressTestReport;
  monteCarloSummary: {
    medianBalance: number;
    p5Balance: number;
    worstCaseDrawdown: number;
    ruinProbabilityPercent: number;
  };
  executiveSummary: string;
  evidenceBasedConclusion: string;
  disclaimer: string;
  mode: 'PAPER';
  isRealMoney: false;
  brokerConnected: false;
}

