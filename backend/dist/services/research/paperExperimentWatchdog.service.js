"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paperExperimentWatchdogService = exports.PaperExperimentWatchdogService = void 0;
const database_1 = require("../../config/database");
const Phase9_1 = require("../../models/Phase9");
const driftTrend_service_1 = require("./driftTrend.service");
const websocket_server_1 = require("../../websocket/websocket.server");
class PaperExperimentWatchdogService {
    /**
     * Evaluates active paper experiments and records watchdog events or pauses experiments if breached.
     */
    async inspectExperiments() {
        const [experiments] = await database_1.pool.query(`SELECT id, name, status, strategy, asset FROM paper_experiments WHERE status = 'RUNNING'`);
        const events = [];
        const pausedExperiments = [];
        for (const exp of experiments) {
            // 1. Check recent paper trades for this experiment
            const [trades] = await database_1.pool.query(`SELECT pnl, slippage, fees FROM paper_experiment_trades WHERE experiment_id = ? ORDER BY entry_time DESC LIMIT 20`, [exp.id]);
            let consecutiveLosses = 0;
            for (const t of trades) {
                if (Number(t.pnl) < 0) {
                    consecutiveLosses++;
                }
                else {
                    break;
                }
            }
            // 2. Check drift trends
            const driftResult = driftTrend_service_1.driftTrendService.analyzeDriftTrend({
                strategyId: exp.strategy || 'EMA_RSI',
                asset: exp.asset || 'BTC/USD',
                trades: trades.map(t => ({
                    pnl: Number(t.pnl),
                    slippage: 0.0001,
                    fee: 1.0
                }))
            });
            let shouldPause = false;
            let checkType = 'DRAWDOWN';
            let severity = 'WARNING';
            let message = '';
            if (consecutiveLosses >= 5) {
                shouldPause = true;
                checkType = 'UNEXPECTED_PNL';
                severity = 'CRITICAL';
                message = `Watchdog detected ${consecutiveLosses} consecutive losses on experiment ${exp.name || exp.id}`;
            }
            else if (driftResult.trend === 'DEGRADING') {
                shouldPause = true;
                checkType = 'STRATEGY_DRIFT';
                severity = 'CRITICAL';
                message = `Watchdog detected DEGRADING drift trajectory on experiment ${exp.name || exp.id}`;
            }
            if (shouldPause) {
                await database_1.pool.query(`UPDATE paper_experiments SET status = 'PAUSED' WHERE id = ?`, [exp.id]);
                pausedExperiments.push(exp.id);
                const event = await this.recordWatchdogEvent({
                    experimentId: exp.id,
                    checkType,
                    severity,
                    message,
                    details: { consecutiveLosses, driftTrend: driftResult.trend, tradesChecked: trades.length },
                    actionTaken: 'PAUSED'
                });
                events.push(event);
            }
        }
        return {
            inspectedCount: experiments.length,
            events,
            pausedExperiments
        };
    }
    async recordWatchdogEvent(data) {
        const [res] = await database_1.pool.query(`INSERT INTO paper_watchdog_events 
       (experiment_id, check_type, severity, message, details, action_taken)
       VALUES (?, ?, ?, ?, ?, ?)`, [
            data.experimentId,
            data.checkType,
            data.severity,
            data.message,
            JSON.stringify(data.details),
            data.actionTaken
        ]);
        const event = {
            id: res.insertId,
            experimentId: data.experimentId,
            checkType: data.checkType,
            severity: data.severity,
            message: data.message,
            details: data.details,
            actionTaken: data.actionTaken,
            timestamp: new Date().toISOString()
        };
        (0, websocket_server_1.broadcastEvent)({
            type: 'WATCHDOG_ALERT',
            ...event,
            ...Phase9_1.SAFETY_METADATA_PHASE9
        });
        return event;
    }
    async resumeExperiment(experimentId, justification) {
        const [res] = await database_1.pool.query(`UPDATE paper_experiments SET status = 'RUNNING' WHERE id = ?`, [experimentId]);
        if (res.affectedRows > 0) {
            await this.recordWatchdogEvent({
                experimentId,
                checkType: 'RISK_LIMIT',
                severity: 'INFO',
                message: `Experiment resumed manually: ${justification}`,
                details: { justification },
                actionTaken: 'AUTO_RECOVERED'
            });
            return true;
        }
        return false;
    }
    async getEvents(experimentId, limit = 50) {
        let q = 'SELECT * FROM paper_watchdog_events';
        const params = [];
        if (experimentId) {
            q += ' WHERE experiment_id = ?';
            params.push(experimentId);
        }
        q += ' ORDER BY timestamp DESC LIMIT ?';
        params.push(limit);
        const [rows] = await database_1.pool.query(q, params);
        return rows.map(r => ({
            id: r.id,
            experimentId: r.experiment_id,
            checkType: r.check_type,
            severity: r.severity,
            message: r.message,
            details: typeof r.details === 'string' ? JSON.parse(r.details) : r.details,
            actionTaken: r.action_taken,
            timestamp: new Date(r.timestamp).toISOString()
        }));
    }
}
exports.PaperExperimentWatchdogService = PaperExperimentWatchdogService;
exports.paperExperimentWatchdogService = new PaperExperimentWatchdogService();
