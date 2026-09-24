package com.tradepilot.ui.screens.portfolio

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.TrendingDown
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tradepilot.data.remote.PortfolioAllocationDto
import com.tradepilot.ui.components.DemoBadge
import com.tradepilot.ui.theme.*
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PortfolioScreen() {
    var initialCapital by remember { mutableStateOf(10000.0) }
    var currentEquity by remember { mutableStateOf(10480.50) }
    var maxDrawdown by remember { mutableStateOf(4.2) }
    var isSimulating by remember { mutableStateOf(false) }
    var riskLimitReached by remember { mutableStateOf(false) }

    val allocations = remember {
        mutableStateListOf(
            PortfolioAllocationDto("BTC/USD", "EMA_RSI", 50.0, 5000.0),
            PortfolioAllocationDto("ETH/USD", "MACD", 30.0, 3000.0),
            PortfolioAllocationDto("EUR/USD", "BOLLINGER_BANDS", 20.0, 2000.0)
        )
    }

    val correlationAssets = listOf("BTC/USD", "ETH/USD", "EUR/USD")
    val correlationMatrix = listOf(
        listOf(1.00, 0.82, 0.12),
        listOf(0.82, 1.00, 0.15),
        listOf(0.12, 0.15, 1.00)
    )

    val equityPoints = remember {
        listOf(10000.0, 10080.0, 10150.0, 10090.0, 10220.0, 10340.0, 10290.0, 10410.0, 10480.5)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Portfolio Paper Simulator",
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp,
                            color = TextPrimary
                        )
                        Text(
                            text = "Phase 5 Multi-Asset Validation",
                            fontSize = 12.sp,
                            color = TextMuted
                        )
                    }
                },
                actions = {
                    DemoBadge(modifier = Modifier.padding(end = 8.dp))
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DarkSurfaceElevated)
            )
        },
        containerColor = DarkBg
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Summary Card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = DarkSurface),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Simulated Portfolio Equity", fontSize = 13.sp, color = TextMuted)
                            Surface(
                                color = TradePrimary.copy(alpha = 0.15f),
                                shape = RoundedCornerShape(4.dp)
                            ) {
                                Text(
                                    text = "DEMO PAPER MODE",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TradePrimaryLight,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(6.dp))

                        val netPnl = currentEquity - initialCapital
                        val retPct = (netPnl / initialCapital) * 100.0

                        Text(
                            text = "$${String.format(Locale.US, "%,.2f", currentEquity)}",
                            fontSize = 28.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )

                        Spacer(modifier = Modifier.height(4.dp))

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = if (netPnl >= 0) Icons.AutoMirrored.Filled.TrendingUp else Icons.AutoMirrored.Filled.TrendingDown,
                                contentDescription = null,
                                tint = if (netPnl >= 0) TradeProfit else TradeLoss,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "${if (netPnl >= 0) "+" else ""}$${String.format(Locale.US, "%.2f", netPnl)} (${String.format(Locale.US, "%+.2f", retPct)}%)",
                                color = if (netPnl >= 0) TradeProfit else TradeLoss,
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 13.sp
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))
                        HorizontalDivider(color = DarkBorder)
                        Spacer(modifier = Modifier.height(12.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text("Initial Capital", fontSize = 11.sp, color = TextMuted)
                                Text("$${String.format(Locale.US, "%,.0f", initialCapital)}", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                            }
                            Column {
                                Text("Max Drawdown", fontSize = 11.sp, color = TextMuted)
                                Text("${maxDrawdown}%", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TradeLoss)
                            }
                            Column {
                                Text("DD Limit", fontSize = 11.sp, color = TextMuted)
                                Text("15.0%", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TradeWarning)
                            }
                        }
                    }
                }
            }

            // Risk Limit Breach Banner (if triggered)
            if (riskLimitReached) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = TradeLoss.copy(alpha = 0.15f)),
                        shape = RoundedCornerShape(8.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, TradeLoss)
                    ) {
                        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Warning, contentDescription = null, tint = TradeLoss)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "PORTFOLIO_RISK_LIMIT_REACHED: Safety limit exceeded. Position updates paused.",
                                fontSize = 12.sp,
                                color = TradeLoss,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            // Asset Allocations Card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = DarkSurface),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Asset Allocations (Max 100%)", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                            Text("Total: 100%", fontSize = 12.sp, color = TradeProfit, fontWeight = FontWeight.Bold)
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        allocations.forEach { alloc ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 6.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Surface(
                                        color = DarkSurfaceElevated,
                                        shape = RoundedCornerShape(6.dp),
                                        modifier = Modifier.size(36.dp)
                                    ) {
                                        Box(contentAlignment = Alignment.Center) {
                                            Text(
                                                text = alloc.asset.split("/").firstOrNull()?.take(3) ?: "AST",
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = TradePrimaryLight
                                            )
                                        }
                                    }
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Column {
                                        Text(alloc.asset, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                        Text(alloc.strategy, fontSize = 11.sp, color = TextMuted)
                                    }
                                }
                                Column(horizontalAlignment = Alignment.End) {
                                    Text("${alloc.weightPercent.toInt()}%", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                    Text("$${alloc.allocatedCapital.toInt()}", fontSize = 11.sp, color = TextMuted)
                                }
                            }
                        }
                    }
                }
            }

            // Portfolio Equity Chart
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = DarkSurface),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Combined Portfolio Equity Curve", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        Text("Synchronized multi-strategy paper trajectory", fontSize = 11.sp, color = TextMuted)

                        Spacer(modifier = Modifier.height(16.dp))

                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(160.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(DarkBg)
                                .padding(8.dp)
                        ) {
                            Canvas(modifier = Modifier.fillMaxSize()) {
                                val minVal = equityPoints.minOrNull() ?: 10000.0
                                val maxVal = equityPoints.maxOrNull() ?: 10500.0
                                val range = (maxVal - minVal).coerceAtLeast(1.0)

                                val stepX = size.width / (equityPoints.size - 1)
                                val path = Path()

                                equityPoints.forEachIndexed { i, pt ->
                                    val x = i * stepX
                                    val y = size.height - ((pt - minVal) / range * size.height).toFloat()
                                    if (i == 0) path.moveTo(x, y) else path.lineTo(x, y)
                                }

                                drawPath(
                                    path = path,
                                    color = TradePrimaryLight,
                                    style = Stroke(width = 3.dp.toPx())
                                )
                            }
                        }
                    }
                }
            }

            // Pearson Correlation Matrix Card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = DarkSurface),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Pearson Asset Correlation Matrix", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        Text("Measures cross-asset diversification stability [-1.0, 1.0]", fontSize = 11.sp, color = TextMuted)

                        Spacer(modifier = Modifier.height(12.dp))

                        Column(modifier = Modifier.horizontalScroll(rememberScrollState())) {
                            Row {
                                Box(modifier = Modifier.width(70.dp)) { Text("", fontSize = 11.sp) }
                                correlationAssets.forEach { a ->
                                    Box(modifier = Modifier.width(70.dp), contentAlignment = Alignment.Center) {
                                        Text(a.split("/").first(), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(6.dp))

                            correlationMatrix.forEachIndexed { rIdx, row ->
                                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 4.dp)) {
                                    Box(modifier = Modifier.width(70.dp)) {
                                        Text(correlationAssets[rIdx].split("/").first(), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                    }
                                    row.forEach { corr ->
                                        val cellBg = if (corr == 1.00) DarkSurfaceElevated
                                        else if (corr > 0.6) TradeWarning.copy(alpha = 0.2f)
                                        else TradeProfit.copy(alpha = 0.2f)

                                        val cellColor = if (corr == 1.00) TextMuted
                                        else if (corr > 0.6) TradeWarning
                                        else TradeProfit

                                        Box(
                                            modifier = Modifier
                                                .size(width = 66.dp, height = 32.dp)
                                                .padding(horizontal = 2.dp)
                                                .clip(RoundedCornerShape(4.dp))
                                                .background(cellBg),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                text = String.format(Locale.US, "%.2f", corr),
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = cellColor
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Action Button
            item {
                Button(
                    onClick = {
                        isSimulating = true
                        // Simulate risk trigger toggle for testing verification
                        currentEquity += 120.0
                        isSimulating = false
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = TradePrimary),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Icon(Icons.Default.PlayArrow, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Simulate Multi-Asset Portfolio", fontWeight = FontWeight.Bold)
                }
            }

            // Disclaimer
            item {
                Surface(
                    color = DarkSurfaceElevated,
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "SAFETY NOTICE: Portfolio simulation models asset allocation and drawdowns using historical demo data. TradePilot does NOT execute live broker transactions. Correlation values may diverge during volatile real-world market conditions.",
                        fontSize = 10.sp,
                        color = TextMuted,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(12.dp)
                    )
                }
            }
        }
    }
}
