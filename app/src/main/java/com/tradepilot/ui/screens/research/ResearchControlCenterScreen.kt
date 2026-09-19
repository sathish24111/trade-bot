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

private val DarkBackground = DarkBg
private val CardBackground = DarkSurface
private val SuccessGreen = TradeGreen
private val ErrorRed = TradeRed
private val WarningOrange = DemoAmber
private val AccentBlue = TradePrimary


enum class ResearchControlCenterTab(val title: String) {
    OVERVIEW("Overview"),
    JOBS("Jobs"),
    STRATEGIES("Strategies"),
    PORTFOLIO("Portfolio"),
    RISKS("Stress Matrix"),
    REGIMES("Regimes"),
    ANOMALIES("Anomalies"),
    EXPERIMENTS("Lineage"),
    REPORTS("Reports")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ResearchControlCenterScreen(
    onNavigateBack: () -> Unit = {}
) {
    var selectedTab by remember { mutableStateOf(ResearchControlCenterTab.OVERVIEW) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBackground)
    ) {
        // Top App Bar
        TopAppBar(
            title = {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "Research Control Center",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        DemoBadge()
                    }
                    Text(
                        text = "Phase 9 Autonomous Paper-Trading Orchestrator",
                        fontSize = 12.sp,
                        color = TextSecondary
                    )
                }
            },
            navigationIcon = {
                IconButton(onClick = onNavigateBack) {
                    Icon(
                        imageVector = Icons.Default.ArrowBack,
                        contentDescription = "Back",
                        tint = TextPrimary
                    )
                }
            },
            actions = {
                IconButton(onClick = { /* Refresh */ }) {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = "Refresh",
                        tint = AccentBlue
                    )
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = CardBackground
            )
        )

        // Safety Notice Banner
        Surface(
            color = Color(0xFF1E293B),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .padding(horizontal = 16.dp, vertical = 6.dp)
                    .fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(SuccessGreen)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "MODE: PAPER ONLY • REAL MONEY: FALSE • BROKER: DISCONNECTED",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextMuted,
                    fontFamily = FontFamily.Monospace
                )
            }
        }

        // 9-Tab Scrollable Row
        ScrollableTabRow(
            selectedTabIndex = selectedTab.ordinal,
            containerColor = CardBackground,
            contentColor = AccentBlue,
            edgePadding = 12.dp,
            indicator = { tabPositions ->
                TabRowDefaults.SecondaryIndicator(
                    modifier = Modifier.tabIndicatorOffset(tabPositions[selectedTab.ordinal]),
                    color = AccentBlue
                )
            }
        ) {
            ResearchControlCenterTab.values().forEach { tab ->
                Tab(
                    selected = selectedTab == tab,
                    onClick = { selectedTab = tab },
                    text = {
                        Text(
                            text = tab.title,
                            fontSize = 13.sp,
                            fontWeight = if (selectedTab == tab) FontWeight.Bold else FontWeight.Normal,
                            color = if (selectedTab == tab) AccentBlue else TextSecondary
                        )
                    }
                )
            }
        }

        // Tab Content
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
        ) {
            when (selectedTab) {
                ResearchControlCenterTab.OVERVIEW -> ControlCenterOverviewTab()
                ResearchControlCenterTab.JOBS -> JobsOrchestratorTab()
                ResearchControlCenterTab.STRATEGIES -> StrategyMatrixTab()
                ResearchControlCenterTab.PORTFOLIO -> PortfolioWhatIfTab()
                ResearchControlCenterTab.RISKS -> StressMatrixTab()
                ResearchControlCenterTab.REGIMES -> RegimeTransitionsTab()
                ResearchControlCenterTab.ANOMALIES -> AnomalyDiagnosticsTab()
                ResearchControlCenterTab.EXPERIMENTS -> ExperimentLineageTab()
                ResearchControlCenterTab.REPORTS -> AutomatedReportsTab()
            }
        }
    }
}

@Composable
fun ControlCenterOverviewTab() {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = CardBackground),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Autonomous Orchestrator Status",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        MetricBadge("Queue State", "ACTIVE", SuccessGreen)
                        MetricBadge("Active Jobs", "2 Running", AccentBlue)
                        MetricBadge("Completed", "14 Stages", TextPrimary)
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "14-Stage research verification pipeline executes continuously across paper strategies without look-ahead bias.",
                        fontSize = 12.sp,
                        color = TextSecondary
                    )
                }
            }
        }

        item {
            Text(
                text = "Autonomous Research Triggers",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
        }

        item {
            RecommendationCard(
                trigger = "SIGNIFICANT_DRIFT",
                reason = "Rolling win rate dropped > 15% in last 20 paper trades",
                suggestedAction = "Run Walk-Forward Re-Optimization",
                priority = "HIGH"
            )
        }

        item {
            RecommendationCard(
                trigger = "PARAMETER_CLIFF",
                reason = "Parameter stability scan identified fragile neighbor drops",
                suggestedAction = "Schedule 2D Cost x Slippage Stress Matrix",
                priority = "NORMAL"
            )
        }
    }
}

@Composable
fun JobsOrchestratorTab() {
    val sampleJobs = listOf(
        ResearchJobDto(
            jobId = "JOB_101",
            experimentId = "EXP_01",
            type = "FULL_RESEARCH_PIPELINE",
            priority = "HIGH",
            status = "RUNNING",
            progress = 70,
            createdAt = "2026-09-18 10:00",
            lastCompletedStage = "PARAMETER_STABILITY"
        ),
        ResearchJobDto(
            jobId = "JOB_102",
            experimentId = "EXP_02",
            type = "WALK_FORWARD",
            priority = "NORMAL",
            status = "QUEUED",
            progress = 0,
            createdAt = "2026-09-18 10:15"
        ),
        ResearchJobDto(
            jobId = "JOB_103",
            experimentId = "EXP_03",
            type = "MONTE_CARLO",
            priority = "LOW",
            status = "COMPLETED",
            progress = 100,
            createdAt = "2026-09-18 09:30"
        )
    )

    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Priority Research Queue",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Button(
                    onClick = { /* Submit new job */ },
                    colors = ButtonDefaults.buttonColors(containerColor = AccentBlue),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("+ New Job", fontSize = 12.sp)
                }
            }
        }

        items(sampleJobs) { job ->
            Card(
                colors = CardDefaults.cardColors(containerColor = CardBackground),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = job.jobId,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary,
                            fontFamily = FontFamily.Monospace
                        )
                        BadgeChip(
                            text = job.status,
                            color = when (job.status) {
                                "COMPLETED" -> SuccessGreen
                                "RUNNING" -> AccentBlue
                                "PAUSED" -> WarningOrange
                                else -> TextMuted
                            }
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Type: ${job.type} • Priority: ${job.priority}",
                        fontSize = 12.sp,
                        color = TextSecondary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    LinearProgressIndicator(
                        progress = { job.progress / 100f },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(6.dp)
                            .clip(RoundedCornerShape(3.dp)),
                        color = AccentBlue,
                        trackColor = Color(0xFF334155)
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Progress: ${job.progress}% • Stage: ${job.lastCompletedStage ?: "PENDING"}",
                        fontSize = 11.sp,
                        color = TextMuted
                    )
                }
            }
        }
    }
}

@Composable
fun StrategyMatrixTab() {
    val sampleMatrix = listOf(
        StrategyEvidenceItemDto(
            strategyId = "EMA_RSI",
            name = "EMA 21 + RSI 14 Trend",
            datasetQuality = "VALID",
            sampleSizeRating = "MODERATE",
            sampleTradesCount = 45,
            oosTested = true,
            walkForwardTested = true,
            stressTested = true,
            monteCarloSimulated = true,
            parameterStabilityTested = true,
            paperDataQuality = "MODERATE",
            driftStatus = "STABLE",
            overallEvidenceLevel = "SUBSTANTIAL"
        ),
        StrategyEvidenceItemDto(
            strategyId = "MACD",
            name = "MACD Signal Divergence",
            datasetQuality = "VALID",
            sampleSizeRating = "LIMITED",
            sampleTradesCount = 28,
            oosTested = true,
            walkForwardTested = false,
            stressTested = true,
            monteCarloSimulated = true,
            parameterStabilityTested = false,
            paperDataQuality = "LIMITED",
            driftStatus = "WATCH",
            overallEvidenceLevel = "MODERATE"
        )
    )

    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Text(
                text = "Strategy Evidence Matrix",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
            Text(
                text = "Comprehensive multi-factor validation rating across test stages",
                fontSize = 12.sp,
                color = TextSecondary
            )
        }

        items(sampleMatrix) { item ->
            Card(
                colors = CardDefaults.cardColors(containerColor = CardBackground),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(text = item.name, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        BadgeChip(
                            text = item.overallEvidenceLevel,
                            color = when (item.overallEvidenceLevel) {
                                "SUBSTANTIAL" -> SuccessGreen
                                "MODERATE" -> AccentBlue
                                else -> WarningOrange
                            }
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Trades: ${item.sampleTradesCount} • Drift: ${item.driftStatus}",
                        fontSize = 12.sp,
                        color = TextSecondary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        FeatureTag("OOS", item.oosTested)
                        FeatureTag("Walk-Forward", item.walkForwardTested)
                        FeatureTag("Stress", item.stressTested)
                        FeatureTag("Monte Carlo", item.monteCarloSimulated)
                        FeatureTag("Stability", item.parameterStabilityTested)
                    }
                }
            }
        }
    }
}

@Composable
fun PortfolioWhatIfTab() {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text(
            text = "Portfolio What-If Counterfactual Simulator",
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            color = TextPrimary
        )

        Card(
            colors = CardDefaults.cardColors(containerColor = CardBackground),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(text = "Scenario: Transaction Cost & Slippage Surge", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                Spacer(modifier = Modifier.height(8.dp))
                Text(text = "Models 2.0x fee escalation and +15 bps execution slippage shock on paper portfolio balance.", fontSize = 12.sp, color = TextSecondary)
                Spacer(modifier = Modifier.height(14.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    MetricBadge("Baseline Equity", "$10,000", TextPrimary)
                    MetricBadge("Simulated", "$9,650", WarningOrange)
                    MetricBadge("Equity Delta", "-3.5%", ErrorRed)
                }
                Spacer(modifier = Modifier.height(10.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    MetricBadge("Baseline Drawdown", "4.2%", TextPrimary)
                    MetricBadge("Stressed Drawdown", "6.8%", ErrorRed)
                    MetricBadge("Status", "RESILIENT", SuccessGreen)
                }
            }
        }
    }
}

@Composable
fun StressMatrixTab() {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text(
            text = "2D Cost × Slippage Stress Matrix",
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            color = TextPrimary
        )
        Text(
            text = "Evaluates strategy fragility across fee escalations (0-50 bps) and slippage friction (0-30 bps).",
            fontSize = 12.sp,
            color = TextSecondary
        )

        Card(
            colors = CardDefaults.cardColors(containerColor = CardBackground),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(text = "Grid Robustness: ROBUST", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = SuccessGreen)
                Spacer(modifier = Modifier.height(10.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    MetricBadge("0 bps Fee", "+18.5% Return", SuccessGreen)
                    MetricBadge("20 bps Fee", "+12.2% Return", AccentBlue)
                    MetricBadge("50 bps Fee", "+6.4% Return", WarningOrange)
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Break-even friction threshold: ~85 bps total simulated round-trip costs.",
                    fontSize = 11.sp,
                    color = TextMuted
                )
            }
        }
    }
}

@Composable
fun RegimeTransitionsTab() {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text(
            text = "Regime Transitions & Structural Triggers",
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            color = TextPrimary
        )

        Card(
            colors = CardDefaults.cardColors(containerColor = CardBackground),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(text = "BTC/USD Transition", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    BadgeChip(text = "85% Conf", color = AccentBlue)
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text(text = "RANGING ➔ TRENDING (Bullish)", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = SuccessGreen)
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = "Triggered research recommendations for EMA_RSI and MACD strategies.", fontSize = 12.sp, color = TextSecondary)
            }
        }
    }
}

@Composable
fun AnomalyDiagnosticsTab() {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text(
            text = "Root-Cause Anomaly Investigations",
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            color = TextPrimary
        )

        Card(
            colors = CardDefaults.cardColors(containerColor = CardBackground),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text(text = "Anomaly: Paper Slippage Divergence", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                Spacer(modifier = Modifier.height(6.dp))
                Text(text = "Classified Root Cause: STRATEGY (Likely)", fontSize = 12.sp, color = WarningOrange)
                Spacer(modifier = Modifier.height(6.dp))
                Text(text = "Divergence attributable to volatility clustering during session open.", fontSize = 12.sp, color = TextSecondary)
                Spacer(modifier = Modifier.height(8.dp))
                Text(text = "Remediation: Schedule 2D Parameter Stability scan", fontSize = 11.sp, color = AccentBlue)
            }
        }
    }
}

@Composable
fun ExperimentLineageTab() {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text(
            text = "Experiment Lineage & Config Diffing",
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            color = TextPrimary
        )

        Card(
            colors = CardDefaults.cardColors(containerColor = CardBackground),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text(text = "Root: EXP_ROOT (Baseline EMA 21)", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = "└── Child 1: EXP_01 (Fast EMA 14, RSI 14)", fontSize = 12.sp, color = TextSecondary)
                Text(text = "    └── Child 2: EXP_02 (StopLoss tightened to 1.5%)", fontSize = 12.sp, color = AccentBlue)
                Spacer(modifier = Modifier.height(8.dp))
                Text(text = "Diff: 2 parameters modified between EXP_ROOT and EXP_02.", fontSize = 11.sp, color = TextMuted)
            }
        }
    }
}

@Composable
fun AutomatedReportsTab() {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text(
            text = "Automated Daily & Weekly Reports",
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            color = TextPrimary
        )

        Card(
            colors = CardDefaults.cardColors(containerColor = CardBackground),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text(text = "Daily Report: 2026-09-18", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                Spacer(modifier = Modifier.height(6.dp))
                Text(text = "Health: OPTIMAL • 13 Paper Trades • 61.54% Win Rate", fontSize = 12.sp, color = SuccessGreen)
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = "Research: 2 Jobs Triggered, 0 Critical Drift Alerts.", fontSize = 12.sp, color = TextSecondary)
            }
        }
    }
}

@Composable
fun RecommendationCard(
    trigger: String,
    reason: String,
    suggestedAction: String,
    priority: String
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = CardBackground),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = trigger, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = WarningOrange)
                BadgeChip(
                    text = priority,
                    color = if (priority == "HIGH") ErrorRed else AccentBlue
                )
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(text = reason, fontSize = 12.sp, color = TextSecondary)
            Spacer(modifier = Modifier.height(6.dp))
            Text(text = "Suggested Research: $suggestedAction", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
        }
    }
}

@Composable
fun MetricBadge(label: String, value: String, color: Color) {
    Column {
        Text(text = label, fontSize = 10.sp, color = TextMuted)
        Spacer(modifier = Modifier.height(2.dp))
        Text(text = value, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = color)
    }
}

@Composable
fun BadgeChip(text: String, color: Color) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(color.copy(alpha = 0.15f))
            .border(1.dp, color.copy(alpha = 0.4f), RoundedCornerShape(6.dp))
            .padding(horizontal = 8.dp, vertical = 3.dp)
    ) {
        Text(
            text = text,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            color = color
        )
    }
}

@Composable
fun FeatureTag(label: String, active: Boolean) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(4.dp))
            .background(if (active) SuccessGreen.copy(alpha = 0.15f) else Color(0xFF334155))
            .padding(horizontal = 6.dp, vertical = 2.dp)
    ) {
        Text(
            text = label,
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold,
            color = if (active) SuccessGreen else TextMuted
        )
    }
}
