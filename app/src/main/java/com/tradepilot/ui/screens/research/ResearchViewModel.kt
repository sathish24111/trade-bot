package com.tradepilot.ui.screens.research

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tradepilot.data.remote.*
import com.tradepilot.data.repository.ResearchRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

enum class ResearchTab(val title: String) {
    V2_VALIDATION("V2 Validation"),
    BACKTEST("Backtest"),
    OPTIMIZE("Optimize"),
    WALK_FORWARD("Walk-Forward"),
    MONTE_CARLO("Monte Carlo"),
    REGIMES("Regimes"),
    DATASETS("Datasets"),
    ROBUSTNESS("Robustness"),
    EXPERIMENTS("Experiments")
}

data class ResearchUiState(
    val selectedTab: ResearchTab = ResearchTab.V2_VALIDATION,
    val selectedAsset: String = "EUR/USD",
    val selectedTimeframe: String = "5m",
    val selectedStrategy: String = "EMA_RSI",
    val initialBalance: Double = 10000.0,
    val tradeAmount: Double = 100.0,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val v2ValidationDashboard: V2ValidationDashboardDto? = null,
    val backtestResult: BacktestResultDto? = null,
    val optimizationResult: OptimizationResultDto? = null,
    val walkForwardResult: WalkForwardResultDto? = null,
    val monteCarloResult: MonteCarloResultDto? = null,
    val monteCarloIterations: Int = 500,
    val regimeResponse: MarketRegimesResponse? = null,
    val positionSizing: PositionSizingCalculationDto? = null,
    val datasets: List<DatasetMetadataDto> = emptyList(),
    val sensitivityResult: ParameterSensitivityResultDto? = null,
    val stressReport: StressTestReportDto? = null,
    val experiments: List<PaperExperimentDto> = emptyList(),
    val experimentComparison: BacktestVsPaperComparisonDto? = null,
    val disclaimer: String = "Research, optimization, and walk-forward simulations are for educational purposes in DEMO/PAPER mode only. No real money is used or at risk."
)

class ResearchViewModel(
    private val repository: ResearchRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ResearchUiState())
    val uiState: StateFlow<ResearchUiState> = _uiState.asStateFlow()

    init {
        // Automatically load initial validation and regime analysis
        loadV2ValidationDashboard()
        loadRegimes()
    }

    fun setTab(tab: ResearchTab) {
        _uiState.value = _uiState.value.copy(selectedTab = tab)
        if (tab == ResearchTab.V2_VALIDATION && _uiState.value.v2ValidationDashboard == null) {
            loadV2ValidationDashboard()
        }
        if (tab == ResearchTab.REGIMES && _uiState.value.regimeResponse == null) {
            loadRegimes()
        }
    }

    fun setAsset(asset: String) {
        _uiState.value = _uiState.value.copy(selectedAsset = asset)
    }

    fun setTimeframe(timeframe: String) {
        _uiState.value = _uiState.value.copy(selectedTimeframe = timeframe)
    }

    fun setStrategy(strategy: String) {
        _uiState.value = _uiState.value.copy(selectedStrategy = strategy)
    }

    fun setMonteCarloIterations(iterations: Int) {
        _uiState.value = _uiState.value.copy(monteCarloIterations = iterations)
    }

    fun runBacktest() {
        val s = _uiState.value
        _uiState.value = s.copy(isLoading = true, errorMessage = null)

        viewModelScope.launch {
            val req = RunBacktestRequest(
                asset = s.selectedAsset,
                strategy = s.selectedStrategy,
                timeframe = s.selectedTimeframe,
                initialBalance = s.initialBalance,
                tradeAmount = s.tradeAmount
            )
            val result = repository.runResearchBacktest(req)
            result.onSuccess { data ->
                _uiState.value = _uiState.value.copy(isLoading = false, backtestResult = data)
            }.onFailure { err ->
                _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = err.message ?: "Backtest failed")
            }
        }
    }

    fun runOptimization() {
        val s = _uiState.value
        _uiState.value = s.copy(isLoading = true, errorMessage = null)

        viewModelScope.launch {
            val parameterRanges = when (s.selectedStrategy) {
                "MACD" -> mapOf(
                    "fastPeriod" to listOf(8.0, 12.0, 16.0),
                    "slowPeriod" to listOf(20.0, 26.0, 32.0)
                )
                "BOLLINGER_BANDS" -> mapOf(
                    "period" to listOf(15.0, 20.0, 25.0),
                    "stdDevMultiplier" to listOf(1.8, 2.0, 2.2)
                )
                else -> mapOf(
                    "emaPeriod" to listOf(14.0, 21.0, 30.0),
                    "rsiOverbought" to listOf(65.0, 70.0, 75.0)
                )
            }

            val req = OptimizationRequest(
                asset = s.selectedAsset,
                strategy = s.selectedStrategy,
                timeframe = s.selectedTimeframe,
                parameterRanges = parameterRanges,
                initialBalance = s.initialBalance,
                tradeAmount = s.tradeAmount
            )

            val result = repository.runOptimization(req)
            result.onSuccess { data ->
                _uiState.value = _uiState.value.copy(isLoading = false, optimizationResult = data)
            }.onFailure { err ->
                _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = err.message ?: "Optimization failed")
            }
        }
    }

    fun runWalkForward() {
        val s = _uiState.value
        _uiState.value = s.copy(isLoading = true, errorMessage = null)

        viewModelScope.launch {
            val parameterRanges = mapOf(
                "emaPeriod" to listOf(15.0, 21.0, 30.0)
            )
            val req = WalkForwardRequest(
                asset = s.selectedAsset,
                strategy = s.selectedStrategy,
                timeframe = s.selectedTimeframe,
                parameterRanges = parameterRanges,
                trainCandles = 50,
                testCandles = 20,
                stepCandles = 20,
                initialBalance = s.initialBalance,
                tradeAmount = s.tradeAmount
            )

            val result = repository.runWalkForward(req)
            result.onSuccess { data ->
                _uiState.value = _uiState.value.copy(isLoading = false, walkForwardResult = data)
            }.onFailure { err ->
                _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = err.message ?: "Walk-forward failed")
            }
        }
    }

    fun runMonteCarlo() {
        val s = _uiState.value
        val trades = s.backtestResult?.trades ?: listOf(
            BacktestTradeDto("1", s.selectedAsset, "BUY", 1.1000, 1.1050, 100.0, 50.0, "WIN", "2025-01-01"),
            BacktestTradeDto("2", s.selectedAsset, "SELL", 1.1050, 1.1020, 100.0, 30.0, "WIN", "2025-01-02"),
            BacktestTradeDto("3", s.selectedAsset, "BUY", 1.1020, 1.0980, 100.0, -40.0, "LOSS", "2025-01-03"),
            BacktestTradeDto("4", s.selectedAsset, "BUY", 1.0980, 1.1040, 100.0, 60.0, "WIN", "2025-01-04")
        )

        _uiState.value = s.copy(isLoading = true, errorMessage = null)

        viewModelScope.launch {
            val req = MonteCarloRequest(
                trades = trades,
                iterations = s.monteCarloIterations,
                initialBalance = s.initialBalance,
                strategy = s.selectedStrategy
            )
            val result = repository.runMonteCarlo(req)
            result.onSuccess { data ->
                _uiState.value = _uiState.value.copy(isLoading = false, monteCarloResult = data)
            }.onFailure { err ->
                _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = err.message ?: "Monte Carlo simulation failed")
            }
        }
    }

    fun loadRegimes() {
        val s = _uiState.value
        viewModelScope.launch {
            val result = repository.getMarketRegimes(s.selectedAsset, s.selectedTimeframe)
            result.onSuccess { data ->
                _uiState.value = _uiState.value.copy(regimeResponse = data)
            }
        }
    }

    fun calculatePositionSize(profile: String, entryPrice: Double, stopLossPrice: Double) {
        val s = _uiState.value
        viewModelScope.launch {
            val req = PositionSizingRequest(
                profile = profile,
                accountBalance = s.initialBalance,
                entryPrice = entryPrice,
                stopLossPrice = stopLossPrice
            )
            val result = repository.calculatePositionSize(req)
            result.onSuccess { data ->
                _uiState.value = _uiState.value.copy(positionSizing = data)
            }
        }
    }

    fun loadV2ValidationDashboard(symbol: String = _uiState.value.selectedAsset) {
        val s = _uiState.value
        _uiState.value = s.copy(isLoading = true, errorMessage = null)
        viewModelScope.launch {
            val result = repository.getV2ValidationDashboard(symbol)
            result.onSuccess { data ->
                _uiState.value = _uiState.value.copy(isLoading = false, v2ValidationDashboard = data)
            }.onFailure { err ->
                _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = err.message ?: "Failed to load V2 validation dashboard")
            }
        }
    }
}

