import { RiskLevel } from '../models/TradingSession';

export interface RiskCheckResult {
  allowed: boolean;
  reason?: string;
  isDailyLossExceeded?: boolean;
}

export class RiskService {
  static readonly MAX_DAILY_LOSS_PERCENT = 0.05; // 5%
  static readonly MAX_CONCURRENT_TRADES = 1;

  static getRiskPercent(riskLevel: RiskLevel): number {
    switch (riskLevel) {
      case 'LOW':
        return 0.005; // 0.5%
      case 'MEDIUM':
        return 0.01;  // 1.0%
      case 'HIGH':
        return 0.02;  // 2.0%
      default:
        return 0.005;
    }
  }

  calculateTradeAmount(investmentAmount: number, riskLevel: RiskLevel): number {
    const riskPct = RiskService.getRiskPercent(riskLevel);
    // Calculated per trade risk, min ₹10, max ₹250 for realistic demo
    const calculated = investmentAmount * riskPct * 10;
    return Math.max(10, Math.min(250, Math.round(calculated)));
  }

  checkRiskRules(
    startingBalance: number,
    currentPnL: number,
    activeTradesCount: number
  ): RiskCheckResult {
    // 1. Check max daily loss limit (5% of starting balance)
    const maxDailyLoss = startingBalance * RiskService.MAX_DAILY_LOSS_PERCENT;
    if (currentPnL <= -maxDailyLoss) {
      return {
        allowed: false,
        reason: `Demo daily loss limit reached (-₹${maxDailyLoss.toFixed(2)}). Trading session stopped.`,
        isDailyLossExceeded: true
      };
    }

    // 2. Check max concurrent trades
    if (activeTradesCount >= RiskService.MAX_CONCURRENT_TRADES) {
      return {
        allowed: false,
        reason: 'Maximum concurrent demo trades limit reached (1 trade max).'
      };
    }

    return { allowed: true };
  }
}

export const riskService = new RiskService();
