package com.tradepilot.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tradepilot.data.model.BotLifecycleState
import com.tradepilot.data.model.BotSessionState
import com.tradepilot.data.repository.TradingRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.Locale

data class BotRunningUiState(
    val sessionState: BotSessionState = BotSessionState(),
    val showStopConfirmationDialog: Boolean = false,
    val showTerminationDialog: Boolean = false,
    val terminationReason: String? = null
)

class BotRunningViewModel(
    private val tradingRepository: TradingRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(BotRunningUiState())
    val uiState: StateFlow<BotRunningUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            tradingRepository.botSessionState.collect { state ->
                val showTerm = state.lifecycleState == BotLifecycleState.COMPLETED &&
                        state.terminationReason != null

                _uiState.value = _uiState.value.copy(
                    sessionState = state,
                    showTerminationDialog = showTerm,
                    terminationReason = state.terminationReason
                )
            }
        }
    }

    fun promptStopConfirmation() {
        _uiState.value = _uiState.value.copy(showStopConfirmationDialog = true)
    }

    fun dismissStopConfirmation() {
        _uiState.value = _uiState.value.copy(showStopConfirmationDialog = false)
    }

    fun confirmStopBot() {
        _uiState.value = _uiState.value.copy(showStopConfirmationDialog = false)
        viewModelScope.launch {
            tradingRepository.stopBotSession("Stopped by user")
        }
    }

    fun acknowledgeTermination(onComplete: () -> Unit) {
        _uiState.value = _uiState.value.copy(showTerminationDialog = false)
        tradingRepository.resetSession()
        onComplete()
    }

    fun formatElapsedTime(seconds: Long): String {
        val minutes = seconds / 60
        val remainingSeconds = seconds % 60
        return String.format(Locale.US, "%02d:%02d", minutes, remainingSeconds)
    }
}
