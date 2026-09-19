"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.strategyPolicyService = exports.StrategyPolicyService = void 0;
const database_1 = require("../../config/database");
const websocket_server_1 = require("../../websocket/websocket.server");
const alert_service_1 = require("../monitoring/alert.service");
const notification_service_1 = require("../notifications/notification.service");
class StrategyPolicyService {
    policyCache = new Map();
    pauseTimestamps = new Map();
    constructor() {
        this.initDefaultPolicies();
    }
    initDefaultPolicies() {
        const defaultStrategies = ['EMA_RSI', 'MACD', 'BOLLINGER_BANDS', 'MULTI_INDICATOR'];
        for (const s of defaultStrategies) {
            this.policyCache.set(s, {
                strategyId: s,
                version: 1,
                driftThresholds: {
                    watchExpDropPct: 0.05,
                    significantExpDropPct: 0.15,
                    criticalExpDropPct: 0.25
                },
                riskThresholds: {
                    maxDailyLossPct: 3.0,
                    maxDrawdownPct: 5.0,
                    maxConsecutiveLosses: 4
                },
                throttleRules: {
                    watchRiskMultiplier: 0.75,
                    significantRiskMultiplier: 0.50,
                    cooldownSeconds: 300,
                    maxSignalsPerHour: 10
                },
                pauseRules: {
                    autoPauseOnCriticalDrift: true,
                    autoPauseOnCriticalRisk: true
                },
                recoveryRules: {
                    minObservationMinutes: 15,
                    requireHealthyMarketHealth: true,
                    autoResume: false
                },
                enabled: true
            });
        }
    }
    async getPolicy(strategyId) {
        const cached = this.policyCache.get(strategyId);
        if (cached)
            return cached;
        try {
            const [rows] = await database_1.pool.query(`SELECT config, version FROM strategy_policy_versions WHERE strategy_id = ? ORDER BY version DESC LIMIT 1`, [strategyId]);
            if (rows.length > 0) {
                const parsed = typeof rows[0].config === 'string' ? JSON.parse(rows[0].config) : rows[0].config;
                this.policyCache.set(strategyId, parsed);
                return parsed;
            }
        }
        catch { }
        // Fallback default
        const fallback = {
            strategyId,
            version: 1,
            driftThresholds: { watchExpDropPct: 0.05, significantExpDropPct: 0.15, criticalExpDropPct: 0.25 },
            riskThresholds: { maxDailyLossPct: 3.0, maxDrawdownPct: 5.0, maxConsecutiveLosses: 4 },
            throttleRules: { watchRiskMultiplier: 0.75, significantRiskMultiplier: 0.50, cooldownSeconds: 300 },
            pauseRules: { autoPauseOnCriticalDrift: true, autoPauseOnCriticalRisk: true },
            recoveryRules: { minObservationMinutes: 15, requireHealthyMarketHealth: true, autoResume: false },
            enabled: true
        };
        this.policyCache.set(strategyId, fallback);
        return fallback;
    }
    async savePolicy(policy, userId = 1) {
        const existing = await this.getPolicy(policy.strategyId);
        const newVersion = (existing.version || 1) + 1;
        const toSave = {
            ...policy,
            version: newVersion
        };
        try {
            await database_1.pool.query(`INSERT INTO strategy_policy_versions (strategy_id, version, config, created_by)
         VALUES (?, ?, ?, ?)`, [toSave.strategyId, newVersion, JSON.stringify(toSave), userId]);
        }
        catch { }
        this.policyCache.set(toSave.strategyId, toSave);
        return toSave;
    }
    /**
     * Evaluates current strategy drift and risk metrics against policy.
     * Returns active throttle risk multiplier and triggers auto-pause if critical.
     */
    async evaluateStrategy(params) {
        const policy = await this.getPolicy(params.strategyId);
        if (!policy.enabled) {
            return { action: 'NORMAL', riskMultiplier: 1.0, reason: 'Policy disabled' };
        }
        // 1. Critical Drift or Critical Risk -> AUTO PAUSE
        const isCriticalDrift = params.driftClassification === 'CRITICAL' ||
            (params.expectancyDropPct !== undefined && params.expectancyDropPct >= policy.driftThresholds.criticalExpDropPct);
        const isCriticalRisk = (params.currentDailyLossPct !== undefined && params.currentDailyLossPct >= policy.riskThresholds.maxDailyLossPct) ||
            (params.currentDrawdownPct !== undefined && params.currentDrawdownPct >= policy.riskThresholds.maxDrawdownPct);
        if ((isCriticalDrift && policy.pauseRules.autoPauseOnCriticalDrift) || (isCriticalRisk && policy.pauseRules.autoPauseOnCriticalRisk)) {
            const reason = isCriticalDrift
                ? `Critical out-of-sample drift detected for strategy ${params.strategyId}`
                : `Critical risk threshold breached for strategy ${params.strategyId}`;
            if (params.currentState !== 'paused' && params.currentState !== 'disabled') {
                await this.autoPauseStrategy(params.strategyId, isCriticalDrift ? 'DRIFT_CRITICAL' : 'RISK_LIMIT_BREACH', reason);
            }
            return { action: 'PAUSE', riskMultiplier: 0.0, reason };
        }
        // 2. Significant Drift -> 50% Throttle
        if (params.driftClassification === 'SIGNIFICANT' ||
            (params.expectancyDropPct !== undefined && params.expectancyDropPct >= policy.driftThresholds.significantExpDropPct)) {
            const multiplier = policy.throttleRules.significantRiskMultiplier;
            (0, websocket_server_1.broadcastEvent)({
                type: 'STRATEGY_THROTTLED',
                strategy: params.strategyId,
                tier: 'SIGNIFICANT',
                riskMultiplier: multiplier,
                timestamp: new Date().toISOString()
            });
            return { action: 'THROTTLE', riskMultiplier: multiplier, reason: 'Significant drift throttle applied (50% risk)' };
        }
        // 3. Watch Drift -> 75% Throttle
        if (params.driftClassification === 'WATCH' ||
            (params.expectancyDropPct !== undefined && params.expectancyDropPct >= policy.driftThresholds.watchExpDropPct)) {
            const multiplier = policy.throttleRules.watchRiskMultiplier;
            (0, websocket_server_1.broadcastEvent)({
                type: 'STRATEGY_THROTTLED',
                strategy: params.strategyId,
                tier: 'WATCH',
                riskMultiplier: multiplier,
                timestamp: new Date().toISOString()
            });
            return { action: 'THROTTLE', riskMultiplier: multiplier, reason: 'Watch drift throttle applied (75% risk)' };
        }
        // 4. Stable -> Normal
        return { action: 'NORMAL', riskMultiplier: 1.0, reason: 'Strategy operating within normal limits' };
    }
    /**
     * Automatically pauses strategy and records audit / adaptation events
     */
    async autoPauseStrategy(strategyId, triggerEvent, reason) {
        this.pauseTimestamps.set(strategyId, Date.now());
        // Update database strategy state
        try {
            await database_1.pool.query(`UPDATE strategies SET enabled = FALSE WHERE id = ?`, [strategyId]);
            // Record adaptation event
            await database_1.pool.query(`INSERT INTO strategy_adaptation_events (strategy_id, previous_state, new_state, trigger_event, reason, automatic, metadata)
         VALUES (?, 'enabled', 'paused', ?, ?, TRUE, ?)`, [strategyId, triggerEvent, reason, JSON.stringify({ pausedAt: new Date().toISOString() })]);
            // Record state change in Phase 6 strategy_state_changes table
            await database_1.pool.query(`INSERT INTO strategy_state_changes (strategy, old_state, new_state, reason, user_id)
         VALUES (?, 'enabled', 'paused', ?, 1)`, [strategyId, `AUTO-POLICY: ${reason}`]);
        }
        catch { }
        // Trigger Alert & Push Notification
        try {
            await alert_service_1.alertService.createAlert({
                type: 'STRATEGY_AUTO_PAUSED',
                severity: 'CRITICAL',
                strategy: strategyId,
                message: `Paper strategy ${strategyId} automatically paused: ${reason}`,
                metadata: { strategyId, triggerEvent, reason, automatic: true }
            });
            await notification_service_1.notificationService.dispatchNotification({
                category: triggerEvent.includes('RISK') ? 'CRITICAL_RISK' : 'STRATEGY_DRIFT',
                title: `PAPER STRATEGY PAUSED: ${strategyId}`,
                body: `Automatic protection triggered: ${reason}. Paper execution halted.`,
                metadata: { strategyId, triggerEvent }
            });
        }
        catch { }
        // Emit WebSocket broadcast
        try {
            (0, websocket_server_1.broadcastEvent)({
                type: 'STRATEGY_AUTO_PAUSED',
                strategy: strategyId,
                trigger: triggerEvent,
                reason,
                mode: 'PAPER',
                timestamp: new Date().toISOString()
            });
        }
        catch { }
    }
    /**
     * Attempts recovery of a paused strategy
     */
    async attemptRecovery(strategyId, options = {}) {
        const policy = await this.getPolicy(strategyId);
        const pauseTime = this.pauseTimestamps.get(strategyId) || 0;
        const minutesSincePause = (Date.now() - pauseTime) / (60 * 1000);
        // 1. Observation period check
        if (!options.bypassObservation && !options.manualApproval) {
            if (minutesSincePause < policy.recoveryRules.minObservationMinutes) {
                return {
                    recovered: false,
                    reason: `Minimum observation period not met (${minutesSincePause.toFixed(1)}m / ${policy.recoveryRules.minObservationMinutes}m)`
                };
            }
        }
        // 2. Stability checks
        if (options.currentRiskHealthy === false) {
            return { recovered: false, reason: 'Risk state is not healthy' };
        }
        if (options.currentDriftStable === false) {
            return { recovered: false, reason: 'Strategy drift is still elevated' };
        }
        // Recover: set strategy to enabled
        try {
            await database_1.pool.query(`UPDATE strategies SET enabled = TRUE WHERE id = ?`, [strategyId]);
            await database_1.pool.query(`INSERT INTO strategy_adaptation_events (strategy_id, previous_state, new_state, trigger_event, reason, automatic, metadata)
         VALUES (?, 'paused', 'enabled', 'RECOVERY_CHECK', ?, ?, ?)`, [
                strategyId,
                options.manualApproval ? 'Manual user resume' : 'Automated stability recovery criteria met',
                !options.manualApproval,
                JSON.stringify({ resumedAt: new Date().toISOString() })
            ]);
            await database_1.pool.query(`INSERT INTO strategy_state_changes (strategy, old_state, new_state, reason, user_id)
         VALUES (?, 'paused', 'enabled', ?, 1)`, [strategyId, options.manualApproval ? 'Manual user resume' : 'Automated recovery']);
        }
        catch { }
        this.pauseTimestamps.delete(strategyId);
        // Broadcast recovery event
        try {
            (0, websocket_server_1.broadcastEvent)({
                type: 'STRATEGY_RECOVERY',
                strategy: strategyId,
                reason: options.manualApproval ? 'Manual resume' : 'Automated recovery',
                timestamp: new Date().toISOString()
            });
        }
        catch { }
        return {
            recovered: true,
            reason: options.manualApproval ? 'Manual user resume successful' : 'Strategy successfully recovered to enabled'
        };
    }
    /**
     * Retrieves adaptation audit history
     */
    async getAdaptationHistory(strategyId) {
        try {
            let query = `SELECT id, strategy_id, previous_state, new_state, trigger_event, reason, automatic, metadata, created_at 
                   FROM strategy_adaptation_events`;
            const params = [];
            if (strategyId) {
                query += ` WHERE strategy_id = ?`;
                params.push(strategyId);
            }
            query += ` ORDER BY id DESC LIMIT 50`;
            const [rows] = await database_1.pool.query(query, params);
            return rows.map(r => ({
                id: r.id,
                strategyId: r.strategy_id,
                previousState: r.previous_state,
                newState: r.new_state,
                triggerEvent: r.trigger_event,
                reason: r.reason,
                automatic: Boolean(r.automatic),
                metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata,
                createdAt: new Date(r.created_at).toISOString()
            }));
        }
        catch {
            return [];
        }
    }
}
exports.StrategyPolicyService = StrategyPolicyService;
exports.strategyPolicyService = new StrategyPolicyService();
