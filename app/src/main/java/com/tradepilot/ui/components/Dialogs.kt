package com.tradepilot.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.tradepilot.data.mock.MockDataProvider
import com.tradepilot.data.model.BotSessionConfig
import com.tradepilot.ui.theme.*

@Composable
fun StartBotConfirmationDialog(
    config: BotSessionConfig,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(18.dp))
                .background(DarkSurfaceElevated)
                .border(1.dp, DarkBorder, RoundedCornerShape(18.dp))
                .padding(22.dp)
        ) {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "START DEMO TRADING?",
                        color = TextPrimary,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold
                    )
                    DemoBadge()
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Param rows
                DialogParamRow(label = "Investment", value = MockDataProvider.formatBalance(config.investmentAmount))
                HorizontalDivider(color = DarkBorder, modifier = Modifier.padding(vertical = 8.dp))
                DialogParamRow(label = "Target Asset", value = config.asset.displayName)
                HorizontalDivider(color = DarkBorder, modifier = Modifier.padding(vertical = 8.dp))
                DialogParamRow(label = "Strategy", value = config.strategy.displayName)
                HorizontalDivider(color = DarkBorder, modifier = Modifier.padding(vertical = 8.dp))
                DialogParamRow(label = "Risk", value = config.riskLevel.displayName)
                HorizontalDivider(color = DarkBorder, modifier = Modifier.padding(vertical = 8.dp))
                DialogParamRow(label = "Duration", value = config.duration.displayName)

                Spacer(modifier = Modifier.height(16.dp))
                RiskNoticeBanner(text = "Demo performance does not guarantee future results.")

                Spacer(modifier = Modifier.height(20.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = TextSecondary),
                        border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
                        modifier = Modifier.weight(1f).height(46.dp)
                    ) {
                        Text("Cancel", fontWeight = FontWeight.SemiBold)
                    }

                    Button(
                        onClick = onConfirm,
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = TradeGreen,
                            contentColor = TextPrimary
                        ),
                        modifier = Modifier.weight(1f).height(46.dp)
                    ) {
                        Text("Start Bot", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun StopBotConfirmationDialog(
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(18.dp))
                .background(DarkSurfaceElevated)
                .border(1.dp, DarkBorder, RoundedCornerShape(18.dp))
                .padding(22.dp)
        ) {
            Column {
                Text(
                    text = "Stop Trading Session?",
                    color = TextPrimary,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = "Stop the demo trading session? Any simulated open trades will be closed at current market prices.",
                    color = TextSecondary,
                    fontSize = 13.sp,
                    lineHeight = 18.sp
                )

                Spacer(modifier = Modifier.height(22.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = TextSecondary),
                        border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
                        modifier = Modifier.weight(1f).height(46.dp)
                    ) {
                        Text("Cancel", fontWeight = FontWeight.SemiBold)
                    }

                    Button(
                        onClick = onConfirm,
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = TradeRed,
                            contentColor = TextPrimary
                        ),
                        modifier = Modifier.weight(1f).height(46.dp)
                    ) {
                        Text("Stop Bot", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun DailyLossLimitDialog(
    reason: String,
    onDismiss: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(18.dp))
                .background(DarkSurfaceElevated)
                .border(1.dp, TradeRed.copy(alpha = 0.5f), RoundedCornerShape(18.dp))
                .padding(22.dp)
        ) {
            Column {
                Text(
                    text = "Risk Management Alert",
                    color = TradeRed,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = reason,
                    color = TextPrimary,
                    fontSize = 14.sp,
                    lineHeight = 20.sp
                )

                Spacer(modifier = Modifier.height(16.dp))

                RiskNoticeBanner(text = "Simulated protection triggered to preserve capital.")

                Spacer(modifier = Modifier.height(20.dp))

                Button(
                    onClick = onDismiss,
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = TradePrimary),
                    modifier = Modifier.fillMaxWidth().height(46.dp)
                ) {
                    Text("OK", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun DialogParamRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = label, color = TextSecondary, fontSize = 13.sp)
        Text(text = value, color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
    }
}
