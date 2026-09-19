import { pool } from '../../config/database';
import { StrategyAuditRecord, StrategyControlState, StrategyState } from '../../models/Monitoring';
import { strategyEngine } from '../strategy.service';

export class StrategyControlService {
  private strategyStates: Map<string, StrategyControlState> = new Map();

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
  async setStrategyState(
    strategyId: string,
    newState: StrategyState,
    reason = 'Manual user override',
    userId = 1
  ): Promise<StrategyControlState> {
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
      await pool.query(
        `UPDATE strategies SET enabled = ? WHERE id = ?`,
        [isEnabled, key]
      );

      await pool.query(
        `INSERT INTO strategy_state_changes (strategy, old_state, new_state, reason, user_id)
         VALUES (?, ?, ?, ?, ?)`,
        [key, oldState, newState, reason, userId]
      );
    } catch {
      // In-memory fallback
    }

    return current;
  }

  /**
   * Checks whether a strategy is permitted to generate new paper signals.
   */
  isSignalGenerationAllowed(strategyId: string): boolean {
    const key = strategyId.toUpperCase().replace(/\s*\+\s*/g, '_').replace(/\s+/g, '_');
    const state = this.strategyStates.get(key);
    return state ? state.state === 'enabled' : true;
  }

  /**
   * Retrieves all strategy states.
   */
  getAllStrategyStates(): StrategyControlState[] {
    return Array.from(this.strategyStates.values());
  }

  /**
   * Retrieves audit log for strategy state modifications.
   */
  async getAuditLog(strategyId?: string): Promise<StrategyAuditRecord[]> {
    try {
      let query = `SELECT id, strategy, old_state as oldState, new_state as newState, reason, user_id as userId, created_at as timestamp FROM strategy_state_changes`;
      const params: any[] = [];
      if (strategyId) {
        query += ` WHERE strategy = ?`;
        params.push(strategyId);
      }
      query += ` ORDER BY created_at DESC LIMIT 50`;

      const [rows] = await pool.query<any[]>(query, params);
      return rows;
    } catch {
      return [];
    }
  }
}

export const strategyControlService = new StrategyControlService();
