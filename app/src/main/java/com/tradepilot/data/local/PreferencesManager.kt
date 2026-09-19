package com.tradepilot.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import com.tradepilot.data.model.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import java.io.IOException

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "tradepilot_prefs")

class PreferencesManager(private val context: Context) {

    private object PreferencesKeys {
        val IS_LOGGED_IN = booleanPreferencesKey("is_logged_in")
        val USER_NAME = stringPreferencesKey("user_name")
        val USER_EMAIL = stringPreferencesKey("user_email")
        val USER_PHONE = stringPreferencesKey("user_phone")
        val DEMO_BALANCE = doublePreferencesKey("demo_balance")

        val SETTINGS_NOTIFICATIONS = booleanPreferencesKey("settings_notifications")
        val SETTINGS_DARK_MODE = booleanPreferencesKey("settings_dark_mode")
        val SETTINGS_SOUND_ALERTS = booleanPreferencesKey("settings_sound_alerts")
        val DEFAULT_RISK = stringPreferencesKey("default_risk")
        val DEFAULT_STRATEGY = stringPreferencesKey("default_strategy")
        val DEFAULT_DURATION = stringPreferencesKey("default_duration")
    }

    val isLoggedInFlow: Flow<Boolean> = context.dataStore.data
        .catch { exception ->
            if (exception is IOException) emit(emptyPreferences()) else throw exception
        }
        .map { preferences ->
            preferences[PreferencesKeys.IS_LOGGED_IN] ?: false
        }

    val userFlow: Flow<User> = context.dataStore.data
        .catch { exception ->
            if (exception is IOException) emit(emptyPreferences()) else throw exception
        }
        .map { preferences ->
            User(
                fullName = preferences[PreferencesKeys.USER_NAME] ?: "Sathish",
                email = preferences[PreferencesKeys.USER_EMAIL] ?: "demo@tradepilot.app",
                mobileNumber = preferences[PreferencesKeys.USER_PHONE] ?: "+91 98765 43210",
                demoBalance = preferences[PreferencesKeys.DEMO_BALANCE] ?: RiskLimits.INITIAL_DEMO_BALANCE
            )
        }

    val settingsFlow: Flow<AppSettings> = context.dataStore.data
        .catch { exception ->
            if (exception is IOException) emit(emptyPreferences()) else throw exception
        }
        .map { preferences ->
            AppSettings(
                notificationsEnabled = preferences[PreferencesKeys.SETTINGS_NOTIFICATIONS] ?: true,
                darkModeEnabled = preferences[PreferencesKeys.SETTINGS_DARK_MODE] ?: true,
                soundAlertsEnabled = preferences[PreferencesKeys.SETTINGS_SOUND_ALERTS] ?: false,
                defaultRisk = preferences[PreferencesKeys.DEFAULT_RISK]?.let {
                    runCatching { RiskLevel.valueOf(it) }.getOrNull()
                } ?: RiskLevel.LOW,
                defaultStrategy = preferences[PreferencesKeys.DEFAULT_STRATEGY]?.let {
                    runCatching { TradingStrategy.valueOf(it) }.getOrNull()
                } ?: TradingStrategy.EMA_RSI,
                defaultDuration = preferences[PreferencesKeys.DEFAULT_DURATION]?.let {
                    runCatching { SessionDuration.valueOf(it) }.getOrNull()
                } ?: SessionDuration.MIN_15
            )
        }

    suspend fun setLoggedIn(isLoggedIn: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[PreferencesKeys.IS_LOGGED_IN] = isLoggedIn
        }
    }

    suspend fun saveUser(user: User) {
        context.dataStore.edit { preferences ->
            preferences[PreferencesKeys.USER_NAME] = user.fullName
            preferences[PreferencesKeys.USER_EMAIL] = user.email
            preferences[PreferencesKeys.USER_PHONE] = user.mobileNumber
            preferences[PreferencesKeys.DEMO_BALANCE] = user.demoBalance
        }
    }

    suspend fun updateBalance(newBalance: Double) {
        context.dataStore.edit { preferences ->
            preferences[PreferencesKeys.DEMO_BALANCE] = newBalance
        }
    }

    suspend fun updateSettings(settings: AppSettings) {
        context.dataStore.edit { preferences ->
            preferences[PreferencesKeys.SETTINGS_NOTIFICATIONS] = settings.notificationsEnabled
            preferences[PreferencesKeys.SETTINGS_DARK_MODE] = settings.darkModeEnabled
            preferences[PreferencesKeys.SETTINGS_SOUND_ALERTS] = settings.soundAlertsEnabled
            preferences[PreferencesKeys.DEFAULT_RISK] = settings.defaultRisk.name
            preferences[PreferencesKeys.DEFAULT_STRATEGY] = settings.defaultStrategy.name
            preferences[PreferencesKeys.DEFAULT_DURATION] = settings.defaultDuration.name
        }
    }
}
