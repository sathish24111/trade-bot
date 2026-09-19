package com.tradepilot.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tradepilot.data.model.Trade
import com.tradepilot.data.model.TradeDirection
import com.tradepilot.data.model.TradeResultStatus
import com.tradepilot.data.repository.PerformanceRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

enum class HistoryFilter {
    ALL, WINS, LOSSES, BUY, SELL
}

data class TradeHistoryUiState(
    val trades: List<Trade> = emptyList(),
    val filteredTrades: List<Trade> = emptyList(),
    val searchQuery: String = "",
    val selectedFilter: HistoryFilter = HistoryFilter.ALL
)

class TradeHistoryViewModel(
    private val performanceRepository: PerformanceRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(TradeHistoryUiState())
    val uiState: StateFlow<TradeHistoryUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            performanceRepository.allTrades.collect { trades ->
                _uiState.value = _uiState.value.copy(trades = trades)
                applyFilterAndSearch()
            }
        }
    }

    fun onSearchQueryChange(query: String) {
        _uiState.value = _uiState.value.copy(searchQuery = query)
        applyFilterAndSearch()
    }

    fun onFilterSelect(filter: HistoryFilter) {
        _uiState.value = _uiState.value.copy(selectedFilter = filter)
        applyFilterAndSearch()
    }

    private fun applyFilterAndSearch() {
        val current = _uiState.value
        val query = current.searchQuery.trim().lowercase()

        val filtered = current.trades.filter { trade ->
            val matchesFilter = when (current.selectedFilter) {
                HistoryFilter.ALL -> true
                HistoryFilter.WINS -> trade.status == TradeResultStatus.WIN
                HistoryFilter.LOSSES -> trade.status == TradeResultStatus.LOSS
                HistoryFilter.BUY -> trade.direction == TradeDirection.BUY
                HistoryFilter.SELL -> trade.direction == TradeDirection.SELL
            }

            val matchesSearch = query.isEmpty() ||
                    trade.assetSymbol.lowercase().contains(query) ||
                    trade.timestamp.lowercase().contains(query)

            matchesFilter && matchesSearch
        }

        _uiState.value = _uiState.value.copy(filteredTrades = filtered)
    }
}
