"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSummary = getSummary;
exports.getDaily = getDaily;
exports.getTrades = getTrades;
const performance_service_1 = require("../services/performance.service");
async function getSummary(req, res, next) {
    try {
        const summary = await performance_service_1.performanceService.getSummary(req.user.userId);
        res.json({
            success: true,
            summary,
            mode: 'DEMO MODE',
            disclaimer: 'Trading involves risk. Demo performance does not guarantee future results.'
        });
    }
    catch (err) {
        next(err);
    }
}
async function getDaily(req, res, next) {
    try {
        const summary = await performance_service_1.performanceService.getSummary(req.user.userId);
        res.json({
            success: true,
            dailyPerformances: summary.dailyPerformances,
            mode: 'DEMO MODE'
        });
    }
    catch (err) {
        next(err);
    }
}
async function getTrades(req, res, next) {
    try {
        const filter = req.query.filter;
        const limit = parseInt(req.query.limit || '50', 10);
        const offset = parseInt(req.query.offset || '0', 10);
        const trades = await performance_service_1.performanceService.getTrades(req.user.userId, limit, offset, filter);
        res.json({
            success: true,
            trades,
            mode: 'DEMO MODE'
        });
    }
    catch (err) {
        next(err);
    }
}
