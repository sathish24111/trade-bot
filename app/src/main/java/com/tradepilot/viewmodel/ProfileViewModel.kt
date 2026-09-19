package com.tradepilot.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tradepilot.data.model.User
import com.tradepilot.data.repository.AuthRepository
import com.tradepilot.data.repository.PerformanceRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ProfileUiState(
    val user: User = User(),
    val totalTrades: Int = 124,
    val winRate: Double = 61.3,
    val demoPnL: Double = 1245.50,
    val showEditProfileDialog: Boolean = false,
    val showAccountSettingsDialog: Boolean = false,
    val showLogoutConfirmationDialog: Boolean = false
)

class ProfileViewModel(
    private val authRepository: AuthRepository,
    private val performanceRepository: PerformanceRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            authRepository.currentUser.collect { user ->
                _uiState.value = _uiState.value.copy(user = user)
            }
        }
        viewModelScope.launch {
            performanceRepository.performanceSummary.collect { summary ->
                _uiState.value = _uiState.value.copy(
                    totalTrades = 100 + summary.totalTrades,
                    winRate = summary.winRate,
                    demoPnL = 1000.0 + summary.totalPnL
                )
            }
        }
    }

    fun promptLogout() {
        _uiState.value = _uiState.value.copy(showLogoutConfirmationDialog = true)
    }

    fun dismissLogout() {
        _uiState.value = _uiState.value.copy(showLogoutConfirmationDialog = false)
    }

    fun confirmLogout(onLoggedOut: () -> Unit) {
        _uiState.value = _uiState.value.copy(showLogoutConfirmationDialog = false)
        viewModelScope.launch {
            authRepository.logout()
            onLoggedOut()
        }
    }

    fun showEditProfile(show: Boolean) {
        _uiState.value = _uiState.value.copy(showEditProfileDialog = show)
    }

    fun showAccountSettings(show: Boolean) {
        _uiState.value = _uiState.value.copy(showAccountSettingsDialog = show)
    }

    fun updateProfile(name: String, email: String, phone: String) {
        viewModelScope.launch {
            authRepository.updateProfile(name, email, phone)
            showEditProfile(false)
        }
    }
}
