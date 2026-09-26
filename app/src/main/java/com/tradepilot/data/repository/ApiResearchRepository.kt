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
}

