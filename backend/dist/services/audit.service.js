"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditService = exports.AuditService = void 0;
const database_1 = require("../config/database");
class AuditService {
    async log(eventType, userId, details) {
        const sanitizedDetails = details ? { ...details } : {};
        // Safety: Never log passwords, tokens, or sensitive credentials
        delete sanitizedDetails.password;
        delete sanitizedDetails.password_hash;
        delete sanitizedDetails.token;
        delete sanitizedDetails.apiKey;
        const detailsJson = JSON.stringify(sanitizedDetails);
        try {
            await database_1.pool.query('INSERT INTO audit_logs (event_type, user_id, details) VALUES (?, ?, ?)', [eventType, userId || null, detailsJson]);
        }
        catch (err) {
            // In case table is still initializing or during early startup
            console.warn(`[AuditLog Warning] Could not persist audit log to MySQL:`, err);
        }
        if (process.env.NODE_ENV !== 'test') {
            console.log(`[AUDIT] [${new Date().toISOString()}] ${eventType} - User: ${userId || 'N/A'} - ${detailsJson}`);
        }
    }
}
exports.AuditService = AuditService;
exports.auditService = new AuditService();
