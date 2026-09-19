package com.tradepilot.data.mock

import com.tradepilot.data.local.LocalTradeStorage
import com.tradepilot.data.model.DailyPerformance
import com.tradepilot.data.model.PerformanceSummary
import com.tradepilot.data.model.Trade
import com.tradepilot.data.model.TradeResultStatus
import com.tradepilot.data.repository.PerformanceRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.text.SimpleDateFormat
import java.util.*

class MockPerformanceRepositoryImpl(
    private val localTradeStorage: LocalTradeStorage
) : PerformanceRepository {

    private val _allTrades = MutableStateFlow<List<Trade>>(emptyList())
    override val allTrades: StateFlow<List<Trade>> = _allTrades.asStateFlow()

    private val _performanceSummary = MutableStateFlow(MockDataProvider.getInitialPerformanceSummary())
    override val performanceSummary: StateFlow<PerformanceSummary> = _performanceSummary.asStateFlow()

    init {
        val loaded = localTradeStorage.loadTrades()
        if (loaded.isNotEmpty()) {
            _allTrades.value = loaded
            recalculateMetrics(loaded)
        } else {
            val initial = MockDataProvider.getInitialTrades()
            _allTrades.value = initial
            localTradeStorage.saveTrades(initial)
            recalculateMetrics(initial)
        }
    }

    override suspend fun recordSimulatedTrade(trade: Trade) {
        val updated = listOf(trade) + _allTrades.value
        _allTrades.value = updated
        localTradeStorage.saveTrades(updated)
        recalculateMetrics(updated)
    }

    override fun refreshCalculations() {
        recalculateMetrics(_allTrades.value)
    }

    private fun recalculateMetrics(trades: List<Trade>) {
        if (trades.isEmpty()) {
            _performanceSummary.value = PerformanceSummary(
                totalPnL = 0.0,
                todayPnL = 0.0,
                weeklyPnL = 0.0,
                totalTrades = 0,
                winningTrades = 0,
                losingTrades = 0,
                winRate = 0.0,
                maxDrawdown = 0.0,
                equityCurvePoints = listOf("09:00" to 10000.0),
                dailyPerformances = emptyList()
            )
            return
        }

        val totalCount = trades.size
        val wins = trades.count { it.status == TradeResultStatus.WIN }
        val losses = trades.count { it.status == TradeResultStatus.LOSS }
        val winRate = if (totalCount > 0) (wins.toDouble() / totalCount) * 100.0 else 0.0
        val totalPnL = trades.sumOf { it.pnl }
        val todayPnL = trades.take(5).sumOf { it.pnl }
        val weeklyPnL = totalPnL

        // Generate equity curve from base 10,000
        var runningEquity = 10000.0
        val points = mutableListOf<Pair<String, Double>>()
        points.add("Start" to runningEquity)
        trades.reversed().takeLast(10).forEachIndexed { index, t ->
            runningEquity += t.pnl
            points.add("T${index + 1}" to runningEquity)
        }

        val daily = listOf(
            DailyPerformance("Mon", 6, 110.20, 66.7),
            DailyPerformance("Tue", 5, 85.00, 60.0),
            DailyPerformance("Wed", 4, -30.50, 50.0),
            DailyPerformance("Thu", 5, 120.40, 80.0),
            DailyPerformance("Today", maxOf(1, wins), todayPnL, winRate)
        )

        _performanceSummary.value = PerformanceSummary(
            totalPnL = totalPnL,
            todayPnL = todayPnL,
            weeklyPnL = weeklyPnL,
            totalTrades = totalCount,
            winningTrades = wins,
            losingTrades = losses,
            winRate = ((winRate * 10).toInt()) / 10.0,
            maxDrawdown = 3.2,
            equityCurvePoints = points,
            dailyPerformances = daily
        )
    }
}
