package com.tradepilot

import com.tradepilot.data.model.BotLifecycleState
import com.tradepilot.data.model.BotSessionState
import org.junit.Assert.*
import org.junit.Test

class BotSessionLifecycleTest {

    @Test
    fun testInitialLifecycleIsIdle() {
        val state = BotSessionState()
        assertEquals(BotLifecycleState.IDLE, state.lifecycleState)
        assertEquals(0L, state.elapsedSeconds)
    }

    @Test
    fun testLifecycleTransitions() {
        var state = BotSessionState(lifecycleState = BotLifecycleState.IDLE)
        assertEquals(BotLifecycleState.IDLE, state.lifecycleState)

        // IDLE -> STARTING
        state = state.copy(lifecycleState = BotLifecycleState.STARTING)
        assertEquals(BotLifecycleState.STARTING, state.lifecycleState)

        // STARTING -> RUNNING
        state = state.copy(lifecycleState = BotLifecycleState.RUNNING)
        assertEquals(BotLifecycleState.RUNNING, state.lifecycleState)

        // RUNNING -> STOPPING
        state = state.copy(lifecycleState = BotLifecycleState.STOPPING)
        assertEquals(BotLifecycleState.STOPPING, state.lifecycleState)

        // STOPPING -> COMPLETED
        state = state.copy(lifecycleState = BotLifecycleState.COMPLETED, terminationReason = "Stopped by user")
        assertEquals(BotLifecycleState.COMPLETED, state.lifecycleState)
        assertEquals("Stopped by user", state.terminationReason)
    }
}
