package com.tradepilot.ui.screens.trading

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tradepilot.data.model.*
import com.tradepilot.ui.components.*
import com.tradepilot.ui.theme.*
import com.tradepilot.viewmodel.TradingSetupViewModel

@Composable
fun TradingSetupScreen(
    viewModel: TradingSetupViewModel,
    onNavigateBack: () -> Unit,
    onNavigateToBotRunning: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TradePilotTopBar(
                title = "Trading Setup",
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
            verticalArrangement = Arrangement.spacedBy(18.dp),
            contentPadding = PaddingValues(top = 8.dp, bottom = 32.dp)
        ) {
            // Section 1: Investment Amount
            item {
                SectionCard(title = "Investment Amount") {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text(
                            text = "Available Demo Balance: $${String.format(java.util.Locale.US, "%,.2f", state.demoBalance)}",
                            fontSize = 12.sp,
                            color = TextSecondary
                        )

                        // Presets Row
                        val presets = listOf(100.0, 250.0, 500.0, 1000.0)
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            presets.forEach { preset ->
                                val isSelected = !state.isCustomSelected && state.investmentAmount == preset
                                PresetButton(
                                    label = "$${preset.toInt()}",
                                    isSelected = isSelected,
                                    onClick = { viewModel.selectPresetAmount(preset) },
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }

                        // Custom Amount Field
                        TradePilotTextField(
                            value = state.customAmountText,
                            onValueChange = { viewModel.setCustomAmount(it) },
                            label = "Or Custom Amount ($)",
                            placeholder = "Enter custom amount e.g. 750",
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                        )
                    }
                }
            }

            // Section 2: Target Asset (Deriv Synthetics & Forex)
            item {
                SectionCard(title = "Target Asset (Deriv)") {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        DerivAsset.values().forEach { asset ->
                            val isSelected = state.selectedAsset == asset
                            SelectableOptionCard(
                                title = asset.displayName,
                                subtitle = "${asset.category} • Symbol: ${asset.symbol}",
                                isSelected = isSelected,
                                onClick = { viewModel.selectAsset(asset) }
                            )
                        }
                    }
                }
            }

            // Section 3: Strategy
            item {
                SectionCard(title = "Strategy") {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        TradingStrategy.values().forEach { strategy ->
                            val isSelected = state.strategy == strategy
                            SelectableOptionCard(
                                title = strategy.displayName,
                                subtitle = strategy.description,
                                isSelected = isSelected,
                                onClick = { viewModel.selectStrategy(strategy) }
                            )
                        }
                    }
                }
            }

            // Section 3: Risk Level
            item {
                SectionCard(title = "Risk Level") {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        RiskLevel.values().forEach { risk ->
                            val isSelected = state.riskLevel == risk
                            SelectablePill(
                                label = risk.displayName,
                                subtitle = "Max ${((risk.maxRiskPerTradePercent * 100).toInt())}%",
                                isSelected = isSelected,
                                onClick = { viewModel.selectRiskLevel(risk) },
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
            }

            // Section 4: Duration
            item {
                SectionCard(title = "Duration") {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        SessionDuration.values().forEach { duration ->
                            val isSelected = state.duration == duration
                            SelectablePill(
                                label = duration.displayName,
                                isSelected = isSelected,
                                onClick = { viewModel.selectDuration(duration) },
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
            }

            // Error message if any
            if (state.errorMessage != null) {
                item {
                    Text(
                        text = state.errorMessage ?: "",
                        color = TradeRed,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            // Risk Notice
            item {
                RiskNoticeBanner(text = "Trading involves risk. Demo results do not guarantee future performance.")
            }

            // START DEMO BOT Button
            item {
                TradePilotButton(
                    text = "START DEMO BOT",
                    onClick = { viewModel.requestStartBot() },
                    containerColor = TradeGreen,
                    contentColor = Color.White,
                    modifier = Modifier.height(56.dp)
                )
            }
        }
    }

    if (state.showConfirmationDialog) {
        val config = BotSessionConfig(
            investmentAmount = state.investmentAmount,
            asset = state.selectedAsset,
            strategy = state.strategy,
            riskLevel = state.riskLevel,
            duration = state.duration
        )
        StartBotConfirmationDialog(
            config = config,
            onConfirm = { viewModel.confirmStartBot(onNavigateToBotRunning) },
            onDismiss = { viewModel.dismissConfirmationDialog() }
        )
    }
}

@Composable
private fun SectionCard(
    title: String,
    content: @Composable () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(DarkSurfaceElevated)
            .border(1.dp, DarkBorder, RoundedCornerShape(14.dp))
            .padding(16.dp)
    ) {
        Column {
            Text(
                text = title,
                fontSize = 15.sp,
                fontWeight = FontWeight.SemiBold,
                color = TextPrimary
            )
            Spacer(modifier = Modifier.height(12.dp))
            content()
        }
    }
}

@Composable
private fun PresetButton(
    label: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .height(44.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(if (isSelected) TradePrimary else DarkBg)
            .border(
                1.dp,
                if (isSelected) TradePrimaryLight else DarkBorder,
                RoundedCornerShape(8.dp)
            )
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            fontSize = 13.sp,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
            color = if (isSelected) Color.White else TextSecondary
        )
    }
}

@Composable
private fun SelectableOptionCard(
    title: String,
    subtitle: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(if (isSelected) TradePrimary.copy(alpha = 0.12f) else DarkBg.copy(alpha = 0.5f))
            .border(
                1.dp,
                if (isSelected) TradePrimary else DarkBorder,
                RoundedCornerShape(10.dp)
            )
            .clickable(onClick = onClick)
            .padding(12.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = if (isSelected) TradePrimaryLight else TextPrimary
                )
                RadioButton(
                    selected = isSelected,
                    onClick = onClick,
                    colors = RadioButtonDefaults.colors(
                        selectedColor = TradePrimary,
                        unselectedColor = TextMuted
                    )
                )
            }
            Text(
                text = subtitle,
                fontSize = 11.sp,
                color = TextSecondary
            )
        }
    }
}

@Composable
private fun SelectablePill(
    label: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    subtitle: String? = null
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .background(if (isSelected) TradePrimary.copy(alpha = 0.2f) else DarkBg)
            .border(
                1.dp,
                if (isSelected) TradePrimary else DarkBorder,
                RoundedCornerShape(10.dp)
            )
            .clickable(onClick = onClick)
            .padding(vertical = 10.dp, horizontal = 6.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = label,
                fontSize = 12.sp,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                color = if (isSelected) TradePrimaryLight else TextSecondary
            )
            if (subtitle != null) {
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = subtitle,
                    fontSize = 10.sp,
                    color = TextMuted
                )
            }
        }
    }
}
