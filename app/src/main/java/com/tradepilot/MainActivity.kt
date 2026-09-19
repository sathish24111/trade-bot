package com.tradepilot

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.tradepilot.navigation.AppNavigation
import com.tradepilot.ui.theme.TradePilotTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            TradePilotTheme {
                AppNavigation()
            }
        }
    }
}
