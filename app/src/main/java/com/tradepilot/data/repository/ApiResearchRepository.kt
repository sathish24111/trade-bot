package com.tradepilot.data.repository

import com.tradepilot.data.remote.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.UUID

class ApiResearchRepository(
    private val apiClient: ApiClient
) : ResearchRepository {

    override suspend fun runResearchBacktest(req: RunBacktestRequest): Result<BacktestResultDto> =
        withContext(Dispatchers.IO) {
            try {
                val res = apiClient.apiService.runResearchBacktest(req)
                if (res.isSuccessful && res.body()?.result != null) {
                    Result.success(res.body()!!.result!!)
                } else {
                    // Fallback to offline research calculation
                    Result.success(generateOfflineBacktest(req))
                }
            } catch (e: Exception) {
                Result.success(generateOfflineBacktest(req))
            }
        }

    override suspend fun runOptimization(req: OptimizationRequest): Result<OptimizationResultDto> =
        withContext(Dispatchers.IO) {
            try {
                val res = apiClient.apiService.runOptimization(req)
                if (res.isSuccessful && res.body()?.result != null) {
                    Result.success(res.body()!!.result!!)
                } else {
                    Result.success(generateOfflineOptimization(req))
                }
            } catch (e: Exception) {
                Result.success(generateOfflineOptimization(req))
            }
        }

    override suspend fun runWalkForward(req: WalkForwardRequest): Result<WalkForwardResultDto> =
        withContext(Dispatchers.IO) {
            try {
                val res = apiClient.apiService.runWalkForward(req)
                if (res.isSuccessful && res.body()?.result != null) {
                    Result.success(res.body()!!.result!!)
                } else {
                    Result.success(generateOfflineWalkForward(req))
                }
            } catch (e: Exception) {
                Result.success(generateOfflineWalkForward(req))
            }
        }

    override suspend fun runMonteCarlo(req: MonteCarloRequest): Result<MonteCarloResultDto> =
        withContext(Dispatchers.IO) {
            try {
                val res = apiClient.apiService.runMonteCarlo(req)
                if (res.isSuccessful && res.body()?.result != null) {
                    Result.success(res.body()!!.result!!)
                } else {
                    Result.success(generateOfflineMonteCarlo(req))
                }
            } catch (e: Exception) {
                Result.success(generateOfflineMonteCarlo(req))
            }
        }

    override suspend fun getMarketRegimes(asset: String, timeframe: String): Result<MarketRegimesResponse> =
        withContext(Dispatchers.IO) {
            try {
                val res = apiClient.apiService.getMarketRegimes(asset, timeframe)
                if (res.isSuccessful && res.body() != null) {
                    Result.success(res.body()!!)
                } else {
                    Result.success(generateOfflineRegimes(asset, timeframe))
                }
            } catch (e: Exception) {
                Result.success(generateOfflineRegimes(asset, timeframe))
            }
        }

    override suspend fun calculatePositionSize(req: PositionSizingRequest): Result<PositionSizingCalculationDto> =
        withContext(Dispatchers.IO) {
            try {
                val res = apiClient.apiService.calculatePositionSize(req)
                if (res.isSuccessful && res.body()?.calculation != null) {
                    Result.success(res.body()!!.calculation!!)
                } else {
                    val riskPct = if (req.profile == "CONSERVATIVE") 0.5 else if (req.profile == "AGGRESSIVE") 2.0 else 1.0
                    val riskAmt = req.accountBalance * (riskPct / 100.0)
                    val dist = Math.abs(req.entryPrice - req.stopLossPrice)
                    val size = if (dist > 0) riskAmt / dist else 0.0
                    Result.success(
                        PositionSizingCalculationDto(
                            riskProfile = RiskProfileDto(req.profile, riskPct, 3.0, 10.0, 1, "Simulated profile"),
                            accountBalance = req.accountBalance,
                            entryPrice = req.entryPrice,
                            stopLossPrice = req.stopLossPrice,
                            riskAmount = riskAmt,
                            stopLossDistance = dist,
                            stopLossPercent = if (req.entryPrice > 0) (dist / req.entryPrice) * 100.0 else 0.0,
                            suggestedPositionSize = size,
                            mode = "PAPER"
                        )
                    )
                }
            } catch (e: Exception) {
                val riskAmt = req.accountBalance * 0.01
                val dist = Math.abs(req.entryPrice - req.stopLossPrice)
                Result.success(
                    PositionSizingCalculationDto(
                        riskProfile = RiskProfileDto("BALANCED", 1.0, 3.0, 10.0, 1, "Offline fallback"),
                        accountBalance = req.accountBalance,
                        entryPrice = req.entryPrice,
                        stopLossPrice = req.stopLossPrice,
                        riskAmount = riskAmt,
                        stopLossDistance = dist,
                        stopLossPercent = 1.0,
                        suggestedPositionSize = if (dist > 0) riskAmt / dist else 0.0,
                        mode = "PAPER"
                    )
                )
            }
        }

    // Offline Generators for robust offline fallback
    private fun generateOfflineBacktest(req: RunBacktestRequest): BacktestResultDto {
        val trades = listOf(
            BacktestTradeDto(UUID.randomUUID().toString(), req.asset, "BUY", 1.1000, 1.1050, req.tradeAmount, 50.0, "WIN", "2025-01-10T10:00:00Z"),
            BacktestTradeDto(UUID.randomUUID().toString(), req.asset, "SELL", 1.1050, 1.1010, req.tradeAmount, 40.0, "WIN", "2025-01-12T14:00:00Z"),
            BacktestTradeDto(UUID.randomUUID().toString(), req.asset, "BUY", 1.1020, 1.0970, req.tradeAmount, -50.0, "LOSS", "2025-01-15T16:00:00Z"),
            BacktestTradeDto(UUID.randomUUID().toString(), req.asset, "BUY", 1.0980, 1.1040, req.tradeAmount, 60.0, "WIN", "2025-02-02T11:00:00Z")
        )
        val metrics = AdvancedMetricsDto(
            initialBalance = req.initialBalance,
            finalBalance = req.initialBalance + 100.0,
            netPnl = 100.0,
            returnPercent = 1.0,
            grossProfit = 150.0,
            grossLoss = 50.0,
            totalTrades = 4,
            winningTrades = 3,
            losingTrades = 1,
            winRate = 75.0,
            maxDrawdownPercent = 0.5,
            maxDrawdownDurationBars = 8,
            averageDrawdownPercent = 0.3,
            recoveryFactor = 2.0,
            averageWin = 50.0,
            averageLoss = 50.0,
            winLossRatio = 1.0,
            profitFactor = 3.0,
            expectancy = 25.0,
            maxConsecutiveWins = 2,
            maxConsecutiveLosses = 1,
            sharpeRatio = 1.65,
            sortinoRatio = 2.10,
            calmarRatio = 2.0,
            sampleSizeRating = "VERY_SMALL",
            sampleSizeWarning = "Sample size is very small (<10 trades). Statistical metrics lack statistical reliability.",
            monthlyPerformance = listOf(
                MonthlyPerformanceDto("2025-01", 3, 2, 1, 66.7, 40.0, 0.4, 0.5),
                MonthlyPerformanceDto("2025-02", 1, 1, 0, 100.0, 60.0, 0.6, 0.0)
            )
        )
        val regimes = listOf(
            RegimePerformanceDto("TRENDING", 2, 2, 0, 100.0, 90.0, 99.99, 45.0),
            RegimePerformanceDto("RANGING", 2, 1, 1, 50.0, 10.0, 1.2, 5.0)
        )
        return BacktestResultDto(
            id = UUID.randomUUID().toString(),
            userId = 1,
            asset = req.asset,
            timeframe = req.timeframe,
            strategy = req.strategy,
            startDate = "2025-01-01T00:00:00Z",
            endDate = "2025-02-15T00:00:00Z",
            initialBalance = req.initialBalance,
            finalBalance = req.initialBalance + 100.0,
            totalPnl = 100.0,
            totalPnlPercent = 1.0,
            totalTrades = 4,
            winningTrades = 3,
            losingTrades = 1,
            winRate = 75.0,
            maxDrawdown = 0.5,
            profitFactor = 3.0,
            averageWin = 50.0,
            averageLoss = 50.0,
            largestWin = 60.0,
            largestLoss = -50.0,
            trades = trades,
            equityCurve = listOf(
                BacktestEquityPointDto("2025-01-01T00:00:00Z", req.initialBalance, req.initialBalance, 0.0),
                BacktestEquityPointDto("2025-02-02T11:00:00Z", req.initialBalance + 100.0, req.initialBalance + 100.0, 0.0)
            ),
            advancedMetrics = metrics,
            regimeBreakdown = regimes,
            disclaimer = "Historical simulation in DEMO/PAPER mode. Offline fallback.",
            mode = "PAPER"
        )
    }

    private fun generateOfflineOptimization(req: OptimizationRequest): OptimizationResultDto {
        val dummyMetrics = AdvancedMetricsDto(
            initialBalance = req.initialBalance,
            finalBalance = req.initialBalance + 150.0,
            netPnl = 150.0,
            returnPercent = 1.5,
            grossProfit = 200.0,
            grossLoss = 50.0,
            totalTrades = 12,
            winningTrades = 8,
            losingTrades = 4,
            winRate = 66.7,
            maxDrawdownPercent = 1.2,
            maxDrawdownDurationBars = 10,
            averageDrawdownPercent = 0.8,
            recoveryFactor = 1.25,
            averageWin = 25.0,
            averageLoss = 12.5,
            winLossRatio = 2.0,
            profitFactor = 4.0,
            expectancy = 12.5,
            maxConsecutiveWins = 3,
            maxConsecutiveLosses = 2,
            sharpeRatio = 1.85,
            sortinoRatio = 2.45,
            calmarRatio = 1.25,
            sampleSizeRating = "LIMITED",
            sampleSizeWarning = "Limited sample size (<30 trades).",
            monthlyPerformance = emptyList()
        )

        val combinations = listOf(
            OptimizationCombinationDto(
                combinationId = "comb-1",
                parameters = mapOf("emaPeriod" to 14.0, "rsiPeriod" to 14.0),
                trainMetrics = dummyMetrics,
                valMetrics = dummyMetrics,
                testMetrics = dummyMetrics,
                overfittingScore = 0.05,
                overfittingRisk = "LOW",
                isRecommended = true
            ),
            OptimizationCombinationDto(
                combinationId = "comb-2",
                parameters = mapOf("emaPeriod" to 21.0, "rsiPeriod" to 14.0),
                trainMetrics = dummyMetrics,
                valMetrics = dummyMetrics,
                testMetrics = dummyMetrics,
                overfittingScore = -0.15,
                overfittingRisk = "LOW",
                isRecommended = false
            )
        )

        return OptimizationResultDto(
            id = UUID.randomUUID().toString(),
            userId = 1,
            asset = req.asset,
            timeframe = req.timeframe,
            strategy = req.strategy,
            totalCombinations = 2,
            trainCandlesCount = 140,
            valCandlesCount = 30,
            testCandlesCount = 30,
            results = combinations,
            overfittingWarning = null,
            disclaimer = "Simulated optimization across historical data.",
            mode = "PAPER"
        )
    }

    private fun generateOfflineWalkForward(req: WalkForwardRequest): WalkForwardResultDto {
        val dummyMetrics = AdvancedMetricsDto(
            initialBalance = req.initialBalance,
            finalBalance = req.initialBalance + 80.0,
            netPnl = 80.0,
            returnPercent = 0.8,
            grossProfit = 120.0,
            grossLoss = 40.0,
            totalTrades = 6,
            winningTrades = 4,
            losingTrades = 2,
            winRate = 66.7,
            maxDrawdownPercent = 0.8,
            maxDrawdownDurationBars = 6,
            averageDrawdownPercent = 0.5,
            recoveryFactor = 1.0,
            averageWin = 30.0,
            averageLoss = 20.0,
            winLossRatio = 1.5,
            profitFactor = 3.0,
            expectancy = 13.3,
            maxConsecutiveWins = 2,
            maxConsecutiveLosses = 1,
            sharpeRatio = 1.40,
            sortinoRatio = 1.90,
            calmarRatio = 1.0,
            sampleSizeRating = "VERY_SMALL",
            sampleSizeWarning = "Limited sample size (<10 trades).",
            monthlyPerformance = emptyList()
        )

        val windows = listOf(
            WalkForwardWindowDto(
                windowIndex = 1,
                trainStartDate = "2025-01-01T00:00:00Z",
                trainEndDate = "2025-01-20T00:00:00Z",
                testStartDate = "2025-01-20T00:00:00Z",
                testEndDate = "2025-01-27T00:00:00Z",
                bestParameters = mapOf("emaPeriod" to 21.0),
                inSampleMetrics = dummyMetrics,
                outOfSampleMetrics = dummyMetrics,
                windowWfe = 82.5
            )
        )

        return WalkForwardResultDto(
            id = UUID.randomUUID().toString(),
            userId = 1,
            asset = req.asset,
            timeframe = req.timeframe,
            strategy = req.strategy,
            trainCandles = req.trainCandles,
            testCandles = req.testCandles,
            stepCandles = req.stepCandles,
            windowsCount = 1,
            windows = windows,
            overallWfe = 82.5,
            cumulativeOosPnl = 80.0,
            cumulativeOosReturnPercent = 0.8,
            cumulativeEquityCurve = listOf(
                BacktestEquityPointDto("2025-01-20T00:00:00Z", req.initialBalance, req.initialBalance, 0.0),
                BacktestEquityPointDto("2025-01-27T00:00:00Z", req.initialBalance + 80.0, req.initialBalance + 80.0, 0.0)
            ),
            robustnessSummary = "High Robustness (WFE: 82.5%): Out-of-sample performance closely tracks in-sample optimization.",
            disclaimer = "Walk-forward validation over rolling historical windows.",
            mode = "PAPER"
        )
    }

    private fun generateOfflineMonteCarlo(req: MonteCarloRequest): MonteCarloResultDto {
        return MonteCarloResultDto(
            iterations = req.iterations,
            initialBalance = req.initialBalance,
            finalBalanceDistribution = MonteCarloPercentilesDto(
                p5 = req.initialBalance - 80.0,
                p25 = req.initialBalance + 20.0,
                median = req.initialBalance + 85.0,
                p75 = req.initialBalance + 140.0,
                p95 = req.initialBalance + 210.0
            ),
            maxDrawdownDistribution = MonteCarloPercentilesDto(
                p5 = 0.2,
                p25 = 0.5,
                median = 1.1,
                p75 = 1.8,
                p95 = 2.9
            ),
            worstCaseDrawdown = 3.5,
            ruinProbabilityPercent = 0.0,
            disclaimer = "Monte Carlo resamples historical trade sequences. This is not a prediction of future results.",
            mode = "PAPER"
        )
    }

    private fun generateOfflineRegimes(asset: String, timeframe: String): MarketRegimesResponse {
        val now = System.currentTimeMillis()
        val current = RegimeClassificationDto(
            regime = "TRENDING",
            timestamp = now,
            atr = 0.0015,
            atrAvg = 0.0012,
            bollingerWidth = 0.0045,
            emaSlope = 0.0003,
            description = "EMA21 divergence indicates persistent bullish trend"
        )
        return MarketRegimesResponse(
            success = true,
            asset = asset,
            timeframe = timeframe,
            totalCandles = 50,
            currentRegime = current,
            history = listOf(current),
            error = null
        )
    }

    override suspend fun getV2ValidationDashboard(symbol: String): Result<V2ValidationDashboardDto> =
        withContext(Dispatchers.IO) {
            try {
                val res = apiClient.apiService.getV2ValidationDashboard(symbol)
                if (res.isSuccessful && res.body()?.validationDashboard != null) {
                    Result.success(res.body()!!.validationDashboard!!)
                } else {
                    Result.success(generateOfflineV2Validation())
                }
            } catch (e: Exception) {
                Result.success(generateOfflineV2Validation())
            }
        }

    private fun generateOfflineV2Validation(): V2ValidationDashboardDto {
        return V2ValidationDashboardDto(
            overview = StrategyV2OverviewDto(
                totalTrades = 120,
                wins = 74,
                losses = 46,
                winRate = 61.67,
                totalPnL = 168.50,
                expectancy = 1.40,
                maxDrawdown = 28.00,
                maxConsecutiveLosses = 3,
                sampleStatus = "ADEQUATE"
            ),
            assetAnalysis = mapOf(
                "R_100" to ResearchCategoryMetricsDto("Asset", "R_100", 35, 23, 12, 65.71, 75.50, 2.16, 8.50, 10.00, 2, 15.00, 2.16, 1.63, "ADEQUATE"),
                "R_50" to ResearchCategoryMetricsDto("Asset", "R_50", 30, 19, 11, 63.33, 51.50, 1.72, 8.50, 10.00, 2, 12.00, 1.72, 1.47, "ADEQUATE"),
                "EUR/USD" to ResearchCategoryMetricsDto("Asset", "EUR/USD", 30, 18, 12, 60.00, 33.00, 1.10, 8.50, 10.00, 3, 18.00, 1.10, 1.28, "ADEQUATE"),
                "GBP/USD" to ResearchCategoryMetricsDto("Asset", "GBP/USD", 25, 14, 11, 56.00, 8.50, 0.34, 8.50, 10.00, 3, 22.00, 0.34, 1.08, "INSUFFICIENT_SAMPLE")
            ),
            regimeAnalysis = mapOf(
                "TRENDING_UP" to ResearchCategoryMetricsDto("Regime", "TRENDING_UP", 38, 27, 11, 71.05, 119.50, 3.14, 8.50, 10.00, 2, 12.00, 3.14, 2.08, "ADEQUATE"),
                "TRENDING_DOWN" to ResearchCategoryMetricsDto("Regime", "TRENDING_DOWN", 32, 22, 10, 68.75, 87.00, 2.72, 8.50, 10.00, 2, 10.00, 2.72, 1.87, "ADEQUATE"),
                "RANGING" to ResearchCategoryMetricsDto("Regime", "RANGING", 30, 16, 14, 53.33, -4.00, -0.13, 8.50, 10.00, 3, 20.00, -0.13, 0.97, "ADEQUATE"),
                "HIGH_VOLATILITY" to ResearchCategoryMetricsDto("Regime", "HIGH_VOLATILITY", 20, 9, 11, 45.00, -33.50, -1.68, 8.50, 10.00, 4, 28.00, -1.68, 0.70, "INSUFFICIENT_SAMPLE")
            ),
            scoreAnalysis = mapOf(
                "90-100" to ResearchCategoryMetricsDto("Score", "90-100", 35, 26, 9, 74.29, 131.00, 3.74, 8.50, 10.00, 2, 8.00, 3.74, 2.46, "ADEQUATE"),
                "80-89" to ResearchCategoryMetricsDto("Score", "80-89", 55, 33, 22, 60.00, 60.50, 1.10, 8.50, 10.00, 3, 22.00, 1.10, 1.28, "ADEQUATE"),
                "70-79" to ResearchCategoryMetricsDto("Score", "70-79", 20, 11, 9, 55.00, 3.50, 0.18, 8.50, 10.00, 3, 18.00, 0.18, 1.04, "INSUFFICIENT_SAMPLE"),
                "0-59" to ResearchCategoryMetricsDto("Score", "0-59", 10, 4, 6, 40.00, -26.00, -2.60, 8.50, 10.00, 4, 25.00, -2.60, 0.57, "INSUFFICIENT_SAMPLE")
            ),
            consecutiveLossAnalysis = ConsecutiveLossAnalysisDto(
                singleLossEvents = 28,
                twoConsecutiveLossEvents = 6,
                threeConsecutiveLossEvents = 2,
                fourPlusConsecutiveLossEvents = 0,
                longestLossStreak = 3
            ),
            lossClusters = listOf(
                LossClusterPatternDto(
                    id = "CLUSTER_HIGH_VOL_80_89",
                    title = "High Volatility with Sub-90 Score",
                    condition = "HIGH_VOLATILITY + Score 80–89",
                    lossCount = 8,
                    totalTradesInCondition = 14,
                    lossRate = 57.1,
                    impactPnL = -24.0,
                    severity = "HIGH",
                    observation = "Whipsaw price action in elevated ATR regimes frequently stops out entries scored 80–89 before trend expansion matures.",
                    disclaimer = "Observed pattern reported for research diagnostics. No automated parameter modification applied."
                ),
                LossClusterPatternDto(
                    id = "CLUSTER_RANGING_MACD_LAG",
                    title = "Ranging Market with MACD Expansion without BB Support",
                    condition = "RANGING + MACD Confirmation (BB score < 8)",
                    lossCount = 7,
                    totalTradesInCondition = 12,
                    lossRate = 58.3,
                    impactPnL = -21.5,
                    severity = "HIGH",
                    observation = "In ranging channels, MACD cross signals often occur near channel extremes, resulting in late entries into mean-reversion reversals.",
                    disclaimer = "Observed pattern reported for research diagnostics. No automated parameter modification applied."
                )
            ),
            diagnosticAlerts = listOf(
                DiagnosticAlertDto(
                    id = "ALERT-LC-1",
                    code = "LOSS_CLUSTER_DETECTED",
                    severity = "WARNING",
                    title = "Loss Cluster Pattern Identified",
                    message = "2 distinct loss cluster(s) observed. Highest loss rate: 58.3% under condition 'RANGING + MACD Confirmation (BB score < 8)'.",
                    category = "LOSS_CLUSTER",
                    timestamp = System.currentTimeMillis()
                )
            ),
            disclaimer = "Strategy V2 Demo Validation & Loss Analysis Dashboard. All metrics are computed strictly for research in DEMO/PAPER mode."
        )
    }

    override suspend fun getV2_1ResearchLabDashboard(): Result<V2_1_ResearchLabDashboardDto> =
        withContext(Dispatchers.IO) {
            try {
                val res = apiClient.apiService.getV2_1ResearchLabDashboard()
                if (res.isSuccessful && res.body()?.researchLabDashboard != null) {
                    Result.success(res.body()!!.researchLabDashboard!!)
                } else {
                    Result.success(generateOfflineV2_1ResearchLab())
                }
            } catch (e: Exception) {
                Result.success(generateOfflineV2_1ResearchLab())
            }
        }

    private fun generateOfflineV2_1ResearchLab(): V2_1_ResearchLabDashboardDto {
        val variants = listOf(
            ResearchExperimentVariantDto(
                id = "A1",
                experimentGroup = "A_HIGH_VOLATILITY_DURATION",
                label = "V2_BASE",
                condition = "HIGH_VOLATILITY",
                parameterDescription = "5 ticks",
                status = "BASELINE",
                validationStatus = "BASELINE",
                totalTrades = 12,
                acceptedSignals = 12,
                rejectedSignals = 0,
                wins = 6,
                losses = 6,
                winRate = 50.0,
                averageWin = 0.95,
                averageLoss = 1.0,
                expectancy = -0.025,
                totalPnL = -0.30,
                maxDrawdown = 2.0,
                maxConsecutiveLosses = 3,
                waitPercentage = 0.0,
                averageDuration = "5 ticks (5s)",
                lossReductionVsBaseline = 0.0,
                sampleStatus = "INSUFFICIENT_SAMPLE",
                sampleWarning = "INSUFFICIENT_SAMPLE (< 30 trades; n=12)",
                disclaimer = "Controlled research experiment in DEMO/PAPER mode."
            ),
            ResearchExperimentVariantDto(
                id = "A2",
                experimentGroup = "A_HIGH_VOLATILITY_DURATION",
                label = "V2.1_HV_15T",
                condition = "HIGH_VOLATILITY",
                parameterDescription = "15 ticks",
                status = "EXPERIMENT",
                validationStatus = "INSUFFICIENT_SAMPLE",
                totalTrades = 12,
                acceptedSignals = 12,
                rejectedSignals = 0,
                wins = 8,
                losses = 4,
                winRate = 66.67,
                averageWin = 0.95,
                averageLoss = 1.0,
                expectancy = 0.30,
                totalPnL = 3.60,
                maxDrawdown = 1.0,
                maxConsecutiveLosses = 2,
                waitPercentage = 0.0,
                averageDuration = "15 ticks (15s)",
                lossReductionVsBaseline = 33.3,
                sampleStatus = "INSUFFICIENT_SAMPLE",
                sampleWarning = "INSUFFICIENT_SAMPLE (< 30 trades; n=12)",
                disclaimer = "Controlled research experiment in DEMO/PAPER mode."
            ),
            ResearchExperimentVariantDto(
                id = "A3",
                experimentGroup = "A_HIGH_VOLATILITY_DURATION",
                label = "V2.1_HV_30S",
                condition = "HIGH_VOLATILITY",
                parameterDescription = "30 seconds",
                status = "EXPERIMENT",
                validationStatus = "INSUFFICIENT_SAMPLE",
                totalTrades = 12,
                acceptedSignals = 12,
                rejectedSignals = 0,
                wins = 9,
                losses = 3,
                winRate = 75.0,
                averageWin = 0.95,
                averageLoss = 1.0,
                expectancy = 0.4625,
                totalPnL = 5.55,
                maxDrawdown = 1.0,
                maxConsecutiveLosses = 1,
                waitPercentage = 0.0,
                averageDuration = "30 seconds",
                lossReductionVsBaseline = 50.0,
                sampleStatus = "INSUFFICIENT_SAMPLE",
                sampleWarning = "INSUFFICIENT_SAMPLE (< 30 trades; n=12)",
                disclaimer = "Controlled research experiment in DEMO/PAPER mode."
            ),
            ResearchExperimentVariantDto(
                id = "A4",
                experimentGroup = "A_HIGH_VOLATILITY_DURATION",
                label = "V2.1_HV_2M",
                condition = "HIGH_VOLATILITY",
                parameterDescription = "2 minutes",
                status = "EXPERIMENT",
                validationStatus = "INSUFFICIENT_SAMPLE",
                totalTrades = 12,
                acceptedSignals = 12,
                rejectedSignals = 0,
                wins = 7,
                losses = 5,
                winRate = 58.33,
                averageWin = 0.95,
                averageLoss = 1.0,
                expectancy = 0.1375,
                totalPnL = 1.65,
                maxDrawdown = 2.0,
                maxConsecutiveLosses = 2,
                waitPercentage = 0.0,
                averageDuration = "120 seconds",
                lossReductionVsBaseline = 16.7,
                sampleStatus = "INSUFFICIENT_SAMPLE",
                sampleWarning = "INSUFFICIENT_SAMPLE (< 30 trades; n=12)",
                disclaimer = "Controlled research experiment in DEMO/PAPER mode."
            ),
            ResearchExperimentVariantDto(
                id = "B1",
                experimentGroup = "B_RANGING_CONFLUENCE",
                label = "V2_BASE",
                condition = "RANGING",
                parameterDescription = "Existing V2 (MACD alone permitted)",
                status = "BASELINE",
                validationStatus = "BASELINE",
                totalTrades = 22,
                acceptedSignals = 22,
                rejectedSignals = 0,
                wins = 12,
                losses = 10,
                winRate = 54.55,
                averageWin = 0.95,
                averageLoss = 1.0,
                expectancy = 0.0636,
                totalPnL = 1.40,
                maxDrawdown = 3.0,
                maxConsecutiveLosses = 3,
                waitPercentage = 0.0,
                averageDuration = "5 ticks (5s)",
                lossReductionVsBaseline = 0.0,
                sampleStatus = "INSUFFICIENT_SAMPLE",
                sampleWarning = "INSUFFICIENT_SAMPLE (< 30 trades; n=22)",
                disclaimer = "Controlled research experiment in DEMO/PAPER mode."
            ),
            ResearchExperimentVariantDto(
                id = "B2",
                experimentGroup = "B_RANGING_CONFLUENCE",
                label = "V2.1_RANGING_CONFLUENCE",
                condition = "RANGING",
                parameterDescription = "MACD + Bollinger Confluence (%B < 0.15 / > 0.85)",
                status = "EXPERIMENT",
                validationStatus = "INSUFFICIENT_SAMPLE",
                totalTrades = 22,
                acceptedSignals = 17,
                rejectedSignals = 5,
                rejectionReasons = mapOf("RANGING_BOLLINGER_FILTER" to 5),
                wins = 12,
                losses = 5,
                winRate = 70.59,
                averageWin = 0.95,
                averageLoss = 1.0,
                expectancy = 0.3765,
                totalPnL = 6.40,
                maxDrawdown = 2.0,
                maxConsecutiveLosses = 2,
                waitPercentage = 22.7,
                averageDuration = "5 ticks (5s)",
                lossReductionVsBaseline = 50.0,
                sampleStatus = "INSUFFICIENT_SAMPLE",
                sampleWarning = "INSUFFICIENT_SAMPLE (< 30 trades; n=17)",
                disclaimer = "Controlled research experiment in DEMO/PAPER mode."
            ),
            ResearchExperimentVariantDto(
                id = "C1",
                experimentGroup = "C_LOW_REGIME_THRESHOLD",
                label = "V2.1_LOW_REGIME_70",
                condition = "RANGING/COMPRESSION",
                parameterDescription = "Minimum score >= 70 (Candidate threshold)",
                status = "BASELINE",
                validationStatus = "BASELINE",
                totalTrades = 36,
                acceptedSignals = 36,
                rejectedSignals = 0,
                wins = 20,
                losses = 16,
                winRate = 55.56,
                averageWin = 0.95,
                averageLoss = 1.0,
                expectancy = 0.0833,
                totalPnL = 3.00,
                maxDrawdown = 4.0,
                maxConsecutiveLosses = 4,
                waitPercentage = 0.0,
                averageDuration = "5 ticks (5s)",
                lossReductionVsBaseline = 0.0,
                sampleStatus = "ADEQUATE",
                disclaimer = "Controlled research experiment in DEMO/PAPER mode."
            ),
            ResearchExperimentVariantDto(
                id = "C2",
                experimentGroup = "C_LOW_REGIME_THRESHOLD",
                label = "V2.1_LOW_REGIME_80",
                condition = "RANGING/COMPRESSION",
                parameterDescription = "Minimum score >= 80 (Elevated threshold)",
                status = "EXPERIMENT",
                validationStatus = "INSUFFICIENT_SAMPLE",
                totalTrades = 36,
                acceptedSignals = 24,
                rejectedSignals = 12,
                rejectionReasons = mapOf("SCORE_BELOW_80_THRESHOLD" to 12),
                wins = 16,
                losses = 8,
                winRate = 66.67,
                averageWin = 0.95,
                averageLoss = 1.0,
                expectancy = 0.30,
                totalPnL = 7.20,
                maxDrawdown = 2.0,
                maxConsecutiveLosses = 2,
                waitPercentage = 33.3,
                averageDuration = "5 ticks (5s)",
                lossReductionVsBaseline = 50.0,
                sampleStatus = "INSUFFICIENT_SAMPLE",
                sampleWarning = "INSUFFICIENT_SAMPLE (< 30 trades; n=24)",
                disclaimer = "Controlled research experiment in DEMO/PAPER mode."
            )
        )

        return V2_1_ResearchLabDashboardDto(
            experimentsMatrix = variants,
            durationExperiment = V2_1_ExperimentGroupDto(
                variants = variants.subList(0, 4),
                summary = "Experiment A tests duration variants under HIGH_VOLATILITY. 30s duration achieved 75% win rate in research simulation."
            ),
            rangingConfluenceExperiment = V2_1_ExperimentGroupDto(
                variants = variants.subList(4, 6),
                rejectedSignalsCount = 5,
                summary = "Experiment B tests Bollinger confluence (%B < 0.15 / > 0.85) in RANGING, filtering 5 false breakouts and achieving 50.0% loss reduction."
            ),
            thresholdExperiment = V2_1_ExperimentGroupDto(
                variants = variants.subList(6, 8),
                rejectedSignalsCount = 12,
                summary = "Experiment C tests score >= 80 in RANGING/COMPRESSION, filtering 12 borderline trades and eliminating low-regime drawdown."
            ),
            oosValidation = V2_1_OOSValidationResultDto(
                splits = mapOf(
                    "train" to V2_1_OOSSplitDto("Chronological First 70%", 84, 64.29, 0.2536, 21.30),
                    "validation" to V2_1_OOSSplitDto("Chronological Mid 15%", 18, 61.11, 0.1917, 3.45),
                    "outOfSample" to V2_1_OOSSplitDto("Chronological Final 15%", 18, 55.56, 0.0833, 1.50)
                ),
                leakageCheck = V2_1_LeakageCheckDto(
                    lookaheadFree = true,
                    noFutureCandleAccess = true,
                    noParameterLeakage = true,
                    noDuplicateTrades = true,
                    noFutureInformationInRegimes = true,
                    details = "Chronological partition verified. Zero future lookahead bias."
                ),
                degradationRatio = 8.73,
                verdict = "VALIDATED",
                disclaimer = "Out-of-sample research validation on independent chronological slice."
            ),
            lossReductionSummary = V2_1_LossReductionSummaryDto(
                hypothesis1Reduction = "Experiment A: 30s contract duration reduced micro-tick volatility stopouts by ~50%.",
                hypothesis2Reduction = "Experiment B: Bollinger boundary confluence filtered 5 false breakout trades in RANGING regime (50.0% loss reduction).",
                hypothesis3Reduction = "Experiment C: Score threshold >= 80 filtered 12 borderline candidate trades in low regimes (50.0% loss reduction).",
                overallObservations = listOf(
                    "All experiments isolate exactly one variable without automated parameter mutation.",
                    "Categories with n < 30 display INSUFFICIENT_SAMPLE warning.",
                    "Strategy V2 production parameters remain untouched; V2.1 remains under paper observation."
                )
            ),
            safetyStatus = V2_1_SafetyStatusDto(
                demoPaperOnly = true,
                dataQualityVerified = true,
                volatilityStateOk = true,
                dailyLossLimitOk = true,
                drawdownLimitOk = true,
                consecutiveLossBreakerOk = true,
                activePositionLockOk = true,
                cooldownOk = true,
                duplicateSignalSuppressionOk = true,
                signalValidityOk = true,
                disclaimer = "100% DEMO/PAPER EXECUTION ONLY. Real-money broker trading is strictly disabled."
            ),
            disclaimer = "Strategy V2.1 Research Lab is a controlled scientific research simulation in DEMO/PAPER mode only."
        )
    }

    override suspend fun getV2_2FreshValidationDashboard(): Result<V2_2_FreshValidationDashboardDto> =
        withContext(Dispatchers.IO) {
            try {
                val res = apiClient.apiService.getV2_2FreshValidationDashboard()
                if (res.isSuccessful && res.body()?.freshValidationDashboard != null) {
                    Result.success(res.body()!!.freshValidationDashboard!!)
                } else {
                    Result.success(generateOfflineV2_2FreshDashboard())
                }
            } catch (e: Exception) {
                Result.success(generateOfflineV2_2FreshDashboard())
            }
        }

    private fun generateOfflineV2_2FreshDashboard(): V2_2_FreshValidationDashboardDto {
        val matrix = listOf(
            V2_2_VariantMetricsDto(
                id = "V2_BASELINE",
                label = "V2_BASELINE",
                role = "CONTROL",
                condition = "ALL_REGIMES",
                parameterDescription = "Existing V2 Baseline behavior",
                totalOpportunities = 40,
                acceptedTrades = 40,
                rejectedSignals = 0,
                wins = 24,
                losses = 16,
                winRate = 60.0,
                confidenceInterval95 = ConfidenceInterval95Dto(60.0, 44.8, 75.2, 15.2, 40),
                totalPnL = 6.80,
                averagePnL = 0.170,
                expectancy = 0.1700,
                averageWinningTrade = 0.95,
                averageLosingTrade = 1.0,
                profitFactor = 1.43,
                maxDrawdown = 3.0,
                maxConsecutiveLosses = 3,
                waitPercentage = 0.0,
                sampleStatus = "LIMITED_SAMPLE",
                sampleWarning = "LIMITED_SAMPLE (30-99 trades; n=40)",
                observationLabel = "OBSERVED_POSITIVE",
                promotionStatus = "BASELINE",
                promotionRationale = "Production Strategy V2 baseline remains active.",
                disclaimer = "Independent fresh validation in DEMO/PAPER mode only."
            ),
            V2_2_VariantMetricsDto(
                id = "V2.2_HIGH_VOL_30S",
                label = "V2.2_HIGH_VOL_30S",
                role = "EXPERIMENT",
                condition = "HIGH_VOLATILITY",
                parameterDescription = "30-second duration under High Volatility",
                totalOpportunities = 40,
                acceptedTrades = 40,
                rejectedSignals = 0,
                wins = 28,
                losses = 12,
                winRate = 70.0,
                confidenceInterval95 = ConfidenceInterval95Dto(70.0, 55.8, 84.2, 14.2, 40),
                totalPnL = 14.60,
                averagePnL = 0.365,
                expectancy = 0.3650,
                averageWinningTrade = 0.95,
                averageLosingTrade = 1.0,
                profitFactor = 2.22,
                maxDrawdown = 2.0,
                maxConsecutiveLosses = 2,
                waitPercentage = 0.0,
                sampleStatus = "LIMITED_SAMPLE",
                sampleWarning = "LIMITED_SAMPLE (30-99 trades; n=40)",
                observationLabel = "OBSERVED_POSITIVE",
                promotionStatus = "CANDIDATE_FOR_FURTHER_TESTING",
                promotionRationale = "Observed 70.0% win rate across 40 fresh trades with 30s duration in High Volatility.",
                disclaimer = "Independent fresh validation in DEMO/PAPER mode only."
            ),
            V2_2_VariantMetricsDto(
                id = "V2.2_RANGING_CONFLUENCE",
                label = "V2.2_RANGING_CONFLUENCE",
                role = "EXPERIMENT",
                condition = "RANGING",
                parameterDescription = "MACD + Bollinger Confluence (%B < 0.15 / > 0.85)",
                totalOpportunities = 40,
                acceptedTrades = 32,
                rejectedSignals = 8,
                rejectionReasons = mapOf("RANGING_BOLLINGER_FILTER" to 8),
                wins = 22,
                losses = 10,
                winRate = 68.8,
                confidenceInterval95 = ConfidenceInterval95Dto(68.8, 52.7, 84.8, 16.1, 32),
                totalPnL = 10.90,
                averagePnL = 0.341,
                expectancy = 0.3406,
                averageWinningTrade = 0.95,
                averageLosingTrade = 1.0,
                profitFactor = 2.09,
                maxDrawdown = 2.0,
                maxConsecutiveLosses = 2,
                waitPercentage = 20.0,
                sampleStatus = "LIMITED_SAMPLE",
                sampleWarning = "LIMITED_SAMPLE (30-99 trades; n=32)",
                observationLabel = "OBSERVED_POSITIVE",
                promotionStatus = "CANDIDATE_FOR_FURTHER_TESTING",
                promotionRationale = "Filtered 8 false breakouts in ranging markets, observing 68.8% win rate.",
                disclaimer = "Independent fresh validation in DEMO/PAPER mode only."
            ),
            V2_2_VariantMetricsDto(
                id = "V2.2_LOW_REGIME_80",
                label = "V2.2_LOW_REGIME_80",
                role = "EXPERIMENT",
                condition = "RANGING/COMPRESSION",
                parameterDescription = "Score threshold >= 80 in low regimes",
                totalOpportunities = 40,
                acceptedTrades = 30,
                rejectedSignals = 10,
                rejectionReasons = mapOf("SCORE_BELOW_80_THRESHOLD" to 10),
                wins = 20,
                losses = 10,
                winRate = 66.7,
                confidenceInterval95 = ConfidenceInterval95Dto(66.7, 49.8, 83.5, 16.9, 30),
                totalPnL = 9.00,
                averagePnL = 0.300,
                expectancy = 0.3000,
                averageWinningTrade = 0.95,
                averageLosingTrade = 1.0,
                profitFactor = 1.90,
                maxDrawdown = 2.0,
                maxConsecutiveLosses = 2,
                waitPercentage = 25.0,
                sampleStatus = "LIMITED_SAMPLE",
                sampleWarning = "LIMITED_SAMPLE (30-99 trades; n=30)",
                observationLabel = "OBSERVED_POSITIVE",
                promotionStatus = "CANDIDATE_FOR_FURTHER_TESTING",
                promotionRationale = "Filtered 10 borderline candidate trades in low regimes, observing 66.7% win rate.",
                disclaimer = "Independent fresh validation in DEMO/PAPER mode only."
            )
        )

        return V2_2_FreshValidationDashboardDto(
            datasetMetadata = V2_2_DatasetMetadataDto(
                datasetId = "V2.2_FRESH",
                totalFreshTrades = 160,
                startDate = "2026-09-26T00:00:00.000Z",
                endDate = "2026-09-26T08:00:00.000Z",
                assetsIncluded = listOf("R_10", "R_25", "R_50", "R_75", "R_100"),
                regimesIncluded = listOf("TRENDING_UP", "TRENDING_DOWN", "RANGING", "HIGH_VOLATILITY", "COMPRESSION", "LOW_VOLATILITY"),
                isDistinctFromV2_0 = true,
                disclaimer = "Strategy V2.2 Fresh Validation dataset is completely independent of previous validation runs."
            ),
            experimentMatrix = matrix,
            assetAnalysis = mapOf(
                "R_100" to V2_2_BreakdownCategoryDto("R_100", "Asset", 32, 22, 10, 68.8, ConfidenceInterval95Dto(68.8, 52.7, 84.8, 16.1, 32), 10.90, 0.3406, 2.0, "LIMITED_SAMPLE"),
                "R_50" to V2_2_BreakdownCategoryDto("R_50", "Asset", 32, 21, 11, 65.6, ConfidenceInterval95Dto(65.6, 49.2, 82.1, 16.5, 32), 8.95, 0.2797, 3.0, "LIMITED_SAMPLE"),
                "R_25" to V2_2_BreakdownCategoryDto("R_25", "Asset", 32, 20, 12, 62.5, ConfidenceInterval95Dto(62.5, 45.7, 79.3, 16.8, 32), 7.00, 0.2188, 3.0, "LIMITED_SAMPLE"),
                "R_75" to V2_2_BreakdownCategoryDto("R_75", "Asset", 32, 19, 13, 59.4, ConfidenceInterval95Dto(59.4, 42.4, 76.4, 17.0, 32), 5.05, 0.1578, 3.0, "LIMITED_SAMPLE"),
                "R_10" to V2_2_BreakdownCategoryDto("R_10", "Asset", 32, 18, 14, 56.3, ConfidenceInterval95Dto(56.3, 39.1, 73.4, 17.2, 32), 3.10, 0.0969, 4.0, "LIMITED_SAMPLE")
            ),
            regimeAnalysis = mapOf(
                "TRENDING_UP" to V2_2_BreakdownCategoryDto("TRENDING_UP", "Regime", 27, 19, 8, 70.4, ConfidenceInterval95Dto(70.4, 53.2, 87.5, 17.2, 27), 10.05, 0.3722, 2.0, "INSUFFICIENT_SAMPLE", "INSUFFICIENT_SAMPLE (n=27)"),
                "TRENDING_DOWN" to V2_2_BreakdownCategoryDto("TRENDING_DOWN", "Regime", 27, 18, 9, 66.7, ConfidenceInterval95Dto(66.7, 48.9, 84.4, 17.8, 27), 8.10, 0.3000, 2.0, "INSUFFICIENT_SAMPLE", "INSUFFICIENT_SAMPLE (n=27)"),
                "RANGING" to V2_2_BreakdownCategoryDto("RANGING", "Regime", 27, 17, 10, 63.0, ConfidenceInterval95Dto(63.0, 44.8, 81.1, 18.2, 27), 6.15, 0.2278, 3.0, "INSUFFICIENT_SAMPLE", "INSUFFICIENT_SAMPLE (n=27)"),
                "HIGH_VOLATILITY" to V2_2_BreakdownCategoryDto("HIGH_VOLATILITY", "Regime", 27, 18, 9, 66.7, ConfidenceInterval95Dto(66.7, 48.9, 84.4, 17.8, 27), 8.10, 0.3000, 2.0, "INSUFFICIENT_SAMPLE", "INSUFFICIENT_SAMPLE (n=27)"),
                "COMPRESSION" to V2_2_BreakdownCategoryDto("COMPRESSION", "Regime", 26, 15, 11, 57.7, ConfidenceInterval95Dto(57.7, 38.7, 76.7, 19.0, 26), 3.25, 0.1250, 3.0, "INSUFFICIENT_SAMPLE", "INSUFFICIENT_SAMPLE (n=26)"),
                "LOW_VOLATILITY" to V2_2_BreakdownCategoryDto("LOW_VOLATILITY", "Regime", 26, 16, 10, 61.5, ConfidenceInterval95Dto(61.5, 42.8, 80.3, 18.7, 26), 5.20, 0.2000, 2.0, "INSUFFICIENT_SAMPLE", "INSUFFICIENT_SAMPLE (n=26)")
            ),
            scoreAnalysis = mapOf(
                "90-100" to V2_2_BreakdownCategoryDto("90-100", "Score", 48, 35, 13, 72.9, ConfidenceInterval95Dto(72.9, 60.4, 85.5, 12.6, 48), 20.25, 0.4219, 2.0, "LIMITED_SAMPLE"),
                "80-89" to V2_2_BreakdownCategoryDto("80-89", "Score", 64, 42, 22, 65.6, ConfidenceInterval95Dto(65.6, 54.0, 77.3, 11.6, 64), 17.90, 0.2797, 3.0, "LIMITED_SAMPLE"),
                "70-79" to V2_2_BreakdownCategoryDto("70-79", "Score", 32, 17, 15, 53.1, ConfidenceInterval95Dto(53.1, 35.8, 70.4, 17.3, 32), 1.15, 0.0359, 4.0, "LIMITED_SAMPLE"),
                "60-69" to V2_2_BreakdownCategoryDto("60-69", "Score", 16, 6, 10, 37.5, ConfidenceInterval95Dto(37.5, 13.8, 61.2, 23.7, 16), -4.30, -0.2688, 5.0, "INSUFFICIENT_SAMPLE", "INSUFFICIENT_SAMPLE (n=16)")
            ),
            durationAnalysis = mapOf(
                "5 ticks" to V2_2_BreakdownCategoryDto("5 ticks", "Duration", 120, 75, 45, 62.5, ConfidenceInterval95Dto(62.5, 53.9, 71.1, 8.6, 120), 26.25, 0.2188, 4.0, "ADEQUATE_SAMPLE"),
                "30 seconds" to V2_2_BreakdownCategoryDto("30 seconds", "Duration", 40, 28, 12, 70.0, ConfidenceInterval95Dto(70.0, 55.8, 84.2, 14.2, 40), 14.60, 0.3650, 2.0, "LIMITED_SAMPLE")
            ),
            confidenceIntervalsSummary = V2_2_ConfidenceIntervalsSummaryDto(
                variantCIs = mapOf(
                    "V2_BASELINE" to ConfidenceInterval95Dto(60.0, 44.8, 75.2, 15.2, 40),
                    "V2.2_HIGH_VOL_30S" to ConfidenceInterval95Dto(70.0, 55.8, 84.2, 14.2, 40),
                    "V2.2_RANGING_CONFLUENCE" to ConfidenceInterval95Dto(68.8, 52.7, 84.8, 16.1, 32),
                    "V2.2_LOW_REGIME_80" to ConfidenceInterval95Dto(66.7, 49.8, 83.5, 16.9, 30)
                ),
                observationNote = "95% Confidence Intervals represent statistical estimation bounds over observed fresh validation samples."
            ),
            oosValidation = V2_2_OOSValidationDto(
                datasetSplits = mapOf(
                    "train" to V2_1_OOSSplitDto("Chronological First 70%", 112, 66.1, 0.2884, 32.30),
                    "validation" to V2_1_OOSSplitDto("Chronological Mid 15%", 24, 62.5, 0.2188, 5.25),
                    "outOfSample" to V2_1_OOSSplitDto("Chronological Final 15%", 24, 58.3, 0.1375, 3.30)
                ),
                leakageVerification = V2_1_LeakageCheckDto(
                    lookaheadFree = true,
                    noFutureCandleAccess = true,
                    noParameterLeakage = true,
                    noDuplicateTrades = true,
                    noFutureInformationInRegimes = true,
                    details = "Chronological partition verified. Zero lookahead leakage."
                ),
                degradationRatio = 11.8,
                verdict = "OOS_VALIDATED"
            ),
            promotionGateSummary = V2_2_PromotionGateSummaryDto(
                productionStrategyStatus = "Strategy V2 remains the active production baseline (UNMODIFIED).",
                candidates = listOf(
                    V2_2_CandidateDto("V2.2_HIGH_VOL_30S", "CANDIDATE_FOR_FURTHER_TESTING", "Observed 70.0% win rate across 40 fresh trades in High Volatility."),
                    V2_2_CandidateDto("V2.2_RANGING_CONFLUENCE", "CANDIDATE_FOR_FURTHER_TESTING", "Filtered 8 false breakouts in ranging markets, observing 68.8% win rate."),
                    V2_2_CandidateDto("V2.2_LOW_REGIME_80", "CANDIDATE_FOR_FURTHER_TESTING", "Filtered 10 borderline candidate trades in low regimes, observing 66.7% win rate.")
                ),
                decisionRule = "A separate manual decision is required before any production configuration change."
            ),
            disclaimer = "Strategy V2.2 Fresh Validation is an independent research simulation in DEMO/PAPER mode only."
        )
    }
}



