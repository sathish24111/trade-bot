package com.tradepilot.data.remote

object ApiConfig {
    // 10.0.2.2 is the standard loopback alias in Android emulator to access the host PC
    const val DEFAULT_EMULATOR_BASE_URL = "http://10.0.2.2:5000/"
    const val DEFAULT_EMULATOR_WS_URL = "ws://10.0.2.2:5000/ws"

    const val LOCALHOST_BASE_URL = "http://127.0.0.1:5000/"
    const val LOCALHOST_WS_URL = "ws://127.0.0.1:5000/ws"

    var baseUrl: String = DEFAULT_EMULATOR_BASE_URL
    var wsUrl: String = DEFAULT_EMULATOR_WS_URL
}
