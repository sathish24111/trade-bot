"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDerivStatus = getDerivStatus;
exports.getDerivAssets = getDerivAssets;
exports.connectDerivDemo = connectDerivDemo;
exports.disconnectDerivDemo = disconnectDerivDemo;
exports.getDerivDemoProposal = getDerivDemoProposal;
exports.executeDerivDemoTrade = executeDerivDemoTrade;
const derivMarket_provider_1 = require("../services/market/derivMarket.provider");
const derivDemoTrading_service_1 = require("../services/trading/derivDemoTrading.service");
const paperSafety_service_1 = require("../services/security/paperSafety.service");
async function getDerivStatus(req, res, next) {
    try {
        const marketStatus = derivMarket_provider_1.derivMarketProvider.getStatus();
        const demoAccount = derivDemoTrading_service_1.derivDemoTradingService.getAccountInfo();
        return res.json({
            success: true,
            provider: marketStatus,
            demoTrading: demoAccount,
            ...paperSafety_service_1.paperSafetyService.getSafetyEnvelope()
        });
    }
    catch (err) {
        next(err);
    }
}
async function getDerivAssets(req, res, next) {
    try {
        const assets = await derivMarket_provider_1.derivMarketProvider.getAllAssets();
        return res.json({
            success: true,
            count: assets.length,
            assets,
            ...paperSafety_service_1.paperSafetyService.getSafetyEnvelope()
        });
    }
    catch (err) {
        next(err);
    }
}
async function connectDerivDemo(req, res, next) {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Deriv Demo API token is required in request body { "token": "..." }',
                ...paperSafety_service_1.paperSafetyService.getSafetyEnvelope()
            });
        }
        const account = await derivDemoTrading_service_1.derivDemoTradingService.connectDemo(token);
        return res.json({
            success: true,
            message: `Successfully connected to Deriv Demo Account (${account.loginId})`,
            account,
            ...paperSafety_service_1.paperSafetyService.getSafetyEnvelope()
        });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message || 'Failed to connect to Deriv Demo account',
            ...paperSafety_service_1.paperSafetyService.getSafetyEnvelope()
        });
    }
}
async function disconnectDerivDemo(req, res, next) {
    try {
        derivDemoTrading_service_1.derivDemoTradingService.disconnect();
        return res.json({
            success: true,
            message: 'Disconnected from Deriv Demo Account',
            ...paperSafety_service_1.paperSafetyService.getSafetyEnvelope()
        });
    }
    catch (err) {
        next(err);
    }
}
async function getDerivDemoProposal(req, res, next) {
    try {
        const { symbol = 'R_100', amount = 10, contractType = 'CALL', duration = 5, durationUnit = 't' } = req.body;
        const proposal = await derivDemoTrading_service_1.derivDemoTradingService.getProposal(symbol, Number(amount), contractType, Number(duration), durationUnit);
        return res.json({
            success: true,
            proposal,
            ...paperSafety_service_1.paperSafetyService.getSafetyEnvelope()
        });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message,
            ...paperSafety_service_1.paperSafetyService.getSafetyEnvelope()
        });
    }
}
async function executeDerivDemoTrade(req, res, next) {
    try {
        const { proposalId, price } = req.body;
        if (!proposalId || price === undefined) {
            return res.status(400).json({
                success: false,
                message: 'proposalId and price are required',
                ...paperSafety_service_1.paperSafetyService.getSafetyEnvelope()
            });
        }
        const result = await derivDemoTrading_service_1.derivDemoTradingService.executeDemoTrade(proposalId, Number(price));
        return res.json({
            success: true,
            result,
            ...paperSafety_service_1.paperSafetyService.getSafetyEnvelope()
        });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message,
            ...paperSafety_service_1.paperSafetyService.getSafetyEnvelope()
        });
    }
}
