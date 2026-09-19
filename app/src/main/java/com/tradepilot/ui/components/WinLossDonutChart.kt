package com.tradepilot.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tradepilot.ui.theme.TextMuted
import com.tradepilot.ui.theme.TextPrimary
import com.tradepilot.ui.theme.TradeGreen
import com.tradepilot.ui.theme.TradeRed
import java.util.Locale

@Composable
fun WinLossDonutChart(
    wins: Int,
    losses: Int,
    modifier: Modifier = Modifier
) {
    val total = wins + losses
    val winAngle = if (total > 0) (wins.toFloat() / total) * 360f else 270f
    val lossAngle = 360f - winAngle
    val winRate = if (total > 0) (wins.toDouble() / total) * 100.0 else 0.0

    Box(
        modifier = modifier.size(130.dp),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize().padding(10.dp)) {
            val strokeWidth = 14.dp.toPx()
            val diameter = size.minDimension
            val topLeft = Offset((size.width - diameter) / 2f, (size.height - diameter) / 2f)
            val arcSize = Size(diameter, diameter)

            // Draw loss arc (Red)
            drawArc(
                color = TradeRed,
                startAngle = -90f + winAngle,
                sweepAngle = lossAngle,
                useCenter = false,
                style = Stroke(width = strokeWidth, cap = StrokeCap.Butt),
                topLeft = topLeft,
                size = arcSize
            )

            // Draw win arc (Green)
            drawArc(
                color = TradeGreen,
                startAngle = -90f,
                sweepAngle = winAngle,
                useCenter = false,
                style = Stroke(width = strokeWidth, cap = StrokeCap.Butt),
                topLeft = topLeft,
                size = arcSize
            )
        }

        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = String.format(Locale.US, "%.1f%%", winRate),
                color = TextPrimary,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Win Rate",
                color = TextMuted,
                fontSize = 10.sp
            )
        }
    }
}
