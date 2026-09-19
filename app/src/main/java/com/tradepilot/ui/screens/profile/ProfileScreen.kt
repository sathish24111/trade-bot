package com.tradepilot.ui.screens.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tradepilot.data.mock.MockDataProvider
import com.tradepilot.ui.components.*
import com.tradepilot.ui.theme.*
import com.tradepilot.viewmodel.ProfileViewModel
import java.util.Locale

@Composable
fun ProfileScreen(
    viewModel: ProfileViewModel,
    onNavigateToSettings: () -> Unit,
    onLogoutSuccess: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    var editName by remember(state.user.fullName) { mutableStateOf(state.user.fullName) }
    var editEmail by remember(state.user.email) { mutableStateOf(state.user.email) }
    var editPhone by remember(state.user.mobileNumber) { mutableStateOf(state.user.mobileNumber) }

    Scaffold(
        topBar = {
            TradePilotTopBar(
                title = "Trader Profile",
                actions = {
                    IconButton(onClick = onNavigateToSettings) {
                        Icon(Icons.Default.Settings, contentDescription = "Settings", tint = TextPrimary)
                    }
                    DemoBadge()
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
            // Profile Card Header
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(DarkSurfaceElevated)
                        .border(1.dp, DarkBorder, RoundedCornerShape(16.dp))
                        .padding(20.dp)
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        // User Avatar
                        Box(
                            modifier = Modifier
                                .size(80.dp)
                                .clip(CircleShape)
                                .background(TradePrimary)
                                .border(2.dp, TradePrimaryLight, CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = state.user.fullName.take(1).uppercase(),
                                color = Color.White,
                                fontSize = 32.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Text(
                            text = state.user.fullName,
                            color = TextPrimary,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold
                        )

                        Text(
                            text = state.user.email,
                            color = TextSecondary,
                            fontSize = 13.sp
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        // Account Type Badge
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(DemoAmberBg)
                                .border(1.dp, DemoAmber.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                                .padding(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = "Account Type: ${state.user.accountType}",
                                color = DemoAmber,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }

            // Lifetime Statistics Card
            item {
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
                            text = "Trading Statistics",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = TextPrimary
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("Total Trades", color = TextMuted, fontSize = 11.sp)
                                Spacer(modifier = Modifier.height(2.dp))
                                Text("${state.totalTrades}", color = TextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                            }

                            Box(
                                modifier = Modifier
                                    .width(1.dp)
                                    .height(35.dp)
                                    .background(DarkBorder)
                            )

                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("Win Rate", color = TextMuted, fontSize = 11.sp)
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    String.format(Locale.US, "%.1f%%", state.winRate),
                                    color = TextPrimary,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            Box(
                                modifier = Modifier
                                    .width(1.dp)
                                    .height(35.dp)
                                    .background(DarkBorder)
                            )

                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("Demo P/L", color = TextMuted, fontSize = 11.sp)
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    MockDataProvider.formatCurrency(state.demoPnL),
                                    color = if (state.demoPnL >= 0) TradeGreen else TradeRed,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }

            // Action Buttons
            item {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    TradePilotOutlineButton(
                        text = "Edit Profile",
                        onClick = { viewModel.showEditProfile(true) }
                    )

                    TradePilotOutlineButton(
                        text = "Account Settings",
                        onClick = onNavigateToSettings
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    TradePilotDangerButton(
                        text = "Logout",
                        onClick = { viewModel.promptLogout() }
                    )
                }
            }

            item {
                RiskNoticeBanner()
            }
        }
    }

    // Edit Profile Modal
    if (state.showEditProfileDialog) {
        AlertDialog(
            onDismissRequest = { viewModel.showEditProfile(false) },
            title = { Text("Edit Demo Profile", color = TextPrimary) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    TradePilotTextField(
                        value = editName,
                        onValueChange = { editName = it },
                        label = "Full Name"
                    )
                    TradePilotTextField(
                        value = editEmail,
                        onValueChange = { editEmail = it },
                        label = "Email"
                    )
                    TradePilotTextField(
                        value = editPhone,
                        onValueChange = { editPhone = it },
                        label = "Phone"
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = { viewModel.updateProfile(editName, editEmail, editPhone) },
                    colors = ButtonDefaults.buttonColors(containerColor = TradePrimary)
                ) {
                    Text("Save")
                }
            },
            dismissButton = {
                TextButton(onClick = { viewModel.showEditProfile(false) }) {
                    Text("Cancel", color = TextSecondary)
                }
            },
            containerColor = DarkSurfaceElevated
        )
    }

    // Logout Confirmation Dialog
    if (state.showLogoutConfirmationDialog) {
        AlertDialog(
            onDismissRequest = { viewModel.dismissLogout() },
            title = { Text("Confirm Logout", color = TextPrimary) },
            text = {
                Text("Are you sure you want to log out of TradePilot Demo?", color = TextSecondary)
            },
            confirmButton = {
                Button(
                    onClick = { viewModel.confirmLogout(onLogoutSuccess) },
                    colors = ButtonDefaults.buttonColors(containerColor = TradeRed)
                ) {
                    Text("Logout")
                }
            },
            dismissButton = {
                TextButton(onClick = { viewModel.dismissLogout() }) {
                    Text("Cancel", color = TextSecondary)
                }
            },
            containerColor = DarkSurfaceElevated
        )
    }
}
