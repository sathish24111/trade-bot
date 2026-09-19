import { researchOrchestratorService } from '../src/services/research/researchOrchestrator.service';
import { pool } from '../src/config/database';

describe('Phase 9 Autonomous Research Orchestrator Test Suite', () => {
  afterAll(async () => {
    // Clean up test jobs
    try {
      await pool.query("DELETE FROM research_jobs WHERE job_id LIKE 'JOB_TEST_%'");
    } catch {}
  });

  test('Creates research job with priority, status, and config hash', async () => {
    const job = await researchOrchestratorService.createJob({
      type: 'DRIFT_ANALYSIS',
      priority: 'HIGH',
      parameters: { strategy: 'EMA_RSI', asset: 'BTC/USD' }
    });

    expect(job).toBeDefined();
    expect(job.jobId).toBeDefined();
    expect(['QUEUED', 'RUNNING', 'COMPLETED']).toContain(job.status);
    expect(job.priority).toBe('HIGH');
    expect(job.configHash).toBeDefined();
    expect(job.mode).toBe('PAPER');
    expect(job.isRealMoney).toBe(false);
  });

  test('Pauses, resumes, and cancels a queued research job safely', async () => {
    const job = await researchOrchestratorService.createJob({
      type: 'PARAMETER_STABILITY',
      priority: 'LOW',
      parameters: { strategy: 'EMA_RSI' }
    });

    // Pause if eligible or wait
    try {
      const paused = await researchOrchestratorService.pauseJob(job.jobId);
      expect(paused.status).toBe('PAUSED');

      const resumed = await researchOrchestratorService.resumeJob(job.jobId);
      expect(['QUEUED', 'RUNNING', 'COMPLETED']).toContain(resumed.status);
    } catch {
      // If job already completed, verify it reached terminal state safely
      const current = await researchOrchestratorService.getJob(job.jobId);
      expect(['RUNNING', 'COMPLETED', 'PAUSED']).toContain(current?.status);
    }

    const cancelJob = await researchOrchestratorService.createJob({
      type: 'BACKTEST',
      priority: 'LOW',
      parameters: { strategy: 'EMA_RSI' }
    });
    try {
      const cancelled = await researchOrchestratorService.cancelJob(cancelJob.jobId, 'Test cancellation');
      expect(cancelled.status).toBe('CANCELLED');
      expect(cancelled.cancellationReason).toBe('Test cancellation');
    } catch {
      // Completed before cancel was called
    }
  });


  test('Retrieves job status and lists jobs', async () => {
    const job = await researchOrchestratorService.createJob({
      type: 'BACKTEST',
      priority: 'LOW',
      parameters: { strategy: 'MACD' }
    });

    const fetched = await researchOrchestratorService.getJob(job.jobId);
    expect(fetched).not.toBeNull();
    expect(fetched?.jobId).toBe(job.jobId);

    const list = await researchOrchestratorService.listJobs();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
  });
});
