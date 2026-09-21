package com.tradepilot.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tradepilot.data.mock.MockDataProvider
import com.tradepilot.ui.theme.*

@Composable
fun MetricCard(
    title: String,
    value: String,
    modifier: Modifier = Modifier,
    subtitle: String? = null,
    valueColor: Color = TextPrimary
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(DarkSurfaceElevated)
            .border(1.dp, DarkBorder, RoundedCornerShape(12.dp))
            .padding(14.dp)
    ) {
        Column {
            Text(
                text = title,
                color = TextSecondary,
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = value,
                color = valueColor,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
            if (subtitle != null) {
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = subtitle,
                    color = TextMuted,
                    fontSize = 10.sp
                )
            }
        }
    }
}

@Composable
fun DemoBalanceCard(
    balance: Double,
    todayPnL: Double,
    winRate: Double,
    totalTrades: Int,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(DarkSurfaceElevated)
            .border(1.dp, DarkBorder, RoundedCornerShape(16.dp))
            .padding(18.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Deriv Demo Balance",
                        color = TextSecondary,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = MockDataProvider.formatBalance(balance),
                        color = TextPrimary,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.5.sp
                    )
                }
                DemoBadge()
            }

            Spacer(modifier = Modifier.height(18.dp))

            // Sub-metrics row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(DarkBg.copy(alpha = 0.6f))
                    .border(1.dp, DarkBorder.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
                    .padding(vertical = 10.dp, horizontal = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Today's P/L
                Column {
                    Text(
                        text = "Today's P/L",
                        color = TextMuted,
                        fontSize = 10.sp
                    )
                    Text(
                        text = MockDataProvider.formatCurrency(todayPnL),
                        color = if (todayPnL >= 0) TradeGreen else TradeRed,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                // Divider
                Box(
                    modifier = Modifier
                        .width(1.dp)
                        .height(30.dp)
                        .background(DarkBorder)
                )

                // Win Rate
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "Win Rate",
                        color = TextMuted,
                        fontSize = 10.sp
                    )
                    Text(
                        text = String.format(java.util.Locale.US, "%.1f%%", winRate),
                        color = TextPrimary,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                // Divider
                Box(
                    modifier = Modifier
                        .width(1.dp)
                        .height(30.dp)
                        .background(DarkBorder)
                )

                // Total Trades
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "Total Trades",
                        color = TextMuted,
                        fontSize = 10.sp
                    )
                    Text(
                        text = "$totalTrades",
                        color = TextPrimary,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}
