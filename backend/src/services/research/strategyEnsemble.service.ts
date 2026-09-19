import crypto from 'crypto';
import { pool } from '../../config/database';
import { DemoSignalType, MarketAsset } from '../../models/MarketData';
import { EnsembleAggregationMode, EnsembleConfig, EnsembleSignalResult, SignalConflictEvent } from '../../models/Phase8';
import { strategyEngine } from '../strategy.service';
import { broadcastEvent } from '../../websocket/websocket.server';

export class StrategyEnsembleService {
  private ensembleConfigs: Map<string, EnsembleConfig> = new Map();
  private inMemoryConflicts: SignalConflictEvent[] = [];

  constructor() {
    this.initDefaultEnsemble();
  }

  private initDefaultEnsemble() {
    const defaultEnsemble: EnsembleConfig = {
      id: 'ENSEMBLE_CORE_3',
      name: 'Core 3-Strategy Paper Ensemble',
      aggregationMode: 'MAJORITY',
      strategies: [
        { strategyId: 'EMA_RSI', weight: 0.40 },
        { strategyId: 'MACD', weight: 0.35 },
        { strategyId: 'BOLLINGER_BANDS', weight: 0.25 }
      ],
      minConfirmations: 2,
      enabled: true,
      createdAt: new Date().toISOString()
    };
    this.ensembleConfigs.set(defaultEnsemble.id, defaultEnsemble);
  }

  async getEnsembleConfig(id = 'ENSEMBLE_CORE_3'): Promise<EnsembleConfig> {
    const mem = this.ensembleConfigs.get(id);
    if (mem) return mem;

    try {
      const [rows] = await pool.query<any[]>(
        'SELECT * FROM research_ensemble_configs WHERE id = ?',
        [id]
      );
      if (rows.length > 0) {
        const r = rows[0];
        const config: EnsembleConfig = {
          id: r.id,
          name: r.name,
          aggregationMode: r.aggregation_mode,
          strategies: typeof r.strategies === 'string' ? JSON.parse(r.strategies) : r.strategies,
          minConfirmations: r.min_confirmations,
          enabled: Boolean(r.enabled),
          createdAt: new Date(r.created_at).toISOString()
        };
        this.ensembleConfigs.set(config.id, config);
        return config;
      }
    } catch {}

    return this.ensembleConfigs.get('ENSEMBLE_CORE_3')!;
  }

  async saveEnsembleConfig(config: EnsembleConfig): Promise<EnsembleConfig> {
    if (!config.id) {
      config.id = `ENS_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`;
    }
    config.createdAt = new Date().toISOString();

    // Validate weights sum for WEIGHTED mode
    if (config.aggregationMode === 'WEIGHTED') {
      const totalWeight = config.strategies.reduce((sum, s) => sum + s.weight, 0);
      if (Math.abs(totalWeight - 1.0) > 0.05) {
        throw new Error(`Strategy weights must sum to approximately 1.0 (received ${totalWeight.toFixed(2)})`);
      }
    }

    try {
      await pool.query(
        `INSERT INTO research_ensemble_configs (id, name, aggregation_mode, strategies, min_confirmations, enabled)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), aggregation_mode = VALUES(aggregation_mode), strategies = VALUES(strategies), min_confirmations = VALUES(min_confirmations), enabled = VALUES(enabled)`,
        [
          config.id,
          config.name,
          config.aggregationMode,
          JSON.stringify(config.strategies),
          config.minConfirmations || 2,
          config.enabled
        ]
      );
    } catch {}

    this.ensembleConfigs.set(config.id, config);
    return config;
  }

  /**
   * Evaluates ensemble against current market asset and calculates aggregate signal
   */
  async evaluateEnsemble(asset: MarketAsset, ensembleId = 'ENSEMBLE_CORE_3'): Promise<EnsembleSignalResult> {
    const config = await this.getEnsembleConfig(ensembleId);
    const votes: { strategyId: string; signal: DemoSignalType; confidence: number; weight: number }[] = [];

    // 1. Collect component signals
    for (const item of config.strategies) {
      const evalRes = strategyEngine.evaluate(item.strategyId, asset);
      votes.push({
        strategyId: item.strategyId,
        signal: evalRes.signal,
        confidence: evalRes.confidence,
        weight: item.weight
      });
    }

    // 2. Resolve final signal based on aggregation mode
    let finalSignal: DemoSignalType = 'WAIT';
    let finalConfidence = 50;
    let explanation = '';
    let hasConflict = false;

    // Detect if strategies disagree
    const activeSignals = votes.filter(v => v.signal !== 'WAIT').map(v => v.signal);
    const uniqueSignals = new Set(activeSignals);
    if (uniqueSignals.size > 1 || (uniqueSignals.size === 1 && votes.some(v => v.signal === 'WAIT'))) {
      hasConflict = true;
    }

    switch (config.aggregationMode) {
      case 'MAJORITY': {
        const buyCount = votes.filter(v => v.signal === 'BUY').length;
        const sellCount = votes.filter(v => v.signal === 'SELL').length;
        const waitCount = votes.filter(v => v.signal === 'WAIT').length;

        if (buyCount > sellCount && buyCount > waitCount) {
          finalSignal = 'BUY';
          finalConfidence = Math.round((buyCount / votes.length) * 100);
          explanation = `Majority decision: ${buyCount}/${votes.length} strategies signaled BUY`;
        } else if (sellCount > buyCount && sellCount > waitCount) {
          finalSignal = 'SELL';
          finalConfidence = Math.round((sellCount / votes.length) * 100);
          explanation = `Majority decision: ${sellCount}/${votes.length} strategies signaled SELL`;
        } else {
          finalSignal = 'WAIT';
          finalConfidence = 50;
          explanation = `No clear majority (${buyCount} BUY, ${sellCount} SELL, ${waitCount} WAIT); resolved to WAIT`;
        }
        break;
      }

      case 'WEIGHTED': {
        let buyWeight = 0;
        let sellWeight = 0;
        for (const v of votes) {
          if (v.signal === 'BUY') buyWeight += v.weight * (v.confidence / 100);
          if (v.signal === 'SELL') sellWeight += v.weight * (v.confidence / 100);
        }

        if (buyWeight > sellWeight && buyWeight >= 0.40) {
          finalSignal = 'BUY';
          finalConfidence = Math.min(95, Math.round(buyWeight * 100));
          explanation = `Weighted consensus: BUY weight ${(buyWeight * 100).toFixed(1)}% vs SELL ${(sellWeight * 100).toFixed(1)}%`;
        } else if (sellWeight > buyWeight && sellWeight >= 0.40) {
          finalSignal = 'SELL';
          finalConfidence = Math.min(95, Math.round(sellWeight * 100));
          explanation = `Weighted consensus: SELL weight ${(sellWeight * 100).toFixed(1)}% vs BUY ${(buyWeight * 100).toFixed(1)}%`;
        } else {
          finalSignal = 'WAIT';
          finalConfidence = 50;
          explanation = `Insufficient weighted conviction (BUY: ${(buyWeight * 100).toFixed(1)}%, SELL: ${(sellWeight * 100).toFixed(1)}%)`;
        }
        break;
      }

      case 'CONSENSUS': {
        const minReq = config.minConfirmations || 2;
        const buyCount = votes.filter(v => v.signal === 'BUY').length;
        const sellCount = votes.filter(v => v.signal === 'SELL').length;

        if (buyCount >= minReq && sellCount === 0) {
          finalSignal = 'BUY';
          finalConfidence = Math.round((buyCount / votes.length) * 100);
          explanation = `Unanimous/Quorum consensus BUY (${buyCount} required confirmations met with zero counter-signals)`;
        } else if (sellCount >= minReq && buyCount === 0) {
          finalSignal = 'SELL';
          finalConfidence = Math.round((sellCount / votes.length) * 100);
          explanation = `Unanimous/Quorum consensus SELL (${sellCount} required confirmations met with zero counter-signals)`;
        } else {
          finalSignal = 'WAIT';
          finalConfidence = 50;
          explanation = `Consensus threshold not met or conflicting signals present (BUY: ${buyCount}, SELL: ${sellCount})`;
        }
        break;
      }

      case 'INDEPENDENT':
      default: {
        // Independent: Take highest confidence signal if above 70%, otherwise WAIT
        const sorted = [...votes].sort((a, b) => b.confidence - a.confidence);
        const top = sorted[0];
        if (top && top.confidence >= 70 && top.signal !== 'WAIT') {
          finalSignal = top.signal;
          finalConfidence = top.confidence;
          explanation = `Independent leader ${top.strategyId} signaled ${top.signal} with high confidence (${top.confidence}%)`;
        } else {
          finalSignal = 'WAIT';
          finalConfidence = 50;
          explanation = 'Independent evaluation produced no high-conviction signal (>70%)';
        }
        break;
      }
    }

    // 3. Record conflict if strategies disagreed
    if (hasConflict) {
      await this.recordConflict({
        ensembleId: config.id,
        asset: asset.symbol,
        timestamp: new Date().toISOString(),
        regime: (asset as any).marketRegime || asset.trend || 'UNKNOWN',
        disagreeingSignals: votes.map(v => ({ strategyId: v.strategyId, signal: v.signal, confidence: v.confidence })),
        resolvedSignal: finalSignal,
        resolutionMethod: config.aggregationMode
      });
    }

    return {
      ensembleId: config.id,
      asset: asset.symbol,
      timestamp: new Date().toISOString(),
      aggregationMode: config.aggregationMode,
      finalSignal,
      confidence: finalConfidence,
      voteBreakdown: votes,
      conflictDetected: hasConflict,
      explanation,
      mode: 'PAPER',
      isRealMoney: false,
      brokerConnected: false
    };
  }

  /**
   * Records a signal conflict event
   */
  async recordConflict(conflict: SignalConflictEvent): Promise<SignalConflictEvent> {
    this.inMemoryConflicts.unshift(conflict);
    if (this.inMemoryConflicts.length > 100) this.inMemoryConflicts.pop();

    try {
      const [res] = await pool.query<any>(
        `INSERT INTO research_signal_conflicts (ensemble_id, asset, regime, signals, resolved_signal, resolution_method, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          conflict.ensembleId || 'ENSEMBLE_CORE_3',
          conflict.asset,
          conflict.regime,
          JSON.stringify(conflict.disagreeingSignals),
          conflict.resolvedSignal,
          conflict.resolutionMethod,
          new Date(conflict.timestamp)
        ]
      );
      conflict.id = res.insertId;
    } catch {}

    // Broadcast on WebSocket
    try {
      broadcastEvent({
        type: 'SIGNAL_CONFLICT',
        asset: conflict.asset,
        regime: conflict.regime,
        resolvedSignal: conflict.resolvedSignal,
        mode: 'PAPER',
        timestamp: conflict.timestamp
      });
    } catch {}

    return conflict;
  }

  async getConflicts(asset?: string, limit = 20): Promise<SignalConflictEvent[]> {
    try {
      let q = 'SELECT * FROM research_signal_conflicts';
      const params: any[] = [];
      if (asset) {
        q += ' WHERE asset = ?';
        params.push(asset);
      }
      q += ' ORDER BY id DESC LIMIT ?';
      params.push(limit);

      const [rows] = await pool.query<any[]>(q, params);
      if (rows.length > 0) {
        return rows.map(r => ({
          id: r.id,
          ensembleId: r.ensemble_id,
          asset: r.asset,
          regime: r.regime,
          disagreeingSignals: typeof r.signals === 'string' ? JSON.parse(r.signals) : r.signals,
          resolvedSignal: r.resolved_signal,
          resolutionMethod: r.resolution_method,
          timestamp: new Date(r.timestamp).toISOString()
        }));
      }
    } catch {}

    return this.inMemoryConflicts.slice(0, limit);
  }
}

export const strategyEnsembleService = new StrategyEnsembleService();
