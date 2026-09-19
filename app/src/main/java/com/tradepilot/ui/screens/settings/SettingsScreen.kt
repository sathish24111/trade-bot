package com.tradepilot.ui.screens.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForwardIos
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tradepilot.data.model.RiskLevel
import com.tradepilot.data.model.SessionDuration
import com.tradepilot.data.model.TradingStrategy
import com.tradepilot.ui.components.*
import com.tradepilot.ui.theme.*
import com.tradepilot.viewmodel.SettingsInfoType
import com.tradepilot.viewmodel.SettingsViewModel

@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel,
    onNavigateBack: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val settings = state.settings

    Scaffold(
        topBar = {
            TradePilotTopBar(
                title = "Settings",
                showBackButton = true,
                onBackClick = onNavigateBack
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
            // Section: Preferences
            item {
                Text(
                    text = "Application Preferences",
                    color = TextPrimary,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }

            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(DarkSurfaceElevated)
                        .border(1.dp, DarkBorder, RoundedCornerShape(14.dp))
                        .padding(16.dp)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        // Notifications Switch
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text("Notifications", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                                Text("Signals and session updates", color = TextMuted, fontSize = 11.sp)
                            }
                            Switch(
                                checked = settings.notificationsEnabled,
                                onCheckedChange = { viewModel.toggleNotifications(it) },
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = androidx.compose.ui.graphics.Color.White,
                                    checkedTrackColor = TradePrimary
                                )
                            )
                        }

                        HorizontalDivider(color = DarkBorder)

                        // Dark Mode Switch
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text("Dark Mode", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                                Text("High-contrast trading palette", color = TextMuted, fontSize = 11.sp)
                            }
                            Switch(
                                checked = settings.darkModeEnabled,
                                onCheckedChange = { viewModel.toggleDarkMode(it) },
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = androidx.compose.ui.graphics.Color.White,
                                    checkedTrackColor = TradePrimary
                                )
                            )
                        }

                        HorizontalDivider(color = DarkBorder)

                        // Sound Alerts Switch
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text("Sound Alerts", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                                Text("Audio cues for simulated trades", color = TextMuted, fontSize = 11.sp)
                            }
                            Switch(
                                checked = settings.soundAlertsEnabled,
                                onCheckedChange = { viewModel.toggleSoundAlerts(it) },
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = androidx.compose.ui.graphics.Color.White,
                                    checkedTrackColor = TradePrimary
                                )
                            )
                        }
                    }
                }
            }

            // Section: Default Trading Parameters
            item {
                Text(
                    text = "Default Trading Parameters",
                    color = TextPrimary,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }

            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(DarkSurfaceElevated)
                        .border(1.dp, DarkBorder, RoundedCornerShape(14.dp))
                        .padding(16.dp)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        // Default Risk Selector
                        Column {
                            Text("Default Risk Level", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                            Spacer(modifier = Modifier.height(6.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                RiskLevel.values().forEach { risk ->
                                    val isSelected = settings.defaultRisk == risk
                                    FilterChip(
                                        selected = isSelected,
                                        onClick = { viewModel.setDefaultRisk(risk) },
                                        label = { Text(risk.displayName) }
                                    )
                                }
                            }
                        }

                        HorizontalDivider(color = DarkBorder)

                        // Default Strategy
                        Column {
                            Text("Default Strategy", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                            Spacer(modifier = Modifier.height(6.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                TradingStrategy.values().forEach { strat ->
                                    val isSelected = settings.defaultStrategy == strat
                                    FilterChip(
                                        selected = isSelected,
                                        onClick = { viewModel.setDefaultStrategy(strat) },
                                        label = { Text(strat.displayName, fontSize = 11.sp) }
                                    )
                                }
                            }
                        }

                        HorizontalDivider(color = DarkBorder)

                        // Default Duration
                        Column {
                            Text("Default Duration", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                            Spacer(modifier = Modifier.height(6.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                SessionDuration.values().forEach { dur ->
                                    val isSelected = settings.defaultDuration == dur
                                    FilterChip(
                                        selected = isSelected,
                                        onClick = { viewModel.setDefaultDuration(dur) },
                                        label = { Text(dur.displayName) }
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Section: About & Legal
            item {
                Text(
                    text = "Information & Legal",
                    color = TextPrimary,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }

            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(DarkSurfaceElevated)
                        .border(1.dp, DarkBorder, RoundedCornerShape(14.dp))
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    Column {
                        SettingsNavRow(title = "About TradePilot", onClick = { viewModel.showInfo(SettingsInfoType.ABOUT) })
                        HorizontalDivider(color = DarkBorder)
                        SettingsNavRow(title = "Demo Mode Information", onClick = { viewModel.showInfo(SettingsInfoType.DEMO_MODE) })
                        HorizontalDivider(color = DarkBorder)
                        SettingsNavRow(title = "Privacy Policy", onClick = { viewModel.showInfo(SettingsInfoType.PRIVACY) })
                        HorizontalDivider(color = DarkBorder)
                        SettingsNavRow(title = "Terms of Service", onClick = { viewModel.showInfo(SettingsInfoType.TERMS) })
                    }
                }
            }

            item {
                RiskNoticeBanner()
            }
        }
    }

    // Info Modal
    if (state.activeInfoType != null) {
        val (title, body) = when (state.activeInfoType) {
            SettingsInfoType.ABOUT -> "About TradePilot" to "TradePilot v1.0.0\nSmart Trading Assistant\n\nA modern mobile trading bot interface designed for automated algorithm simulation, technical indicators testing, and risk management exploration."
            SettingsInfoType.DEMO_MODE -> "Demo Mode Policy" to "TradePilot operates strictly in DEMO MODE.\n\n• Initial virtual balance: ₹10,000.00\n• All balance adjustments, profits, losses, and market signals are locally simulated.\n• No connections to brokers (Olymptrade, Deriv, etc.) or live real-money exchanges exist in this application.\n• Simulated trades carry zero financial obligation."
            SettingsInfoType.PRIVACY -> "Privacy Policy" to "Offline-First Privacy Guarantee:\n\nTradePilot Phase 1 stores all user data, preferences, and trade logs locally on your device via AndroidX DataStore and local storage. No analytics or private telemetry are transmitted to external servers."
            SettingsInfoType.TERMS -> "Terms of Service" to "Educational & Simulation Purpose Only:\n\nTrading financial instruments involves significant risk. Simulated or demo performance does not guarantee future results. TradePilot does not provide financial advice, broker services, or guarantee of profits."
            null -> "" to ""
        }

        AlertDialog(
            onDismissRequest = { viewModel.dismissInfo() },
            title = { Text(title, color = TextPrimary) },
            text = { Text(body, color = TextSecondary, fontSize = 13.sp, lineHeight = 19.sp) },
            confirmButton = {
                Button(
                    onClick = { viewModel.dismissInfo() },
                    colors = ButtonDefaults.buttonColors(containerColor = TradePrimary)
                ) {
                    Text("Close")
                }
            },
            containerColor = DarkSurfaceElevated
        )
    }
}

@Composable
private fun SettingsNavRow(
    title: String,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = 14.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = title, color = TextPrimary, fontSize = 14.sp)
        Icon(
            imageVector = Icons.AutoMirrored.Filled.ArrowForwardIos,
            contentDescription = null,
            tint = TextMuted,
            modifier = Modifier.size(14.dp)
        )
    }
}
