package com.tradepilot.data.model

data class DailyPerformance(
    val dayLabel: String,
    val tradesCount: Int,
    val pnl: Double,
    val winRate: Double
)

data class PerformanceSummary(
    val totalPnL: Double = 425.50,
    val todayPnL: Double = 245.50,
    val weeklyPnL: Double = 425.50,
    val totalTrades: Int = 24,
    val winningTrades: Int = 15,
    val losingTrades: Int = 9,
    val winRate: Double = 62.5,
    val maxDrawdown: Double = 3.2,
    val equityCurvePoints: List<Pair<String, Double>> = emptyList(),
    val dailyPerformances: List<DailyPerformance> = emptyList()
)
