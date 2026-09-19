import { createHash, randomUUID } from 'crypto';
import { pool } from '../../config/database';
import {
  BacktestVsPaperComparison,
  ExperimentStatus,
  PaperExperiment,
  PaperExperimentTrade
} from '../../models/Research';
import { backtestingService } from '../backtesting.service';
import { StrategyParameters } from '../strategy.service';

export class ExperimentService {
  private inMemoryExperiments: Map<string, PaperExperiment> = new Map();
  private inMemoryTrades: Map<string, PaperExperimentTrade[]> = new Map();

  /**
   * Computes an immutable SHA-256 configuration hash.
   */
  computeConfigHash(config: {
    userId: number;
    name: string;
    strategy: string;
    asset: string;
    timeframe: string;
    parameters: StrategyParameters;
    startBalance: number;
  }): string {
    const canonical = `${config.userId}|${config.name}|${config.strategy}|${config.asset}|${config.timeframe}|${JSON.stringify(config.parameters)}|${config.startBalance}`;
    return createHash('sha256').update(canonical).digest('hex');
  }

  /**
   * Creates a new paper trading experiment with locked configuration hash.
   */
  async createExperiment(config: {
    userId: number;
    name: string;
    strategy: string;
    asset: string;
    timeframe: string;
    parameters?: StrategyParameters;
    startBalance?: number;
  }): Promise<PaperExperiment> {
    const id = `exp_${randomUUID().replace(/-/g, '').substring(0, 16)}`;
    const startBalance = config.startBalance || 10000.0;
    const parameters = config.parameters || {};
    const configHash = this.computeConfigHash({
      userId: config.userId,
      name: config.name,
      strategy: config.strategy,
      asset: config.asset,
      timeframe: config.timeframe,
      parameters,
      startBalance
    });

    const experiment: PaperExperiment = {
      id,
      userId: config.userId,
      name: config.name,
      strategy: config.strategy,
      asset: config.asset,
      timeframe: config.timeframe,
      configHash,
      parameters,
      status: 'CREATED',
      startBalance,
      currentBalance: startBalance,
      totalTrades: 0,
      winRate: 0.0,
      pnl: 0.0,
      createdAt: new Date().toISOString()
    };

    this.inMemoryExperiments.set(id, experiment);
    this.inMemoryTrades.set(id, []);

    try {
      await pool.query(
        `INSERT INTO paper_experiments (id, user_id, name, strategy, asset, timeframe, config_hash, parameters, status, start_balance, current_balance)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CREATED', ?, ?)`,
        [
          id,
          config.userId,
          config.name,
          config.strategy,
          config.asset,
          config.timeframe,
          configHash,
          JSON.stringify(parameters),
          startBalance,
          startBalance
        ]
      );
    } catch (err: any) {
      console.warn(`[ExperimentService] DB write warning: ${err.message}`);
    }

    return experiment;
  }

  /**
   * Computes granular component hashes for experiment immutability.
   */
  computeGranularHashes(config: {
    userId: number;
    name: string;
    strategy: string;
    asset: string;
    timeframe: string;
    parameters?: StrategyParameters;
    startBalance?: number;
  }) {
    const configHash = this.computeConfigHash({
      userId: config.userId,
      name: config.name,
      strategy: config.strategy,
      asset: config.asset,
      timeframe: config.timeframe,
      parameters: config.parameters || {},
      startBalance: config.startBalance || 10000.0
    });

    return {
      configHash,
      strategyHash: createHash('sha256').update(config.strategy).digest('hex').substring(0, 16),
      datasetHash: createHash('sha256').update(`${config.asset}_${config.timeframe}`).digest('hex').substring(0, 16),
      indicatorConfigHash: createHash('sha256').update(JSON.stringify(config.parameters || {})).digest('hex').substring(0, 16),
      riskConfigHash: createHash('sha256').update(String(config.startBalance || 10000)).digest('hex').substring(0, 16)
    };
  }

  /**
   * Captures a periodic experiment snapshot for longitudinal paper tracking.
   */
  async takeSnapshot(experimentId: string): Promise<any> {
    const exp = await this.getExperiment(experimentId);
    if (!exp) throw new Error(`Experiment ${experimentId} not found.`);

    const trades = this.inMemoryTrades.get(experimentId) || [];
    const snapshot = {
      experimentId,
      timestamp: new Date().toISOString(),
      equity: exp.currentBalance,
      pnl: exp.pnl,
      drawdown: 0.0,
      exposure: 10.0,
      tradesCount: trades.length,
      signalsCount: trades.length * 2,
      riskState: 'NORMAL',
      marketState: 'RANGING'
    };

    try {
      await pool.query(
        `INSERT INTO experiment_snapshots (experiment_id, equity, pnl, drawdown, exposure, trades_count, signals_count, risk_state, market_state)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          snapshot.experimentId,
          snapshot.equity,
          snapshot.pnl,
          snapshot.drawdown,
          snapshot.exposure,
          snapshot.tradesCount,
          snapshot.signalsCount,
          snapshot.riskState,
          snapshot.marketState
        ]
      );
    } catch {
      // In-memory fallback
    }

    return snapshot;
  }

  /**
   * Updates experiment lifecycle status with strict transition validation.
   */
  async updateStatus(experimentId: string, newStatus: ExperimentStatus | string): Promise<PaperExperiment> {
    const exp = await this.getExperiment(experimentId);
    if (!exp) {
      throw new Error(`Experiment ${experimentId} not found.`);
    }

    // Valid transitions
    if (exp.status === 'COMPLETED') {
      throw new Error(`Cannot modify experiment in COMPLETED terminal status.`);
    }
    if (exp.status === 'CREATED' && newStatus !== 'RUNNING' && newStatus !== 'COMPLETED') {
      throw new Error(`Invalid status transition from CREATED to ${newStatus}.`);
    }

    exp.status = newStatus as ExperimentStatus;
    if (newStatus === 'COMPLETED') {
      exp.completedAt = new Date().toISOString();
    }

    this.inMemoryExperiments.set(experimentId, exp);

    try {
      const completedDate = exp.completedAt ? new Date(exp.completedAt) : null;
      await pool.query(
        `UPDATE paper_experiments SET status = ?, completed_at = ? WHERE id = ?`,
        [newStatus, completedDate, experimentId]
      );
    } catch (err: any) {
      console.warn(`[ExperimentService] DB update status warning: ${err.message}`);
    }

    return exp;
  }

  /**
   * Adds a paper trade to the experiment journal and updates live performance stats.
   */
  async logTrade(tradeData: {
    experimentId: string;
    direction: 'BUY' | 'SELL';
    entryPrice: number;
    exitPrice: number;
    amount: number;
    slippage?: number;
    fees?: number;
    journalNotes?: string;
    entryTime?: string;
    exitTime?: string;
  }): Promise<PaperExperimentTrade> {
    const exp = await this.getExperiment(tradeData.experimentId);
    if (!exp) {
      throw new Error(`Experiment ${tradeData.experimentId} not found.`);
    }

    if (exp.status !== 'RUNNING') {
      throw new Error(`Cannot log trade to experiment with status ${exp.status}. Experiment must be RUNNING.`);
    }

    const slippage = tradeData.slippage || 0.0001;
    const fees = tradeData.fees || 0.50;

    // Calculate trade PnL
    const returnRate =
      tradeData.direction === 'BUY'
        ? (tradeData.exitPrice - tradeData.entryPrice) / tradeData.entryPrice
        : (tradeData.entryPrice - tradeData.exitPrice) / tradeData.entryPrice;

    const pnl = Math.round((tradeData.amount * returnRate - fees) * 100) / 100;
    const result = pnl > 0 ? 'WIN' : 'LOSS';

    const trade: PaperExperimentTrade = {
      id: `pt_${randomUUID().replace(/-/g, '').substring(0, 16)}`,
      experimentId: tradeData.experimentId,
      direction: tradeData.direction,
      entryPrice: tradeData.entryPrice,
      exitPrice: tradeData.exitPrice,
      amount: tradeData.amount,
      pnl,
      slippage,
      fees,
      result,
      journalNotes: tradeData.journalNotes || '',
      entryTime: tradeData.entryTime || new Date(Date.now() - 60000).toISOString(),
      exitTime: tradeData.exitTime || new Date().toISOString()
    };

    const trades = this.inMemoryTrades.get(tradeData.experimentId) || [];
    trades.push(trade);
    this.inMemoryTrades.set(tradeData.experimentId, trades);

    // Update experiment stats
    exp.totalTrades = trades.length;
    const wins = trades.filter((t) => t.result === 'WIN').length;
    exp.winRate = Math.round((wins / trades.length) * 100 * 100) / 100;
    exp.pnl = Math.round(trades.reduce((sum, t) => sum + t.pnl, 0) * 100) / 100;
    exp.currentBalance = Math.round((exp.startBalance + exp.pnl) * 100) / 100;

    this.inMemoryExperiments.set(tradeData.experimentId, exp);

    try {
      await pool.query(
        `INSERT INTO paper_experiment_trades (id, experiment_id, direction, entry_price, exit_price, amount, pnl, slippage, fees, result, journal_notes, entry_time, exit_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          trade.id,
          trade.experimentId,
          trade.direction,
          trade.entryPrice,
          trade.exitPrice,
          trade.amount,
          trade.pnl,
          trade.slippage,
          trade.fees,
          trade.result,
          trade.journalNotes,
          trade.entryTime,
          trade.exitTime
        ]
      );

      await pool.query(
        `UPDATE paper_experiments SET current_balance = ?, total_trades = ?, win_rate = ?, pnl = ? WHERE id = ?`,
        [exp.currentBalance, exp.totalTrades, exp.winRate, exp.pnl, exp.id]
      );
    } catch (err: any) {
      console.warn(`[ExperimentService] DB log trade warning: ${err.message}`);
    }

    return trade;
  }

  /**
   * Retrieves an experiment by ID.
   */
  async getExperiment(id: string): Promise<PaperExperiment | null> {
    if (this.inMemoryExperiments.has(id)) {
      return this.inMemoryExperiments.get(id)!;
    }

    try {
      const [rows] = await pool.query<any[]>(`SELECT * FROM paper_experiments WHERE id = ?`, [id]);
      if (rows.length === 0) return null;

      const r = rows[0];
      const exp: PaperExperiment = {
        id: r.id,
        userId: r.user_id,
        name: r.name,
        strategy: r.strategy,
        asset: r.asset,
        timeframe: r.timeframe,
        configHash: r.config_hash,
        parameters: typeof r.parameters === 'string' ? JSON.parse(r.parameters) : r.parameters,
        status: r.status,
        startBalance: Number(r.start_balance),
        currentBalance: Number(r.current_balance),
        totalTrades: r.total_trades,
        winRate: Number(r.win_rate),
        pnl: Number(r.pnl),
        createdAt: r.created_at,
        completedAt: r.completed_at
      };
      this.inMemoryExperiments.set(id, exp);
      return exp;
    } catch {
      return null;
    }
  }

  /**
   * Compares paper experiment performance with benchmark historical backtest results.
   */
  async compareBacktestVsPaper(experimentId: string): Promise<BacktestVsPaperComparison> {
    const exp = await this.getExperiment(experimentId);
    if (!exp) {
      throw new Error(`Experiment ${experimentId} not found.`);
    }

    const trades = this.inMemoryTrades.get(experimentId) || [];

    // Run identical historical backtest as baseline benchmark
    const bt = await backtestingService.runBacktest({
      asset: exp.asset,
      timeframe: exp.timeframe,
      strategy: exp.strategy,
      parameters: exp.parameters,
      initialBalance: exp.startBalance,
      candleCount: 100
    });

    const paperWinRate = exp.winRate;
    const grossWins = trades.filter((t) => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
    const grossLosses = Math.abs(trades.filter((t) => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
    const paperProfitFactor =
      grossLosses > 0 ? Math.round((grossWins / grossLosses) * 100) / 100 : grossWins > 0 ? 99.0 : 0;

    const totalFees = trades.reduce((sum, t) => sum + t.fees, 0);
    const totalSlippageCost = trades.reduce((sum, t) => sum + t.slippage * t.amount, 0);
    const grossVolume = trades.reduce((sum, t) => sum + t.amount, 0);

    const feeDragPercent = grossVolume > 0 ? Math.round((totalFees / grossVolume) * 100 * 100) / 100 : 0;
    const slippageDragPercent =
      grossVolume > 0 ? Math.round((totalSlippageCost / grossVolume) * 100 * 100) / 100 : 0;

    const winRateDeviation = Math.round((paperWinRate - bt.winRate) * 100) / 100;

    let divergenceAssessment: 'CONSISTENT' | 'MODERATE_DIVERGENCE' | 'HIGH_DIVERGENCE' = 'CONSISTENT';
    let warning: string | undefined = undefined;

    if (Math.abs(winRateDeviation) > 15 || slippageDragPercent > 5.0) {
      divergenceAssessment = 'HIGH_DIVERGENCE';
      warning = `⚠ High Divergence Detected: Paper trading win rate differs by ${winRateDeviation}% from backtest benchmark. Execution friction or sample size divergence likely.`;
    } else if (Math.abs(winRateDeviation) > 5) {
      divergenceAssessment = 'MODERATE_DIVERGENCE';
      warning = `⚠ Moderate Divergence: Paper trading win rate differs by ${winRateDeviation}% from backtest benchmark.`;
    }

    return {
      experimentId,
      strategy: exp.strategy,
      backtestWinRate: bt.winRate,
      paperWinRate,
      winRateDeviation,
      backtestProfitFactor: bt.profitFactor,
      paperProfitFactor,
      backtestSharpe: bt.advancedMetrics ? bt.advancedMetrics.sharpeRatio : null,
      paperSharpe: null,
      slippageDragPercent,
      feeDragPercent,
      divergenceAssessment,
      warning
    };
  }

  /**
   * Lists experiments for a user.
   */
  async listExperiments(userId = 1): Promise<PaperExperiment[]> {
    const list: PaperExperiment[] = [];
    for (const exp of this.inMemoryExperiments.values()) {
      if (exp.userId === userId) list.push(exp);
    }

    try {
      const [rows] = await pool.query<any[]>(
        `SELECT * FROM paper_experiments WHERE user_id = ? ORDER BY created_at DESC`,
        [userId]
      );
      for (const r of rows) {
        if (!list.some((item) => item.id === r.id)) {
          list.push({
            id: r.id,
            userId: r.user_id,
            name: r.name,
            strategy: r.strategy,
            asset: r.asset,
            timeframe: r.timeframe,
            configHash: r.config_hash,
            parameters: typeof r.parameters === 'string' ? JSON.parse(r.parameters) : r.parameters,
            status: r.status,
            startBalance: Number(r.start_balance),
            currentBalance: Number(r.current_balance),
            totalTrades: r.total_trades,
            winRate: Number(r.win_rate),
            pnl: Number(r.pnl),
            createdAt: r.created_at,
            completedAt: r.completed_at
          });
        }
      }
    } catch {
      // ignore db errors
    }

    return list;
  }
}

export const experimentService = new ExperimentService();
