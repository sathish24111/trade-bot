package com.tradepilot.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tradepilot.data.model.Candle
import com.tradepilot.ui.theme.*
import java.util.Locale

@Composable
fun CandlestickChart(
    candles: List<Candle>,
    modifier: Modifier = Modifier,
    latestPrice: Double? = null
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(220.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(DarkSurfaceElevated)
            .padding(8.dp)
    ) {
        if (candles.isEmpty()) {
            Text(
                text = "Loading market data...",
                color = TextMuted,
                fontSize = 12.sp,
                modifier = Modifier.padding(16.dp)
            )
        } else {
            Canvas(modifier = Modifier.fillMaxSize()) {
            val width = size.width
            val height = size.height
            val chartRightMargin = 80f // space for right-side price labels
            val chartWidth = width - chartRightMargin
            val chartHeight = height - 20f

            val minLow = candles.minOf { it.low }
            val maxHigh = candles.maxOf { it.high }
            val priceRange = if (maxHigh > minLow) (maxHigh - minLow) * 1.15 else 1.0
            val priceBase = minLow - (priceRange * 0.075)

            fun priceToY(price: Double): Float {
                val normalized = (price - priceBase) / priceRange
                return (chartHeight - (normalized * chartHeight)).toFloat()
            }

            // Draw horizontal price grid lines (3 levels)
            val gridLevels = 4
            val pathEffect = PathEffect.dashPathEffect(floatArrayOf(8f, 8f), 0f)
            val paint = android.graphics.Paint().apply {
                color = android.graphics.Color.parseColor("#64748B")
                textSize = 24f
                isAntiAlias = true
            }

            for (i in 0..gridLevels) {
                val y = (chartHeight / gridLevels) * i
                val priceVal = priceBase + (priceRange * (1.0 - (i.toDouble() / gridLevels)))

                drawLine(
                    color = ChartGridLine,
                    start = Offset(0f, y),
                    end = Offset(chartWidth, y),
                    strokeWidth = 1f,
                    pathEffect = pathEffect
                )

                // Price label on right side
                drawContext.canvas.nativeCanvas.drawText(
                    String.format(Locale.US, "%.4f", priceVal),
                    chartWidth + 10f,
                    y + 8f,
                    paint
                )
            }

            // Draw candles
            val candleCount = candles.size
            val candleTotalWidth = chartWidth / candleCount
            val candleBodyWidth = (candleTotalWidth * 0.65f).coerceIn(4f, 16f)

            candles.forEachIndexed { index, candle ->
                val centerX = index * candleTotalWidth + (candleTotalWidth / 2f)
                val openY = priceToY(candle.open)
                val closeY = priceToY(candle.close)
                val highY = priceToY(candle.high)
                val lowY = priceToY(candle.low)

                val isBull = candle.isBullish
                val candleColor = if (isBull) CandleBullish else CandleBearish

                // Wick (high to low)
                drawLine(
                    color = candleColor,
                    start = Offset(centerX, highY),
                    end = Offset(centerX, lowY),
                    strokeWidth = 2f
                )

                // Body (open to close)
                val topY = minOf(openY, closeY)
                val bottomY = maxOf(openY, closeY)
                val bodyHeight = maxOf(bottomY - topY, 3f)

                drawRect(
                    color = candleColor,
                    topLeft = Offset(centerX - (candleBodyWidth / 2f), topY),
                    size = Size(candleBodyWidth, bodyHeight)
                )
            }

            // Draw current price line if provided
            val currentPrice = latestPrice ?: candles.lastOrNull()?.close
            if (currentPrice != null) {
                val currentY = priceToY(currentPrice)
                drawLine(
                    color = DemoAmber,
                    start = Offset(0f, currentY),
                    end = Offset(chartWidth, currentY),
                    strokeWidth = 2f,
                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(6f, 6f), 0f)
                )
            }
        }
    }
}
}

