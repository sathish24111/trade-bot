"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providerController = exports.ProviderController = void 0;
const providerFailover_service_1 = require("../services/market/providerFailover.service");
const database_1 = require("../config/database");
class ProviderController {
    async listProviders(req, res) {
        try {
            const activeName = providerFailover_service_1.providerFailoverService.getActiveProviderName();
            const currentTier = providerFailover_service_1.providerFailoverService.getCurrentTier();
            const health = providerFailover_service_1.providerFailoverService.getHealthInfo();
            const providers = [
                {
                    id: 'CRYPTO_WS',
                    name: 'Public Crypto WebSocket',
                    type: 'WEBSOCKET_STREAM',
                    role: 'PRIMARY',
                    status: currentTier === 'PRIMARY_WS' ? health.connectionStatus : 'STANDBY',
                    supportedAssets: ['BTC/USD', 'ETH/USD'],
                    isLive: true,
                    readOnly: true
                },
                {
                    id: 'CRYPTO_REST',
                    name: 'Public Crypto REST Fallback',
                    type: 'REST_POLL',
                    role: 'FALLBACK',
                    status: currentTier === 'FALLBACK_REST' ? health.connectionStatus : 'AVAILABLE',
                    supportedAssets: ['BTC/USD', 'ETH/USD'],
                    isLive: true,
                    readOnly: true
                },
                {
                    id: 'SIMULATED',
                    name: 'Simulated Market Data Engine',
                    type: 'LOCAL_SIMULATOR',
                    role: 'FAILSAFE',
                    status: currentTier === 'SIMULATED' ? 'ACTIVE' : 'READY',
                    supportedAssets: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'BTC/USD', 'ETH/USD'],
                    isLive: false,
                    readOnly: true
                }
            ];
            return res.json({
                success: true,
                activeProvider: activeName,
                currentTier,
                providers,
                mode: 'PAPER',
                isRealMoney: false,
                brokerConnected: false
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
    async getHealth(req, res) {
        try {
            const health = providerFailover_service_1.providerFailoverService.getHealthInfo();
            return res.json({
                success: true,
                health,
                mode: 'PAPER',
                isRealMoney: false,
                brokerConnected: false
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
    async getEvents(req, res) {
        try {
            const [rows] = await database_1.pool.query(`SELECT id, provider, previous_state, new_state, reason, latency_ms, created_at
         FROM market_provider_events
         ORDER BY id DESC LIMIT 50`);
            return res.json({
                success: true,
                events: rows.map(r => ({
                    id: r.id,
                    provider: r.provider,
                    previousState: r.previous_state,
                    newState: r.new_state,
                    reason: r.reason,
                    latencyMs: r.latency_ms,
                    createdAt: new Date(r.created_at).toISOString()
                })),
                mode: 'PAPER',
                isRealMoney: false,
                brokerConnected: false
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
}
exports.ProviderController = ProviderController;
exports.providerController = new ProviderController();
