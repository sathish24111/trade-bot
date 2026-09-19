package com.tradepilot.ui.screens.research

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tradepilot.data.remote.*
import com.tradepilot.ui.components.DemoBadge
import com.tradepilot.ui.theme.*
import java.util.Locale

enum class ResearchLabTab(val title: String) {
    OVERVIEW("Overview"),
    STRATEGIES("Strategies"),
    ENSEMBLE("Ensemble"),
    PORTFOLIO("Portfolio"),
    REGIMES("Regimes"),
    ROBUSTNESS("Robustness"),
    EXPERIMENTS("Experiments"),
    REPLAY("Replay")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ResearchLabScreen(
    onNavigateBack: () -> Unit = {}
) {
    var selectedTab by remember { mutableStateOf(ResearchLabTab.OVERVIEW) }

    // Replay state
    var replayBarIndex by remember { mutableStateOf(18) }
    val totalReplayBars = 60
    var isReplayPlaying by remember { mutableStateOf(false) }
    var replaySpeed by remember { mutableStateOf(1) }

    // Ensemble Mode
    var selectedAggregationMode by remember { mutableStateOf("MAJORITY") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBg)
    ) {
        // Top Header
        Surface(
            color = DarkSurfaceElevated,
            tonalElevation = 4.dp,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(onClick = onNavigateBack, modifier = Modifier.size(32.dp)) {
                            Icon(
                                imageVector = Icons.Default.ArrowBack,
                                contentDescription = "Back",
                                tint = TextPrimary
                            )
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(
                                text = "Research Lab & Control Center",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                            Text(
                                text = "Phase 8: Multi-Strategy Portfolio & Simulation",
                                fontSize = 11.sp,
                                color = TextMuted
                            )
                        }
                    }
                    DemoBadge()
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Strict Safety Alert Banner
                Surface(
                    color = DemoAmber.copy(alpha = 0.12f),
                    shape = RoundedCornerShape(8.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, DemoAmber.copy(alpha = 0.3f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Warning,
                            contentDescription = "Warning",
                            tint = DemoAmber,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "DEMO / PAPER RESEARCH ONLY — All metrics are purely descriptive measurements.",
                            fontSize = 10.sp,
                            color = DemoAmber,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
        }

        // Scrollable Tab Row (8 Tabs)
        ScrollableTabRow(
            selectedTabIndex = selectedTab.ordinal,
            containerColor = DarkSurface,
            contentColor = TradePrimary,
            edgePadding = 12.dp,
            indicator = { tabPositions ->
                TabRowDefaults.Indicator(
                    Modifier.tabIndicatorOffset(tabPositions[selectedTab.ordinal]),
                    color = TradePrimary,
                    height = 2.dp
                )
            }
        ) {
            ResearchLabTab.values().forEach { tab ->
                Tab(
                    selected = selectedTab == tab,
                    onClick = { selectedTab = tab },
                    text = {
                        Text(
                            text = tab.title,
                            fontSize = 13.sp,
                            fontWeight = if (selectedTab == tab) FontWeight.Bold else FontWeight.Normal,
                            color = if (selectedTab == tab) TradePrimary else TextSecondary
                        )
                    }
                )
            }
        }

        // Tab Content
        Box(
            modifier = Modifier
                .fillMaxSize()
                .weight(1f)
        ) {
            when (selectedTab) {
                ResearchLabTab.OVERVIEW -> LabOverviewTab()
                ResearchLabTab.STRATEGIES -> LabStrategiesTab()
                ResearchLabTab.ENSEMBLE -> LabEnsembleTab(
                    currentMode = selectedAggregationMode,
                    onModeChange = { selectedAggregationMode = it }
                )
                ResearchLabTab.PORTFOLIO -> LabPortfolioTab()
                ResearchLabTab.REGIMES -> LabRegimesTab()
                ResearchLabTab.ROBUSTNESS -> LabRobustnessTab()
                ResearchLabTab.EXPERIMENTS -> LabExperimentsTab()
                ResearchLabTab.REPLAY -> LabReplayTab(
                    barIndex = replayBarIndex,
                    totalBars = totalReplayBars,
                    isPlaying = isReplayPlaying,
                    speed = replaySpeed,
                    onPlayToggle = { isReplayPlaying = !isReplayPlaying },
                    onStepNext = { if (replayBarIndex < totalReplayBars - 1) replayBarIndex++ },
                    onStepPrev = { if (replayBarIndex > 0) replayBarIndex-- },
                    onReset = { replayBarIndex = 10; isReplayPlaying = false },
                    onSpeedChange = { replaySpeed = it }
                )
            }
        }
    }
}

@Composable
fun LabOverviewTab() {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Text(
                text = "Multi-Strategy Research Snapshot",
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
        }

        // Summary KPI Cards
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                SummaryCard(
                    title = "Active Strategies",
                    value = "4",
                    subtitle = "All snapshots verified",
                    modifier = Modifier.weight(1f)
                )
                SummaryCard(
                    title = "Concentration (HHI)",
                    value = "3,450",
                    subtitle = "MODERATE concentration",
                    modifier = Modifier.weight(1f)
                )
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                SummaryCard(
                    title = "Ensemble Mode",
                    value = "MAJORITY",
                    subtitle = "2 of 3 agreement",
                    modifier = Modifier.weight(1f)
                )
                SummaryCard(
                    title = "Stage Retention",
                    value = "78.4%",
                    subtitle = "Backtest to Paper",
                    modifier = Modifier.weight(1f)
                )
            }
        }

        // 5-Stage Performance Comparison
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = "5-Stage Validation Retention",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = TextPrimary
                    )
                    Text(
                        text = "Degradation tracking across development stages",
                        fontSize = 11.sp,
                        color = TextMuted
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    val stages = listOf(
                        Triple("1. Backtest (IS)", "+14.2% Return", "100+ Trades (LARGER_SAMPLE)"),
                        Triple("2. Validation", "+11.8% Return", "45 Trades (MODERATE)"),
                        Triple("3. Out-of-Sample", "+9.5% Return", "32 Trades (MODERATE)"),
                        Triple("4. Walk-Forward", "+8.2% Return", "28 Trades (LIMITED)"),
                        Triple("5. Paper Execution", "+7.4% Return", "22 Trades (LIMITED)")
                    )

                    stages.forEach { (stage, ret, trades) ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(text = stage, fontSize = 12.sp, color = TextPrimary, fontWeight = FontWeight.Medium)
                                Text(text = trades, fontSize = 10.sp, color = TextMuted)
                            }
                            Text(text = ret, fontSize = 12.sp, color = TradeProfit, fontWeight = FontWeight.Bold)
                        }
                        Divider(color = DarkBorder.copy(alpha = 0.5f), thickness = 0.5.dp)
                    }
                }
            }
        }
    }
}

@Composable
fun LabStrategiesTab() {
    val strategies = listOf(
        StrategyVersionDto(
            strategyId = "EMA_RSI",
            name = "EMA 21 + RSI 14 Trend Follower",
            version = "1.0.0",
            description = "Dual filter indicator cross with momentum confirmation",
            configHash = "a3f89e21...8b4c",
            indicatorDependencies = listOf("EMA21", "RSI14"),
            parameters = mapOf("emaPeriod" to 21, "rsiPeriod" to 14, "rsiOversold" to 30)
        ),
        StrategyVersionDto(
            strategyId = "MACD",
            name = "MACD Histogram Divergence",
            version = "1.0.0",
            description = "Fast/slow exponential difference with signal line smoothing",
            configHash = "b72c9140...91a2",
            indicatorDependencies = listOf("MACD_LINE", "MACD_SIGNAL"),
            parameters = mapOf("fast" to 12, "slow" to 26, "signal" to 9)
        ),
        StrategyVersionDto(
            strategyId = "BOLLINGER_BANDS",
            name = "Bollinger Bands Mean Reversion",
            version = "1.0.0",
            description = "Standard deviation volatility band envelopes",
            configHash = "c4491f0a...3e17",
            indicatorDependencies = listOf("BB_UPPER", "BB_MIDDLE", "BB_LOWER"),
            parameters = mapOf("period" to 20, "stdDev" to 2.0)
        )
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(strategies) { strat ->
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(text = strat.name, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                            Text(text = "ID: ${strat.strategyId}  •  v${strat.version}", fontSize = 11.sp, color = TextMuted)
                        }
                        Surface(
                            color = TradePrimary.copy(alpha = 0.15f),
                            shape = RoundedCornerShape(4.dp)
                        ) {
                            Text(
                                text = "ACTIVE",
                                fontSize = 10.sp,
                                color = TradePrimary,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))
                    Text(text = strat.description, fontSize = 11.sp, color = TextSecondary)

                    Spacer(modifier = Modifier.height(10.dp))
                    // Config Hash snapshot badge
                    Surface(
                        color = DarkSurfaceElevated,
                        shape = RoundedCornerShape(6.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(imageVector = Icons.Default.Lock, contentDescription = "Hash", tint = TextMuted, modifier = Modifier.size(12.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "SHA-256: ${strat.configHash}",
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace,
                                color = TextMuted
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                    // Wilson Score CI & Sample Quality
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Win Rate: 54.2% [CI 95%: 46.1% - 62.1%]",
                            fontSize = 11.sp,
                            color = TradeProfit,
                            fontWeight = FontWeight.Medium
                        )
                        Text(
                            text = "Sample: MODERATE",
                            fontSize = 10.sp,
                            color = TextMuted
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun LabEnsembleTab(
    currentMode: String,
    onModeChange: (String) -> Unit
) {
    val modes = listOf("MAJORITY", "WEIGHTED", "CONSENSUS", "INDEPENDENT")

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Text(text = "Ensemble Aggregation Mode", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                modes.forEach { mode ->
                    val isSelected = currentMode == mode
                    Surface(
                        color = if (isSelected) TradePrimary else DarkSurfaceElevated,
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onModeChange(mode) }
                    ) {
                        Box(
                            modifier = Modifier.padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = mode.substring(0, Math.min(4, mode.length)),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isSelected) Color.White else TextSecondary
                            )
                        }
                    }
                }
            }
        }

        // Live Aggregated Signal Card
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(text = "Current Ensemble Signal (BTC/USD)", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            color = TradeProfit.copy(alpha = 0.15f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                text = "BUY",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = TradeProfit,
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                            )
                        }

                        Column(horizontalAlignment = Alignment.End) {
                            Text(text = "Confidence: 78%", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                            Text(text = "Mode: $currentMode", fontSize = 11.sp, color = TextMuted)
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                    Text(text = "Component Votes:", fontSize = 11.sp, color = TextSecondary)
                    Spacer(modifier = Modifier.height(4.dp))

                    val votes = listOf(
                        Triple("EMA_RSI", "BUY", "75% conf  (Weight 0.34)"),
                        Triple("MACD", "BUY", "82% conf  (Weight 0.33)"),
                        Triple("BOLLINGER_BANDS", "WAIT", "50% conf  (Weight 0.33)")
                    )

                    votes.forEach { (strat, sig, details) ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 3.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(text = strat, fontSize = 11.sp, color = TextPrimary)
                            Row {
                                Text(
                                    text = sig,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (sig == "BUY") TradeProfit else TextMuted
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(text = details, fontSize = 10.sp, color = TextMuted)
                            }
                        }
                    }
                }
            }
        }

        // Conflict Detection Log
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(text = "Recent Signal Conflicts", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                        Text(text = "Auto-Logged", fontSize = 10.sp, color = DemoAmber)
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    val conflicts = listOf(
                        Triple("BTC/USD", "EMA_RSI (BUY) vs MACD (SELL)", "Resolved: WAIT (CONSENSUS)"),
                        Triple("ETH/USD", "BOLLINGER (BUY) vs EMA_RSI (SELL)", "Resolved: BUY (MAJORITY)")
                    )

                    conflicts.forEach { (asset, disagreement, resolution) ->
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 6.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(text = asset, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                Text(text = resolution, fontSize = 10.sp, color = TextSecondary)
                            }
                            Text(text = disagreement, fontSize = 10.sp, color = DemoAmber)
                        }
                        Divider(color = DarkBorder.copy(alpha = 0.5f), thickness = 0.5.dp)
                    }
                }
            }
        }
    }
}

@Composable
fun LabPortfolioTab() {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Text(text = "Portfolio Allocation & Risk Attribution", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
        }

        // HHI Gauge Card
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(text = "Concentration Risk (HHI)", fontSize = 12.sp, color = TextMuted)
                            Text(text = "3,450 / 10,000", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        }
                        Surface(
                            color = DemoAmber.copy(alpha = 0.15f),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text(
                                text = "MODERATE RISK",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = DemoAmber,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = "Total Allocated: 100.0%  (Maximum Allowable 100%)",
                        fontSize = 11.sp,
                        color = TradeProfit,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }

        // Strategy Allocations
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(text = "Component Risk Attribution", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                    Spacer(modifier = Modifier.height(8.dp))

                    val allocations = listOf(
                        Triple("EMA_RSI (BTC/USD)", "40% Allocation", "40.0% Risk Contribution"),
                        Triple("MACD (ETH/USD)", "35% Allocation", "35.0% Risk Contribution"),
                        Triple("BOLLINGER_BANDS (BTC/USD)", "25% Allocation", "25.0% Risk Contribution")
                    )

                    allocations.forEach { (name, alloc, risk) ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 5.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text(text = name, fontSize = 12.sp, color = TextPrimary, fontWeight = FontWeight.Medium)
                                Text(text = alloc, fontSize = 10.sp, color = TextMuted)
                            }
                            Text(text = risk, fontSize = 11.sp, color = TradePrimaryLight, fontWeight = FontWeight.SemiBold)
                        }
                        Divider(color = DarkBorder.copy(alpha = 0.5f), thickness = 0.5.dp)
                    }
                }
            }
        }
    }
}

@Composable
fun LabRegimesTab() {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Text(text = "Regime-Aware Behavior & Correlations", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
        }

        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(text = "Correlation Breakdown by Regime", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                    Spacer(modifier = Modifier.height(10.dp))

                    val regimes = listOf(
                        Triple("TRENDING (BULLISH/BEARISH)", "Avg Corr: +0.68", "Sample: 45 trades"),
                        Triple("RANGING (SIDEWAYS)", "Avg Corr: -0.15", "Sample: 38 trades"),
                        Triple("HIGH VOLATILITY", "Avg Corr: +0.82", "Sample: 22 trades"),
                        Triple("LOW VOLATILITY", "Avg Corr: +0.05", "Sample: 28 trades")
                    )

                    regimes.forEach { (regime, corr, sample) ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 6.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(text = regime, fontSize = 12.sp, color = TextPrimary, fontWeight = FontWeight.Medium)
                                Text(text = sample, fontSize = 10.sp, color = TextMuted)
                            }
                            Text(text = corr, fontSize = 12.sp, color = TradePrimaryLight, fontWeight = FontWeight.Bold)
                        }
                        Divider(color = DarkBorder.copy(alpha = 0.5f), thickness = 0.5.dp)
                    }
                }
            }
        }
    }
}

@Composable
fun LabRobustnessTab() {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Text(text = "Parameter Stability & Cliff Detection", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
        }

        // Stability Score
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(text = "Stability Score (EMA 21)", fontSize = 12.sp, color = TextMuted)
                            Text(text = "0.85 / 1.00", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = TradeProfit)
                        }
                        Surface(
                            color = TradeProfit.copy(alpha = 0.15f),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text(
                                text = "STABLE REGION",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = TradeProfit,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = "Sample Quality: MODERATE  •  Tested range: 17 to 25",
                        fontSize = 11.sp,
                        color = TextSecondary
                    )
                }
            }
        }

        // Cliff Warning List
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(text = "Parameter Cliffs (PARAMETER_CLIFF)", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                        Text(text = "None in Core 3", fontSize = 10.sp, color = TradeProfit)
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Adjacent sensitivity drops (>30%) are automatically flagged as severe cliffs.",
                        fontSize = 11.sp,
                        color = TextMuted
                    )
                }
            }
        }

        // Monte Carlo Percentiles
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(text = "Monte Carlo Percentile Distribution", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                    Spacer(modifier = Modifier.height(8.dp))

                    val percentiles = listOf(
                        Pair("P5 (Pessimistic)", "-1.8% Return  |  -6.2% Max DD"),
                        Pair("P25", "+2.4% Return  |  -4.1% Max DD"),
                        Pair("P50 (Median)", "+7.8% Return  |  -3.2% Max DD"),
                        Pair("P75", "+12.1% Return |  -2.1% Max DD"),
                        Pair("P95 (Optimistic)", "+18.4% Return |  -1.5% Max DD")
                    )

                    percentiles.forEach { (p, valStr) ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(text = p, fontSize = 11.sp, color = TextPrimary, fontWeight = FontWeight.Medium)
                            Text(text = valStr, fontSize = 11.sp, color = TextSecondary)
                        }
                        Divider(color = DarkBorder.copy(alpha = 0.5f), thickness = 0.5.dp)
                    }

                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Ruin Probability: 0.0%  |  Reshuffle Iterations: 1,000",
                        fontSize = 10.sp,
                        color = TextMuted
                    )
                }
            }
        }
    }
}

@Composable
fun LabExperimentsTab() {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = "Research Experiments Lab", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                Text(text = "Cloning & Tags Enabled", fontSize = 10.sp, color = TradePrimaryLight)
            }
        }

        val experiments = listOf(
            Triple("EXP_BASELINE_1", "EMA_RSI Baseline (BTC/USD)", "TAGS: [BASELINE]"),
            Triple("EXP_CLONE_1700_4f", "EMA_RSI Cloned (ETH/USD)", "TAGS: [CANDIDATE]"),
            Triple("EXP_PRODUCTION_2", "MACD Multi-Asset Parallel", "TAGS: [PRODUCTION_PARALLEL]")
        )

        items(experiments) { (id, name, tags) ->
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(text = name, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                            Text(text = "ID: $id", fontSize = 10.sp, color = TextMuted)
                        }
                        Surface(
                            color = DarkSurfaceElevated,
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text(
                                text = "CLONE",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = TradePrimaryLight,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Text(text = tags, fontSize = 11.sp, color = DemoAmber, fontWeight = FontWeight.Medium)
                }
            }
        }
    }
}

@Composable
fun LabReplayTab(
    barIndex: Int,
    totalBars: Int,
    isPlaying: Boolean,
    speed: Int,
    onPlayToggle: () -> Unit,
    onStepNext: () -> Unit,
    onStepPrev: () -> Unit,
    onReset: () -> Unit,
    onSpeedChange: (Int) -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Text(text = "Paper Trade Replay & Diagnostics", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
            Text(
                text = "Strict Anti-Lookahead Isolation: Indicators computed only up to Bar $barIndex",
                fontSize = 11.sp,
                color = TextMuted
            )
        }

        // Replay Controls Card
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Bar $barIndex of $totalBars",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )

                        // Speed selector
                        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            listOf(1, 2, 5, 10).forEach { spd ->
                                Surface(
                                    color = if (speed == spd) TradePrimary else DarkSurfaceElevated,
                                    shape = RoundedCornerShape(4.dp),
                                    modifier = Modifier.clickable { onSpeedChange(spd) }
                                ) {
                                    Text(
                                        text = "${spd}x",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (speed == spd) Color.White else TextSecondary,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Media Buttons
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(onClick = onReset) {
                            Icon(imageVector = Icons.Default.Refresh, contentDescription = "Reset", tint = TextPrimary)
                        }
                        IconButton(onClick = onStepPrev) {
                            Icon(imageVector = Icons.Default.SkipPrevious, contentDescription = "Step Prev", tint = TextPrimary)
                        }
                        FilledIconButton(
                            onClick = onPlayToggle,
                            colors = IconButtonDefaults.filledIconButtonColors(containerColor = TradePrimary)
                        ) {
                            Icon(
                                imageVector = if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                                contentDescription = "Play/Pause",
                                tint = Color.White
                            )
                        }
                        IconButton(onClick = onStepNext) {
                            Icon(imageVector = Icons.Default.SkipNext, contentDescription = "Step Next", tint = TextPrimary)
                        }
                    }
                }
            }
        }

        // Explainable Trade Diagnostics Card
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(text = "Explainable Trade Diagnostics", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                    Text(text = "Trade ID: T_SIM_BTC_8821  •  BUY @ $65,200", fontSize = 11.sp, color = TextMuted)

                    Spacer(modifier = Modifier.height(10.dp))

                    // Excursions MAE & MFE
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(text = "MAE: -0.12%  (Drawdown during trade)", fontSize = 11.sp, color = TradeLossLight)
                        Text(text = "MFE: +0.65%  (Peak profit during trade)", fontSize = 11.sp, color = TradeProfit)
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                    Text(text = "5-Step Decision Trace:", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    Spacer(modifier = Modifier.height(4.dp))

                    val trace = listOf(
                        Pair("1. Market State", "BTC/USD in TRENDING regime (ADX 28.5)"),
                        Pair("2. Indicator Evaluation", "EMA21 crossed below price; RSI 38.5 oversold"),
                        Pair("3. Strategy Logic", "EMA_RSI trigger satisfied with 78% confidence"),
                        Pair("4. Risk Check", "Max daily loss OK; capital allocated $500 (1%)"),
                        Pair("5. Execution Decision", "SIMULATED order filled with 0.01% slippage")
                    )

                    trace.forEach { (step, detail) ->
                        Column(modifier = Modifier.padding(vertical = 3.dp)) {
                            Text(text = step, fontSize = 11.sp, color = TradePrimaryLight, fontWeight = FontWeight.Medium)
                            Text(text = detail, fontSize = 10.sp, color = TextMuted)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SummaryCard(
    title: String,
    value: String,
    subtitle: String,
    modifier: Modifier = Modifier
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = DarkSurface),
        shape = RoundedCornerShape(12.dp),
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(text = title, fontSize = 11.sp, color = TextMuted)
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = value, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
            Spacer(modifier = Modifier.height(2.dp))
            Text(text = subtitle, fontSize = 10.sp, color = TextSecondary)
        }
    }
}
