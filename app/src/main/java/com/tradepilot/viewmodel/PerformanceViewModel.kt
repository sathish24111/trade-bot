package com.tradepilot.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tradepilot.data.model.PerformanceSummary
import com.tradepilot.data.repository.PerformanceRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class PerformanceUiState(
    val summary: PerformanceSummary = PerformanceSummary(),
    val selectedTimeframe: String = "WEEK"
)

class PerformanceViewModel(
    private val performanceRepository: PerformanceRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(PerformanceUiState())
    val uiState: StateFlow<PerformanceUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            performanceRepository.performanceSummary.collect { summary ->
                _uiState.value = _uiState.value.copy(summary = summary)
            }
        }
    }

    fun setTimeframe(timeframe: String) {
        _uiState.value = _uiState.value.copy(selectedTimeframe = timeframe)
    }
}
