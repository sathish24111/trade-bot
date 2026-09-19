"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBacktest = runBacktest;
exports.compareStrategies = compareStrategies;
exports.getBacktestHistory = getBacktestHistory;
exports.getBacktestById = getBacktestById;
const backtesting_service_1 = require("../services/backtesting.service");
async function runBacktest(req, res, next) {
    try {
        const userId = req.user.userId;
        const { asset, timeframe, strategy, candles, initialBalance, tradeAmount, spread, slippage, fee } = req.body;
        if (!asset || !strategy) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters: asset and strategy are required.'
            });
        }
        const result = await backtesting_service_1.backtestingService.runBacktest({
            userId,
            asset,
            timeframe: timeframe || '5m',
            strategy,
            candles,
            initialBalance: initialBalance ? parseFloat(initialBalance) : undefined,
            tradeAmount: tradeAmount ? parseFloat(tradeAmount) : undefined,
            spread: spread !== undefined ? parseFloat(spread) : undefined,
            slippage: slippage !== undefined ? parseFloat(slippage) : undefined,
            fee: fee !== undefined ? parseFloat(fee) : undefined
        });
        res.json({
            success: true,
            result
        });
    }
    catch (err) {
        res.status(400).json({
            success: false,
            error: err.message || 'Backtest execution failed.'
        });
    }
}
async function compareStrategies(req, res, next) {
    try {
        const userId = req.user.userId;
        const { asset, timeframe, count, initialBalance } = req.body;
        if (!asset) {
            return res.status(400).json({
                success: false,
                error: 'Asset parameter is required.'
            });
        }
        const result = await backtesting_service_1.backtestingService.compareStrategies(userId, asset, timeframe || '5m', count ? parseInt(count, 10) : 100, initialBalance ? parseFloat(initialBalance) : 10000);
        res.json({
            success: true,
            ...result
        });
    }
    catch (err) {
        res.status(400).json({
            success: false,
            error: err.message || 'Strategy comparison failed.'
        });
    }
}
async function getBacktestHistory(req, res, next) {
    try {
        const userId = req.user.userId;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
        const history = await backtesting_service_1.backtestingService.getUserBacktests(userId, limit);
        res.json({
            success: true,
            history,
            mode: 'PAPER'
        });
    }
    catch (err) {
        next(err);
    }
}
async function getBacktestById(req, res, next) {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const backtest = await backtesting_service_1.backtestingService.getBacktestById(id, userId);
        if (!backtest) {
            return res.status(404).json({
                success: false,
                error: 'Backtest run not found.'
            });
        }
        res.json({
            success: true,
            backtest
        });
    }
    catch (err) {
        next(err);
    }
}
