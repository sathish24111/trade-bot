# TradePilot System Architecture — Comprehensive Guide

## 1. Executive System Overview

TradePilot is an enterprise-grade quantitative paper trading, algorithmic research, strategy validation, and risk management platform. It comprises:
1. **Backend Server**: Node.js / TypeScript / Express / WebSocket application backed by a 76-table relational MySQL database.
2. **Mobile Client**: Native Android application engineered with Jetpack Compose, Retrofit2, and OkHttp WebSocket streaming.

---

## 2. Core Architecture Topology

```
+-----------------------------------------------------------------------------------+
|                              Android Compose Client                               |
|   (Research Lab, Control Center, Live Markets, Paper Orders, Portfolio What-If)   |
+------------------------------------------+----------------------------------------+
                                           |  HTTPS REST / WSS WebSocket
                                           v
+-----------------------------------------------------------------------------------+
|                           TradePilot Backend API (Node.js)                         |
|                                                                                   |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  | Request Trace & ID |  | Helmet & CORS Guard  |  | Central Paper Safety Guard|  |
|  +--------------------+  +----------------------+  +---------------------------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                                Express Routing Layer                         |  |
|  |  /auth, /market, /trading, /signals, /risk, /portfolio, /research, /health   |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                            Core Algorithmic Engines                         |  |
|  |  * Research Orchestrator & Priority Queue (14-Stage Sequential Pipeline)    |  |
|  |  * Technical Indicator Engine (EMA, RSI, MACD, ATR, Bollinger)              |  |
|  |  * Multi-Strategy Ensemble & Conflict Resolution                           |  |
|  |  * 4-Stage Walk-Forward Analysis & Parameter Stability Grids               |  |
|  |  * Rolling Drift Trend Analyzer (7, 20, 50, 100 trade windows)              |  |
|  |  * Portfolio Risk Attribution (HHI Concentration Index)                     |  |
|  |  * Paper Execution Engine (Simulated fills, spread & slippage friction)     |  |
|  |  * Paper Experiment Watchdog & Automated Root-Cause Anomaly Investigation   |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
|  +-----------------------------------+   +-------------------------------------+  |
|  |      Market Data Failover         |   |         WebSocket Broadcast         |  |
|  |  Primary WS -> REST -> Simulated  |   |  Bounded Ring Buffer & Backpressure |  |
|  +-----------------------------------+   +-------------------------------------+  |
+------------------------------------------+----------------------------------------+
                                           |  mysql2 Connection Pool
                                           v
+-----------------------------------------------------------------------------------+
|                         Relational MySQL Storage (76 Tables)                      |
|  Users, Sessions, Paper Trades, Candles, Indicators, Experiments, Lineage, Diffs, |
|  Checkpoints, Jobs, Drift Metrics, Stress Matrices, What-If Runs, Reports, Audits |
+-----------------------------------------------------------------------------------+
```

---

## 3. Detailed Component Breakdown

### A. Central Paper Safety Guard (`paperSafety.service.ts`)
- **Fail-Fast Boot**: Startup aborts if `TRADING_MODE !== 'PAPER'`.
- **Route Whitelist**: Express routes are inspected at initialization; any live broker or cash withdrawal endpoint results in immediate crash.
- **Envelope Guarantee**: Every JSON response includes `{ mode: 'PAPER', isRealMoney: false, brokerConnected: false }`.

### B. Autonomous Research Orchestrator (`researchOrchestrator.service.ts`)
- **Priority Queue**: Schedules jobs with `HIGH`, `NORMAL`, or `LOW` priority.
- **14-Stage Sequential Pipeline**:
  `DATA_QUALITY_GATE` $\to$ `INDICATOR_WARMUP` $\to$ `BACKTEST_SIMULATION` $\to$ `SAMPLE_SIZE_EVALUATION` $\to$ `OUT_OF_SAMPLE_VALIDATION` $\to$ `WALK_FORWARD_ANCHORED` $\to$ `WALK_FORWARD_ROLLING` $\to$ `PARAMETER_SENSITIVITY_SCAN` $\to$ `MONTE_CARLO_SIMULATION` $\to$ `REGIME_SEGMENTED_PERFORMANCE` $\to$ `CORRELATION_ANALYSIS` $\to$ `DRIFT_RISK_ASSESSMENT` $\to$ `EVIDENCE_SCORE_COMPUTATION` $\to$ `CHECKPOINT_FINALIZATION`.
- **Resilient Checkpointing**: Each stage writes state to `research_job_checkpoints`. Paused or interrupted jobs resume without lookahead bias.

### C. Market Data Resilience & Read-Only Ingestion
- Multi-tier failover: `PRIMARY_WS` (Binance public WebSocket stream) $\to$ `FALLBACK_REST` (Public REST polling) $\to$ `SIMULATED` (deterministic GBM generator).
- Zero order placement capabilities.

### D. WebSocket Broadcast Engine with Backpressure Handling
- Sequence numbers (`currentSequence`) for reconnect synchronization.
- Bounded 100-event ring buffer for client catch-up.
- Backpressure throttling: Drops high-frequency non-critical events (`MARKET_UPDATE`) for slow clients (`bufferedAmount > 64KB`) while ensuring delivery of critical security alerts.

### E. Database Layer & Connection Pool
- Connection pool with keep-alive, idle timeout (60s), and connection limit bounded by `DATABASE_POOL_SIZE`.
- 76 normalized tables supporting transactional consistency.
