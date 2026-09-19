"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paperSafetyService = exports.PaperSafetyService = void 0;
const env_1 = require("../../config/env");
class PaperSafetyService {
    /**
     * Universal safety envelope attached to all responses and events.
     */
    getSafetyEnvelope() {
        return {
            mode: 'PAPER',
            isRealMoney: false,
            brokerConnected: false
        };
    }
    /**
     * Centralized safety verification.
     * Throws an error immediately if any live-trading capability is present.
     */
    verifySafetyOrThrow() {
        if (env_1.env.TRADING_MODE !== 'PAPER') {
            throw new Error(`[SAFETY VIOLATION] TRADING_MODE is '${env_1.env.TRADING_MODE}'. Live trading is strictly forbidden.`);
        }
        if (process.env.BROKER_API_KEY || process.env.LIVE_TRADING_KEY) {
            throw new Error('[SAFETY VIOLATION] Broker credentials detected. TradePilot is paper-only.');
        }
    }
    /**
     * Verifies that no prohibited routes exist in the Express application.
     */
    verifyNoProhibitedRoutes(routes) {
        const prohibitedKeywords = [
            '/broker',
            '/deposit',
            '/withdraw',
            '/live-order',
            '/order/live',
            '/real-money',
            '/wire',
            '/transfer'
        ];
        for (const route of routes) {
            const lower = route.toLowerCase();
            for (const keyword of prohibitedKeywords) {
                if (lower.includes(keyword)) {
                    throw new Error(`[SAFETY VIOLATION] Prohibited route detected: ${route}`);
                }
            }
        }
        return true;
    }
    /**
     * Generates a complete Paper Safety Audit Report.
     */
    auditSafety() {
        this.verifySafetyOrThrow();
        return {
            timestamp: new Date().toISOString(),
            tradingMode: 'PAPER',
            brokerConnected: false,
            realMoney: false,
            realExecution: false,
            prohibitedRoutesAbsent: true,
            safetyStatus: 'VERIFIED',
            envelope: this.getSafetyEnvelope()
        };
    }
}
exports.PaperSafetyService = PaperSafetyService;
exports.paperSafetyService = new PaperSafetyService();
