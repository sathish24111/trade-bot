package com.tradepilot.ui.screens.trading

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tradepilot.data.mock.MockDataProvider
import com.tradepilot.data.model.BotLifecycleState
import com.tradepilot.ui.components.*
import com.tradepilot.ui.theme.*
import com.tradepilot.viewmodel.BotRunningViewModel
import java.util.Locale

@Composable
fun BotRunningScreen(
    viewModel: BotRunningViewModel,
    onNavigateBack: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val session = state.sessionState

    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.8f,
        targetValue = 1.25f,
        animationSpec = infiniteRepeatable(
            animation = tween(900, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseScale"
    )

    Scaffold(
        topBar = {
            TradePilotTopBar(
                title = "Bot Execution",
                showBackButton = true,
                onBackClick = {
                    if (session.lifecycleState == BotLifecycleState.RUNNING) {
                        viewModel.promptStopConfirmation()
                    } else {
                        onNavigateBack()
                    }
                }
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
            // Live Status Radar Card
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(DarkSurfaceElevated)
                        .border(1.dp, DarkBorder, RoundedCornerShape(16.dp))
                        .padding(18.dp)
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(10.dp)
                                    .scale(if (session.lifecycleState == BotLifecycleState.RUNNING) pulseScale else 1f)
                                    .clip(CircleShape)
                                    .background(
                                        when (session.lifecycleState) {
                                            BotLifecycleState.RUNNING -> TradeGreen
                                            BotLifecycleState.STARTING -> DemoAmber
                                            BotLifecycleState.STOPPING -> TradeRed
                                            else -> TextMuted
                                        }
                                    )
                            )
                            Text(
                                text = when (session.lifecycleState) {
                                    BotLifecycleState.RUNNING -> "● BOT RUNNING"
                                    BotLifecycleState.STARTING -> "● INITIALIZING ENGINE..."
                                    BotLifecycleState.STOPPING -> "● CLOSING POSITIONS..."
                                    BotLifecycleState.COMPLETED -> "● SESSION COMPLETED"
                                    BotLifecycleState.IDLE -> "● IDLE"
                                },
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = when (session.lifecycleState) {
                                    BotLifecycleState.RUNNING -> TradeGreen
                                    BotLifecycleState.STARTING -> DemoAmber
                                    BotLifecycleState.STOPPING -> TradeRed
                                    else -> TextMuted
                                },
                                letterSpacing = 1.sp
                            )
                        }

                        Spacer(modifier = Modifier.height(4.dp))
                        DemoBadge()

                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Market Analysis Active",
                            fontSize = 12.sp,
                            color = TextSecondary
                        )

                        Spacer(modifier = Modifier.height(18.dp))

                        // Large Elapsed Timer
                        Text(
                            text = viewModel.formatElapsedTime(session.elapsedSeconds),
                            fontSize = 42.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary,
                            letterSpacing = 2.sp
                        )
                        Text(
                            text = "Elapsed Time",
                            fontSize = 11.sp,
                            color = TextMuted
                        )
                    }
                }
            }

            // Session Parameters Breakdown Card
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(DarkSurfaceElevated)
                        .border(1.dp, DarkBorder, RoundedCornerShape(14.dp))
                        .padding(16.dp)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Selected Strategy", color = TextSecondary, fontSize = 13.sp)
                            Text(session.config.strategy.displayName, color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                        }
                        HorizontalDivider(color = DarkBorder)
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Investment", color = TextSecondary, fontSize = 13.sp)
                            Text(MockDataProvider.formatBalance(session.config.investmentAmount), color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                        }
                        HorizontalDivider(color = DarkBorder)
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Current P/L", color = TextSecondary, fontSize = 13.sp)
                            Text(
                                MockDataProvider.formatCurrency(session.currentPnL),
                                color = if (session.currentPnL >= 0) TradeGreen else TradeRed,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        HorizontalDivider(color = DarkBorder)
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Trades Completed", color = TextSecondary, fontSize = 13.sp)
                            Text("${session.tradesCount}", color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                        }
                        HorizontalDivider(color = DarkBorder)
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Win Rate", color = TextSecondary, fontSize = 13.sp)
                            Text(
                                String.format(Locale.US, "%.1f%%", session.winRate),
                                color = TextPrimary,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }

            // Live Simulation Logs Stream Card
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(DarkSurfaceElevated)
                        .border(1.dp, DarkBorder, RoundedCornerShape(14.dp))
                        .padding(14.dp)
                ) {
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Simulated Execution Log",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = TextPrimary
                            )
                            Text(
                                text = "Live Stream",
                                fontSize = 10.sp,
                                color = TradeGreen
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        if (session.sessionLogs.isEmpty()) {
                            Text(
                                text = "Waiting for initial market signal...",
                                fontSize = 12.sp,
                                color = TextMuted,
                                modifier = Modifier.padding(vertical = 8.dp)
                            )
                        } else {
                            session.sessionLogs.take(8).forEach { log ->
                                Text(
                                    text = log,
                                    fontSize = 11.sp,
                                    lineHeight = 16.sp,
                                    color = if (log.contains("WIN")) TradeGreenLight
                                    else if (log.contains("LOSS")) TradeRedLight
                                    else TextSecondary,
                                    modifier = Modifier.padding(vertical = 3.dp)
                                )
                            }
                        }
                    }
                }
            }

            // STOP BOT / FINISH Button
            item {
                if (session.lifecycleState == BotLifecycleState.COMPLETED) {
                    TradePilotButton(
                        text = "RETURN TO DASHBOARD",
                        onClick = onNavigateBack,
                        containerColor = TradePrimary,
                        modifier = Modifier.height(54.dp)
                    )
                } else {
                    TradePilotDangerButton(
                        text = "STOP BOT",
                        onClick = { viewModel.promptStopConfirmation() },
                        isLoading = session.lifecycleState == BotLifecycleState.STOPPING,
                        modifier = Modifier.height(54.dp)
                    )
                }
            }

            // Risk Disclaimer
            item {
                RiskNoticeBanner()
            }
        }
    }

    if (state.showStopConfirmationDialog) {
        StopBotConfirmationDialog(
            onConfirm = { viewModel.confirmStopBot() },
            onDismiss = { viewModel.dismissStopConfirmation() }
        )
    }

    if (state.showTerminationDialog) {
        DailyLossLimitDialog(
            reason = state.terminationReason ?: "Session Completed",
            onDismiss = { viewModel.acknowledgeTermination(onNavigateBack) }
        )
    }
}
