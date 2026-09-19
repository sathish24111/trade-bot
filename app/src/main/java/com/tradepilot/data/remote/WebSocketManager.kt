package com.tradepilot.data.remote

import com.google.gson.Gson
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import okhttp3.*
import java.util.concurrent.TimeUnit

class WebSocketManager(
    private val okHttpClient: OkHttpClient = OkHttpClient.Builder()
        .pingInterval(15, TimeUnit.SECONDS)
        .build(),
    private val gson: Gson = Gson(),
    private val scope: CoroutineScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
) {
    private var webSocket: WebSocket? = null

    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

    private val _events = MutableSharedFlow<WsEventDto>(replay = 1, extraBufferCapacity = 64)
    val events: SharedFlow<WsEventDto> = _events.asSharedFlow()

    fun connect(wsUrl: String = ApiConfig.wsUrl) {
        if (_isConnected.value) return

        val request = Request.Builder()
            .url(wsUrl)
            .build()

        webSocket = okHttpClient.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                _isConnected.value = true
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                try {
                    val event = gson.fromJson(text, WsEventDto::class.java)
                    if (event != null) {
                        scope.launch {
                            _events.emit(event)
                        }
                    }
                } catch (e: Exception) {
                    // Ignore parse errors on ping/pong or unknown packets
                }
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                _isConnected.value = false
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                _isConnected.value = false
            }
        })
    }

    fun disconnect() {
        webSocket?.close(1000, "App closed")
        webSocket = null
        _isConnected.value = false
    }
}
