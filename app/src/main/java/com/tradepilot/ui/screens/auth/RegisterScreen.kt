package com.tradepilot.ui.screens.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tradepilot.ui.components.*
import com.tradepilot.ui.theme.*
import com.tradepilot.viewmodel.AuthViewModel

@Composable
fun RegisterScreen(
    viewModel: AuthViewModel,
    onNavigateToLogin: () -> Unit,
    onRegisterSuccess: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val focusManager = LocalFocusManager.current

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
            // Header with Back Button
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onNavigateToLogin) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = TextPrimary
                    )
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Create Account",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Spacer(modifier = Modifier.weight(1f))
                DemoBadge()
            }

            Spacer(modifier = Modifier.height(20.dp))

            Text(
                text = "Join TradePilot Demo",
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
            Text(
                text = "Simulate automated trading algorithms risk-free",
                fontSize = 13.sp,
                color = TextSecondary
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Full Name
            TradePilotTextField(
                value = state.fullName,
                onValueChange = { viewModel.onFullNameChange(it) },
                label = "Full Name",
                placeholder = "e.g. Sathish",
                leadingIcon = {
                    Icon(Icons.Default.Person, contentDescription = null, tint = TextSecondary, modifier = Modifier.size(20.dp))
                },
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next)
            )

            Spacer(modifier = Modifier.height(14.dp))

            // Email
            TradePilotTextField(
                value = state.email,
                onValueChange = { viewModel.onEmailChange(it) },
                label = "Email Address",
                placeholder = "sathish@tradepilot.app",
                leadingIcon = {
                    Icon(Icons.Default.Email, contentDescription = null, tint = TextSecondary, modifier = Modifier.size(20.dp))
                },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next)
            )

            Spacer(modifier = Modifier.height(14.dp))

            // Mobile Number
            TradePilotTextField(
                value = state.mobileNumber,
                onValueChange = { viewModel.onMobileNumberChange(it) },
                label = "Mobile Number",
                placeholder = "+91 98765 43210",
                leadingIcon = {
                    Icon(Icons.Default.Phone, contentDescription = null, tint = TextSecondary, modifier = Modifier.size(20.dp))
                },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone, imeAction = ImeAction.Next)
            )

            Spacer(modifier = Modifier.height(14.dp))

            // Password
            TradePilotTextField(
                value = state.password,
                onValueChange = { viewModel.onPasswordChange(it) },
                label = "Password",
                placeholder = "Minimum 6 characters",
                leadingIcon = {
                    Icon(Icons.Default.Lock, contentDescription = null, tint = TextSecondary, modifier = Modifier.size(20.dp))
                },
                visualTransformation = PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Next)
            )

            Spacer(modifier = Modifier.height(14.dp))

            // Confirm Password
            TradePilotTextField(
                value = state.confirmPassword,
                onValueChange = { viewModel.onConfirmPasswordChange(it) },
                label = "Confirm Password",
                placeholder = "Re-enter your password",
                leadingIcon = {
                    Icon(Icons.Default.Lock, contentDescription = null, tint = TextSecondary, modifier = Modifier.size(20.dp))
                },
                visualTransformation = PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done)
            )

            if (state.errorMessage != null) {
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = state.errorMessage ?: "",
                    color = TradeRed,
                    fontSize = 13.sp
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Submit Button
            TradePilotButton(
                text = "Create Account",
                onClick = {
                    focusManager.clearFocus()
                    viewModel.register(onRegisterSuccess)
                },
                isLoading = state.isLoading
            )

            Spacer(modifier = Modifier.height(20.dp))

            // Login Link
            Row(
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Already have an account? ",
                    color = TextSecondary,
                    fontSize = 14.sp
                )
                Text(
                    text = "Login",
                    color = TradePrimary,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.clickable { onNavigateToLogin() }
                )
            }

            Spacer(modifier = Modifier.height(24.dp))
            RiskNoticeBanner()
        }
    }
}
