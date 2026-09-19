package com.tradepilot.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tradepilot.data.model.AppSettings
import com.tradepilot.data.model.RiskLevel
import com.tradepilot.data.model.SessionDuration
import com.tradepilot.data.model.TradingStrategy
import com.tradepilot.data.repository.SettingsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

enum class SettingsInfoType {
    ABOUT, DEMO_MODE, PRIVACY, TERMS
}

data class SettingsUiState(
    val settings: AppSettings = AppSettings(),
    val activeInfoType: SettingsInfoType? = null
)

class SettingsViewModel(
    private val settingsRepository: SettingsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            settingsRepository.settings.collect { settings ->
                _uiState.value = _uiState.value.copy(settings = settings)
            }
        }
    }

    fun toggleNotifications(enabled: Boolean) {
        val updated = _uiState.value.settings.copy(notificationsEnabled = enabled)
        update(updated)
    }

    fun toggleDarkMode(enabled: Boolean) {
        val updated = _uiState.value.settings.copy(darkModeEnabled = enabled)
        update(updated)
    }

    fun toggleSoundAlerts(enabled: Boolean) {
        val updated = _uiState.value.settings.copy(soundAlertsEnabled = enabled)
        update(updated)
    }

    fun setDefaultRisk(riskLevel: RiskLevel) {
        val updated = _uiState.value.settings.copy(defaultRisk = riskLevel)
        update(updated)
    }

    fun setDefaultStrategy(strategy: TradingStrategy) {
        val updated = _uiState.value.settings.copy(defaultStrategy = strategy)
        update(updated)
    }

    fun setDefaultDuration(duration: SessionDuration) {
        val updated = _uiState.value.settings.copy(defaultDuration = duration)
        update(updated)
    }

    fun showInfo(type: SettingsInfoType) {
        _uiState.value = _uiState.value.copy(activeInfoType = type)
    }

    fun dismissInfo() {
        _uiState.value = _uiState.value.copy(activeInfoType = null)
    }

    private fun update(newSettings: AppSettings) {
        _uiState.value = _uiState.value.copy(settings = newSettings)
        viewModelScope.launch {
            settingsRepository.updateSettings(newSettings)
        }
    }
}
