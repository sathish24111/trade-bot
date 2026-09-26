package com.tradepilot.data.remote

import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // Health
    @GET("api/health")
    suspend fun checkHealth(): Response<Map<String, Any>>

    // Auth
    @POST("api/auth/register")
    suspend fun register(@Body req: RegisterRequest): Response<AuthResponse>

    @POST("api/auth/login")
    suspend fun login(@Body req: LoginRequest): Response<AuthResponse>

    @GET("api/auth/me")
    suspend fun getMe(): Response<AuthResponse>

    // Market
    @GET("api/market/assets")
    suspend fun getAssets(): Response<MarketAssetsResponse>

    @GET("api/market/{asset}")
    suspend fun getAsset(@Path("asset") asset: String): Response<AssetDetailsResponse>

    @GET("api/market/{asset}/candles")
    suspend fun getCandles(
        @Path("asset") asset: String,
        @Query("timeframe") timeframe: String = "5m",
        @Query("count") count: Int = 60
    ): Response<CandlesResponse>

    @GET("api/market/{asset}/quote")
    suspend fun getQuote(
        @Path("asset") asset: String,
        @Query("timeframe") timeframe: String = "5m"
    ): Response<MarketQuoteResponse>

    // Trading
    @POST("api/trading/session/start")
    suspend fun startSession(@Body req: StartSessionRequest): Response<StartSessionResponse>

    @GET("api/trading/session/{id}")
    suspend fun getSession(@Path("id") id: String): Response<ApiResponse<SessionDto>>

    @POST("api/trading/session/{id}/stop")
    suspend fun stopSession(@Path("id") id: String): Response<StopSessionResponse>

    @GET("api/trading/sessions")
    suspend fun getSessions(): Response<SessionsListResponse>

    // Performance & History
    @GET("api/performance/summary")
    suspend fun getPerformanceSummary(): Response<PerformanceSummaryResponse>

    @GET("api/performance/trades")
    suspend fun getTrades(
        @Query("limit") limit: Int = 50,
        @Query("filter") filter: String? = null
    ): Response<TradesResponse>

    // Phase 3: Backtesting & Strategy Comparison
    @POST("api/backtest/run")
    suspend fun runBacktest(@Body req: RunBacktestRequest): Response<BacktestResponse>

    @POST("api/backtest/compare")
    suspend fun compareStrategies(@Body req: CompareStrategiesRequest): Response<CompareStrategiesResponse>

    @GET("api/backtest/history")
    suspend fun getBacktestHistory(@Query("limit") limit: Int = 20): Response<ApiResponse<List<BacktestResultDto>>>

    @GET("api/backtest/{id}")
    suspend fun getBacktestById(@Path("id") id: String): Response<ApiResponse<BacktestResultDto>>

    // Phase 4: Research, Optimization, Walk-Forward, Monte Carlo & Regimes
    @POST("api/research/backtest")
    suspend fun runResearchBacktest(@Body req: RunBacktestRequest): Response<BacktestResponse>

    @POST("api/research/optimize")
    suspend fun runOptimization(@Body req: OptimizationRequest): Response<OptimizationResponse>

    @POST("api/research/walk-forward")
    suspend fun runWalkForward(@Body req: WalkForwardRequest): Response<WalkForwardResponse>

    @POST("api/research/monte-carlo")
    suspend fun runMonteCarlo(@Body req: MonteCarloRequest): Response<MonteCarloResponse>

    @GET("api/research/regimes")
    suspend fun getMarketRegimes(@Query("asset") asset: String, @Query("timeframe") timeframe: String = "5m"): Response<MarketRegimesResponse>

    @POST("api/research/position-size")
    suspend fun calculatePositionSize(@Body req: PositionSizingRequest): Response<PositionSizingResponse>

    // Phase 5: Datasets
    @GET("api/research/datasets")
    suspend fun listDatasets(@Query("asset") asset: String? = null, @Query("timeframe") timeframe: String? = null): Response<DatasetsListResponse>

    // Phase 5: Multi-Asset & Multi-Timeframe
    @POST("api/research/cross-asset")
    suspend fun runCrossAssetValidation(@Body req: Map<String, Any>): Response<CrossAssetResponse>

    @POST("api/research/cross-timeframe")
    suspend fun runCrossTimeframeValidation(@Body req: Map<String, Any>): Response<CrossTimeframeResponse>

    // Phase 5: Sensitivity Heatmap
    @POST("api/research/sensitivity-heatmap")
    suspend fun runSensitivityHeatmap(@Body req: Map<String, Any>): Response<SensitivityHeatmapResponse>

    // Phase 5: Stress Testing
    @POST("api/research/stress-test")
    suspend fun runStressTest(@Body req: Map<String, Any>): Response<StressTestResponse>

    // Phase 5: Portfolio Simulation
    @POST("api/research/portfolios")
    suspend fun createPortfolio(@Body req: CreatePortfolioRequest): Response<PortfolioCreateResponse>

    @GET("api/research/portfolios")
    suspend fun listPortfolios(): Response<PortfoliosListResponse>

    @POST("api/research/portfolios/{portfolioId}/simulate")
    suspend fun simulatePortfolio(@Path("portfolioId") portfolioId: String, @Query("timeframe") timeframe: String = "5m"): Response<PortfolioSimulationResponse>

    // Phase 5: Paper Experiments & Journal
    @POST("api/research/experiments")
    suspend fun createExperiment(@Body req: CreateExperimentRequest): Response<ExperimentCreateResponse>

    @GET("api/research/experiments")
    suspend fun listExperiments(): Response<ExperimentsListResponse>

    @PATCH("api/research/experiments/{id}/status")
    suspend fun updateExperimentStatus(@Path("id") id: String, @Body body: Map<String, String>): Response<ExperimentCreateResponse>

    @POST("api/research/experiments/{id}/trades")
    suspend fun logExperimentTrade(@Path("id") id: String, @Body req: LogExperimentTradeRequest): Response<ExperimentTradeResponse>

    @GET("api/research/experiments/{id}/compare")
    suspend fun compareExperiment(@Path("id") id: String): Response<ExperimentCompareResponse>

    // Phase 5: Research Report
    @POST("api/research/report")
    suspend fun generateReport(@Body req: Map<String, Any>): Response<ResearchReportResponse>

    // ==========================================
    // Phase 6: Real-Time Monitoring & Drift
    // ==========================================

    @GET("api/monitor/overview")
    suspend fun getMonitorOverview(
        @Query("asset") asset: String = "BTC/USD",
        @Query("strategy") strategy: String = "EMA_RSI"
    ): Response<MonitorOverviewResponse>

    @GET("api/monitor/market-health")
    suspend fun getMarketHealth(): Response<MarketHealthResponse>

    @GET("api/signals")
    suspend fun getSignals(@Query("limit") limit: Int = 50): Response<SignalsResponse>

    @GET("api/signals/analytics")
    suspend fun getSignalAnalytics(
        @Query("strategy") strategy: String? = null,
        @Query("asset") asset: String? = null
    ): Response<SignalAnalyticsResponse>

    @GET("api/risk/overview")
    suspend fun getRiskOverview(): Response<RiskOverviewResponse>

    @GET("api/strategies")
    suspend fun getStrategies(): Response<StrategiesResponse>

    @PATCH("api/strategies/{id}/state")
    suspend fun updateStrategyState(
        @Path("id") id: String,
        @Body body: UpdateStrategyStateRequest
    ): Response<Any>

    @GET("api/alerts")
    suspend fun getAlerts(@Query("severity") severity: String? = null): Response<AlertsResponse>

    @PATCH("api/alerts/{id}/acknowledge")
    suspend fun acknowledgeAlert(@Path("id") id: String): Response<Any>

    @PATCH("api/alerts/{id}/resolve")
    suspend fun resolveAlert(@Path("id") id: String): Response<Any>

    @GET("api/portfolio/exposure")
    suspend fun getPortfolioExposure(): Response<PortfolioExposureResponse>

    @GET("api/health/system")
    suspend fun getSystemHealth(): Response<SystemHealthResponse>

    // Phase 7: Providers & Failover
    @GET("api/providers")
    suspend fun getProviders(): Response<ProvidersResponse>

    @GET("api/providers/health")
    suspend fun getProviderHealth(): Response<ProviderHealthResponse>

    @GET("api/providers/events")
    suspend fun getProviderEvents(): Response<ProviderEventsResponse>

    // Phase 7: Notifications
    @POST("api/notifications/device")
    suspend fun registerDevice(@Body body: NotificationDeviceRequest): Response<NotificationDeviceResponse>

    @DELETE("api/notifications/device/{id}")
    suspend fun unregisterDevice(@Path("id") id: String): Response<ApiResponse<Boolean>>

    @GET("api/notifications/preferences")
    suspend fun getNotificationPreferences(): Response<NotificationPreferencesResponse>

    @PATCH("api/notifications/preferences")
    suspend fun updateNotificationPreferences(@Body body: NotificationPreferencesDto): Response<NotificationPreferencesResponse>

    // Phase 7: Strategy Policy & Controls
    @GET("api/strategies/{id}/policy")
    suspend fun getStrategyPolicy(@Path("id") id: String): Response<StrategyPolicyResponse>

    @PUT("api/strategies/{id}/policy")
    suspend fun updateStrategyPolicy(@Path("id") id: String, @Body body: StrategyPolicyDto): Response<StrategyPolicyResponse>

    @GET("api/strategies/{id}/adaptation-history")
    suspend fun getStrategyAdaptationHistory(@Path("id") id: String): Response<AdaptationHistoryResponse>

    @POST("api/strategies/{id}/pause")
    suspend fun pauseStrategy(@Path("id") id: String, @Body body: Map<String, String> = emptyMap()): Response<ApiResponse<Boolean>>

    @POST("api/strategies/{id}/resume")
    suspend fun resumeStrategy(@Path("id") id: String, @Body body: Map<String, Boolean> = emptyMap()): Response<ApiResponse<Boolean>>

    // Phase 7: Experiment Timeline
    @GET("api/experiments/{id}/timeline")
    suspend fun getExperimentTimeline(@Path("id") id: String): Response<TimelineResponse>

    // Phase 8: Advanced Research Lab & Control Center
    @GET("api/research/strategies")
    suspend fun getResearchStrategies(): Response<ResearchStrategiesResponse>

    @GET("api/research/ensemble")
    suspend fun getEnsemble(): Response<EnsembleResponse>

    @POST("api/research/ensemble")
    suspend fun saveEnsemble(@Body config: EnsembleConfigDto): Response<EnsembleResponse>

    @GET("api/research/correlation")
    suspend fun getStrategyCorrelation(
        @Query("asset") asset: String = "BTC/USD",
        @Query("timeframe") timeframe: String = "5m"
    ): Response<StrategyCorrelationResponse>

    @GET("api/research/risk-attribution")
    suspend fun getRiskAttribution(): Response<RiskAttributionResponse>

    @GET("api/research/stability")
    suspend fun getParameterStability(
        @Query("strategyId") strategyId: String = "EMA_RSI",
        @Query("parameterKey") parameterKey: String = "emaPeriod",
        @Query("baselineValue") baselineValue: Int = 21
    ): Response<ParameterStabilityResponse>

    @POST("api/research/experiments/{id}/clone")
    suspend fun cloneExperiment(
        @Path("id") id: String,
        @Body body: Map<String, String> = emptyMap()
    ): Response<ApiResponse<Any>>

    @POST("api/research/experiments/{id}/tags")
    suspend fun addExperimentTags(
        @Path("id") id: String,
        @Body body: Map<String, String>
    ): Response<ApiResponse<Any>>

    @GET("api/research/experiments/{id}/replay")
    suspend fun getReplay(
        @Path("id") id: String,
        @Query("action") action: String = "init",
        @Query("sessionId") sessionId: String? = null,
        @Query("speed") speed: Int? = null
    ): Response<ReplayResponse>

    @GET("api/research/experiments/{id}/diagnostics/{tradeId}")
    suspend fun getTradeDiagnostics(
        @Path("id") id: String,
        @Path("tradeId") tradeId: String
    ): Response<TradeDiagnosticResponse>

    @GET("api/research/experiments/{id}/performance-stages")
    suspend fun getPerformanceStages(
        @Path("id") id: String
    ): Response<PerformanceStagesResponse>

    // Phase 9: Autonomous Research Control Center
    @GET("api/research/jobs")
    suspend fun listResearchJobs(
        @Query("status") status: String? = null
    ): Response<ResearchJobListResponse>

    @POST("api/research/jobs")
    suspend fun submitResearchJob(
        @Body body: Map<String, Any>
    ): Response<ResearchJobDetailResponse>

    @GET("api/research/jobs/{id}")
    suspend fun getResearchJob(
        @Path("id") id: String
    ): Response<ResearchJobDetailResponse>

    @POST("api/research/jobs/{id}/pause")
    suspend fun pauseResearchJob(
        @Path("id") id: String
    ): Response<ResearchJobDetailResponse>

    @POST("api/research/jobs/{id}/resume")
    suspend fun resumeResearchJob(
        @Path("id") id: String
    ): Response<ResearchJobDetailResponse>

    @POST("api/research/jobs/{id}/cancel")
    suspend fun cancelResearchJob(
        @Path("id") id: String,
        @Body body: Map<String, String> = emptyMap()
    ): Response<ResearchJobDetailResponse>

    @GET("api/research/strategies/{strategyId}/drift-trends")
    suspend fun getStrategyDriftTrends(
        @Path("strategyId") strategyId: String,
        @Query("asset") asset: String = "BTC/USD"
    ): Response<DriftTrendResponse>

    @GET("api/research/recommendations")
    suspend fun getResearchRecommendations(
        @Query("status") status: String? = null
    ): Response<RecommendationsResponse>

    @GET("api/research/evidence-matrix")
    suspend fun getEvidenceMatrix(): Response<EvidenceMatrixResponse>

    @GET("api/research/watchdog/events")
    suspend fun getWatchdogEvents(
        @Query("experimentId") experimentId: String? = null
    ): Response<WatchdogEventsResponse>

    @GET("api/research/anomalies")
    suspend fun getAnomalyInvestigations(): Response<AnomalyInvestigationsResponse>

    @GET("api/research/strategies/{strategyId}/stress-matrix")
    suspend fun getStressMatrix(
        @Path("strategyId") strategyId: String
    ): Response<StressMatrixResponse>

    @GET("api/research/portfolios/{portfolioId}/what-if")
    suspend fun getPortfolioWhatIfRuns(
        @Path("portfolioId") portfolioId: String
    ): Response<PortfolioWhatIfResponse>

    @GET("api/research/regimes/transitions")
    suspend fun getRegimeTransitions(
        @Query("asset") asset: String? = null
    ): Response<RegimeTransitionsResponse>

    @GET("api/research/reports/daily")
    suspend fun getDailyResearchReports(): Response<DailyReportsResponse>

    // Strategy V2 Demo Validation & Loss Analysis
    @GET("api/research/strategy-v2/validation-dashboard")
    suspend fun getV2ValidationDashboard(
        @Query("symbol") symbol: String = "R_100"
    ): Response<V2ValidationDashboardResponse>

    // Strategy V2.1 Controlled Research Lab & Hypothesis Experiments
    @GET("api/research/strategy-v2-1/lab-dashboard")
    suspend fun getV2_1ResearchLabDashboard(): Response<V2_1_ResearchLabDashboardResponse>

    // Strategy V2.2 Extended Fresh Validation Layer
    @GET("api/research/strategy-v2-2/fresh-dashboard")
    suspend fun getV2_2FreshValidationDashboard(): Response<V2_2_FreshValidationDashboardResponse>

    // Strategy V2.3 Multi-Session Validation & Promotion Gate Research Module
    @GET("api/research/strategy-v2-3/dashboard")
    suspend fun getV2_3MultiSessionDashboard(): Response<V2_3_MultiSessionDashboardResponse>
}





