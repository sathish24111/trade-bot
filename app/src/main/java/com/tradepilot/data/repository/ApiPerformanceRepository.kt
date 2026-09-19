package com.tradepilot.data.repository

import com.tradepilot.data.mock.MockPerformanceRepositoryImpl
import com.tradepilot.data.model.*
import com.tradepilot.data.remote.ApiClient
import com.tradepilot.data.remote.WebSocketManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ApiPerformanceRepository(
    private val apiClient: ApiClient,
    private val webSocketManager: WebSocketManager,
    private val fallbackRepo: MockPerformanceRepositoryImpl,
    private val scope: CoroutineScope = CoroutineScope(Dispatchers.IO)
) : PerformanceRepository {

    private val _allTrades = MutableStateFlow<List<Trade>>(emptyList())
    override val allTrades: StateFlow<List<Trade>> = _allTrades.asStateFlow()

    private val _performanceSummary = MutableStateFlow(PerformanceSummary())
    override val performanceSummary: StateFlow<PerformanceSummary> = _performanceSummary.asStateFlow()

    init {
        // Initial fetch
        refreshCalculations()

        // Listen for new paper trades over WebSocket
        scope.launch {
            webSocketManager.events.collect { event ->
                if (event.type == "TRADE_CREATED" && event.trade != null) {
                    val t = event.trade
                    val newTrade = Trade(
                        id = t.id,
                        assetSymbol = t.asset,
                        direction = if (t.direction == "BUY") TradeDirection.BUY else TradeDirection.SELL,
                        amount = t.amount,
                        entryPrice = t.entry_price,
                        exitPrice = t.exit_price,
                        pnl = t.pnl,
                        status = if (t.result == "WIN") TradeResultStatus.WIN else TradeResultStatus.LOSS,
                        timestamp = "Just now",
                        durationMinutes = 5
                    )
                    _allTrades.value = listOf(newTrade) + _allTrades.value
                    fallbackRepo.recordSimulatedTrade(newTrade)
                }
            }
        }
    }

    override suspend fun recordSimulatedTrade(trade: Trade) {
        _allTrades.value = listOf(trade) + _allTrades.value
        fallbackRepo.recordSimulatedTrade(trade)
    }

    override fun refreshCalculations() {
        scope.launch {
            try {
                val sumRes = apiClient.apiService.getPerformanceSummary()
                val tradesRes = apiClient.apiService.getTrades(limit = 50)

                if (sumRes.isSuccessful && sumRes.body()?.summary != null) {
                    val s = sumRes.body()!!.summary!!
                    _performanceSummary.value = PerformanceSummary(
                        totalPnL = s.totalPnL,
                        todayPnL = s.todayPnL,
                        weeklyPnL = s.weeklyPnL,
                        totalTrades = s.totalTrades,
                        winningTrades = s.winningTrades,
                        losingTrades = s.losingTrades,
                        winRate = s.winRate,
                        maxDrawdown = s.maxDrawdown,
                        equityCurvePoints = s.equityCurvePoints?.map { it.time to it.balance } ?: emptyList(),
                        dailyPerformances = s.dailyPerformances?.map {
                            DailyPerformance(it.dayLabel, it.tradesCount, it.pnl, it.winRate)
                        } ?: emptyList()
                    )
                }

                if (tradesRes.isSuccessful && tradesRes.body()?.trades != null) {
                    _allTrades.value = tradesRes.body()!!.trades!!.map { t ->
                        Trade(
                            id = t.id,
                            assetSymbol = t.asset,
                            direction = if (t.direction == "BUY") TradeDirection.BUY else TradeDirection.SELL,
                            amount = t.amount,
                            entryPrice = t.entry_price,
                            exitPrice = t.exit_price,
                            pnl = t.pnl,
                            status = if (t.result == "WIN") TradeResultStatus.WIN else TradeResultStatus.LOSS,
                            timestamp = t.created_at.take(16).replace("T", " "),
                            durationMinutes = 5
                        )
                    }
                }
            } catch (e: Exception) {
                // Fallback to local offline calculations
                _allTrades.value = fallbackRepo.allTrades.value
                _performanceSummary.value = fallbackRepo.performanceSummary.value
            }
        }
    }
}
