package com.tradepilot.data.model

enum class BotLifecycleState {
    IDLE,
    STARTING,
    RUNNING,
    STOPPING,
    COMPLETED
}

data class BotSessionState(
    val lifecycleState: BotLifecycleState = BotLifecycleState.IDLE,
    val config: BotSessionConfig = BotSessionConfig(),
    val elapsedSeconds: Long = 0L,
    val remainingSeconds: Long = 1800L,
    val currentPnL: Double = 0.0,
    val tradesCount: Int = 0,
    val winCount: Int = 0,
    val lossCount: Int = 0,
    val winRate: Double = 0.0,
    val activeSimulatedTrade: Trade? = null,
    val sessionLogs: List<String> = emptyList(),
    val terminationReason: String? = null
)
