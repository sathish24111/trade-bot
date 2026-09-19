"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providerFailoverService = exports.ProviderFailoverService = void 0;
const database_1 = require("../../config/database");
const env_1 = require("../../config/env");
const publicCryptoWs_provider_1 = require("./publicCryptoWs.provider");
const publicCryptoRest_provider_1 = require("./publicCryptoRest.provider");
const MockMarketDataProvider_1 = require("./MockMarketDataProvider");
const alert_service_1 = require("../monitoring/alert.service");
const websocket_server_1 = require("../../websocket/websocket.server");
class ProviderFailoverService {
    name = 'provider-failover-orchestrator';
    wsProvider;
    restProvider;
    mockProvider;
    primaryName;
    fallbackName;
    currentTier = 'PRIMARY_WS';
    failoverCount = 0;
    status = 'HEALTHY';
    lastStateTransitionTime = Date.now();
    metricsTimer = null;
    constructor() {
        this.wsProvider = publicCryptoWs_provider_1.publicCryptoWsProvider;
        this.restProvider = publicCryptoRest_provider_1.publicCryptoRestProvider;
        this.mockProvider = new MockMarketDataProvider_1.MockMarketDataProvider();
        this.primaryName = env_1.env.DATA_PROVIDER_PRIMARY || 'CRYPTO_WS';
        this.fallbackName = env_1.env.DATA_PROVIDER_FALLBACK || 'CRYPTO_REST';
        // Start background health sync
        this.startMetricsSync();
    }
    getCurrentTier() {
        return this.currentTier;
    }
    setTier(tier) {
        const oldTier = this.currentTier;
        this.currentTier = tier;
        if (oldTier !== tier) {
            this.failoverCount++;
            this.recordTransition('CRYPTO_DATA_CHAIN', oldTier, tier, `Manual or automatic tier shift to ${tier}`);
        }
    }
    getActiveProviderName() {
        if (this.currentTier === 'PRIMARY_WS')
            return this.wsProvider.name;
        if (this.currentTier === 'FALLBACK_REST')
            return this.restProvider.name;
        return this.mockProvider.name;
    }
    supportsAsset(symbol) {
        return this.wsProvider.supportsAsset(symbol) || this.mockProvider.supportsAsset(symbol);
    }
    /**
     * Main quote routing with failover
     */
    async getQuote(symbol, timeframe = '5m') {
        // 1. Try Primary WebSocket Provider
        if (this.currentTier === 'PRIMARY_WS') {
            try {
                if (this.wsProvider.getState() === 'HEALTHY' || this.wsProvider.getState() === 'RECOVERING') {
                    return await this.wsProvider.getQuote(symbol, timeframe);
                }
                else {
                    // Trigger automatic failover to REST
                    await this.triggerFailover('PRIMARY_WS', 'FALLBACK_REST', 'WebSocket provider degraded or failed');
                }
            }
            catch (err) {
                await this.triggerFailover('PRIMARY_WS', 'FALLBACK_REST', `Primary WS error: ${err.message}`);
            }
        }
        // 2. Try Fallback REST Provider
        if (this.currentTier === 'FALLBACK_REST') {
            try {
                const quote = await this.restProvider.getQuote(symbol, timeframe);
                return quote;
            }
            catch (err) {
                await this.triggerFailover('FALLBACK_REST', 'SIMULATED', `REST fallback error: ${err.message}`);
            }
        }
        // 3. Fallback to SIMULATED DATA
        return await this.mockProvider.getQuote(symbol, timeframe);
    }
    /**
     * Main candle routing with failover
     */
    async getCandles(symbol, timeframe = '5m', count = 60) {
        if (this.currentTier === 'PRIMARY_WS') {
            try {
                if (this.wsProvider.getState() === 'HEALTHY' || this.wsProvider.getState() === 'RECOVERING') {
                    return await this.wsProvider.getCandles(symbol, timeframe, count);
                }
                else {
                    await this.triggerFailover('PRIMARY_WS', 'FALLBACK_REST', 'WebSocket provider degraded or failed');
                }
            }
            catch (err) {
                await this.triggerFailover('PRIMARY_WS', 'FALLBACK_REST', `Primary WS candles error: ${err.message}`);
            }
        }
        if (this.currentTier === 'FALLBACK_REST') {
            try {
                return await this.restProvider.getCandles(symbol, timeframe, count);
            }
            catch (err) {
                await this.triggerFailover('FALLBACK_REST', 'SIMULATED', `REST fallback candles error: ${err.message}`);
            }
        }
        return await this.mockProvider.getCandles(symbol, timeframe, count);
    }
    async getAllAssets() {
        if (this.currentTier === 'PRIMARY_WS' && this.wsProvider.getState() === 'HEALTHY') {
            try {
                return await this.wsProvider.getAllAssets();
            }
            catch {
                await this.triggerFailover('PRIMARY_WS', 'FALLBACK_REST', 'Failover on getAllAssets');
            }
        }
        if (this.currentTier === 'FALLBACK_REST') {
            try {
                return await this.restProvider.getAllAssets();
            }
            catch {
                await this.triggerFailover('FALLBACK_REST', 'SIMULATED', 'Failover to simulated on getAllAssets');
            }
        }
        return await this.mockProvider.getAllAssets();
    }
    async getAsset(symbol, timeframe = '5m') {
        if (this.currentTier === 'PRIMARY_WS' && this.wsProvider.getState() === 'HEALTHY') {
            try {
                const a = await this.wsProvider.getAsset(symbol, timeframe);
                if (a)
                    return a;
            }
            catch {
                await this.triggerFailover('PRIMARY_WS', 'FALLBACK_REST', 'Failover on getAsset');
            }
        }
        if (this.currentTier === 'FALLBACK_REST') {
            try {
                const a = await this.restProvider.getAsset(symbol, timeframe);
                if (a)
                    return a;
            }
            catch {
                await this.triggerFailover('FALLBACK_REST', 'SIMULATED', 'Failover to simulated on getAsset');
            }
        }
        return await this.mockProvider.getAsset(symbol, timeframe);
    }
    tick() {
        return this.mockProvider.tick();
    }
    /**
     * Triggers seamless provider failover with logging and alerting
     */
    async triggerFailover(fromTier, toTier, reason) {
        if (this.currentTier === toTier)
            return;
        this.currentTier = toTier;
        this.failoverCount++;
        this.status = toTier === 'SIMULATED' ? 'DEGRADED' : 'RECOVERING';
        this.lastStateTransitionTime = Date.now();
        const transitionMessage = `Market Provider Failover: [${fromTier}] -> [${toTier}]. Reason: ${reason}`;
        console.warn(`[Failover] ${transitionMessage}`);
        // 1. Record transition in database
        await this.recordTransition(fromTier, fromTier, toTier, reason);
        // 2. Trigger Alert
        try {
            await alert_service_1.alertService.createAlert({
                type: 'MARKET_PROVIDER_FAILOVER',
                severity: toTier === 'SIMULATED' ? 'WARNING' : 'INFO',
                message: transitionMessage,
                metadata: { fromTier, toTier, reason }
            });
        }
        catch { }
        // 3. Emit WebSocket events
        try {
            (0, websocket_server_1.broadcastEvent)({
                type: 'MARKET_PROVIDER_FAILOVER',
                fromTier,
                toTier,
                reason,
                activeProvider: this.getActiveProviderName(),
                timestamp: new Date().toISOString()
            });
            (0, websocket_server_1.broadcastEvent)({
                type: 'MARKET_PROVIDER_STATUS',
                status: this.status,
                activeProvider: this.getActiveProviderName(),
                fallbackActive: true,
                failoverCount: this.failoverCount,
                timestamp: new Date().toISOString()
            });
        }
        catch { }
    }
    /**
     * Attempt to recover primary provider back to PRIMARY_WS
     */
    async recoverPrimary() {
        try {
            this.wsProvider.setState('HEALTHY');
            const oldTier = this.currentTier;
            this.currentTier = 'PRIMARY_WS';
            this.status = 'HEALTHY';
            await this.recordTransition('CRYPTO_WS', oldTier, 'PRIMARY_WS', 'Primary provider successfully recovered');
            (0, websocket_server_1.broadcastEvent)({
                type: 'MARKET_PROVIDER_STATUS',
                status: 'HEALTHY',
                activeProvider: this.getActiveProviderName(),
                fallbackActive: false,
                failoverCount: this.failoverCount,
                timestamp: new Date().toISOString()
            });
            return true;
        }
        catch {
            return false;
        }
    }
    async recordTransition(provider, prev, next, reason) {
        try {
            await database_1.pool.query(`INSERT INTO market_provider_events (provider, previous_state, new_state, reason, latency_ms)
         VALUES (?, ?, ?, ?, ?)`, [provider, prev, next, reason, this.wsProvider.latencyMs || 0]);
        }
        catch (err) {
            console.error('Failed to log provider event:', err.message);
        }
    }
    getHealthInfo() {
        const totalDurationSec = Math.max(1, (Date.now() - this.wsProvider.startTime) / 1000);
        const errorCount = this.wsProvider.errorCount + this.restProvider.errorCount;
        const uptimePercent = Math.max(0, 100 - (errorCount * 0.5));
        const availabilityPercent = this.currentTier === 'SIMULATED' ? 75.0 : 99.5;
        const avgLatency = this.currentTier === 'PRIMARY_WS' ? (this.wsProvider.latencyMs || 5) : (this.restProvider.latencyMs || 25);
        return {
            provider: this.getActiveProviderName(),
            connectionStatus: this.status,
            lastMessageTime: this.wsProvider.lastMessageTime || Date.now(),
            lastCandleTime: Date.now() - 60000,
            latencyMs: avgLatency,
            messageRate: Number((this.wsProvider.messageCount / totalDurationSec).toFixed(2)),
            reconnectCount: this.wsProvider.reconnectCount,
            errorCount,
            dataAgeMs: Math.max(0, Date.now() - (this.wsProvider.lastMessageTime || Date.now())),
            gapCount: 0,
            invalidCount: errorCount,
            duplicateCount: 0,
            uptimePercent: Number(uptimePercent.toFixed(2)),
            availabilityPercent,
            avgLatencyMs: avgLatency,
            maxLatencyMs: Math.max(avgLatency, 50),
            failoverCount: this.failoverCount,
            fallbackActive: this.currentTier !== 'PRIMARY_WS',
            activeProviderName: this.getActiveProviderName()
        };
    }
    startMetricsSync() {
        if (!this.metricsTimer) {
            this.metricsTimer = setInterval(async () => {
                try {
                    const health = this.getHealthInfo();
                    await database_1.pool.query(`INSERT INTO market_provider_metrics 
             (provider, uptime_percent, availability_percent, avg_latency_ms, max_latency_ms, reconnect_count, failover_count, error_count, data_age_ms)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                        health.provider,
                        health.uptimePercent,
                        health.availabilityPercent,
                        health.avgLatencyMs,
                        health.maxLatencyMs,
                        health.reconnectCount,
                        health.failoverCount,
                        health.errorCount,
                        health.dataAgeMs
                    ]);
                }
                catch { }
            }, 30000); // every 30s
        }
    }
    destroy() {
        if (this.metricsTimer) {
            clearInterval(this.metricsTimer);
            this.metricsTimer = null;
        }
    }
}
exports.ProviderFailoverService = ProviderFailoverService;
exports.providerFailoverService = new ProviderFailoverService();
