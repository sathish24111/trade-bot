"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.regimeTransitionService = exports.RegimeTransitionService = void 0;
const database_1 = require("../../config/database");
const Phase9_1 = require("../../models/Phase9");
const websocket_server_1 = require("../../websocket/websocket.server");
class RegimeTransitionService {
    /**
     * Tracks regime changes, records transition events, and emits autonomous research triggers.
     */
    async recordTransition(params) {
        const { asset, previousRegime, newRegime, confidenceScore = 85.0, triggerIndicators = {}, affectedStrategies = ['EMA_RSI', 'MACD', 'BOLLINGER_BANDS'] } = params;
        const [res] = await database_1.pool.query(`INSERT INTO regime_transition_events 
       (asset, previous_regime, new_regime, confidence_score, trigger_indicators, affected_strategies)
       VALUES (?, ?, ?, ?, ?, ?)`, [
            asset,
            previousRegime,
            newRegime,
            confidenceScore,
            JSON.stringify(triggerIndicators),
            JSON.stringify(affectedStrategies)
        ]);
        const event = {
            id: res.insertId,
            asset,
            previousRegime,
            newRegime,
            transitionTimestamp: new Date().toISOString(),
            confidenceScore,
            triggerIndicators,
            affectedStrategies
        };
        (0, websocket_server_1.broadcastEvent)({
            type: 'REGIME_TRANSITION',
            ...event,
            ...Phase9_1.SAFETY_METADATA_PHASE9
        });
        return event;
    }
    async getRecentTransitions(asset, limit = 50) {
        let query = `SELECT * FROM regime_transition_events`;
        const params = [];
        if (asset) {
            query += ` WHERE asset = ?`;
            params.push(asset);
        }
        query += ` ORDER BY timestamp DESC LIMIT ?`;
        params.push(limit);
        const [rows] = await database_1.pool.query(query, params);
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
exports.RegimeTransitionService = RegimeTransitionService;
exports.regimeTransitionService = new RegimeTransitionService();
