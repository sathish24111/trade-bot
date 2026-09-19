package com.tradepilot.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tradepilot.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class AuthUiState(
    val fullName: String = "",
    val email: String = "demo@tradepilot.app",
    val mobileNumber: String = "",
    val password: String = "123456",
    val confirmPassword: String = "",
    val isPasswordVisible: Boolean = false,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val isSuccess: Boolean = false
)

class AuthViewModel(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    fun onFullNameChange(name: String) {
        _uiState.value = _uiState.value.copy(fullName = name, errorMessage = null)
    }

    fun onEmailChange(email: String) {
        _uiState.value = _uiState.value.copy(email = email, errorMessage = null)
    }

    fun onMobileNumberChange(mobile: String) {
        _uiState.value = _uiState.value.copy(mobileNumber = mobile, errorMessage = null)
    }

    fun onPasswordChange(password: String) {
        _uiState.value = _uiState.value.copy(password = password, errorMessage = null)
    }

    fun onConfirmPasswordChange(password: String) {
        _uiState.value = _uiState.value.copy(confirmPassword = password, errorMessage = null)
    }

    fun togglePasswordVisibility() {
        _uiState.value = _uiState.value.copy(isPasswordVisible = !_uiState.value.isPasswordVisible)
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(errorMessage = null)
    }

    fun login(onSuccess: () -> Unit) {
        val email = _uiState.value.email.trim()
        val password = _uiState.value.password

        if (!validateEmail(email)) {
            _uiState.value = _uiState.value.copy(errorMessage = "Please enter a valid email address.")
            return
        }
        if (password.length < 6) {
            _uiState.value = _uiState.value.copy(errorMessage = "Password must be at least 6 characters.")
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            val result = authRepository.login(email, password)
            _uiState.value = _uiState.value.copy(isLoading = false)
            if (result.isSuccess) {
                _uiState.value = _uiState.value.copy(isSuccess = true)
                onSuccess()
            } else {
                _uiState.value = _uiState.value.copy(errorMessage = result.exceptionOrNull()?.message ?: "Login failed.")
            }
        }
    }

    fun register(onSuccess: () -> Unit) {
        val state = _uiState.value
        if (state.fullName.isBlank()) {
            _uiState.value = _uiState.value.copy(errorMessage = "Full Name is required.")
            return
        }
        if (!validateEmail(state.email.trim())) {
            _uiState.value = _uiState.value.copy(errorMessage = "Please enter a valid email.")
            return
        }
        if (state.password.length < 6) {
            _uiState.value = _uiState.value.copy(errorMessage = "Password must be at least 6 characters.")
            return
        }
        if (state.password != state.confirmPassword) {
            _uiState.value = _uiState.value.copy(errorMessage = "Passwords do not match.")
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            val result = authRepository.register(
                name = state.fullName,
                email = state.email,
                phone = state.mobileNumber,
                password = state.password
            )
            _uiState.value = _uiState.value.copy(isLoading = false)
            if (result.isSuccess) {
                _uiState.value = _uiState.value.copy(isSuccess = true)
                onSuccess()
            } else {
                _uiState.value = _uiState.value.copy(errorMessage = result.exceptionOrNull()?.message ?: "Registration failed.")
            }
        }
    }

    companion object {
        fun validateEmail(email: String): Boolean {
            return email.contains("@") && email.contains(".") && email.length >= 5
        }

        fun validatePassword(password: String): Boolean {
            return password.length >= 6
        }
    }
}
