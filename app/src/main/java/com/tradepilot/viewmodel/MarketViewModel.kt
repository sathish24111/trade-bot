package com.tradepilot.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tradepilot.data.model.MarketAsset
import com.tradepilot.data.repository.MarketRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class MarketUiState(
    val assets: List<MarketAsset> = emptyList(),
    val selectedAsset: MarketAsset? = null,
    val selectedTimeframe: String = "1M"
)

class MarketViewModel(
    private val marketRepository: MarketRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(MarketUiState())
    val uiState: StateFlow<MarketUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            marketRepository.availableAssets.collect { assets ->
                _uiState.value = _uiState.value.copy(
                    assets = assets,
                    selectedAsset = _uiState.value.selectedAsset ?: assets.firstOrNull()
                )
            }
        }
        viewModelScope.launch {
            marketRepository.selectedAsset.collect { asset ->
                _uiState.value = _uiState.value.copy(selectedAsset = asset)
            }
        }
    }

    fun selectAsset(symbol: String) {
        marketRepository.selectAsset(symbol)
    }

    fun selectTimeframe(timeframe: String) {
        _uiState.value = _uiState.value.copy(selectedTimeframe = timeframe)
    }
}
