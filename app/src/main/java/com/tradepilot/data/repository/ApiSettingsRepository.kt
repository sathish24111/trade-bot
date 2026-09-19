package com.tradepilot.data.repository

import com.tradepilot.data.local.PreferencesManager
import com.tradepilot.data.model.AppSettings
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ApiSettingsRepository(
    private val preferencesManager: PreferencesManager,
    private val scope: CoroutineScope = CoroutineScope(Dispatchers.IO)
) : SettingsRepository {

    private val _settings = MutableStateFlow(AppSettings())
    override val settings: StateFlow<AppSettings> = _settings.asStateFlow()

    init {
        scope.launch {
            preferencesManager.settingsFlow.collect {
                _settings.value = it
            }
        }
    }

    override suspend fun updateSettings(newSettings: AppSettings) {
        _settings.value = newSettings
        preferencesManager.updateSettings(newSettings)
    }
}
