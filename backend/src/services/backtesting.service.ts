import { randomUUID } from 'crypto';
import { pool } from '../config/database';
import { env } from '../config/env';
import { Candle } from '../models/MarketData';
import { strategyEngine, StrategyParameters } from './strategy.service';
import { marketService } from './market.service';
import { auditService } from './audit.service';
import { AdvancedMetrics, RegimePerformance, MarketRegimeType } from '../models/Research';
import { metricsService } from './research/metrics.service';
import { regimeService } from './research/regime.service';

export interface BacktestRequest {
  userId?: number;
  asset: string;
  timeframe?: string;
  strategy: string;
  candles?: Candle[];
  candleCount?: number;
  initialBalance?: number;
  tradeAmount?: number;
  riskPercent?: number;
  spread?: number;
  slippage?: number;
  fee?: number;
  parameters?: StrategyParameters;
}

export interface BacktestTrade {
  id: string;
  asset: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  amount: number;
  pnl: number;
  result: 'WIN' | 'LOSS';
  timestamp: string;
  reason?: string;
}

export interface BacktestEquityPoint {
  timestamp: string;
  balance: number;
  equity: number;
  drawdownPercent: number;
}

export interface BacktestResult {
  id: string;
  userId: number;
  asset: string;
  timeframe: string;
  strategy: string;
  startDate: string;
  endDate: string;
  initialBalance: number;
  finalBalance: number;
  totalPnl: number;
  netPnl: number;
  totalPnlPercent: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  maxDrawdown: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  trades: BacktestTrade[];
  equityCurve: BacktestEquityPoint[];
  advancedMetrics: AdvancedMetrics;
  regimeBreakdown?: RegimePerformance[];
  parameters?: StrategyParameters;
  disclaimer: string;
  mode: 'PAPER';
}

export interface StrategyComparisonItem {
  strategy: string;
  initialBalance: number;
  finalBalance: number;
  totalPnl: number;
  totalPnlPercent: number;
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
}

const BACKTEST_DISCLAIMER =
  'Backtest results are simulated paper trades using historical market data. Past performance is not indicative of future results and does not guarantee profit. Trading involves risk.';

export class BacktestingService {
  /**
   * Validates and cleans candle data ensuring chronological ordering and price sanity.
   */
  validateAndCleanCandles(candles: Candle[]): Candle[] {
    if (!candles || candles.length < 25) {
      throw new Error('Insufficient historical data for backtesting. Minimum 25 candles required.');
    }

    // Sort ascending by timestamp
    const sorted = [...candles].sort((a, b) => a.timestamp - b.timestamp);

    // Filter duplicates and invalid data
    const cleaned: Candle[] = [];
    let lastTs = -1;

    for (const c of sorted) {
      if (c.timestamp === lastTs) continue;
      if (
        isNaN(c.open) || isNaN(c.high) || isNaN(c.low) || isNaN(c.close) ||
        c.high < c.low || c.open < 0 || c.close < 0
      ) {
        continue;
      }
      cleaned.push({
        timestamp: c.timestamp,
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
        volume: c.volume ? Number(c.volume) : 0
      });
      lastTs = c.timestamp;
    }

    if (cleaned.length < 25) {
      throw new Error('Candle dataset contained too many invalid entries. Minimum 25 valid candles required.');
    }

    return cleaned;
  }

  /**
   * Executes backtest with strict look-ahead bias prevention.
   * At candle index i, ONLY candles.slice(0, i + 1) is accessible.
   */
  async runBacktest(req: BacktestRequest, persist: boolean = true): Promise<BacktestResult> {
    const userId = req.userId || 1;
    const asset = req.asset.toUpperCase().replace('-', '/');
    const timeframe = req.timeframe || '5m';
    const strategyName = req.strategy;

    // Retrieve or validate candles
    let candles: Candle[];
    if (req.candles && req.candles.length >= 25) {
      candles = this.validateAndCleanCandles(req.candles);
    } else {
      candles = await marketService.getCandles(asset, timeframe, req.candleCount || 120);
      candles = this.validateAndCleanCandles(candles);
    }

    const initialBalance = req.initialBalance && req.initialBalance > 0 ? req.initialBalance : 10000;
    const tradeAmount = req.tradeAmount && req.tradeAmount > 0 ? req.tradeAmount : 100;
    const spread = req.spread !== undefined ? req.spread : env.BACKTEST_DEFAULT_SPREAD;
    const slippage = req.slippage !== undefined ? req.slippage : env.BACKTEST_DEFAULT_SLIPPAGE;
    const fee = req.fee !== undefined ? req.fee : env.BACKTEST_DEFAULT_FEE;

    let balance = initialBalance;
    let peakEquity = initialBalance;
    let maxDrawdown = 0;

    const trades: BacktestTrade[] = [];
    const equityCurve: BacktestEquityPoint[] = [
      {
        timestamp: new Date(candles[0].timestamp).toISOString(),
        balance: initialBalance,
        equity: initialBalance,
        drawdownPercent: 0
      }
    ];

    interface ActivePosition {
      direction: 'BUY' | 'SELL';
      entryPrice: number;
      entryTime: number;
      candlesHeld: number;
      amount: number;
      tradeId: string;
      reason: string;
    }

    let currentPos: ActivePosition | null = null;

    // Strict sequential loop: at index i, ONLY slice 0..(i+1) is supplied
    for (let i = 21; i < candles.length; i++) {
      const currentCandle = candles[i];
      const historicalSlice = candles.slice(0, i + 1); // Strict look-ahead bias prevention
      const currentPrice = currentCandle.close;

      // 1. Evaluate open position if any
      if (currentPos) {
        currentPos.candlesHeld++;
        let shouldExit = false;
        let exitReason = '';

        const priceChangePct =
          currentPos.direction === 'BUY'
            ? (currentPrice - currentPos.entryPrice) / currentPos.entryPrice
            : (currentPos.entryPrice - currentPrice) / currentPos.entryPrice;

        // Take Profit: +2.0%, Stop Loss: -1.2%, or Max Holding: 10 candles
        if (priceChangePct >= 0.02) {
          shouldExit = true;
          exitReason = 'Take-Profit target achieved (+2.0%)';
        } else if (priceChangePct <= -0.012) {
          shouldExit = true;
          exitReason = 'Stop-Loss limit reached (-1.2%)';
        } else if (currentPos.candlesHeld >= 10) {
          shouldExit = true;
          exitReason = 'Holding period expiration (10 bars)';
        }

        if (shouldExit) {
          const rawExitPrice = currentPrice;
          const finalExitPrice =
            currentPos.direction === 'BUY'
              ? rawExitPrice * (1 - spread / 2 - slippage)
              : rawExitPrice * (1 + spread / 2 + slippage);

          const returnRate =
            currentPos.direction === 'BUY'
              ? (finalExitPrice - currentPos.entryPrice) / currentPos.entryPrice
              : (currentPos.entryPrice - finalExitPrice) / currentPos.entryPrice;

          const pnl = Number((currentPos.amount * returnRate - fee).toFixed(2));
          balance = Number((balance + pnl).toFixed(2));

          trades.push({
            id: currentPos.tradeId,
            asset,
            direction: currentPos.direction,
            entryPrice: currentPos.entryPrice,
            exitPrice: finalExitPrice,
            amount: currentPos.amount,
            pnl,
            result: pnl > 0 ? 'WIN' : 'LOSS',
            timestamp: new Date(currentCandle.timestamp).toISOString(),
            reason: exitReason
          });

          currentPos = null;
        }
      }

      // 2. Evaluate strategy signal for entry if no position is active
      if (!currentPos) {
        const evalResult = strategyEngine.evaluateFromCandles(strategyName, historicalSlice, req.parameters);

        if (evalResult.signal === 'BUY' || evalResult.signal === 'SELL') {
          const entryPrice =
            evalResult.signal === 'BUY'
              ? currentPrice * (1 + spread / 2 + slippage)
              : currentPrice * (1 - spread / 2 - slippage);

          currentPos = {
            direction: evalResult.signal,
            entryPrice: Number(entryPrice.toFixed(5)),
            entryTime: currentCandle.timestamp,
            candlesHeld: 0,
            amount: tradeAmount,
            tradeId: randomUUID(),
            reason: evalResult.reason
          };
        }
      }

      // 3. Mark-to-market equity tracking
      let unrealizedPnl = 0;
      if (currentPos) {
        const diffPct =
          currentPos.direction === 'BUY'
            ? (currentPrice - currentPos.entryPrice) / currentPos.entryPrice
            : (currentPos.entryPrice - currentPrice) / currentPos.entryPrice;
        unrealizedPnl = currentPos.amount * diffPct;
      }

      const currentEquity = Number((balance + unrealizedPnl).toFixed(2));
      if (currentEquity > peakEquity) {
        peakEquity = currentEquity;
      }
      const drawdown = peakEquity > 0 ? ((peakEquity - currentEquity) / peakEquity) * 100 : 0;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }

      equityCurve.push({
        timestamp: new Date(currentCandle.timestamp).toISOString(),
        balance,
        equity: currentEquity,
        drawdownPercent: Number(drawdown.toFixed(2))
      });
    }

    // 4. Force-close any open position at dataset end
    if (currentPos) {
      const lastCandle = candles[candles.length - 1];
      const finalExitPrice =
        currentPos.direction === 'BUY'
          ? lastCandle.close * (1 - spread / 2 - slippage)
          : lastCandle.close * (1 + spread / 2 + slippage);

      const returnRate =
        currentPos.direction === 'BUY'
          ? (finalExitPrice - currentPos.entryPrice) / currentPos.entryPrice
          : (currentPos.entryPrice - finalExitPrice) / currentPos.entryPrice;

      const pnl = Number((currentPos.amount * returnRate - fee).toFixed(2));
      balance = Number((balance + pnl).toFixed(2));

      trades.push({
        id: currentPos.tradeId,
        asset,
        direction: currentPos.direction,
        entryPrice: currentPos.entryPrice,
        exitPrice: Number(finalExitPrice.toFixed(5)),
        amount: currentPos.amount,
        pnl,
        result: pnl > 0 ? 'WIN' : 'LOSS',
        timestamp: new Date(lastCandle.timestamp).toISOString(),
        reason: 'Dataset boundary: position closed'
      });
    }

    // 5. Aggregate performance metrics
    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);

    const winRate = totalTrades > 0 ? Number(((winningTrades.length / totalTrades) * 100).toFixed(2)) : 0;
    const totalPnl = Number((balance - initialBalance).toFixed(2));
    const totalPnlPercent = Number(((totalPnl / initialBalance) * 100).toFixed(2));

    const grossProfit = winningTrades.reduce((acc, t) => acc + t.pnl, 0);
    const grossLoss = Math.abs(losingTrades.reduce((acc, t) => acc + t.pnl, 0));

    const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : (grossProfit > 0 ? 99.99 : 0);
    const averageWin = winningTrades.length > 0 ? Number((grossProfit / winningTrades.length).toFixed(2)) : 0;
    const averageLoss = losingTrades.length > 0 ? Number((grossLoss / losingTrades.length).toFixed(2)) : 0;
    const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl)) : 0;
    const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnl)) : 0;

    const startDate = new Date(candles[0].timestamp).toISOString();
    const endDate = new Date(candles[candles.length - 1].timestamp).toISOString();
    const backtestId = randomUUID();

    const advancedMetrics = metricsService.calculateMetrics(trades, equityCurve, initialBalance);

    // Build regime map for trades
    const regimeMap = new Map<string, MarketRegimeType>();
    for (let i = 21; i < candles.length; i++) {
      const reg = regimeService.classifyRegime(candles, i);
      regimeMap.set(new Date(candles[i].timestamp).toISOString(), reg.regime);
    }
    const regimeBreakdown = regimeService.aggregatePerformanceByRegime(trades, regimeMap);

    const result: BacktestResult = {
      id: backtestId,
      userId,
      asset,
      timeframe,
      strategy: strategyName,
      startDate,
      endDate,
      initialBalance,
      finalBalance: balance,
      totalPnl,
      netPnl: totalPnl,
      totalPnlPercent,
      totalTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      maxDrawdown: Number(maxDrawdown.toFixed(2)),
      profitFactor,
      averageWin,
      averageLoss,
      largestWin,
      largestLoss,
      trades,
      equityCurve,
      advancedMetrics: advancedMetrics!,
      regimeBreakdown,
      parameters: req.parameters,
      disclaimer: BACKTEST_DISCLAIMER,
      mode: 'PAPER'
    };

    if (persist) {
      // 6. Asynchronously persist to MySQL
      this.persistBacktest(result).catch(err => {
        console.error('Failed to persist backtest to database:', err.message);
      });

      auditService.log('BACKTEST_COMPLETED', userId, {
        backtestId,
        asset,
        strategy: strategyName,
        tradesCount: totalTrades,
        winRate,
        totalPnl
      });
    }

    return result;
  }

  /**
   * Persist backtest run, trades, and equity curve to MySQL.
   */
  private async persistBacktest(result: BacktestResult): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `INSERT INTO backtest_runs (
          id, user_id, asset, timeframe, strategy, start_date, end_date,
          initial_balance, final_balance, total_pnl, win_rate, max_drawdown,
          profit_factor, total_trades
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          result.id,
          result.userId,
          result.asset,
          result.timeframe,
          result.strategy,
          result.startDate,
          result.endDate,
          result.initialBalance,
          result.finalBalance,
          result.totalPnl,
          result.winRate,
          result.maxDrawdown,
          result.profitFactor,
          result.totalTrades
        ]
      );

      for (const t of result.trades) {
        await connection.query(
          `INSERT INTO backtest_trades (
            id, backtest_id, asset, direction, entry_price, exit_price,
            amount, pnl, result, timestamp, reason
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            t.id,
            result.id,
            t.asset,
            t.direction,
            t.entryPrice,
            t.exitPrice,
            t.amount,
            t.pnl,
            t.result,
            t.timestamp,
            t.reason || null
          ]
        );
      }

      // Sample equity curve to at most 100 points to keep database compact
      const step = Math.max(1, Math.floor(result.equityCurve.length / 100));
      for (let i = 0; i < result.equityCurve.length; i += step) {
        const pt = result.equityCurve[i];
        await connection.query(
          `INSERT INTO backtest_equity (backtest_id, timestamp, balance, equity)
           VALUES (?, ?, ?, ?)`,
          [result.id, pt.timestamp, pt.balance, pt.equity]
        );
      }

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * Compares all 4 strategies on the exact same dataset without biased declarations.
   */
  async compareStrategies(
    userId: number,
    asset: string,
    timeframe = '5m',
    candleCount = 100,
    initialBalance = 10000
  ): Promise<{
    asset: string;
    timeframe: string;
    comparison: StrategyComparisonItem[];
    disclaimer: string;
  }> {
    const candles = await marketService.getCandles(asset, timeframe, candleCount);
    const cleaned = this.validateAndCleanCandles(candles);

    const strategies = ['EMA_RSI', 'MACD', 'BOLLINGER_BANDS', 'MULTI_INDICATOR'];
    const comparison: StrategyComparisonItem[] = [];

    for (const strat of strategies) {
      const run = await this.runBacktest({
        userId,
        asset,
        timeframe,
        strategy: strat,
        candles: cleaned,
        initialBalance
      });

      comparison.push({
        strategy: strat,
        initialBalance: run.initialBalance,
        finalBalance: run.finalBalance,
        totalPnl: run.totalPnl,
        totalPnlPercent: run.totalPnlPercent,
        totalTrades: run.totalTrades,
        winRate: run.winRate,
        profitFactor: run.profitFactor,
        maxDrawdown: run.maxDrawdown
      });
    }

    return {
      asset,
      timeframe,
      comparison,
      disclaimer: BACKTEST_DISCLAIMER
    };
  }

  /**
   * Retrieves past backtest run by ID with trades and equity curve.
   */
  async getBacktestById(id: string, userId: number): Promise<any | null> {
    const [runs]: any = await pool.query(
      'SELECT * FROM backtest_runs WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (!runs || runs.length === 0) return null;

    const run = runs[0];
    const [trades]: any = await pool.query(
      'SELECT * FROM backtest_trades WHERE backtest_id = ? ORDER BY timestamp ASC',
      [id]
    );
    const [equity]: any = await pool.query(
      'SELECT * FROM backtest_equity WHERE backtest_id = ? ORDER BY id ASC',
      [id]
    );

    return {
      ...run,
      trades,
      equityCurve: equity,
      disclaimer: BACKTEST_DISCLAIMER,
      mode: 'PAPER'
    };
  }

  /**
   * Retrieves user's recent backtest history.
   */
  async getUserBacktests(userId: number, limit = 20): Promise<any[]> {
    const [runs]: any = await pool.query(
      'SELECT * FROM backtest_runs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    );
    return runs;
  }
}

export const backtestingService = new BacktestingService();
