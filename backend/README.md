# TradePilot Backend — Paper Trading Engine & API (Phase 2)

TradePilot is a smart trading assistant backend built with **Node.js**, **Express**, **TypeScript**, **MySQL**, and **WebSocket**.
All trading operations are executed strictly in **DEMO/PAPER MODE** with zero connection to real-money brokers (no Olymptrade, Deriv, etc.).

---

## 1. Requirements
- Node.js v18+ (tested on v24)
- npm v9+
- MySQL Server 8.0+ running on `localhost:3306`

---

## 2. Installation
```bash
cd backend
npm install
```

---

## 3. MySQL Database Setup
Log in to MySQL and ensure the database exists:
```sql
CREATE DATABASE IF NOT EXISTS tradepilot;
```
The application automatically runs migrations on startup, creating the following tables:
- `users`: User profiles, hashed passwords, demo balances.
- `trading_sessions`: Active and historical paper trading sessions.
- `trades`: Individual simulated paper trades.
- `strategies`: Strategy metadata (`EMA_RSI`, `MACD`, `BOLLINGER_BANDS`, `MULTI_INDICATOR`).
- `user_settings`: Preferences and defaults.
- `market_snapshots`: Price snapshots.

---

## 4. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default configuration:
```ini
PORT=5000
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=tradepilot
DATABASE_USER=root
DATABASE_PASSWORD=your_mysql_password
JWT_SECRET=tradepilot_jwt_super_secret_key_demo_2026
NODE_ENV=development
```
*Note: Never commit `.env` or production passwords to version control.*

---

## 5. Starting the Backend
### Development Mode (ts-node):
```bash
npm run dev
```

### Production Build:
```bash
npm run build
npm start
```
The server will start on port `5000` with:
- REST API: `http://localhost:5000/api`
- WebSocket: `ws://localhost:5000/ws`
- Healthcheck: `http://localhost:5000/api/health`

---

## 6. Seeded Demo Credentials
The database automatically seeds a demo user on startup:
- **Email**: `demo@tradepilot.app`
- **Password**: `123456` *(stored securely as a bcrypt hash, never in plaintext)*
- **Starting Balance**: `₹10,000.00` (Demo Account)

---

## 7. REST API Endpoints

### Authentication
- `POST /api/auth/register`: Create a new user account.
- `POST /api/auth/login`: Authenticate and receive a JWT.
- `GET /api/auth/me`: Get current authenticated user profile.

### Market Data (`SIMULATED MARKET DATA`)
- `GET /api/market/assets`: List all simulated assets (EUR/USD, GBP/USD, USD/JPY, BTC/USD, ETH/USD).
- `GET /api/market/:asset`: Get single asset price and indicators.
- `GET /api/market/:asset/candles`: Get 25+ OHLC candlestick bars.

### Trading Sessions (Paper Engine)
- `POST /api/trading/session/start`: Start a paper bot session (`investmentAmount`, `strategy`, `riskLevel`, `duration`).
- `GET /api/trading/session/:id`: Get session status and metrics.
- `POST /api/trading/session/:id/stop`: Stop an active paper bot session.
- `GET /api/trading/sessions`: Get user's session history.

### Performance & History
- `GET /api/performance/summary`: Total P/L, today's P/L, win rate, total trades, equity curve.
- `GET /api/performance/daily`: Daily performance breakdown.
- `GET /api/performance/trades`: Filtered list of paper trades (`ALL`, `WINS`, `LOSSES`, `BUY`, `SELL`).

---

## 8. WebSocket Events (`/ws`)
Connect via `ws://localhost:5000/ws` (or `ws://10.0.2.2:5000/ws` for Android Emulator):
- `MARKET_UPDATE`: Real-time simulated price ticks and indicators.
- `BOT_STATUS`: Active session state (`RUNNING`, elapsed time, P/L, trades count, logs).
- `TRADE_CREATED`: Emitted whenever a paper trade is executed.
- `PNL_UPDATE`: Real-time session P/L updates.
- `SESSION_COMPLETED`: Emitted when a session terminates or duration expires.
- `RISK_ALERT`: Emitted when the 5% daily loss limit is reached, automatically halting the bot.

---

## 9. Android Network Configuration
- **Android Emulator**: Uses `http://10.0.2.2:5000/` and `ws://10.0.2.2:5000/ws`.
- **Physical Device**: Set base URL to your machine's local LAN IP (e.g. `http://192.168.1.x:5000/`).
- **Offline Fallback**: If the server is offline, the app displays:
  `⚠ SERVER OFFLINE - Using cached demo data`
  and operates gracefully using local storage.

---

## 10. Running Tests
```bash
npm test
```
Runs Jest test suites covering Risk limits, Strategy evaluation, and REST API endpoints.
