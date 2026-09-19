package com.tradepilot.navigation

sealed class Screen(val route: String) {
    object Splash : Screen("splash")
    object Login : Screen("login")
    object Register : Screen("register")
    object Main : Screen("main")
    object TradingSetup : Screen("trading_setup")
    object BotRunning : Screen("bot_running")
    object Settings : Screen("settings")
    object Backtest : Screen("backtest")
    object Portfolio : Screen("portfolio")
    object Monitor : Screen("monitor")
}

sealed class BottomTab(val route: String, val title: String) {
    object Home : BottomTab("tab_home", "Home")
    object Market : BottomTab("tab_market", "Markets")
    object Monitor : BottomTab("tab_monitor", "Monitor")
    object Research : BottomTab("tab_research", "Research")
    object Portfolio : BottomTab("tab_portfolio", "Portfolio")
    object Performance : BottomTab("tab_performance", "Performance")
    object History : BottomTab("tab_history", "History")
    object Profile : BottomTab("tab_profile", "Profile")

    companion object {
        val items = listOf(Home, Market, Monitor, Research, Portfolio, Performance, History, Profile)
    }
}
