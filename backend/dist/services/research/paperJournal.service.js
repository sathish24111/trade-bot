"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paperJournalService = void 0;
const database_1 = require("../../config/database");
const crypto_1 = __importDefault(require("crypto"));
class PaperJournalService {
    inMemoryJournal = [];
    tableInitialized = false;
    async ensureTable() {
        if (this.tableInitialized)
            return;
        try {
            await database_1.pool.query(`
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
          ema_score INT DEFAULT 0,
          rsi_score INT DEFAULT 0,
          macd_score INT DEFAULT 0,
          bollinger_score INT DEFAULT 0,
          momentum_score INT DEFAULT 0,
          volatility_score INT DEFAULT 0,
          score_breakdown JSON,
          indicator_values JSON,
          entry_price DECIMAL(16,6) NOT NULL,
          exit_price DECIMAL(16,6) NOT NULL,
          contract_duration INT NOT NULL DEFAULT 5,
          payout DECIMAL(12,2) NOT NULL DEFAULT 0.00,
          pnl DECIMAL(12,2) NOT NULL,
          result ENUM('WIN', 'LOSS') NOT NULL,
          data_quality VARCHAR(50) DEFAULT 'HEALTHY',
          data_quality_ok BOOLEAN NOT NULL DEFAULT TRUE,
          risk_checks_passed BOOLEAN NOT NULL DEFAULT TRUE,
          risk_state JSON,
          signal_invalidation_state VARCHAR(100) DEFAULT 'VALID',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_journal_strategy (strategy_version),
          INDEX idx_journal_user (user_id),
          INDEX idx_journal_session (session_id),
          INDEX idx_journal_symbol (symbol),
          INDEX idx_journal_regime (regime)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
            // Column migrations for existing tables
            const cols = [
                'ema_score INT DEFAULT 0',
                'rsi_score INT DEFAULT 0',
                'macd_score INT DEFAULT 0',
                'bollinger_score INT DEFAULT 0',
                'momentum_score INT DEFAULT 0',
                'volatility_score INT DEFAULT 0',
                'contract_duration INT NOT NULL DEFAULT 5',
                'payout DECIMAL(12,2) NOT NULL DEFAULT 0.00',
                'data_quality VARCHAR(50) DEFAULT "HEALTHY"',
                'risk_state JSON',
                'signal_invalidation_state VARCHAR(100) DEFAULT "VALID"'
            ];
            for (const colDef of cols) {
                const colName = colDef.split(' ')[0];
                try {
                    await database_1.pool.query(`ALTER TABLE paper_trade_journal ADD COLUMN ${colDef}`);
                }
                catch { }
            }
            this.tableInitialized = true;
        }
        catch (err) {
            console.warn('[PaperJournal] Failed to initialize table in MySQL, will use in-memory store:', err.message);
        }
    }
    async recordEntry(entry) {
        const enrichedEntry = {
            ...entry,
            emaScore: entry.emaScore ?? entry.scoreBreakdown?.emaScore ?? 0,
            rsiScore: entry.rsiScore ?? entry.scoreBreakdown?.rsiScore ?? 0,
            macdScore: entry.macdScore ?? entry.scoreBreakdown?.macdScore ?? 0,
            bollingerScore: entry.bollingerScore ?? entry.scoreBreakdown?.bollingerScore ?? 0,
            momentumScore: entry.momentumScore ?? entry.scoreBreakdown?.momentumScore ?? 0,
            volatilityScore: entry.volatilityScore ?? entry.scoreBreakdown?.volatilityScore ?? 0,
            contractDuration: entry.contractDuration || entry.durationSeconds || 5,
            payout: entry.payout ?? (entry.pnl > 0 ? entry.pnl + 10 : 0),
            dataQuality: entry.dataQuality || (entry.dataQualityOk ? 'HEALTHY' : 'DEGRADED'),
            riskState: entry.riskState || { dailyLossPct: 0.0, maxDrawdownPct: 0.0, activePositions: 0 },
            signalInvalidationState: entry.signalInvalidationState || 'VALID'
        };
        this.inMemoryJournal.push(enrichedEntry);
        if (this.inMemoryJournal.length > 5000) {
            this.inMemoryJournal.shift();
        }
        try {
            await this.ensureTable();
            await database_1.pool.query(`INSERT INTO paper_trade_journal (
          id, signal_id, strategy_version, session_id, user_id, symbol, regime,
          direction, signal_score, ema_score, rsi_score, macd_score,
          bollinger_score, momentum_score, volatility_score,
          score_breakdown, indicator_values, entry_price, exit_price,
          contract_duration, payout, pnl, result, data_quality,
          data_quality_ok, risk_checks_passed, risk_state, signal_invalidation_state,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE pnl = VALUES(pnl), exit_price = VALUES(exit_price), result = VALUES(result)`, [
                enrichedEntry.id,
                enrichedEntry.signalId,
                enrichedEntry.strategyVersion,
                enrichedEntry.sessionId,
                enrichedEntry.userId,
                enrichedEntry.symbol,
                enrichedEntry.regime,
                enrichedEntry.direction,
                enrichedEntry.signalScore,
                enrichedEntry.emaScore,
                enrichedEntry.rsiScore,
                enrichedEntry.macdScore,
                enrichedEntry.bollingerScore,
                enrichedEntry.momentumScore,
                enrichedEntry.volatilityScore,
                JSON.stringify(enrichedEntry.scoreBreakdown || {}),
                JSON.stringify(enrichedEntry.indicatorValues || {}),
                enrichedEntry.entryPrice,
                enrichedEntry.exitPrice,
                enrichedEntry.contractDuration,
                enrichedEntry.payout,
                enrichedEntry.pnl,
                enrichedEntry.result,
                enrichedEntry.dataQuality,
                enrichedEntry.dataQualityOk ? 1 : 0,
                enrichedEntry.riskChecksPassed ? 1 : 0,
                JSON.stringify(enrichedEntry.riskState || {}),
                enrichedEntry.signalInvalidationState,
                enrichedEntry.createdAt
            ]);
        }
        catch (err) {
            console.warn('[PaperJournal] MySQL insert failed, entry kept in memory:', err.message);
        }
    }
    async getJournalEntries(filter) {
        const limit = filter?.limit || 1000;
        try {
            await this.ensureTable();
            let query = 'SELECT * FROM paper_trade_journal WHERE 1=1';
            const params = [];
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
            const [rows] = await database_1.pool.query(query, params);
            if (rows && rows.length > 0) {
                return rows.map((r) => ({
                    id: r.id,
                    signalId: r.signal_id,
                    strategyVersion: r.strategy_version,
                    sessionId: r.session_id,
                    userId: r.user_id,
                    symbol: r.symbol,
                    asset: r.symbol,
                    regime: r.regime,
                    direction: r.direction,
                    signalScore: r.signal_score,
                    emaScore: r.ema_score ?? 0,
                    rsiScore: r.rsi_score ?? 0,
                    macdScore: r.macd_score ?? 0,
                    bollingerScore: r.bollinger_score ?? 0,
                    momentumScore: r.momentum_score ?? 0,
                    volatilityScore: r.volatility_score ?? 0,
                    scoreBreakdown: typeof r.score_breakdown === 'string' ? JSON.parse(r.score_breakdown) : (r.score_breakdown || {}),
                    indicatorValues: typeof r.indicator_values === 'string' ? JSON.parse(r.indicator_values) : (r.indicator_values || {}),
                    entryPrice: parseFloat(r.entry_price),
                    exitPrice: parseFloat(r.exit_price),
                    contractDuration: r.contract_duration ?? 5,
                    durationSeconds: r.contract_duration ?? 5,
                    payout: parseFloat(r.payout || 0),
                    pnl: parseFloat(r.pnl),
                    result: r.result,
                    dataQuality: r.data_quality || 'HEALTHY',
                    dataQualityOk: Boolean(r.data_quality_ok),
                    riskChecksPassed: Boolean(r.risk_checks_passed),
                    riskState: typeof r.risk_state === 'string' ? JSON.parse(r.risk_state) : (r.risk_state || {}),
                    signalInvalidationState: r.signal_invalidation_state || 'VALID',
                    createdAt: new Date(r.created_at)
                }));
            }
        }
        catch (err) {
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
    /**
     * Generates a statistically representative Demo Validation Dataset (100–300 trades)
     * for loss analysis & cluster investigation across various market regimes, assets, and score buckets.
     */
    async seedValidationDataset(count = 150) {
        const assets = ['R_100', 'R_50', 'EUR/USD', 'GBP/USD'];
        const regimes = ['TRENDING_UP', 'TRENDING_DOWN', 'RANGING', 'HIGH_VOLATILITY', 'LOW_VOLATILITY'];
        const durations = [5, 15, 30, 60];
        const createdEntries = [];
        const now = Date.now();
        for (let i = 0; i < count; i++) {
            const asset = assets[i % assets.length];
            const regime = regimes[Math.floor(Math.random() * regimes.length)];
            const duration = durations[Math.floor(Math.random() * durations.length)];
            const strategyVersion = i % 3 === 0 ? 'STRATEGY_V1' : 'STRATEGY_V2';
            // Realistic score generation
            let score = 70 + Math.floor(Math.random() * 26);
            if (strategyVersion === 'STRATEGY_V1') {
                score = 50 + Math.floor(Math.random() * 45);
            }
            const direction = regime === 'TRENDING_UP'
                ? 'BUY'
                : regime === 'TRENDING_DOWN'
                    ? 'SELL'
                    : Math.random() > 0.5 ? 'BUY' : 'SELL';
            const emaScore = Math.min(25, Math.floor(score * 0.25));
            const rsiScore = Math.min(20, Math.floor(score * 0.20));
            const macdScore = Math.min(20, Math.floor(score * 0.20));
            const bollingerScore = Math.min(15, Math.floor(score * 0.15));
            const momentumScore = Math.min(10, Math.floor(score * 0.10));
            const volatilityScore = Math.min(10, Math.floor(score * 0.10));
            // Realistic outcome probability modeling
            // High score (>85) in TRENDING -> ~70% win rate
            // High score (80-89) in HIGH_VOLATILITY -> ~45% win rate (Loss Cluster Scenario)
            // RANGING + MACD without BB -> ~40% win rate (Loss Cluster Scenario)
            let winProb = 0.62;
            if (regime === 'HIGH_VOLATILITY' && score < 90) {
                winProb = 0.42; // Intended Loss Cluster
            }
            else if (regime === 'RANGING' && macdScore > 15 && bollingerScore < 8) {
                winProb = 0.38; // Intended Loss Cluster
            }
            else if (regime === 'TRENDING_UP' && direction === 'BUY' && score >= 85) {
                winProb = 0.72;
            }
            else if (regime === 'TRENDING_DOWN' && direction === 'SELL' && score >= 85) {
                winProb = 0.70;
            }
            const isWin = Math.random() < winProb;
            const tradeAmount = 10.0;
            const pnl = isWin
                ? Math.round(tradeAmount * 0.85 * 100) / 100
                : -tradeAmount;
            const basePrice = asset.startsWith('R_') ? 500.0 + Math.random() * 100 : 1.08 + Math.random() * 0.05;
            const entryPrice = Number(basePrice.toFixed(4));
            const exitPrice = direction === 'BUY'
                ? Number((isWin ? entryPrice * 1.0003 : entryPrice * 0.9997).toFixed(4))
                : Number((isWin ? entryPrice * 0.9997 : entryPrice * 1.0003).toFixed(4));
            const entry = {
                id: `DEMO-${Date.now()}-${i}-${crypto_1.default.randomBytes(2).toString('hex')}`,
                signalId: `SIG-${Date.now() - (count - i) * 60000}`,
                strategyVersion,
                sessionId: `SES-VALIDATION-V2`,
                userId: 1,
                symbol: asset,
                asset,
                direction,
                regime,
                signalScore: score,
                emaScore,
                rsiScore,
                macdScore,
                bollingerScore,
                momentumScore,
                volatilityScore,
                scoreBreakdown: {
                    emaScore,
                    rsiScore,
                    macdScore,
                    bollingerScore,
                    momentumScore,
                    volatilityScore,
                    totalScore: score,
                    scoreBucket: score >= 80 ? '80-100 (HIGH_QUALITY)' : score >= 70 ? '70-79 (CANDIDATE)' : score >= 60 ? '60-69 (WEAK)' : '0-59 (WAIT)',
                    confirmationsCount: (emaScore >= 15 ? 1 : 0) + (rsiScore >= 12 ? 1 : 0) + (macdScore >= 10 ? 1 : 0) + (bollingerScore >= 10 ? 1 : 0),
                    contributingIndicators: ['EMA_ALIGNMENT', 'RSI_MOMENTUM', 'MACD_CONFIRMATION'],
                    reasons: [`Score ${score}/100 in ${regime}`]
                },
                indicatorValues: {
                    ema21: entryPrice,
                    sma50: entryPrice * 0.998,
                    rsi14: 55,
                    macd: { value: 0.002, signal: 0.001, histogram: 0.001 },
                    bollinger: { upper: entryPrice * 1.002, middle: entryPrice, lower: entryPrice * 0.998 },
                    atr14: 0.45
                },
                entryPrice,
                exitPrice,
                contractDuration: duration,
                durationSeconds: duration,
                payout: isWin ? tradeAmount + pnl : 0,
                pnl,
                result: isWin ? 'WIN' : 'LOSS',
                dataQualityOk: true,
                dataQuality: 'HEALTHY',
                riskChecksPassed: true,
                riskState: { dailyLossPct: 0.01, maxDrawdownPct: 0.02, activePositions: 0 },
                signalInvalidationState: 'VALID',
                createdAt: new Date(now - (count - i) * 60000)
            };
            await this.recordEntry(entry);
            createdEntries.push(entry);
        }
        return createdEntries;
    }
}
exports.paperJournalService = new PaperJournalService();
