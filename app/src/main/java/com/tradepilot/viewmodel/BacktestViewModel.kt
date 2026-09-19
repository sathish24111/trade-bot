package com.tradepilot.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tradepilot.data.remote.BacktestResultDto
import com.tradepilot.data.remote.StrategyComparisonItemDto
import com.tradepilot.data.repository.BacktestRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class BacktestViewModel(
    private val repository: BacktestRepository
) : ViewModel() {

    val strategies = listOf("EMA_RSI", "MACD", "BOLLINGER_BANDS", "MULTI_INDICATOR")
    val assets = listOf("EUR/USD", "GBP/USD", "USD/JPY", "BTC/USD", "ETH/USD")
    val timeframes = listOf("1m", "5m", "15m", "1h", "4h", "1D")

    private val _selectedStrategy = MutableStateFlow("EMA_RSI")
    val selectedStrategy: StateFlow<String> = _selectedStrategy.asStateFlow()

    private val _selectedAsset = MutableStateFlow("EUR/USD")
    val selectedAsset: StateFlow<String> = _selectedAsset.asStateFlow()

    private val _selectedTimeframe = MutableStateFlow("5m")
    val selectedTimeframe: StateFlow<String> = _selectedTimeframe.asStateFlow()

    private val _initialBalance = MutableStateFlow("10000.00")
    val initialBalance: StateFlow<String> = _initialBalance.asStateFlow()

    private val _tradeAmount = MutableStateFlow("100.00")
    val tradeAmount: StateFlow<String> = _tradeAmount.asStateFlow()

    private val _spread = MutableStateFlow("0.0001")
    val spread: StateFlow<String> = _spread.asStateFlow()

    private val _slippage = MutableStateFlow("0.0002")
    val slippage: StateFlow<String> = _slippage.asStateFlow()

    private val _fee = MutableStateFlow("0.00")
    val fee: StateFlow<String> = _fee.asStateFlow()

    private val _activeTab = MutableStateFlow(0) // 0 = Single Backtest, 1 = Strategy Comparison
    val activeTab: StateFlow<Int> = _activeTab.asStateFlow()

    val isRunning: StateFlow<Boolean> = repository.isRunning
    val currentResult: StateFlow<BacktestResultDto?> = repository.currentResult
    val comparisons: StateFlow<List<StrategyComparisonItemDto>?> = repository.comparisons
    val errorMessage: StateFlow<String?> = repository.errorMessage

    fun selectStrategy(strategy: String) {
        _selectedStrategy.value = strategy
    }

    fun selectAsset(asset: String) {
        _selectedAsset.value = asset
    }

    fun selectTimeframe(timeframe: String) {
        _selectedTimeframe.value = timeframe
    }

    fun setInitialBalance(balance: String) {
        _initialBalance.value = balance
    }

    fun setTradeAmount(amount: String) {
        _tradeAmount.value = amount
    }

    fun setSpread(spread: String) {
        _spread.value = spread
    }

    fun setSlippage(slippage: String) {
        _slippage.value = slippage
    }

    fun setFee(fee: String) {
        _fee.value = fee
    }

    fun setActiveTab(tab: Int) {
        _activeTab.value = tab
    }

    fun runBacktest() {
        val balance = _initialBalance.value.toDoubleOrNull() ?: 10000.0
        val amount = _tradeAmount.value.toDoubleOrNull() ?: 100.0
        val spreadVal = _spread.value.toDoubleOrNull() ?: 0.0001
        val slippageVal = _slippage.value.toDoubleOrNull() ?: 0.0002
        val feeVal = _fee.value.toDoubleOrNull() ?: 0.0

        viewModelScope.launch {
            repository.runBacktest(
                asset = _selectedAsset.value,
                strategy = _selectedStrategy.value,
                timeframe = _selectedTimeframe.value,
                initialBalance = balance,
                tradeAmount = amount,
                spread = spreadVal,
                slippage = slippageVal,
                fee = feeVal
            )
        }
    }

    fun runComparison() {
        val balance = _initialBalance.value.toDoubleOrNull() ?: 10000.0
        viewModelScope.launch {
            repository.compareStrategies(
                asset = _selectedAsset.value,
                timeframe = _selectedTimeframe.value,
                count = 100,
                initialBalance = balance
            )
        }
    }
}
