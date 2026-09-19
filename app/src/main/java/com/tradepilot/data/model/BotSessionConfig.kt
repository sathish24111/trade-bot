package com.tradepilot.data.model

enum class TradingStrategy(val displayName: String, val description: String) {
    EMA_RSI("EMA + RSI", "Combines trend following with momentum oscillator"),
    MACD("MACD", "Moving Average Convergence Divergence trend signals"),
    BOLLINGER_BANDS("Bollinger Bands", "Volatility breakout and mean-reversion signals"),
    MULTI_INDICATOR("Multi Indicator", "Weighted consensus from EMA, RSI & MACD")
}

enum class RiskLevel(val displayName: String, val maxRiskPerTradePercent: Double) {
    LOW("Low", 0.01),       // 1% max risk
    MEDIUM("Medium", 0.02), // 2% max risk
    HIGH("High", 0.03)      // 3% max risk
}

enum class SessionDuration(val displayName: String, val totalMinutes: Int) {
    MIN_5("5 Minutes", 5),
    MIN_15("15 Minutes", 15),
    MIN_30("30 Minutes", 30),
    HOUR_1("1 Hour", 60)
}

data class BotSessionConfig(
    val investmentAmount: Double = 500.0,
    val strategy: TradingStrategy = TradingStrategy.EMA_RSI,
    val riskLevel: RiskLevel = RiskLevel.LOW,
    val duration: SessionDuration = SessionDuration.MIN_30
)
