package com.tradepilot.data.mock

import com.tradepilot.data.model.Candle
import com.tradepilot.data.model.MarketAsset
import com.tradepilot.data.repository.MarketRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlin.random.Random

class MockMarketRepositoryImpl : MarketRepository {

    private val _availableAssets = MutableStateFlow(MockDataProvider.getInitialMarketAssets())
    override val availableAssets: StateFlow<List<MarketAsset>> = _availableAssets.asStateFlow()

    private val _selectedAsset = MutableStateFlow(_availableAssets.value.first())
    override val selectedAsset: StateFlow<MarketAsset> = _selectedAsset.asStateFlow()

    override fun selectAsset(symbol: String) {
        val found = _availableAssets.value.find { it.symbol == symbol }
        if (found != null) {
            _selectedAsset.value = found
        }
    }

    override fun triggerPriceTick() {
        val currentList = _availableAssets.value.toMutableList()
        val updated = currentList.map { asset ->
            val deltaPct = (Random.nextDouble(-0.0008, 0.0008))
            val newPrice = asset.currentPrice * (1.0 + deltaPct)
            val newChange = asset.change24h + (newPrice - asset.currentPrice)
            val newChangePct = (newChange / newPrice) * 100

            // update latest candle close or add small candle fluctuation
            val candles = asset.candles.toMutableList()
            if (candles.isNotEmpty()) {
                val lastCandle = candles.last()
                val updatedLastCandle = lastCandle.copy(
                    close = newPrice,
                    high = maxOf(lastCandle.high, newPrice),
                    low = minOf(lastCandle.low, newPrice)
                )
                candles[candles.lastIndex] = updatedLastCandle
            }

            asset.copy(
                currentPrice = newPrice,
                change24h = newChange,
                changePercent = newChangePct,
                candles = candles
            )
        }
        _availableAssets.value = updated
        _selectedAsset.value = updated.find { it.symbol == _selectedAsset.value.symbol } ?: updated.first()
    }
}
