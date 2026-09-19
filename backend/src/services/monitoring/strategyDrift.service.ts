import { pool } from '../../config/database';
import { DriftClassification, StrategyDriftMetric } from '../../models/Monitoring';
import { backtestingService } from '../backtesting.service';

export class StrategyDriftService {
  private inMemoryMetrics: Map<string, StrategyDriftMetric> = new Map();

  // Configurable thresholds for performance degradation
  private readonly WATCH_THRESHOLD = 5.0; // 5%
  private readonly SIGNIFICANT_THRESHOLD = 10.0; // 10%
  private readonly CRITICAL_THRESHOLD = 20.0; // 20%

  /**
   * Calculates strategy drift comparing historical backtest baseline to recent paper trading results.
   */
  async calculateDrift(params: {
    strategy: string;
    asset: string;
    timeframe: string;
    paperTrades?: { pnl: number; amount: number; result: 'WIN' | 'LOSS' }[];
    paperWinRate?: number;
    backtestWinRate?: number;
  }): Promise<StrategyDriftMetric> {
    const key = `${params.strategy}_${params.asset}_${params.timeframe}`;

    // 1. Run historical backtest as baseline benchmark
    const bt = await backtestingService.runBacktest({
      asset: params.asset,
      timeframe: params.timeframe,
      strategy: params.strategy,
      candleCount: 100,
      initialBalance: 10000.0
    });

    const backtestWinRate = params.backtestWinRate !== undefined
      ? (params.backtestWinRate <= 1.0 ? params.backtestWinRate * 100 : params.backtestWinRate)
      : bt.winRate;
    const backtestProfitFactor = bt.profitFactor;
    const backtestExpectancy = bt.advancedMetrics ? bt.advancedMetrics.expectancy : 0.0;
    const backtestMaxDrawdown = bt.maxDrawdown;

    // 2. Evaluate recent paper trading results
    const sampleSize = params.paperTrades ? params.paperTrades.length : 20;
    let paperWinRate = params.paperWinRate !== undefined
      ? (params.paperWinRate <= 1.0 ? params.paperWinRate * 100 : params.paperWinRate)
      : backtestWinRate;
    let paperProfitFactor = backtestProfitFactor;
    let paperExpectancy = backtestExpectancy;
    let paperMaxDrawdown = backtestMaxDrawdown;

    if (params.paperTrades && params.paperTrades.length > 0) {
      const wins = params.paperTrades.filter(t => t.result === 'WIN').length;
      paperWinRate = Math.round((wins / params.paperTrades.length) * 100 * 100) / 100;

      const grossWins = params.paperTrades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
      const grossLosses = Math.abs(params.paperTrades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
      paperProfitFactor = grossLosses > 0 ? Math.round((grossWins / grossLosses) * 100) / 100 : grossWins > 0 ? 99.0 : 0.0;

      const avgWin = wins > 0 ? grossWins / wins : 0;
      const avgLoss = (sampleSize - wins) > 0 ? grossLosses / (sampleSize - wins) : 0;
      const winRatio = wins / sampleSize;
      const lossRatio = (sampleSize - wins) / sampleSize;
      paperExpectancy = Math.round((winRatio * avgWin - lossRatio * avgLoss) * 100) / 100;
    }

    // 3. Compute drift deviations
    // Drift is measured as degradation: Backtest Win Rate - Paper Win Rate
    const winRateDrift = Math.round((backtestWinRate - paperWinRate) * 100) / 100;
    const profitFactorDrift = Math.round((backtestProfitFactor - paperProfitFactor) * 100) / 100;
    const expectancyDrift = Math.round((backtestExpectancy - paperExpectancy) * 100) / 100;
    const drawdownDrift = Math.round((paperMaxDrawdown - backtestMaxDrawdown) * 100) / 100;

    // 4. Classify drift based on degradation thresholds
    let classification: DriftClassification = 'STABLE';
    let statusMessage = 'Strategy paper execution is performing consistently with historical backtest expectations.';

    if (winRateDrift >= this.CRITICAL_THRESHOLD || (paperProfitFactor < 0.8 && backtestProfitFactor > 1.2)) {
      classification = 'CRITICAL';
      statusMessage = `Critical Strategy Drift: Paper win rate has degraded by ${winRateDrift} percentage points from backtest benchmark.`;
    } else if (winRateDrift >= this.SIGNIFICANT_THRESHOLD) {
      classification = 'SIGNIFICANT';
      statusMessage = `Significant Strategy Drift: Win rate dropped ${winRateDrift} percentage points below backtest. Monitoring elevated.`;
    } else if (winRateDrift >= this.WATCH_THRESHOLD) {
      classification = 'WATCH';
      statusMessage = `Watch: Moderate deviation of ${winRateDrift} percentage points observed between backtest and paper execution.`;
    }

    const metric: StrategyDriftMetric = {
      strategy: params.strategy,
      asset: params.asset,
      timeframe: params.timeframe,
      backtestWinRate,
      paperWinRate,
      winRateDrift,
      expectancyDrift,
      profitFactorDrift,
      drawdownDrift,
      sampleSize,
      classification,
      statusMessage
    };

    this.inMemoryMetrics.set(key, metric);

    try {
      await pool.query(
        `INSERT INTO strategy_drift_metrics 
         (strategy, asset, timeframe, backtest_win_rate, paper_win_rate, win_rate_drift, expectancy_drift, profit_factor_drift, drawdown_drift, sample_size, classification, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          metric.strategy,
          metric.asset,
          metric.timeframe,
          metric.backtestWinRate,
          metric.paperWinRate,
          metric.winRateDrift,
          metric.expectancyDrift,
          metric.profitFactorDrift,
          metric.drawdownDrift,
          metric.sampleSize,
          metric.classification,
          metric.statusMessage
        ]
      );
    } catch {
      // In-memory fallback
    }

    // Phase 7: Adaptive Policy Evaluation & Push Notifications
    if (classification !== 'STABLE') {
      try {
        const { strategyPolicyService } = await import('../strategy/strategyPolicy.service');
        const { notificationService } = await import('../notifications/notification.service');

        await strategyPolicyService.evaluateStrategy({
          strategyId: metric.strategy,
          driftClassification: classification,
          expectancyDropPct: Math.abs(expectancyDrift)
        });

        await notificationService.dispatchNotification({
          category: 'STRATEGY_DRIFT',
          title: `STRATEGY DRIFT: ${metric.strategy}`,
          body: `Strategy ${metric.strategy} classified as ${classification}. Backtest: ${(backtestWinRate * 100).toFixed(0)}%, Paper: ${(paperWinRate * 100).toFixed(0)}%.`,
          metadata: { strategy: metric.strategy, classification, expectancyDrift }
        });
      } catch {}
    }

    return metric;
  }

  /**
   * Retrieves all cached strategy drift metrics.
   */
  async getAllDriftMetrics(): Promise<StrategyDriftMetric[]> {
    return Array.from(this.inMemoryMetrics.values());
  }

  /**
   * Retrieves drift metric for a specific strategy and asset.
   */
  async getDriftMetric(strategy: string, asset: string, timeframe = '5m'): Promise<StrategyDriftMetric | null> {
    const key = `${strategy}_${asset}_${timeframe}`;
    return this.inMemoryMetrics.get(key) || null;
  }
}

export const strategyDriftService = new StrategyDriftService();
