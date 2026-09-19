package com.tradepilot.ui.screens.performance

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tradepilot.data.mock.MockDataProvider
import com.tradepilot.ui.components.*
import com.tradepilot.ui.theme.*
import com.tradepilot.viewmodel.PerformanceViewModel
import java.util.Locale

@Composable
fun PerformanceScreen(
    viewModel: PerformanceViewModel
) {
    val state by viewModel.uiState.collectAsState()
    val summary = state.summary

    Scaffold(
        topBar = {
            TradePilotTopBar(
                title = "Performance Analytics",
                actions = { DemoBadge() }
            )
        },
        containerColor = DarkBg
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(top = 8.dp, bottom = 32.dp)
        ) {
            // Hero Total P/L Card
            item {
                Box(
                    modifier = Modifier
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
                            Text(
                                text = "Total Demo P/L",
                                color = TextSecondary,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium
                            )
                            DemoBadge()
                        }

                        Spacer(modifier = Modifier.height(4.dp))

                        Text(
                            text = MockDataProvider.formatCurrency(summary.totalPnL),
                            color = if (summary.totalPnL >= 0) TradeGreen else TradeRed,
                            fontSize = 32.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 0.5.sp
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(DarkBg.copy(alpha = 0.5f))
                                    .padding(8.dp)
                            ) {
                                Column {
                                    Text("Today's P/L", color = TextMuted, fontSize = 10.sp)
                                    Text(
                                        text = MockDataProvider.formatCurrency(summary.todayPnL),
                                        color = if (summary.todayPnL >= 0) TradeGreen else TradeRed,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }

                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(DarkBg.copy(alpha = 0.5f))
                                    .padding(8.dp)
                            ) {
                                Column {
                                    Text("Weekly P/L", color = TextMuted, fontSize = 10.sp)
                                    Text(
                                        text = MockDataProvider.formatCurrency(summary.weeklyPnL),
                                        color = if (summary.weeklyPnL >= 0) TradeGreen else TradeRed,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }

                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(DarkBg.copy(alpha = 0.5f))
                                    .padding(8.dp)
                            ) {
                                Column {
                                    Text("Max Drawdown", color = TextMuted, fontSize = 10.sp)
                                    Text(
                                        text = String.format(Locale.US, "%.1f%%", summary.maxDrawdown),
                                        color = TextPrimary,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // P/L Equity Curve Chart Card
            item {
                Column {
                    Text(
                        text = "Equity Growth",
                        color = TextPrimary,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    PerformanceLineChart(points = summary.equityCurvePoints)
                }
            }

            // Win / Loss Breakdown Card
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(DarkSurfaceElevated)
                        .border(1.dp, DarkBorder, RoundedCornerShape(14.dp))
                        .padding(16.dp)
                ) {
                    Column {
                        Text(
                            text = "Win / Loss Breakdown",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = TextPrimary
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceAround
                        ) {
                            WinLossDonutChart(
                                wins = summary.winningTrades,
                                losses = summary.losingTrades
                            )

                            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(10.dp)
                                            .clip(RoundedCornerShape(2.dp))
                                            .background(TradeGreen)
                                    )
                                    Text("Winning Trades: ${summary.winningTrades}", color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                                }

                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(10.dp)
                                            .clip(RoundedCornerShape(2.dp))
                                            .background(TradeRed)
                                    )
                                    Text("Losing Trades: ${summary.losingTrades}", color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                                }

                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(10.dp)
                                            .clip(RoundedCornerShape(2.dp))
                                            .background(TextMuted)
                                    )
                                    Text("Total Trades: ${summary.totalTrades}", color = TextSecondary, fontSize = 13.sp)
                                }
                            }
                        }
                    }
                }
            }

            // Daily Performance Breakdown
            item {
                Text(
                    text = "Daily Breakdown",
                    color = TextPrimary,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }

            items(summary.dailyPerformances) { daily ->
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(DarkSurfaceElevated)
                        .border(1.dp, DarkBorder, RoundedCornerShape(12.dp))
                        .padding(14.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = daily.dayLabel,
                                color = TextPrimary,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "${daily.tradesCount} trades • ${String.format(Locale.US, "%.0f%%", daily.winRate)} win",
                                color = TextSecondary,
                                fontSize = 11.sp
                            )
                        }

                        Text(
                            text = MockDataProvider.formatCurrency(daily.pnl),
                            color = if (daily.pnl >= 0) TradeGreen else TradeRed,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            item {
                RiskNoticeBanner()
            }
        }
    }
}
