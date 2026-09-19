package com.tradepilot.data.repository

import com.tradepilot.data.model.MarketAsset
import kotlinx.coroutines.flow.StateFlow

interface MarketRepository {
    val availableAssets: StateFlow<List<MarketAsset>>
    val selectedAsset: StateFlow<MarketAsset>
    fun selectAsset(symbol: String)
    fun triggerPriceTick()
}
