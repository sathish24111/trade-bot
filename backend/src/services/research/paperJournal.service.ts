import { pool } from '../../config/database';
import { PaperTradeJournalEntry } from '../../models/StrategyV2';

class PaperJournalService {
  private inMemoryJournal: PaperTradeJournalEntry[] = [];
  private tableInitialized = false;

  public async ensureTable(): Promise<void> {
    if (this.tableInitialized) return;
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS paper_trade_journal (
          id VARCHAR(64) PRIMARY KEY,
          signal_id VARCHAR(64) NOT NULL,
          strategy_version VARCHAR(30) NOT NULL,
          session_id VARCHAR(64) NOT NULL,
          user_id INT NOT NULL,
          symbol VARCHAR(30) NOT NULL,
          regime VARCHAR(30) NOT NULL,
          direction ENUM('BUY', 'SELL', 'WAIT') NOT NULL,
          signal_score INT NOT NULL,
          score_breakdown JSON,
          indicator_values JSON,
          entry_price DECIMAL(16,6) NOT NULL,
          exit_price DECIMAL(16,6) NOT NULL,
          pnl DECIMAL(12,2) NOT NULL,
          result ENUM('WIN', 'LOSS') NOT NULL,
          duration_seconds INT NOT NULL DEFAULT 5,
          data_quality_ok BOOLEAN NOT NULL DEFAULT TRUE,
          risk_checks_passed BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_journal_strategy (strategy_version),
          INDEX idx_journal_user (user_id),
          INDEX idx_journal_session (session_id),
          INDEX idx_journal_symbol (symbol),
          INDEX idx_journal_regime (regime)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      this.tableInitialized = true;
    } catch (err: any) {
      console.warn('[PaperJournal] Failed to initialize table in MySQL, will use in-memory store:', err.message);
    }
  }

  public async recordEntry(entry: PaperTradeJournalEntry): Promise<void> {
    this.inMemoryJournal.push(entry);
    if (this.inMemoryJournal.length > 5000) {
      this.inMemoryJournal.shift();
    }

    try {
      await this.ensureTable();
      await pool.query(
        `INSERT INTO paper_trade_journal (
          id, signal_id, strategy_version, session_id, user_id, symbol, regime,
          direction, signal_score, score_breakdown, indicator_values,
          entry_price, exit_price, pnl, result, duration_seconds,
          data_quality_ok, risk_checks_passed, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE pnl = VALUES(pnl), exit_price = VALUES(exit_price), result = VALUES(result)`,
        [
          entry.id,
          entry.signalId,
          entry.strategyVersion,
          entry.sessionId,
          entry.userId,
          entry.symbol,
          entry.regime,
          entry.direction,
          entry.signalScore,
          JSON.stringify(entry.scoreBreakdown || {}),
          JSON.stringify(entry.indicatorValues || {}),
          entry.entryPrice,
          entry.exitPrice,
          entry.pnl,
          entry.result,
          entry.durationSeconds,
          entry.dataQualityOk ? 1 : 0,
          entry.riskChecksPassed ? 1 : 0,
          entry.createdAt
        ]
      );
    } catch (err: any) {
      console.warn('[PaperJournal] MySQL insert failed, entry kept in memory:', err.message);
    }
  }

  public async getJournalEntries(filter?: {
    strategyVersion?: string;
    userId?: number;
    symbol?: string;
    regime?: string;
    limit?: number;
  }): Promise<PaperTradeJournalEntry[]> {
    const limit = filter?.limit || 100;
    try {
      await this.ensureTable();
      let query = 'SELECT * FROM paper_trade_journal WHERE 1=1';
      const params: any[] = [];

      if (filter?.strategyVersion) {
        query += ' AND strategy_version = ?';
        params.push(filter.strategyVersion);
      }
      if (filter?.userId) {
        query += ' AND user_id = ?';
        params.push(filter.userId);
      }
      if (filter?.symbol) {
        query += ' AND symbol = ?';
        params.push(filter.symbol);
      }
      if (filter?.regime) {
        query += ' AND regime = ?';
        params.push(filter.regime);
      }

      query += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limit);

      const [rows]: any = await pool.query(query, params);
      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          signalId: r.signal_id,
          strategyVersion: r.strategy_version,
          sessionId: r.session_id,
          userId: r.user_id,
          symbol: r.symbol,
          regime: r.regime,
          direction: r.direction,
          signalScore: r.signal_score,
          scoreBreakdown: typeof r.score_breakdown === 'string' ? JSON.parse(r.score_breakdown) : (r.score_breakdown || {}),
          indicatorValues: typeof r.indicator_values === 'string' ? JSON.parse(r.indicator_values) : (r.indicator_values || {}),
          entryPrice: parseFloat(r.entry_price),
          exitPrice: parseFloat(r.exit_price),
          pnl: parseFloat(r.pnl),
          result: r.result,
          durationSeconds: r.duration_seconds,
          dataQualityOk: Boolean(r.data_quality_ok),
          riskChecksPassed: Boolean(r.risk_checks_passed),
          createdAt: new Date(r.created_at)
        }));
      }
    } catch (err: any) {
      console.warn('[PaperJournal] Fallback to in-memory filter:', err.message);
    }

    // Fallback to in-memory journal
    let result = [...this.inMemoryJournal];
    if (filter?.strategyVersion) {
      result = result.filter(e => e.strategyVersion === filter.strategyVersion);
    }
    if (filter?.userId) {
      result = result.filter(e => e.userId === filter.userId);
    }
    if (filter?.symbol) {
      result = result.filter(e => e.symbol === filter.symbol);
    }
    if (filter?.regime) {
      result = result.filter(e => e.regime === filter.regime);
    }
    return result.slice(-limit).reverse();
  }
}

export const paperJournalService = new PaperJournalService();
