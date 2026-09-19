package com.tradepilot.data.model

data class AppSettings(
    val notificationsEnabled: Boolean = true,
    val darkModeEnabled: Boolean = true,
    val soundAlertsEnabled: Boolean = false,
    val defaultRisk: RiskLevel = RiskLevel.LOW,
    val defaultStrategy: TradingStrategy = TradingStrategy.EMA_RSI,
    val defaultDuration: SessionDuration = SessionDuration.MIN_15
)
