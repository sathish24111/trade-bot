package com.tradepilot.data.repository

import com.tradepilot.data.local.PreferencesManager
import com.tradepilot.data.model.User
import com.tradepilot.data.remote.ApiClient
import com.tradepilot.data.remote.LoginRequest
import com.tradepilot.data.remote.RegisterRequest
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ApiAuthRepository(
    private val apiClient: ApiClient,
    private val preferencesManager: PreferencesManager,
    private val scope: CoroutineScope = CoroutineScope(Dispatchers.IO)
) : AuthRepository {

    private val _currentUser = MutableStateFlow(User())
    override val currentUser: StateFlow<User> = _currentUser.asStateFlow()

    private val _isLoggedIn = MutableStateFlow(false)
    override val isLoggedIn: StateFlow<Boolean> = _isLoggedIn.asStateFlow()

    private val _isServerOnline = MutableStateFlow(true)
    val isServerOnline: StateFlow<Boolean> = _isServerOnline.asStateFlow()

    init {
        scope.launch {
            preferencesManager.isLoggedInFlow.collect { loggedIn ->
                _isLoggedIn.value = loggedIn
            }
        }
        scope.launch {
            preferencesManager.userFlow.collect { user ->
                _currentUser.value = user
            }
        }
        checkServerStatus()
    }

    fun checkServerStatus() {
        scope.launch {
            try {
                val res = apiClient.apiService.checkHealth()
                _isServerOnline.value = res.isSuccessful
                if (res.isSuccessful) {
                    val loginRes = apiClient.apiService.login(LoginRequest("demo@tradepilot.app", "123456"))
                    if (loginRes.isSuccessful && loginRes.body()?.token != null) {
                        val body = loginRes.body()!!
                        val userDto = body.user!!
                        apiClient.updateToken(body.token)

                        val user = User(
                            id = "user_${userDto.id}",
                            fullName = userDto.name,
                            email = userDto.email,
                            mobileNumber = userDto.mobile ?: "+91 98765 43210",
                            demoBalance = userDto.demoBalance,
                            accountType = userDto.accountType,
                            isDemoMode = true
                        )

                        _currentUser.value = user
                        _isLoggedIn.value = true
                        preferencesManager.saveUser(user)
                        preferencesManager.setLoggedIn(true)
                    }
                }
            } catch (e: Exception) {
                _isServerOnline.value = false
            }
        }
    }

    override suspend fun login(email: String, password: String): Result<User> {
        val trimmedEmail = email.trim().lowercase()

        // Attempt Backend REST Authentication first
        try {
            val response = apiClient.apiService.login(LoginRequest(trimmedEmail, password))
            if (response.isSuccessful && response.body()?.token != null) {
                val body = response.body()!!
                val userDto = body.user!!
                apiClient.updateToken(body.token)

                val user = User(
                    id = "user_${userDto.id}",
                    fullName = userDto.name,
                    email = userDto.email,
                    mobileNumber = userDto.mobile ?: "+91 98765 43210",
                    demoBalance = userDto.demoBalance,
                    accountType = userDto.accountType,
                    isDemoMode = true
                )

                _currentUser.value = user
                _isLoggedIn.value = true
                _isServerOnline.value = true
                preferencesManager.saveUser(user)
                preferencesManager.setLoggedIn(true)
                return Result.success(user)
            } else if (response.code() == 400 || response.code() == 401) {
                return Result.failure(IllegalArgumentException(response.body()?.error ?: "Invalid email or password."))
            }
        } catch (e: Exception) {
            // Backend unreachable: server offline
            _isServerOnline.value = false
        }

        // Offline fallback handling: allow demo login with demo credentials
        if ((trimmedEmail == "demo@tradepilot.app" && password == "123456") ||
            (trimmedEmail.contains("@") && password.length >= 6)
        ) {
            val offlineUser = _currentUser.value.copy(
                email = trimmedEmail,
                fullName = if (trimmedEmail == "demo@tradepilot.app") "Sathish" else trimmedEmail.substringBefore("@")
            )
            _currentUser.value = offlineUser
            _isLoggedIn.value = true
            preferencesManager.saveUser(offlineUser)
            preferencesManager.setLoggedIn(true)
            return Result.success(offlineUser)
        }

        return Result.failure(IllegalArgumentException("Unable to connect to server and invalid credentials."))
    }

    override suspend fun register(name: String, email: String, phone: String, password: String): Result<User> {
        val trimmedEmail = email.trim().lowercase()

        // Attempt Backend REST Registration
        try {
            val response = apiClient.apiService.register(
                RegisterRequest(name.trim(), trimmedEmail, phone.trim(), password)
            )
            if (response.isSuccessful && response.body()?.token != null) {
                val body = response.body()!!
                val userDto = body.user!!
                apiClient.updateToken(body.token)

                val user = User(
                    id = "user_${userDto.id}",
                    fullName = userDto.name,
                    email = userDto.email,
                    mobileNumber = userDto.mobile ?: phone,
                    demoBalance = userDto.demoBalance,
                    accountType = userDto.accountType,
                    isDemoMode = true
                )

                _currentUser.value = user
                _isLoggedIn.value = true
                _isServerOnline.value = true
                preferencesManager.saveUser(user)
                preferencesManager.setLoggedIn(true)
                return Result.success(user)
            } else {
                return Result.failure(IllegalArgumentException(response.body()?.error ?: "Registration failed."))
            }
        } catch (e: Exception) {
            _isServerOnline.value = false
        }

        // Offline fallback registration
        val offlineUser = User(
            fullName = name.trim(),
            email = trimmedEmail,
            mobileNumber = phone.trim().ifBlank { "+91 98765 43210" },
            demoBalance = 10000.0,
            accountType = "Demo Account"
        )
        _currentUser.value = offlineUser
        _isLoggedIn.value = true
        preferencesManager.saveUser(offlineUser)
        preferencesManager.setLoggedIn(true)
        return Result.success(offlineUser)
    }

    override suspend fun logout() {
        apiClient.updateToken(null)
        _isLoggedIn.value = false
        preferencesManager.setLoggedIn(false)
    }

    override suspend fun updateProfile(name: String, email: String, phone: String) {
        val updated = _currentUser.value.copy(fullName = name, email = email, mobileNumber = phone)
        _currentUser.value = updated
        preferencesManager.saveUser(updated)
    }
}
