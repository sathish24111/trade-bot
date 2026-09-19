"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const systemHealth_service_1 = require("../services/monitoring/systemHealth.service");
const requestMetrics_service_1 = require("../services/monitoring/requestMetrics.service");
const paperSafety_service_1 = require("../services/security/paperSafety.service");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
// Liveness probe: process is running
router.get('/live', (req, res) => {
    return res.json({
        status: 'ONLINE',
        process: 'UP',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        ...paperSafety_service_1.paperSafetyService.getSafetyEnvelope()
    });
});
// Readiness probe: checks DB readiness to accept requests
router.get('/ready', async (req, res) => {
    try {
        await database_1.pool.query('SELECT 1');
        return res.json({
            status: 'READY',
            ready: true,
            database: 'CONNECTED',
            timestamp: new Date().toISOString(),
            ...paperSafety_service_1.paperSafetyService.getSafetyEnvelope()
        });
    }
    catch (err) {
        return res.status(503).json({
            status: 'NOT_READY',
            ready: false,
            database: 'DISCONNECTED',
            error: 'Database connection failed',
            timestamp: new Date().toISOString(),
            ...paperSafety_service_1.paperSafetyService.getSafetyEnvelope()
        });
    }
});
// Full 10-component detailed system health
router.get('/system', async (req, res) => {
    try {
        const health = await systemHealth_service_1.systemHealthService.evaluateSystemHealth();
        return res.json({
            success: true,
            health,
            ...paperSafety_service_1.paperSafetyService.getSafetyEnvelope()
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message, ...paperSafety_service_1.paperSafetyService.getSafetyEnvelope() });
    }
});
// Components health
router.get('/components', async (req, res) => {
    try {
        const health = await systemHealth_service_1.systemHealthService.evaluateSystemHealth();
        return res.json({
            success: true,
            components: health.components,
            ...paperSafety_service_1.paperSafetyService.getSafetyEnvelope()
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message, ...paperSafety_service_1.paperSafetyService.getSafetyEnvelope() });
    }
});
// Internal Request & System Metrics
router.get('/metrics', async (req, res) => {
    try {
        const requestMetrics = requestMetrics_service_1.requestMetricsService.getMetricsSummary();
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
            ...paperSafety_service_1.paperSafetyService.getSafetyEnvelope()
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message, ...paperSafety_service_1.paperSafetyService.getSafetyEnvelope() });
    }
});
// Paper Safety Audit
router.get('/safety', (req, res) => {
    try {
        const audit = paperSafety_service_1.paperSafetyService.auditSafety();
        return res.json({
            success: true,
            audit,
            ...paperSafety_service_1.paperSafetyService.getSafetyEnvelope()
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
exports.default = router;
