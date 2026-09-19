package com.tradepilot.data.repository

import com.tradepilot.data.model.BotSessionConfig
import com.tradepilot.data.model.BotSessionState
import kotlinx.coroutines.flow.StateFlow

interface TradingRepository {
    val botSessionState: StateFlow<BotSessionState>
    val demoBalance: StateFlow<Double>
    suspend fun startBotSession(config: BotSessionConfig): Result<Unit>
    suspend fun stopBotSession(reason: String = "Stopped by user")
    fun resetSession()
}
