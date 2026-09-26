package com.tradepilot.data.repository

import com.tradepilot.data.remote.*

interface ResearchRepository {
    suspend fun runResearchBacktest(req: RunBacktestRequest): Result<BacktestResultDto>
    suspend fun runOptimization(req: OptimizationRequest): Result<OptimizationResultDto>
    suspend fun runWalkForward(req: WalkForwardRequest): Result<WalkForwardResultDto>
    suspend fun runMonteCarlo(req: MonteCarloRequest): Result<MonteCarloResultDto>
    suspend fun getMarketRegimes(asset: String, timeframe: String = "5m"): Result<MarketRegimesResponse>
    suspend fun calculatePositionSize(req: PositionSizingRequest): Result<PositionSizingCalculationDto>
    suspend fun getV2ValidationDashboard(symbol: String = "R_100"): Result<V2ValidationDashboardDto>
    suspend fun getV2_1ResearchLabDashboard(): Result<V2_1_ResearchLabDashboardDto>
}

