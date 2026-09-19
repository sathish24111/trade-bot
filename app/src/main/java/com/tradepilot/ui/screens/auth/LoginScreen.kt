package com.tradepilot.ui.screens.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tradepilot.ui.components.*
import com.tradepilot.ui.theme.*
import com.tradepilot.viewmodel.AuthUiState
import com.tradepilot.viewmodel.AuthViewModel

@Composable
fun LoginScreen(
    viewModel: AuthViewModel,
    onNavigateToRegister: () -> Unit,
    onLoginSuccess: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val focusManager = LocalFocusManager.current
    var showForgotPasswordDialog by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBg)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(36.dp))

            // Logo and Title
            Box(
                modifier = Modifier
                    .size(72.dp)
                    .clip(RoundedCornerShape(18.dp))
                    .background(TradePrimary)
                    .border(2.dp, TradePrimaryLight.copy(alpha = 0.5f), RoundedCornerShape(18.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.AutoGraph,
                    contentDescription = "Logo",
                    tint = Color.White,
                    modifier = Modifier.size(38.dp)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "TradePilot",
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
            Text(
                text = "Smart Trading Assistant",
                fontSize = 13.sp,
                color = TextSecondary
            )

            Spacer(modifier = Modifier.height(12.dp))
            DemoBadge()

            Spacer(modifier = Modifier.height(32.dp))

            // Demo Credentials Quick-Fill Card
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(DarkSurfaceElevated)
                    .border(1.dp, DarkBorder, RoundedCornerShape(12.dp))
                    .clickable {
                        viewModel.onEmailChange("demo@tradepilot.app")
                        viewModel.onPasswordChange("123456")
                    }
                    .padding(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "DEMO CREDENTIALS",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = DemoAmber,
                            letterSpacing = 0.5.sp
                        )
                        Spacer(modifier = Modifier.height(3.dp))
                        Text(
                            text = "demo@tradepilot.app / 123456",
                            fontSize = 12.sp,
                            color = TextSecondary
                        )
                    }
                    Text(
                        text = "Tap to Auto-fill",
                        fontSize = 11.sp,
                        color = TradePrimary,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Email Input
            TradePilotTextField(
                value = state.email,
                onValueChange = { viewModel.onEmailChange(it) },
                label = "Email Address",
                placeholder = "name@domain.com",
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Email,
                        contentDescription = "Email",
                        tint = TextSecondary,
                        modifier = Modifier.size(20.dp)
                    )
                },
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Email,
                    imeAction = ImeAction.Next
                )
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Password Input
            TradePilotTextField(
                value = state.password,
                onValueChange = { viewModel.onPasswordChange(it) },
                label = "Password",
                placeholder = "Enter your password",
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Lock,
                        contentDescription = "Password",
                        tint = TextSecondary,
                        modifier = Modifier.size(20.dp)
                    )
                },
                trailingIcon = {
                    IconButton(onClick = { viewModel.togglePasswordVisibility() }) {
                        Icon(
                            imageVector = if (state.isPasswordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                            contentDescription = "Toggle password",
                            tint = TextSecondary,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                },
                visualTransformation = if (state.isPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Password,
                    imeAction = ImeAction.Done
                ),
                keyboardActions = KeyboardActions(
                    onDone = {
                        focusManager.clearFocus()
                        viewModel.login(onLoginSuccess)
                    }
                )
            )

            // Forgot Password
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                horizontalArrangement = Arrangement.End
            ) {
                Text(
                    text = "Forgot password?",
                    color = TradePrimary,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.clickable { showForgotPasswordDialog = true }
                )
            }

            if (state.errorMessage != null) {
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = state.errorMessage ?: "",
                    color = TradeRed,
                    fontSize = 13.sp
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Login Button
            TradePilotButton(
                text = "LOGIN TO DEMO",
                onClick = {
                    focusManager.clearFocus()
                    viewModel.login(onLoginSuccess)
                },
                isLoading = state.isLoading
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Create Account Link
            Row(
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Don't have an account? ",
                    color = TextSecondary,
                    fontSize = 14.sp
                )
                Text(
                    text = "Create account",
                    color = TradePrimary,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.clickable { onNavigateToRegister() }
                )
            }

            Spacer(modifier = Modifier.height(32.dp))
            RiskNoticeBanner()
        }
    }

    if (showForgotPasswordDialog) {
        AlertDialog(
            onDismissRequest = { showForgotPasswordDialog = false },
            title = { Text("Reset Demo Password", color = TextPrimary) },
            text = {
                Text(
                    "For Phase 1 Demo, use the default credentials: demo@tradepilot.app / password: 123456",
                    color = TextSecondary
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.onEmailChange("demo@tradepilot.app")
                    viewModel.onPasswordChange("123456")
                    showForgotPasswordDialog = false
                }) {
                    Text("Auto-fill & Close", color = TradePrimary)
                }
            },
            containerColor = DarkSurfaceElevated
        )
    }
}
