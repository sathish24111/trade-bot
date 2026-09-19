package com.tradepilot.data.model

data class Candle(
    val timestamp: Long,
    val open: Double,
    val high: Double,
    val low: Double,
    val close: Double
) {
    val isBullish: Boolean get() = close >= open
}

enum class MarketTrend {
    BULLISH, BEARISH, NEUTRAL
}

enum class DemoSignal {
    BUY, SELL, WAIT
}

data class TechnicalIndicators(
    val ema21: Double = 21.0,
    val rsi: Double = 64.2,
    val macdStatus: String = "Positive",
    val bollingerStatus: String = "Normal",
    val sma20: Double = 0.0,
    val sma50: Double = 0.0,
    val atr14: Double = 0.0
)

data class MarketAsset(
    val symbol: String,
    val name: String,
    val currentPrice: Double,
    val change24h: Double,
    val changePercent: Double,
    val trend: MarketTrend,
    val demoSignal: DemoSignal,
    val confidencePercent: Int,
    val indicators: TechnicalIndicators,
    val candles: List<Candle>,
    val status: String = "SIMULATED",
    val isLive: Boolean = false,
    val reason: String = "Algorithmic momentum and trend analysis",
    val timeframe: String = "5m"
)
