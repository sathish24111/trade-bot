import { pool } from '../../config/database';
import {
  ResearchJobType,
  ResearchRecommendation,
  ResearchTriggerType
} from '../../models/Phase9';
import { broadcastEvent } from '../../websocket/websocket.server';
import { researchOrchestratorService } from './researchOrchestrator.service';

export class ResearchRecommendationService {
  private inMemoryRecommendations: Map<string, ResearchRecommendation> = new Map();

  async evaluateTrigger(params: {
    trigger: ResearchTriggerType;
    reason: string;
    evidence: string;
    suggestedJob: ResearchJobType;
    parameters?: Record<string, any>;
  }): Promise<ResearchRecommendation> {
    const id = `REC_${Date.now()}`;
    const rec: ResearchRecommendation = {
      id,
      trigger: params.trigger,
      reason: params.reason,
      evidence: params.evidence,
      suggestedResearchJob: params.suggestedJob,
      suggestedParameters: params.parameters || {},
      priority: params.trigger === 'SIGNIFICANT_DRIFT' || params.trigger === 'PARAMETER_CLIFF' ? 'HIGH' : 'NORMAL',
      timestamp: new Date().toISOString(),
      status: 'PENDING'
    };

    this.inMemoryRecommendations.set(id, rec);

    try {
      await pool.query(
        `INSERT INTO research_recommendations (id, trigger_type, reason, evidence, suggested_job_type, suggested_parameters, priority, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
        [id, rec.trigger, rec.reason, rec.evidence, rec.suggestedResearchJob, JSON.stringify(rec.suggestedParameters), rec.priority]
      );
    } catch {}

    broadcastEvent({
      type: 'RESEARCH_RECOMMENDATION',
      recommendationId: id,
      trigger: rec.trigger,
      suggestedJob: rec.suggestedResearchJob,
      priority: rec.priority,
      reason: rec.reason,
      timestamp: rec.timestamp
    });

    return rec;
  }

  async listRecommendations(status?: string, limit = 20): Promise<ResearchRecommendation[]> {
    try {
      let q = 'SELECT * FROM research_recommendations';
      const params: any[] = [];
      if (status) {
        q += ' WHERE status = ?';
        params.push(status);
      }
      q += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limit);

      const [rows] = await pool.query<any[]>(q, params);
      if (rows.length > 0) {
        return rows.map(r => ({
          id: r.id,
          trigger: r.trigger_type as ResearchTriggerType,
          reason: r.reason,
          evidence: r.evidence,
          suggestedResearchJob: r.suggested_job_type as ResearchJobType,
          suggestedParameters: typeof r.suggested_parameters === 'string' ? JSON.parse(r.suggested_parameters) : r.suggested_parameters,
          priority: r.priority,
          timestamp: new Date(r.created_at).toISOString(),
          status: r.status
        }));
      }
    } catch {}

    return Array.from(this.inMemoryRecommendations.values()).slice(0, limit);
  }

  async runRecommendation(id: string): Promise<any> {
    const rec = this.inMemoryRecommendations.get(id);
    const jobType = rec?.suggestedResearchJob || 'DRIFT_ANALYSIS';
    const params = rec?.suggestedParameters || {};

    const job = await researchOrchestratorService.createJob({
      type: jobType,
      parameters: params,
      priority: 'HIGH'
    });

    try {
      await pool.query(`UPDATE research_recommendations SET status = 'EXECUTED' WHERE id = ?`, [id]);
    } catch {}

    if (rec) rec.status = 'EXECUTED';

    return {
      recommendationId: id,
      executedJobId: job.jobId,
      status: 'EXECUTED',
      timestamp: new Date().toISOString()
    };
  }

  async dismissRecommendation(id: string): Promise<boolean> {
    try {
      const [res] = await pool.query<any>(
        `UPDATE research_recommendations SET status = 'DISMISSED' WHERE id = ?`,
        [id]
      );
      const rec = this.inMemoryRecommendations.get(id);
      if (rec) rec.status = 'DISMISSED';
      return res.affectedRows > 0;
    } catch {
      return false;
    }
  }
}


export const researchRecommendationService = new ResearchRecommendationService();
