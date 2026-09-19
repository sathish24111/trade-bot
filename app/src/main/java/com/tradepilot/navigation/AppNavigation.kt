package com.tradepilot.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.*
import com.tradepilot.TradePilotApp
import com.tradepilot.ui.screens.auth.LoginScreen
import com.tradepilot.ui.screens.auth.RegisterScreen
import com.tradepilot.ui.screens.backtest.BacktestScreen
import com.tradepilot.ui.screens.dashboard.DashboardScreen
import com.tradepilot.ui.screens.history.TradeHistoryScreen
import com.tradepilot.ui.screens.market.MarketScreen
import com.tradepilot.ui.screens.performance.PerformanceScreen
import com.tradepilot.ui.screens.profile.ProfileScreen
import com.tradepilot.ui.screens.research.ResearchScreen
import com.tradepilot.ui.screens.research.ResearchViewModel
import com.tradepilot.ui.screens.settings.SettingsScreen
import com.tradepilot.ui.screens.splash.SplashScreen
import com.tradepilot.ui.screens.trading.BotRunningScreen
import com.tradepilot.ui.screens.trading.TradingSetupScreen
import com.tradepilot.ui.theme.*
import com.tradepilot.viewmodel.*

@Composable
fun AppNavigation(
    rootNavController: NavHostController = rememberNavController(),
    app: TradePilotApp = TradePilotApp.instance
) {
    // ViewModel instances created from repository singletons
    val authViewModel = remember { AuthViewModel(app.authRepository) }
    val dashboardViewModel = remember { DashboardViewModel(app.authRepository, app.tradingRepository, app.performanceRepository) }
    val tradingSetupViewModel = remember { TradingSetupViewModel(app.tradingRepository) }
    val botRunningViewModel = remember { BotRunningViewModel(app.tradingRepository) }
    val marketViewModel = remember { MarketViewModel(app.marketRepository) }
    val performanceViewModel = remember { PerformanceViewModel(app.performanceRepository) }
    val historyViewModel = remember { TradeHistoryViewModel(app.performanceRepository) }
    val profileViewModel = remember { ProfileViewModel(app.authRepository, app.performanceRepository) }
    val settingsViewModel = remember { SettingsViewModel(app.settingsRepository) }
    val backtestViewModel = remember { BacktestViewModel(app.backtestRepository) }
    val researchViewModel = remember { ResearchViewModel(app.researchRepository) }

    val isLoggedIn by app.authRepository.isLoggedIn.collectAsState()

    NavHost(
        navController = rootNavController,
        startDestination = Screen.Splash.route
    ) {
        // Splash Screen
        composable(Screen.Splash.route) {
            SplashScreen(
                isLoggedIn = isLoggedIn,
                onNavigateNext = { loggedIn ->
                    val destination = if (loggedIn) Screen.Main.route else Screen.Login.route
                    rootNavController.navigate(destination) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                    }
                }
            )
        }

        // Login Screen
        composable(Screen.Login.route) {
            LoginScreen(
                viewModel = authViewModel,
                onNavigateToRegister = {
                    rootNavController.navigate(Screen.Register.route)
                },
                onLoginSuccess = {
                    rootNavController.navigate(Screen.Main.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }

        // Register Screen
        composable(Screen.Register.route) {
            RegisterScreen(
                viewModel = authViewModel,
                onNavigateToLogin = {
                    rootNavController.popBackStack()
                },
                onRegisterSuccess = {
                    rootNavController.navigate(Screen.Main.route) {
                        popUpTo(Screen.Register.route) { inclusive = true }
                    }
                }
            )
        }

        // Main Authenticated Screen with Bottom Bar
        composable(Screen.Main.route) {
            MainScaffoldScreen(
                rootNavController = rootNavController,
                dashboardViewModel = dashboardViewModel,
                marketViewModel = marketViewModel,
                researchViewModel = researchViewModel,
                performanceViewModel = performanceViewModel,
                historyViewModel = historyViewModel,
                profileViewModel = profileViewModel
            )
        }

        // Trading Setup Screen
        composable(Screen.TradingSetup.route) {
            TradingSetupScreen(
                viewModel = tradingSetupViewModel,
                onNavigateBack = { rootNavController.popBackStack() },
                onNavigateToBotRunning = {
                    rootNavController.navigate(Screen.BotRunning.route) {
                        popUpTo(Screen.TradingSetup.route) { inclusive = true }
                    }
                }
            )
        }

        // Bot Running Screen
        composable(Screen.BotRunning.route) {
            BotRunningScreen(
                viewModel = botRunningViewModel,
                onNavigateBack = { rootNavController.popBackStack() }
            )
        }

        // Settings Screen
        composable(Screen.Settings.route) {
            SettingsScreen(
                viewModel = settingsViewModel,
                onNavigateBack = { rootNavController.popBackStack() }
            )
        }

        // Backtest Screen (Phase 3)
        composable(Screen.Backtest.route) {
            BacktestScreen(
                viewModel = backtestViewModel,
                onNavigateBack = { rootNavController.popBackStack() }
            )
        }
    }
}

@Composable
fun MainScaffoldScreen(
    rootNavController: NavHostController,
    dashboardViewModel: DashboardViewModel,
    marketViewModel: MarketViewModel,
    researchViewModel: ResearchViewModel,
    performanceViewModel: PerformanceViewModel,
    historyViewModel: TradeHistoryViewModel,
    profileViewModel: ProfileViewModel
) {
    val bottomNavController = rememberNavController()
    val navBackStackEntry by bottomNavController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination

    Scaffold(
        bottomBar = {
            NavigationBar(
                containerColor = DarkSurfaceElevated,
                contentColor = TextPrimary,
                tonalElevation = 8.dp,
                modifier = Modifier.background(DarkSurfaceElevated)
            ) {
                val tabs = listOf(
                    Triple(BottomTab.Home, Icons.Default.Home, "Home"),
                    Triple(BottomTab.Market, Icons.Default.ShowChart, "Markets"),
                    Triple(BottomTab.Monitor, Icons.Default.Visibility, "Monitor"),
                    Triple(BottomTab.Research, Icons.Default.Science, "Research"),
                    Triple(BottomTab.Portfolio, Icons.Default.PieChart, "Portfolio"),
                    Triple(BottomTab.Performance, Icons.Default.Analytics, "Performance"),
                    Triple(BottomTab.History, Icons.Default.ReceiptLong, "History"),
                    Triple(BottomTab.Profile, Icons.Default.Person, "Profile")
                )

                tabs.forEach { (tab, icon, label) ->
                    val selected = currentDestination?.route == tab.route
                    NavigationBarItem(
                        selected = selected,
                        onClick = {
                            if (currentDestination?.route != tab.route) {
                                bottomNavController.navigate(tab.route) {
                                    popUpTo(bottomNavController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            }
                        },
                        icon = {
                            Icon(
                                imageVector = icon,
                                contentDescription = label,
                                tint = if (selected) TradePrimaryLight else TextMuted
                            )
                        },
                        label = {
                            Text(
                                text = label,
                                fontSize = 11.sp,
                                color = if (selected) TradePrimaryLight else TextMuted,
                                fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal
                            )
                        },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = TradePrimaryLight,
                            selectedTextColor = TradePrimaryLight,
                            indicatorColor = TradePrimary.copy(alpha = 0.15f),
                            unselectedIconColor = TextMuted,
                            unselectedTextColor = TextMuted
                        )
                    )
                }
            }
        },
        containerColor = DarkBg
    ) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding)) {
            NavHost(
                navController = bottomNavController,
                startDestination = BottomTab.Home.route
            ) {
                composable(BottomTab.Home.route) {
                    DashboardScreen(
                        viewModel = dashboardViewModel,
                        onNavigateToSetup = { rootNavController.navigate(Screen.TradingSetup.route) },
                        onNavigateToRunning = { rootNavController.navigate(Screen.BotRunning.route) },
                        onNavigateToHistory = {
                            bottomNavController.navigate(BottomTab.History.route) {
                                popUpTo(bottomNavController.graph.findStartDestination().id) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        onNavigateToBacktest = {
                            rootNavController.navigate(Screen.Backtest.route)
                        }
                    )
                }

                composable(BottomTab.Market.route) {
                    MarketScreen(viewModel = marketViewModel)
                }

                composable(BottomTab.Monitor.route) {
                    com.tradepilot.ui.screens.monitoring.MonitoringScreen()
                }

                composable(BottomTab.Research.route) {
                    ResearchScreen(viewModel = researchViewModel)
                }

                composable(BottomTab.Portfolio.route) {
                    com.tradepilot.ui.screens.portfolio.PortfolioScreen()
                }

                composable(BottomTab.Performance.route) {
                    PerformanceScreen(viewModel = performanceViewModel)
                }

                composable(BottomTab.History.route) {
                    TradeHistoryScreen(viewModel = historyViewModel)
                }

                composable(BottomTab.Profile.route) {
                    ProfileScreen(
                        viewModel = profileViewModel,
                        onNavigateToSettings = { rootNavController.navigate(Screen.Settings.route) },
                        onLogoutSuccess = {
                            rootNavController.navigate(Screen.Login.route) {
                                popUpTo(Screen.Main.route) { inclusive = true }
                            }
                        }
                    )
                }
            }
        }
    }
}
