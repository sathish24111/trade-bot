import { pool } from '../../config/database';
import { RegimeTransitionEvent, SAFETY_METADATA_PHASE9 } from '../../models/Phase9';
import { broadcastEvent } from '../../websocket/websocket.server';

export class RegimeTransitionService {
  /**
   * Tracks regime changes, records transition events, and emits autonomous research triggers.
   */
  async recordTransition(params: {
    asset: string;
    previousRegime: string;
    newRegime: string;
    confidenceScore?: number;
    triggerIndicators?: Record<string, any>;
    affectedStrategies?: string[];
  }): Promise<RegimeTransitionEvent> {
    const {
      asset,
      previousRegime,
      newRegime,
      confidenceScore = 85.0,
      triggerIndicators = {},
      affectedStrategies = ['EMA_RSI', 'MACD', 'BOLLINGER_BANDS']
    } = params;

    const [res] = await pool.query<any>(
      `INSERT INTO regime_transition_events 
       (asset, previous_regime, new_regime, confidence_score, trigger_indicators, affected_strategies)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        asset,
        previousRegime,
        newRegime,
        confidenceScore,
        JSON.stringify(triggerIndicators),
        JSON.stringify(affectedStrategies)
      ]
    );

    const event: RegimeTransitionEvent = {
      id: res.insertId,
      asset,
      previousRegime,
      newRegime,
      transitionTimestamp: new Date().toISOString(),
      confidenceScore,
      triggerIndicators,
      affectedStrategies
    };

    broadcastEvent({
      type: 'REGIME_TRANSITION',
      ...event,
      ...SAFETY_METADATA_PHASE9
    });

    return event;
  }

  async getRecentTransitions(asset?: string, limit = 50): Promise<RegimeTransitionEvent[]> {
    let query = `SELECT * FROM regime_transition_events`;
    const params: any[] = [];
    if (asset) {
      query += ` WHERE asset = ?`;
      params.push(asset);
    }
    query += ` ORDER BY timestamp DESC LIMIT ?`;
    params.push(limit);

    const [rows] = await pool.query<any[]>(query, params);
    return rows.map(r => ({
      id: r.id,
      asset: r.asset,
      previousRegime: r.previous_regime,
      newRegime: r.new_regime,
      transitionTimestamp: new Date(r.timestamp).toISOString(),
      confidenceScore: Number(r.confidence_score),
      triggerIndicators: typeof r.trigger_indicators === 'string' ? JSON.parse(r.trigger_indicators) : r.trigger_indicators,
      affectedStrategies: typeof r.affected_strategies === 'string' ? JSON.parse(r.affected_strategies) : r.affected_strategies
    }));
  }
}

export const regimeTransitionService = new RegimeTransitionService();

