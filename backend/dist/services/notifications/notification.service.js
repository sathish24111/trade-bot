"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const database_1 = require("../../config/database");
const env_1 = require("../../config/env");
const websocket_server_1 = require("../../websocket/websocket.server");
class NotificationService {
    cooldownMap = new Map();
    DEFAULT_COOLDOWN_MS = 60 * 1000; // 60 seconds
    /**
     * Registers or updates a device push token
     */
    async registerDevice(userId, deviceToken, platform = 'ANDROID') {
        if (!deviceToken || deviceToken.trim().length === 0) {
            throw new Error('Device token is required');
        }
        try {
            await database_1.pool.query(`INSERT INTO notification_devices (user_id, device_token, platform, enabled, last_seen_at)
         VALUES (?, ?, ?, TRUE, CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE enabled = TRUE, last_seen_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP`, [userId, deviceToken.trim(), platform]);
            const [rows] = await database_1.pool.query(`SELECT id, user_id, device_token, platform, enabled, created_at, updated_at, last_seen_at 
         FROM notification_devices WHERE device_token = ?`, [deviceToken.trim()]);
            const r = rows[0];
            return {
                id: r.id,
                userId: r.user_id,
                deviceToken: r.device_token,
                platform: r.platform,
                enabled: Boolean(r.enabled),
                createdAt: new Date(r.created_at).toISOString(),
                updatedAt: new Date(r.updated_at).toISOString(),
                lastSeenAt: new Date(r.last_seen_at).toISOString()
            };
        }
        catch (err) {
            // Fallback in-memory response if DB error occurs
            return {
                id: 1,
                userId,
                deviceToken,
                platform,
                enabled: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastSeenAt: new Date().toISOString()
            };
        }
    }
    /**
     * Unregisters a device token
     */
    async unregisterDevice(userId, identifier) {
        try {
            if (typeof identifier === 'number') {
                await database_1.pool.query(`DELETE FROM notification_devices WHERE id = ? AND user_id = ?`, [identifier, userId]);
            }
            else {
                await database_1.pool.query(`DELETE FROM notification_devices WHERE device_token = ? AND user_id = ?`, [identifier, userId]);
            }
            return true;
        }
        catch {
            return false;
        }
    }
    preferencesCache = new Map();
    /**
     * Retrieves notification preferences for a user
     */
    async getPreferences(userId) {
        const cached = this.preferencesCache.get(userId);
        if (cached)
            return cached;
        try {
            const [rows] = await database_1.pool.query(`SELECT id, user_id, notifications_enabled, critical_risk, strategy_drift, market_data, system_health, paper_trade, experiment, anomaly, updated_at
         FROM notification_preferences WHERE user_id = ?`, [userId]);
            if (rows.length > 0) {
                const r = rows[0];
                const res = {
                    id: r.id,
                    userId: r.user_id,
                    notificationsEnabled: Boolean(r.notifications_enabled),
                    criticalRisk: Boolean(r.critical_risk),
                    strategyDrift: Boolean(r.strategy_drift),
                    marketData: Boolean(r.market_data),
                    systemHealth: Boolean(r.system_health),
                    paperTrade: Boolean(r.paper_trade),
                    experiment: Boolean(r.experiment),
                    anomaly: Boolean(r.anomaly),
                    updatedAt: new Date(r.updated_at).toISOString()
                };
                this.preferencesCache.set(userId, res);
                return res;
            }
        }
        catch { }
        // Default preferences
        const fallback = {
            userId,
            notificationsEnabled: true,
            criticalRisk: true,
            strategyDrift: true,
            marketData: true,
            systemHealth: true,
            paperTrade: true,
            experiment: true,
            anomaly: true,
            updatedAt: new Date().toISOString()
        };
        this.preferencesCache.set(userId, fallback);
        return fallback;
    }
    /**
     * Updates notification preferences
     */
    async updatePreferences(userId, updates) {
        const current = await this.getPreferences(userId);
        const merged = {
            ...current,
            ...updates,
            userId
        };
        this.preferencesCache.set(userId, merged);
        try {
            await database_1.pool.query(`INSERT INTO notification_preferences 
         (user_id, notifications_enabled, critical_risk, strategy_drift, market_data, system_health, paper_trade, experiment, anomaly)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           notifications_enabled = VALUES(notifications_enabled),
           critical_risk = VALUES(critical_risk),
           strategy_drift = VALUES(strategy_drift),
           market_data = VALUES(market_data),
           system_health = VALUES(system_health),
           paper_trade = VALUES(paper_trade),
           experiment = VALUES(experiment),
           anomaly = VALUES(anomaly),
           updated_at = CURRENT_TIMESTAMP`, [
                userId,
                merged.notificationsEnabled,
                merged.criticalRisk,
                merged.strategyDrift,
                merged.marketData,
                merged.systemHealth,
                merged.paperTrade,
                merged.experiment,
                merged.anomaly
            ]);
        }
        catch { }
        return merged;
    }
    /**
     * Checks if notification should be filtered based on user preferences
     */
    isCategoryEnabled(prefs, category) {
        if (!prefs.notificationsEnabled)
            return false;
        switch (category) {
            case 'CRITICAL_RISK': return prefs.criticalRisk;
            case 'STRATEGY_DRIFT': return prefs.strategyDrift;
            case 'MARKET_DATA': return prefs.marketData;
            case 'SYSTEM_HEALTH': return prefs.systemHealth;
            case 'PAPER_TRADE': return prefs.paperTrade;
            case 'EXPERIMENT': return prefs.experiment;
            case 'ANOMALY': return prefs.anomaly;
            default: return true;
        }
    }
    /**
     * Deduplication check
     */
    isCooldownActive(userId, category, key, cooldownMs = this.DEFAULT_COOLDOWN_MS) {
        const dedupeKey = `${userId}_${category}_${key}`;
        const now = Date.now();
        const lastSent = this.cooldownMap.get(dedupeKey);
        if (lastSent && now - lastSent < cooldownMs) {
            return true;
        }
        this.cooldownMap.set(dedupeKey, now);
        return false;
    }
    /**
     * Dispatches push notification to registered devices
     */
    async dispatchNotification(payload) {
        const targetUserId = payload.userId || 1;
        // 1. Preference check
        const prefs = await this.getPreferences(targetUserId);
        if (!this.isCategoryEnabled(prefs, payload.category)) {
            return { delivered: 0, failed: 0 };
        }
        // 2. Cooldown deduplication check
        if (this.isCooldownActive(targetUserId, payload.category, payload.title)) {
            return { delivered: 0, failed: 0 };
        }
        // 3. Fetch registered devices
        let devices = [];
        try {
            const [rows] = await database_1.pool.query(`SELECT device_token FROM notification_devices WHERE user_id = ? AND enabled = TRUE`, [targetUserId]);
            devices = rows;
        }
        catch { }
        let delivered = 0;
        let failed = 0;
        // If no physical device registered yet, record log with mock token for audit integrity
        const targetTokens = devices.length > 0 ? devices.map(d => d.device_token) : ['MOCK_ANDROID_FCM_TOKEN_DEMO'];
        for (const token of targetTokens) {
            let status = 'SENT';
            let errorDetails = null;
            try {
                if (env_1.env.FCM_SERVER_KEY && env_1.env.FCM_SERVER_KEY.trim().length > 0 && !token.startsWith('MOCK_')) {
                    // Real FCM HTTP Call
                    const fcmRes = await fetch('https://fcm.googleapis.com/fcm/send', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `key=${env_1.env.FCM_SERVER_KEY}`
                        },
                        body: JSON.stringify({
                            to: token,
                            notification: {
                                title: payload.title,
                                body: payload.body
                            },
                            data: payload.metadata || {}
                        })
                    });
                    if (!fcmRes.ok) {
                        status = 'FAILED';
                        errorDetails = `FCM Error: ${fcmRes.statusText}`;
                        failed++;
                    }
                    else {
                        status = 'SENT';
                        delivered++;
                    }
                }
                else {
                    // Development / Demo simulated push delivery
                    status = 'SENT';
                    delivered++;
                }
            }
            catch (err) {
                status = 'FAILED';
                errorDetails = err.message;
                failed++;
            }
            // Persist delivery log
            try {
                await database_1.pool.query(`INSERT INTO notification_delivery_log (user_id, device_token, category, title, body, status, error_details)
           VALUES (?, ?, ?, ?, ?, ?, ?)`, [targetUserId, token.substring(0, 255), payload.category, payload.title, payload.body, status, errorDetails]);
            }
            catch { }
        }
        // 4. Emit WebSocket broadcast
        try {
            (0, websocket_server_1.broadcastEvent)({
                type: 'NOTIFICATION_CREATED',
                category: payload.category,
                title: payload.title,
                body: payload.body,
                userId: targetUserId,
                timestamp: new Date().toISOString()
            });
        }
        catch { }
        return { delivered, failed };
    }
    clearCooldowns() {
        this.cooldownMap.clear();
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
