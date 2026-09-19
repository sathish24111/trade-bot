package com.tradepilot.ui.screens.notifications

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tradepilot.data.remote.ApiClient
import com.tradepilot.data.remote.NotificationPreferencesDto
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationSettingsScreen(
    onNavigateBack: () -> Unit = {}
) {
    val coroutineScope = rememberCoroutineScope()
    var masterEnabled by remember { mutableStateOf(true) }
    var criticalRisk by remember { mutableStateOf(true) }
    var strategyDrift by remember { mutableStateOf(true) }
    var marketData by remember { mutableStateOf(true) }
    var systemHealth by remember { mutableStateOf(true) }
    var paperTrade by remember { mutableStateOf(true) }
    var experiments by remember { mutableStateOf(true) }
    var isLoading by remember { mutableStateOf(false) }
    var saveStatus by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        isLoading = true
        try {
            val res = ApiClient.apiService.getNotificationPreferences()
            if (res.isSuccessful && res.body()?.success == true) {
                res.body()?.preferences?.let { p ->
                    masterEnabled = p.notificationsEnabled
                    criticalRisk = p.criticalRisk
                    strategyDrift = p.strategyDrift
                    marketData = p.marketData
                    systemHealth = p.systemHealth
                    paperTrade = p.paperTrade
                    experiments = p.experiment
                }
            }
        } catch (e: Exception) {}
        isLoading = false
    }

    fun savePreferences() {
        coroutineScope.launch {
            saveStatus = "Saving..."
            try {
                val req = NotificationPreferencesDto(
                    notificationsEnabled = masterEnabled,
                    criticalRisk = criticalRisk,
                    strategyDrift = strategyDrift,
                    marketData = marketData,
                    systemHealth = systemHealth,
                    paperTrade = paperTrade,
                    experiment = experiments
                )
                val res = ApiClient.apiService.updateNotificationPreferences(req)
                if (res.isSuccessful && res.body()?.success == true) {
                    saveStatus = "Preferences synchronized with server"
                } else {
                    saveStatus = "Saved locally"
                }
            } catch (e: Exception) {
                saveStatus = "Saved locally (offline)"
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Notification Settings", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF0F172A),
                    titleContentColor = Color.White,
                    navigationIconContentColor = Color.White
                )
            )
        },
        containerColor = Color(0xFF0F172A)
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            // Safety Banner
            Card(
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Shield, contentDescription = null, tint = Color(0xFF38BDF8))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        "PAPER MODE — SIMULATED TRADES — NO REAL MONEY",
                        color = Color(0xFF38BDF8),
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp
                    )
                }
            }

            Text(
                "Push Notification Preferences",
                color = Color.White,
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp,
                modifier = Modifier.padding(bottom = 8.dp)
            )
            Text(
                "Configure which paper-trading and research monitoring alerts are delivered to this device.",
                color = Color(0xFF94A3B8),
                fontSize = 13.sp,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            // Master Toggle
            Card(
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("All Notifications", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Text("Master switch for all paper alerts", color = Color(0xFF94A3B8), fontSize = 12.sp)
                    }
                    Switch(
                        checked = masterEnabled,
                        onCheckedChange = {
                            masterEnabled = it
                            savePreferences()
                        },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = Color.White,
                            checkedTrackColor = Color(0xFF3B82F6)
                        )
                    )
                }
            }

            // Categories Card
            Card(
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("ALERT CATEGORIES", color = Color(0xFF64748B), fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(12.dp))

                    NotificationRow(
                        title = "Critical Risk Limits",
                        desc = "Max daily loss, drawdown limit reached, high exposure",
                        checked = criticalRisk && masterEnabled,
                        enabled = masterEnabled,
                        onCheckedChange = { criticalRisk = it; savePreferences() }
                    )
                    Divider(color = Color(0xFF334155), modifier = Modifier.padding(vertical = 8.dp))

                    NotificationRow(
                        title = "Strategy Drift",
                        desc = "Expectancy divergence, win rate drops, out-of-sample drift",
                        checked = strategyDrift && masterEnabled,
                        enabled = masterEnabled,
                        onCheckedChange = { strategyDrift = it; savePreferences() }
                    )
                    Divider(color = Color(0xFF334155), modifier = Modifier.padding(vertical = 8.dp))

                    NotificationRow(
                        title = "Market Data & Providers",
                        desc = "Provider failover, stream disconnection, high latency",
                        checked = marketData && masterEnabled,
                        enabled = masterEnabled,
                        onCheckedChange = { marketData = it; savePreferences() }
                    )
                    Divider(color = Color(0xFF334155), modifier = Modifier.padding(vertical = 8.dp))

                    NotificationRow(
                        title = "System Health",
                        desc = "Component outages, DB latency, heartbeat alerts",
                        checked = systemHealth && masterEnabled,
                        enabled = masterEnabled,
                        onCheckedChange = { systemHealth = it; savePreferences() }
                    )
                    Divider(color = Color(0xFF334155), modifier = Modifier.padding(vertical = 8.dp))

                    NotificationRow(
                        title = "Paper Trades",
                        desc = "Simulated orders executed, stops triggered, trade closed",
                        checked = paperTrade && masterEnabled,
                        enabled = masterEnabled,
                        onCheckedChange = { paperTrade = it; savePreferences() }
                    )
                    Divider(color = Color(0xFF334155), modifier = Modifier.padding(vertical = 8.dp))

                    NotificationRow(
                        title = "Paper Experiments",
                        desc = "Experiment started, milestones reached, experiment complete",
                        checked = experiments && masterEnabled,
                        enabled = masterEnabled,
                        onCheckedChange = { experiments = it; savePreferences() }
                    )
                }
            }

            if (saveStatus != null) {
                Text(
                    text = saveStatus ?: "",
                    color = Color(0xFF10B981),
                    fontSize = 13.sp,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }
        }
    }
}

@Composable
private fun NotificationRow(
    title: String,
    desc: String,
    checked: Boolean,
    enabled: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(title, color = if (enabled) Color.White else Color(0xFF64748B), fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
            Text(desc, color = Color(0xFF94A3B8), fontSize = 12.sp)
        }
        Switch(
            checked = checked,
            enabled = enabled,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = Color.White,
                checkedTrackColor = Color(0xFF3B82F6)
            )
        )
    }
}
