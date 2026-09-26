package com.tradepilot.data.remote

import com.google.gson.annotations.SerializedName

data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val error: String? = null,
    val mode: String? = "DEMO MODE"
)

// Auth DTOs
data class UserDto(
    val id: Int,
    val name: String,
    val email: String,
    val mobile: String?,
    val demoBalance: Double,
    val accountType: String,
    val isDemoMode: Boolean = true
)

data class AuthResponse(
    val success: Boolean,
    val token: String?,
    val user: UserDto?,
    val error: String?,
    val mode: String? = "DEMO MODE"
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val name: String,
    val email: String,
    val mobile: String,
    val password: String
)

// Market DTOs
data class CandleDto(
    val timestamp: Long,
    val open: Double,
    val high: Double,
    val low: Double,
    val close: Double
)

data class MacdDto(
    val value: Double = 0.0,
    val signal: Double = 0.0,
    val histogram: Double = 0.0
)

data class BollingerDto(
    val upper: Double = 0.0,
    val middle: Double = 0.0,
    val lower: Double = 0.0
)

data class IndicatorsDto(
    val ema: Double = 0.0,
    val rsi: Double = 50.0,
    val macd: Any? = null,
    val bollinger: Any? = null,
    val ema21: Double? = null,
    val sma20: Double? = null,
    val sma50: Double? = null,
    val rsi14: Double? = null,
    val atr14: Double? = null
)

data class MarketAssetDto(
    val symbol: String,
    val name: String,
    val price: Double,
    val change24h: Double,
    val changePercent: Double,
    val trend: String,
    val demoSignal: String,
    val confidence: Int,
    val indicators: IndicatorsDto,
    val candles: List<CandleDto>?,
    val dataSource: String = "SIMULATED MARKET DATA",
    val status: String? = "SIMULATED",
    val isLive: Boolean = false,
    val reason: String? = null,
    val timeframe: String? = "5m"
)

data class MarketAssetsResponse(
    val success: Boolean,
    val assets: List<MarketAssetDto>?,
    val dataSource: String?,
    val mode: String?
)

data class AssetDetailsResponse(
    val success: Boolean,
    val asset: MarketAssetDto?,
    val dataSource: String?,
    val mode: String?
)

data class CandlesResponse(
    val success: Boolean,
    val asset: String?,
    val candles: List<CandleDto>?,
    val dataSource: String?
)

// Trading Session DTOs
data class StartSessionRequest(
    val investmentAmount: Double,
    val asset: String? = "R_100",
    val strategy: String,
    val riskLevel: String,
    val duration: Int
)

data class StartSessionResponse(
    val success: Boolean,
    val sessionId: String?,
    val status: String?,
    val startingBalance: Double?,
    val error: String?,
    val mode: String?
)

data class StopSessionResponse(
    val success: Boolean,
    val sessionId: String?,
    val status: String?,
    val endingBalance: Double?,
    val currentPnL: Double?,
    val error: String?
)

data class SessionDto(
    val id: String,
    val user_id: Int,
    val investment_amount: Double,
    val strategy: String,
    val risk_level: String,
    val duration: Int,
    val starting_balance: Double,
    val ending_balance: Double?,
    val current_pnl: Double,
    val status: String,
    val termination_reason: String?,
    val started_at: String,
    val ended_at: String?
)

data class SessionsListResponse(
    val success: Boolean,
    val sessions: List<SessionDto>?
)

// Performance DTOs
data class EquityPointDto(
    val time: String,
    val balance: Double
)

data class DailyPerformanceDto(
    val dayLabel: String,
    val tradesCount: Int,
    val pnl: Double,
    val winRate: Double
)

data class PerformanceSummaryDto(
    val totalPnL: Double,
    val todayPnL: Double,
    val weeklyPnL: Double,
    val totalTrades: Int,
    val winningTrades: Int,
    val losingTrades: Int,
    val winRate: Double,
    val maxDrawdown: Double,
    val equityCurvePoints: List<EquityPointDto>?,
    val dailyPerformances: List<DailyPerformanceDto>?
)

data class PerformanceSummaryResponse(
    val success: Boolean,
    val summary: PerformanceSummaryDto?
)

data class TradeDto(
    val id: String,
    val session_id: String,
    val user_id: Int,
    val asset: String,
    val direction: String,
    val amount: Double,
    val entry_price: Double,
    val exit_price: Double,
    val pnl: Double,
    val result: String,
    val strategy: String,
    val created_at: String
)

data class TradesResponse(
    val success: Boolean,
    val trades: List<TradeDto>?
)

// WebSocket Event DTO
data class WsEventDto(
    val type: String,
    val asset: String?,
    val price: Double?,
    val changePercent: Double?,
    val demoSignal: String?,
    val confidence: Int?,
    val sessionId: String?,
    val status: String?,
    val elapsedSeconds: Long?,
    val remainingSeconds: Long?,
    val currentPnL: Double?,
    val pnlChange: Double?,
    val tradesCount: Int?,
    val winRate: Double?,
    val logs: List<String>?,
    val trade: TradeDto?,
    val message: String?,
    val timestamp: String?,
    val balance: Double? = null,
    val endingBalance: Double? = null
)

// Phase 3: Backtest & Market Analysis DTOs
data class BacktestTradeDto(
    val id: String,
    val asset: String,
    val direction: String,
    val entryPrice: Double,
    val exitPrice: Double,
    val amount: Double,
    val pnl: Double,
    val result: String,
    val timestamp: String,
    val reason: String? = null
)

data class BacktestEquityPointDto(
    val timestamp: String,
    val balance: Double,
    val equity: Double,
    val drawdownPercent: Double
)

data class BacktestResultDto(
    val id: String,
    val userId: Int,
    val asset: String,
    val timeframe: String,
    val strategy: String,
    val startDate: String,
    val endDate: String,
    val initialBalance: Double,
    val finalBalance: Double,
    val totalPnl: Double,
    val totalPnlPercent: Double,
    val totalTrades: Int,
    val winningTrades: Int,
    val losingTrades: Int,
    val winRate: Double,
    val maxDrawdown: Double,
    val profitFactor: Double,
    val averageWin: Double,
    val averageLoss: Double,
    val largestWin: Double,
    val largestLoss: Double,
    val trades: List<BacktestTradeDto>?,
    val equityCurve: List<BacktestEquityPointDto>?,
    val advancedMetrics: AdvancedMetricsDto? = null,
    val regimeBreakdown: List<RegimePerformanceDto>? = null,
    val parameters: Map<String, Any>? = null,
    val disclaimer: String?,
    val mode: String? = "PAPER"
)

data class RunBacktestRequest(
    val asset: String,
    val strategy: String,
    val timeframe: String = "5m",
    val initialBalance: Double = 10000.0,
    val tradeAmount: Double = 100.0,
    val spread: Double? = null,
    val slippage: Double? = null,
    val fee: Double? = null
)

data class BacktestResponse(
    val success: Boolean,
    val result: BacktestResultDto?,
    val error: String?
)

data class StrategyComparisonItemDto(
    val strategy: String,
    val initialBalance: Double,
    val finalBalance: Double,
    val totalPnl: Double,
    val totalPnlPercent: Double,
    val totalTrades: Int,
    val winRate: Double,
    val profitFactor: Double,
    val maxDrawdown: Double
)

data class CompareStrategiesRequest(
    val asset: String,
    val timeframe: String = "5m",
    val count: Int = 100,
    val initialBalance: Double = 10000.0
)

data class CompareStrategiesResponse(
    val success: Boolean,
    val asset: String?,
    val timeframe: String?,
    val comparison: List<StrategyComparisonItemDto>?,
    val disclaimer: String?,
    val error: String?
)

data class MarketQuoteResponse(
    val success: Boolean,
    val asset: String?,
    val timeframe: String?,
    val price: Double?,
    val timestamp: String?,
    val source: String?,
    val isLive: Boolean?,
    val status: String?,
    val change24h: Double?,
    val changePercent: Double?,
    val error: String?
)

// Phase 4 Research DTOs
data class MonthlyPerformanceDto(
    val month: String,
    val tradesCount: Int,
    val winningTrades: Int,
    val losingTrades: Int,
    val winRate: Double,
    val netPnl: Double,
    val returnPercent: Double,
    val maxDrawdown: Double
)

data class AdvancedMetricsDto(
    val initialBalance: Double,
    val finalBalance: Double,
    val netPnl: Double,
    val returnPercent: Double,
    val grossProfit: Double,
    val grossLoss: Double,
    val totalTrades: Int,
    val winningTrades: Int,
    val losingTrades: Int,
    val winRate: Double,
    val maxDrawdownPercent: Double,
    val maxDrawdownDurationBars: Int,
    val averageDrawdownPercent: Double,
    val recoveryFactor: Double?,
    val averageWin: Double,
    val averageLoss: Double,
    val winLossRatio: Double?,
    val profitFactor: Double,
    val expectancy: Double,
    val maxConsecutiveWins: Int,
    val maxConsecutiveLosses: Int,
    val sharpeRatio: Double?,
    val sortinoRatio: Double?,
    val calmarRatio: Double?,
    val sampleSizeRating: String,
    val sampleSizeWarning: String?,
    val monthlyPerformance: List<MonthlyPerformanceDto>?
)

data class RegimePerformanceDto(
    val regime: String,
    val tradesCount: Int,
    val winningTrades: Int,
    val losingTrades: Int,
    val winRate: Double,
    val netPnl: Double,
    val profitFactor: Double,
    val expectancy: Double
)

data class RegimeClassificationDto(
    val regime: String,
    val timestamp: Long,
    val atr: Double,
    val atrAvg: Double,
    val bollingerWidth: Double,
    val emaSlope: Double,
    val description: String
)

data class OptimizationCombinationDto(
    val combinationId: String,
    val parameters: Map<String, Any>,
    val trainMetrics: AdvancedMetricsDto,
    val valMetrics: AdvancedMetricsDto?,
    val testMetrics: AdvancedMetricsDto?,
    val overfittingScore: Double,
    val overfittingRisk: String,
    val isRecommended: Boolean
)

data class OptimizationResultDto(
    val id: String,
    val userId: Int,
    val asset: String,
    val timeframe: String,
    val strategy: String,
    val totalCombinations: Int,
    val trainCandlesCount: Int,
    val valCandlesCount: Int,
    val testCandlesCount: Int,
    val results: List<OptimizationCombinationDto>,
    val overfittingWarning: String?,
    val disclaimer: String?,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false
)

data class WalkForwardWindowDto(
    val windowIndex: Int,
    val trainStartDate: String,
    val trainEndDate: String,
    val testStartDate: String,
    val testEndDate: String,
    val bestParameters: Map<String, Any>,
    val inSampleMetrics: AdvancedMetricsDto,
    val outOfSampleMetrics: AdvancedMetricsDto,
    val windowWfe: Double
)

data class WalkForwardResultDto(
    val id: String,
    val userId: Int,
    val asset: String,
    val timeframe: String,
    val strategy: String,
    val trainCandles: Int,
    val testCandles: Int,
    val stepCandles: Int,
    val windowsCount: Int,
    val windows: List<WalkForwardWindowDto>,
    val overallWfe: Double,
    val cumulativeOosPnl: Double,
    val cumulativeOosReturnPercent: Double,
    val cumulativeEquityCurve: List<BacktestEquityPointDto>,
    val robustnessSummary: String,
    val disclaimer: String?,
    val mode: String = "PAPER"
)

data class MonteCarloPercentilesDto(
    val p5: Double,
    val p25: Double,
    val median: Double,
    val p75: Double,
    val p95: Double
)

data class MonteCarloResultDto(
    val iterations: Int,
    val initialBalance: Double,
    val finalBalanceDistribution: MonteCarloPercentilesDto,
    val maxDrawdownDistribution: MonteCarloPercentilesDto,
    val worstCaseDrawdown: Double,
    val ruinProbabilityPercent: Double,
    val disclaimer: String?,
    val mode: String = "PAPER"
)

data class RiskProfileDto(
    val name: String,
    val riskPerTradePercent: Double,
    val maxDailyLossPercent: Double,
    val maxDrawdownLimitPercent: Double,
    val maxConcurrentTrades: Int,
    val description: String
)

data class PositionSizingCalculationDto(
    val riskProfile: RiskProfileDto,
    val accountBalance: Double,
    val entryPrice: Double,
    val stopLossPrice: Double,
    val riskAmount: Double,
    val stopLossDistance: Double,
    val stopLossPercent: Double,
    val suggestedPositionSize: Double,
    val mode: String = "PAPER"
)

// Phase 4 Requests & Responses
data class OptimizationRequest(
    val asset: String,
    val strategy: String,
    val timeframe: String = "5m",
    val parameterRanges: Map<String, List<Double>>,
    val trainSplitRatio: Double = 0.70,
    val valSplitRatio: Double = 0.15,
    val testSplitRatio: Double = 0.15,
    val initialBalance: Double = 10000.0,
    val tradeAmount: Double = 100.0
)

data class OptimizationResponse(
    val success: Boolean,
    val result: OptimizationResultDto?,
    val error: String?,
    val mode: String = "PAPER"
)

data class WalkForwardRequest(
    val asset: String,
    val strategy: String,
    val timeframe: String = "5m",
    val parameterRanges: Map<String, List<Double>>,
    val trainCandles: Int = 50,
    val testCandles: Int = 20,
    val stepCandles: Int = 20,
    val initialBalance: Double = 10000.0,
    val tradeAmount: Double = 100.0
)

data class WalkForwardResponse(
    val success: Boolean,
    val result: WalkForwardResultDto?,
    val error: String?,
    val mode: String = "PAPER"
)

data class MonteCarloRequest(
    val trades: List<BacktestTradeDto>,
    val iterations: Int = 500,
    val initialBalance: Double = 10000.0,
    val strategy: String? = null
)

data class MonteCarloResponse(
    val success: Boolean,
    val result: MonteCarloResultDto?,
    val error: String?,
    val mode: String = "PAPER"
)

data class MarketRegimesResponse(
    val success: Boolean,
    val asset: String?,
    val timeframe: String?,
    val totalCandles: Int?,
    val currentRegime: RegimeClassificationDto?,
    val history: List<RegimeClassificationDto>?,
    val error: String?
)

data class PositionSizingRequest(
    val profile: String = "BALANCED",
    val accountBalance: Double = 10000.0,
    val entryPrice: Double,
    val stopLossPrice: Double
)

data class PositionSizingResponse(
    val success: Boolean,
    val calculation: PositionSizingCalculationDto?,
    val error: String?
)

// ==========================================
// PHASE 5: LARGE-SCALE VALIDATION & ANALYTICS DTOs
// ==========================================

data class DataGapInfoDto(
    val expectedTimestamp: Long,
    val actualTimestamp: Long,
    val gapDurationSeconds: Int,
    val missingEstimatedCandles: Int
)

data class DatasetValidationReportDto(
    val passed: Boolean,
    val totalCandles: Int,
    val duplicateTimestamps: Int,
    val outOfOrderCandles: Int,
    val invalidOhlcCandles: Int,
    val gapCount: Int,
    val maxGapDurationSec: Int,
    val gaps: List<DataGapInfoDto>,
    val sha256Checksum: String,
    val warnings: List<String>
)

data class DatasetMetadataDto(
    val id: String,
    val name: String,
    val asset: String,
    val timeframe: String,
    val candleCount: Int,
    val startTime: String,
    val endTime: String,
    val sha256Checksum: String,
    val isValidated: Boolean,
    val createdAt: String
)

data class DatasetsListResponse(
    val success: Boolean,
    val datasets: List<DatasetMetadataDto>?,
    val error: String?,
    val mode: String = "PAPER"
)

data class DatasetUploadResponse(
    val success: Boolean,
    val metadata: DatasetMetadataDto?,
    val validationReport: DatasetValidationReportDto?,
    val error: String?,
    val mode: String = "PAPER"
)

data class MultiAssetResultDto(
    val asset: String,
    val tradesCount: Int,
    val winRate: Double,
    val netPnl: Double,
    val profitFactor: Double,
    val sharpeRatio: Double?,
    val maxDrawdownPercent: Double
)

data class CrossAssetMatrixResultDto(
    val strategy: String,
    val assets: List<MultiAssetResultDto>,
    val averageWinRate: Double,
    val averageSharpe: Double?,
    val robustAssetsCount: Int,
    val fragileAssetsCount: Int,
    val mode: String = "PAPER"
)

data class CrossAssetResponse(
    val success: Boolean,
    val result: CrossAssetMatrixResultDto?,
    val error: String?,
    val mode: String = "PAPER"
)

data class CrossTimeframeResultDto(
    val strategy: String,
    val asset: String,
    val timeframes: List<MultiAssetResultDto>,
    val mode: String = "PAPER"
)

data class CrossTimeframeResponse(
    val success: Boolean,
    val result: CrossTimeframeResultDto?,
    val error: String?,
    val mode: String = "PAPER"
)

data class HeatmapPointDto(
    val param1Value: Double,
    val param2Value: Double,
    val metricValue: Double,
    val winRate: Double,
    val tradesCount: Int
)

data class ParameterSensitivityResultDto(
    val param1Name: String,
    val param2Name: String,
    val matrix: List<HeatmapPointDto>,
    val sensitivityDetected: Boolean,
    val sensitivityWarning: String?,
    val stableRegionCount: Int,
    val cliffDropCount: Int
)

data class SensitivityHeatmapResponse(
    val success: Boolean,
    val result: ParameterSensitivityResultDto?,
    val error: String?,
    val mode: String = "PAPER"
)

data class StressTestScenarioDto(
    val costMultiplier: Double,
    val slippagePips: Double,
    val riskPercent: Double,
    val netPnl: Double,
    val winRate: Double,
    val profitFactor: Double,
    val maxDrawdownPercent: Double,
    val costSensitivityDetected: Boolean
)

data class StressTestReportDto(
    val strategy: String,
    val baselinePnl: Double,
    val scenarios: List<StressTestScenarioDto>,
    val costSensitivityDetected: Boolean,
    val warning: String?,
    val disclaimer: String,
    val mode: String = "PAPER"
)

data class StressTestResponse(
    val success: Boolean,
    val report: StressTestReportDto?,
    val error: String?,
    val mode: String = "PAPER"
)

data class PortfolioAllocationDto(
    val asset: String,
    val strategy: String,
    val weightPercent: Double,
    val allocatedCapital: Double
)

data class PortfolioConfigDto(
    val id: String,
    val userId: Int,
    val name: String,
    val initialCapital: Double,
    val allocations: List<PortfolioAllocationDto>,
    val maxPortfolioDrawdownPercent: Double
)

data class PortfolioEquityPointDto(
    val timestamp: String,
    val equity: Double,
    val drawdownPct: Double
)

data class CorrelationMatrixDto(
    val assets: List<String>,
    val matrix: List<List<Double>>
)

data class PortfolioSimulationResultDto(
    val id: String,
    val name: String,
    val initialCapital: Double,
    val currentEquity: Double,
    val netPnl: Double,
    val returnPercent: Double,
    val maxDrawdownPercent: Double,
    val sharpeRatio: Double?,
    val correlationMatrix: CorrelationMatrixDto,
    val equityCurve: List<PortfolioEquityPointDto>,
    val allocations: List<PortfolioAllocationDto>,
    val riskLimitReached: Boolean,
    val riskLimitMessage: String?,
    val disclaimer: String,
    val mode: String = "PAPER"
)

data class CreatePortfolioRequest(
    val name: String,
    val initialCapital: Double,
    val allocations: List<PortfolioAllocationDto>,
    val maxPortfolioDrawdownPercent: Double? = 15.0
)

data class PortfoliosListResponse(
    val success: Boolean,
    val portfolios: List<PortfolioConfigDto>?,
    val error: String?,
    val mode: String = "PAPER"
)

data class PortfolioCreateResponse(
    val success: Boolean,
    val portfolio: PortfolioConfigDto?,
    val error: String?,
    val mode: String = "PAPER"
)

data class PortfolioSimulationResponse(
    val success: Boolean,
    val simulation: PortfolioSimulationResultDto?,
    val error: String?,
    val mode: String = "PAPER"
)

data class PaperExperimentDto(
    val id: String,
    val userId: Int,
    val name: String,
    val strategy: String,
    val asset: String,
    val timeframe: String,
    val configHash: String,
    val status: String,
    val startBalance: Double,
    val currentBalance: Double,
    val totalTrades: Int,
    val winRate: Double,
    val pnl: Double,
    val createdAt: String,
    val completedAt: String?
)

data class PaperExperimentTradeDto(
    val id: String,
    val experimentId: String,
    val direction: String,
    val entryPrice: Double,
    val exitPrice: Double,
    val amount: Double,
    val pnl: Double,
    val slippage: Double,
    val fees: Double,
    val result: String,
    val journalNotes: String?,
    val entryTime: String,
    val exitTime: String
)

data class BacktestVsPaperComparisonDto(
    val experimentId: String,
    val strategy: String,
    val backtestWinRate: Double,
    val paperWinRate: Double,
    val winRateDeviation: Double,
    val backtestProfitFactor: Double,
    val paperProfitFactor: Double,
    val backtestSharpe: Double?,
    val paperSharpe: Double?,
    val slippageDragPercent: Double,
    val feeDragPercent: Double,
    val divergenceAssessment: String,
    val warning: String?
)

data class CreateExperimentRequest(
    val name: String,
    val strategy: String,
    val asset: String = "BTC/USD",
    val timeframe: String = "5m",
    val parameters: Map<String, Any>? = null,
    val startBalance: Double = 10000.0
)

data class LogExperimentTradeRequest(
    val direction: String,
    val entryPrice: Double,
    val exitPrice: Double,
    val amount: Double,
    val slippage: Double? = 0.0001,
    val fees: Double? = 0.50,
    val journalNotes: String? = null
)

data class ExperimentsListResponse(
    val success: Boolean,
    val experiments: List<PaperExperimentDto>?,
    val error: String?,
    val mode: String = "PAPER"
)

data class ExperimentCreateResponse(
    val success: Boolean,
    val experiment: PaperExperimentDto?,
    val error: String?,
    val mode: String = "PAPER"
)

data class ExperimentTradeResponse(
    val success: Boolean,
    val trade: PaperExperimentTradeDto?,
    val error: String?,
    val mode: String = "PAPER"
)

data class ExperimentCompareResponse(
    val success: Boolean,
    val comparison: BacktestVsPaperComparisonDto?,
    val error: String?,
    val mode: String = "PAPER"
)

data class ResearchReportResponse(
    val success: Boolean,
    val report: Any?,
    val error: String?,
    val mode: String = "PAPER"
)

// ==========================================
// PHASE 6 DTOs — Real-Time Monitoring & Drift
// ==========================================

data class MonitorCurrentPositionDto(
    val direction: String,
    val amount: Double,
    val entryPrice: Double,
    val unrealizedPnl: Double
)

data class MonitorOverviewData(
    val asset: String,
    val currentPrice: Double,
    val previousPrice: Double,
    val priceChange: Double,
    val changePercent: Double,
    val activeSignal: String,
    val signalConfidence: Double,
    val strategy: String,
    val currentPosition: MonitorCurrentPositionDto?,
    val unrealizedPnl: Double,
    val realizedPnl: Double,
    val dailyPnl: Double,
    val drawdown: Double,
    val exposure: Double,
    val riskUtilization: Double,
    val tradeCount: Int,
    val winningTrades: Int,
    val losingTrades: Int,
    val currentRegime: String,
    val dataFreshness: String,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

data class MonitorOverviewResponse(
    val success: Boolean,
    val data: MonitorOverviewData?,
    val error: String?,
    val mode: String = "PAPER"
)

data class MarketHealthDto(
    val provider: String,
    val asset: String,
    val timeframe: String,
    val lastCandleTimestamp: String,
    val lastReceivedTimestamp: String,
    val dataAgeMs: Long,
    val latencyMs: Long,
    val candleCount: Int,
    val missingCandles: Int,
    val duplicateCandles: Int,
    val invalidCandles: Int,
    val status: String,
    val details: String?
)

data class MarketHealthResponse(
    val success: Boolean,
    val data: Any?,
    val error: String?,
    val mode: String = "PAPER"
)

data class PaperSignalDto(
    val signalId: String,
    val asset: String,
    val timeframe: String,
    val strategy: String,
    val timestamp: String,
    val direction: String,
    val entryPrice: Double,
    val stopLoss: Double?,
    val takeProfit: Double?,
    val riskAmount: Double,
    val confidence: Double,
    val marketRegime: String,
    val status: String,
    val rejectionReason: String?
)

data class SignalsResponse(
    val success: Boolean,
    val signals: List<PaperSignalDto>?,
    val count: Int?,
    val error: String?,
    val mode: String = "PAPER"
)

data class SignalAnalyticsData(
    val totalSignals: Int,
    val executedSignals: Int,
    val expiredSignals: Int,
    val rejectedSignals: Int,
    val winRate: Double,
    val avgReturn: Double,
    val avgMFE: Double,
    val avgMAE: Double,
    val avgHoldingTime: Int,
    val profitFactor: Double,
    val expectancy: Double,
    val conversionRate: Double
)

data class SignalAnalyticsResponse(
    val success: Boolean,
    val analytics: SignalAnalyticsData?,
    val error: String?,
    val mode: String = "PAPER"
)

data class RiskDashboardStateDto(
    val dailyPnL: Double,
    val dailyLossPct: Double,
    val currentDrawdown: Double,
    val maxDrawdown: Double,
    val riskPerTrade: Double,
    val totalOpenRisk: Double,
    val portfolioExposure: Double,
    val positionCount: Int,
    val consecutiveLosses: Int,
    val volatility: Double,
    val atr: Double,
    val marketRegime: String,
    val riskUtilization: Double,
    val riskState: String
)

data class RiskOverviewResponse(
    val success: Boolean,
    val riskState: RiskDashboardStateDto?,
    val error: String?,
    val mode: String = "PAPER"
)

data class StrategyItemDto(
    val id: String,
    val name: String,
    val description: String,
    val state: String,
    val updatedAt: String
)

data class StrategiesResponse(
    val success: Boolean,
    val strategies: List<StrategyItemDto>?,
    val error: String?,
    val mode: String = "PAPER"
)

data class UpdateStrategyStateRequest(
    val state: String,
    val reason: String? = "User update",
    val userId: Int? = 1
)

data class PaperAlertDto(
    val id: String,
    val type: String,
    val severity: String,
    val timestamp: String,
    val asset: String?,
    val strategy: String?,
    val message: String,
    val acknowledged: Boolean,
    val resolved: Boolean
)

data class AlertsResponse(
    val success: Boolean,
    val alerts: List<PaperAlertDto>?,
    val count: Int?,
    val error: String?,
    val mode: String = "PAPER"
)

data class PortfolioExposureDto(
    val portfolioId: String,
    val totalEquity: Double,
    val cashBalance: Double,
    val usedCapital: Double,
    val availableCapital: Double,
    val grossExposure: Double,
    val netExposure: Double,
    val correlationExposure: Double,
    val riskExposure: Double,
    val dailyLoss: Double,
    val currentDrawdown: Double,
    val limitsBreached: List<String>,
    val isNewTradeBlocked: Boolean,
    val status: String
)

data class PortfolioExposureResponse(
    val success: Boolean,
    val exposure: PortfolioExposureDto?,
    val error: String?,
    val mode: String = "PAPER"
)

data class ComponentHealthDto(
    val name: String,
    val status: String,
    val latencyMs: Long,
    val details: String?
)

data class SystemHealthDto(
    val overall: String,
    val components: List<ComponentHealthDto>,
    val heartbeatTimestamp: String
)

data class SystemHealthResponse(
    val success: Boolean,
    val health: SystemHealthDto?,
    val error: String?,
    val mode: String = "PAPER"
)

// ==========================================
// PHASE 7: LIVE READ-ONLY DATA, NOTIFICATIONS & ADAPTIVE POLICIES
// ==========================================

data class ProviderInfoDto(
    val id: String,
    val name: String,
    val type: String,
    val role: String,
    val status: String,
    val supportedAssets: List<String>,
    val isLive: Boolean,
    val readOnly: Boolean = true
)

data class ProvidersResponse(
    val success: Boolean,
    val activeProvider: String? = null,
    val currentTier: String? = null,
    val providers: List<ProviderInfoDto>? = null,
    val error: String? = null,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

data class ProviderHealthDetailDto(
    val provider: String = "",
    val connectionStatus: String = "HEALTHY",
    val lastMessageTime: Long? = null,
    val lastCandleTime: Long? = null,
    val latencyMs: Long = 0,
    val messageRate: Double = 0.0,
    val reconnectCount: Int = 0,
    val errorCount: Int = 0,
    val dataAgeMs: Long = 0,
    val uptimePercent: Double = 100.0,
    val availabilityPercent: Double = 100.0,
    val avgLatencyMs: Double = 0.0,
    val maxLatencyMs: Long = 0,
    val failoverCount: Int = 0,
    val fallbackActive: Boolean = false,
    val activeProviderName: String = ""
)

data class ProviderHealthResponse(
    val success: Boolean,
    val health: ProviderHealthDetailDto? = null,
    val error: String? = null,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

data class ProviderEventDto(
    val id: Int,
    val provider: String,
    val previousState: String,
    val newState: String,
    val reason: String?,
    val latencyMs: Long = 0,
    val createdAt: String
)

data class ProviderEventsResponse(
    val success: Boolean,
    val events: List<ProviderEventDto>? = null,
    val error: String? = null,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

data class NotificationDeviceRequest(
    val token: String,
    val platform: String = "ANDROID"
)

data class NotificationDeviceDto(
    val id: Int,
    val userId: Int,
    val deviceToken: String,
    val platform: String,
    val enabled: Boolean,
    val createdAt: String,
    val updatedAt: String
)

data class NotificationDeviceResponse(
    val success: Boolean,
    val device: NotificationDeviceDto? = null,
    val error: String? = null,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

data class NotificationPreferencesDto(
    val id: Int? = null,
    val userId: Int = 1,
    val notificationsEnabled: Boolean = true,
    val criticalRisk: Boolean = true,
    val strategyDrift: Boolean = true,
    val marketData: Boolean = true,
    val systemHealth: Boolean = true,
    val paperTrade: Boolean = true,
    val experiment: Boolean = true,
    val anomaly: Boolean = true,
    val updatedAt: String? = null
)

data class NotificationPreferencesResponse(
    val success: Boolean,
    val preferences: NotificationPreferencesDto? = null,
    val error: String? = null,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

data class DriftThresholdsDto(
    val watchExpDropPct: Double = 0.05,
    val significantExpDropPct: Double = 0.15,
    val criticalExpDropPct: Double = 0.25
)

data class RiskThresholdsDto(
    val maxDailyLossPct: Double = 3.0,
    val maxDrawdownPct: Double = 5.0,
    val maxConsecutiveLosses: Int = 4
)

data class ThrottleRulesDto(
    val watchRiskMultiplier: Double = 0.75,
    val significantRiskMultiplier: Double = 0.50,
    val cooldownSeconds: Int = 300,
    val maxSignalsPerHour: Int? = 10
)

data class PauseRulesDto(
    val autoPauseOnCriticalDrift: Boolean = true,
    val autoPauseOnCriticalRisk: Boolean = true
)

data class RecoveryRulesDto(
    val minObservationMinutes: Int = 15,
    val requireConsecutiveWins: Int? = null,
    val requireHealthyMarketHealth: Boolean = true,
    val autoResume: Boolean = false
)

data class StrategyPolicyDto(
    val strategyId: String,
    val version: Int = 1,
    val driftThresholds: DriftThresholdsDto = DriftThresholdsDto(),
    val riskThresholds: RiskThresholdsDto = RiskThresholdsDto(),
    val throttleRules: ThrottleRulesDto = ThrottleRulesDto(),
    val pauseRules: PauseRulesDto = PauseRulesDto(),
    val recoveryRules: RecoveryRulesDto = RecoveryRulesDto(),
    val enabled: Boolean = true
)

data class StrategyPolicyResponse(
    val success: Boolean,
    val policy: StrategyPolicyDto? = null,
    val error: String? = null,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

data class AdaptationEventDto(
    val id: Int,
    val strategyId: String,
    val previousState: String,
    val newState: String,
    val triggerEvent: String,
    val reason: String,
    val automatic: Boolean,
    val createdAt: String
)

data class AdaptationHistoryResponse(
    val success: Boolean,
    val history: List<AdaptationEventDto>? = null,
    val error: String? = null,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

data class TimelineEventDto(
    val id: Int? = null,
    val experimentId: String,
    val sequence: Int,
    val eventType: String,
    val title: String,
    val details: Any? = null,
    val timestamp: String
)

data class TimelineResponse(
    val success: Boolean,
    val experimentId: String? = null,
    val timeline: List<TimelineEventDto>? = null,
    val totalEvents: Int? = null,
    val error: String? = null,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

// ==========================================
// PHASE 8: ADVANCED RESEARCH & PORTFOLIO LAB
// ==========================================

data class StrategyVersionDto(
    val strategyId: String,
    val name: String,
    val version: String = "1.0.0",
    val description: String = "",
    val enabled: Boolean = true,
    val parameters: Map<String, Any> = emptyMap(),
    val configHash: String = "",
    val indicatorDependencies: List<String> = emptyList(),
    val riskConfiguration: Map<String, Any> = emptyMap()
)

data class ResearchStrategiesResponse(
    val success: Boolean,
    val strategies: List<StrategyVersionDto>? = null,
    val totalCount: Int? = null,
    val error: String? = null,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

data class EnsembleStrategyWeightDto(
    val strategyId: String,
    val weight: Double
)

data class EnsembleConfigDto(
    val id: String,
    val name: String,
    val aggregationMode: String, // MAJORITY, WEIGHTED, CONSENSUS, INDEPENDENT
    val strategies: List<EnsembleStrategyWeightDto>,
    val minConfirmations: Int = 2,
    val enabled: Boolean = true,
    val createdAt: String? = null
)

data class EnsembleVoteDto(
    val strategyId: String,
    val signal: String,
    val confidence: Int,
    val weight: Double
)

data class EnsembleSignalResultDto(
    val ensembleId: String,
    val asset: String,
    val timestamp: String,
    val aggregationMode: String,
    val finalSignal: String,
    val confidence: Int,
    val voteBreakdown: List<EnsembleVoteDto> = emptyList(),
    val conflictDetected: Boolean = false,
    val explanation: String = ""
)

data class SignalConflictDto(
    val id: Int? = null,
    val ensembleId: String? = null,
    val asset: String,
    val timestamp: String,
    val regime: String,
    val disagreeingSignals: List<EnsembleVoteDto> = emptyList(),
    val resolvedSignal: String,
    val resolutionMethod: String
)

data class EnsembleResponse(
    val success: Boolean,
    val ensemble: EnsembleConfigDto? = null,
    val recentConflicts: List<SignalConflictDto>? = null,
    val error: String? = null,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

data class StrategyCorrelationMatrixDto(
    val strategies: List<String>,
    val matrix: List<List<Double>>,
    val timeframe: String,
    val asset: String,
    val sampleTrades: Int,
    val generatedAt: String
)

data class RegimeCorrelationDto(
    val regime: String,
    val correlation: Double,
    val sampleSize: Int
)

data class StrategyCorrelationResponse(
    val success: Boolean,
    val correlationMatrix: StrategyCorrelationMatrixDto? = null,
    val regimeCorrelations: List<RegimeCorrelationDto>? = null,
    val error: String? = null,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

data class StrategyRiskAttributionDto(
    val strategyId: String,
    val riskContributionPct: Double,
    val returnContributionPct: Double,
    val drawdownContributionPct: Double
)

data class ConcentrationRiskDto(
    val herfindahlIndex: Int,
    val riskRating: String
)

data class RiskAttributionDto(
    val totalPortfolioRisk: Double = 100.0,
    val strategyAttributions: List<StrategyRiskAttributionDto> = emptyList(),
    val concentrationRisk: ConcentrationRiskDto = ConcentrationRiskDto(2500, "LOW"),
    val generatedAt: String? = null
)

data class RiskAttributionResponse(
    val success: Boolean,
    val attribution: RiskAttributionDto? = null,
    val error: String? = null,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

data class ParameterVariationDto(
    val value: Any,
    val winRate: Double,
    val returnPct: Double,
    val expectancy: Double,
    val maxDrawdown: Double,
    val tradeCount: Int,
    val deltaFromBaseline: Double
)

data class ParameterCliffDto(
    val fromValue: Any,
    val toValue: Any,
    val metricDropPct: Double,
    val severity: String
)

data class ParameterStabilityDto(
    val strategyId: String,
    val parameterKey: String,
    val baselineValue: Any,
    val stabilityScore: Double,
    val region: String,
    val testedVariations: List<ParameterVariationDto> = emptyList(),
    val cliffsDetected: List<ParameterCliffDto> = emptyList(),
    val sampleQuality: String,
    val disclaimer: String
)

data class ParameterStabilityResponse(
    val success: Boolean,
    val stability: ParameterStabilityDto? = null,
    val error: String? = null,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

data class DecisionStepDto(
    val step: Int,
    val name: String,
    val timestamp: String,
    val details: Any? = null
)

data class TradeDiagnosticDto(
    val tradeId: String,
    val asset: String,
    val strategyId: String,
    val signal: String,
    val entryPrice: Double,
    val exitPrice: Double,
    val amount: Double,
    val pnl: Double,
    val result: String,
    val marketRegime: String,
    val indicatorSnapshot: Map<String, Any>? = null,
    val decisionPath: List<DecisionStepDto> = emptyList(),
    val mae: Double = 0.0,
    val mfe: Double = 0.0,
    val slippage: Double = 0.0,
    val fees: Double = 0.0,
    val holdingTimeSeconds: Int = 60,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

data class TradeDiagnosticResponse(
    val success: Boolean,
    val diagnostic: TradeDiagnosticDto? = null,
    val error: String? = null,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

data class ReplaySessionDto(
    val sessionId: String,
    val experimentId: String,
    val currentIndex: Int,
    val totalBars: Int,
    val currentBarTimestamp: String,
    val speed: Int,
    val status: String,
    val currentPrice: Double,
    val activeSignals: List<String> = emptyList()
)

data class ReplayResponse(
    val success: Boolean,
    val replay: ReplaySessionDto? = null,
    val error: String? = null,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

data class PerformanceStageMetricsDto(
    val stage: String,
    val returnPct: Double,
    val winRate: Double,
    val maxDrawdown: Double,
    val sharpe: Double?,
    val tradeCount: Int,
    val sampleQuality: String
)

data class PerformanceStagesComparisonDto(
    val experimentId: String,
    val stages: List<PerformanceStageMetricsDto>,
    val divergencePoint: String?,
    val overallRetentionRatio: Double,
    val notes: String
)

data class PerformanceStagesResponse(
    val success: Boolean,
    val comparison: PerformanceStagesComparisonDto? = null,
    val error: String? = null,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

// ==========================================
// PHASE 9: AUTONOMOUS RESEARCH CONTROL CENTER
// ==========================================

data class ResearchJobDto(
    val jobId: String,
    val experimentId: String?,
    val type: String,
    val priority: String,
    val status: String,
    val progress: Int,
    val createdAt: String,
    val startedAt: String? = null,
    val completedAt: String? = null,
    val error: String? = null,
    val lastCompletedStage: String? = null
)

data class ResearchJobListResponse(
    val success: Boolean,
    val jobs: List<ResearchJobDto> = emptyList(),
    val error: String? = null,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

data class ResearchJobDetailResponse(
    val success: Boolean,
    val job: ResearchJobDto? = null,
    val error: String? = null,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

data class RollingWindowDto(
    val windowSize: Int,
    val tradesCount: Int,
    val winRate: Double,
    val expectancy: Double,
    val profitFactor: Double,
    val maxDrawdown: Double,
    val averageSlippage: Double,
    val averageFees: Double,
    val driftPercentage: Double
)

data class StrategyDriftTrendDto(
    val strategyId: String,
    val asset: String,
    val windows: List<RollingWindowDto> = emptyList(),
    val trend: String,
    val weeklyDeltas: List<Double> = emptyList(),
    val calculatedAt: String,
    val disclaimer: String
)

data class DriftTrendResponse(
    val success: Boolean,
    val analysis: StrategyDriftTrendDto? = null,
    val error: String? = null,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

data class ResearchRecommendationDto(
    val id: String,
    val trigger: String,
    val reason: String,
    val evidence: String,
    val suggestedResearchJob: String,
    val priority: String,
    val timestamp: String,
    val status: String
)

data class RecommendationsResponse(
    val success: Boolean,
    val recommendations: List<ResearchRecommendationDto> = emptyList(),
    val error: String? = null,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

data class StrategyEvidenceItemDto(
    val strategyId: String,
    val name: String,
    val datasetQuality: String,
    val sampleSizeRating: String,
    val sampleTradesCount: Int,
    val oosTested: Boolean,
    val walkForwardTested: Boolean,
    val stressTested: Boolean,
    val monteCarloSimulated: Boolean,
    val parameterStabilityTested: Boolean,
    val paperDataQuality: String,
    val driftStatus: String,
    val overallEvidenceLevel: String
)

data class EvidenceMatrixResponse(
    val success: Boolean,
    val matrix: List<StrategyEvidenceItemDto> = emptyList(),
    val error: String? = null,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

data class WatchdogEventDto(
    val id: Int,
    val experimentId: String,
    val checkType: String,
    val severity: String,
    val message: String,
    val actionTaken: String,
    val timestamp: String
)

data class WatchdogEventsResponse(
    val success: Boolean,
    val events: List<WatchdogEventDto> = emptyList(),
    val error: String? = null,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

data class AnomalyInvestigationDto(
    val investigationId: String,
    val anomalyId: String,
    val asset: String,
    val strategyId: String?,
    val timestamp: String,
    val evidenceStatus: String,
    val classifiedRootCause: String,
    val diagnosticSummary: String,
    val suggestedAction: String
)

data class AnomalyInvestigationsResponse(
    val success: Boolean,
    val investigations: List<AnomalyInvestigationDto> = emptyList(),
    val error: String? = null,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

data class StressCellDto(
    val xDimensionValue: Double,
    val yDimensionValue: Double,
    val returnPct: Double,
    val maxDrawdown: Double,
    val expectancy: Double,
    val status: String
)

data class StressMatrixResultDto(
    val strategyId: String,
    val matrixType: String,
    val xDimensionName: String,
    val yDimensionName: String,
    val grid: List<List<StressCellDto>> = emptyList(),
    val overallRobustness: String,
    val generatedAt: String,
    val disclaimer: String
)

data class StressMatrixResponse(
    val success: Boolean,
    val result: StressMatrixResultDto? = null,
    val error: String? = null,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

data class RiskContributionDto(
    val strategyId: String,
    val contributionPct: Double
)

data class PortfolioWhatIfDto(
    val scenarioName: String,
    val baselineEquity: Double,
    val simulatedEquity: Double,
    val baselineDrawdown: Double,
    val simulatedDrawdown: Double,
    val equityDeltaPct: Double,
    val drawdownDeltaPct: Double,
    val riskContributions: List<RiskContributionDto> = emptyList(),
    val disclaimer: String
)

data class PortfolioWhatIfResponse(
    val success: Boolean,
    val result: PortfolioWhatIfDto? = null,
    val runs: List<PortfolioWhatIfDto> = emptyList(),
    val error: String? = null,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

data class RegimeTransitionEventDto(
    val id: Int? = null,
    val asset: String,
    val previousRegime: String,
    val newRegime: String,
    val transitionTimestamp: String,
    val confidenceScore: Double,
    val affectedStrategies: List<String> = emptyList()
)

data class RegimeTransitionsResponse(
    val success: Boolean,
    val events: List<RegimeTransitionEventDto> = emptyList(),
    val error: String? = null,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

data class DailyResearchReportDto(
    val id: String,
    val reportDate: String,
    val marketDataHealth: String,
    val providerStatusSummary: String,
    val driftAlerts: List<String> = emptyList(),
    val anomaliesDetected: Int,
    val activeResearchJobs: Int,
    val researchRecommendations: List<String> = emptyList(),
    val generatedAt: String
)

data class DailyReportsResponse(
    val success: Boolean,
    val reports: List<DailyResearchReportDto> = emptyList(),
    val error: String? = null,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

// Strategy V2 Demo Validation & Loss Analysis DTOs
data class ResearchCategoryMetricsDto(
    val category: String = "",
    val key: String = "",
    val tradesCount: Int = 0,
    val wins: Int = 0,
    val losses: Int = 0,
    val winRate: Double = 0.0,
    val totalPnL: Double = 0.0,
    val averagePnL: Double = 0.0,
    val averageWinningTrade: Double = 0.0,
    val averageLosingTrade: Double = 0.0,
    val maxConsecutiveLosses: Int = 0,
    val maxDrawdown: Double = 0.0,
    val expectancy: Double = 0.0,
    val profitFactor: Double = 0.0,
    val sampleStatus: String = "INSUFFICIENT_SAMPLE",
    val sampleWarning: String? = null
)

data class LossClusterPatternDto(
    val id: String = "",
    val title: String = "",
    val condition: String = "",
    val lossCount: Int = 0,
    val totalTradesInCondition: Int = 0,
    val lossRate: Double = 0.0,
    val impactPnL: Double = 0.0,
    val severity: String = "LOW",
    val observation: String = "",
    val disclaimer: String = ""
)

data class DiagnosticAlertDto(
    val id: String = "",
    val code: String = "",
    val severity: String = "INFO",
    val title: String = "",
    val message: String = "",
    val category: String = "",
    val timestamp: Long = 0L
)

data class StrategyV2OverviewDto(
    val totalTrades: Int = 0,
    val wins: Int = 0,
    val losses: Int = 0,
    val winRate: Double = 0.0,
    val totalPnL: Double = 0.0,
    val expectancy: Double = 0.0,
    val maxDrawdown: Double = 0.0,
    val maxConsecutiveLosses: Int = 0,
    val sampleStatus: String = "ADEQUATE"
)

data class ConsecutiveLossAnalysisDto(
    val singleLossEvents: Int = 0,
    val twoConsecutiveLossEvents: Int = 0,
    val threeConsecutiveLossEvents: Int = 0,
    val fourPlusConsecutiveLossEvents: Int = 0,
    val longestLossStreak: Int = 0
)

data class V2ValidationDashboardDto(
    val overview: StrategyV2OverviewDto = StrategyV2OverviewDto(),
    val assetAnalysis: Map<String, ResearchCategoryMetricsDto> = emptyMap(),
    val regimeAnalysis: Map<String, ResearchCategoryMetricsDto> = emptyMap(),
    val scoreAnalysis: Map<String, ResearchCategoryMetricsDto> = emptyMap(),
    val confirmationAnalysis: Map<String, ResearchCategoryMetricsDto> = emptyMap(),
    val durationAnalysis: Map<String, ResearchCategoryMetricsDto> = emptyMap(),
    val consecutiveLossAnalysis: ConsecutiveLossAnalysisDto = ConsecutiveLossAnalysisDto(),
    val lossClusters: List<LossClusterPatternDto> = emptyList(),
    val v1VsV2Comparison: Map<String, Any>? = null,
    val oosValidation: Map<String, Any>? = null,
    val diagnosticAlerts: List<DiagnosticAlertDto> = emptyList(),
    val disclaimer: String = ""
)

data class V2ValidationDashboardResponse(
    val success: Boolean,
    val validationDashboard: V2ValidationDashboardDto? = null,
    val error: String? = null,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

// ==========================================
// Strategy V2.1 Research Lab DTOs
// ==========================================

data class ResearchExperimentVariantDto(
    val id: String = "",
    val experimentGroup: String = "",
    val label: String = "",
    val condition: String = "",
    val parameterDescription: String = "",
    val status: String = "EXPERIMENT",
    val validationStatus: String = "INSUFFICIENT_SAMPLE",
    val totalTrades: Int = 0,
    val acceptedSignals: Int = 0,
    val rejectedSignals: Int = 0,
    val rejectionReasons: Map<String, Int> = emptyMap(),
    val wins: Int = 0,
    val losses: Int = 0,
    val winRate: Double = 0.0,
    val averageWin: Double = 0.0,
    val averageLoss: Double = 0.0,
    val expectancy: Double = 0.0,
    val totalPnL: Double = 0.0,
    val maxDrawdown: Double = 0.0,
    val maxConsecutiveLosses: Int = 0,
    val waitPercentage: Double = 0.0,
    val averageDuration: String = "",
    val lossReductionVsBaseline: Double = 0.0,
    val sampleStatus: String = "ADEQUATE",
    val sampleWarning: String? = null,
    val assetBreakdown: Map<String, ResearchCategoryMetricsDto> = emptyMap(),
    val regimeBreakdown: Map<String, ResearchCategoryMetricsDto> = emptyMap(),
    val scoreBucketBreakdown: Map<String, ResearchCategoryMetricsDto> = emptyMap(),
    val disclaimer: String = ""
)

data class V2_1_OOSSplitDto(
    val period: String = "",
    val count: Int = 0,
    val winRate: Double = 0.0,
    val expectancy: Double = 0.0,
    val pnl: Double = 0.0
)

data class V2_1_LeakageCheckDto(
    val lookaheadFree: Boolean = true,
    val noFutureCandleAccess: Boolean = true,
    val noParameterLeakage: Boolean = true,
    val noDuplicateTrades: Boolean = true,
    val noFutureInformationInRegimes: Boolean = true,
    val details: String = ""
)

data class V2_1_OOSValidationResultDto(
    val splits: Map<String, V2_1_OOSSplitDto> = emptyMap(),
    val leakageCheck: V2_1_LeakageCheckDto = V2_1_LeakageCheckDto(),
    val degradationRatio: Double = 0.0,
    val verdict: String = "VALIDATED",
    val disclaimer: String = ""
)

data class V2_1_LossReductionSummaryDto(
    val hypothesis1Reduction: String = "",
    val hypothesis2Reduction: String = "",
    val hypothesis3Reduction: String = "",
    val overallObservations: List<String> = emptyList()
)

data class V2_1_SafetyStatusDto(
    val demoPaperOnly: Boolean = true,
    val dataQualityVerified: Boolean = true,
    val volatilityStateOk: Boolean = true,
    val dailyLossLimitOk: Boolean = true,
    val drawdownLimitOk: Boolean = true,
    val consecutiveLossBreakerOk: Boolean = true,
    val activePositionLockOk: Boolean = true,
    val cooldownOk: Boolean = true,
    val duplicateSignalSuppressionOk: Boolean = true,
    val signalValidityOk: Boolean = true,
    val disclaimer: String = ""
)

data class V2_1_ExperimentGroupDto(
    val variants: List<ResearchExperimentVariantDto> = emptyList(),
    val rejectedSignalsCount: Int = 0,
    val summary: String = ""
)

data class V2_1_ResearchLabDashboardDto(
    val experimentsMatrix: List<ResearchExperimentVariantDto> = emptyList(),
    val durationExperiment: V2_1_ExperimentGroupDto = V2_1_ExperimentGroupDto(),
    val rangingConfluenceExperiment: V2_1_ExperimentGroupDto = V2_1_ExperimentGroupDto(),
    val thresholdExperiment: V2_1_ExperimentGroupDto = V2_1_ExperimentGroupDto(),
    val oosValidation: V2_1_OOSValidationResultDto = V2_1_OOSValidationResultDto(),
    val lossReductionSummary: V2_1_LossReductionSummaryDto = V2_1_LossReductionSummaryDto(),
    val safetyStatus: V2_1_SafetyStatusDto = V2_1_SafetyStatusDto(),
    val disclaimer: String = ""
)

data class V2_1_ResearchLabDashboardResponse(
    val success: Boolean,
    val researchLabDashboard: V2_1_ResearchLabDashboardDto? = null,
    val error: String? = null,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

// ==========================================
// Strategy V2.2 Fresh Validation DTOs
// ==========================================

data class ConfidenceInterval95Dto(
    val pointEstimate: Double = 0.0,
    val lowerBound: Double = 0.0,
    val upperBound: Double = 0.0,
    val marginOfError: Double = 0.0,
    val sampleSize: Int = 0
)

data class V2_2_VariantMetricsDto(
    val id: String = "",
    val label: String = "",
    val role: String = "EXPERIMENT",
    val condition: String = "",
    val parameterDescription: String = "",
    val totalOpportunities: Int = 0,
    val acceptedTrades: Int = 0,
    val rejectedSignals: Int = 0,
    val rejectionReasons: Map<String, Int> = emptyMap(),
    val wins: Int = 0,
    val losses: Int = 0,
    val winRate: Double = 0.0,
    val confidenceInterval95: ConfidenceInterval95Dto = ConfidenceInterval95Dto(),
    val totalPnL: Double = 0.0,
    val averagePnL: Double = 0.0,
    val expectancy: Double = 0.0,
    val averageWinningTrade: Double = 0.0,
    val averageLosingTrade: Double = 0.0,
    val profitFactor: Double = 0.0,
    val maxDrawdown: Double = 0.0,
    val maxConsecutiveLosses: Int = 0,
    val waitPercentage: Double = 0.0,
    val rejectedPercentage: Double = 0.0,
    val sampleStatus: String = "ADEQUATE_SAMPLE",
    val sampleWarning: String? = null,
    val observationLabel: String = "OBSERVED_POSITIVE",
    val promotionStatus: String = "CANDIDATE_FOR_FURTHER_TESTING",
    val promotionRationale: String = "",
    val disclaimer: String = ""
)

data class V2_2_BreakdownCategoryDto(
    val key: String = "",
    val category: String = "",
    val tradesCount: Int = 0,
    val wins: Int = 0,
    val losses: Int = 0,
    val winRate: Double = 0.0,
    val confidenceInterval95: ConfidenceInterval95Dto = ConfidenceInterval95Dto(),
    val totalPnL: Double = 0.0,
    val expectancy: Double = 0.0,
    val maxDrawdown: Double = 0.0,
    val sampleStatus: String = "ADEQUATE_SAMPLE",
    val sampleWarning: String? = null
)

data class V2_2_DatasetMetadataDto(
    val datasetId: String = "V2.2_FRESH",
    val totalFreshTrades: Int = 0,
    val startDate: String = "",
    val endDate: String = "",
    val assetsIncluded: List<String> = emptyList(),
    val regimesIncluded: List<String> = emptyList(),
    val isDistinctFromV2_0: Boolean = true,
    val disclaimer: String = ""
)

data class V2_2_ConfidenceIntervalsSummaryDto(
    val variantCIs: Map<String, ConfidenceInterval95Dto> = emptyMap(),
    val observationNote: String = ""
)

data class V2_2_OOSValidationDto(
    val datasetSplits: Map<String, V2_1_OOSSplitDto> = emptyMap(),
    val leakageVerification: V2_1_LeakageCheckDto = V2_1_LeakageCheckDto(),
    val degradationRatio: Double = 0.0,
    val verdict: String = "OOS_VALIDATED"
)

data class V2_2_CandidateDto(
    val variant: String = "",
    val status: String = "",
    val rationale: String = ""
)

data class V2_2_PromotionGateSummaryDto(
    val productionStrategyStatus: String = "",
    val candidates: List<V2_2_CandidateDto> = emptyList(),
    val decisionRule: String = ""
)

data class V2_2_FreshValidationDashboardDto(
    val datasetMetadata: V2_2_DatasetMetadataDto = V2_2_DatasetMetadataDto(),
    val experimentMatrix: List<V2_2_VariantMetricsDto> = emptyList(),
    val assetAnalysis: Map<String, V2_2_BreakdownCategoryDto> = emptyMap(),
    val regimeAnalysis: Map<String, V2_2_BreakdownCategoryDto> = emptyMap(),
    val scoreAnalysis: Map<String, V2_2_BreakdownCategoryDto> = emptyMap(),
    val durationAnalysis: Map<String, V2_2_BreakdownCategoryDto> = emptyMap(),
    val confidenceIntervalsSummary: V2_2_ConfidenceIntervalsSummaryDto = V2_2_ConfidenceIntervalsSummaryDto(),
    val oosValidation: V2_2_OOSValidationDto = V2_2_OOSValidationDto(),
    val safetyStatus: Map<String, Any> = emptyMap(),
    val promotionGateSummary: V2_2_PromotionGateSummaryDto = V2_2_PromotionGateSummaryDto(),
    val disclaimer: String = ""
)

data class V2_2_FreshValidationDashboardResponse(
    val success: Boolean,
    val freshValidationDashboard: V2_2_FreshValidationDashboardDto? = null,
    val error: String? = null,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

// ==========================================
// STRATEGY V2.3: MULTI-SESSION VALIDATION & PROMOTION GATE DTOs
// ==========================================

data class V2_3_DatasetMetadataDto(
    val datasetId: String = "V2.3_MULTI_SESSION",
    val totalObservations: Int = 0,
    val totalSessions: Int = 0,
    val startDate: String = "",
    val endDate: String = "",
    val assetsIncluded: List<String> = emptyList(),
    val regimesIncluded: List<String> = emptyList(),
    val disclaimer: String = ""
)

data class V2_3_OverviewMetricsDto(
    val totalSessions: Int = 0,
    val totalObservations: Int = 0,
    val overallWinRate: Double = 0.0,
    val overallPnL: Double = 0.0,
    val overallExpectancy: Double = 0.0,
    val overallProfitFactor: Double = 0.0,
    val maxDrawdown: Double = 0.0,
    val maxConsecutiveLosses: Int = 0,
    val positiveSessionsCount: Int = 0,
    val negativeSessionsCount: Int = 0,
    val neutralSessionsCount: Int = 0
)

data class V2_3_SessionMetricsDto(
    val sessionId: String = "",
    val sessionIndex: Int = 0,
    val sessionDate: String = "",
    val hypothesisTested: String = "",
    val totalObservations: Int = 0,
    val acceptedTrades: Int = 0,
    val rejectedSignals: Int = 0,
    val wins: Int = 0,
    val losses: Int = 0,
    val winRate: Double = 0.0,
    val totalPnL: Double = 0.0,
    val expectancy: Double = 0.0,
    val profitFactor: Double = 0.0,
    val maxDrawdown: Double = 0.0,
    val maxConsecutiveLosses: Int = 0,
    val waitPercentage: Double = 0.0,
    val sessionOutcome: String = "NEUTRAL",
    val degradationDetected: Boolean = false,
    val degradationReason: String? = null
)

data class V2_3_HypothesisConsistencySummaryDto(
    val hypothesisId: String = "",
    val hypothesisName: String = "",
    val controlVariant: String = "",
    val experimentVariant: String = "",
    val condition: String = "",
    val totalSessionsEvaluated: Int = 0,
    val positiveSessions: Int = 0,
    val negativeSessions: Int = 0,
    val neutralSessions: Int = 0,
    val totalObservations: Int = 0,
    val controlWinRate: Double = 0.0,
    val experimentWinRate: Double = 0.0,
    val controlTotalPnL: Double = 0.0,
    val experimentTotalPnL: Double = 0.0,
    val controlExpectancy: Double = 0.0,
    val experimentExpectancy: Double = 0.0,
    val experimentProfitFactor: Double = 0.0,
    val maxDrawdown: Double = 0.0,
    val maxConsecutiveLosses: Int = 0,
    val meanSessionPnL: Double = 0.0,
    val medianSessionPnL: Double = 0.0,
    val stdDevSessionPnL: Double = 0.0,
    val bestSessionPnL: Double = 0.0,
    val worstSessionPnL: Double = 0.0,
    val winRateConfidenceInterval: ConfidenceInterval95Dto = ConfidenceInterval95Dto(),
    val sampleStatus: String = "ADEQUATE_SAMPLE",
    val oosStatus: String = "OOS_VALIDATED",
    val promotionGateStatus: String = "READY_FOR_MANUAL_REVIEW",
    val promotionRationale: String = ""
)

data class V2_3_CrossAssetSessionMetricsDto(
    val asset: String = "",
    val tradesCount: Int = 0,
    val wins: Int = 0,
    val losses: Int = 0,
    val winRate: Double = 0.0,
    val confidenceInterval95: ConfidenceInterval95Dto = ConfidenceInterval95Dto(),
    val totalPnL: Double = 0.0,
    val expectancy: Double = 0.0,
    val maxDrawdown: Double = 0.0,
    val sampleStatus: String = "ADEQUATE_SAMPLE"
)

data class V2_3_CrossRegimeSessionMetricsDto(
    val regime: String = "",
    val tradesCount: Int = 0,
    val wins: Int = 0,
    val losses: Int = 0,
    val winRate: Double = 0.0,
    val confidenceInterval95: ConfidenceInterval95Dto = ConfidenceInterval95Dto(),
    val totalPnL: Double = 0.0,
    val expectancy: Double = 0.0,
    val maxDrawdown: Double = 0.0,
    val sampleStatus: String = "ADEQUATE_SAMPLE"
)

data class V2_3_FailureAnalysisRecordDto(
    val sessionId: String = "",
    val hypothesisId: String = "",
    val tradeId: String = "",
    val asset: String = "",
    val regime: String = "",
    val duration: String = "",
    val score: Int = 0,
    val indicatorConfirmations: List<String> = emptyList(),
    val volatility: String = "",
    val consecutiveLosses: Int = 0,
    val diagnosis: String = ""
)

data class V2_3_GateDecisionCriteriaDto(
    val multiSessionTested: Boolean = true,
    val noSafetyViolations: Boolean = true,
    val noLeakage: Boolean = true,
    val oosPositive: Boolean = true,
    val multiSessionConsistent: Boolean = true,
    val crossAssetConsistent: Boolean = true,
    val adequateSample: Boolean = true,
    val drawdownAcceptable: Boolean = true
)

data class V2_3_GateDecisionDto(
    val hypothesisId: String = "",
    val hypothesisName: String = "",
    val status: String = "READY_FOR_MANUAL_REVIEW",
    val criteriaChecks: V2_3_GateDecisionCriteriaDto = V2_3_GateDecisionCriteriaDto(),
    val decisionRationale: String = ""
)

data class V2_3_PromotionGateSummaryDto(
    val productionStrategyStatus: String = "",
    val gateDecisions: List<V2_3_GateDecisionDto> = emptyList(),
    val governanceRule: String = ""
)

data class V2_3_HypothesesDto(
    val hypothesisA: V2_3_HypothesisConsistencySummaryDto = V2_3_HypothesisConsistencySummaryDto(),
    val hypothesisB: V2_3_HypothesisConsistencySummaryDto = V2_3_HypothesisConsistencySummaryDto(),
    val hypothesisC: V2_3_HypothesisConsistencySummaryDto = V2_3_HypothesisConsistencySummaryDto()
)

data class V2_3_MultiSessionDashboardDto(
    val datasetMetadata: V2_3_DatasetMetadataDto = V2_3_DatasetMetadataDto(),
    val overview: V2_3_OverviewMetricsDto = V2_3_OverviewMetricsDto(),
    val sessionsList: List<V2_3_SessionMetricsDto> = emptyList(),
    val hypotheses: V2_3_HypothesesDto = V2_3_HypothesesDto(),
    val crossAssetAnalysis: Map<String, V2_3_CrossAssetSessionMetricsDto> = emptyMap(),
    val crossRegimeAnalysis: Map<String, V2_3_CrossRegimeSessionMetricsDto> = emptyMap(),
    val oosValidation: V2_2_OOSValidationDto = V2_2_OOSValidationDto(),
    val failureAnalysis: List<V2_3_FailureAnalysisRecordDto> = emptyList(),
    val promotionGateSummary: V2_3_PromotionGateSummaryDto = V2_3_PromotionGateSummaryDto(),
    val safetyStatus: Map<String, Any> = emptyMap(),
    val disclaimer: String = ""
)

data class V2_3_MultiSessionDashboardResponse(
    val success: Boolean,
    val multiSessionDashboard: V2_3_MultiSessionDashboardDto? = null,
    val error: String? = null,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)

// ==========================================
// STRATEGY V2.4: COMBINATION & ABLATION DTOs
// ==========================================

data class V2_4_VariantMetricsDto(
    val variantId: String = "",
    val label: String = "",
    val type: String = "CONTROL",
    val description: String = "",
    val activeHypotheses: List<String> = emptyList(),
    val totalObservations: Int = 0,
    val acceptedSignals: Int = 0,
    val rejectedSignals: Int = 0,
    val rejectionReasons: Map<String, Int> = emptyMap(),
    val tradesExecuted: Int = 0,
    val wins: Int = 0,
    val losses: Int = 0,
    val winRate: Double = 0.0,
    val confidenceInterval95: ConfidenceInterval95Dto = ConfidenceInterval95Dto(),
    val totalPnL: Double = 0.0,
    val averagePnL: Double = 0.0,
    val expectancy: Double = 0.0,
    val profitFactor: Double = 0.0,
    val maxDrawdown: Double = 0.0,
    val maxConsecutiveLosses: Int = 0,
    val waitPercentage: Double = 0.0,
    val averageTradeDuration: String = "",
    val medianTradeDuration: String = "",
    val sampleStatus: String = "ADEQUATE_SAMPLE",
    val promotionStatus: String = "READY_FOR_MANUAL_REVIEW",
    val promotionRationale: String = "",
    val disclaimer: String = ""
)

data class V2_4_AblationComparisonDto(
    val comparisonId: String = "",
    val title: String = "",
    val targetVariant: String = "",
    val referenceVariant: String = "",
    val ablatedComponent: String = "",
    val deltaWinRate: Double = 0.0,
    val deltaExpectancy: Double = 0.0,
    val deltaProfitFactor: Double = 0.0,
    val deltaPnL: Double = 0.0,
    val deltaDrawdown: Double = 0.0,
    val deltaConsecutiveLosses: Double = 0.0,
    val deltaTradeFrequency: Double = 0.0,
    val interpretation: String = "",
    val isContributionPositive: Boolean = true
)

data class V2_4_OptimalConfigDto(
    val variantId: String = "",
    val rationale: String = ""
)

data class V2_4_AblationAnalysisDto(
    val comparisons: List<V2_4_AblationComparisonDto> = emptyList(),
    val summaryFindings: List<String> = emptyList(),
    val optimalConfiguration: V2_4_OptimalConfigDto = V2_4_OptimalConfigDto()
)

data class V2_4_CrossAssetMetricsDto(
    val asset: String = "",
    val totalObservations: Int = 0,
    val tradesExecuted: Int = 0,
    val wins: Int = 0,
    val losses: Int = 0,
    val winRate: Double = 0.0,
    val confidenceInterval95: ConfidenceInterval95Dto = ConfidenceInterval95Dto(),
    val totalPnL: Double = 0.0,
    val expectancy: Double = 0.0,
    val maxDrawdown: Double = 0.0,
    val sampleStatus: String = "ADEQUATE_SAMPLE"
)

data class V2_4_CrossRegimeMetricsDto(
    val regime: String = "",
    val totalObservations: Int = 0,
    val tradesExecuted: Int = 0,
    val wins: Int = 0,
    val losses: Int = 0,
    val winRate: Double = 0.0,
    val confidenceInterval95: ConfidenceInterval95Dto = ConfidenceInterval95Dto(),
    val totalPnL: Double = 0.0,
    val expectancy: Double = 0.0,
    val maxDrawdown: Double = 0.0,
    val sampleStatus: String = "ADEQUATE_SAMPLE"
)

data class V2_4_SessionMetricsDto(
    val sessionId: String = "",
    val sessionIndex: Int = 0,
    val sessionDate: String = "",
    val totalObservations: Int = 0,
    val acceptedTrades: Int = 0,
    val rejectedSignals: Int = 0,
    val wins: Int = 0,
    val losses: Int = 0,
    val winRate: Double = 0.0,
    val totalPnL: Double = 0.0,
    val expectancy: Double = 0.0,
    val profitFactor: Double = 0.0,
    val maxDrawdown: Double = 0.0,
    val maxConsecutiveLosses: Int = 0,
    val sessionOutcome: String = "NEUTRAL",
    val degradationDetected: Boolean = false,
    val degradationReason: String? = null
)

data class V2_4_GateCriteriaChecksDto(
    val multiSessionTested: Boolean = true,
    val noSafetyViolations: Boolean = true,
    val noLeakage: Boolean = true,
    val oosPositive: Boolean = true,
    val adequateSample: Boolean = true,
    val drawdownAcceptable: Boolean = true,
    val consecutiveLossesAcceptable: Boolean = true,
    val expectancyPositive: Boolean = true
)

data class V2_4_GateDecisionDto(
    val variantId: String = "",
    val label: String = "",
    val status: String = "READY_FOR_MANUAL_REVIEW",
    val criteriaChecks: V2_4_GateCriteriaChecksDto = V2_4_GateCriteriaChecksDto(),
    val decisionRationale: String = ""
)

data class V2_4_PromotionGateSummaryDto(
    val productionStrategyStatus: String = "",
    val gateDecisions: List<V2_4_GateDecisionDto> = emptyList(),
    val governanceNotice: String = ""
)

data class V2_4_DatasetMetadataDto(
    val datasetId: String = "V2.4_COMBINATION_ABLATION",
    val totalObservations: Int = 0,
    val totalSessions: Int = 0,
    val startDate: String = "",
    val endDate: String = "",
    val assetsIncluded: List<String> = emptyList(),
    val regimesIncluded: List<String> = emptyList(),
    val disclaimer: String = ""
)

data class V2_4_OverviewMetricsDto(
    val totalSessions: Int = 0,
    val totalObservations: Int = 0,
    val totalVariants: Int = 0,
    val overallWinRate: Double = 0.0,
    val overallPnL: Double = 0.0,
    val overallExpectancy: Double = 0.0,
    val overallProfitFactor: Double = 0.0,
    val maxDrawdown: Double = 0.0,
    val maxConsecutiveLosses: Int = 0,
    val positiveSessionsCount: Int = 0,
    val negativeSessionsCount: Int = 0,
    val neutralSessionsCount: Int = 0
)

data class V2_4_OOSSplitDto(
    val period: String = "",
    val count: Int = 0,
    val winRate: Double = 0.0,
    val expectancy: Double = 0.0,
    val pnl: Double = 0.0
)

data class V2_4_LeakageVerificationDto(
    val lookaheadFree: Boolean = true,
    val parameterLeakageFree: Boolean = true,
    val regimeLeakageFree: Boolean = true,
    val duplicateSignalsFree: Boolean = true,
    val chronologicalOrderingPreserved: Boolean = true,
    val sessionAssignmentDeterministic: Boolean = true,
    val dataQualityChecksPassed: Boolean = true,
    val details: String = ""
)

data class V2_4_OOSValidationDto(
    val datasetSplits: Map<String, V2_4_OOSSplitDto> = emptyMap(),
    val leakageVerification: V2_4_LeakageVerificationDto = V2_4_LeakageVerificationDto(),
    val degradationRatio: Double = 0.0,
    val verdict: String = "OOS_VALIDATED"
)

data class V2_4_RobustnessVerificationDto(
    val lookaheadTestPassed: Boolean = true,
    val parameterLeakageTestPassed: Boolean = true,
    val regimeLeakageTestPassed: Boolean = true,
    val duplicateSignalTestPassed: Boolean = true,
    val chronologicalOrderingTestPassed: Boolean = true,
    val sessionAssignmentTestPassed: Boolean = true,
    val dataQualityTestPassed: Boolean = true,
    val details: String = ""
)

data class V2_4_SafetyStatusDto(
    val demoPaperOnly: Boolean = true,
    val dailyLossLimitEnforced: Boolean = true,
    val drawdownBreakerEnforced: Boolean = true,
    val consecutiveLossBreakerEnforced: Boolean = true,
    val activePositionLockActive: Boolean = true,
    val cooldownIntervalActive: Boolean = true,
    val duplicateSignalSuppressionActive: Boolean = true,
    val dataQualityGateActive: Boolean = true,
    val productionStrategyUnmodified: Boolean = true,
    val disclaimer: String = ""
)

data class V2_4_CombinationDashboardDto(
    val datasetMetadata: V2_4_DatasetMetadataDto = V2_4_DatasetMetadataDto(),
    val overview: V2_4_OverviewMetricsDto = V2_4_OverviewMetricsDto(),
    val variantMatrix: List<V2_4_VariantMetricsDto> = emptyList(),
    val ablationAnalysis: V2_4_AblationAnalysisDto = V2_4_AblationAnalysisDto(),
    val sessionsList: List<V2_4_SessionMetricsDto> = emptyList(),
    val crossAssetAnalysis: Map<String, V2_4_CrossAssetMetricsDto> = emptyMap(),
    val crossRegimeAnalysis: Map<String, V2_4_CrossRegimeMetricsDto> = emptyMap(),
    val oosValidation: V2_4_OOSValidationDto = V2_4_OOSValidationDto(),
    val robustnessVerification: V2_4_RobustnessVerificationDto = V2_4_RobustnessVerificationDto(),
    val promotionGateSummary: V2_4_PromotionGateSummaryDto = V2_4_PromotionGateSummaryDto(),
    val safetyStatus: V2_4_SafetyStatusDto = V2_4_SafetyStatusDto(),
    val disclaimer: String = ""
)

data class V2_4_CombinationDashboardResponse(
    val success: Boolean,
    val combinationDashboard: V2_4_CombinationDashboardDto? = null,
    val error: String? = null,
    val mode: String = "PAPER",
    val isRealMoney: Boolean = false,
    val brokerConnected: Boolean = false
)









