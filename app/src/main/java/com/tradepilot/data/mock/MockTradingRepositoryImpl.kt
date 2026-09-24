package com.tradepilot.data.mock

import com.tradepilot.data.local.PreferencesManager
import com.tradepilot.data.model.*
import com.tradepilot.data.repository.MarketRepository
import com.tradepilot.data.repository.PerformanceRepository
import com.tradepilot.data.repository.TradingRepository
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.text.SimpleDateFormat
import java.util.*
import kotlin.random.Random

class MockTradingRepositoryImpl(
    private val preferencesManager: PreferencesManager,
    private val performanceRepository: PerformanceRepository,
    private val marketRepository: MarketRepository,
    private val coroutineScope: CoroutineScope = CoroutineScope(Dispatchers.Default)
) : TradingRepository {

    private val _botSessionState = MutableStateFlow(BotSessionState())
    override val botSessionState: StateFlow<BotSessionState> = _botSessionState.asStateFlow()

    private val _demoBalance = MutableStateFlow(RiskLimits.INITIAL_DEMO_BALANCE)
    override val demoBalance: StateFlow<Double> = _demoBalance.asStateFlow()

    private var sessionJob: Job? = null

    init {
        coroutineScope.launch {
            preferencesManager.userFlow.collect { user ->
                _demoBalance.value = user.demoBalance
            }
        }
    }

    override suspend fun startBotSession(config: BotSessionConfig): Result<Unit> {
        if (_botSessionState.value.lifecycleState == BotLifecycleState.RUNNING ||
            _botSessionState.value.lifecycleState == BotLifecycleState.STARTING
        ) {
            return Result.failure(IllegalStateException("Bot is already running."))
        }

        // Validate investment amount
        if (config.investmentAmount <= 0) {
            return Result.failure(IllegalArgumentException("Investment amount must be greater than $0."))
        }
        if (config.investmentAmount > _demoBalance.value) {
            return Result.failure(IllegalArgumentException("Investment amount exceeds available demo balance."))
        }

        // Transition: IDLE -> STARTING
        val totalSecs = config.duration.totalMinutes * 60L
        _botSessionState.value = BotSessionState(
            lifecycleState = BotLifecycleState.STARTING,
            config = config,
            elapsedSeconds = 0L,
            remainingSeconds = totalSecs,
            currentPnL = 0.0,
            tradesCount = 0,
            winCount = 0,
            lossCount = 0,
            winRate = 0.0,
            sessionLogs = listOf(
                "[${currentTimeString()}] Initializing ${config.strategy.displayName} engine in DEMO MODE...",
                "[${currentTimeString()}] Risk profile: ${config.riskLevel.displayName} (Max ${((config.riskLevel.maxRiskPerTradePercent * 100).toInt())}% per trade)",
                "[${currentTimeString()}] Daily loss protection active (Limit: $${RiskLimits.calculateMaxLossThreshold().toInt()})"
            )
        )

        sessionJob?.cancel()
        sessionJob = coroutineScope.launch {
            // Simulate 1 second startup handshake
            delay(1000)
            
            // Transition: STARTING -> RUNNING
            _botSessionState.value = _botSessionState.value.copy(
                lifecycleState = BotLifecycleState.RUNNING,
                sessionLogs = _botSessionState.value.sessionLogs + "[${currentTimeString()}] Market Analysis Active. Monitoring signals..."
            )

            runSimulationLoop(config, totalSecs)
        }

        return Result.success(Unit)
    }

    private suspend fun CoroutineScope.runSimulationLoop(config: BotSessionConfig, totalSeconds: Long) {
        var elapsed = 0L
        var pnl = 0.0
        var trades = 0
        var wins = 0
        var losses = 0
        val maxLossLimit = -RiskLimits.calculateMaxLossThreshold() // e.g. -500.0

        val timeFormat = SimpleDateFormat("HH:mm", Locale.US)

        while (isActive && elapsed < totalSeconds) {
            delay(1000)
            elapsed++
            val remaining = totalSeconds - elapsed

            // Trigger mock market price updates
            marketRepository.triggerPriceTick()

            val currentLogs = _botSessionState.value.sessionLogs.toMutableList()

            // Simulate trade event every 5 seconds if no active trade or time to execute
            if (elapsed > 0 && elapsed % 5L == 0L) {
                val asset = marketRepository.selectedAsset.value
                val isBuy = Random.nextBoolean()
                val isWin = Random.nextDouble() < 0.65 // ~65% win rate simulation
                
                // Trade amount constrained to 1% of investment
                val tradeStake = minOf(config.investmentAmount * 0.1, 50.0).coerceAtLeast(10.0)
                val tradePnl = if (isWin) {
                    (tradeStake * Random.nextDouble(0.70, 0.88))
                } else {
                    -tradeStake
                }

                trades++
                if (isWin) wins++ else losses++
                pnl += tradePnl

                // Update Demo Balance locally
                val newBalance = (_demoBalance.value + tradePnl).coerceAtLeast(0.0)
                _demoBalance.value = newBalance
                preferencesManager.updateBalance(newBalance)

                val direction = if (isBuy) TradeDirection.BUY else TradeDirection.SELL
                val entryPrice = asset.currentPrice
                val exitPrice = if (isBuy) {
                    if (isWin) entryPrice * 1.0004 else entryPrice * 0.9996
                } else {
                    if (isWin) entryPrice * 0.9996 else entryPrice * 1.0004
                }

                val simulatedTrade = Trade(
                    id = "SIM-${Random.nextInt(1000, 9999)}",
                    assetSymbol = asset.symbol,
                    direction = direction,
                    amount = tradeStake,
                    entryPrice = entryPrice,
                    exitPrice = exitPrice,
                    pnl = ((tradePnl * 100).toInt()) / 100.0,
                    status = if (isWin) TradeResultStatus.WIN else TradeResultStatus.LOSS,
                    timestamp = timeFormat.format(Date()),
                    durationMinutes = 5
                )

                // Record into performance history
                performanceRepository.recordSimulatedTrade(simulatedTrade)

                val outcomeTag = if (isWin) "+$${String.format(Locale.US, "%.2f", tradePnl)}" else "-$${String.format(Locale.US, "%.2f", -tradePnl)}"
                currentLogs.add(
                    0,
                    "[${currentTimeString()}] ${direction.name} ${asset.symbol} completed: $outcomeTag (${if (isWin) "WIN" else "LOSS"})"
                )
                if (currentLogs.size > 20) currentLogs.removeAt(currentLogs.lastIndex)

                // Risk Management Check: Daily Loss Limit
                if (pnl <= maxLossLimit) {
                    currentLogs.add(0, "[${currentTimeString()}] Daily Loss Limit Reached. Bot automatically stopped.")
                    _botSessionState.value = _botSessionState.value.copy(
                        lifecycleState = BotLifecycleState.COMPLETED,
                        elapsedSeconds = elapsed,
                        remainingSeconds = remaining,
                        currentPnL = pnl,
                        tradesCount = trades,
                        winCount = wins,
                        lossCount = losses,
                        winRate = if (trades > 0) (wins.toDouble() / trades) * 100.0 else 0.0,
                        sessionLogs = currentLogs,
                        terminationReason = "Daily Loss Limit Reached\nBot automatically stopped."
                    )
                    return
                }
            }

            val currentWinRate = if (trades > 0) (wins.toDouble() / trades) * 100.0 else 0.0

            _botSessionState.value = _botSessionState.value.copy(
                elapsedSeconds = elapsed,
                remainingSeconds = remaining,
                currentPnL = pnl,
                tradesCount = trades,
                winCount = wins,
                lossCount = losses,
                winRate = currentWinRate,
                sessionLogs = currentLogs
            )
        }

        // Finished naturally by duration expiry
        if (_botSessionState.value.lifecycleState == BotLifecycleState.RUNNING) {
            _botSessionState.value = _botSessionState.value.copy(
                lifecycleState = BotLifecycleState.COMPLETED,
                terminationReason = "Trading session duration completed."
            )
        }
    }

    override suspend fun stopBotSession(reason: String) {
        if (_botSessionState.value.lifecycleState != BotLifecycleState.RUNNING &&
            _botSessionState.value.lifecycleState != BotLifecycleState.STARTING
        ) {
            return
        }

        // Transition: RUNNING -> STOPPING
        _botSessionState.value = _botSessionState.value.copy(
            lifecycleState = BotLifecycleState.STOPPING,
            sessionLogs = listOf("[${currentTimeString()}] Stopping session and securing simulated positions...") + _botSessionState.value.sessionLogs
        )

        sessionJob?.cancel()
        delay(600) // smooth stopping transition

        // Transition: STOPPING -> COMPLETED
        _botSessionState.value = _botSessionState.value.copy(
            lifecycleState = BotLifecycleState.COMPLETED,
            terminationReason = reason,
            sessionLogs = listOf("[${currentTimeString()}] Session stopped. All simulated positions closed.") + _botSessionState.value.sessionLogs
        )
    }

    override fun resetSession() {
        sessionJob?.cancel()
        _botSessionState.value = BotSessionState(lifecycleState = BotLifecycleState.IDLE)
    }

    private fun currentTimeString(): String {
        return SimpleDateFormat("HH:mm:ss", Locale.US).format(Date())
    }
}
