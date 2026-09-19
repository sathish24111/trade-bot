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
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tradepilot.ui.theme.*

@Composable
fun PerformanceLineChart(
    points: List<Pair<String, Double>>,
    modifier: Modifier = Modifier,
    lineColor: Color = TradeGreen,
    fillGradient: Brush = Brush.verticalGradient(
        colors = listOf(
            TradeGreen.copy(alpha = 0.35f),
            TradeGreen.copy(alpha = 0.0f)
        )
    )
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(180.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(DarkSurfaceElevated)
            .padding(12.dp)
    ) {
        if (points.size < 2) {
            Text(
                text = "Simulating performance curve...",
                color = TextMuted,
                fontSize = 12.sp,
                modifier = Modifier.padding(16.dp)
            )
        } else {
            Canvas(modifier = Modifier.fillMaxSize()) {
            val width = size.width
            val height = size.height

            val values = points.map { it.second }
            val minVal = values.minOrNull() ?: 0.0
            val maxVal = values.maxOrNull() ?: 1.0
            val range = if (maxVal > minVal) (maxVal - minVal) * 1.2 else 1.0
            val baseVal = minVal - (range * 0.1)

            fun toY(v: Double): Float {
                val norm = (v - baseVal) / range
                return (height - (norm * height)).toFloat().coerceIn(10f, height - 10f)
            }

            val stepX = width / (points.size - 1)

            val linePath = Path()
            val fillPath = Path()

            val firstX = 0f
            val firstY = toY(points.first().second)
            linePath.moveTo(firstX, firstY)
            fillPath.moveTo(firstX, height)
            fillPath.lineTo(firstX, firstY)

            for (i in 1 until points.size) {
                val prevX = (i - 1) * stepX
                val prevY = toY(points[i - 1].second)
                val currentX = i * stepX
                val currentY = toY(points[i].second)

                val cX1 = prevX + (stepX / 2f)
                val cY1 = prevY
                val cX2 = prevX + (stepX / 2f)
                val cY2 = currentY

                linePath.cubicTo(cX1, cY1, cX2, cY2, currentX, currentY)
                fillPath.cubicTo(cX1, cY1, cX2, cY2, currentX, currentY)
            }

            fillPath.lineTo(width, height)
            fillPath.close()

            // Draw filled gradient under curve
            drawPath(
                path = fillPath,
                brush = fillGradient
            )

            // Draw line
            drawPath(
                path = linePath,
                color = lineColor,
                style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round)
            )

            // Draw last point dot
            val lastX = (points.size - 1) * stepX
            val lastY = toY(points.last().second)
            drawCircle(
                color = TextPrimary,
                radius = 4.dp.toPx(),
                center = Offset(lastX, lastY)
            )
            drawCircle(
                color = lineColor,
                radius = 2.dp.toPx(),
                center = Offset(lastX, lastY)
            )
        }
    }
}
}

