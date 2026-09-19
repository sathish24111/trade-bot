"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsService = exports.MetricsService = void 0;
class MetricsService {
    /**
     * Calculates comprehensive institutional-grade risk, return, and expectancy metrics.
     * Ensures null safety for divisions by zero, single trades, and zero variance.
     */
    calculateMetrics(trades, equityCurve, initialBalance = 10000) {
        const totalTrades = trades.length;
        const winningTradesList = trades.filter(t => t.pnl > 0);
        const losingTradesList = trades.filter(t => t.pnl < 0);
        const winningTrades = winningTradesList.length;
        const losingTrades = losingTradesList.length;
        const winRate = totalTrades > 0 ? Number(((winningTrades / totalTrades) * 100).toFixed(2)) : 0;
        const grossProfit = Number(winningTradesList.reduce((sum, t) => sum + t.pnl, 0).toFixed(2));
        const grossLoss = Number(Math.abs(losingTradesList.reduce((sum, t) => sum + t.pnl, 0)).toFixed(2));
        const netPnl = Number((grossProfit - grossLoss).toFixed(2));
        const finalBalance = Number((initialBalance + netPnl).toFixed(2));
        const returnPercent = initialBalance > 0 ? Number(((netPnl / initialBalance) * 100).toFixed(2)) : 0;
        const averageWin = winningTrades > 0 ? Number((grossProfit / winningTrades).toFixed(2)) : 0;
        const averageLoss = losingTrades > 0 ? Number((grossLoss / losingTrades).toFixed(2)) : 0;
        const winLossRatio = averageLoss > 0 ? Number((averageWin / averageLoss).toFixed(2)) : null;
        const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : (grossProfit > 0 ? 99.99 : 0);
        // Expectancy = (WinRate * AvgWin) - (LossRate * AvgLoss)
        const winProb = totalTrades > 0 ? winningTrades / totalTrades : 0;
        const lossProb = totalTrades > 0 ? losingTrades / totalTrades : 0;
        const expectancy = Number((winProb * averageWin - lossProb * averageLoss).toFixed(2));
        // Consecutive wins / losses
        let currentWins = 0;
        let maxWins = 0;
        let currentLosses = 0;
        let maxLosses = 0;
        for (const trade of trades) {
            if (trade.pnl > 0) {
                currentWins++;
                if (currentWins > maxWins)
                    maxWins = currentWins;
                currentLosses = 0;
            }
            else if (trade.pnl < 0) {
                currentLosses++;
                if (currentLosses > maxLosses)
                    maxLosses = currentLosses;
                currentWins = 0;
            }
            else {
                currentWins = 0;
                currentLosses = 0;
            }
        }
        // Drawdown analysis from equity curve
        let peakEquity = initialBalance;
        let maxDrawdownPercent = 0;
        let maxDrawdownAmount = 0;
        let currentDrawdownBars = 0;
        let maxDrawdownDurationBars = 0;
        const drawdowns = [];
        for (const point of equityCurve) {
            const eq = point.equity;
            if (eq > peakEquity) {
                peakEquity = eq;
                currentDrawdownBars = 0;
            }
            else {
                currentDrawdownBars++;
                if (currentDrawdownBars > maxDrawdownDurationBars) {
                    maxDrawdownDurationBars = currentDrawdownBars;
                }
            }
            const ddDollar = Math.max(0, peakEquity - eq);
            const ddPercent = peakEquity > 0 ? (ddDollar / peakEquity) * 100 : 0;
            if (ddPercent > maxDrawdownPercent) {
                maxDrawdownPercent = ddPercent;
            }
            if (ddDollar > maxDrawdownAmount) {
                maxDrawdownAmount = ddDollar;
            }
            if (ddPercent > 0) {
                drawdowns.push(ddPercent);
            }
        }
        const averageDrawdownPercent = drawdowns.length > 0
            ? Number((drawdowns.reduce((sum, d) => sum + d, 0) / drawdowns.length).toFixed(2))
            : 0;
        const recoveryFactor = maxDrawdownAmount > 0 && netPnl > 0
            ? Number((netPnl / maxDrawdownAmount).toFixed(2))
            : null;
        // Institutional Risk Ratios (Sharpe, Sortino, Calmar)
        const { sharpeRatio, sortinoRatio } = this.calculateSharpeAndSortino(trades);
        const calmarRatio = this.calculateCalmar(returnPercent, maxDrawdownPercent, equityCurve);
        // Sample Size Assessment
        let sampleSizeRating = 'ADEQUATE';
        let sampleSizeWarning = undefined;
        if (totalTrades < 10) {
            sampleSizeRating = 'VERY_SMALL';
            sampleSizeWarning = 'Sample size is very small (<10 trades). Statistical metrics lack statistical reliability.';
        }
        else if (totalTrades < 30) {
            sampleSizeRating = 'LIMITED';
            sampleSizeWarning = 'Limited sample size (<30 trades). Interpret risk-adjusted metrics with caution.';
        }
        else if (totalTrades < 100) {
            sampleSizeRating = 'MODERATE';
        }
        // Monthly Performance Breakdown
        const monthlyPerformance = this.aggregateMonthlyPerformance(trades, initialBalance);
        return {
            initialBalance,
            finalBalance,
            netPnl,
            returnPercent,
            grossProfit,
            grossLoss,
            totalTrades,
            winningTrades,
            losingTrades,
            winRate,
            maxDrawdownPercent: Number(maxDrawdownPercent.toFixed(2)),
            maxDrawdownDurationBars,
            averageDrawdownPercent,
            recoveryFactor,
            averageWin,
            averageLoss,
            winLossRatio,
            profitFactor,
            expectancy,
            maxConsecutiveWins: maxWins,
            maxConsecutiveLosses: maxLosses,
            sharpeRatio,
            sortinoRatio,
            calmarRatio,
            sampleSizeRating,
            sampleSizeWarning,
            monthlyPerformance
        };
    }
    /**
     * Sharpe Ratio & Sortino Ratio calculation with safe boundary handling.
     * Returns null if trades < 2, or if variance is 0.
     */
    calculateSharpeAndSortino(trades) {
        if (trades.length < 2) {
            return { sharpeRatio: null, sortinoRatio: null };
        }
        const tradeReturns = trades.map(t => (t.amount > 0 ? t.pnl / t.amount : 0));
        const n = tradeReturns.length;
        const meanReturn = tradeReturns.reduce((sum, r) => sum + r, 0) / n;
        // Variance & Standard Deviation
        const variance = tradeReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (n - 1);
        const stdDev = Math.sqrt(variance);
        // Downside deviation (penalizing only negative returns)
        const downsideReturns = tradeReturns.map(r => Math.min(0, r));
        const downsideVariance = downsideReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / n;
        const downsideDeviation = Math.sqrt(downsideVariance);
        // Annualization factor (assume standard 252 periods/trades scale)
        const annualFactor = Math.sqrt(252);
        const sharpeRatio = stdDev > 0.000001
            ? Number(((meanReturn / stdDev) * annualFactor).toFixed(2))
            : null;
        const sortinoRatio = downsideDeviation > 0.000001
            ? Number(((meanReturn / downsideDeviation) * annualFactor).toFixed(2))
            : null;
        return { sharpeRatio, sortinoRatio };
    }
    /**
     * Calmar Ratio = Annualized Return / Max Drawdown
     */
    calculateCalmar(returnPercent, maxDrawdownPercent, equityCurve) {
        if (maxDrawdownPercent <= 0)
            return null;
        let durationYears = 1.0;
        if (equityCurve.length >= 2) {
            const startTime = new Date(equityCurve[0].timestamp).getTime();
            const endTime = new Date(equityCurve[equityCurve.length - 1].timestamp).getTime();
            const diffMs = endTime - startTime;
            if (diffMs > 0) {
                const days = diffMs / (1000 * 60 * 60 * 24);
                durationYears = Math.max(0.08, days / 365.25); // minimum ~1 month
            }
        }
        const annualizedReturnPercent = returnPercent / durationYears;
        const calmar = annualizedReturnPercent / maxDrawdownPercent;
        return isFinite(calmar) ? Number(calmar.toFixed(2)) : null;
    }
    /**
     * Groups trade history by YYYY-MM and computes period statistics.
     */
    aggregateMonthlyPerformance(trades, initialBalance) {
        const monthsMap = new Map();
        for (const trade of trades) {
            const monthKey = trade.timestamp.substring(0, 7); // 'YYYY-MM'
            const list = monthsMap.get(monthKey) || [];
            list.push(trade);
            monthsMap.set(monthKey, list);
        }
        const sortedMonths = Array.from(monthsMap.keys()).sort();
        const result = [];
        let currentBalance = initialBalance;
        for (const month of sortedMonths) {
            const monthTrades = monthsMap.get(month);
            const tradesCount = monthTrades.length;
            const winningTrades = monthTrades.filter(t => t.pnl > 0).length;
            const losingTrades = monthTrades.filter(t => t.pnl < 0).length;
            const winRate = tradesCount > 0 ? Number(((winningTrades / tradesCount) * 100).toFixed(2)) : 0;
            const netPnl = Number(monthTrades.reduce((sum, t) => sum + t.pnl, 0).toFixed(2));
            const returnPercent = currentBalance > 0 ? Number(((netPnl / currentBalance) * 100).toFixed(2)) : 0;
            // Month max drawdown
            let peak = currentBalance;
            let monthBal = currentBalance;
            let maxDd = 0;
            for (const t of monthTrades) {
                monthBal += t.pnl;
                if (monthBal > peak)
                    peak = monthBal;
                const dd = peak > 0 ? ((peak - monthBal) / peak) * 100 : 0;
                if (dd > maxDd)
                    maxDd = dd;
            }
            result.push({
                month,
                tradesCount,
                winningTrades,
                losingTrades,
                winRate,
                netPnl,
                returnPercent,
                maxDrawdown: Number(maxDd.toFixed(2))
            });
            currentBalance = Number((currentBalance + netPnl).toFixed(2));
        }
        return result;
    }
    /**
     * Computes Wilson score interval for win rate and normal confidence interval for expectancy
     */
    calculateConfidenceIntervals(trades, confidence = 0.95) {
        const n = trades.length;
        if (n < 5) {
            return {
                winRateInterval: { lower: 0, upper: 0, isSufficient: false },
                expectancyInterval: { lower: 0, upper: 0, isSufficient: false }
            };
        }
        const wins = trades.filter(t => t.pnl > 0).length;
        const p = wins / n;
        const z = 1.96; // 95% confidence
        const z2 = z * z;
        // Wilson Score Interval for win rate proportion
        const denom = 1 + z2 / n;
        const center = (p + z2 / (2 * n)) / denom;
        const margin = (z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n)) / denom;
        const lowerWin = Math.max(0, Math.round((center - margin) * 100 * 10) / 10);
        const upperWin = Math.min(100, Math.round((center + margin) * 100 * 10) / 10);
        // Normal approximation for expectancy
        const pnls = trades.map(t => t.pnl);
        const meanPnl = pnls.reduce((a, b) => a + b, 0) / n;
        const variance = pnls.reduce((sum, val) => sum + Math.pow(val - meanPnl, 2), 0) / Math.max(1, n - 1);
        const sem = Math.sqrt(variance / n);
        const lowerExp = Math.round((meanPnl - z * sem) * 100) / 100;
        const upperExp = Math.round((meanPnl + z * sem) * 100) / 100;
        return {
            winRateInterval: { lower: lowerWin, upper: upperWin, isSufficient: n >= 30 },
            expectancyInterval: { lower: lowerExp, upper: upperExp, isSufficient: n >= 30 }
        };
    }
}
exports.MetricsService = MetricsService;
exports.metricsService = new MetricsService();
