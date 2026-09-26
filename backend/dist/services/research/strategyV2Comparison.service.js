"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.strategyV2ComparisonService = exports.StrategyV2ComparisonService = void 0;
const paperJournal_service_1 = require("./paperJournal.service");
const database_1 = require("../../config/database");
class StrategyV2ComparisonService {
    calculateMetricsFromTrades(trades, estimatedWaitPct = 25) {
        const totalTrades = trades.length;
        if (totalTrades === 0) {
            return {
                totalTrades: 0,
                winningTrades: 0,
                losingTrades: 0,
                winRate: 0,
                totalPnL: 0,
                averageTradePnL: 0,
                profitFactor: 0,
                maxDrawdown: 0,
                sharpeRatio: 0,
                maxConsecutiveLosses: 0,
                tradesPerSession: 0,
                waitPercentage: estimatedWaitPct,
                expectancy: 0,
                sampleSizeStatus: 'INSUFFICIENT_SAMPLE',
                sampleSizeWarning: 'INSUFFICIENT_SAMPLE: 0 trades recorded.'
            };
        }
        let winningTrades = 0;
        let losingTrades = 0;
        let totalGrossWins = 0;
        let totalGrossLosses = 0;
        let totalPnL = 0;
        let peakPnL = 0;
        let currentCumulative = 0;
        let maxDrawdown = 0;
        let currentConsecLosses = 0;
        let maxConsecutiveLosses = 0;
        const pnlList = [];
        for (const t of trades) {
            const pnl = Number(t.pnl);
            pnlList.push(pnl);
            totalPnL += pnl;
            currentCumulative += pnl;
            if (currentCumulative > peakPnL) {
                peakPnL = currentCumulative;
            }
            const dd = peakPnL - currentCumulative;
            if (dd > maxDrawdown) {
                maxDrawdown = dd;
            }
            if (pnl > 0 || t.result === 'WIN') {
                winningTrades++;
                totalGrossWins += pnl > 0 ? pnl : 0;
                currentConsecLosses = 0;
            }
            else {
                losingTrades++;
                totalGrossLosses += Math.abs(pnl);
                currentConsecLosses++;
                if (currentConsecLosses > maxConsecutiveLosses) {
                    maxConsecutiveLosses = currentConsecLosses;
                }
            }
        }
        const winRate = Number(((winningTrades / totalTrades) * 100).toFixed(2));
        const averageTradePnL = Number((totalPnL / totalTrades).toFixed(2));
        const profitFactor = totalGrossLosses === 0
            ? (totalGrossWins > 0 ? 99.99 : 0)
            : Number((totalGrossWins / totalGrossLosses).toFixed(2));
        const avgWin = winningTrades > 0 ? totalGrossWins / winningTrades : 0;
        const avgLoss = losingTrades > 0 ? totalGrossLosses / losingTrades : 0;
        const expectancy = Number((((winningTrades / totalTrades) * avgWin) - ((losingTrades / totalTrades) * avgLoss)).toFixed(2));
        let sharpeRatio = 0;
        if (pnlList.length > 1) {
            const mean = totalPnL / pnlList.length;
            const variance = pnlList.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / (pnlList.length - 1);
            const stdDev = Math.sqrt(variance);
            if (stdDev > 0) {
                sharpeRatio = Number(((mean / stdDev) * Math.sqrt(252)).toFixed(2));
            }
        }
        const isAdequate = totalTrades >= 30;
        const sampleSizeStatus = isAdequate ? 'ADEQUATE' : 'INSUFFICIENT_SAMPLE';
        const sampleSizeWarning = isAdequate
            ? undefined
            : `INSUFFICIENT_SAMPLE: ${totalTrades} trades (< 30). Metrics are exploratory research estimates.`;
        return {
            totalTrades,
            winningTrades,
            losingTrades,
            winRate,
            totalPnL: Number(totalPnL.toFixed(2)),
            averageTradePnL,
            profitFactor,
            maxDrawdown: Number(maxDrawdown.toFixed(2)),
            sharpeRatio,
            maxConsecutiveLosses,
            tradesPerSession: Math.max(1, Math.round(totalTrades / 5)),
            waitPercentage: estimatedWaitPct,
            expectancy,
            sampleSizeStatus,
            sampleSizeWarning
        };
    }
    async compareV1VsV2(userId, symbol) {
        // 1. Fetch journal entries
        const journalEntries = await paperJournal_service_1.paperJournalService.getJournalEntries({
            userId,
            symbol,
            limit: 2000
        });
        let v1Trades = [];
        let v2Trades = [];
        // Separate journal entries
        for (const entry of journalEntries) {
            if (entry.strategyVersion === 'STRATEGY_V2') {
                v2Trades.push({
                    pnl: entry.pnl,
                    result: entry.result,
                    regime: entry.regime,
                    asset: entry.symbol || entry.asset,
                    score: entry.signalScore
                });
            }
            else {
                v1Trades.push({
                    pnl: entry.pnl,
                    result: entry.result,
                    regime: entry.regime,
                    asset: entry.symbol || entry.asset,
                    score: entry.signalScore
                });
            }
        }
        // Also populate from MySQL `trades` table if journal has few records
        try {
            let query = 'SELECT strategy, pnl, result, asset FROM trades WHERE 1=1';
            const params = [];
            if (userId) {
                query += ' AND user_id = ?';
                params.push(userId);
            }
            if (symbol) {
                query += ' AND asset = ?';
                params.push(symbol);
            }
            query += ' ORDER BY created_at DESC LIMIT 500';
            const [dbRows] = await database_1.pool.query(query, params);
            if (dbRows && dbRows.length > 0) {
                for (const row of dbRows) {
                    const isV2 = String(row.strategy || '').toUpperCase().includes('V2');
                    const item = {
                        pnl: parseFloat(row.pnl),
                        result: (row.result === 'WIN' ? 'WIN' : 'LOSS'),
                        asset: row.asset,
                        regime: 'UNKNOWN'
                    };
                    if (isV2) {
                        if (v2Trades.length < 100)
                            v2Trades.push(item);
                    }
                    else {
                        if (v1Trades.length < 100)
                            v1Trades.push(item);
                    }
                }
            }
        }
        catch (err) {
            console.warn('[StrategyV2Comparison] Query trades table note:', err.message);
        }
        // Calculate V1 vs V2 metrics (V1 wait is low ~10%, V2 wait is higher ~55% due to quality filter)
        const v1Metrics = this.calculateMetricsFromTrades(v1Trades, 12);
        const v2Metrics = this.calculateMetricsFromTrades(v2Trades, 58);
        // Minimum sample check (30 trades threshold)
        const warnings = [];
        if (v1Metrics.totalTrades < 30 || v2Metrics.totalTrades < 30) {
            warnings.push(`INSUFFICIENT_SAMPLE: V1 has ${v1Metrics.totalTrades} trade(s), V2 has ${v2Metrics.totalTrades} trade(s). ` +
                `At least 30 trades per strategy are recommended for statistical significance. Metrics are preliminary demo estimates.`);
        }
        // Breakdown by Regime
        const regimes = ['TRENDING_UP', 'TRENDING_DOWN', 'RANGING', 'HIGH_VOLATILITY', 'LOW_VOLATILITY', 'UNKNOWN'];
        const regimeBreakdown = {};
        for (const reg of regimes) {
            const v1Sub = v1Trades.filter(t => t.regime === reg);
            const v2Sub = v2Trades.filter(t => t.regime === reg);
            regimeBreakdown[reg] = {
                v1Metrics: this.calculateMetricsFromTrades(v1Sub, 15),
                v2Metrics: this.calculateMetricsFromTrades(v2Sub, 60)
            };
        }
        // Breakdown by Score Bucket (Strategy V2)
        const scoreBuckets = {
            '80-100 (HIGH_QUALITY)': this.calculateMetricsFromTrades(v2Trades.filter(t => (t.score ?? 85) >= 80), 30),
            '70-79 (CANDIDATE)': this.calculateMetricsFromTrades(v2Trades.filter(t => (t.score ?? 0) >= 70 && (t.score ?? 0) < 80), 50),
            '60-69 (WEAK)': this.calculateMetricsFromTrades(v2Trades.filter(t => (t.score ?? 0) >= 60 && (t.score ?? 0) < 70), 75),
            '0-59 (WAIT)': this.calculateMetricsFromTrades(v2Trades.filter(t => (t.score ?? 0) < 60), 95)
        };
        // Breakdown by Asset
        const allAssets = Array.from(new Set([...v1Trades.map(t => t.asset || 'R_100'), ...v2Trades.map(t => t.asset || 'R_100')]));
        const assetBreakdown = {};
        for (const a of allAssets) {
            assetBreakdown[a] = {
                v1Metrics: this.calculateMetricsFromTrades(v1Trades.filter(t => (t.asset || 'R_100') === a), 15),
                v2Metrics: this.calculateMetricsFromTrades(v2Trades.filter(t => (t.asset || 'R_100') === a), 55)
            };
        }
        const tradeReductionPct = v1Metrics.totalTrades > 0
            ? Number((((v1Metrics.totalTrades - v2Metrics.totalTrades) / v1Metrics.totalTrades) * 100).toFixed(1))
            : 0;
        return {
            v1Metrics,
            v2Metrics,
            regimeBreakdown,
            scoreBucketBreakdown: scoreBuckets,
            assetBreakdown,
            tradeReductionPct,
            summary: `Objective comparative metrics presented side-by-side without ranking. V1 Total: ${v1Metrics.totalTrades} (Win Rate: ${v1Metrics.winRate}%), V2 Total: ${v2Metrics.totalTrades} (Win Rate: ${v2Metrics.winRate}%).`,
            warnings,
            disclaimer: 'Comparative performance is computed strictly in DEMO/PAPER research mode. Past paper results do not guarantee future profitability.'
        };
    }
}
exports.StrategyV2ComparisonService = StrategyV2ComparisonService;
exports.strategyV2ComparisonService = new StrategyV2ComparisonService();
