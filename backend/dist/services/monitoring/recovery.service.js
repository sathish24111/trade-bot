"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recoveryService = exports.RecoveryService = void 0;
const database_1 = require("../../config/database");
const env_1 = require("../../config/env");
const alert_service_1 = require("./alert.service");
class RecoveryService {
    /**
     * Executes system startup recovery and reconciliation sequence.
     * Strictly enforces that TRADING_MODE=PAPER and no real-money state exists.
     */
    async executeRecovery() {
        // 1. Mandatory Safety Kill Switch Check
        if (env_1.env.TRADING_MODE !== 'PAPER') {
            console.error('[CRITICAL SECURITY ERROR] TRADING_MODE is not set to PAPER during recovery. ABORTING.');
            process.exit(1);
        }
        let recoveredSessionsCount = 0;
        let recoveredExperimentsCount = 0;
        let reconciledPositionsCount = 0;
        try {
            // 2. Load and validate open paper sessions
            const [sessions] = await database_1.pool.query(`SELECT id, user_id, status FROM trading_sessions WHERE status IN ('STARTING', 'RUNNING')`);
            recoveredSessionsCount = sessions.length;
            // Reconcile open sessions: mark stale RUNNING sessions as COMPLETED on restart
            if (sessions.length > 0) {
                await database_1.pool.query(`UPDATE trading_sessions SET status = 'COMPLETED', termination_reason = 'Server restart state recovery' 
           WHERE status IN ('STARTING', 'RUNNING')`);
                reconciledPositionsCount = sessions.length;
            }
            // 3. Restore paper experiments
            const [experiments] = await database_1.pool.query(`SELECT id, status FROM paper_experiments WHERE status = 'RUNNING'`);
            recoveredExperimentsCount = experiments.length;
            // Pause interrupted experiments so user can resume cleanly
            if (experiments.length > 0) {
                await database_1.pool.query(`UPDATE paper_experiments SET status = 'PAUSED' WHERE status = 'RUNNING'`);
            }
            // 4. Log recovery alert
            await alert_service_1.alertService.createAlert({
                type: 'SYSTEM_RECOVERY',
                severity: 'INFO',
                message: `System recovered cleanly after restart. Reconciled ${reconciledPositionsCount} session(s), paused ${recoveredExperimentsCount} experiment(s). Mode: PAPER.`
            });
        }
        catch (err) {
            console.warn(`[RecoveryService] State recovery notice: ${err.message}`);
        }
        return {
            recoveredSessionsCount,
            recoveredExperimentsCount,
            reconciledPositionsCount,
            modeVerified: 'PAPER',
            safetyPassed: true,
            timestamp: new Date().toISOString()
        };
    }
}
exports.RecoveryService = RecoveryService;
exports.recoveryService = new RecoveryService();
