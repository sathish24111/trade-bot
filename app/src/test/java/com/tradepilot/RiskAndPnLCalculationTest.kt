package com.tradepilot

import com.tradepilot.data.model.RiskLimits
import org.junit.Assert.*
import org.junit.Test

class RiskAndPnLCalculationTest {

    @Test
    fun testRiskLimits() {
        val initialBalance = 10000.0
        val maxLoss = RiskLimits.calculateMaxLossThreshold(initialBalance)
        assertEquals(500.0, maxLoss, 0.001) // 5% of 10,000 is 500
    }

    @Test
    fun testWinRateCalculation() {
        val wins = 15
        val losses = 9
        val total = wins + losses
        val winRate = (wins.toDouble() / total) * 100.0
        assertEquals(62.5, winRate, 0.01)
    }

    @Test
    fun testSimulatedPnLSum() {
        val tradesPnl = listOf(8.20, 15.50, -12.00, 18.00, 45.80, -22.50, 7.50, -14.00)
        val sum = tradesPnl.sum()
        assertEquals(46.50, sum, 0.01)
    }
}
