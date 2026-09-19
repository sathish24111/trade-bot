# TradePilot Database Schema Documentation — 76 Tables

## 1. Overview
The TradePilot database (`tradepilot`) utilizes MySQL 8.0 InnoDB with `utf8mb4` encoding across 76 tables spanning Phases 1 through 10.

---

## 2. Table Directory by Functional Group

### Group 1: Users, Authentication & Sessions (Tables 1–4)
1. **`users`**
   - *Purpose*: User profiles, bcrypt password hash, and demo paper balance.
   - *PK*: `id` (INT AUTO_INCREMENT)
   - *Key Columns*: `email`, `password_hash`, `demo_balance`, `account_type`.
2. **`trading_sessions`**
   - *Purpose*: Tracks paper bot trading sessions.
   - *PK*: `id` (VARCHAR(64))
   - *FK*: `user_id` $\to$ `users(id)`.
3. **`trades`**
   - *Purpose*: Individual simulated paper trade records.
   - *PK*: `id` (VARCHAR(64))
   - *FK*: `session_id` $\to$ `trading_sessions(id)`.
4. **`audit_logs`**
   - *Purpose*: Immutable record of system, configuration, and security events.
   - *PK*: `id` (INT AUTO_INCREMENT)

### Group 2: Market Data & Providers (Tables 5–10)
5. **`market_candles`**: OHLCV candle records with timeframe and source.
6. **`historical_datasets`**: Registered historical candle dataset metadata.
7. **`dataset_validation_results`**: Data quality gate validation logs (gaps, nulls, spikes).
8. **`market_provider_metrics`**: Latency and message counters per market feed.
9. **`market_provider_events`**: State transitions (e.g. `PRIMARY_WS` $\to$ `FALLBACK_REST`).
10. **`market_health_events`**: Feed anomaly and disconnection events.

### Group 3: Technical Indicators & Signals (Tables 11–15)
11. **`signals`**: Strategy signals generated with entry, stop loss, and take profit.
12. **`signal_outcomes`**: Post-trade evaluation of signal accuracy.
13. **`regime_analysis`**: Market regime classification snapshots (`TRENDING_BULL`, `RANGING`, etc.).
14. **`research_signal_conflicts`**: Disagreements between multi-strategy ensemble components.
15. **`research_ensemble_configs`**: Multi-strategy ensemble aggregation rules (`MAJORITY`, `WEIGHTED`, `CONSENSUS`).

### Group 4: Risk Monitoring & Exposure (Tables 16–21)
16. **`risk_profiles`**: User-configured risk thresholds.
17. **`risk_snapshots`**: Periodic drawdown, risk utilization, and loss snapshots.
18. **`risk_events`**: Risk limit breaches and emergency interventions.
19. **`portfolios`**: User paper portfolios.
20. **`portfolio_positions`**: Open simulated positions within a portfolio.
21. **`portfolio_exposure_snapshots`**: Gross, net, and asset exposure logs.

### Group 5: Research Strategies & Robustness Lab (Tables 22–35)
22. **`strategies`**: Built-in strategies catalog.
23. **`strategy_parameters`**: Parameter values and default configurations.
24. **`strategy_policy_versions`**: Immutable strategy version records with SHA-256 config hashes.
25. **`research_strategy_versions`**: Detailed strategy parameter snapshots.
26. **`strategy_correlations`**: Pairwise Pearson correlation matrices.
27. **`strategy_regime_metrics`**: Strategy performance segmented by market regime.
28. **`parameter_stability_runs`**: 2D parameter neighborhood sweeps and cliff detection.
29. **`research_comparisons`**: Side-by-side strategy evaluations without winner badges.
30. **`trade_diagnostics`**: 5-step trade execution traces with MAE/MFE metrics.
31. **`backtest_runs`**: Parameterized backtest run records.
32. **`backtest_trades`**: Simulated trade history from backtests.
33. **`backtest_equity`**: Equity curve time-series from backtests.
34. **`optimization_runs`**: Grid search and optimizer runs.
35. **`optimization_results`**: Individual parameter permutation outcomes.

### Group 6: Advanced Validation & Distribution (Tables 36–48)
36. **`walk_forward_runs`**: Anchored and rolling walk-forward test setups.
37. **`walk_forward_results`**: In-sample vs out-of-sample efficiency ratios.
38. **`monte_carlo_runs`**: Trade resample simulations.
39. **`monte_carlo_distributions`**: P5, P25, P50, P75, P95 equity percentiles.
40. **`robustness_runs`**: Multi-dimensional robustness test records.
41. **`confidence_interval_metrics`**: Wilson score and normal approximation confidence intervals.
42. **`performance_stage_metrics`**: 5-stage retention rates (Backtest $\to$ Validation $\to$ OOS $\to$ Walk-Forward $\to$ Paper).
43. **`experiment_snapshots`**: Immutable point-in-time experiment states.
44. **`experiment_clones`**: Cloned experiment lineage links.
45. **`experiment_tags`**: Categorization tags for experiments.
46. **`experiment_timeline_events`**: Lifecycle events of paper experiments.
47. **`strategy_drift_metrics`**: Rolling window trade metrics (7, 20, 50, 100 trades).
48. **`strategy_adaptation_events`**: Strategy parameter adjust events.

### Group 7: Notifications & System Health (Tables 49–61)
49. **`notification_devices`**: Registered FCM device tokens.
50. **`notification_preferences`**: User alert channels and severity filters.
51. **`notification_delivery_log`**: FCM notification dispatch status and timestamps.
52. **`alerts`**: System alerts (drawdown, latency, disconnects).
53. **`anomalies`**: Statistical candle or trade anomalies.
54. **`anomaly_investigations`**: Diagnostic snapshots and suggested root-cause actions.
55. **`system_health_events`**: Health check degradation records.
56. **`websocket_event_log`**: WebSocket event sequence audit logs.
57. **`user_settings`**: Preferences, theme, and default risk tolerances.
58. **`paper_experiments`**: High-level paper experiment configurations.
59. **`paper_experiment_trades`**: Simulated trades generated in paper experiments.
60. **`paper_watchdog_events`**: Automated pause and breach events logged by Watchdog.
61. **`strategy_state_changes`**: Strategy enable/disable state transitions.

### Group 8: Phase 9 & 10 Autonomous Orchestrator (Tables 62–76)
62. **`research_jobs`**: Priority queue research jobs.
63. **`research_job_dependencies`**: Multi-job DAG execution dependencies.
64. **`research_job_checkpoints`**: Stage checkpoints for resumable research jobs.
65. **`research_schedules`**: Recurring automation schedules (`HOURLY`, `DAILY`, `WEEKLY`).
66. **`research_recommendations`**: Non-directive research action recommendations.
67. **`research_evidence_metrics`**: 5-dimensional evidence quality scores.
68. **`experiment_lineage`**: Directed hierarchy of experiment mutations.
69. **`experiment_diffs`**: Structural JSON configuration diffs.
70. **`stress_matrix_results`**: 2D parameter shock evaluations.
71. **`portfolio_what_if_runs`**: Counterfactual portfolio simulations.
72. **`regime_transition_events`**: Market regime shifts and triggered actions.
73. **`daily_research_reports`**: Automated daily paper research rollups.
74. **`weekly_research_reports`**: Automated weekly paper research rollups.
75. **`market_snapshots`**: Periodic multi-asset price and volume snapshots.
76. **`portfolio_equity`**: Longitudinal portfolio equity tracking.
