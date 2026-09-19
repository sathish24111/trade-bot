import { Router } from 'express';
import { systemHealthService } from '../services/monitoring/systemHealth.service';
import { requestMetricsService } from '../services/monitoring/requestMetrics.service';
import { paperSafetyService } from '../services/security/paperSafety.service';
import { pool } from '../config/database';

const router = Router();

// Liveness probe: process is running
router.get('/live', (req, res) => {
  return res.json({
    status: 'ONLINE',
    process: 'UP',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    ...paperSafetyService.getSafetyEnvelope()
  });
});

// Readiness probe: checks DB readiness to accept requests
router.get('/ready', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.json({
      status: 'READY',
      ready: true,
      database: 'CONNECTED',
      timestamp: new Date().toISOString(),
      ...paperSafetyService.getSafetyEnvelope()
    });
  } catch (err: any) {
    return res.status(503).json({
      status: 'NOT_READY',
      ready: false,
      database: 'DISCONNECTED',
      error: 'Database connection failed',
      timestamp: new Date().toISOString(),
      ...paperSafetyService.getSafetyEnvelope()
    });
  }
});

// Full 10-component detailed system health
router.get('/system', async (req, res) => {
  try {
    const health = await systemHealthService.evaluateSystemHealth();
    return res.json({
      success: true,
      health,
      ...paperSafetyService.getSafetyEnvelope()
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message, ...paperSafetyService.getSafetyEnvelope() });
  }
});

// Components health
router.get('/components', async (req, res) => {
  try {
    const health = await systemHealthService.evaluateSystemHealth();
    return res.json({
      success: true,
      components: health.components,
      ...paperSafetyService.getSafetyEnvelope()
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message, ...paperSafetyService.getSafetyEnvelope() });
  }
});

// Internal Request & System Metrics
router.get('/metrics', async (req, res) => {
  try {
    const requestMetrics = requestMetricsService.getMetricsSummary();
    const memory = process.memoryUsage();
    const systemMetrics = {
      uptimeSeconds: Math.floor(process.uptime()),
      memory: {
        heapTotalMb: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
        heapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
        rssMb: Math.round((memory.rss / 1024 / 1024) * 100) / 100
      },
      requests: requestMetrics
    };

    return res.json({
      success: true,
      metrics: systemMetrics,
      ...paperSafetyService.getSafetyEnvelope()
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message, ...paperSafetyService.getSafetyEnvelope() });
  }
});

// Paper Safety Audit
router.get('/safety', (req, res) => {
  try {
    const audit = paperSafetyService.auditSafety();
    return res.json({
      success: true,
      audit,
      ...paperSafetyService.getSafetyEnvelope()
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
