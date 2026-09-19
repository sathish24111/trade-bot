import { Request, Response, NextFunction } from 'express';
import { requestMetricsService } from '../services/monitoring/requestMetrics.service';
import { logger } from '../services/monitoring/logger.service';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
    }
  }
}

export function requestTraceMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = (req.headers['x-request-id'] as string) || `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  req.requestId = requestId;
  req.startTime = Date.now();
  res.setHeader('X-Request-ID', requestId);

  res.on('finish', () => {
    const durationMs = Date.now() - (req.startTime || Date.now());
    requestMetricsService.recordRequest(req.method, req.baseUrl + req.path, res.statusCode, durationMs);

    logger.info('API', 'REQUEST_COMPLETED', `${req.method} ${req.originalUrl} [${res.statusCode}] - ${durationMs}ms`, {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs
    }, requestId);
  });

  next();
}
