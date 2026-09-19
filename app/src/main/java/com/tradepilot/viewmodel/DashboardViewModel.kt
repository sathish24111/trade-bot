package com.tradepilot.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tradepilot.data.model.Trade
import com.tradepilot.data.model.User
import com.tradepilot.data.repository.ApiAuthRepository
import com.tradepilot.data.repository.AuthRepository
import com.tradepilot.data.repository.PerformanceRepository
import com.tradepilot.data.repository.TradingRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class DashboardUiState(
    val user: User = User(),
    val demoBalance: Double = 10000.0,
    val todayPnL: Double = 245.50,
    val winRate: Double = 62.5,
    val totalTrades: Int = 24,
    val equityCurvePoints: List<Pair<String, Double>> = emptyList(),
    val recentTrades: List<Trade> = emptyList(),
    val isBotRunning: Boolean = false,
    val isServerOnline: Boolean = true
)

class DashboardViewModel(
    private val authRepository: AuthRepository,
    private val tradingRepository: TradingRepository,
    private val performanceRepository: PerformanceRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            authRepository.currentUser.collect { user ->
                _uiState.value = _uiState.value.copy(user = user)
            }
        }
        viewModelScope.launch {
            tradingRepository.demoBalance.collect { balance ->
                _uiState.value = _uiState.value.copy(demoBalance = balance)
            }
        }
        viewModelScope.launch {
            performanceRepository.performanceSummary.collect { summary ->
                _uiState.value = _uiState.value.copy(
                    todayPnL = summary.todayPnL,
                    winRate = summary.winRate,
                    totalTrades = summary.totalTrades,
                    equityCurvePoints = summary.equityCurvePoints
                )
            }
        }
        viewModelScope.launch {
            performanceRepository.allTrades.collect { trades ->
                _uiState.value = _uiState.value.copy(recentTrades = trades.take(5))
            }
        }
        viewModelScope.launch {
            tradingRepository.botSessionState.collect { session ->
                _uiState.value = _uiState.value.copy(
                    isBotRunning = session.lifecycleState == com.tradepilot.data.model.BotLifecycleState.RUNNING
                )
            }
        }
        if (authRepository is ApiAuthRepository) {
            viewModelScope.launch {
                authRepository.isServerOnline.collect { online ->
                    _uiState.value = _uiState.value.copy(isServerOnline = online)
                }
            }
        }
    }
}
