package com.tradepilot.ui.screens.monitoring

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tradepilot.ui.theme.*

enum class MonitoringTab(val title: String) {
    LIVE_MONITOR("Live"),
    SIGNALS("Signals"),
    RISK("Risk"),
    STRATEGY_HEALTH("Strategies"),
    ALERTS("Alerts"),
    SYSTEM_HEALTH("System"),
    PROVIDERS("Providers")
}

@Composable
fun MonitoringScreen() {
    var selectedTab by remember { mutableStateOf(MonitoringTab.LIVE_MONITOR) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBg)
    ) {
        // Persistent Mandatory Safety Banner
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = DemoAmberBg,
            border = androidx.compose.foundation.BorderStroke(1.dp, DemoAmber.copy(alpha = 0.5f))
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Shield,
                    contentDescription = "Paper Trading",
                    tint = DemoAmber,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "PAPER MODE — SIMULATED TRADES — NO REAL MONEY",
                    color = DemoAmber,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.5.sp
                )
            }
        }

        // Monitoring Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Intelligence & Monitoring",
                    color = TextPrimary,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Real-time drift detection, signals & risk guard",
                    color = TextSecondary,
                    fontSize = 12.sp
                )
            }
            Surface(
                color = TradeGreenBg,
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, TradeGreen.copy(alpha = 0.4f))
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(6.dp)
                            .clip(RoundedCornerShape(3.dp))
                            .background(TradeGreen)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "ONLINE",
                        color = TradeGreen,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // Horizontal Tabs
        ScrollableTabRow(
            selectedTabIndex = selectedTab.ordinal,
            containerColor = DarkSurface,
            contentColor = TradePrimaryLight,
            edgePadding = 12.dp,
            indicator = { tabPositions ->
                TabRowDefaults.SecondaryIndicator(
                    modifier = Modifier.tabIndicatorOffset(tabPositions[selectedTab.ordinal]),
                    color = TradePrimaryLight,
                    height = 2.dp
                )
            }
        ) {
            MonitoringTab.values().forEach { tab ->
                Tab(
                    selected = selectedTab == tab,
                    onClick = { selectedTab = tab },
                    text = {
                        Text(
                            text = tab.title,
                            fontSize = 13.sp,
                            fontWeight = if (selectedTab == tab) FontWeight.Bold else FontWeight.Normal,
                            color = if (selectedTab == tab) TradePrimaryLight else TextMuted
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
                MonitoringTab.LIVE_MONITOR -> LiveMonitorTab()
                MonitoringTab.SIGNALS -> SignalsMonitorTab()
                MonitoringTab.RISK -> RiskDashboardTab()
                MonitoringTab.STRATEGY_HEALTH -> StrategyHealthTab()
                MonitoringTab.ALERTS -> AlertsTab()
                MonitoringTab.SYSTEM_HEALTH -> SystemHealthTab()
                MonitoringTab.PROVIDERS -> ProviderHealthTab()
            }
        }
    }
}

// 1. LIVE MONITOR TAB
@Composable
fun LiveMonitorTab() {
    LazyColumn(
        verticalArrangement = Arrangement.spacedBy(14.dp),
        modifier = Modifier.fillMaxSize()
    ) {
        item {
            // Price & Active Signal Card
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated),
                border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("BTC/USD (Simulated)", color = TextSecondary, fontSize = 13.sp)
                        Surface(
                            color = TradeGreenBg,
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                "COMPLETED BAR SIGNAL",
                                color = TradeGreen,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Bottom
                    ) {
                        Column {
                            Text(
                                text = "$50,240.50",
                                color = TextPrimary,
                                fontSize = 26.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "+$240.50 (+0.48%)",
                                color = TradeProfit,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                        Surface(
                            color = TradeProfit.copy(alpha = 0.15f),
                            shape = RoundedCornerShape(8.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, TradeProfit.copy(alpha = 0.5f))
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.ArrowUpward, contentDescription = "Buy", tint = TradeProfit, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("BUY (85%)", color = TradeProfit, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }

        item {
            // Metrics Grid (Realized P&L, Daily P&L, Drawdown, Risk Utilization)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                MetricCard(Modifier.weight(1f), "Daily P&L", "$320.00", TradeProfit, "3 Trades")
                MetricCard(Modifier.weight(1f), "Drawdown", "1.2%", TextSecondary, "Peak $10,320")
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                MetricCard(Modifier.weight(1f), "Risk Utilization", "32.0%", TradePrimaryLight, "Max 100%")
                MetricCard(Modifier.weight(1f), "Gross Exposure", "15.0%", TextSecondary, "Limit 80%")
            }
        }

        item {
            // Active Position Card
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text("Active Paper Position", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("BTC/USD Long (EMA_RSI)", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        Text("+$45.00 (+0.9%)", color = TradeProfit, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Entry: $50,000.00 | Size: $1,500.00 | SL: $49,500.00", color = TextMuted, fontSize = 11.sp)
                }
            }
        }
    }
}

// 2. SIGNALS MONITOR TAB
@Composable
fun SignalsMonitorTab() {
    LazyColumn(
        verticalArrangement = Arrangement.spacedBy(12.dp),
        modifier = Modifier.fillMaxSize()
    ) {
        item {
            // Summary banner
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated),
                border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text("Generated Signals", color = TextSecondary, fontSize = 11.sp)
                        Text("18", color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                    }
                    Column {
                        Text("Executed", color = TextSecondary, fontSize = 11.sp)
                        Text("14 (77.8%)", color = TradeProfit, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                    }
                    Column {
                        Text("Signal Win Rate", color = TextSecondary, fontSize = 11.sp)
                        Text("64.3%", color = TradePrimaryLight, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        items(listOf(
            Triple("SIG-101", "BUY", "BTC/USD • EMA_RSI • Conf 85% • Regime: TRENDING"),
            Triple("SIG-102", "SELL", "ETH/USD • MACD • Conf 72% • Regime: RANGING"),
            Triple("SIG-103", "BUY", "EUR/USD • BOLLINGER • Conf 80% • Regime: LOW_VOL")
        )) { (id, dir, details) ->
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
                shape = RoundedCornerShape(10.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(id, color = TextMuted, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                            Spacer(modifier = Modifier.width(8.dp))
                            Surface(
                                color = if (dir == "BUY") TradeProfit.copy(alpha = 0.15f) else TradeLoss.copy(alpha = 0.15f),
                                shape = RoundedCornerShape(4.dp)
                            ) {
                                Text(
                                    dir,
                                    color = if (dir == "BUY") TradeProfit else TradeLoss,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(details, color = TextSecondary, fontSize = 12.sp)
                    }
                    Text("EXECUTED", color = TradeGreen, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

// 3. RISK DASHBOARD TAB
@Composable
fun RiskDashboardTab() {
    LazyColumn(
        verticalArrangement = Arrangement.spacedBy(14.dp),
        modifier = Modifier.fillMaxSize()
    ) {
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated),
                border = androidx.compose.foundation.BorderStroke(1.dp, TradeGreen.copy(alpha = 0.5f)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Risk State", color = TextSecondary, fontSize = 13.sp)
                        Surface(
                            color = TradeGreenBg,
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                "NORMAL",
                                color = TradeGreen,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("Risk Utilization: 32%", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    Spacer(modifier = Modifier.height(6.dp))
                    LinearProgressIndicator(
                        progress = { 0.32f },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(RoundedCornerShape(4.dp)),
                        color = TradeGreen,
                        trackColor = DarkBorder
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Daily Loss: $160 / $500 (Limit: 5%)", color = TextMuted, fontSize = 12.sp)
                }
            }
        }

        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text("Risk Boundaries & Guardrails", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(10.dp))
                    RiskLimitRow("Max Daily Loss", "5.0%", "Current: 1.6%", TradeGreen)
                    RiskLimitRow("Max Drawdown", "10.0%", "Current: 1.2%", TradeGreen)
                    RiskLimitRow("Portfolio Exposure", "80.0%", "Current: 15.0%", TradeGreen)
                    RiskLimitRow("Max Concurrent Positions", "3 Positions", "Active: 1", TradeGreen)
                }
            }
        }
    }
}

@Composable
fun RiskLimitRow(title: String, limit: String, status: String, statusColor: Color) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(title, color = TextSecondary, fontSize = 13.sp)
            Text(status, color = statusColor, fontSize = 11.sp, fontWeight = FontWeight.Medium)
        }
        Text(limit, color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
    }
}

// 4. STRATEGY HEALTH & ADAPTIVE CONTROLS TAB
@Composable
fun StrategyHealthTab() {
    LazyColumn(
        verticalArrangement = Arrangement.spacedBy(12.dp),
        modifier = Modifier.fillMaxSize()
    ) {
        item {
            // Adaptive Controls Header
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated),
                border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.SettingsSuggest, contentDescription = null, tint = TradePrimaryLight)
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("Adaptive Strategy Policies", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Spacer(modifier = Modifier.width(8.dp))
                            Surface(color = TradeGreenBg, shape = RoundedCornerShape(4.dp)) {
                                Text("AUTO POLICY ACTIVE", color = TradeGreen, fontSize = 9.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                            }
                        }
                        Text("Dynamic paper risk throttling & out-of-sample drift protections active", color = TextMuted, fontSize = 11.sp)
                    }
                }
            }
        }

        items(listOf(
            StrategyHealthItem("EMA_RSI", "STABLE", 58.0, 56.5, -1.5, true, "100% (Normal)", "Operating within parameters"),
            StrategyHealthItem("MACD", "WATCH", 54.0, 48.0, -6.0, true, "75% Throttle", "Moderate drift: sizing scaled to 0.75x"),
            StrategyHealthItem("BOLLINGER_BANDS", "STABLE", 62.0, 61.0, -1.0, true, "100% (Normal)", "Operating within parameters"),
            StrategyHealthItem("MULTI_INDICATOR", "SIGNIFICANT", 65.0, 50.0, -15.0, false, "PAUSED", "Auto-paused: Significant drift exceeded policy threshold")
        )) { item ->
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(item.name, color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                            Text("State: ${if (item.enabled) "ACTIVE" else "PAUSED"}", color = if (item.enabled) TradeGreen else TradeLoss, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                        }
                        Surface(
                            color = when (item.driftClass) {
                                "STABLE" -> TradeGreenBg
                                "WATCH" -> DemoAmberBg
                                else -> TradeRedBg
                            },
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text(
                                item.driftClass,
                                color = when (item.driftClass) {
                                    "STABLE" -> TradeGreen
                                    "WATCH" -> DemoAmber
                                    else -> TradeRed
                                },
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Backtest: ${item.btWinRate}%", color = TextSecondary, fontSize = 12.sp)
                        Text("Paper: ${item.paperWinRate}%", color = TextPrimary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        Text("Drift: ${item.drift}%", color = if (item.drift < -5) TradeLoss else TradeProfit, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }

                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Risk Multiplier: ${item.throttle}", color = TradePrimaryLight, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    }

                    Spacer(modifier = Modifier.height(4.dp))
                    Text(item.reason, color = TextMuted, fontSize = 11.sp)
                }
            }
        }
    }
}

data class StrategyHealthItem(
    val name: String,
    val driftClass: String,
    val btWinRate: Double,
    val paperWinRate: Double,
    val drift: Double,
    val enabled: Boolean,
    val throttle: String = "100%",
    val reason: String = "Operating normally"
)

// 5. PROVIDER HEALTH TAB (Phase 7)
@Composable
fun ProviderHealthTab() {
    LazyColumn(
        verticalArrangement = Arrangement.spacedBy(12.dp),
        modifier = Modifier.fillMaxSize()
    ) {
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated),
                border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text("READ-ONLY MARKET PROVIDERS", color = TextMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Public Crypto WebSocket Stream", color = TextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Status: HEALTHY", color = TradeGreen, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        Text("Latency: 8 ms", color = TradePrimaryLight, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        Text("Uptime: 99.8%", color = TradeGreen, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text("Provider Diagnostic Metrics", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(10.dp))
                    RiskLimitRow("Active Provider", "crypto-ws-public", "Role: Primary Stream", TradeGreen)
                    RiskLimitRow("REST Fallback", "STANDBY", "Binance API", TradeGreen)
                    RiskLimitRow("Failover Count", "0 events", "0 Failovers", TradeGreen)
                    RiskLimitRow("Reconnection Count", "0 retries", "Exponential Backoff", TradeGreen)
                    RiskLimitRow("Data Quality Gate", "0 rejected", "OHLC & Monotonic OK", TradeGreen)
                }
            }
        }
    }
}

// 5. ALERTS TAB
@Composable
fun AlertsTab() {
    LazyColumn(
        verticalArrangement = Arrangement.spacedBy(10.dp),
        modifier = Modifier.fillMaxSize()
    ) {
        items(listOf(
            Triple("STALE_MARKET_DATA", "INFO", "Market feed continuous and fresh. 0 data gaps detected."),
            Triple("STRATEGY_DRIFT", "WARNING", "MACD strategy paper win rate deviated by -6% from backtest expectation."),
            Triple("SYSTEM_RECOVERY", "INFO", "System recovered cleanly on startup. TRADING_MODE=PAPER strictly enforced.")
        )) { (type, sev, msg) ->
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                border = androidx.compose.foundation.BorderStroke(
                    1.dp,
                    if (sev == "WARNING") DemoAmber.copy(alpha = 0.5f) else DarkBorder
                ),
                shape = RoundedCornerShape(10.dp)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(type, color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        Text(sev, color = if (sev == "WARNING") DemoAmber else TradePrimaryLight, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(msg, color = TextSecondary, fontSize = 12.sp)
                }
            }
        }
    }
}

// 6. SYSTEM HEALTH TAB
@Composable
fun SystemHealthTab() {
    val components = listOf(
        Pair("Backend API Server", "ONLINE • Latency: 1ms"),
        Pair("MySQL Database", "ONLINE • Latency: 3ms"),
        Pair("Simulated Market Feed", "ONLINE • 0 Missing Bars"),
        Pair("WebSocket Broadcast", "ONLINE • Seq #1842"),
        Pair("Strategy Engine", "ONLINE • 4 Strategies Ready"),
        Pair("Risk & Loss Guard", "ONLINE • Limits Active"),
        Pair("Paper Execution Engine", "ONLINE • 100% Demo/Paper")
    )

    LazyColumn(
        verticalArrangement = Arrangement.spacedBy(10.dp),
        modifier = Modifier.fillMaxSize()
    ) {
        items(components) { (name, status) ->
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
                shape = RoundedCornerShape(10.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(name, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        Text(status, color = TextMuted, fontSize = 11.sp)
                    }
                    Icon(Icons.Default.CheckCircle, contentDescription = "Online", tint = TradeGreen, modifier = Modifier.size(18.dp))
                }
            }
        }
    }
}

@Composable
fun MetricCard(modifier: Modifier = Modifier, title: String, value: String, valueColor: Color, subtitle: String) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = DarkSurface),
        border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
        shape = RoundedCornerShape(10.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(title, color = TextMuted, fontSize = 11.sp)
            Spacer(modifier = Modifier.height(4.dp))
            Text(value, color = valueColor, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(2.dp))
            Text(subtitle, color = TextSecondary, fontSize = 10.sp)
        }
    }
}
