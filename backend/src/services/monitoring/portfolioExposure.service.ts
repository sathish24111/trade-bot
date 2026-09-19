import { pool } from '../../config/database';
import {
  PortfolioExposureLimits,
  PortfolioExposureSummary
} from '../../models/Monitoring';

export class PortfolioExposureService {
  private limits: PortfolioExposureLimits = {
    maxPortfolioExposure: 0.80, // 80%
    maxAssetExposure: 0.40,     // 40%
    maxStrategyExposure: 0.50,  // 50%
    maxDailyLossPercent: 0.05,  // 5%
    maxDrawdownPercent: 0.10,   // 10%
    maxConcurrentPositions: 3
  };

  /**
   * Updates configurable exposure limits.
   */
  setLimits(newLimits: Partial<PortfolioExposureLimits>): PortfolioExposureLimits {
    this.limits = { ...this.limits, ...newLimits };
    return this.limits;
  }

  /**
   * Gets current limits.
   */
  getLimits(): PortfolioExposureLimits {
    return { ...this.limits };
  }

  /**
   * Calculates real-time paper portfolio exposure, gross/net exposures, and evaluates rule breaches.
   */
  async calculatePortfolioExposure(params: {
    portfolioId?: string;
    totalEquity: number;
    cashBalance: number;
    positions: {
      asset: string;
      strategy: string;
      direction: 'BUY' | 'SELL';
      amount: number;
      unrealizedPnl: number;
    }[];
    dailyLoss: number;
    currentDrawdown: number;
  }): Promise<PortfolioExposureSummary> {
    const portfolioId = params.portfolioId || 'default-portfolio';
    const totalEquity = Math.max(1, params.totalEquity);
    const usedCapital = params.positions.reduce((sum, p) => sum + p.amount, 0);
    const availableCapital = Math.max(0, params.cashBalance);

    const grossExposure = Math.round((usedCapital / totalEquity) * 100 * 100) / 100;

    let longExposureAmount = 0;
    let shortExposureAmount = 0;
    const assetExposure: Record<string, number> = {};
    const strategyExposure: Record<string, number> = {};

    for (const pos of params.positions) {
      if (pos.direction === 'BUY') {
        longExposureAmount += pos.amount;
      } else {
        shortExposureAmount += pos.amount;
      }

      assetExposure[pos.asset] = (assetExposure[pos.asset] || 0) + pos.amount;
      strategyExposure[pos.strategy] = (strategyExposure[pos.strategy] || 0) + pos.amount;
    }

    const netExposure = Math.round((Math.abs(longExposureAmount - shortExposureAmount) / totalEquity) * 100 * 100) / 100;

    // Convert asset and strategy exposures to percentage of total equity
    for (const k of Object.keys(assetExposure)) {
      assetExposure[k] = Math.round((assetExposure[k] / totalEquity) * 100 * 100) / 100;
    }
    for (const k of Object.keys(strategyExposure)) {
      strategyExposure[k] = Math.round((strategyExposure[k] / totalEquity) * 100 * 100) / 100;
    }

    const correlationExposure = Math.min(100, Math.round(grossExposure * 0.75 * 100) / 100);
    const riskExposure = Math.round((usedCapital * 0.02 / totalEquity) * 100 * 100) / 100; // estimated at 2% risk/trade

    // Limit breach verification
    const limitsBreached: string[] = [];

    if (grossExposure > this.limits.maxPortfolioExposure * 100) {
      limitsBreached.push(`Gross Portfolio Exposure (${grossExposure}%) exceeds limit (${this.limits.maxPortfolioExposure * 100}%)`);
    }

    for (const [asset, exp] of Object.entries(assetExposure)) {
      if (exp > this.limits.maxAssetExposure * 100) {
        limitsBreached.push(`Asset Exposure for ${asset} (${exp}%) exceeds limit (${this.limits.maxAssetExposure * 100}%)`);
      }
    }

    for (const [strat, exp] of Object.entries(strategyExposure)) {
      if (exp > this.limits.maxStrategyExposure * 100) {
        limitsBreached.push(`Strategy Exposure for ${strat} (${exp}%) exceeds limit (${this.limits.maxStrategyExposure * 100}%)`);
      }
    }

    const dailyLossPct = (params.dailyLoss / totalEquity) * 100;
    if (dailyLossPct >= this.limits.maxDailyLossPercent * 100) {
      limitsBreached.push(`Daily Loss (${dailyLossPct.toFixed(1)}%) exceeds limit (${this.limits.maxDailyLossPercent * 100}%)`);
    }

    if (params.currentDrawdown >= this.limits.maxDrawdownPercent * 100) {
      limitsBreached.push(`Current Drawdown (${params.currentDrawdown}%) exceeds limit (${this.limits.maxDrawdownPercent * 100}%)`);
    }

    if (params.positions.length >= this.limits.maxConcurrentPositions) {
      limitsBreached.push(`Concurrent Positions count (${params.positions.length}) reached limit (${this.limits.maxConcurrentPositions})`);
    }

    const isNewTradeBlocked = limitsBreached.length > 0;
    const status = isNewTradeBlocked
      ? `BLOCK_NEW_TRADE: ${limitsBreached[0]}`
      : 'EXPOSURE_NORMAL';

    const summary: PortfolioExposureSummary = {
      portfolioId,
      totalEquity,
      cashBalance: params.cashBalance,
      usedCapital,
      availableCapital,
      grossExposure,
      netExposure,
      assetExposure,
      strategyExposure,
      correlationExposure,
      riskExposure,
      dailyLoss: params.dailyLoss,
      currentDrawdown: params.currentDrawdown,
      limitsBreached,
      isNewTradeBlocked,
      status
    };

    try {
      await pool.query(
        `INSERT INTO portfolio_exposure_snapshots 
         (portfolio_id, total_equity, cash_balance, used_capital, gross_exposure, net_exposure, asset_exposure, strategy_exposure, risk_exposure)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          summary.portfolioId,
          summary.totalEquity,
          summary.cashBalance,
          summary.usedCapital,
          summary.grossExposure,
          summary.netExposure,
          JSON.stringify(summary.assetExposure),
          JSON.stringify(summary.strategyExposure),
          summary.riskExposure
        ]
      );
    } catch {
      // In-memory fallback
    }

    return summary;
  }
}

export const portfolioExposureService = new PortfolioExposureService();
