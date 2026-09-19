"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertService = exports.AlertService = void 0;
const crypto_1 = require("crypto");
const database_1 = require("../../config/database");
class AlertService {
    inMemoryAlerts = new Map();
    /**
     * Creates and dispatches a new paper trading alert.
     */
    async createAlert(params) {
        const id = `alt_${Date.now()}_${(0, crypto_1.randomUUID)().replace(/-/g, '').substring(0, 8)}`;
        const alert = {
            id,
            type: params.type,
            severity: params.severity,
            timestamp: new Date().toISOString(),
            asset: params.asset,
            strategy: params.strategy,
            message: params.message,
            metadata: params.metadata || {},
            acknowledged: false,
            resolved: false
        };
        this.inMemoryAlerts.set(id, alert);
        try {
            await database_1.pool.query(`INSERT INTO alerts (id, type, severity, asset, strategy, message, metadata, acknowledged, resolved)
         VALUES (?, ?, ?, ?, ?, ?, ?, FALSE, FALSE)`, [
                alert.id,
                alert.type,
                alert.severity,
                alert.asset || null,
                alert.strategy || null,
                alert.message,
                JSON.stringify(alert.metadata)
            ]);
        }
        catch {
            // In-memory fallback
        }
        return alert;
    }
    /**
     * Acknowledges an existing alert.
     */
    async acknowledgeAlert(alertId) {
        const alert = this.inMemoryAlerts.get(alertId);
        if (!alert) {
            throw new Error(`Alert ${alertId} not found.`);
        }
        alert.acknowledged = true;
        alert.acknowledgedAt = new Date().toISOString();
        this.inMemoryAlerts.set(alertId, alert);
        try {
            await database_1.pool.query(`UPDATE alerts SET acknowledged = TRUE, acknowledged_at = ? WHERE id = ?`, [new Date(alert.acknowledgedAt), alertId]);
        }
        catch {
            // In-memory fallback
        }
        return alert;
    }
    /**
     * Resolves an existing alert.
     */
    async resolveAlert(alertId) {
        const alert = this.inMemoryAlerts.get(alertId);
        if (!alert) {
            throw new Error(`Alert ${alertId} not found.`);
        }
        alert.resolved = true;
        alert.resolvedAt = new Date().toISOString();
        this.inMemoryAlerts.set(alertId, alert);
        try {
            await database_1.pool.query(`UPDATE alerts SET resolved = TRUE, resolved_at = ? WHERE id = ?`, [new Date(alert.resolvedAt), alertId]);
        }
        catch {
            // In-memory fallback
        }
        return alert;
    }
    /**
     * Retrieves alerts with optional filtering.
     */
    async getAlerts(filter) {
        let list = Array.from(this.inMemoryAlerts.values());
        if (filter) {
            if (filter.severity)
                list = list.filter(a => a.severity === filter.severity);
            if (filter.acknowledged !== undefined)
                list = list.filter(a => a.acknowledged === filter.acknowledged);
            if (filter.resolved !== undefined)
                list = list.filter(a => a.resolved === filter.resolved);
        }
        const limit = filter?.limit || 100;
        return list.slice(-limit).reverse();
    }
}
exports.AlertService = AlertService;
exports.alertService = new AlertService();
