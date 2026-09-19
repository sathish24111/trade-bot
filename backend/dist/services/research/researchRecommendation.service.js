"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.researchRecommendationService = exports.ResearchRecommendationService = void 0;
const database_1 = require("../../config/database");
const websocket_server_1 = require("../../websocket/websocket.server");
const researchOrchestrator_service_1 = require("./researchOrchestrator.service");
class ResearchRecommendationService {
    inMemoryRecommendations = new Map();
    async evaluateTrigger(params) {
        const id = `REC_${Date.now()}`;
        const rec = {
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
            await database_1.pool.query(`INSERT INTO research_recommendations (id, trigger_type, reason, evidence, suggested_job_type, suggested_parameters, priority, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')`, [id, rec.trigger, rec.reason, rec.evidence, rec.suggestedResearchJob, JSON.stringify(rec.suggestedParameters), rec.priority]);
        }
        catch { }
        (0, websocket_server_1.broadcastEvent)({
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
    async listRecommendations(status, limit = 20) {
        try {
            let q = 'SELECT * FROM research_recommendations';
            const params = [];
            if (status) {
                q += ' WHERE status = ?';
                params.push(status);
            }
            q += ' ORDER BY created_at DESC LIMIT ?';
            params.push(limit);
            const [rows] = await database_1.pool.query(q, params);
            if (rows.length > 0) {
                return rows.map(r => ({
                    id: r.id,
                    trigger: r.trigger_type,
                    reason: r.reason,
                    evidence: r.evidence,
                    suggestedResearchJob: r.suggested_job_type,
                    suggestedParameters: typeof r.suggested_parameters === 'string' ? JSON.parse(r.suggested_parameters) : r.suggested_parameters,
                    priority: r.priority,
                    timestamp: new Date(r.created_at).toISOString(),
                    status: r.status
                }));
            }
        }
        catch { }
        return Array.from(this.inMemoryRecommendations.values()).slice(0, limit);
    }
    async runRecommendation(id) {
        const rec = this.inMemoryRecommendations.get(id);
        const jobType = rec?.suggestedResearchJob || 'DRIFT_ANALYSIS';
        const params = rec?.suggestedParameters || {};
        const job = await researchOrchestrator_service_1.researchOrchestratorService.createJob({
            type: jobType,
            parameters: params,
            priority: 'HIGH'
        });
        try {
            await database_1.pool.query(`UPDATE research_recommendations SET status = 'EXECUTED' WHERE id = ?`, [id]);
        }
        catch { }
        if (rec)
            rec.status = 'EXECUTED';
        return {
            recommendationId: id,
            executedJobId: job.jobId,
            status: 'EXECUTED',
            timestamp: new Date().toISOString()
        };
    }
    async dismissRecommendation(id) {
        try {
            const [res] = await database_1.pool.query(`UPDATE research_recommendations SET status = 'DISMISSED' WHERE id = ?`, [id]);
            const rec = this.inMemoryRecommendations.get(id);
            if (rec)
                rec.status = 'DISMISSED';
            return res.affectedRows > 0;
        }
        catch {
            return false;
        }
    }
}
exports.ResearchRecommendationService = ResearchRecommendationService;
exports.researchRecommendationService = new ResearchRecommendationService();
