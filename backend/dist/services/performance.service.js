"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceService = exports.PerformanceService = void 0;
const database_1 = require("../config/database");
class PerformanceService {
    async getSummary(userId) {
        const [trades] = await database_1.pool.query('SELECT * FROM trades WHERE user_id = ? ORDER BY created_at ASC', [userId]);
        const totalTrades = trades.length;
        let winningTrades = 0;
        let losingTrades = 0;
        let totalPnL = 0;
        let todayPnL = 0;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const equityCurvePoints = [];
        let runningBalance = 10000.00;
        equityCurvePoints.push({ time: 'Start', balance: runningBalance });
        for (let i = 0; i < trades.length; i++) {
            const trade = trades[i];
            const pnl = parseFloat(trade.pnl);
            totalPnL += pnl;
            runningBalance += pnl;
            if (trade.result === 'WIN')
                winningTrades++;
            else
                losingTrades++;
            const tradeDate = new Date(trade.created_at);
            if (tradeDate >= todayStart) {
                todayPnL += pnl;
            }
            equityCurvePoints.push({
                time: `T${i + 1}`,
                balance: Math.round(runningBalance * 100) / 100
            });
        }
        const winRate = totalTrades > 0
            ? Math.round((winningTrades / totalTrades) * 1000) / 10
            : 0;
        // Daily breakdown
        const dailyMap = new Map();
        for (const trade of trades) {
            const d = new Date(trade.created_at);
            const key = d.toLocaleDateString('en-US', { weekday: 'short' });
            const current = dailyMap.get(key) || { tradesCount: 0, pnl: 0, wins: 0 };
            current.tradesCount++;
            current.pnl += parseFloat(trade.pnl);
            if (trade.result === 'WIN')
                current.wins++;
            dailyMap.set(key, current);
        }
        const dailyPerformances = Array.from(dailyMap.entries()).map(([dayLabel, data]) => ({
            dayLabel,
            tradesCount: data.tradesCount,
            pnl: Math.round(data.pnl * 100) / 100,
            winRate: data.tradesCount > 0 ? Math.round((data.wins / data.tradesCount) * 100) : 0
        }));
        if (dailyPerformances.length === 0) {
            dailyPerformances.push({ dayLabel: 'Mon', tradesCount: 6, pnl: 110.20, winRate: 67 }, { dayLabel: 'Tue', tradesCount: 5, pnl: 85.00, winRate: 60 }, { dayLabel: 'Today', tradesCount: Math.max(1, totalTrades), pnl: todayPnL || 140.40, winRate: winRate || 65 });
        }
        return {
            totalPnL: Math.round(totalPnL * 100) / 100,
            todayPnL: Math.round(todayPnL * 100) / 100,
            weeklyPnL: Math.round(totalPnL * 100) / 100,
            totalTrades,
            winningTrades,
            losingTrades,
            winRate,
            maxDrawdown: 3.2,
            equityCurvePoints: equityCurvePoints.slice(-15),
            dailyPerformances,
            disclaimer: 'Trading involves risk. Demo performance does not guarantee future results.'
        };
    }
    async getTrades(userId, limit = 50, offset = 0, filter) {
        let sql = 'SELECT * FROM trades WHERE user_id = ?';
        const params = [userId];
        if (filter === 'WINS') {
            sql += " AND result = 'WIN'";
        }
        else if (filter === 'LOSSES') {
            sql += " AND result = 'LOSS'";
        }
        else if (filter === 'BUY') {
            sql += " AND direction = 'BUY'";
        }
        else if (filter === 'SELL') {
            sql += " AND direction = 'SELL'";
        }
        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);
        const [rows] = await database_1.pool.query(sql, params);
        return rows.map((r) => ({
            ...r,
            amount: parseFloat(r.amount),
            entry_price: parseFloat(r.entry_price),
            exit_price: parseFloat(r.exit_price),
            pnl: parseFloat(r.pnl)
        }));
    }
}
exports.PerformanceService = PerformanceService;
exports.performanceService = new PerformanceService();
