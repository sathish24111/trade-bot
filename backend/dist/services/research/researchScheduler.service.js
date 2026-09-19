"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.researchSchedulerService = exports.ResearchSchedulerService = void 0;
const database_1 = require("../../config/database");
const researchOrchestrator_service_1 = require("./researchOrchestrator.service");
class ResearchSchedulerService {
    timer = null;
    isChecking = false;
    constructor() {
        this.startSchedulerLoop();
    }
    startSchedulerLoop() {
        // Check scheduled jobs every 60 seconds
        if (!this.timer) {
            this.timer = setInterval(() => {
                this.checkDueSchedules().catch(() => { });
            }, 60000);
            this.timer.unref();
        }
    }
    computeNextRun(schedule, fromDate = new Date()) {
        const next = new Date(fromDate);
        switch (schedule) {
            case 'HOURLY':
                next.setHours(next.getHours() + 1);
                break;
            case 'DAILY':
                next.setDate(next.getDate() + 1);
                break;
            case 'WEEKLY':
                next.setDate(next.getDate() + 7);
                break;
            case 'CUSTOM':
            default:
                next.setHours(next.getHours() + 6); // default 6 hours
                break;
        }
        return next;
    }
    async createSchedule(params) {
        const id = `SCHED_${Date.now()}`;
        const nextRun = this.computeNextRun(params.schedule).toISOString();
        const now = new Date().toISOString();
        const record = {
            id,
            name: params.name,
            jobType: params.jobType,
            strategyId: params.strategyId,
            datasetId: params.datasetId,
            schedule: params.schedule,
            customCron: params.customCron,
            enabled: true,
            nextRun,
            createdAt: now,
            updatedAt: now
        };
        try {
            await database_1.pool.query(`INSERT INTO research_schedules (id, name, job_type, strategy_id, dataset_id, schedule, custom_cron, enabled, next_run)
         VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, ?)`, [id, params.name, params.jobType, params.strategyId, params.datasetId || null, params.schedule, params.customCron || null, new Date(nextRun)]);
        }
        catch { }
        return record;
    }
    async listSchedules() {
        try {
            const [rows] = await database_1.pool.query('SELECT * FROM research_schedules ORDER BY created_at DESC');
            return rows.map(r => ({
                id: r.id,
                name: r.name,
                jobType: r.job_type,
                strategyId: r.strategy_id,
                datasetId: r.dataset_id,
                schedule: r.schedule,
                customCron: r.custom_cron,
                enabled: Boolean(r.enabled),
                lastRun: r.last_run ? new Date(r.last_run).toISOString() : undefined,
                nextRun: new Date(r.next_run).toISOString(),
                createdAt: new Date(r.created_at).toISOString(),
                updatedAt: new Date(r.updated_at).toISOString()
            }));
        }
        catch {
            return [];
        }
    }
    async updateScheduleStatus(id, enabled) {
        try {
            const [res] = await database_1.pool.query('UPDATE research_schedules SET enabled = ? WHERE id = ?', [enabled, id]);
            return res.affectedRows > 0;
        }
        catch {
            return false;
        }
    }
    async deleteSchedule(id) {
        try {
            const [res] = await database_1.pool.query('DELETE FROM research_schedules WHERE id = ?', [id]);
            return res.affectedRows > 0;
        }
        catch {
            return false;
        }
    }
    /**
     * Evaluates due schedules and enqueues jobs without duplicate executions
     */
    async checkDueSchedules() {
        if (this.isChecking)
            return;
        this.isChecking = true;
        try {
            const [rows] = await database_1.pool.query(`SELECT * FROM research_schedules WHERE enabled = TRUE AND next_run <= NOW()`);
            for (const r of rows) {
                const nextRun = this.computeNextRun(r.schedule).toISOString();
                // Update schedule nextRun first to prevent race condition duplicates
                await database_1.pool.query(`UPDATE research_schedules SET last_run = NOW(), next_run = ? WHERE id = ?`, [new Date(nextRun), r.id]);
                // Enqueue job via Orchestrator
                await researchOrchestrator_service_1.researchOrchestratorService.createJob({
                    type: r.job_type,
                    parameters: {
                        strategy: r.strategy_id,
                        datasetId: r.dataset_id,
                        scheduledBy: r.id
                    },
                    priority: 'LOW'
                });
            }
        }
        catch { }
        finally {
            this.isChecking = false;
        }
    }
}
exports.ResearchSchedulerService = ResearchSchedulerService;
exports.researchSchedulerService = new ResearchSchedulerService();
