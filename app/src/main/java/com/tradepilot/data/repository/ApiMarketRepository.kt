package com.tradepilot.data.repository

import com.tradepilot.data.mock.MockDataProvider
import com.tradepilot.data.model.*
import com.tradepilot.data.remote.ApiClient
import com.tradepilot.data.remote.WebSocketManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ApiMarketRepository(
    private val apiClient: ApiClient,
    private val webSocketManager: WebSocketManager,
    private val scope: CoroutineScope = CoroutineScope(Dispatchers.IO)
) : MarketRepository {

    private val _availableAssets = MutableStateFlow(MockDataProvider.getInitialMarketAssets())
    override val availableAssets: StateFlow<List<MarketAsset>> = _availableAssets.asStateFlow()

    private val _selectedAsset = MutableStateFlow(_availableAssets.value.first())
    override val selectedAsset: StateFlow<MarketAsset> = _selectedAsset.asStateFlow()

    init {
        // 1. Initial fetch from Backend REST API
        scope.launch {
            try {
                val res = apiClient.apiService.getAssets()
                if (res.isSuccessful && res.body()?.assets != null) {
                    val apiAssets = res.body()!!.assets!!.map { dto ->
                        MarketAsset(
                            symbol = dto.symbol,
                            name = dto.name,
                            currentPrice = dto.price,
                            change24h = dto.change24h,
                            changePercent = dto.changePercent,
                            trend = if (dto.trend == "BULLISH") MarketTrend.BULLISH else if (dto.trend == "BEARISH") MarketTrend.BEARISH else MarketTrend.NEUTRAL,
                            demoSignal = if (dto.demoSignal == "BUY") DemoSignal.BUY else if (dto.demoSignal == "SELL") DemoSignal.SELL else DemoSignal.WAIT,
                            confidencePercent = dto.confidence,
                            indicators = TechnicalIndicators(
                                ema21 = dto.indicators.ema21 ?: dto.indicators.ema,
                                rsi = dto.indicators.rsi14 ?: dto.indicators.rsi,
                                macdStatus = dto.indicators.macd?.toString() ?: "Positive",
                                bollingerStatus = dto.indicators.bollinger?.toString() ?: "Normal",
                                sma20 = dto.indicators.sma20 ?: 0.0,
                                sma50 = dto.indicators.sma50 ?: 0.0,
                                atr14 = dto.indicators.atr14 ?: 0.0
                            ),
                            candles = dto.candles?.map { c ->
                                Candle(c.timestamp, c.open, c.high, c.low, c.close)
                            } ?: MockDataProvider.generateMockCandles(dto.price, dto.price * 0.0005, 25),
                            status = dto.status ?: "SIMULATED",
                            isLive = dto.isLive,
                            reason = dto.reason ?: "Algorithmic momentum and trend analysis",
                            timeframe = dto.timeframe ?: "5m"
                        )
                    }
                    if (apiAssets.isNotEmpty()) {
                        _availableAssets.value = apiAssets
                        _selectedAsset.value = apiAssets.find { it.symbol == _selectedAsset.value.symbol } ?: apiAssets.first()
                    }
                }
            } catch (e: Exception) {
                // Offline fallback: retains initial mock data
            }
        }

        // 2. Subscribe to real-time WebSocket MARKET_UPDATE events
        scope.launch {
            webSocketManager.events.collect { event ->
                if (event.type == "MARKET_UPDATE" && event.asset != null && event.price != null) {
                    val currentList = _availableAssets.value.toMutableList()
                    val idx = currentList.indexOfFirst { it.symbol == event.asset }
                    if (idx != -1) {
                        val existing = currentList[idx]
                        val updated = existing.copy(
                            currentPrice = event.price,
                            changePercent = event.changePercent ?: existing.changePercent,
                            confidencePercent = event.confidence ?: existing.confidencePercent,
                            demoSignal = when (event.demoSignal) {
                                "BUY" -> DemoSignal.BUY
                                "SELL" -> DemoSignal.SELL
                                else -> DemoSignal.WAIT
                            }
                        )
                        currentList[idx] = updated
                        _availableAssets.value = currentList
                        if (_selectedAsset.value.symbol == event.asset) {
                            _selectedAsset.value = updated
                        }
                    }
                }
            }
        }
    }

    override fun selectAsset(symbol: String) {
        val found = _availableAssets.value.find { it.symbol == symbol }
        if (found != null) {
            _selectedAsset.value = found
        }
    }

    override fun triggerPriceTick() {
        // Fallback local simulated tick
        val currentList = _availableAssets.value.toMutableList()
        val updated = currentList.map { asset ->
            val deltaPct = (kotlin.random.Random.nextDouble(-0.0008, 0.0008))
            val newPrice = asset.currentPrice * (1.0 + deltaPct)
            asset.copy(
                currentPrice = newPrice,
                changePercent = asset.changePercent + (deltaPct * 100)
            )
        }
        _availableAssets.value = updated
        _selectedAsset.value = updated.find { it.symbol == _selectedAsset.value.symbol } ?: updated.first()
    }
}
