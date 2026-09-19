# TradePilot Operations Runbook — Production Hardening & Reliability

## 1. System Startup & Configuration

### A. Environment Configuration
The backend server requires environment variables defined in `.env`:
```bash
NODE_ENV=paper-production
PORT=5000
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=tradepilot
DATABASE_USER=root
DATABASE_PASSWORD=your_secure_password
JWT_SECRET=your_minimum_16_character_secret_key
DATABASE_POOL_SIZE=20
DATABASE_IDLE_TIMEOUT_MS=60000
WEBSOCKET_MAX_CONNECTIONS=500
RESEARCH_MAX_CONCURRENT_JOBS=5
TRADING_MODE=PAPER
DATA_PROVIDER_PRIMARY=CRYPTO_WS
DATA_PROVIDER_FALLBACK=CRYPTO_REST
```

### B. Starting the Server
```bash
cd backend
npm run build
npm start
```
The startup sequence automatically executes:
1. `configValidationService.validateStartupConfig()` (verifies `TRADING_MODE=PAPER`).
2. `paperSafetyService.verifySafetyOrThrow()`.
3. Database schema verification & migrations (all 76 tables).
4. `recoveryService.executeRecovery()` (reconciles interrupted sessions and pauses active experiments).
5. WebSocket server attachment on `/ws`.

---

## 2. Health Monitoring & Probes

| Endpoint | Method | Expected Status | Purpose |
| :--- | :--- | :--- | :--- |
| `/api/health/live` | GET | 200 OK | Process liveness probe |
| `/api/health/ready` | GET | 200 OK (503 if DB down) | Database readiness probe |
| `/api/health/system` | GET | 200 OK | 10-component detailed health report |
| `/api/health/metrics` | GET | 200 OK | Latency percentiles (p50, p95, p99) and heap usage |
| `/api/health/safety` | GET | 200 OK | Centralized paper safety audit report |

---

## 3. Database Backup & Disaster Recovery

### A. In-Memory Snapshot Export
Invoke the automated backup service:
```javascript
const { backupRestoreService } = require('./dist/services/monitoring/backupRestore.service');
const backup = await backupRestoreService.createPaperDataBackup();
```

### B. Native MySQL Dump
```bash
mysqldump -u root -p tradepilot > tradepilot_backup.sql
```

### C. Restoring from SQL Backup
```bash
mysql -u root -p tradepilot < tradepilot_backup.sql
```

---

## 4. Troubleshooting Procedures

### A. WebSocket Disconnects
- **Symptom**: Android client displays `SERVER OFFLINE` or misses price ticks.
- **Remedy**:
  1. Verify backend port 5000 is listening: `curl http://localhost:5000/api/health/live`.
  2. Check WebSocket client connection limits: `WEBSOCKET_MAX_CONNECTIONS` in `.env`.
  3. Client should send `{ type: "CATCH_UP", lastSequence: N }` upon reconnect to retrieve buffered events from the 100-event ring buffer.

### B. Market Data Provider Failover
- **Symptom**: Public WebSocket latency exceeds 2000ms.
- **Remedy**:
  - `providerFailoverService` automatically switches to `CRYPTO_REST`.
  - Check provider health at `/api/providers/health`.

### C. Stalled Research Jobs
- **Symptom**: A research job remains in `RUNNING` status without checkpoint advances.
- **Remedy**:
  1. Call `/api/research/jobs/:id/pause` to safely checkpoint state.
  2. Call `/api/research/jobs/:id/resume` to resume from the last stage checkpoint.
  3. Or cancel with audit reason: `POST /api/research/jobs/:id/cancel` with `{ "reason": "Operator reset" }`.
