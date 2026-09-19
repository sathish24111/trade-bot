import { randomUUID } from 'crypto';
import { pool } from '../../config/database';
import { Candle } from '../../models/MarketData';
import {
  WalkForwardMethod,
  WalkForwardRunResult,
  WalkForwardWindowResult
} from '../../models/Research';
import { backtestingService, BacktestEquityPoint, BacktestTrade } from '../backtesting.service';
import { marketService } from '../market.service';
import { StrategyParameters } from '../strategy.service';
import { metricsService } from './metrics.service';
import { optimizationService } from './optimization.service';

export interface WalkForwardConfig {
  userId: number;
  asset: string;
  timeframe?: string;
  strategy: string;
  parameterRanges: Record<string, number[]>;
  trainCandles?: number; // e.g. 50
  testCandles?: number;  // e.g. 20
  stepCandles?: number;  // e.g. 20
  initialBalance?: number;
  tradeAmount?: number;
  walkForwardMethod?: WalkForwardMethod;
  minWindowsRequired?: number;
}

const WF_DISCLAIMER =
  'Walk-forward analysis tests optimized parameters strictly on unseen rolling future periods. This demonstrates historical stability under regime shifts and does NOT guarantee profit.';

export class WalkForwardService {
  /**
   * Runs rolling or anchored window walk-forward validation with zero look-ahead bias.
   */
  async runWalkForward(config: WalkForwardConfig): Promise<WalkForwardRunResult> {
    const {
      userId,
      asset,
      timeframe = '5m',
      strategy,
      parameterRanges,
      trainCandles = 50,
      testCandles = 20,
      stepCandles = 20,
      initialBalance = 10000,
      tradeAmount = 100,
      walkForwardMethod = 'ROLLING',
      minWindowsRequired = 3
    } = config;

    // 1. Fetch & clean candles
    let candles: Candle[] = await marketService.getCandles(asset, timeframe, 200);
    candles = backtestingService.validateAndCleanCandles(candles);

    const minRequired = trainCandles + testCandles;
    if (candles.length < minRequired) {
      throw new Error(
        `Insufficient candles for walk-forward testing. Available: ${candles.length}, Required at least: ${minRequired}`
      );
    }

    // Generate combinations (cap at 30 per window to keep CPU fast)
    let combinations = optimizationService.generateCombinations(parameterRanges);
    if (combinations.length > 30) {
      combinations = combinations.slice(0, 30);
    }
    if (combinations.length === 0) {
      combinations = [{}];
    }

    const windows: WalkForwardWindowResult[] = [];
    const allOosTrades: BacktestTrade[] = [];
    let currentStartIndex = 0;
    let windowIdx = 1;

    // 2. Rolling/Anchored window loop
    while (currentStartIndex + trainCandles + testCandles <= candles.length) {
      const trainStart = walkForwardMethod === 'ANCHORED' ? 0 : currentStartIndex;
      const trainEnd = currentStartIndex + trainCandles;
      const testStart = trainEnd;
      const testEnd = testStart + testCandles;

      const trainSlice = candles.slice(trainStart, trainEnd);
      const testSlice = candles.slice(testStart, testEnd);

      // In-Sample Optimization: strictly trainSlice ONLY
      let bestParams: StrategyParameters = combinations[0];
      let bestScore = -Infinity;
      let bestInSampleMetrics = metricsService.calculateMetrics([], [], initialBalance);

      for (const params of combinations) {
        const isBacktest = await backtestingService.runBacktest({
          userId,
          asset,
          timeframe,
          strategy,
          candles: trainSlice,
          initialBalance,
          tradeAmount,
          parameters: params
        }, false);

        const isMetrics = metricsService.calculateMetrics(isBacktest.trades, isBacktest.equityCurve, initialBalance);
        const score = isMetrics.sharpeRatio ?? isMetrics.netPnl;

        if (score > bestScore) {
          bestScore = score;
          bestParams = params;
          bestInSampleMetrics = isMetrics;
        }
      }

      // Out-Of-Sample Forward Testing: strictly testSlice with winning parameters
      const oosBacktest = await backtestingService.runBacktest({
        userId,
        asset,
        timeframe,
        strategy,
        candles: testSlice,
        initialBalance,
        tradeAmount,
        parameters: bestParams
      }, false);

      const oosMetrics = metricsService.calculateMetrics(oosBacktest.trades, oosBacktest.equityCurve, initialBalance);

      // Collect OOS trades for cumulative equity curve
      allOosTrades.push(...oosBacktest.trades);

      const isRet = bestInSampleMetrics.returnPercent;
      const oosRet = oosMetrics.returnPercent;
      const windowWfe = isRet !== 0 ? Number(((oosRet / Math.abs(isRet)) * 100).toFixed(2)) : 0;

      windows.push({
        windowIndex: windowIdx,
        trainStartDate: new Date(trainSlice[0].timestamp).toISOString(),
        trainEndDate: new Date(trainSlice[trainSlice.length - 1].timestamp).toISOString(),
        testStartDate: new Date(testSlice[0].timestamp).toISOString(),
        testEndDate: new Date(testSlice[testSlice.length - 1].timestamp).toISOString(),
        bestParameters: bestParams,
        inSampleMetrics: bestInSampleMetrics,
        outOfSampleMetrics: oosMetrics,
        windowWfe
      });

      currentStartIndex += stepCandles;
      windowIdx++;
    }

    if (windows.length === 0) {
      throw new Error('No walk-forward windows could be constructed with the specified parameters.');
    }

    // 3. Assemble Cumulative Out-of-Sample Performance & Equity Curve
    let cumBalance = initialBalance;
    let peakEquity = initialBalance;
    const cumulativeEquityCurve: BacktestEquityPoint[] = [
      {
        timestamp: windows[0].testStartDate,
        balance: initialBalance,
        equity: initialBalance,
        drawdownPercent: 0
      }
    ];

    for (const trade of allOosTrades) {
      cumBalance = Number((cumBalance + trade.pnl).toFixed(2));
      if (cumBalance > peakEquity) peakEquity = cumBalance;
      const dd = peakEquity > 0 ? ((peakEquity - cumBalance) / peakEquity) * 100 : 0;

      cumulativeEquityCurve.push({
        timestamp: trade.timestamp,
        balance: cumBalance,
        equity: cumBalance,
        drawdownPercent: Number(dd.toFixed(2))
      });
    }

    const cumulativeOosPnl = Number((cumBalance - initialBalance).toFixed(2));
    const cumulativeOosReturnPercent = initialBalance > 0 ? Number(((cumulativeOosPnl / initialBalance) * 100).toFixed(2)) : 0;

    // Overall Walk-Forward Efficiency
    const avgIsReturn = windows.reduce((sum, w) => sum + w.inSampleMetrics.returnPercent, 0) / windows.length;
    const avgOosReturn = windows.reduce((sum, w) => sum + w.outOfSampleMetrics.returnPercent, 0) / windows.length;
    const overallWfe = avgIsReturn !== 0 ? Number(((avgOosReturn / Math.abs(avgIsReturn)) * 100).toFixed(2)) : 0;

    let robustnessSummary: string;
    if (overallWfe >= 60) {
      robustnessSummary = `High Robustness (WFE: ${overallWfe}%): Out-of-sample performance preserved over 60% of in-sample optimization.`;
    } else if (overallWfe >= 30) {
      robustnessSummary = `Moderate Robustness (WFE: ${overallWfe}%): Strategy degrades moderately in unseen forward windows.`;
    } else {
      robustnessSummary = `Fragile (WFE: ${overallWfe}%): Severe degradation out-of-sample. Strategy may be overfit to historical noise.`;
    }

    const runId = randomUUID();
    const windowGuardWarning =
      windows.length < minWindowsRequired
        ? `⚠ Insufficient Walk-Forward Windows: Strategy produced ${windows.length} window(s); minimum ${minWindowsRequired} required for statistical robustness.`
        : undefined;

    const result: WalkForwardRunResult = {
      id: runId,
      userId,
      asset,
      timeframe,
      strategy,
      trainCandles,
      testCandles,
      stepCandles,
      windowsCount: windows.length,
      windows,
      overallWfe,
      cumulativeOosPnl,
      cumulativeOosReturnPercent,
      cumulativeEquityCurve,
      robustnessSummary,
      walkForwardMethod,
      windowGuardWarning,
      disclaimer: WF_DISCLAIMER,
      mode: 'PAPER',
      isRealMoney: false,
      brokerConnected: false,
      historical: true,
      isPrediction: false
    };

    // 4. Asynchronously persist walk-forward run to MySQL
    this.persistWalkForwardRun(result).catch(err => {
      console.error('Failed to persist walk-forward run:', err.message);
    });

    return result;
  }

  /**
   * Persists walk-forward run and window records to MySQL.
   */
  private async persistWalkForwardRun(run: WalkForwardRunResult): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `INSERT INTO walk_forward_runs (
          id, user_id, strategy, asset, timeframe,
          train_candles, test_candles, step_candles, total_windows,
          walk_forward_efficiency, cumulative_oos_pnl, cumulative_oos_return_pct
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          run.id,
          run.userId,
          run.strategy,
          run.asset,
          run.timeframe,
          run.trainCandles,
          run.testCandles,
          run.stepCandles,
          run.windowsCount,
          run.overallWfe,
          run.cumulativeOosPnl,
          run.cumulativeOosReturnPercent
        ]
      );

      for (const w of run.windows) {
        await connection.query(
          `INSERT INTO walk_forward_results (
            id, run_id, window_index, train_start, train_end,
            test_start, test_end, best_parameters, in_sample_return,
            out_sample_return, out_sample_pnl, out_sample_win_rate,
            out_sample_drawdown, window_wfe
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            randomUUID(),
            run.id,
            w.windowIndex,
            w.trainStartDate,
            w.trainEndDate,
            w.testStartDate,
            w.testEndDate,
            JSON.stringify(w.bestParameters),
            w.inSampleMetrics.returnPercent,
            w.outOfSampleMetrics.returnPercent,
            w.outOfSampleMetrics.netPnl,
            w.outOfSampleMetrics.winRate,
            w.outOfSampleMetrics.maxDrawdownPercent,
            w.windowWfe
          ]
        );
      }

      await connection.commit();
    } catch (err: any) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}

export const walkForwardService = new WalkForwardService();
