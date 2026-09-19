import { pool } from '../../config/database';
import { ResearchJobType, ResearchSchedule, ScheduleFrequency } from '../../models/Phase9';
import { researchOrchestratorService } from './researchOrchestrator.service';

export class ResearchSchedulerService {
  private timer: NodeJS.Timeout | null = null;
  private isChecking = false;

  constructor() {
    this.startSchedulerLoop();
  }

  private startSchedulerLoop() {
    // Check scheduled jobs every 60 seconds
    if (!this.timer) {
      this.timer = setInterval(() => {
        this.checkDueSchedules().catch(() => {});
      }, 60000);
      this.timer.unref();
    }
  }

  computeNextRun(schedule: ScheduleFrequency, fromDate = new Date()): Date {
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

  async createSchedule(params: {
    name: string;
    jobType: ResearchJobType;
    strategyId: string;
    datasetId?: string;
    schedule: ScheduleFrequency;
    customCron?: string;
  }): Promise<ResearchSchedule> {
    const id = `SCHED_${Date.now()}`;
    const nextRun = this.computeNextRun(params.schedule).toISOString();
    const now = new Date().toISOString();

    const record: ResearchSchedule = {
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
      await pool.query(
        `INSERT INTO research_schedules (id, name, job_type, strategy_id, dataset_id, schedule, custom_cron, enabled, next_run)
         VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, ?)`,
        [id, params.name, params.jobType, params.strategyId, params.datasetId || null, params.schedule, params.customCron || null, new Date(nextRun)]
      );
    } catch {}

    return record;
  }

  async listSchedules(): Promise<ResearchSchedule[]> {
    try {
      const [rows] = await pool.query<any[]>('SELECT * FROM research_schedules ORDER BY created_at DESC');
      return rows.map(r => ({
        id: r.id,
        name: r.name,
        jobType: r.job_type as ResearchJobType,
        strategyId: r.strategy_id,
        datasetId: r.dataset_id,
        schedule: r.schedule as ScheduleFrequency,
        customCron: r.custom_cron,
        enabled: Boolean(r.enabled),
        lastRun: r.last_run ? new Date(r.last_run).toISOString() : undefined,
        nextRun: new Date(r.next_run).toISOString(),
        createdAt: new Date(r.created_at).toISOString(),
        updatedAt: new Date(r.updated_at).toISOString()
      }));
    } catch {
      return [];
    }
  }

  async updateScheduleStatus(id: string, enabled: boolean): Promise<boolean> {
    try {
      const [res] = await pool.query<any>('UPDATE research_schedules SET enabled = ? WHERE id = ?', [enabled, id]);
      return res.affectedRows > 0;
    } catch {
      return false;
    }
  }

  async deleteSchedule(id: string): Promise<boolean> {
    try {
      const [res] = await pool.query<any>('DELETE FROM research_schedules WHERE id = ?', [id]);
      return res.affectedRows > 0;
    } catch {
      return false;
    }
  }

  /**
   * Evaluates due schedules and enqueues jobs without duplicate executions
   */
  async checkDueSchedules() {
    if (this.isChecking) return;
    this.isChecking = true;

    try {
      const [rows] = await pool.query<any[]>(
        `SELECT * FROM research_schedules WHERE enabled = TRUE AND next_run <= NOW()`
      );

      for (const r of rows) {
        const nextRun = this.computeNextRun(r.schedule).toISOString();

        // Update schedule nextRun first to prevent race condition duplicates
        await pool.query(
          `UPDATE research_schedules SET last_run = NOW(), next_run = ? WHERE id = ?`,
          [new Date(nextRun), r.id]
        );

        // Enqueue job via Orchestrator
        await researchOrchestratorService.createJob({
          type: r.job_type as ResearchJobType,
          parameters: {
            strategy: r.strategy_id,
            datasetId: r.dataset_id,
            scheduledBy: r.id
          },
          priority: 'LOW'
        });
      }
    } catch {} finally {
      this.isChecking = false;
    }
  }
}

export const researchSchedulerService = new ResearchSchedulerService();
