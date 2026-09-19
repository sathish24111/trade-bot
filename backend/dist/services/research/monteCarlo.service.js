"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.monteCarloService = exports.MonteCarloService = void 0;
const crypto_1 = require("crypto");
const database_1 = require("../../config/database");
const MC_DISCLAIMER = 'Monte Carlo simulation resamples historical trade sequences to estimate variance in potential outcomes. This is a statistical demonstration and NOT a guarantee or prediction of future returns.';
class MonteCarloService {
    /**
     * Deterministic Mulberry32 PRNG generator for reproducible unit testing.
     */
    createPrng(seed) {
        let s = seed >>> 0;
        return () => {
            s = (s + 0x6d2b79f5) | 0;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    /**
     * Calculates percentile value from a pre-sorted numeric array.
     */
    getPercentile(sorted, p) {
        if (sorted.length === 0)
            return 0;
        const index = Math.floor((p / 100) * (sorted.length - 1));
        return Number(sorted[Math.max(0, Math.min(index, sorted.length - 1))].toFixed(2));
    }
    /**
     * Runs Monte Carlo simulation by randomly resampling historical trades with replacement.
     */
    async runSimulation(req, userId, strategyName) {
        const { trades, iterations = 500, initialBalance = 10000, seed } = req;
        if (!trades || trades.length === 0) {
            throw new Error('Cannot run Monte Carlo simulation without historical trades.');
        }
        const prng = seed !== undefined ? this.createPrng(seed) : Math.random;
        const finalBalances = [];
        const maxDrawdowns = [];
        let ruinCount = 0;
        const ruinThreshold = initialBalance * 0.5; // 50% capital drawdown = ruin threshold
        const sampleSize = trades.length;
        for (let iter = 0; iter < iterations; iter++) {
            let balance = initialBalance;
            let peak = initialBalance;
            let maxDd = 0;
            let hitRuin = false;
            for (let t = 0; t < sampleSize; t++) {
                const randomIndex = Math.floor(prng() * sampleSize);
                const trade = trades[randomIndex];
                balance += trade.pnl;
                if (balance > peak)
                    peak = balance;
                const dd = peak > 0 ? ((peak - balance) / peak) * 100 : 0;
                if (dd > maxDd)
                    maxDd = dd;
                if (balance <= ruinThreshold) {
                    hitRuin = true;
                }
            }
            finalBalances.push(balance);
            maxDrawdowns.push(maxDd);
            if (hitRuin)
                ruinCount++;
        }
        // Sort arrays for percentile calculation
        finalBalances.sort((a, b) => a - b);
        maxDrawdowns.sort((a, b) => a - b);
        const finalBalanceDistribution = {
            p5: this.getPercentile(finalBalances, 5),
            p25: this.getPercentile(finalBalances, 25),
            median: this.getPercentile(finalBalances, 50),
            p75: this.getPercentile(finalBalances, 75),
            p95: this.getPercentile(finalBalances, 95)
        };
        const maxDrawdownDistribution = {
            p5: this.getPercentile(maxDrawdowns, 5),
            p25: this.getPercentile(maxDrawdowns, 25),
            median: this.getPercentile(maxDrawdowns, 50),
            p75: this.getPercentile(maxDrawdowns, 75),
            p95: this.getPercentile(maxDrawdowns, 95)
        };
        const worstCaseDrawdown = Number(maxDrawdowns[maxDrawdowns.length - 1].toFixed(2));
        const ruinProbabilityPercent = Number(((ruinCount / iterations) * 100).toFixed(2));
        const result = {
            iterations,
            initialBalance,
            finalBalanceDistribution,
            maxDrawdownDistribution,
            worstCaseDrawdown,
            ruinProbabilityPercent,
            disclaimer: MC_DISCLAIMER,
            mode: 'PAPER',
            isRealMoney: false,
            historical: true,
            isPrediction: false
        };
        // Asynchronously record run in MySQL if user context is provided
        if (userId) {
            this.persistMonteCarloRun(result, userId, strategyName || 'CUSTOM').catch(err => {
                console.error('Failed to persist Monte Carlo run:', err.message);
            });
        }
        return result;
    }
    /**
     * Persists Monte Carlo run summary to MySQL.
     */
    async persistMonteCarloRun(res, userId, strategy) {
        const connection = await database_1.pool.getConnection();
        try {
            await connection.query(`INSERT INTO monte_carlo_runs (
          id, user_id, strategy, iterations, initial_balance,
          p5_balance, median_balance, p95_balance,
          median_drawdown, p95_drawdown, worst_case_drawdown, ruin_probability
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                (0, crypto_1.randomUUID)(),
                userId,
                strategy,
                res.iterations,
                res.initialBalance,
                res.finalBalanceDistribution.p5,
                res.finalBalanceDistribution.median,
                res.finalBalanceDistribution.p95,
                res.maxDrawdownDistribution.median,
                res.maxDrawdownDistribution.p95,
                res.worstCaseDrawdown,
                res.ruinProbabilityPercent
            ]);
        }
        finally {
            connection.release();
        }
    }
}
exports.MonteCarloService = MonteCarloService;
exports.monteCarloService = new MonteCarloService();
