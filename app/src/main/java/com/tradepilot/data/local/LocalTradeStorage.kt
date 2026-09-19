package com.tradepilot.data.local

import android.content.Context
import com.tradepilot.data.model.Trade
import com.tradepilot.data.model.TradeDirection
import com.tradepilot.data.model.TradeResultStatus
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

class LocalTradeStorage(private val context: Context) {

    private val file: File
        get() = File(context.filesDir, "demo_trades.json")

    fun loadTrades(): List<Trade> {
        if (!file.exists()) return emptyList()
        return try {
            val jsonStr = file.readText()
            val array = JSONArray(jsonStr)
            val list = mutableListOf<Trade>()
            for (i in 0 until array.length()) {
                val obj = array.getJSONObject(i)
                list.add(
                    Trade(
                        id = obj.getString("id"),
                        assetSymbol = obj.getString("assetSymbol"),
                        direction = TradeDirection.valueOf(obj.getString("direction")),
                        amount = obj.getDouble("amount"),
                        entryPrice = obj.getDouble("entryPrice"),
                        exitPrice = obj.getDouble("exitPrice"),
                        pnl = obj.getDouble("pnl"),
                        status = TradeResultStatus.valueOf(obj.getString("status")),
                        timestamp = obj.getString("timestamp"),
                        durationMinutes = obj.optInt("durationMinutes", 5)
                    )
                )
            }
            list
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun saveTrades(trades: List<Trade>) {
        try {
            val array = JSONArray()
            trades.forEach { trade ->
                val obj = JSONObject()
                obj.put("id", trade.id)
                obj.put("assetSymbol", trade.assetSymbol)
                obj.put("direction", trade.direction.name)
                obj.put("amount", trade.amount)
                obj.put("entryPrice", trade.entryPrice)
                obj.put("exitPrice", trade.exitPrice)
                obj.put("pnl", trade.pnl)
                obj.put("status", trade.status.name)
                obj.put("timestamp", trade.timestamp)
                obj.put("durationMinutes", trade.durationMinutes)
                array.put(obj)
            }
            file.writeText(array.toString())
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun addTrade(trade: Trade) {
        val current = loadTrades().toMutableList()
        current.add(0, trade) // newest first
        saveTrades(current)
    }
}
