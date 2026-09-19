"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestTraceMiddleware = requestTraceMiddleware;
const requestMetrics_service_1 = require("../services/monitoring/requestMetrics.service");
const logger_service_1 = require("../services/monitoring/logger.service");
function requestTraceMiddleware(req, res, next) {
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    req.requestId = requestId;
    req.startTime = Date.now();
    res.setHeader('X-Request-ID', requestId);
    res.on('finish', () => {
        const durationMs = Date.now() - (req.startTime || Date.now());
        requestMetrics_service_1.requestMetricsService.recordRequest(req.method, req.baseUrl + req.path, res.statusCode, durationMs);
        logger_service_1.logger.info('API', 'REQUEST_COMPLETED', `${req.method} ${req.originalUrl} [${res.statusCode}] - ${durationMs}ms`, {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            durationMs
        }, requestId);
    });
    next();
}
