"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllAssets = getAllAssets;
exports.getAsset = getAsset;
exports.getCandles = getCandles;
exports.getQuote = getQuote;
const market_service_1 = require("../services/market.service");
async function getAllAssets(req, res, next) {
    try {
        const assets = await market_service_1.marketService.getAllAssets();
        res.json({
            success: true,
            assets,
            dataSource: 'SIMULATED MARKET DATA',
            mode: 'DEMO MODE',
            disclaimer: 'Trading involves risk. Demo performance does not guarantee future results.'
        });
    }
    catch (err) {
        next(err);
    }
}
async function getAsset(req, res, next) {
    try {
        const timeframe = req.query.timeframe || '5m';
        const asset = await market_service_1.marketService.getAsset(req.params.asset, timeframe);
        if (!asset) {
            return res.status(404).json({
                success: false,
                error: `Asset ${req.params.asset} is not supported by active provider`
            });
        }
        res.json({
            success: true,
            asset,
            mode: 'DEMO MODE'
        });
    }
    catch (err) {
        next(err);
    }
}
async function getCandles(req, res, next) {
    try {
        const timeframe = req.query.timeframe || '5m';
        const count = req.query.count ? parseInt(req.query.count, 10) : 60;
        const candles = await market_service_1.marketService.getCandles(req.params.asset, timeframe, count);
        res.json({
            success: true,
            asset: req.params.asset,
            timeframe,
            candles,
            mode: 'DEMO MODE'
        });
    }
    catch (err) {
        res.status(400).json({
            success: false,
            error: err.message || `Failed to fetch candles for ${req.params.asset}`
        });
    }
}
async function getQuote(req, res, next) {
    try {
        const timeframe = req.query.timeframe || '5m';
        const quote = await market_service_1.marketService.getQuote(req.params.asset, timeframe);
        res.json({
            success: true,
            ...quote
        });
    }
    catch (err) {
        res.status(400).json({
            success: false,
            error: err.message || `Failed to fetch quote for ${req.params.asset}`
        });
    }
}
