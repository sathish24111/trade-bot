import { randomUUID } from 'crypto';
import { pool } from '../../config/database';
import {
  PaperSignal,
  SignalAnalyticsReport,
  SignalOutcome,
  SignalStatus
} from '../../models/Monitoring';

export class SignalQualityService {
  private inMemorySignals: Map<string, PaperSignal> = new Map();
  private inMemoryOutcomes: Map<string, SignalOutcome> = new Map();

  /**
   * Registers a newly generated paper trading signal with unique ID and indicator snapshot.
   */
  async registerSignal(params: {
    asset: string;
    timeframe: string;
    strategy: string;
    direction: 'BUY' | 'SELL' | 'WAIT';
    entryPrice: number;
    stopLoss?: number;
    takeProfit?: number;
    riskAmount?: number;
    confidence: number;
    marketRegime?: string;
    indicatorSnapshot?: Record<string, any>;
    status?: SignalStatus;
    rejectionReason?: string;
  }): Promise<PaperSignal> {
    const signalId = `SIG-${Date.now()}-${randomUUID().replace(/-/g, '').substring(0, 8)}`;
    const signal: PaperSignal = {
      signalId,
      asset: params.asset,
      timeframe: params.timeframe,
      strategy: params.strategy,
      timestamp: new Date().toISOString(),
      direction: params.direction,
      entryPrice: params.entryPrice,
      stopLoss: params.stopLoss,
      takeProfit: params.takeProfit,
      riskAmount: params.riskAmount || 0,
      confidence: params.confidence,
      marketRegime: params.marketRegime || 'RANGING',
      indicatorSnapshot: params.indicatorSnapshot || {},
      status: params.status || 'GENERATED',
      rejectionReason: params.rejectionReason
    };

    this.inMemorySignals.set(signalId, signal);

    try {
      await pool.query(
        `INSERT INTO signals (id, asset, timeframe, strategy, direction, entry_price, stop_loss, take_profit, risk_amount, confidence, market_regime, indicator_snapshot, status, rejection_reason)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          signal.signalId,
          signal.asset,
          signal.timeframe,
          signal.strategy,
          signal.direction,
          signal.entryPrice,
          signal.stopLoss || null,
          signal.takeProfit || null,
          signal.riskAmount,
          signal.confidence,
          signal.marketRegime,
          JSON.stringify(signal.indicatorSnapshot),
          signal.status,
          signal.rejectionReason || null
        ]
      );
    } catch {
      // In-memory fallback maintains state
    }

    return signal;
  }

  /**
   * Updates signal lifecycle state (e.g. EXECUTED, EXPIRED, CANCELLED, REJECTED_BY_RISK).
   */
  async updateSignalStatus(signalId: string, status: SignalStatus, rejectionReason?: string): Promise<PaperSignal> {
    const sig = this.inMemorySignals.get(signalId);
    if (!sig) {
      throw new Error(`Signal ${signalId} not found.`);
    }

    sig.status = status;
    if (rejectionReason) sig.rejectionReason = rejectionReason;

    this.inMemorySignals.set(signalId, sig);

    try {
      await pool.query(
        `UPDATE signals SET status = ?, rejection_reason = ? WHERE id = ?`,
        [status, sig.rejectionReason || null, signalId]
      );
    } catch {
      // ignore db error
    }

    return sig;
  }

  /**
   * Records post-trade outcome metrics including MFE, MAE, holding duration, and return %.
   */
  async recordSignalOutcome(outcome: {
    signalId: string;
    actualEntryPrice: number;
    actualExitPrice: number;
    maxFavorableExcursion?: number;
    maxAdverseExcursion?: number;
    holdingTimeSeconds?: number;
    pnl: number;
  }): Promise<SignalOutcome> {
    const sig = this.inMemorySignals.get(outcome.signalId);
    const returnPct =
      sig && sig.direction === 'SELL'
        ? ((outcome.actualEntryPrice - outcome.actualExitPrice) / outcome.actualEntryPrice) * 100
        : ((outcome.actualExitPrice - outcome.actualEntryPrice) / outcome.actualEntryPrice) * 100;

    const result: 'WIN' | 'LOSS' = outcome.pnl > 0 ? 'WIN' : 'LOSS';

    const fullOutcome: SignalOutcome = {
      signalId: outcome.signalId,
      actualEntryPrice: outcome.actualEntryPrice,
      actualExitPrice: outcome.actualExitPrice,
      returnPct: Math.round(returnPct * 100) / 100,
      maxFavorableExcursion: outcome.maxFavorableExcursion || Math.max(0, returnPct),
      maxAdverseExcursion: outcome.maxAdverseExcursion || Math.min(0, returnPct),
      holdingTimeSeconds: outcome.holdingTimeSeconds || 60,
      result,
      pnl: outcome.pnl
    };

    this.inMemoryOutcomes.set(outcome.signalId, fullOutcome);

    // Also mark signal as EXECUTED if it was still in GENERATED state
    if (sig && sig.status === 'GENERATED') {
      sig.status = 'EXECUTED';
      this.inMemorySignals.set(outcome.signalId, sig);
    }

    try {
      await pool.query(
        `INSERT INTO signal_outcomes (signal_id, actual_entry_price, actual_exit_price, return_pct, max_favorable_excursion, max_adverse_excursion, holding_time_seconds, result, pnl)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE actual_exit_price = VALUES(actual_exit_price), return_pct = VALUES(return_pct), result = VALUES(result), pnl = VALUES(pnl)`,
        [
          fullOutcome.signalId,
          fullOutcome.actualEntryPrice,
          fullOutcome.actualExitPrice,
          fullOutcome.returnPct,
          fullOutcome.maxFavorableExcursion,
          fullOutcome.maxAdverseExcursion,
          fullOutcome.holdingTimeSeconds,
          fullOutcome.result,
          fullOutcome.pnl
        ]
      );
    } catch {
      // In-memory fallback
    }

    return fullOutcome;
  }

  /**
   * Computes comprehensive aggregate signal quality analytics report.
   */
  async getSignalAnalytics(strategy?: string, asset?: string): Promise<SignalAnalyticsReport> {
    let signals = Array.from(this.inMemorySignals.values());
    if (strategy) signals = signals.filter(s => s.strategy === strategy);
    if (asset) signals = signals.filter(s => s.asset === asset);

    const totalSignals = signals.length;
    const executedSignals = signals.filter(s => s.status === 'EXECUTED').length;
    const expiredSignals = signals.filter(s => s.status === 'EXPIRED').length;
    const rejectedSignals = signals.filter(s => s.status === 'REJECTED_BY_RISK').length;

    const outcomes: SignalOutcome[] = [];
    for (const s of signals) {
      const o = this.inMemoryOutcomes.get(s.signalId);
      if (o) outcomes.push(o);
    }

    const wins = outcomes.filter(o => o.result === 'WIN').length;
    const losses = outcomes.filter(o => o.result === 'LOSS').length;
    const winRate = outcomes.length > 0 ? Math.round((wins / outcomes.length) * 100 * 100) / 100 : 0.0;

    const grossProfit = outcomes.filter(o => o.pnl > 0).reduce((sum, o) => sum + o.pnl, 0);
    const grossLoss = Math.abs(outcomes.filter(o => o.pnl < 0).reduce((sum, o) => sum + o.pnl, 0));
    const profitFactor = grossLoss > 0 ? Math.round((grossProfit / grossLoss) * 100) / 100 : grossProfit > 0 ? 99.0 : 0.0;

    const avgReturn = outcomes.length > 0
      ? Math.round((outcomes.reduce((sum, o) => sum + o.returnPct, 0) / outcomes.length) * 100) / 100
      : 0.0;
    const avgMFE = outcomes.length > 0
      ? Math.round((outcomes.reduce((sum, o) => sum + o.maxFavorableExcursion, 0) / outcomes.length) * 100) / 100
      : 0.0;
    const avgMAE = outcomes.length > 0
      ? Math.round((outcomes.reduce((sum, o) => sum + o.maxAdverseExcursion, 0) / outcomes.length) * 100) / 100
      : 0.0;
    const avgHoldingTime = outcomes.length > 0
      ? Math.round(outcomes.reduce((sum, o) => sum + o.holdingTimeSeconds, 0) / outcomes.length)
      : 0;

    const avgWin = wins > 0 ? grossProfit / wins : 0;
    const avgLoss = losses > 0 ? grossLoss / losses : 0;
    const winRatio = outcomes.length > 0 ? wins / outcomes.length : 0;
    const lossRatio = outcomes.length > 0 ? losses / outcomes.length : 0;
    const expectancy = Math.round((winRatio * avgWin - lossRatio * avgLoss) * 100) / 100;

    const conversionRate = totalSignals > 0 ? Math.round((executedSignals / totalSignals) * 100 * 100) / 100 : 0.0;

    // Regime performance
    const regimePerformance: Record<string, { total: number; wins: number; winRate: number }> = {};
    for (const s of signals) {
      const reg = s.marketRegime || 'UNKNOWN';
      if (!regimePerformance[reg]) {
        regimePerformance[reg] = { total: 0, wins: 0, winRate: 0.0 };
      }
      regimePerformance[reg].total++;
      const o = this.inMemoryOutcomes.get(s.signalId);
      if (o && o.result === 'WIN') {
        regimePerformance[reg].wins++;
      }
    }
    for (const reg of Object.keys(regimePerformance)) {
      const data = regimePerformance[reg];
      data.winRate = data.total > 0 ? Math.round((data.wins / data.total) * 100 * 100) / 100 : 0.0;
    }

    return {
      totalSignals,
      executedSignals,
      expiredSignals,
      rejectedSignals,
      winRate,
      avgReturn,
      avgMFE,
      avgMAE,
      avgHoldingTime,
      profitFactor,
      expectancy,
      conversionRate,
      regimePerformance
    };
  }

  /**
   * Retrieves signals list.
   */
  async getSignals(limit = 50): Promise<PaperSignal[]> {
    return Array.from(this.inMemorySignals.values()).slice(-limit).reverse();
  }

  /**
   * Retrieves a single signal by ID.
   */
  async getSignalById(signalId: string): Promise<PaperSignal | null> {
    return this.inMemorySignals.get(signalId) || null;
  }
}

export const signalQualityService = new SignalQualityService();
