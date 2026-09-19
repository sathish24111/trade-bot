package com.tradepilot.data.repository

import com.tradepilot.data.remote.BacktestResultDto
import com.tradepilot.data.remote.StrategyComparisonItemDto
import kotlinx.coroutines.flow.StateFlow

interface BacktestRepository {
    val currentResult: StateFlow<BacktestResultDto?>
    val isRunning: StateFlow<Boolean>
    val errorMessage: StateFlow<String?>
    val comparisons: StateFlow<List<StrategyComparisonItemDto>?>

    suspend fun runBacktest(
        asset: String,
        strategy: String,
        timeframe: String,
        initialBalance: Double,
        tradeAmount: Double,
        spread: Double? = null,
        slippage: Double? = null,
        fee: Double? = null
    ): Result<BacktestResultDto>

    suspend fun compareStrategies(
        asset: String,
        timeframe: String,
        count: Int = 100,
        initialBalance: Double = 10000.0
    ): Result<List<StrategyComparisonItemDto>>
}
