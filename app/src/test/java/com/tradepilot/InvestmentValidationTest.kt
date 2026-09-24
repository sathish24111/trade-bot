package com.tradepilot

import com.tradepilot.viewmodel.TradingSetupViewModel
import org.junit.Assert.*
import org.junit.Test

class InvestmentValidationTest {

    private val demoBalance = 10000.0

    @Test
    fun testValidInvestment() {
        assertNull(TradingSetupViewModel.validateInvestment(100.0, demoBalance))
        assertNull(TradingSetupViewModel.validateInvestment(500.0, demoBalance))
        assertNull(TradingSetupViewModel.validateInvestment(10000.0, demoBalance))
    }

    @Test
    fun testZeroInvestmentReturnsError() {
        val error = TradingSetupViewModel.validateInvestment(0.0, demoBalance)
        assertNotNull(error)
        assertTrue(error!!.contains("greater than $0"))
    }

    @Test
    fun testNegativeInvestmentReturnsError() {
        val error = TradingSetupViewModel.validateInvestment(-50.0, demoBalance)
        assertNotNull(error)
        assertTrue(error!!.contains("greater than $0"))
    }

    @Test
    fun testExceedingBalanceReturnsError() {
        val error = TradingSetupViewModel.validateInvestment(15000.0, demoBalance)
        assertNotNull(error)
        assertTrue(error!!.contains("cannot exceed demo balance"))
    }
}
