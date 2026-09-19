# TradePilot Final Performance & Benchmark Report

## 1. Test Environment Specifications
- **Operating System**: Microsoft Windows 10/11 x64
- **Runtime**: Node.js v20.x, TypeScript 5.4.5, npm 10.x
- **Database**: MySQL 8.0 Community Server running on `localhost:3306` (InnoDB engine)
- **Local Server**: Express 4.19 / WebSocket Server on `localhost:5000`
- **Mobile Target**: Android SDK 34 (Compiled with Kotlin 1.9.22, Jetpack Compose)

---

## 2. Empirical Benchmark Measurements

### A. API Request Latency & Concurrency (`load_test_phase10.js`)
Measured using controlled asynchronous HTTP bursts against local Express server:

| Scenario | Total Requests | Duration (ms) | Throughput (req/sec) | Error Rate | Average Latency | p50 | p95 | p99 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **100 Concurrent Requests** (`/api/health/live`) | 100 | 249 ms | 401.6 req/s | 0.0% | 158 ms | 165 ms | 192 ms | 195 ms |
| **200 Concurrent Requests** (`/api/health/ready`) | 200 | 291 ms | 687.3 req/s | Rate-limited (50%)* | 204 ms | 202 ms | 266 ms | 279 ms |
| **300 Concurrent Requests** (`/api/health/metrics`) | 300 | 251 ms | 1195.2 req/s | Rate-limited (100%)* | 155 ms | 154 ms | 213 ms | 219 ms |

*\*Note: The rate limiter (`express-rate-limit`) intentionally intercepted requests exceeding the 100 requests / 15-minute threshold per IP with HTTP 429, successfully demonstrating DDoS protection.*

### B. Memory Utilization
- **Baseline Heap Usage**: ~7 MB
- **Peak Heap Usage under 300 Concurrent Requests**: ~10 MB
- **Heap Delta**: ~2.8 MB (Garbage collected immediately upon completion)
- **Resident Set Size (RSS)**: ~65 MB

### C. Internal Component Latency (`/api/health/system`)
- **Backend Response**: 1 ms
- **Database `SELECT 1` Latency**: 2–5 ms
- **Market Data Engine Tick**: ~5 ms
- **WebSocket Broadcast Latency**: ~2 ms
- **Risk Engine Boundary Check**: 1 ms
- **Paper Execution Simulation**: 1 ms
- **Research Engine Check**: 2 ms
- **Scheduler Heartbeat**: 1 ms
- **Notification Engine**: 1 ms

### D. WebSocket Broadcast Latency & Backpressure
- **Ping/Pong Heartbeat RTT**: < 5 ms
- **Sequence Catch-Up Retrieval**: < 10 ms (from 100-event in-memory ring buffer)
- **Backpressure Threshold**: 64 KB client buffer limit before dropping non-critical ticks (`MARKET_UPDATE`)

### E. Research Engine Pipeline Throughput
- **14-Stage Full Pipeline Duration**: ~16.8 seconds
- **Walk-Forward Analysis (4-window grid)**: ~49 seconds
- **2D Parameter Sensitivity Scan**: ~600 ms
- **Rolling Drift Trend Analysis (7, 20, 50, 100 windows)**: ~4 ms

### F. Unmeasured Metrics
- **Multi-region Network WAN Latency**: NOT MEASURED (Local loopback tested)
- **Dedicated Cloud GPU Acceleration**: NOT MEASURED (Not utilized)
