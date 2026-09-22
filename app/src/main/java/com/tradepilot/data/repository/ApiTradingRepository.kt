package com.tradepilot.data.repository

import com.tradepilot.data.local.PreferencesManager
import com.tradepilot.data.mock.MockTradingRepositoryImpl
import com.tradepilot.data.model.*
import com.tradepilot.data.remote.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ApiTradingRepository(
    private val apiClient: ApiClient,
    private val webSocketManager: WebSocketManager,
    private val preferencesManager: PreferencesManager,
    private val fallbackTradingRepo: MockTradingRepositoryImpl,
    private val scope: CoroutineScope = CoroutineScope(Dispatchers.IO)
) : TradingRepository {

    private val _botSessionState = MutableStateFlow(BotSessionState())
    override val botSessionState: StateFlow<BotSessionState> = _botSessionState.asStateFlow()

    private val _demoBalance = MutableStateFlow(10000.0)
    override val demoBalance: StateFlow<Double> = _demoBalance.asStateFlow()

    private var activeSessionId: String? = null
    private var isUsingOfflineFallback: Boolean = false

    init {
        scope.launch {
            preferencesManager.userFlow.collect { user ->
                _demoBalance.value = user.demoBalance
            }
        }

        // Listen for real-time WebSocket events from backend
        scope.launch {
            webSocketManager.events.collect { event ->
                if (isUsingOfflineFallback) return@collect

                when (event.type) {
                    "BOT_STATUS" -> {
                        _botSessionState.value = _botSessionState.value.copy(
                            lifecycleState = when (event.status) {
                                "STARTING" -> BotLifecycleState.STARTING
                                "RUNNING" -> BotLifecycleState.RUNNING
                                "STOPPING" -> BotLifecycleState.STOPPING
                                "COMPLETED" -> BotLifecycleState.COMPLETED
                                else -> BotLifecycleState.IDLE
                            },
                            elapsedSeconds = event.elapsedSeconds ?: _botSessionState.value.elapsedSeconds,
                            remainingSeconds = event.remainingSeconds ?: _botSessionState.value.remainingSeconds,
                            currentPnL = event.currentPnL ?: _botSessionState.value.currentPnL,
                            tradesCount = event.tradesCount ?: _botSessionState.value.tradesCount,
                            winRate = event.winRate ?: _botSessionState.value.winRate,
                            sessionLogs = event.logs ?: _botSessionState.value.sessionLogs
                        )
                    }
                    "PNL_UPDATE" -> {
                        if (event.currentPnL != null) {
                            _botSessionState.value = _botSessionState.value.copy(currentPnL = event.currentPnL)
                            if (event.pnlChange != null) {
                                val newBal = (_demoBalance.value + event.pnlChange).coerceAtLeast(0.0)
                                _demoBalance.value = newBal
                                preferencesManager.updateBalance(newBal)
                            }
                        }
                    }
                    "SESSION_COMPLETED" -> {
                        _botSessionState.value = _botSessionState.value.copy(
                            lifecycleState = BotLifecycleState.COMPLETED,
                            terminationReason = event.message ?: "Trading session completed."
                        )
                    }
                    "RISK_ALERT" -> {
                        _botSessionState.value = _botSessionState.value.copy(
                            lifecycleState = BotLifecycleState.COMPLETED,
                            terminationReason = event.message ?: "Daily loss limit reached. Bot stopped."
                        )
                    }
                }
            }
        }

        // Mirror fallback repo if active
        scope.launch {
            fallbackTradingRepo.botSessionState.collect { state ->
                if (isUsingOfflineFallback) {
                    _botSessionState.value = state
                }
            }
        }
        scope.launch {
            fallbackTradingRepo.demoBalance.collect { bal ->
                if (isUsingOfflineFallback) {
                    _demoBalance.value = bal
                }
            }
        }
    }

    override suspend fun startBotSession(config: BotSessionConfig): Result<Unit> {
        // Attempt Backend REST call to start paper session
        try {
            webSocketManager.connect()
            val req = StartSessionRequest(
                investmentAmount = config.investmentAmount,
                asset = config.asset.symbol,
                strategy = config.strategy.name,
                riskLevel = config.riskLevel.name,
                duration = config.duration.totalMinutes
            )
            val response = apiClient.apiService.startSession(req)
            if (response.isSuccessful && response.body()?.success == true) {
                isUsingOfflineFallback = false
                activeSessionId = response.body()?.sessionId
                _botSessionState.value = BotSessionState(
                    lifecycleState = BotLifecycleState.STARTING,
                    config = config,
                    remainingSeconds = config.duration.totalMinutes * 60L
                )
                return Result.success(Unit)
            }
        } catch (e: Exception) {
            // Server offline: fall back to local simulated engine
            isUsingOfflineFallback = true
        }

        // Offline fallback
        isUsingOfflineFallback = true
        return fallbackTradingRepo.startBotSession(config)
    }

    override suspend fun stopBotSession(reason: String) {
        if (isUsingOfflineFallback) {
            fallbackTradingRepo.stopBotSession(reason)
            return
        }

        val id = activeSessionId
        if (id != null) {
            try {
                apiClient.apiService.stopSession(id)
            } catch (e: Exception) {
                // Ignore or mark completed
            }
        }
        _botSessionState.value = _botSessionState.value.copy(
            lifecycleState = BotLifecycleState.COMPLETED,
            terminationReason = reason
        )
    }

    override fun resetSession() {
        if (isUsingOfflineFallback) {
            fallbackTradingRepo.resetSession()
        }
        _botSessionState.value = BotSessionState(lifecycleState = BotLifecycleState.IDLE)
        activeSessionId = null
    }
}
