package com.tradepilot.ui.screens.market

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
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
import com.tradepilot.data.model.DemoSignal
import com.tradepilot.data.model.MarketTrend
import com.tradepilot.ui.components.*
import com.tradepilot.ui.theme.*
import com.tradepilot.viewmodel.MarketViewModel
import java.util.Locale

@Composable
fun MarketScreen(
    viewModel: MarketViewModel
) {
    val state by viewModel.uiState.collectAsState()
    val selected = state.selectedAsset

    Scaffold(
        topBar = {
            TradePilotTopBar(
                title = "Live Market",
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
            // Asset Selector Tabs
            item {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    items(state.assets) { asset ->
                        val isSelected = selected?.symbol == asset.symbol
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (isSelected) TradePrimary else DarkSurfaceElevated)
                                .border(
                                    1.dp,
                                    if (isSelected) TradePrimaryLight else DarkBorder,
                                    RoundedCornerShape(10.dp)
                                )
                                .clickable { viewModel.selectAsset(asset.symbol) }
                                .padding(horizontal = 14.dp, vertical = 8.dp)
                        ) {
                            Text(
                                text = asset.symbol,
                                color = if (isSelected) androidx.compose.ui.graphics.Color.White else TextSecondary,
                                fontSize = 13.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                            )
                        }
                    }
                }
            }

            if (selected != null) {
                // Asset Header & Price Card
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
                                Column {
                                    Text(
                                        text = selected.symbol,
                                        color = TextPrimary,
                                        fontSize = 22.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = selected.name,
                                        color = TextSecondary,
                                        fontSize = 12.sp
                                    )
                                }

                                // Trend Pill & Live/Simulated Status Pill
                                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(if (selected.isLive) TradeGreen.copy(alpha = 0.2f) else DemoAmber.copy(alpha = 0.2f))
                                            .border(
                                                1.dp,
                                                if (selected.isLive) TradeGreen else DemoAmber,
                                                RoundedCornerShape(8.dp)
                                            )
                                            .padding(horizontal = 8.dp, vertical = 4.dp)
                                    ) {
                                        Text(
                                            text = if (selected.isLive) "LIVE" else selected.status,
                                            color = if (selected.isLive) TradeGreen else DemoAmber,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }

                                    val isBullish = selected.trend == MarketTrend.BULLISH
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(if (isBullish) TradeGreenBg else TradeRedBg)
                                            .border(
                                                1.dp,
                                                if (isBullish) TradeGreen.copy(alpha = 0.5f) else TradeRed.copy(alpha = 0.5f),
                                                RoundedCornerShape(8.dp)
                                            )
                                            .padding(horizontal = 8.dp, vertical = 4.dp)
                                    ) {
                                        Text(
                                            text = selected.trend.name,
                                            color = if (isBullish) TradeGreen else TradeRed,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(14.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.Bottom
                            ) {
                                Text(
                                    text = if (selected.currentPrice > 100)
                                        String.format(Locale.US, "%.2f", selected.currentPrice)
                                    else
                                        String.format(Locale.US, "%.5f", selected.currentPrice),
                                    color = TextPrimary,
                                    fontSize = 30.sp,
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 0.5.sp
                                )

                                Text(
                                    text = String.format(
                                        Locale.US,
                                        "%s%.2f%%",
                                        if (selected.changePercent >= 0) "+" else "",
                                        selected.changePercent
                                    ),
                                    color = if (selected.changePercent >= 0) TradeGreen else TradeRed,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }

                // Demo Signal & Reason Card
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
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(
                                        text = "Strategy Signal Analysis",
                                        color = TextSecondary,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Medium
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Text(
                                            text = selected.demoSignal.name,
                                            color = when (selected.demoSignal) {
                                                DemoSignal.BUY -> TradeGreen
                                                DemoSignal.SELL -> TradeRed
                                                DemoSignal.WAIT -> DemoAmber
                                            },
                                            fontSize = 18.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Text(
                                            text = "(${selected.confidencePercent}% Confidence)",
                                            color = TextSecondary,
                                            fontSize = 13.sp
                                        )
                                    }
                                }

                                DemoBadge()
                            }

                            Spacer(modifier = Modifier.height(10.dp))
                            Text(
                                text = selected.reason,
                                color = TextPrimary.copy(alpha = 0.85f),
                                fontSize = 12.sp,
                                lineHeight = 16.sp
                            )
                        }
                    }
                }

                // Candlestick Chart Card
                item {
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Market Price Action",
                                color = TextPrimary,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.SemiBold
                            )

                            // Timeframe chips: 1m, 5m, 15m, 1h, 4h, 1D
                            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                listOf("1m", "5m", "15m", "1h", "4h", "1D").forEach { tf ->
                                    val isTfSelected = state.selectedTimeframe.equals(tf, ignoreCase = true)
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(6.dp))
                                            .background(if (isTfSelected) TradePrimary.copy(alpha = 0.25f) else DarkBg)
                                            .clickable { viewModel.selectTimeframe(tf) }
                                            .padding(horizontal = 7.dp, vertical = 3.dp)
                                    ) {
                                        Text(
                                            text = tf,
                                            color = if (isTfSelected) TradePrimaryLight else TextMuted,
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))
                        CandlestickChart(
                            candles = selected.candles,
                            latestPrice = selected.currentPrice
                        )
                    }
                }

                // Technical Indicators Grid
                item {
                    Text(
                        text = "Technical Indicators",
                        color = TextPrimary,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.height(10.dp))

                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            MetricCard(
                                title = "EMA (21)",
                                value = String.format(Locale.US, "%.5f", selected.indicators.ema21),
                                modifier = Modifier.weight(1f)
                            )
                            MetricCard(
                                title = "RSI (14)",
                                value = String.format(Locale.US, "%.1f", selected.indicators.rsi),
                                modifier = Modifier.weight(1f),
                                valueColor = if (selected.indicators.rsi > 70) TradeRed else if (selected.indicators.rsi < 30) TradeGreen else TextPrimary
                            )
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            MetricCard(
                                title = "MACD",
                                value = selected.indicators.macdStatus,
                                modifier = Modifier.weight(1f),
                                valueColor = if (selected.indicators.macdStatus.contains("Bull") || selected.indicators.macdStatus == "Positive") TradeGreen else TextPrimary
                            )
                            MetricCard(
                                title = "Bollinger Bands",
                                value = selected.indicators.bollingerStatus,
                                modifier = Modifier.weight(1f)
                            )
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            MetricCard(
                                title = "SMA (20)",
                                value = if (selected.indicators.sma20 > 0) String.format(Locale.US, "%.5f", selected.indicators.sma20) else "Calculating...",
                                modifier = Modifier.weight(1f)
                            )
                            MetricCard(
                                title = "ATR (14)",
                                value = if (selected.indicators.atr14 > 0) String.format(Locale.US, "%.5f", selected.indicators.atr14) else "0.0012",
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }

                // Non-guaranteed signal disclaimer
                item {
                    RiskNoticeBanner(text = "Demo signals are generated algorithmically for testing. No signal guarantees profit.")
                }
            }
        }
    }
}
