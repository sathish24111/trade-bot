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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tradepilot.data.mock.MockDataProvider
import com.tradepilot.data.model.Trade
import com.tradepilot.data.model.TradeDirection
import com.tradepilot.data.model.TradeResultStatus
import com.tradepilot.ui.theme.*
import java.util.Locale

@Composable
fun TradeCardItem(
    trade: Trade,
    modifier: Modifier = Modifier
) {
    val isWin = trade.status == TradeResultStatus.WIN
    val isBuy = trade.direction == TradeDirection.BUY

    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(DarkSurfaceElevated)
            .border(1.dp, DarkBorder, RoundedCornerShape(12.dp))
            .padding(14.dp)
    ) {
        Column {
            // Header: Direction Badge + Asset + Time
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Direction Badge
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (isBuy) TradeGreenBg else TradeRedBg)
                            .border(
                                1.dp,
                                if (isBuy) TradeGreen.copy(alpha = 0.5f) else TradeRed.copy(alpha = 0.5f),
                                RoundedCornerShape(6.dp)
                            )
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = trade.direction.name,
                            color = if (isBuy) TradeGreen else TradeRed,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Text(
                        text = trade.assetSymbol,
                        color = TextPrimary,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                Text(
                    text = trade.timestamp,
                    color = TextMuted,
                    fontSize = 12.sp
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Details Row: Amount, Entry, Exit, Result
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Stake amount
                Column {
                    Text(
                        text = "Amount",
                        color = TextMuted,
                        fontSize = 10.sp
                    )
                    Text(
                        text = MockDataProvider.formatBalance(trade.amount),
                        color = TextPrimary,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium
                    )
                }

                // Entry Price
                Column {
                    Text(
                        text = "Entry",
                        color = TextMuted,
                        fontSize = 10.sp
                    )
                    Text(
                        text = String.format(Locale.US, "%.5f", trade.entryPrice),
                        color = TextSecondary,
                        fontSize = 13.sp
                    )
                }

                // Exit Price
                Column {
                    Text(
                        text = "Exit",
                        color = TextMuted,
                        fontSize = 10.sp
                    )
                    Text(
                        text = String.format(Locale.US, "%.5f", trade.exitPrice),
                        color = TextSecondary,
                        fontSize = 13.sp
                    )
                }

                // Result P/L
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "Result",
                        color = TextMuted,
                        fontSize = 10.sp
                    )
                    Text(
                        text = MockDataProvider.formatCurrency(trade.pnl),
                        color = if (isWin) TradeGreen else TradeRed,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}
