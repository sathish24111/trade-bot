package com.tradepilot.data.model

data class User(
    val id: String = "user_demo_01",
    val fullName: String = "Sathish",
    val email: String = "demo@tradepilot.app",
    val mobileNumber: String = "+91 98765 43210",
    val demoBalance: Double = 10000.0,
    val accountType: String = "Demo Account",
    val isDemoMode: Boolean = true
)
