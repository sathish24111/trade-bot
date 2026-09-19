"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.strategyControlService = exports.StrategyControlService = void 0;
const database_1 = require("../../config/database");
class StrategyControlService {
    strategyStates = new Map();
    constructor() {
        // Initialize default strategies in enabled state
        const defaultIds = ['EMA_RSI', 'MACD', 'BOLLINGER_BANDS', 'MULTI_INDICATOR'];
        for (const id of defaultIds) {
            this.strategyStates.set(id, {
                strategy: id,
                name: id,
                state: 'enabled',
                updatedAt: new Date().toISOString()
            });
        }
    }
    /**
     * Updates strategy operating state (enabled, disabled, paused) with immutable audit logging.
     */
    async setStrategyState(strategyId, newState, reason = 'Manual user override', userId = 1) {
        const key = strategyId.toUpperCase().replace(/\s*\+\s*/g, '_').replace(/\s+/g, '_');
        const current = this.strategyStates.get(key) || {
            strategy: key,
            name: key,
            state: 'enabled',
            updatedAt: new Date().toISOString()
        };
        const oldState = current.state;
        current.state = newState;
        current.updatedAt = new Date().toISOString();
        current.reason = reason;
        this.strategyStates.set(key, current);
        // Persist status change into strategies table and audit log
        try {
            const isEnabled = newState === 'enabled';
            await database_1.pool.query(`UPDATE strategies SET enabled = ? WHERE id = ?`, [isEnabled, key]);
            await database_1.pool.query(`INSERT INTO strategy_state_changes (strategy, old_state, new_state, reason, user_id)
         VALUES (?, ?, ?, ?, ?)`, [key, oldState, newState, reason, userId]);
        }
        catch {
            // In-memory fallback
        }
        return current;
    }
    /**
     * Checks whether a strategy is permitted to generate new paper signals.
     */
    isSignalGenerationAllowed(strategyId) {
        const key = strategyId.toUpperCase().replace(/\s*\+\s*/g, '_').replace(/\s+/g, '_');
        const state = this.strategyStates.get(key);
        return state ? state.state === 'enabled' : true;
    }
    /**
     * Retrieves all strategy states.
     */
    getAllStrategyStates() {
        return Array.from(this.strategyStates.values());
    }
    /**
     * Retrieves audit log for strategy state modifications.
     */
    async getAuditLog(strategyId) {
        try {
            let query = `SELECT id, strategy, old_state as oldState, new_state as newState, reason, user_id as userId, created_at as timestamp FROM strategy_state_changes`;
            const params = [];
            if (strategyId) {
                query += ` WHERE strategy = ?`;
                params.push(strategyId);
            }
            query += ` ORDER BY created_at DESC LIMIT 50`;
            const [rows] = await database_1.pool.query(query, params);
            return rows;
        }
        catch {
            return [];
        }
    }
}
exports.StrategyControlService = StrategyControlService;
exports.strategyControlService = new StrategyControlService();
