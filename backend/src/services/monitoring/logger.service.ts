import { env } from '../../config/env';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export type LogCategory =
  | 'API'
  | 'DATABASE'
  | 'MARKET_DATA'
  | 'WEBSOCKET'
  | 'STRATEGY'
  | 'RISK'
  | 'PAPER_EXECUTION'
  | 'RESEARCH'
  | 'NOTIFICATION'
  | 'SECURITY'
  | 'RECOVERY';

export interface StructuredLogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  category: LogCategory;
  event: string;
  requestId?: string;
  message?: string;
  mode: string;
  metadata?: Record<string, any>;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40
};

export class LoggerService {
  private currentLevel: LogLevel = env.LOG_LEVEL as LogLevel;
  private lastMarketTickLog = 0;

  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.currentLevel];
  }

  private sanitize(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    const sanitized: any = Array.isArray(obj) ? [] : {};
    const sensitiveKeys = ['password', 'password_hash', 'token', 'secret', 'jwt_secret', 'fcm', 'authorization'];

    for (const key of Object.keys(obj)) {
      if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        sanitized[key] = this.sanitize(obj[key]);
      } else {
        sanitized[key] = obj[key];
      }
    }
    return sanitized;
  }

  log(entry: Omit<StructuredLogEntry, 'timestamp' | 'service' | 'mode'>): void {
    if (!this.shouldLog(entry.level)) return;

    // Market data tick throttling: max 1 per 5 seconds to prevent stdout saturation
    if (entry.category === 'MARKET_DATA' && entry.event === 'TICK') {
      const now = Date.now();
      if (now - this.lastMarketTickLog < 5000) return;
      this.lastMarketTickLog = now;
    }

    const payload: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      service: 'tradepilot-backend',
      mode: 'PAPER',
      ...entry,
      metadata: entry.metadata ? this.sanitize(entry.metadata) : undefined
    };

    const formatted = JSON.stringify(payload);
    if (entry.level === 'ERROR') {
      console.error(formatted);
    } else if (entry.level === 'WARN') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }

  info(category: LogCategory, event: string, message?: string, metadata?: any, requestId?: string): void {
    this.log({ level: 'INFO', category, event, message, metadata, requestId });
  }

  warn(category: LogCategory, event: string, message?: string, metadata?: any, requestId?: string): void {
    this.log({ level: 'WARN', category, event, message, metadata, requestId });
  }

  error(category: LogCategory, event: string, message?: string, metadata?: any, requestId?: string): void {
    this.log({ level: 'ERROR', category, event, message, metadata, requestId });
  }

  debug(category: LogCategory, event: string, message?: string, metadata?: any, requestId?: string): void {
    this.log({ level: 'DEBUG', category, event, message, metadata, requestId });
  }
}

export const logger = new LoggerService();
