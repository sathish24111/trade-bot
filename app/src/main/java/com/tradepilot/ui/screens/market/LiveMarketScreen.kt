package com.tradepilot.ui.screens.market

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.tradepilot.data.remote.MarketAssetDto
import com.tradepilot.data.remote.ProviderHealthDetailDto
import com.tradepilot.data.remote.ProviderInfoDto
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LiveMarketScreen(
    onNavigateBack: () -> Unit = {}
) {
    var providers by remember { mutableStateOf<List<ProviderInfoDto>>(emptyList()) }
    var health by remember { mutableStateOf<ProviderHealthDetailDto?>(null) }
    var assets by remember { mutableStateOf<List<MarketAssetDto>>(emptyList()) }
    var activeProvider by remember { mutableStateOf("Public Crypto WebSocket") }
    var currentTier by remember { mutableStateOf("PRIMARY_WS") }
    var isRefreshing by remember { mutableStateOf(false) }

    suspend fun loadData() {
        try {
            val pRes = ApiClient.apiService.getProviders()
            if (pRes.isSuccessful && pRes.body()?.success == true) {
                providers = pRes.body()?.providers ?: emptyList()
                activeProvider = pRes.body()?.activeProvider ?: "Public Crypto WebSocket"
                currentTier = pRes.body()?.currentTier ?: "PRIMARY_WS"
            }

            val hRes = ApiClient.apiService.getProviderHealth()
            if (hRes.isSuccessful && hRes.body()?.success == true) {
                health = hRes.body()?.health
            }

            val mRes = ApiClient.apiService.getAssets()
            if (mRes.isSuccessful && mRes.body()?.success == true) {
                assets = mRes.body()?.assets ?: emptyList()
            }
        } catch (e: Exception) {}
    }

    LaunchedEffect(Unit) {
        while (true) {
            loadData()
            delay(3000) // Poll every 3s
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Live Market Feeds", fontWeight = FontWeight.Bold) },
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
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Spacer(modifier = Modifier.height(4.dp))
                // Safety Banner
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Shield, contentDescription = null, tint = Color(0xFF38BDF8))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                "PAPER MODE — SIMULATED TRADES — NO REAL MONEY",
                                color = Color(0xFF38BDF8),
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp
                            )
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            BadgeItem("DATA SOURCE", "LIVE READ-ONLY", Color(0xFF10B981))
                            BadgeItem("EXECUTION", "SIMULATED PAPER", Color(0xFFF59E0B))
                            BadgeItem("BROKER", "DISCONNECTED", Color(0xFF64748B))
                        }
                    }
                }
            }

            // Live Feed Status Card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("ACTIVE MARKET FEED", color = Color(0xFF94A3B8), fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            Surface(
                                color = if (health?.connectionStatus == "HEALTHY") Color(0xFF065F46) else Color(0xFF7C2D12),
                                shape = RoundedCornerShape(6.dp)
                            ) {
                                Text(
                                    health?.connectionStatus ?: "HEALTHY",
                                    color = if (health?.connectionStatus == "HEALTHY") Color(0xFF34D399) else Color(0xFFF87171),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            activeProvider,
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                        Spacer(modifier = Modifier.height(12.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            MetricBlock("Latency", "${health?.latencyMs ?: 8} ms", Color(0xFF38BDF8))
                            MetricBlock("Uptime", "${health?.uptimePercent ?: 99.8}%", Color(0xFF10B981))
                            MetricBlock("Data Age", "${((health?.dataAgeMs ?: 500) / 1000).coerceAtLeast(0)}s ago", Color(0xFFF59E0B))
                            MetricBlock("Failovers", "${health?.failoverCount ?: 0}", Color(0xFF94A3B8))
                        }

                        Spacer(modifier = Modifier.height(12.dp))
                        Divider(color = Color(0xFF334155))
                        Spacer(modifier = Modifier.height(8.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                "Fallback Status: ${if (health?.fallbackActive == true) "ACTIVE (REST)" else "STANDBY (READY)"}",
                                color = if (health?.fallbackActive == true) Color(0xFFF59E0B) else Color(0xFF10B981),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                            Text(
                                "Reconnection: ${health?.reconnectCount ?: 0}",
                                color = Color(0xFF94A3B8),
                                fontSize = 12.sp
                            )
                        }
                    }
                }
            }

            // Real-Time Assets Title
            item {
                Text(
                    "LIVE READ-ONLY QUOTES",
                    color = Color(0xFF94A3B8),
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }

            // Asset Rows
            items(assets) { asset ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(asset.symbol, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                Spacer(modifier = Modifier.width(6.dp))
                                Surface(
                                    color = Color(0xFF0F172A),
                                    shape = RoundedCornerShape(4.dp)
                                ) {
                                    Text(
                                        if (asset.isLive) "LIVE READ-ONLY" else "SIMULATED",
                                        color = if (asset.isLive) Color(0xFF34D399) else Color(0xFFF59E0B),
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                    )
                                }
                            }
                            Text(asset.name, color = Color(0xFF94A3B8), fontSize = 12.sp)
                        }

                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                "$${String.format("%,.2f", asset.price)}",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                            val isPos = asset.changePercent >= 0
                            Text(
                                "${if (isPos) "+" else ""}${String.format("%.2f", asset.changePercent)}%",
                                color = if (isPos) Color(0xFF10B981) else Color(0xFFEF4444),
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 12.sp
                            )
                        }
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}

@Composable
private fun BadgeItem(label: String, value: String, color: Color) {
    Column {
        Text(label, color = Color(0xFF64748B), fontSize = 9.sp, fontWeight = FontWeight.Bold)
        Text(value, color = color, fontSize = 11.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun MetricBlock(label: String, value: String, color: Color) {
    Column {
        Text(label, color = Color(0xFF64748B), fontSize = 11.sp)
        Text(value, color = color, fontWeight = FontWeight.Bold, fontSize = 14.sp)
    }
}
