package com.tradepilot.data.mock

import com.tradepilot.data.local.PreferencesManager
import com.tradepilot.data.model.User
import com.tradepilot.data.repository.AuthRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class MockAuthRepositoryImpl(
    private val preferencesManager: PreferencesManager,
    private val externalScope: CoroutineScope = CoroutineScope(Dispatchers.IO)
) : AuthRepository {

    private val _currentUser = MutableStateFlow(User())
    override val currentUser: StateFlow<User> = _currentUser.asStateFlow()

    private val _isLoggedIn = MutableStateFlow(false)
    override val isLoggedIn: StateFlow<Boolean> = _isLoggedIn.asStateFlow()

    init {
        externalScope.launch {
            preferencesManager.isLoggedInFlow.collect { loggedIn ->
                _isLoggedIn.value = loggedIn
            }
        }
        externalScope.launch {
            preferencesManager.userFlow.collect { user ->
                _currentUser.value = user
            }
        }
    }

    override suspend fun login(email: String, password: String): Result<User> {
        val trimmedEmail = email.trim().lowercase()
        // Accept demo credentials or any validly formatted test input for Phase 1 demo
        if ((trimmedEmail == "demo@tradepilot.app" && password == "123456") ||
            (trimmedEmail.contains("@") && password.length >= 6)
        ) {
            val user = _currentUser.value.copy(
                email = trimmedEmail,
                fullName = if (trimmedEmail == "demo@tradepilot.app") "Sathish" else trimmedEmail.substringBefore("@").replaceFirstChar { it.uppercase() }
            )
            _currentUser.value = user
            _isLoggedIn.value = true
            preferencesManager.saveUser(user)
            preferencesManager.setLoggedIn(true)
            return Result.success(user)
        }
        return Result.failure(IllegalArgumentException("Invalid email or password. Use demo@tradepilot.app / 123456"))
    }

    override suspend fun register(
        name: String,
        email: String,
        phone: String,
        password: String
    ): Result<User> {
        val trimmedEmail = email.trim().lowercase()
        if (name.isBlank() || trimmedEmail.isBlank() || password.length < 6) {
            return Result.failure(IllegalArgumentException("Please provide valid registration details."))
        }
        val newUser = User(
            fullName = name.trim(),
            email = trimmedEmail,
            mobileNumber = phone.trim().ifBlank { "+91 98765 43210" },
            demoBalance = 10000.0,
            accountType = "Demo Account"
        )
        _currentUser.value = newUser
        _isLoggedIn.value = true
        preferencesManager.saveUser(newUser)
        preferencesManager.setLoggedIn(true)
        return Result.success(newUser)
    }

    override suspend fun logout() {
        _isLoggedIn.value = false
        preferencesManager.setLoggedIn(false)
    }

    override suspend fun updateProfile(name: String, email: String, phone: String) {
        val updated = _currentUser.value.copy(
            fullName = name,
            email = email,
            mobileNumber = phone
        )
        _currentUser.value = updated
        preferencesManager.saveUser(updated)
    }
}
