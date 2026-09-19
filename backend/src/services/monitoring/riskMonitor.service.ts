import { pool } from '../../config/database';
import { RiskDashboardState, RiskState } from '../../models/Monitoring';

export class RiskMonitorService {
  private lastSnapshot: RiskDashboardState = {
    dailyPnL: 0.0,
    dailyLossPct: 0.0,
    currentDrawdown: 0.0,
    maxDrawdown: 0.0,
    riskPerTrade: 100.0,
    totalOpenRisk: 0.0,
    portfolioExposure: 0.0,
    positionCount: 0,
    consecutiveLosses: 0,
    volatility: 0.015,
    atr: 0.00065,
    marketRegime: 'RANGING',
    riskUtilization: 0.0,
    riskState: 'NORMAL'
  };

  /**
   * Calculates comprehensive real-time risk dashboard metrics.
   */
  async evaluateRiskState(params: {
    startingBalance: number;
    currentBalance: number;
    peakBalance: number;
    openPositions: { amount: number; stopLossDistancePct?: number }[];
    consecutiveLosses: number;
    dailyPnL: number;
    currentAtr?: number;
    marketRegime?: string;
  }): Promise<RiskDashboardState> {
    const startBal = Math.max(1, params.startingBalance);
    const currBal = params.currentBalance;
    const peakBal = Math.max(startBal, params.peakBalance);

    const dailyLossAmount = Math.max(0, -params.dailyPnL);
    const dailyLossPct = Math.round((dailyLossAmount / startBal) * 100 * 100) / 100;

    const currentDrawdown = peakBal > 0
      ? Math.round(((peakBal - currBal) / peakBal) * 100 * 100) / 100
      : 0.0;

    const maxDrawdown = Math.max(this.lastSnapshot.maxDrawdown, currentDrawdown);

    const totalOpenCapital = params.openPositions.reduce((sum, p) => sum + p.amount, 0);
    const portfolioExposure = Math.round((totalOpenCapital / currBal) * 100 * 100) / 100;

    const totalOpenRisk = params.openPositions.reduce(
      (sum, p) => sum + p.amount * (p.stopLossDistancePct || 0.01),
      0
    );

    // Risk utilization is the ratio of daily loss to daily loss limit (5% max)
    const maxDailyAllowed = startBal * 0.05;
    const riskUtilization = Math.min(100, Math.round((dailyLossAmount / maxDailyAllowed) * 100 * 100) / 100);

    // Determine Risk State
    let riskState: RiskState = 'NORMAL';
    if (dailyLossPct >= 5.0 || currentDrawdown >= 10.0 || riskUtilization >= 100) {
      riskState = 'LIMIT_REACHED';
    } else if (dailyLossPct >= 3.5 || currentDrawdown >= 7.0 || params.consecutiveLosses >= 3) {
      riskState = 'HIGH';
    } else if (dailyLossPct >= 2.0 || currentDrawdown >= 4.0 || portfolioExposure > 50) {
      riskState = 'ELEVATED';
    }

    const state: RiskDashboardState = {
      dailyPnL: Math.round(params.dailyPnL * 100) / 100,
      dailyLossPct,
      currentDrawdown: Math.max(0, currentDrawdown),
      maxDrawdown: Math.max(0, maxDrawdown),
      riskPerTrade: Math.round(currBal * 0.01 * 100) / 100, // 1% default
      totalOpenRisk: Math.round(totalOpenRisk * 100) / 100,
      portfolioExposure,
      positionCount: params.openPositions.length,
      consecutiveLosses: params.consecutiveLosses,
      volatility: 0.012,
      atr: params.currentAtr || 0.00065,
      marketRegime: params.marketRegime || 'RANGING',
      riskUtilization,
      riskState
    };

    this.lastSnapshot = state;

    try {
      await pool.query(
        `INSERT INTO risk_snapshots 
         (daily_pnl, daily_loss_pct, current_drawdown, max_drawdown, risk_utilization, open_risk, portfolio_exposure, position_count, consecutive_losses, risk_state)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          state.dailyPnL,
          state.dailyLossPct,
          state.currentDrawdown,
          state.maxDrawdown,
          state.riskUtilization,
          state.totalOpenRisk,
          state.portfolioExposure,
          state.positionCount,
          state.consecutiveLosses,
          state.riskState
        ]
      );
    } catch {
      // In-memory fallback
    }

    return state;
  }

  /**
   * Logs an exceptional risk event.
   */
  async logRiskEvent(event: {
    eventType: string;
    severity: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
    details: string;
    currentDrawdown?: number;
    currentDailyLoss?: number;
    exposure?: number;
  }): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO risk_events (event_type, severity, details, current_drawdown, current_daily_loss, exposure)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          event.eventType,
          event.severity,
          event.details,
          event.currentDrawdown || this.lastSnapshot.currentDrawdown,
          event.currentDailyLoss || Math.max(0, -this.lastSnapshot.dailyPnL),
          event.exposure || this.lastSnapshot.portfolioExposure
        ]
      );

      // Phase 7 Push notification for critical risk alerts
      if (event.severity === 'HIGH' || event.severity === 'CRITICAL' || event.eventType.includes('LIMIT')) {
        const { notificationService } = await import('../notifications/notification.service');
        await notificationService.dispatchNotification({
          category: 'CRITICAL_RISK',
          title: `PAPER RISK ALERT: ${event.eventType}`,
          body: `${event.details}. Paper trades restricted.`,
          metadata: { eventType: event.eventType, severity: event.severity }
        });
      }
    } catch {
      // In-memory fallback
    }
  }

  /**
   * Retrieves current risk dashboard state.
   */
  getLatestState(): RiskDashboardState {
    return { ...this.lastSnapshot };
  }
}

export const riskMonitorService = new RiskMonitorService();
