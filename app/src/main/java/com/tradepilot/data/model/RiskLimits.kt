package com.tradepilot.data.model

object RiskLimits {
    const val MAX_RISK_PER_TRADE_PERCENT = 0.01 // 1%
    const val MAX_DAILY_LOSS_PERCENT = 0.05     // 5% (e.g. ₹500 on ₹10,000 initial balance)
    const val MAX_CONCURRENT_TRADES = 1
    const val INITIAL_DEMO_BALANCE = 10000.0

    fun calculateMaxLossThreshold(initialBalance: Double = INITIAL_DEMO_BALANCE): Double {
        return initialBalance * MAX_DAILY_LOSS_PERCENT
    }
}
