package com.tradepilot.data.remote

object ApiConfig {
    const val DEFAULT_EMULATOR_BASE_URL = "http://10.90.104.52:5000/"
    const val DEFAULT_EMULATOR_WS_URL = "ws://10.90.104.52:5000/ws"

    const val LOCALHOST_BASE_URL = "http://10.90.104.52:5000/"
    const val LOCALHOST_WS_URL = "ws://10.90.104.52:5000/ws"

    var baseUrl: String = LOCALHOST_BASE_URL
    var wsUrl: String = LOCALHOST_WS_URL
}
