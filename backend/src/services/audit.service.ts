import { pool } from '../config/database';

export type AuditEventType =
  | 'LOGIN'
  | 'BACKTEST_STARTED'
  | 'BACKTEST_COMPLETED'
  | 'PAPER_SESSION_STARTED'
  | 'PAPER_TRADE_CREATED'
  | 'PAPER_SESSION_STOPPED'
  | 'RISK_LIMIT_REACHED'
  | 'MARKET_PROVIDER_CHANGED'
  | 'WEBSOCKET_CONNECTED'
  | 'WEBSOCKET_DISCONNECTED';

export class AuditService {
  async log(eventType: AuditEventType, userId?: number | null, details?: Record<string, any>): Promise<void> {
    const sanitizedDetails = details ? { ...details } : {};
    
    // Safety: Never log passwords, tokens, or sensitive credentials
    delete sanitizedDetails.password;
    delete sanitizedDetails.password_hash;
    delete sanitizedDetails.token;
    delete sanitizedDetails.apiKey;

    const detailsJson = JSON.stringify(sanitizedDetails);

    try {
      await pool.query(
        'INSERT INTO audit_logs (event_type, user_id, details) VALUES (?, ?, ?)',
        [eventType, userId || null, detailsJson]
      );
    } catch (err) {
      // In case table is still initializing or during early startup
      console.warn(`[AuditLog Warning] Could not persist audit log to MySQL:`, err);
    }

    if (process.env.NODE_ENV !== 'test') {
      console.log(`[AUDIT] [${new Date().toISOString()}] ${eventType} - User: ${userId || 'N/A'} - ${detailsJson}`);
    }
  }
}

export const auditService = new AuditService();
