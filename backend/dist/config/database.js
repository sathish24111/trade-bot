"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.initDatabase = initDatabase;
const promise_1 = __importDefault(require("mysql2/promise"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const env_1 = require("./env");
exports.pool = promise_1.default.createPool({
    host: env_1.env.DATABASE_HOST,
    port: env_1.env.DATABASE_PORT,
    user: env_1.env.DATABASE_USER,
    password: env_1.env.DATABASE_PASSWORD,
    database: env_1.env.DATABASE_NAME,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: env_1.env.DATABASE_POOL_SIZE,
    idleTimeout: env_1.env.DATABASE_IDLE_TIMEOUT_MS,
    connectTimeout: 10000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    queueLimit: 0
});
async function initDatabase() {
    const connection = await exports.pool.getConnection();
    try {
        // 1. Users table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(191) NOT NULL UNIQUE,
        mobile VARCHAR(30),
        password_hash VARCHAR(255) NOT NULL,
        demo_balance DECIMAL(12,2) DEFAULT 10000.00,
        account_type VARCHAR(50) DEFAULT 'Demo Account',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 2. Trading Sessions table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS trading_sessions (
        id VARCHAR(64) PRIMARY KEY,
        user_id INT NOT NULL,
        investment_amount DECIMAL(12,2) NOT NULL,
        strategy VARCHAR(50) NOT NULL,
        risk_level VARCHAR(20) NOT NULL,
        duration INT NOT NULL,
        starting_balance DECIMAL(12,2) NOT NULL,
        ending_balance DECIMAL(12,2),
        current_pnl DECIMAL(12,2) DEFAULT 0.00,
        status VARCHAR(30) NOT NULL DEFAULT 'IDLE',
        termination_reason VARCHAR(255),
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP NULL,
        INDEX idx_session_user (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 3. Trades table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS trades (
        id VARCHAR(64) PRIMARY KEY,
        session_id VARCHAR(64) NOT NULL,
        user_id INT NOT NULL,
        asset VARCHAR(20) NOT NULL,
        direction ENUM('BUY', 'SELL') NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        entry_price DECIMAL(16,6) NOT NULL,
        exit_price DECIMAL(16,6) NOT NULL,
        pnl DECIMAL(12,2) NOT NULL,
        result ENUM('WIN', 'LOSS') NOT NULL,
        strategy VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_trade_session (session_id),
        INDEX idx_trade_user (user_id),
        FOREIGN KEY (session_id) REFERENCES trading_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 4. Strategies table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS strategies (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 5. User Settings table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        default_strategy VARCHAR(50) DEFAULT 'EMA_RSI',
        default_risk VARCHAR(20) DEFAULT 'LOW',
        default_duration INT DEFAULT 15,
        notifications_enabled BOOLEAN DEFAULT TRUE,
        sound_enabled BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 6. Market Snapshots table (Phase 3: with source and is_live)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS market_snapshots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        asset VARCHAR(20) NOT NULL,
        price DECIMAL(16,6) NOT NULL,
        trend VARCHAR(20) NOT NULL,
        signal_type VARCHAR(20) NOT NULL,
        confidence INT NOT NULL,
        source VARCHAR(50) DEFAULT 'mock',
        is_live BOOLEAN DEFAULT FALSE,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_snapshot_asset (asset)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 7. Market Candles table (Phase 3: historical candle storage)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS market_candles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        asset VARCHAR(20) NOT NULL,
        timeframe VARCHAR(10) NOT NULL,
        open DECIMAL(16,6) NOT NULL,
        high DECIMAL(16,6) NOT NULL,
        low DECIMAL(16,6) NOT NULL,
        close DECIMAL(16,6) NOT NULL,
        volume DECIMAL(20,4) DEFAULT 0,
        timestamp BIGINT NOT NULL,
        source VARCHAR(50) NOT NULL,
        UNIQUE KEY uq_candle (asset, timeframe, timestamp),
        INDEX idx_candle_lookup (asset, timeframe, timestamp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 8. Backtest Runs table (Phase 3: historical backtest runs)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS backtest_runs (
        id VARCHAR(64) PRIMARY KEY,
        user_id INT NOT NULL,
        asset VARCHAR(20) NOT NULL,
        timeframe VARCHAR(10) NOT NULL,
        strategy VARCHAR(50) NOT NULL,
        start_date VARCHAR(30) NOT NULL,
        end_date VARCHAR(30) NOT NULL,
        initial_balance DECIMAL(12,2) NOT NULL,
        final_balance DECIMAL(12,2) NOT NULL,
        total_pnl DECIMAL(12,2) NOT NULL,
        win_rate DECIMAL(5,2) NOT NULL,
        max_drawdown DECIMAL(5,2) NOT NULL,
        profit_factor DECIMAL(8,2) NOT NULL,
        total_trades INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_backtest_user (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 9. Backtest Trades table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS backtest_trades (
        id VARCHAR(64) PRIMARY KEY,
        backtest_id VARCHAR(64) NOT NULL,
        asset VARCHAR(20) NOT NULL,
        direction ENUM('BUY', 'SELL') NOT NULL,
        entry_price DECIMAL(16,6) NOT NULL,
        exit_price DECIMAL(16,6) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        pnl DECIMAL(12,2) NOT NULL,
        result ENUM('WIN', 'LOSS') NOT NULL,
        timestamp VARCHAR(30) NOT NULL,
        reason VARCHAR(255),
        INDEX idx_btrade_run (backtest_id),
        FOREIGN KEY (backtest_id) REFERENCES backtest_runs(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 10. Backtest Equity Curve table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS backtest_equity (
        id INT AUTO_INCREMENT PRIMARY KEY,
        backtest_id VARCHAR(64) NOT NULL,
        timestamp VARCHAR(30) NOT NULL,
        balance DECIMAL(12,2) NOT NULL,
        equity DECIMAL(12,2) NOT NULL,
        INDEX idx_bequity_run (backtest_id),
        FOREIGN KEY (backtest_id) REFERENCES backtest_runs(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 11. Audit Logs table (Phase 3: compliance audit logging)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        user_id INT NULL,
        details JSON,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_audit_event (event_type),
        INDEX idx_audit_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 12. Strategy Parameters table (Phase 4)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS strategy_parameters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        strategy_id VARCHAR(50) NOT NULL,
        param_key VARCHAR(50) NOT NULL,
        default_val VARCHAR(50) NOT NULL,
        min_val VARCHAR(50),
        max_val VARCHAR(50),
        step_val VARCHAR(50),
        param_type VARCHAR(20) DEFAULT 'number',
        description VARCHAR(255),
        UNIQUE KEY uq_strategy_param (strategy_id, param_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 13. Optimization Runs table (Phase 4)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS optimization_runs (
        id VARCHAR(64) PRIMARY KEY,
        user_id INT NOT NULL,
        asset VARCHAR(20) NOT NULL,
        timeframe VARCHAR(10) NOT NULL,
        strategy VARCHAR(50) NOT NULL,
        train_split DECIMAL(5,2) NOT NULL,
        val_split DECIMAL(5,2) NOT NULL,
        test_split DECIMAL(5,2) NOT NULL,
        total_combinations INT NOT NULL,
        overfitting_risk ENUM('LOW', 'MODERATE', 'HIGH') DEFAULT 'LOW',
        overfitting_score DECIMAL(8,4) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_opt_user (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 14. Optimization Results table (Phase 4)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS optimization_results (
        id VARCHAR(64) PRIMARY KEY,
        optimization_id VARCHAR(64) NOT NULL,
        parameters JSON NOT NULL,
        train_pnl DECIMAL(12,2) NOT NULL,
        train_win_rate DECIMAL(5,2) NOT NULL,
        train_sharpe DECIMAL(8,4),
        train_trades INT NOT NULL,
        val_pnl DECIMAL(12,2),
        val_win_rate DECIMAL(5,2),
        val_sharpe DECIMAL(8,4),
        test_pnl DECIMAL(12,2),
        test_win_rate DECIMAL(5,2),
        test_sharpe DECIMAL(8,4),
        max_drawdown DECIMAL(5,2) NOT NULL,
        profit_factor DECIMAL(8,2) NOT NULL,
        INDEX idx_opt_res (optimization_id),
        FOREIGN KEY (optimization_id) REFERENCES optimization_runs(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 15. Walk-Forward Runs table (Phase 4)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS walk_forward_runs (
        id VARCHAR(64) PRIMARY KEY,
        user_id INT NOT NULL,
        asset VARCHAR(20) NOT NULL,
        timeframe VARCHAR(10) NOT NULL,
        strategy VARCHAR(50) NOT NULL,
        train_candles INT NOT NULL,
        test_candles INT NOT NULL,
        step_candles INT NOT NULL,
        total_windows INT NOT NULL,
        wfe_score DECIMAL(8,2),
        cumulative_oos_pnl DECIMAL(12,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_wf_user (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 16. Walk-Forward Results table (Phase 4)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS walk_forward_results (
        id VARCHAR(64) PRIMARY KEY,
        walk_forward_id VARCHAR(64) NOT NULL,
        window_index INT NOT NULL,
        train_start VARCHAR(30) NOT NULL,
        train_end VARCHAR(30) NOT NULL,
        test_start VARCHAR(30) NOT NULL,
        test_end VARCHAR(30) NOT NULL,
        selected_parameters JSON NOT NULL,
        is_pnl DECIMAL(12,2) NOT NULL,
        is_win_rate DECIMAL(5,2) NOT NULL,
        oos_pnl DECIMAL(12,2) NOT NULL,
        oos_win_rate DECIMAL(5,2) NOT NULL,
        oos_trades INT NOT NULL,
        INDEX idx_wf_res (walk_forward_id),
        FOREIGN KEY (walk_forward_id) REFERENCES walk_forward_runs(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 17. Regime Analysis table (Phase 4)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS regime_analysis (
        id INT AUTO_INCREMENT PRIMARY KEY,
        asset VARCHAR(20) NOT NULL,
        timeframe VARCHAR(10) NOT NULL,
        regime ENUM('TRENDING', 'RANGING', 'HIGH_VOLATILITY', 'LOW_VOLATILITY') NOT NULL,
        timestamp BIGINT NOT NULL,
        atr DECIMAL(16,6) NOT NULL,
        bb_width DECIMAL(16,6) NOT NULL,
        INDEX idx_regime_lookup (asset, timeframe, timestamp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 18. Monte Carlo Runs table (Phase 4)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS monte_carlo_runs (
        id VARCHAR(64) PRIMARY KEY,
        user_id INT NOT NULL,
        source_id VARCHAR(64) NOT NULL,
        source_type ENUM('BACKTEST', 'OPTIMIZATION', 'SESSION') NOT NULL,
        iterations INT NOT NULL,
        initial_balance DECIMAL(12,2) NOT NULL,
        median_balance DECIMAL(12,2) NOT NULL,
        p5_balance DECIMAL(12,2) NOT NULL,
        p25_balance DECIMAL(12,2) NOT NULL,
        p75_balance DECIMAL(12,2) NOT NULL,
        p95_balance DECIMAL(12,2) NOT NULL,
        worst_drawdown DECIMAL(5,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_mc_user (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 19. Risk Profiles table (Phase 4)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS risk_profiles (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        risk_per_trade DECIMAL(4,2) NOT NULL,
        max_daily_loss DECIMAL(4,2) NOT NULL,
        max_concurrent_trades INT NOT NULL,
        description VARCHAR(255)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 20. Historical Datasets table (Phase 5)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS historical_datasets (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        asset VARCHAR(20) NOT NULL,
        timeframe VARCHAR(10) NOT NULL,
        candle_count INT NOT NULL,
        start_time VARCHAR(30) NOT NULL,
        end_time VARCHAR(30) NOT NULL,
        sha256_checksum VARCHAR(64) NOT NULL,
        is_validated BOOLEAN DEFAULT FALSE,
        storage_path VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_dataset_lookup (asset, timeframe)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 21. Dataset Validation Results table (Phase 5)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS dataset_validation_results (
        id VARCHAR(64) PRIMARY KEY,
        dataset_id VARCHAR(64) NOT NULL,
        passed BOOLEAN NOT NULL,
        total_candles INT NOT NULL,
        missing_candles INT NOT NULL,
        duplicate_timestamps INT NOT NULL,
        out_of_order_candles INT NOT NULL,
        gap_count INT NOT NULL,
        max_gap_duration_sec INT NOT NULL,
        report_json JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_val_dataset (dataset_id),
        FOREIGN KEY (dataset_id) REFERENCES historical_datasets(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 22. Robustness Runs table (Phase 5)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS robustness_runs (
        id VARCHAR(64) PRIMARY KEY,
        user_id INT NOT NULL,
        strategy VARCHAR(50) NOT NULL,
        run_type ENUM('CROSS_ASSET', 'CROSS_TIMEFRAME', 'SENSITIVITY_HEATMAP', 'STRESS_TEST') NOT NULL,
        summary_json JSON NOT NULL,
        details_json JSON NOT NULL,
        passed BOOLEAN NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_robustness_user (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 23. Portfolios table (Phase 5)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS portfolios (
        id VARCHAR(64) PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        initial_capital DECIMAL(12,2) NOT NULL,
        current_equity DECIMAL(12,2) NOT NULL,
        max_portfolio_drawdown DECIMAL(5,2) NOT NULL,
        status ENUM('ACTIVE', 'PAUSED', 'STOPPED') DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_portfolio_user (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 24. Portfolio Positions table (Phase 5)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS portfolio_positions (
        id VARCHAR(64) PRIMARY KEY,
        portfolio_id VARCHAR(64) NOT NULL,
        asset VARCHAR(20) NOT NULL,
        strategy VARCHAR(50) NOT NULL,
        weight_pct DECIMAL(5,2) NOT NULL,
        allocated_capital DECIMAL(12,2) NOT NULL,
        current_pnl DECIMAL(12,2) DEFAULT 0.00,
        INDEX idx_ppos_portfolio (portfolio_id),
        FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 25. Portfolio Equity Curve table (Phase 5)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS portfolio_equity (
        id INT AUTO_INCREMENT PRIMARY KEY,
        portfolio_id VARCHAR(64) NOT NULL,
        timestamp VARCHAR(30) NOT NULL,
        equity DECIMAL(12,2) NOT NULL,
        drawdown_pct DECIMAL(5,2) NOT NULL,
        INDEX idx_pequity_portfolio (portfolio_id),
        FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 26. Paper Experiments table (Phase 5)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS paper_experiments (
        id VARCHAR(64) PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        strategy VARCHAR(50) NOT NULL,
        asset VARCHAR(20) NOT NULL,
        timeframe VARCHAR(10) NOT NULL,
        config_hash VARCHAR(64) NOT NULL,
        parameters JSON NOT NULL,
        status ENUM('CREATED', 'RUNNING', 'PAUSED', 'COMPLETED') DEFAULT 'CREATED',
        start_balance DECIMAL(12,2) NOT NULL,
        current_balance DECIMAL(12,2) NOT NULL,
        total_trades INT DEFAULT 0,
        win_rate DECIMAL(5,2) DEFAULT 0.00,
        pnl DECIMAL(12,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        INDEX idx_exp_user (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 27. Paper Experiment Trades table (Phase 5)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS paper_experiment_trades (
        id VARCHAR(64) PRIMARY KEY,
        experiment_id VARCHAR(64) NOT NULL,
        direction ENUM('BUY', 'SELL') NOT NULL,
        entry_price DECIMAL(16,6) NOT NULL,
        exit_price DECIMAL(16,6) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        pnl DECIMAL(12,2) NOT NULL,
        slippage DECIMAL(8,4) DEFAULT 0.0000,
        fees DECIMAL(8,2) DEFAULT 0.00,
        result ENUM('WIN', 'LOSS') NOT NULL,
        journal_notes TEXT,
        entry_time VARCHAR(30) NOT NULL,
        exit_time VARCHAR(30) NOT NULL,
        INDEX idx_etrade_exp (experiment_id),
        FOREIGN KEY (experiment_id) REFERENCES paper_experiments(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 28. Market Health Events table (Phase 6)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS market_health_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        provider VARCHAR(50) NOT NULL,
        asset VARCHAR(20) NOT NULL,
        timeframe VARCHAR(10) NOT NULL,
        status VARCHAR(30) NOT NULL,
        latency_ms INT DEFAULT 0,
        data_age_ms INT DEFAULT 0,
        missing_candles INT DEFAULT 0,
        duplicate_candles INT DEFAULT 0,
        invalid_candles INT DEFAULT 0,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_mhe_asset (asset),
        INDEX idx_mhe_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 29. Signals table (Phase 6)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS signals (
        id VARCHAR(64) PRIMARY KEY,
        asset VARCHAR(20) NOT NULL,
        timeframe VARCHAR(10) NOT NULL,
        strategy VARCHAR(50) NOT NULL,
        direction ENUM('BUY', 'SELL', 'WAIT') NOT NULL,
        entry_price DECIMAL(16,6) NOT NULL,
        stop_loss DECIMAL(16,6),
        take_profit DECIMAL(16,6),
        risk_amount DECIMAL(12,2) DEFAULT 0.00,
        confidence DECIMAL(5,2) NOT NULL,
        market_regime VARCHAR(30) DEFAULT 'RANGING',
        indicator_snapshot JSON,
        status ENUM('GENERATED', 'EXECUTED', 'EXPIRED', 'CANCELLED', 'REJECTED_BY_RISK') DEFAULT 'GENERATED',
        rejection_reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_sig_asset (asset),
        INDEX idx_sig_strategy (strategy),
        INDEX idx_sig_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 30. Signal Outcomes table (Phase 6)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS signal_outcomes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        signal_id VARCHAR(64) NOT NULL UNIQUE,
        actual_entry_price DECIMAL(16,6) NOT NULL,
        actual_exit_price DECIMAL(16,6) NOT NULL,
        return_pct DECIMAL(8,4) NOT NULL,
        max_favorable_excursion DECIMAL(8,4) DEFAULT 0.0000,
        max_adverse_excursion DECIMAL(8,4) DEFAULT 0.0000,
        holding_time_seconds INT DEFAULT 0,
        result ENUM('WIN', 'LOSS') NOT NULL,
        pnl DECIMAL(12,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_so_signal (signal_id),
        FOREIGN KEY (signal_id) REFERENCES signals(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 31. Strategy Drift Metrics table (Phase 6)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS strategy_drift_metrics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        strategy VARCHAR(50) NOT NULL,
        asset VARCHAR(20) NOT NULL,
        timeframe VARCHAR(10) NOT NULL,
        backtest_win_rate DECIMAL(5,2) NOT NULL,
        paper_win_rate DECIMAL(5,2) NOT NULL,
        win_rate_drift DECIMAL(5,2) NOT NULL,
        expectancy_drift DECIMAL(8,4) DEFAULT 0.0000,
        profit_factor_drift DECIMAL(8,4) DEFAULT 0.0000,
        drawdown_drift DECIMAL(5,2) DEFAULT 0.00,
        sample_size INT DEFAULT 0,
        classification ENUM('STABLE', 'WATCH', 'SIGNIFICANT', 'CRITICAL') DEFAULT 'STABLE',
        status VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_sdm_strategy (strategy)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 32. Risk Events table (Phase 6)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS risk_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        severity ENUM('INFO', 'WARNING', 'HIGH', 'CRITICAL') DEFAULT 'INFO',
        details TEXT,
        current_drawdown DECIMAL(5,2) DEFAULT 0.00,
        current_daily_loss DECIMAL(12,2) DEFAULT 0.00,
        exposure DECIMAL(5,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_re_severity (severity)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 33. Risk Snapshots table (Phase 6)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS risk_snapshots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        daily_pnl DECIMAL(12,2) NOT NULL,
        daily_loss_pct DECIMAL(5,2) NOT NULL,
        current_drawdown DECIMAL(5,2) NOT NULL,
        max_drawdown DECIMAL(5,2) NOT NULL,
        risk_utilization DECIMAL(5,2) NOT NULL,
        open_risk DECIMAL(12,2) NOT NULL,
        portfolio_exposure DECIMAL(5,2) NOT NULL,
        position_count INT NOT NULL,
        consecutive_losses INT NOT NULL,
        risk_state ENUM('NORMAL', 'ELEVATED', 'HIGH', 'LIMIT_REACHED') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 34. Portfolio Exposure Snapshots table (Phase 6)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS portfolio_exposure_snapshots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        portfolio_id VARCHAR(64),
        total_equity DECIMAL(12,2) NOT NULL,
        cash_balance DECIMAL(12,2) NOT NULL,
        used_capital DECIMAL(12,2) NOT NULL,
        gross_exposure DECIMAL(5,2) NOT NULL,
        net_exposure DECIMAL(5,2) NOT NULL,
        asset_exposure JSON,
        strategy_exposure JSON,
        risk_exposure DECIMAL(5,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_pes_port (portfolio_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 35. Alerts table (Phase 6)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id VARCHAR(64) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        severity ENUM('INFO', 'WARNING', 'HIGH', 'CRITICAL') NOT NULL,
        asset VARCHAR(20),
        strategy VARCHAR(50),
        message TEXT NOT NULL,
        metadata JSON,
        acknowledged BOOLEAN DEFAULT FALSE,
        resolved BOOLEAN DEFAULT FALSE,
        acknowledged_at TIMESTAMP NULL,
        resolved_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_alert_severity (severity),
        INDEX idx_alert_type (type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 36. Strategy State Changes table (Phase 6)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS strategy_state_changes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        strategy VARCHAR(50) NOT NULL,
        old_state VARCHAR(20) NOT NULL,
        new_state VARCHAR(20) NOT NULL,
        reason VARCHAR(255),
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ssc_strat (strategy)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 37. Experiment Snapshots table (Phase 6)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS experiment_snapshots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        experiment_id VARCHAR(64) NOT NULL,
        equity DECIMAL(12,2) NOT NULL,
        pnl DECIMAL(12,2) NOT NULL,
        drawdown DECIMAL(5,2) NOT NULL,
        exposure DECIMAL(5,2) NOT NULL,
        trades_count INT NOT NULL,
        signals_count INT NOT NULL,
        risk_state VARCHAR(30) NOT NULL,
        market_state VARCHAR(30) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_es_exp (experiment_id),
        FOREIGN KEY (experiment_id) REFERENCES paper_experiments(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 38. Anomalies table (Phase 6)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS anomalies (
        id VARCHAR(64) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        asset VARCHAR(20) NOT NULL,
        severity ENUM('INFO', 'WARNING', 'HIGH', 'CRITICAL') NOT NULL,
        observed_value VARCHAR(100) NOT NULL,
        expected_range VARCHAR(100) NOT NULL,
        explanation TEXT NOT NULL,
        resolved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_anom_type (type),
        INDEX idx_anom_asset (asset)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 39. System Health Events table (Phase 6)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS system_health_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        component VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL,
        latency_ms INT DEFAULT 0,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_she_comp (component)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 40. WebSocket Event Log table (Phase 6)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS websocket_event_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        sequence INT NOT NULL,
        payload JSON NOT NULL,
        recipient_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_wel_seq (sequence),
        INDEX idx_wel_type (event_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 41. Notification Devices table (Phase 7)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS notification_devices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        device_token VARCHAR(255) NOT NULL UNIQUE,
        platform VARCHAR(20) DEFAULT 'ANDROID',
        enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_nd_user (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 42. Notification Preferences table (Phase 7)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS notification_preferences (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        notifications_enabled BOOLEAN DEFAULT TRUE,
        critical_risk BOOLEAN DEFAULT TRUE,
        strategy_drift BOOLEAN DEFAULT TRUE,
        market_data BOOLEAN DEFAULT TRUE,
        system_health BOOLEAN DEFAULT TRUE,
        paper_trade BOOLEAN DEFAULT TRUE,
        experiment BOOLEAN DEFAULT TRUE,
        anomaly BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 43. Notification Delivery Log table (Phase 7)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS notification_delivery_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        device_token VARCHAR(255),
        category VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        status ENUM('PENDING', 'SENT', 'FAILED', 'INVALID_TOKEN') NOT NULL DEFAULT 'SENT',
        error_details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ndl_user (user_id),
        INDEX idx_ndl_category (category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 44. Market Provider Events table (Phase 7)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS market_provider_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        provider VARCHAR(50) NOT NULL,
        previous_state VARCHAR(30) NOT NULL,
        new_state VARCHAR(30) NOT NULL,
        reason VARCHAR(255),
        latency_ms INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_mpe_prov (provider)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 45. Market Provider Metrics table (Phase 7)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS market_provider_metrics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        provider VARCHAR(50) NOT NULL,
        uptime_percent DECIMAL(5,2) NOT NULL,
        availability_percent DECIMAL(5,2) NOT NULL,
        avg_latency_ms DECIMAL(8,2) NOT NULL,
        max_latency_ms INT NOT NULL,
        reconnect_count INT DEFAULT 0,
        failover_count INT DEFAULT 0,
        error_count INT DEFAULT 0,
        data_age_ms INT DEFAULT 0,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_mpm_prov (provider)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 46. Strategy Policy Versions table (Phase 7)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS strategy_policy_versions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        strategy_id VARCHAR(50) NOT NULL,
        version INT NOT NULL,
        config JSON NOT NULL,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_spv_strat (strategy_id),
        FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 47. Strategy Adaptation Events table (Phase 7)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS strategy_adaptation_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        strategy_id VARCHAR(50) NOT NULL,
        previous_state VARCHAR(30) NOT NULL,
        new_state VARCHAR(30) NOT NULL,
        trigger_event VARCHAR(50) NOT NULL,
        reason VARCHAR(255) NOT NULL,
        automatic BOOLEAN DEFAULT TRUE,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_sae_strat (strategy_id),
        FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 48. Experiment Timeline Events table (Phase 7)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS experiment_timeline_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        experiment_id VARCHAR(64) NOT NULL,
        sequence INT NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        details JSON,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ete_exp_seq (experiment_id, sequence),
        FOREIGN KEY (experiment_id) REFERENCES paper_experiments(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 49. Research Strategy Versions table (Phase 8)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS research_strategy_versions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        strategy_id VARCHAR(50) NOT NULL,
        version VARCHAR(20) NOT NULL,
        config_hash VARCHAR(64) NOT NULL,
        parameters JSON NOT NULL,
        risk_config JSON NOT NULL,
        indicator_dependencies JSON,
        enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_rsv_strat (strategy_id),
        UNIQUE KEY uq_rsv_hash (strategy_id, config_hash)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 50. Research Ensemble Configurations table (Phase 8)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS research_ensemble_configs (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        aggregation_mode ENUM('MAJORITY', 'WEIGHTED', 'CONSENSUS', 'INDEPENDENT') NOT NULL,
        strategies JSON NOT NULL,
        min_confirmations INT DEFAULT 2,
        enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 51. Research Signal Conflicts table (Phase 8)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS research_signal_conflicts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ensemble_id VARCHAR(64),
        asset VARCHAR(20) NOT NULL,
        regime VARCHAR(30) DEFAULT 'UNKNOWN',
        signals JSON NOT NULL,
        resolved_signal VARCHAR(20) NOT NULL,
        resolution_method VARCHAR(30) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_rsc_asset (asset)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 52. Strategy Correlations table (Phase 8)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS strategy_correlations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        strategy_a VARCHAR(50) NOT NULL,
        strategy_b VARCHAR(50) NOT NULL,
        asset VARCHAR(20) NOT NULL,
        timeframe VARCHAR(10) NOT NULL,
        correlation DECIMAL(5,4) NOT NULL,
        sample_trades INT NOT NULL,
        regime VARCHAR(30) DEFAULT 'ALL',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_sc_strats (strategy_a, strategy_b)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 53. Strategy Regime Metrics table (Phase 8)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS strategy_regime_metrics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        strategy_id VARCHAR(50) NOT NULL,
        asset VARCHAR(20) NOT NULL,
        timeframe VARCHAR(10) NOT NULL,
        regime VARCHAR(30) NOT NULL,
        trade_count INT NOT NULL,
        win_rate DECIMAL(5,2) NOT NULL,
        expectancy DECIMAL(8,4) NOT NULL,
        average_return DECIMAL(8,4) NOT NULL,
        max_drawdown DECIMAL(5,2) NOT NULL,
        signal_frequency DECIMAL(8,4) DEFAULT 0.0,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_srm_strat_regime (strategy_id, regime)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 54. Parameter Stability Runs table (Phase 8)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS parameter_stability_runs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        strategy_id VARCHAR(50) NOT NULL,
        parameter_key VARCHAR(50) NOT NULL,
        baseline_value VARCHAR(50) NOT NULL,
        stability_score DECIMAL(5,4) NOT NULL,
        region ENUM('STABLE_REGION', 'SENSITIVE_REGION', 'CLIFF_REGION', 'INSUFFICIENT_DATA') NOT NULL,
        cliff_count INT DEFAULT 0,
        tested_variations JSON NOT NULL,
        sample_quality ENUM('LIMITED', 'MODERATE', 'LARGER_SAMPLE') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_psr_strat (strategy_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 55. Research Comparisons table (Phase 8)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS research_comparisons (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        run_ids JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 56. Trade Diagnostics table (Phase 8)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS trade_diagnostics (
        trade_id VARCHAR(64) PRIMARY KEY,
        asset VARCHAR(20) NOT NULL,
        strategy_id VARCHAR(50) NOT NULL,
        trade_signal VARCHAR(20) NOT NULL,
        entry_price DECIMAL(12,4) NOT NULL,
        exit_price DECIMAL(12,4) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        pnl DECIMAL(12,2) NOT NULL,
        result ENUM('WIN', 'LOSS') NOT NULL,
        market_regime VARCHAR(30) NOT NULL,
        indicators JSON NOT NULL,
        decision_path JSON NOT NULL,
        mae DECIMAL(8,4) DEFAULT 0.0,
        mfe DECIMAL(8,4) DEFAULT 0.0,
        slippage DECIMAL(8,4) DEFAULT 0.0,
        fees DECIMAL(8,4) DEFAULT 0.0,
        holding_time_seconds INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_td_strat (strategy_id),
        INDEX idx_td_asset (asset)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 57. Experiment Clones table (Phase 8)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS experiment_clones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        original_experiment_id VARCHAR(64) NOT NULL,
        cloned_experiment_id VARCHAR(64) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ec_orig (original_experiment_id),
        INDEX idx_ec_clone (cloned_experiment_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 58. Experiment Tags table (Phase 8)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS experiment_tags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        experiment_id VARCHAR(64) NOT NULL,
        tag VARCHAR(50) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_et_exp (experiment_id),
        INDEX idx_et_tag (tag)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 59. Performance Stage Metrics table (Phase 8)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS performance_stage_metrics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        experiment_id VARCHAR(64) NOT NULL,
        strategy_id VARCHAR(50) NOT NULL,
        stage ENUM('BACKTEST', 'VALIDATION', 'OOS', 'WALK_FORWARD', 'PAPER') NOT NULL,
        win_rate DECIMAL(5,2) NOT NULL,
        return_pct DECIMAL(8,4) NOT NULL,
        max_drawdown DECIMAL(5,2) NOT NULL,
        expectancy DECIMAL(8,4) NOT NULL,
        profit_factor DECIMAL(8,4) NOT NULL,
        trade_count INT NOT NULL,
        sample_quality ENUM('LIMITED', 'MODERATE', 'LARGER_SAMPLE') NOT NULL,
        slippage DECIMAL(8,4) DEFAULT 0.0,
        fees DECIMAL(8,4) DEFAULT 0.0,
        risk_utilization DECIMAL(5,2) DEFAULT 0.0,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_psm_exp (experiment_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 60. Confidence Interval Metrics table (Phase 8)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS confidence_interval_metrics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        experiment_id VARCHAR(64) NOT NULL,
        metric_name VARCHAR(50) NOT NULL,
        point_estimate DECIMAL(8,4) NOT NULL,
        confidence_level DECIMAL(4,2) DEFAULT 0.95,
        lower_bound DECIMAL(8,4) NOT NULL,
        upper_bound DECIMAL(8,4) NOT NULL,
        sample_size INT NOT NULL,
        is_sufficient BOOLEAN DEFAULT TRUE,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_cim_exp (experiment_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 61. Monte Carlo Distributions table (Phase 8)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS monte_carlo_distributions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        experiment_id VARCHAR(64) NOT NULL,
        iterations INT NOT NULL,
        p5 DECIMAL(12,2) NOT NULL,
        p25 DECIMAL(12,2) NOT NULL,
        p50 DECIMAL(12,2) NOT NULL,
        p75 DECIMAL(12,2) NOT NULL,
        p95 DECIMAL(12,2) NOT NULL,
        worst_observed DECIMAL(12,2) NOT NULL,
        ruin_probability_pct DECIMAL(5,2) NOT NULL,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_mcd_exp (experiment_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 62. Research Jobs table (Phase 9)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS research_jobs (
        job_id VARCHAR(64) PRIMARY KEY,
        experiment_id VARCHAR(64) NOT NULL,
        type VARCHAR(50) NOT NULL,
        priority ENUM('LOW', 'NORMAL', 'HIGH') DEFAULT 'NORMAL',
        status ENUM('CREATED', 'QUEUED', 'RUNNING', 'PAUSED', 'RETRYING', 'COMPLETED', 'FAILED', 'CANCELLED') DEFAULT 'CREATED',
        progress INT DEFAULT 0,
        config_hash VARCHAR(64) NOT NULL,
        parameters JSON NOT NULL,
        parent_job_id VARCHAR(64),
        dependency_job_id VARCHAR(64),
        last_completed_stage VARCHAR(50),
        checkpoint JSON,
        result JSON,
        error TEXT,
        retry_count INT DEFAULT 0,
        cancellation_reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        INDEX idx_rj_status (status),
        INDEX idx_rj_priority (priority),
        INDEX idx_rj_exp (experiment_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 63. Research Job Dependencies table (Phase 9)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS research_job_dependencies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        job_id VARCHAR(64) NOT NULL,
        depends_on_job_id VARCHAR(64) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_rjd_job (job_id),
        INDEX idx_rjd_dep (depends_on_job_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 64. Research Job Checkpoints table (Phase 9)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS research_job_checkpoints (
        id INT AUTO_INCREMENT PRIMARY KEY,
        job_id VARCHAR(64) NOT NULL,
        stage VARCHAR(50) NOT NULL,
        progress INT NOT NULL,
        checkpoint_data JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_rjc_job (job_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 65. Research Schedules table (Phase 9)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS research_schedules (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        job_type VARCHAR(50) NOT NULL,
        strategy_id VARCHAR(50) NOT NULL,
        dataset_id VARCHAR(64),
        schedule ENUM('HOURLY', 'DAILY', 'WEEKLY', 'CUSTOM') NOT NULL,
        custom_cron VARCHAR(50),
        enabled BOOLEAN DEFAULT TRUE,
        last_run TIMESTAMP NULL,
        next_run TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_rs_enabled (enabled)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 66. Research Recommendations table (Phase 9)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS research_recommendations (
        id VARCHAR(64) PRIMARY KEY,
        trigger_type VARCHAR(50) NOT NULL,
        reason TEXT NOT NULL,
        evidence TEXT NOT NULL,
        suggested_job_type VARCHAR(50) NOT NULL,
        suggested_parameters JSON,
        priority ENUM('LOW', 'NORMAL', 'HIGH') DEFAULT 'NORMAL',
        status ENUM('PENDING', 'SCHEDULED', 'EXECUTED', 'DISMISSED') DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_rr_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 67. Research Evidence Metrics table (Phase 9)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS research_evidence_metrics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        strategy_id VARCHAR(50) NOT NULL,
        dataset_quality VARCHAR(30) NOT NULL,
        sample_size_rating VARCHAR(30) NOT NULL,
        sample_trades_count INT NOT NULL,
        oos_tested BOOLEAN DEFAULT FALSE,
        walk_forward_tested BOOLEAN DEFAULT FALSE,
        stress_tested BOOLEAN DEFAULT FALSE,
        monte_carlo_simulated BOOLEAN DEFAULT FALSE,
        parameter_stability_tested BOOLEAN DEFAULT FALSE,
        paper_data_quality VARCHAR(30) NOT NULL,
        drift_status VARCHAR(30) NOT NULL,
        overall_evidence_level ENUM('VERY_LIMITED', 'LIMITED', 'MODERATE', 'SUBSTANTIAL') NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_rem_strat (strategy_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 68. Experiment Lineage table (Phase 9)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS experiment_lineage (
        id INT AUTO_INCREMENT PRIMARY KEY,
        experiment_id VARCHAR(64) NOT NULL UNIQUE,
        parent_experiment_id VARCHAR(64),
        root_experiment_id VARCHAR(64) NOT NULL,
        lineage_depth INT DEFAULT 0,
        change_description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_el_parent (parent_experiment_id),
        INDEX idx_el_root (root_experiment_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 69. Experiment Diffs table (Phase 9)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS experiment_diffs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        experiment_a_id VARCHAR(64) NOT NULL,
        experiment_b_id VARCHAR(64) NOT NULL,
        diff_payload JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ed_ab (experiment_a_id, experiment_b_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 70. Paper Watchdog Events table (Phase 9)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS paper_watchdog_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        experiment_id VARCHAR(64) NOT NULL,
        check_type VARCHAR(50) NOT NULL,
        severity ENUM('INFO', 'WARNING', 'CRITICAL') NOT NULL,
        message TEXT NOT NULL,
        details JSON,
        action_taken ENUM('NONE', 'THROTTLED', 'PAUSED', 'AUTO_RECOVERED') DEFAULT 'NONE',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_pwe_exp (experiment_id),
        INDEX idx_pwe_sev (severity)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 71. Anomaly Investigations table (Phase 9)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS anomaly_investigations (
        investigation_id VARCHAR(64) PRIMARY KEY,
        anomaly_id VARCHAR(64) NOT NULL,
        asset VARCHAR(20) NOT NULL,
        strategy_id VARCHAR(50),
        evidence_status ENUM('CONFIRMED', 'LIKELY', 'POSSIBLE', 'UNKNOWN') NOT NULL,
        classified_root_cause ENUM('MARKET_DATA', 'STRATEGY', 'EXECUTION_SIMULATION', 'RISK', 'PROVIDER', 'SYSTEM', 'UNKNOWN') NOT NULL,
        collected_evidence JSON NOT NULL,
        diagnostic_summary TEXT,
        suggested_action TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ai_anomaly (anomaly_id),
        INDEX idx_ai_cause (classified_root_cause)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 72. Stress Matrix Results table (Phase 9)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS stress_matrix_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        strategy_id VARCHAR(50) NOT NULL,
        matrix_type VARCHAR(50) NOT NULL,
        grid JSON NOT NULL,
        overall_robustness ENUM('ROBUST', 'SENSITIVE', 'FRAGILE', 'INSUFFICIENT_DATA') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_smr_strat (strategy_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 73. Portfolio What-If Runs table (Phase 9)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS portfolio_what_if_runs (
        id VARCHAR(64) PRIMARY KEY,
        scenario_name VARCHAR(100) NOT NULL,
        inputs JSON NOT NULL,
        baseline_equity DECIMAL(12,2) NOT NULL,
        simulated_equity DECIMAL(12,2) NOT NULL,
        baseline_drawdown DECIMAL(5,2) NOT NULL,
        simulated_drawdown DECIMAL(5,2) NOT NULL,
        risk_contributions JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 74. Regime Transition Events table (Phase 9)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS regime_transition_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        asset VARCHAR(20) NOT NULL,
        previous_regime VARCHAR(30) NOT NULL,
        new_regime VARCHAR(30) NOT NULL,
        confidence_score DECIMAL(5,2) NOT NULL,
        trigger_indicators JSON NOT NULL,
        affected_strategies JSON NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_rte_asset (asset)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 75. Daily Research Reports table (Phase 9)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS daily_research_reports (
        id VARCHAR(64) PRIMARY KEY,
        report_date DATE NOT NULL UNIQUE,
        report_payload JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // 76. Weekly Research Reports table (Phase 9)
        await connection.query(`
      CREATE TABLE IF NOT EXISTS weekly_research_reports (
        id VARCHAR(64) PRIMARY KEY,
        week_starting DATE NOT NULL,
        week_ending DATE NOT NULL,
        report_payload JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_wrr_week (week_starting, week_ending)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        // Seed default risk profiles
        const defaultRiskProfiles = [
            { id: 'CONSERVATIVE', name: 'Conservative', risk: 0.5, maxDaily: 2.0, maxConcurrent: 1, desc: 'Capital preservation focus (0.5% risk/trade, 2% daily stop)' },
            { id: 'BALANCED', name: 'Balanced', risk: 1.0, maxDaily: 3.0, maxConcurrent: 1, desc: 'Balanced risk-adjusted exposure (1.0% risk/trade, 3% daily stop)' },
            { id: 'AGGRESSIVE', name: 'Aggressive', risk: 2.0, maxDaily: 5.0, maxConcurrent: 1, desc: 'Maximum allowable simulation risk (2.0% risk/trade, 5% daily stop)' }
        ];
        for (const rp of defaultRiskProfiles) {
            await connection.query(`INSERT IGNORE INTO risk_profiles (id, name, risk_per_trade, max_daily_loss, max_concurrent_trades, description)
         VALUES (?, ?, ?, ?, ?, ?)`, [rp.id, rp.name, rp.risk, rp.maxDaily, rp.maxConcurrent, rp.desc]);
        }
        // Seed default strategies
        const defaultStrategies = [
            { id: 'EMA_RSI', name: 'EMA + RSI', description: 'Combines trend following with momentum oscillator' },
            { id: 'MACD', name: 'MACD', description: 'Moving Average Convergence Divergence trend signals' },
            { id: 'BOLLINGER_BANDS', name: 'Bollinger Bands', description: 'Volatility breakout and mean-reversion signals' },
            { id: 'MULTI_INDICATOR', name: 'Multi Indicator', description: 'Weighted consensus from EMA, RSI & MACD' }
        ];
        for (const strat of defaultStrategies) {
            await connection.query(`INSERT IGNORE INTO strategies (id, name, description, enabled) VALUES (?, ?, ?, ?)`, [strat.id, strat.name, strat.description, true]);
        }
        // Seed demo user with bcrypt hash (never store plaintext password)
        const [rows] = await connection.query(`SELECT id FROM users WHERE email = ?`, ['demo@tradepilot.app']);
        if (rows.length === 0) {
            const passwordHash = await bcryptjs_1.default.hash('123456', 10);
            const [insertResult] = await connection.query(`INSERT INTO users (name, email, mobile, password_hash, demo_balance, account_type)
         VALUES (?, ?, ?, ?, ?, ?)`, ['Sathish', 'demo@tradepilot.app', '+91 98765 43210', passwordHash, 10000.00, 'Demo Account']);
            const newUserId = insertResult.insertId;
            await connection.query(`INSERT IGNORE INTO user_settings (user_id, default_strategy, default_risk, default_duration, notifications_enabled, sound_enabled)
         VALUES (?, ?, ?, ?, ?, ?)`, [newUserId, 'EMA_RSI', 'LOW', 15, true, false]);
            await connection.query(`INSERT IGNORE INTO notification_preferences (user_id, notifications_enabled, critical_risk, strategy_drift, market_data, system_health, paper_trade, experiment, anomaly)
         VALUES (?, true, true, true, true, true, true, true, true)`, [newUserId]);
        }
        else {
            const demoUserId = rows[0].id;
            await connection.query(`INSERT IGNORE INTO notification_preferences (user_id, notifications_enabled, critical_risk, strategy_drift, market_data, system_health, paper_trade, experiment, anomaly)
         VALUES (?, true, true, true, true, true, true, true, true)`, [demoUserId]);
        }
    }
    finally {
        connection.release();
    }
}
