# TradePilot — Paper Trading Safety Charter & Non-Negotiable Protocol

## 1. Absolute Safety Requirement

TradePilot is strictly and permanently a **PAPER / DEMO TRADING APPLICATION**.

The platform is designed exclusively for strategy research, algorithmic backtesting, simulated paper execution, portfolio risk modeling, and quantitative validation.

---

## 2. Prohibited Functionality

The following live-trading capabilities are strictly forbidden and permanently barred from the codebase:
1. **Real-Money Trading**: No orders can be routed to financial markets with actual capital.
2. **Broker Order Execution**: Zero broker trading APIs, endpoints, or SDKs are integrated or permitted.
3. **Financial Accounts**: No live trading accounts, credentials, or authorizations exist.
4. **Deposits & Withdrawals**: No payment gateways, banking integrations, crypto deposit addresses, or fiat wire services exist.
5. **Private Broker Credentials**: No broker API keys, client secrets, or private trading keys are stored, processed, or accepted.

---

## 3. Enforcement Mechanisms

### A. Environment Kill-Switch
Startup configuration enforces:
```text
TRADING_MODE=PAPER
```
If `TRADING_MODE` is altered to any value other than `PAPER`, or if broker keys are detected in the runtime environment:
```text
[CONFIG FATAL] Unsafe TRADING_MODE detected: 'LIVE'. TradePilot strictly requires TRADING_MODE=PAPER. Refusing startup.
```
The application **aborts startup immediately** (`process.exit(1)`).

### B. Payload Safety Envelope
Every JSON API response and WebSocket broadcast frame is encapsulated with the standardized safety envelope:
```json
{
  "mode": "PAPER",
  "isRealMoney": false,
  "brokerConnected": false
}
```

### C. Route Inspection Guard
The `paperSafety.service.ts` scanner continuously validates that no prohibited routes (such as `/broker`, `/deposit`, `/withdraw`, `/live-order`) are registered in the Express routing tree.

### D. Read-Only Market Data Feeds
Market data feeds (`CRYPTO_WS`, `CRYPTO_REST`, `SIMULATED`) operate in **read-only** mode. They stream public prices and order books for technical indicator calculations but have zero transaction placement capabilities.

### E. Non-Directive Research Recommendations
All outputs from the research triggers, anomaly diagnostics, and drift detection engines are strictly formatted as *research hypotheses* (e.g. "Trigger walk-forward re-calibration job", "Execute 2D parameter stress grid") and never as investment, financial, or trading advice.

---

## 4. Summary Table

| Category | Policy | Status |
| :--- | :--- | :--- |
| Trading Mode | PAPER ONLY | Verified (`TRADING_MODE=PAPER`) |
| Real Money | NONE | Zero real accounts or capital |
| Broker Integration | NONE | Zero broker execution logic |
| Live Deposits | NONE | Prohibited & blocked (404) |
| Live Withdrawals | NONE | Prohibited & blocked (404) |
| Market Feeds | Read-Only | Public price streaming only |
| Execution Engine | Simulated | Paper accounting with fees & slippage |
