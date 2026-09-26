"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startSession = startSession;
exports.getSession = getSession;
exports.stopSession = stopSession;
exports.executeTrade = executeTrade;
exports.getUserSessions = getUserSessions;
const zod_1 = require("zod");
const paperExecution_service_1 = require("../services/paperExecution.service");
const startSessionSchema = zod_1.z.object({
    investmentAmount: zod_1.z.number().positive('Investment amount must be positive'),
    asset: zod_1.z.string().optional().default('R_100'),
    strategy: zod_1.z.enum(['EMA_RSI', 'MACD', 'BOLLINGER_BANDS', 'MULTI_INDICATOR', 'STRATEGY_V2', 'ABC_COMBO']),
    riskLevel: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH']),
    duration: zod_1.z.number().int().min(1).max(240).default(30)
});
async function startSession(req, res, next) {
    try {
        const data = startSessionSchema.parse(req.body);
        const userId = req.user.userId;
        const session = await paperExecution_service_1.paperExecutionEngine.startSession(userId, data.investmentAmount, data.strategy, data.riskLevel, data.duration, data.asset);
        res.status(201).json({
            success: true,
            sessionId: session.id,
            status: session.status,
            startingBalance: session.starting_balance,
            configuration: {
                investmentAmount: session.investment_amount,
                strategy: session.strategy,
                riskLevel: session.risk_level,
                duration: session.duration
            },
            mode: 'DEMO MODE',
            disclaimer: 'Trading involves risk. Demo performance does not guarantee future results.'
        });
    }
    catch (err) {
        next(err);
    }
}
async function getSession(req, res, next) {
    try {
        const session = await paperExecution_service_1.paperExecutionEngine.getSessionById(req.params.id);
        if (!session) {
            return res.status(404).json({ success: false, error: 'Session not found.' });
        }
        res.json({
            success: true,
            session,
            mode: 'DEMO MODE'
        });
    }
    catch (err) {
        next(err);
    }
}
async function stopSession(req, res, next) {
    try {
        const session = await paperExecution_service_1.paperExecutionEngine.stopSession(req.params.id, 'Stopped by user');
        res.json({
            success: true,
            sessionId: session.id,
            status: session.status,
            endingBalance: session.ending_balance,
            currentPnL: session.current_pnl,
            mode: 'DEMO MODE'
        });
    }
    catch (err) {
        next(err);
    }
}
async function executeTrade(req, res, next) {
    try {
        const { asset = 'BTC/USD', direction = 'BUY', amount = 500, strategy = 'EMA_RSI' } = req.body;
        const trade = await paperExecution_service_1.paperExecutionEngine.executeSimulatedTrade({
            userId: req.user?.userId || 1,
            asset,
            direction,
            amount,
            strategy,
            entryPrice: 65000
        });
        res.json({
            success: true,
            trade,
            mode: 'DEMO MODE',
            isRealMoney: false
        });
    }
    catch (err) {
        next(err);
    }
}
async function getUserSessions(req, res, next) {
    try {
        const sessions = await paperExecution_service_1.paperExecutionEngine.getUserSessions(req.user.userId);
        res.json({
            success: true,
            sessions,
            mode: 'DEMO MODE'
        });
    }
    catch (err) {
        next(err);
    }
}
