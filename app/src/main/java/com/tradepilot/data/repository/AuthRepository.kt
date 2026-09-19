package com.tradepilot.data.repository

import com.tradepilot.data.model.User
import kotlinx.coroutines.flow.StateFlow

interface AuthRepository {
    val currentUser: StateFlow<User>
    val isLoggedIn: StateFlow<Boolean>
    suspend fun login(email: String, password: String): Result<User>
    suspend fun register(name: String, email: String, phone: String, password: String): Result<User>
    suspend fun logout()
    suspend fun updateProfile(name: String, email: String, phone: String)
}
