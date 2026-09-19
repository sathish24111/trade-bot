package com.tradepilot

import android.app.Application
import com.tradepilot.data.local.LocalTradeStorage
import com.tradepilot.data.local.PreferencesManager
import com.tradepilot.data.mock.*
import com.tradepilot.data.remote.ApiClient
import com.tradepilot.data.remote.WebSocketManager
import com.tradepilot.data.repository.*

class TradePilotApp : Application() {

    lateinit var preferencesManager: PreferencesManager
        private set

    lateinit var localTradeStorage: LocalTradeStorage
        private set

    lateinit var apiClient: ApiClient
        private set

    lateinit var webSocketManager: WebSocketManager
        private set

    lateinit var authRepository: AuthRepository
        private set

    lateinit var performanceRepository: PerformanceRepository
        private set

    lateinit var marketRepository: MarketRepository
        private set

    lateinit var tradingRepository: TradingRepository
        private set

    lateinit var settingsRepository: SettingsRepository
        private set

    lateinit var backtestRepository: BacktestRepository
        private set

    lateinit var researchRepository: ResearchRepository
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this

        preferencesManager = PreferencesManager(this)
        localTradeStorage = LocalTradeStorage(this)
        apiClient = ApiClient()
        webSocketManager = WebSocketManager()

        // Fallback local repositories
        val mockPerfRepo = MockPerformanceRepositoryImpl(localTradeStorage)
        val mockMarketRepo = MockMarketRepositoryImpl()
        val mockTradingRepo = MockTradingRepositoryImpl(preferencesManager, mockPerfRepo, mockMarketRepo)

        // API Repositories with WebSocket streaming & offline caching
        val apiAuthRepo = ApiAuthRepository(apiClient, preferencesManager)
        val apiMarketRepo = ApiMarketRepository(apiClient, webSocketManager)
        val apiTradingRepo = ApiTradingRepository(apiClient, webSocketManager, preferencesManager, mockTradingRepo)
        val apiPerfRepo = ApiPerformanceRepository(apiClient, webSocketManager, mockPerfRepo)
        val apiSettingsRepo = ApiSettingsRepository(preferencesManager)
        val apiBacktestRepo = ApiBacktestRepository(apiClient)
        val apiResearchRepo = ApiResearchRepository(apiClient)

        authRepository = apiAuthRepo
        performanceRepository = apiPerfRepo
        marketRepository = apiMarketRepo
        tradingRepository = apiTradingRepo
        settingsRepository = apiSettingsRepo
        backtestRepository = apiBacktestRepo
        researchRepository = apiResearchRepo

        // Connect WebSocket stream
        webSocketManager.connect()
    }

    companion object {
        lateinit var instance: TradePilotApp
            private set
    }
}
