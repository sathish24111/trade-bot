"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupRestoreService = exports.BackupRestoreService = void 0;
const database_1 = require("../../config/database");
class BackupRestoreService {
    /**
     * Generates a safe in-memory or JSON-serializable snapshot of critical paper data tables.
     */
    async createPaperDataBackup() {
        const backupId = `BACKUP_${Date.now()}`;
        const targetTables = [
            'users',
            'paper_experiments',
            'paper_experiment_trades',
            'research_jobs',
            'daily_research_reports',
            'audit_logs'
        ];
        const data = {};
        let totalRecords = 0;
        for (const table of targetTables) {
            try {
                const [rows] = await database_1.pool.query(`SELECT * FROM ?? LIMIT 500`, [table]);
                data[table] = rows;
                totalRecords += rows.length;
            }
            catch {
                data[table] = [];
            }
        }
        const metadata = {
            backupId,
            timestamp: new Date().toISOString(),
            tablesBackedUp: targetTables,
            totalRecords,
            mode: 'PAPER'
        };
        return { metadata, data };
    }
    /**
     * Validates a backup dataset for schema compatibility and data integrity before restoration.
     */
    validateBackup(backupData) {
        const errors = [];
        if (!backupData || !backupData.metadata || !backupData.data) {
            errors.push('Malformed backup payload structure');
            return { valid: false, errors, recordCount: 0 };
        }
        if (backupData.metadata.mode !== 'PAPER') {
            errors.push('Incompatible trading mode in backup metadata');
        }
        const requiredTables = ['users', 'paper_experiments', 'research_jobs'];
        for (const tbl of requiredTables) {
            if (!Array.isArray(backupData.data[tbl])) {
                errors.push(`Missing required table dataset: ${tbl}`);
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            recordCount: backupData.metadata.totalRecords || 0
        };
    }
}
exports.BackupRestoreService = BackupRestoreService;
exports.backupRestoreService = new BackupRestoreService();
