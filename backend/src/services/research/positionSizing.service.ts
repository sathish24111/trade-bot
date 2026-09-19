import { RiskProfile, PositionSizingCalculation } from '../../models/Research';

export const RISK_PROFILES: Record<string, RiskProfile> = {
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

export class PositionSizingService {
  /**
   * Returns list of supported risk profiles.
   */
  getRiskProfiles(): RiskProfile[] {
    return Object.values(RISK_PROFILES);
  }

  /**
   * Retrieves profile by name, default to BALANCED.
   */
  getRiskProfile(name: string): RiskProfile {
    const key = name.toUpperCase();
    return RISK_PROFILES[key] || RISK_PROFILES.BALANCED;
  }

  /**
   * Calculates simulated paper position size based on risk profile and stop loss distance.
   */
  calculatePositionSize(
    profileName: string,
    accountBalance: number,
    entryPrice: number,
    stopLossPrice: number
  ): PositionSizingCalculation {
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

export const positionSizingService = new PositionSizingService();
