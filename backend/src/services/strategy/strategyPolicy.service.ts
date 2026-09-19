import { pool } from '../../config/database';
import { StrategyPolicyConfig, StrategyAdaptationEvent, StrategyControlAction } from '../../models/Phase7';
import { broadcastEvent } from '../../websocket/websocket.server';
import { alertService } from '../monitoring/alert.service';
import { notificationService } from '../notifications/notification.service';

export class StrategyPolicyService {
  private policyCache: Map<string, StrategyPolicyConfig> = new Map();
  private pauseTimestamps: Map<string, number> = new Map();

  constructor() {
    this.initDefaultPolicies();
  }

  private initDefaultPolicies() {
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

  async getPolicy(strategyId: string): Promise<StrategyPolicyConfig> {
    const cached = this.policyCache.get(strategyId);
    if (cached) return cached;

    try {
      const [rows] = await pool.query<any[]>(
        `SELECT config, version FROM strategy_policy_versions WHERE strategy_id = ? ORDER BY version DESC LIMIT 1`,
        [strategyId]
      );
      if (rows.length > 0) {
        const parsed = typeof rows[0].config === 'string' ? JSON.parse(rows[0].config) : rows[0].config;
        this.policyCache.set(strategyId, parsed);
        return parsed;
      }
    } catch {}

    // Fallback default
    const fallback: StrategyPolicyConfig = {
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

  async savePolicy(policy: StrategyPolicyConfig, userId: number = 1): Promise<StrategyPolicyConfig> {
    const existing = await this.getPolicy(policy.strategyId);
    const newVersion = (existing.version || 1) + 1;
    const toSave: StrategyPolicyConfig = {
      ...policy,
      version: newVersion
    };

    try {
      await pool.query(
        `INSERT INTO strategy_policy_versions (strategy_id, version, config, created_by)
         VALUES (?, ?, ?, ?)`,
        [toSave.strategyId, newVersion, JSON.stringify(toSave), userId]
      );
    } catch {}

    this.policyCache.set(toSave.strategyId, toSave);
    return toSave;
  }

  /**
   * Evaluates current strategy drift and risk metrics against policy.
   * Returns active throttle risk multiplier and triggers auto-pause if critical.
   */
  async evaluateStrategy(params: {
    strategyId: string;
    driftClassification: 'STABLE' | 'WATCH' | 'SIGNIFICANT' | 'CRITICAL';
    expectancyDropPct?: number;
    currentDailyLossPct?: number;
    currentDrawdownPct?: number;
    currentState?: string;
  }): Promise<{ action: StrategyControlAction; riskMultiplier: number; reason: string }> {
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
      broadcastEvent({
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
      broadcastEvent({
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
  async autoPauseStrategy(strategyId: string, triggerEvent: string, reason: string): Promise<void> {
    this.pauseTimestamps.set(strategyId, Date.now());

    // Update database strategy state
    try {
      await pool.query(
        `UPDATE strategies SET enabled = FALSE WHERE id = ?`,
        [strategyId]
      );

      // Record adaptation event
      await pool.query(
        `INSERT INTO strategy_adaptation_events (strategy_id, previous_state, new_state, trigger_event, reason, automatic, metadata)
         VALUES (?, 'enabled', 'paused', ?, ?, TRUE, ?)`,
        [strategyId, triggerEvent, reason, JSON.stringify({ pausedAt: new Date().toISOString() })]
      );

      // Record state change in Phase 6 strategy_state_changes table
      await pool.query(
        `INSERT INTO strategy_state_changes (strategy, old_state, new_state, reason, user_id)
         VALUES (?, 'enabled', 'paused', ?, 1)`,
        [strategyId, `AUTO-POLICY: ${reason}`]
      );
    } catch {}

    // Trigger Alert & Push Notification
    try {
      await alertService.createAlert({
        type: 'STRATEGY_AUTO_PAUSED',
        severity: 'CRITICAL',
        strategy: strategyId,
        message: `Paper strategy ${strategyId} automatically paused: ${reason}`,
        metadata: { strategyId, triggerEvent, reason, automatic: true }
      });

      await notificationService.dispatchNotification({
        category: triggerEvent.includes('RISK') ? 'CRITICAL_RISK' : 'STRATEGY_DRIFT',
        title: `PAPER STRATEGY PAUSED: ${strategyId}`,
        body: `Automatic protection triggered: ${reason}. Paper execution halted.`,
        metadata: { strategyId, triggerEvent }
      });
    } catch {}

    // Emit WebSocket broadcast
    try {
      broadcastEvent({
        type: 'STRATEGY_AUTO_PAUSED',
        strategy: strategyId,
        trigger: triggerEvent,
        reason,
        mode: 'PAPER',
        timestamp: new Date().toISOString()
      });
    } catch {}
  }

  /**
   * Attempts recovery of a paused strategy
   */
  async attemptRecovery(strategyId: string, options: {
    bypassObservation?: boolean;
    manualApproval?: boolean;
    currentRiskHealthy?: boolean;
    currentDriftStable?: boolean;
  } = {}): Promise<{ recovered: boolean; reason: string }> {
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
      await pool.query(
        `UPDATE strategies SET enabled = TRUE WHERE id = ?`,
        [strategyId]
      );

      await pool.query(
        `INSERT INTO strategy_adaptation_events (strategy_id, previous_state, new_state, trigger_event, reason, automatic, metadata)
         VALUES (?, 'paused', 'enabled', 'RECOVERY_CHECK', ?, ?, ?)`,
        [
          strategyId,
          options.manualApproval ? 'Manual user resume' : 'Automated stability recovery criteria met',
          !options.manualApproval,
          JSON.stringify({ resumedAt: new Date().toISOString() })
        ]
      );

      await pool.query(
        `INSERT INTO strategy_state_changes (strategy, old_state, new_state, reason, user_id)
         VALUES (?, 'paused', 'enabled', ?, 1)`,
        [strategyId, options.manualApproval ? 'Manual user resume' : 'Automated recovery']
      );
    } catch {}

    this.pauseTimestamps.delete(strategyId);

    // Broadcast recovery event
    try {
      broadcastEvent({
        type: 'STRATEGY_RECOVERY',
        strategy: strategyId,
        reason: options.manualApproval ? 'Manual resume' : 'Automated recovery',
        timestamp: new Date().toISOString()
      });
    } catch {}

    return {
      recovered: true,
      reason: options.manualApproval ? 'Manual user resume successful' : 'Strategy successfully recovered to enabled'
    };
  }

  /**
   * Retrieves adaptation audit history
   */
  async getAdaptationHistory(strategyId?: string): Promise<StrategyAdaptationEvent[]> {
    try {
      let query = `SELECT id, strategy_id, previous_state, new_state, trigger_event, reason, automatic, metadata, created_at 
                   FROM strategy_adaptation_events`;
      const params: any[] = [];
      if (strategyId) {
        query += ` WHERE strategy_id = ?`;
        params.push(strategyId);
      }
      query += ` ORDER BY id DESC LIMIT 50`;

      const [rows] = await pool.query<any[]>(query, params);
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
    } catch {
      return [];
    }
  }
}

export const strategyPolicyService = new StrategyPolicyService();
