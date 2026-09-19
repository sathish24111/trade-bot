"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.positionSizingService = exports.PositionSizingService = exports.RISK_PROFILES = void 0;
exports.RISK_PROFILES = {
    CONSERVATIVE: {
        name: 'CONSERVATIVE',
        riskPerTradePercent: 0.5,
        maxDailyLossPercent: 2.0,
        maxDrawdownLimitPercent: 5.0,
        maxConcurrentTrades: 1,
        description: 'Capital preservation focus: 0.5% risk per trade, strict 2% daily loss limit'
    },
    BALANCED: {
        name: 'BALANCED',
        riskPerTradePercent: 1.0,
        maxDailyLossPercent: 3.0,
        maxDrawdownLimitPercent: 10.0,
        maxConcurrentTrades: 1,
        description: 'Standard systematic risk: 1.0% risk per trade, 3% daily loss limit'
    },
    AGGRESSIVE: {
        name: 'AGGRESSIVE',
        riskPerTradePercent: 2.0,
        maxDailyLossPercent: 5.0,
        maxDrawdownLimitPercent: 15.0,
        maxConcurrentTrades: 1,
        description: 'Growth focus: 2.0% risk per trade, 5% daily loss limit'
    }
};
class PositionSizingService {
    /**
     * Returns list of supported risk profiles.
     */
    getRiskProfiles() {
        return Object.values(exports.RISK_PROFILES);
    }
    /**
     * Retrieves profile by name, default to BALANCED.
     */
    getRiskProfile(name) {
        const key = name.toUpperCase();
        return exports.RISK_PROFILES[key] || exports.RISK_PROFILES.BALANCED;
    }
    /**
     * Calculates simulated paper position size based on risk profile and stop loss distance.
     */
    calculatePositionSize(profileName, accountBalance, entryPrice, stopLossPrice) {
        const profile = this.getRiskProfile(profileName);
        const balance = accountBalance > 0 ? accountBalance : 10000;
        const riskAmount = Number((balance * (profile.riskPerTradePercent / 100)).toFixed(2));
        const stopLossDistance = Math.abs(entryPrice - stopLossPrice);
        if (stopLossDistance <= 0 || entryPrice <= 0) {
            return {
                riskProfile: profile,
                accountBalance: balance,
                entryPrice,
                stopLossPrice,
                riskAmount,
                stopLossDistance: 0,
                stopLossPercent: 0,
                suggestedPositionSize: 0,
                mode: 'PAPER'
            };
        }
        const stopLossPercent = Number(((stopLossDistance / entryPrice) * 100).toFixed(2));
        // Size = Risk Amount / Stop Loss Distance (units of asset)
        const rawUnits = riskAmount / stopLossDistance;
        // Safety guardrail: cap position nominal value to demo account balance (1x leverage for paper simulation)
        const maxUnits = balance / entryPrice;
        const finalUnits = Math.min(rawUnits, maxUnits);
        return {
            riskProfile: profile,
            accountBalance: balance,
            entryPrice,
            stopLossPrice,
            riskAmount,
            stopLossDistance: Number(stopLossDistance.toFixed(5)),
            stopLossPercent,
            suggestedPositionSize: Number(finalUnits.toFixed(4)),
            mode: 'PAPER'
        };
    }
}
exports.PositionSizingService = PositionSizingService;
exports.positionSizingService = new PositionSizingService();
