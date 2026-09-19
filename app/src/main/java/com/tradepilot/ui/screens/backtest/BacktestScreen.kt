package com.tradepilot.ui.screens.backtest

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.TrendingDown
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tradepilot.data.remote.BacktestEquityPointDto
import com.tradepilot.data.remote.BacktestResultDto
import com.tradepilot.data.remote.BacktestTradeDto
import com.tradepilot.data.remote.StrategyComparisonItemDto
import com.tradepilot.ui.components.DemoBadge
import com.tradepilot.ui.theme.*
import com.tradepilot.viewmodel.BacktestViewModel
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BacktestScreen(
    viewModel: BacktestViewModel,
    onNavigateBack: () -> Unit
) {
    val selectedStrategy by viewModel.selectedStrategy.collectAsState()
    val selectedAsset by viewModel.selectedAsset.collectAsState()
    val selectedTimeframe by viewModel.selectedTimeframe.collectAsState()
    val initialBalance by viewModel.initialBalance.collectAsState()
    val tradeAmount by viewModel.tradeAmount.collectAsState()
    val spread by viewModel.spread.collectAsState()
    val slippage by viewModel.slippage.collectAsState()
    val fee by viewModel.fee.collectAsState()
    val activeTab by viewModel.activeTab.collectAsState()
    val isRunning by viewModel.isRunning.collectAsState()
    val currentResult by viewModel.currentResult.collectAsState()
    val comparisons by viewModel.comparisons.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()

    var showAdvancedParams by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Historical Backtester",
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp,
                            color = TextPrimary
                        )
                        Text(
                            text = "Phase 3 • No Look-Ahead Bias",
                            fontSize = 11.sp,
                            color = TradeGreen
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = Color.White
                        )
                    }
                },
                actions = {
                    DemoBadge()
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = DarkBg,
                    titleContentColor = TextPrimary
                )
            )
        },
        containerColor = DarkBg
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Mode Banner
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.ShowChart,
                            contentDescription = null,
                            tint = TradeGreen,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = "Simulated historical testing on real candle data. Strictly DEMO/PAPER mode.",
                            color = TextSecondary,
                            fontSize = 12.sp,
                            lineHeight = 16.sp
                        )
                    }
                }
            }

            // Tab Selector
            item {
                TabRow(
                    selectedTabIndex = activeTab,
                    containerColor = DarkSurfaceElevated,
                    contentColor = TradeGreen,
                    indicator = { tabPositions ->
                        TabRowDefaults.SecondaryIndicator(
                            Modifier.tabIndicatorOffset(tabPositions[activeTab]),
                            color = TradeGreen
                        )
                    }
                ) {
                    Tab(
                        selected = activeTab == 0,
                        onClick = { viewModel.setActiveTab(0) },
                        text = {
                            Text(
                                text = "Single Strategy",
                                fontWeight = if (activeTab == 0) FontWeight.Bold else FontWeight.Normal,
                                color = if (activeTab == 0) TradeGreen else TextSecondary
                            )
                        }
                    )
                    Tab(
                        selected = activeTab == 1,
                        onClick = { viewModel.setActiveTab(1) },
                        text = {
                            Text(
                                text = "Strategy Comparison",
                                fontWeight = if (activeTab == 1) FontWeight.Bold else FontWeight.Normal,
                                color = if (activeTab == 1) TradeGreen else TextSecondary
                            )
                        }
                    )
                }
            }

            if (activeTab == 0) {
                // Asset Selector
                item {
                    Text(
                        text = "SELECT ASSET",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextSecondary
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        viewModel.assets.forEach { asset ->
                            FilterChip(
                                selected = selectedAsset == asset,
                                onClick = { viewModel.selectAsset(asset) },
                                label = { Text(asset) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = TradeGreen.copy(alpha = 0.2f),
                                    selectedLabelColor = TradeGreen,
                                    containerColor = DarkSurfaceElevated,
                                    labelColor = TextPrimary
                                )
                            )
                        }
                    }
                }

                // Timeframe Selector
                item {
                    Text(
                        text = "TIMEFRAME",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextSecondary
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        viewModel.timeframes.forEach { tf ->
                            FilterChip(
                                selected = selectedTimeframe == tf,
                                onClick = { viewModel.selectTimeframe(tf) },
                                label = { Text(tf) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = TradeGreen.copy(alpha = 0.2f),
                                    selectedLabelColor = TradeGreen,
                                    containerColor = DarkSurfaceElevated,
                                    labelColor = TextPrimary
                                )
                            )
                        }
                    }
                }

                // Strategy Selector
                item {
                    Text(
                        text = "TRADING STRATEGY",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextSecondary
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        viewModel.strategies.forEach { strat ->
                            val isSelected = selectedStrategy == strat
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(
                                    containerColor = if (isSelected) TradeGreen.copy(alpha = 0.15f) else DarkSurfaceElevated
                                ),
                                shape = RoundedCornerShape(10.dp),
                                border = if (isSelected) androidx.compose.foundation.BorderStroke(1.dp, TradeGreen) else null,
                                onClick = { viewModel.selectStrategy(strat) }
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(14.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Column {
                                        Text(
                                            text = strat.replace('_', ' '),
                                            fontWeight = FontWeight.Bold,
                                            color = TextPrimary,
                                            fontSize = 14.sp
                                        )
                                        Text(
                                            text = when (strat) {
                                                "EMA_RSI" -> "EMA21 trend filter + RSI momentum trigger"
                                                "MACD" -> "MACD line & signal line momentum crossover"
                                                "BOLLINGER_BANDS" -> "Statistical 2.0-stdDev mean-reversion"
                                                "MULTI_INDICATOR" -> "Consensus voting across 4 technical indicators"
                                                else -> "Algorithmic rules"
                                            },
                                            fontSize = 11.sp,
                                            color = TextSecondary
                                        )
                                    }
                                    RadioButton(
                                        selected = isSelected,
                                        onClick = { viewModel.selectStrategy(strat) },
                                        colors = RadioButtonDefaults.colors(selectedColor = TradeGreen)
                                    )
                                }
                            }
                        }
                    }
                }

                // Advanced Parameters Accordion
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Execution Simulation Cost Models",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = TextPrimary
                                )
                                TextButton(onClick = { showAdvancedParams = !showAdvancedParams }) {
                                    Text(
                                        text = if (showAdvancedParams) "Hide" else "Customize",
                                        color = TradeGreen,
                                        fontSize = 12.sp
                                    )
                                }
                            }

                            if (showAdvancedParams) {
                                Spacer(modifier = Modifier.height(8.dp))
                                OutlinedTextField(
                                    value = initialBalance,
                                    onValueChange = { viewModel.setInitialBalance(it) },
                                    label = { Text("Initial Demo Balance (₹)") },
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = TradeGreen,
                                        unfocusedBorderColor = DarkBorder,
                                        focusedLabelColor = TradeGreen,
                                        focusedTextColor = TextPrimary,
                                        unfocusedTextColor = TextPrimary
                                    )
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    OutlinedTextField(
                                        value = spread,
                                        onValueChange = { viewModel.setSpread(it) },
                                        label = { Text("Spread") },
                                        modifier = Modifier.weight(1f),
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedBorderColor = TradeGreen,
                                            unfocusedBorderColor = DarkBorder,
                                            focusedLabelColor = TradeGreen,
                                            focusedTextColor = TextPrimary,
                                            unfocusedTextColor = TextPrimary
                                        )
                                    )
                                    OutlinedTextField(
                                        value = slippage,
                                        onValueChange = { viewModel.setSlippage(it) },
                                        label = { Text("Slippage") },
                                        modifier = Modifier.weight(1f),
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedBorderColor = TradeGreen,
                                            unfocusedBorderColor = DarkBorder,
                                            focusedLabelColor = TradeGreen,
                                            focusedTextColor = TextPrimary,
                                            unfocusedTextColor = TextPrimary
                                        )
                                    )
                                }
                            }
                        }
                    }
                }

                // Run Button
                item {
                    Button(
                        onClick = { viewModel.runBacktest() },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        enabled = !isRunning,
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = TradeGreen,
                            contentColor = DarkBg
                        )
                    ) {
                        if (isRunning) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                color = DarkBg,
                                strokeWidth = 2.dp
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(text = "Simulating Bars sequentially...", fontWeight = FontWeight.Bold)
                        } else {
                            Icon(imageVector = Icons.Default.PlayArrow, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(text = "RUN HISTORICAL BACKTEST", fontWeight = FontWeight.Bold)
                        }
                    }
                }

                // Results Section
                currentResult?.let { res ->
                    item {
                        BacktestResultCard(res)
                    }

                    item {
                        Text(
                            text = "EQUITY CURVE",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextSecondary
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        res.equityCurve?.let { curve ->
                            EquityCurveCanvas(points = curve)
                        }
                    }

                    item {
                        Text(
                            text = "EXECUTED PAPER TRADES (${res.trades?.size ?: 0})",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextSecondary
                        )
                    }

                    res.trades?.let { tradeList ->
                        items(tradeList) { trade ->
                            TradeHistoryItem(trade)
                        }
                    }
                }
            } else {
                // Strategy Comparison Tab
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = "Objective Strategy Comparison",
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary,
                                fontSize = 16.sp
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Simulate all 4 strategies concurrently across the exact same historical candle window. Compare win rate, total P/L, profit factor, and maximum drawdown.",
                                color = TextSecondary,
                                fontSize = 12.sp
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Button(
                                onClick = { viewModel.runComparison() },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(46.dp),
                                enabled = !isRunning,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = TradeGreen,
                                    contentColor = DarkBg
                                )
                            ) {
                                if (isRunning) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(18.dp),
                                        color = DarkBg,
                                        strokeWidth = 2.dp
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(text = "Running 4 Strategy Passes...", fontWeight = FontWeight.Bold)
                                } else {
                                    Icon(imageVector = Icons.Default.Refresh, contentDescription = null)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(text = "COMPARE ALL 4 STRATEGIES", fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }

                comparisons?.let { list ->
                    items(list) { comp ->
                        StrategyComparisonCard(comp)
                    }

                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated.copy(alpha = 0.5f)),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                text = "⚠ Objective Statistics Notice: Past performance does not guarantee future results. Different market regimes (trending vs ranging) naturally favor different strategy models.",
                                color = TextSecondary,
                                fontSize = 11.sp,
                                modifier = Modifier.padding(12.dp)
                            )
                        }
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}

@Composable
fun BacktestResultCard(res: BacktestResultDto) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${res.strategy.replace('_', ' ')} Performance",
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary,
                    fontSize = 15.sp
                )
                Text(
                    text = "${res.asset} • ${res.timeframe}",
                    color = TextSecondary,
                    fontSize = 12.sp
                )
            }
            Spacer(modifier = Modifier.height(14.dp))

            // Metrics Grid
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                MetricItem(
                    label = "Total P/L",
                    value = String.format(Locale.US, "%s₹%.2f", if (res.totalPnl >= 0) "+" else "", res.totalPnl),
                    color = if (res.totalPnl >= 0) TradeGreen else TradeRed,
                    modifier = Modifier.weight(1f)
                )
                MetricItem(
                    label = "Win Rate",
                    value = String.format(Locale.US, "%.1f%%", res.winRate),
                    color = if (res.winRate >= 50) TradeGreen else TradeRed,
                    modifier = Modifier.weight(1f)
                )
            }
            Spacer(modifier = Modifier.height(10.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                MetricItem(
                    label = "Profit Factor",
                    value = String.format(Locale.US, "%.2f", res.profitFactor),
                    color = if (res.profitFactor >= 1.5) TradeGreen else TextPrimary,
                    modifier = Modifier.weight(1f)
                )
                MetricItem(
                    label = "Max Drawdown",
                    value = String.format(Locale.US, "-%.2f%%", res.maxDrawdown),
                    color = TradeRed,
                    modifier = Modifier.weight(1f)
                )
            }
            Spacer(modifier = Modifier.height(10.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                MetricItem(
                    label = "Total Trades",
                    value = "${res.totalTrades} (${res.winningTrades}W / ${res.losingTrades}L)",
                    color = TextPrimary,
                    modifier = Modifier.weight(1f)
                )
                MetricItem(
                    label = "Final Balance",
                    value = String.format(Locale.US, "₹%.2f", res.finalBalance),
                    color = TextPrimary,
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
fun MetricItem(
    label: String,
    value: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .background(DarkBg.copy(alpha = 0.6f), RoundedCornerShape(8.dp))
            .padding(10.dp)
    ) {
        Column {
            Text(text = label, fontSize = 11.sp, color = TextSecondary)
            Spacer(modifier = Modifier.height(2.dp))
            Text(text = value, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = color)
        }
    }
}

@Composable
fun StrategyComparisonCard(item: StrategyComparisonItemDto) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated),
        shape = RoundedCornerShape(10.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = item.strategy.replace('_', ' '),
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary,
                    fontSize = 14.sp
                )
                Text(
                    text = String.format(Locale.US, "%s₹%.2f", if (item.totalPnl >= 0) "+" else "", item.totalPnl),
                    fontWeight = FontWeight.Bold,
                    color = if (item.totalPnl >= 0) TradeGreen else TradeRed,
                    fontSize = 14.sp
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(text = String.format(Locale.US, "Win Rate: %.1f%%", item.winRate), fontSize = 12.sp, color = TextSecondary)
                Text(text = String.format(Locale.US, "Profit Factor: %.2f", item.profitFactor), fontSize = 12.sp, color = TextSecondary)
                Text(text = String.format(Locale.US, "Drawdown: %.1f%%", item.maxDrawdown), fontSize = 12.sp, color = TradeRed)
                Text(text = "Trades: ${item.totalTrades}", fontSize = 12.sp, color = TextSecondary)
            }
        }
    }
}

@Composable
fun TradeHistoryItem(trade: BacktestTradeDto) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated),
        shape = RoundedCornerShape(8.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(
                            if (trade.direction == "BUY") TradeGreen.copy(alpha = 0.2f) else TradeRed.copy(alpha = 0.2f)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = if (trade.direction == "BUY") Icons.AutoMirrored.Filled.TrendingUp else Icons.AutoMirrored.Filled.TrendingDown,
                        contentDescription = null,
                        tint = if (trade.direction == "BUY") TradeGreen else TradeRed,
                        modifier = Modifier.size(16.dp)
                    )
                }
                Spacer(modifier = Modifier.width(10.dp))
                Column {
                    Text(
                        text = "${trade.direction} @ ${trade.entryPrice}",
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary,
                        fontSize = 13.sp
                    )
                    Text(
                        text = trade.reason ?: "Signal triggered",
                        fontSize = 10.sp,
                        color = TextSecondary
                    )
                }
            }

            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = String.format(Locale.US, "%s₹%.2f", if (trade.pnl >= 0) "+" else "", trade.pnl),
                    fontWeight = FontWeight.Bold,
                    color = if (trade.pnl >= 0) TradeGreen else TradeRed,
                    fontSize = 13.sp
                )
                Text(
                    text = trade.result,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = if (trade.result == "WIN") TradeGreen else TradeRed
                )
            }
        }
    }
}

@Composable
fun EquityCurveCanvas(points: List<BacktestEquityPointDto>) {
    if (points.isNotEmpty()) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .height(140.dp),
            colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated),
            shape = RoundedCornerShape(10.dp)
        ) {
            val minVal = points.minOf { it.equity }
            val maxVal = points.maxOf { it.equity }.coerceAtLeast(minVal + 1.0)
            val range = maxVal - minVal

            Canvas(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(12.dp)
            ) {
                val width = size.width
                val height = size.height
                val path = Path()

                points.forEachIndexed { index, point ->
                    val x = (index.toFloat() / (points.size - 1).coerceAtLeast(1)) * width
                    val normalizedY = ((point.equity - minVal) / range).toFloat()
                    val y = height - (normalizedY * height)

                    if (index == 0) {
                        path.moveTo(x, y)
                    } else {
                        path.lineTo(x, y)
                    }
                }

                drawPath(
                    path = path,
                    color = TradeGreen,
                    style = Stroke(width = 3.dp.toPx())
                )
            }
        }
    }
}
