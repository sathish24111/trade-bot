package com.tradepilot.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tradepilot.data.model.*
import com.tradepilot.data.repository.TradingRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class TradingSetupUiState(
    val investmentAmount: Double = 500.0,
    val customAmountText: String = "",
    val isCustomSelected: Boolean = false,
    val selectedAsset: DerivAsset = DerivAsset.VOLATILITY_100,
    val strategy: TradingStrategy = TradingStrategy.EMA_RSI,
    val riskLevel: RiskLevel = RiskLevel.LOW,
    val duration: SessionDuration = SessionDuration.MIN_30,
    val demoBalance: Double = 10000.0,
    val showConfirmationDialog: Boolean = false,
    val errorMessage: String? = null
)

class TradingSetupViewModel(
    private val tradingRepository: TradingRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(TradingSetupUiState())
    val uiState: StateFlow<TradingSetupUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            tradingRepository.demoBalance.collect { balance ->
                _uiState.value = _uiState.value.copy(demoBalance = balance)
            }
        }
    }

    fun selectPresetAmount(amount: Double) {
        _uiState.value = _uiState.value.copy(
            investmentAmount = amount,
            customAmountText = "",
            isCustomSelected = false,
            errorMessage = null
        )
    }

    fun setCustomAmount(amountText: String) {
        val filtered = amountText.filter { it.isDigit() || it == '.' }
        val parsed = filtered.toDoubleOrNull() ?: 0.0
        _uiState.value = _uiState.value.copy(
            investmentAmount = parsed,
            customAmountText = filtered,
            isCustomSelected = true,
            errorMessage = null
        )
    }

    fun selectAsset(asset: DerivAsset) {
        _uiState.value = _uiState.value.copy(selectedAsset = asset)
    }

    fun selectStrategy(strategy: TradingStrategy) {
        _uiState.value = _uiState.value.copy(strategy = strategy)
    }

    fun selectRiskLevel(riskLevel: RiskLevel) {
        _uiState.value = _uiState.value.copy(riskLevel = riskLevel)
    }

    fun selectDuration(duration: SessionDuration) {
        _uiState.value = _uiState.value.copy(duration = duration)
    }

    fun requestStartBot() {
        val currentAmount = _uiState.value.investmentAmount
        val balance = _uiState.value.demoBalance

        val validationError = validateInvestment(currentAmount, balance)
        if (validationError != null) {
            _uiState.value = _uiState.value.copy(errorMessage = validationError)
            return
        }

        _uiState.value = _uiState.value.copy(
            showConfirmationDialog = true,
            errorMessage = null
        )
    }

    fun dismissConfirmationDialog() {
        _uiState.value = _uiState.value.copy(showConfirmationDialog = false)
    }

    fun confirmStartBot(onStarted: () -> Unit) {
        _uiState.value = _uiState.value.copy(showConfirmationDialog = false)
        val config = BotSessionConfig(
            investmentAmount = _uiState.value.investmentAmount,
            asset = _uiState.value.selectedAsset,
            strategy = _uiState.value.strategy,
            riskLevel = _uiState.value.riskLevel,
            duration = _uiState.value.duration
        )

        viewModelScope.launch {
            val result = tradingRepository.startBotSession(config)
            if (result.isSuccess) {
                onStarted()
            } else {
                _uiState.value = _uiState.value.copy(
                    errorMessage = result.exceptionOrNull()?.message ?: "Failed to start bot."
                )
            }
        }
    }

    companion object {
        fun validateInvestment(amount: Double, balance: Double): String? {
            return when {
                amount <= 0.0 -> "Investment amount must be greater than ₹0."
                amount > balance -> "Investment amount cannot exceed demo balance (₹${String.format(java.util.Locale.US, "%,.2f", balance)})."
                else -> null
            }
        }
    }
}
