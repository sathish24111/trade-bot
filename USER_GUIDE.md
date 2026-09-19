# TradePilot User Guide — Quantitative Paper Trading & Research Platform

Welcome to **TradePilot**, an advanced quantitative paper trading and strategy research mobile platform.

---

## 1. Core Principle: Live Read-Only Data vs. Simulated Paper Execution

> [!IMPORTANT]
> **LIVE READ-ONLY MARKET DATA**:
> All price candles, ticker quotes, and order book information shown in TradePilot reflect **live public market feeds** (`BTC/USD`, `ETH/USD`, `EUR/USD`, etc.) streamed in real-time.
>
> **SIMULATED PAPER ORDER EXECUTION**:
> All trades executed in TradePilot are **100% simulated**. No real money is deposited, risked, or traded. Simulated fills calculate realistic fees, bid-ask spread, and execution slippage against virtual demo balances.

---

## 2. Navigating the Android Application

### A. Authentication & Demo Login
1. Launch TradePilot on your Android device.
2. Sign in using your registered email or the default demo account:
   - Email: `demo@tradepilot.app`
   - Password: `password123`
3. Upon login, your account is credited with a default **$10,000 virtual demo balance**.

### B. Live Markets Screen
- Real-time candlestick charts with multi-timeframe toggles (1m, 5m, 15m, 1h, 1d).
- Technical indicators overlay: 14-period RSI, 21-period EMA, MACD, and Bollinger Bands.
- Live data source indicator (`CRYPTO_WS` or `FALLBACK_REST`).

### C. Paper Trading & Bot Sessions
- Start automated paper trading bots selecting pre-configured strategies:
  - `EMA_RSI`: Momentum and trend following.
  - `BREAKOUT_VOLATILITY`: Bollinger volatility expansion.
  - `MEAN_REVERSION`: Statistical mean reversion.
  - `MULTI_TIMEFRAME_TREND`: Higher timeframe directional trend filter.
- Configure virtual allocation ($500 - $5,000), duration, and stop-loss/take-profit boundaries.

### D. Research Control Center (9 Tabs)
1. **OVERVIEW**: System health, active jobs count, pending research recommendations, and evidence summary.
2. **JOBS**: Priority queue browser. Launch backtests, walk-forward analyses, and 14-stage full research pipelines.
3. **STRATEGIES**: Evidence quality scores (0.00–1.00) across 5 dimensions, parameter hashes, and rolling drift indicators.
4. **PORTFOLIO**: Counterfactual "What-If" simulator modeling capital re-allocations and stress frictions.
5. **RISKS**: 2D parameter stress matrix heatmaps (`COST_X_SLIPPAGE`, `VOLATILITY_X_SPREAD`).
6. **REGIMES**: Structural market regime transition history and triggered actions.
7. **ANOMALIES**: Root-cause diagnostic reports and diagnostic summaries.
8. **EXPERIMENTS**: Interactive lineage tree hierarchy and structural config diffs.
9. **REPORTS**: Daily and weekly research report archives with downloadable summaries.

### E. Paper Trade Replay
- Interactive candle-by-candle simulated trade player.
- Step forward, step backward, pause, and speed controls (1x, 2x, 5x, 10x).
- Anti-lookahead isolation: At bar $k$, all indicators and decisions evaluate strictly on candles $0..k$.
- 5-step diagnostic decision trace: `MARKET_STATE` $\to$ `INDICATOR_EVALUATION` $\to$ `STRATEGY_LOGIC` $\to$ `RISK_CHECK` $\to$ `EXECUTION_DECISION`.

### F. Risk Dashboard
- Real-time monitoring of daily loss, peak-to-trough drawdown, and risk utilization.
- Concentration risk tracking via the **Herfindahl-Hirschman Index (HHI)**.
- Emergency manual Kill-Switch to pause all active paper trading bots.
