import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/monitoring/logger.service';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const status = err.statusCode || 500;
  let message = err.message || 'Internal server error.';
  const errorCode = err.code || (status === 400 ? 'VALIDATION_ERROR' : status === 404 ? 'NOT_FOUND' : status === 403 ? 'FORBIDDEN' : 'INTERNAL_SERVER_ERROR');
  const requestId = req.requestId || `req_${Date.now()}`;

  // Sanitize internal database/file paths from leaking into error messages
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'paper-production') {
    if (message.includes('ECONNREFUSED') || message.includes('ETIMEDOUT') || message.includes('sqlMessage') || message.includes('SELECT') || message.includes('INSERT')) {
      message = 'Database service temporarily unavailable.';
    }
  }

  logger.error('API', 'REQUEST_ERROR', `${req.method} ${req.originalUrl} [${status}]: ${message}`, {
    errorCode,
    status,
    url: req.originalUrl,
    method: req.method
  }, requestId);

  res.status(status).json({
    success: false,
    error: errorCode,
    message,
    requestId,
    mode: 'PAPER',
    isRealMoney: false,
    brokerConnected: false
  });
}

