package com.tradepilot.data.model

enum class TradeDirection {
    BUY, SELL
}

enum class TradeResultStatus {
    WIN, LOSS
}

data class Trade(
    val id: String,
    val assetSymbol: String,
    val direction: TradeDirection,
    val amount: Double,
    val entryPrice: Double,
    val exitPrice: Double,
    val pnl: Double,
    val status: TradeResultStatus,
    val timestamp: String,
    val durationMinutes: Int = 5
)
