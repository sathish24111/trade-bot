package com.tradepilot.data.repository

import com.tradepilot.data.model.PerformanceSummary
import com.tradepilot.data.model.Trade
import kotlinx.coroutines.flow.StateFlow

interface PerformanceRepository {
    val performanceSummary: StateFlow<PerformanceSummary>
    val allTrades: StateFlow<List<Trade>>
    suspend fun recordSimulatedTrade(trade: Trade)
    fun refreshCalculations()
}
