"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paperExecutionEngine = exports.PaperExecutionEngine = void 0;
const database_1 = require("../config/database");
const market_service_1 = require("./market.service");
const strategy_service_1 = require("./strategy.service");
const risk_service_1 = require("./risk.service");
const websocket_server_1 = require("../websocket/websocket.server");
const crypto_1 = __importDefault(require("crypto"));
class PaperExecutionEngine {
    activeSessions = new Map();
    // Boundary check: This engine executes PAPER/DEMO orders only.
    executionMode = 'DEMO_PAPER_TRADING_ONLY';
    async startSession(userId, investmentAmount, strategy, riskLevel, durationMinutes) {
        // 1. Check if user already has an active session
        for (const active of this.activeSessions.values()) {
            if (active.session.user_id === userId && (active.session.status === 'RUNNING' || active.session.status === 'STARTING')) {
                throw new Error('A demo trading session is already active for this account.');
            }
        }
        // 2. Fetch user balance from MySQL
        const [userRows] = await database_1.pool.query('SELECT demo_balance FROM users WHERE id = ?', [userId]);
        if (userRows.length === 0) {
            throw new Error('User not found.');
        }
        const currentBalance = parseFloat(userRows[0].demo_balance);
        if (investmentAmount <= 0) {
            throw new Error('Investment amount must be greater than ₹0.');
        }
        if (investmentAmount > currentBalance) {
            throw new Error(`Investment amount exceeds available demo balance (₹${currentBalance.toFixed(2)}).`);
        }
        const sessionId = `SES-${Date.now()}-${crypto_1.default.randomBytes(3).toString('hex')}`;
        const totalSeconds = durationMinutes * 60;
        const initialSession = {
            id: sessionId,
            user_id: userId,
            investment_amount: investmentAmount,
            strategy,
            risk_level: riskLevel,
            duration: durationMinutes,
            starting_balance: currentBalance,
            ending_balance: null,
            current_pnl: 0.00,
            status: 'STARTING',
            termination_reason: null,
            started_at: new Date(),
            ended_at: null
        };
        // 3. Persist session into MySQL
        await database_1.pool.query(`INSERT INTO trading_sessions (id, user_id, investment_amount, strategy, risk_level, duration, starting_balance, status, current_pnl)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            sessionId,
            userId,
            investmentAmount,
            strategy,
            riskLevel,
            durationMinutes,
            currentBalance,
            'STARTING',
            0.00
        ]);
        const activeState = {
            session: initialSession,
            elapsedSeconds: 0,
            remainingSeconds: totalSeconds,
            timer: null,
            tradesCount: 0,
            winCount: 0,
            lossCount: 0,
            logs: [
                `[${this.formatTime()}] Initializing ${strategy} paper engine in DEMO MODE...`,
                `[${this.formatTime()}] Risk profile: ${riskLevel} (Max risk per trade)`,
                `[${this.formatTime()}] Daily loss protection active (5% of balance)`
            ]
        };
        this.activeSessions.set(sessionId, activeState);
        // Transition from STARTING to RUNNING after 1 second warm-up
        setTimeout(async () => {
            if (!this.activeSessions.has(sessionId))
                return;
            const s = this.activeSessions.get(sessionId);
            s.session.status = 'RUNNING';
            s.logs.push(`[${this.formatTime()}] SIMULATED MARKET DATA active. Running paper strategy...`);
            await database_1.pool.query('UPDATE trading_sessions SET status = ? WHERE id = ?', ['RUNNING', sessionId]);
            (0, websocket_server_1.broadcastEvent)({
                type: 'BOT_STATUS',
                sessionId,
                status: 'RUNNING',
                elapsedSeconds: 0,
                currentPnL: 0,
                tradesCount: 0,
                winRate: 0,
                logs: s.logs,
                mode: 'DEMO MODE'
            });
            this.startSimulationLoop(sessionId, totalSeconds);
        }, 1000);
        return initialSession;
    }
    startSimulationLoop(sessionId, totalSeconds) {
        const interval = setInterval(async () => {
            const activeState = this.activeSessions.get(sessionId);
            if (!activeState || activeState.session.status !== 'RUNNING') {
                clearInterval(interval);
                return;
            }
            activeState.elapsedSeconds++;
            activeState.remainingSeconds--;
            // 1. Advance simulated market data
            market_service_1.marketService.tick();
            // 2. Evaluate Strategy & Risk every 5 simulated seconds
            if (activeState.elapsedSeconds > 0 && activeState.elapsedSeconds % 5 === 0) {
                await this.executePaperCycle(sessionId);
            }
            const winRate = activeState.tradesCount > 0
                ? Math.round((activeState.winCount / activeState.tradesCount) * 1000) / 10
                : 0;
            // Broadcast BOT_STATUS
            (0, websocket_server_1.broadcastEvent)({
                type: 'BOT_STATUS',
                sessionId,
                status: activeState.session.status,
                elapsedSeconds: activeState.elapsedSeconds,
                remainingSeconds: activeState.remainingSeconds,
                currentPnL: activeState.session.current_pnl,
                tradesCount: activeState.tradesCount,
                winRate,
                logs: activeState.logs.slice(-15),
                mode: 'DEMO MODE'
            });
            // Check duration completion
            if (activeState.elapsedSeconds >= totalSeconds) {
                clearInterval(interval);
                await this.completeSession(sessionId, 'Trading session duration completed.');
            }
        }, 1000);
        const active = this.activeSessions.get(sessionId);
        if (active) {
            active.timer = interval;
        }
    }
    async executePaperCycle(sessionId) {
        const active = this.activeSessions.get(sessionId);
        if (!active)
            return;
        const { session } = active;
        const assets = await market_service_1.marketService.getAllAssets();
        const asset = assets[0]; // EUR/USD
        // Boundary: Pipeline: Market Data -> Strategy -> Risk -> Paper Execution Only
        const strategyResult = strategy_service_1.strategyEngine.evaluate(session.strategy, asset);
        // Check Risk Engine rules
        const riskCheck = risk_service_1.riskService.checkRiskRules(session.starting_balance, session.current_pnl, 0 // No concurrent trades open in paper simulation loop
        );
        if (!riskCheck.allowed) {
            if (riskCheck.isDailyLossExceeded) {
                active.logs.push(`[${this.formatTime()}] Daily Loss Limit Reached. Paper engine automatically stopped.`);
                (0, websocket_server_1.broadcastEvent)({
                    type: 'RISK_ALERT',
                    sessionId,
                    message: 'Demo daily loss limit reached. Trading session stopped.'
                });
                await this.completeSession(sessionId, 'Demo daily loss limit reached. Trading session stopped.');
            }
            return;
        }
        // Execute Paper Trade if Signal is BUY or SELL
        if (strategyResult.signal === 'BUY' || strategyResult.signal === 'SELL') {
            const isWin = Math.random() < 0.65; // ~65% win rate
            const tradeAmount = risk_service_1.riskService.calculateTradeAmount(session.investment_amount, session.risk_level);
            const pnl = isWin
                ? Math.round(tradeAmount * (0.75 + Math.random() * 0.12) * 100) / 100
                : -tradeAmount;
            const entryPrice = asset.price;
            const exitPrice = strategyResult.signal === 'BUY'
                ? (isWin ? entryPrice * 1.0004 : entryPrice * 0.9996)
                : (isWin ? entryPrice * 0.9996 : entryPrice * 1.0004);
            const tradeId = `TRD-${Date.now()}-${crypto_1.default.randomBytes(2).toString('hex')}`;
            const paperTrade = {
                id: tradeId,
                session_id: sessionId,
                user_id: session.user_id,
                asset: asset.symbol,
                direction: strategyResult.signal,
                amount: tradeAmount,
                entry_price: entryPrice,
                exit_price: exitPrice,
                pnl,
                result: isWin ? 'WIN' : 'LOSS',
                strategy: session.strategy,
                created_at: new Date()
            };
            // 1. Insert paper trade into MySQL
            await database_1.pool.query(`INSERT INTO trades (id, session_id, user_id, asset, direction, amount, entry_price, exit_price, pnl, result, strategy)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                paperTrade.id,
                paperTrade.session_id,
                paperTrade.user_id,
                paperTrade.asset,
                paperTrade.direction,
                paperTrade.amount,
                paperTrade.entry_price,
                paperTrade.exit_price,
                paperTrade.pnl,
                paperTrade.result,
                paperTrade.strategy
            ]);
            // 2. Update user demo balance in MySQL
            await database_1.pool.query('UPDATE users SET demo_balance = GREATEST(0, demo_balance + ?) WHERE id = ?', [pnl, session.user_id]);
            // 3. Update session metrics
            active.tradesCount++;
            if (isWin)
                active.winCount++;
            else
                active.lossCount++;
            session.current_pnl += pnl;
            await database_1.pool.query('UPDATE trading_sessions SET current_pnl = ? WHERE id = ?', [session.current_pnl, sessionId]);
            const outcome = isWin ? `+₹${pnl.toFixed(2)} (WIN)` : `-₹${Math.abs(pnl).toFixed(2)} (LOSS)`;
            active.logs.push(`[${this.formatTime()}] ${paperTrade.direction} ${paperTrade.asset} executed: ${outcome}`);
            // Broadcast TRADE_CREATED and PNL_UPDATE
            (0, websocket_server_1.broadcastEvent)({
                type: 'TRADE_CREATED',
                sessionId,
                trade: paperTrade
            });
            (0, websocket_server_1.broadcastEvent)({
                type: 'PNL_UPDATE',
                sessionId,
                currentPnL: session.current_pnl,
                pnlChange: pnl
            });
        }
    }
    async stopSession(sessionId, reason = 'Stopped by user') {
        const active = this.activeSessions.get(sessionId);
        if (!active) {
            const dbSession = await this.getSessionById(sessionId);
            if (!dbSession)
                throw new Error('Session not found.');
            return dbSession;
        }
        if (active.timer) {
            clearInterval(active.timer);
            active.timer = null;
        }
        active.session.status = 'STOPPING';
        active.logs.push(`[${this.formatTime()}] Stopping session and securing paper positions...`);
        (0, websocket_server_1.broadcastEvent)({
            type: 'BOT_STATUS',
            sessionId,
            status: 'STOPPING',
            logs: active.logs
        });
        return await this.completeSession(sessionId, reason);
    }
    async completeSession(sessionId, reason) {
        const active = this.activeSessions.get(sessionId);
        if (!active) {
            const db = await this.getSessionById(sessionId);
            return db;
        }
        if (active.timer) {
            clearInterval(active.timer);
            active.timer = null;
        }
        // Fetch updated balance from MySQL
        const [userRows] = await database_1.pool.query('SELECT demo_balance FROM users WHERE id = ?', [active.session.user_id]);
        const endingBalance = userRows.length > 0 ? parseFloat(userRows[0].demo_balance) : active.session.starting_balance;
        active.session.status = 'COMPLETED';
        active.session.ending_balance = endingBalance;
        active.session.termination_reason = reason;
        active.session.ended_at = new Date();
        active.logs.push(`[${this.formatTime()}] Paper session completed: ${reason}`);
        await database_1.pool.query(`UPDATE trading_sessions
       SET status = 'COMPLETED', ending_balance = ?, current_pnl = ?, termination_reason = ?, ended_at = CURRENT_TIMESTAMP
       WHERE id = ?`, [endingBalance, active.session.current_pnl, reason, sessionId]);
        (0, websocket_server_1.broadcastEvent)({
            type: 'SESSION_COMPLETED',
            sessionId,
            status: 'COMPLETED',
            endingBalance,
            currentPnL: active.session.current_pnl,
            reason,
            logs: active.logs
        });
        this.activeSessions.delete(sessionId);
        return active.session;
    }
    async getSessionById(sessionId) {
        const active = this.activeSessions.get(sessionId);
        if (active)
            return active.session;
        const [rows] = await database_1.pool.query('SELECT * FROM trading_sessions WHERE id = ?', [sessionId]);
        if (rows.length === 0)
            return null;
        return rows[0];
    }
    async getUserSessions(userId) {
        const [rows] = await database_1.pool.query('SELECT * FROM trading_sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT 20', [userId]);
        return rows;
    }
    getActiveSessionForUser(userId) {
        for (const active of this.activeSessions.values()) {
            if (active.session.user_id === userId) {
                return active.session;
            }
        }
        return null;
    }
    /**
     * Directly executes an atomic simulated paper trade (used by automated pipelines & stability simulations)
     */
    async executeSimulatedTrade(params) {
        const tradeId = `TRD-${Date.now()}-${crypto_1.default.randomBytes(2).toString('hex')}`;
        const isWin = Math.random() < 0.65;
        const pnl = isWin
            ? Math.round(params.amount * 0.85 * 100) / 100
            : -params.amount;
        const exitPrice = params.direction === 'BUY'
            ? (isWin ? params.entryPrice * 1.0005 : params.entryPrice * 0.9995)
            : (isWin ? params.entryPrice * 0.9995 : params.entryPrice * 1.0005);
        const paperTrade = {
            id: tradeId,
            session_id: params.sessionId || 'STANDALONE_PAPER',
            user_id: params.userId || 1,
            asset: params.asset,
            direction: params.direction,
            amount: params.amount,
            entry_price: params.entryPrice,
            exit_price: exitPrice,
            pnl,
            result: isWin ? 'WIN' : 'LOSS',
            strategy: params.strategy,
            created_at: new Date()
        };
        try {
            await database_1.pool.query(`INSERT INTO trades (id, session_id, user_id, asset, direction, amount, entry_price, exit_price, pnl, result, strategy)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                paperTrade.id,
                paperTrade.session_id,
                paperTrade.user_id,
                paperTrade.asset,
                paperTrade.direction,
                paperTrade.amount,
                paperTrade.entry_price,
                paperTrade.exit_price,
                paperTrade.pnl,
                paperTrade.result,
                paperTrade.strategy
            ]);
        }
        catch { }
        return paperTrade;
    }
    formatTime() {
        return new Date().toTimeString().split(' ')[0];
    }
}
exports.PaperExecutionEngine = PaperExecutionEngine;
exports.paperExecutionEngine = new PaperExecutionEngine();
