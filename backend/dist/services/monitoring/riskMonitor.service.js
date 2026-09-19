"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.riskMonitorService = exports.RiskMonitorService = void 0;
const database_1 = require("../../config/database");
class RiskMonitorService {
    lastSnapshot = {
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
    async evaluateRiskState(params) {
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
        const totalOpenRisk = params.openPositions.reduce((sum, p) => sum + p.amount * (p.stopLossDistancePct || 0.01), 0);
        // Risk utilization is the ratio of daily loss to daily loss limit (5% max)
        const maxDailyAllowed = startBal * 0.05;
        const riskUtilization = Math.min(100, Math.round((dailyLossAmount / maxDailyAllowed) * 100 * 100) / 100);
        // Determine Risk State
        let riskState = 'NORMAL';
        if (dailyLossPct >= 5.0 || currentDrawdown >= 10.0 || riskUtilization >= 100) {
            riskState = 'LIMIT_REACHED';
        }
        else if (dailyLossPct >= 3.5 || currentDrawdown >= 7.0 || params.consecutiveLosses >= 3) {
            riskState = 'HIGH';
        }
        else if (dailyLossPct >= 2.0 || currentDrawdown >= 4.0 || portfolioExposure > 50) {
            riskState = 'ELEVATED';
        }
        const state = {
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
            await database_1.pool.query(`INSERT INTO risk_snapshots 
         (daily_pnl, daily_loss_pct, current_drawdown, max_drawdown, risk_utilization, open_risk, portfolio_exposure, position_count, consecutive_losses, risk_state)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
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
            ]);
        }
        catch {
            // In-memory fallback
        }
        return state;
    }
    /**
     * Logs an exceptional risk event.
     */
    async logRiskEvent(event) {
        try {
            await database_1.pool.query(`INSERT INTO risk_events (event_type, severity, details, current_drawdown, current_daily_loss, exposure)
         VALUES (?, ?, ?, ?, ?, ?)`, [
                event.eventType,
                event.severity,
                event.details,
                event.currentDrawdown || this.lastSnapshot.currentDrawdown,
                event.currentDailyLoss || Math.max(0, -this.lastSnapshot.dailyPnL),
                event.exposure || this.lastSnapshot.portfolioExposure
            ]);
            // Phase 7 Push notification for critical risk alerts
            if (event.severity === 'HIGH' || event.severity === 'CRITICAL' || event.eventType.includes('LIMIT')) {
                const { notificationService } = await Promise.resolve().then(() => __importStar(require('../notifications/notification.service')));
                await notificationService.dispatchNotification({
                    category: 'CRITICAL_RISK',
                    title: `PAPER RISK ALERT: ${event.eventType}`,
                    body: `${event.details}. Paper trades restricted.`,
                    metadata: { eventType: event.eventType, severity: event.severity }
                });
            }
        }
        catch {
            // In-memory fallback
        }
    }
    /**
     * Retrieves current risk dashboard state.
     */
    getLatestState() {
        return { ...this.lastSnapshot };
    }
}
exports.RiskMonitorService = RiskMonitorService;
exports.riskMonitorService = new RiskMonitorService();
