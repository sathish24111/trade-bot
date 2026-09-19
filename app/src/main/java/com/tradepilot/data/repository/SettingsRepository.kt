package com.tradepilot.data.repository

import com.tradepilot.data.model.AppSettings
import kotlinx.coroutines.flow.StateFlow

interface SettingsRepository {
    val settings: StateFlow<AppSettings>
    suspend fun updateSettings(newSettings: AppSettings)
}
