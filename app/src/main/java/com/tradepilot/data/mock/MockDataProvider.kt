package com.tradepilot.data.mock

import com.tradepilot.data.model.*
import java.text.SimpleDateFormat
import java.util.*

object MockDataProvider {

    fun getInitialTrades(): List<Trade> {
        return listOf(
            Trade(
                id = "TRD-8491",
                assetSymbol = "EUR/USD",
                direction = TradeDirection.BUY,
                amount = 50.0,
                entryPrice = 1.08210,
                exitPrice = 1.08245,
                pnl = 8.20,
                status = TradeResultStatus.WIN,
                timestamp = "09:42 AM",
                durationMinutes = 5
            ),
            Trade(
                id = "TRD-8490",
                assetSymbol = "GBP/USD",
                direction = TradeDirection.SELL,
                amount = 100.0,
                entryPrice = 1.26450,
                exitPrice = 1.26410,
                pnl = 15.50,
                status = TradeResultStatus.WIN,
                timestamp = "09:35 AM",
                durationMinutes = 5
            ),
            Trade(
                id = "TRD-8489",
                assetSymbol = "USD/JPY",
                direction = TradeDirection.BUY,
                amount = 50.0,
                entryPrice = 154.200,
                exitPrice = 154.120,
                pnl = -12.00,
                status = TradeResultStatus.LOSS,
                timestamp = "09:20 AM",
                durationMinutes = 5
            ),
            Trade(
                id = "TRD-8488",
                assetSymbol = "EUR/USD",
                direction = TradeDirection.SELL,
                amount = 100.0,
                entryPrice = 1.08310,
                exitPrice = 1.08260,
                pnl = 18.00,
                status = TradeResultStatus.WIN,
                timestamp = "09:05 AM",
                durationMinutes = 15
            ),
            Trade(
                id = "TRD-8487",
                assetSymbol = "BTC/USD",
                direction = TradeDirection.BUY,
                amount = 250.0,
                entryPrice = 64200.0,
                exitPrice = 64550.0,
                pnl = 45.80,
                status = TradeResultStatus.WIN,
                timestamp = "08:45 AM",
                durationMinutes = 15
            ),
            Trade(
                id = "TRD-8486",
                assetSymbol = "ETH/USD",
                direction = TradeDirection.BUY,
                amount = 100.0,
                entryPrice = 3450.0,
                exitPrice = 3420.0,
                pnl = -22.50,
                status = TradeResultStatus.LOSS,
                timestamp = "08:15 AM",
                durationMinutes = 5
            ),
            Trade(
                id = "TRD-8485",
                assetSymbol = "EUR/USD",
                direction = TradeDirection.BUY,
                amount = 50.0,
                entryPrice = 1.08150,
                exitPrice = 1.08190,
                pnl = 7.50,
                status = TradeResultStatus.WIN,
                timestamp = "Yesterday",
                durationMinutes = 5
            ),
            Trade(
                id = "TRD-8484",
                assetSymbol = "GBP/USD",
                direction = TradeDirection.SELL,
                amount = 100.0,
                entryPrice = 1.26550,
                exitPrice = 1.26620,
                pnl = -14.00,
                status = TradeResultStatus.LOSS,
                timestamp = "Yesterday",
                durationMinutes = 15
            )
        )
    }

    fun getInitialMarketAssets(): List<MarketAsset> {
        return listOf(
            MarketAsset(
                symbol = "EUR/USD",
                name = "Euro / US Dollar",
                currentPrice = 1.08245,
                change24h = 0.00185,
                changePercent = 0.17,
                trend = MarketTrend.BULLISH,
                demoSignal = DemoSignal.BUY,
                confidencePercent = 72,
                indicators = TechnicalIndicators(
                    ema21 = 21.0,
                    rsi = 64.2,
                    macdStatus = "Positive",
                    bollingerStatus = "Normal"
                ),
                candles = generateMockCandles(basePrice = 1.08100, variance = 0.0006, count = 25)
            ),
            MarketAsset(
                symbol = "GBP/USD",
                name = "British Pound / US Dollar",
                currentPrice = 1.26420,
                change24h = -0.00210,
                changePercent = -0.16,
                trend = MarketTrend.BEARISH,
                demoSignal = DemoSignal.SELL,
                confidencePercent = 68,
                indicators = TechnicalIndicators(
                    ema21 = 18.5,
                    rsi = 41.5,
                    macdStatus = "Negative",
                    bollingerStatus = "Lower Band"
                ),
                candles = generateMockCandles(basePrice = 1.26500, variance = 0.0010, count = 25)
            ),
            MarketAsset(
                symbol = "USD/JPY",
                name = "US Dollar / Japanese Yen",
                currentPrice = 154.350,
                change24h = 0.420,
                changePercent = 0.27,
                trend = MarketTrend.BULLISH,
                demoSignal = DemoSignal.BUY,
                confidencePercent = 65,
                indicators = TechnicalIndicators(
                    ema21 = 22.4,
                    rsi = 58.7,
                    macdStatus = "Positive",
                    bollingerStatus = "Normal"
                ),
                candles = generateMockCandles(basePrice = 153.800, variance = 0.35, count = 25)
            ),
            MarketAsset(
                symbol = "BTC/USD",
                name = "Bitcoin / US Dollar",
                currentPrice = 64320.00,
                change24h = 1240.0,
                changePercent = 1.96,
                trend = MarketTrend.BULLISH,
                demoSignal = DemoSignal.BUY,
                confidencePercent = 78,
                indicators = TechnicalIndicators(
                    ema21 = 26.0,
                    rsi = 68.4,
                    macdStatus = "Strong Bull",
                    bollingerStatus = "Upper Band"
                ),
                candles = generateMockCandles(basePrice = 63500.0, variance = 650.0, count = 25)
            ),
            MarketAsset(
                symbol = "ETH/USD",
                name = "Ethereum / US Dollar",
                currentPrice = 3465.50,
                change24h = -32.10,
                changePercent = -0.92,
                trend = MarketTrend.NEUTRAL,
                demoSignal = DemoSignal.WAIT,
                confidencePercent = 52,
                indicators = TechnicalIndicators(
                    ema21 = 20.1,
                    rsi = 49.3,
                    macdStatus = "Neutral",
                    bollingerStatus = "Squeeze"
                ),
                candles = generateMockCandles(basePrice = 3480.0, variance = 35.0, count = 25)
            )
        )
    }

    fun generateMockCandles(basePrice: Double, variance: Double, count: Int): List<Candle> {
        val list = mutableListOf<Candle>()
        var lastClose = basePrice
        val now = System.currentTimeMillis()
        val intervalMs = 60_000L // 1-minute candles

        for (i in 0 until count) {
            val isGreen = (i * 7 + 3) % 10 > 3
            val change = (if (isGreen) 1.0 else -1.0) * (variance * 0.4 + (i % 5) * (variance * 0.1))
            val open = lastClose
            val close = open + change
            val high = maxOf(open, close) + variance * 0.25
            val low = minOf(open, close) - variance * 0.25
            val time = now - (count - i) * intervalMs

            list.add(
                Candle(
                    timestamp = time,
                    open = open,
                    high = high,
                    low = low,
                    close = close
                )
            )
            lastClose = close
        }
        return list
    }

    fun getInitialPerformanceSummary(): PerformanceSummary {
        val daily = listOf(
            DailyPerformance("Mon", 6, 110.20, 66.7),
            DailyPerformance("Tue", 5, 85.00, 60.0),
            DailyPerformance("Wed", 4, -30.50, 50.0),
            DailyPerformance("Thu", 5, 120.40, 80.0),
            DailyPerformance("Today", 4, 140.40, 75.0)
        )

        val equityCurve = listOf(
            "09:00" to 10000.0,
            "09:15" to 10045.0,
            "09:30" to 10032.0,
            "09:45" to 10098.0,
            "10:00" to 10145.0,
            "10:15" to 10190.0,
            "10:30" to 10245.50
        )

        return PerformanceSummary(
            totalPnL = 425.50,
            todayPnL = 245.50,
            weeklyPnL = 425.50,
            totalTrades = 24,
            winningTrades = 15,
            losingTrades = 9,
            winRate = 62.5,
            maxDrawdown = 3.2,
            equityCurvePoints = equityCurve,
            dailyPerformances = daily
        )
    }

    fun formatCurrency(amount: Double): String {
        val sign = if (amount > 0) "+" else if (amount < 0) "-" else ""
        val absVal = kotlin.math.abs(amount)
        return String.format(Locale.US, "%s₹%,.2f", sign, absVal)
    }

    fun formatBalance(amount: Double): String {
        return String.format(Locale.US, "₹%,.2f", amount)
    }
}
