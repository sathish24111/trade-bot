package com.tradepilot

import com.tradepilot.viewmodel.AuthViewModel
import org.junit.Assert.*
import org.junit.Test

class AuthValidationTest {

    @Test
    fun testValidEmail() {
        assertTrue(AuthViewModel.validateEmail("demo@tradepilot.app"))
        assertTrue(AuthViewModel.validateEmail("sathish.trader@gmail.com"))
    }

    @Test
    fun testInvalidEmail() {
        assertFalse(AuthViewModel.validateEmail("invalid-email"))
        assertFalse(AuthViewModel.validateEmail("test@"))
        assertFalse(AuthViewModel.validateEmail(""))
    }

    @Test
    fun testPasswordValidation() {
        assertTrue(AuthViewModel.validatePassword("123456"))
        assertTrue(AuthViewModel.validatePassword("password123"))
        assertFalse(AuthViewModel.validatePassword("12345"))
        assertFalse(AuthViewModel.validatePassword(""))
    }
}
