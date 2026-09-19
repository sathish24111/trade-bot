"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportService = exports.ExportService = void 0;
const alert_service_1 = require("./alert.service");
const anomalyDetection_service_1 = require("./anomalyDetection.service");
const signalQuality_service_1 = require("./signalQuality.service");
const strategyDrift_service_1 = require("./strategyDrift.service");
const systemHealth_service_1 = require("./systemHealth.service");
class ExportService {
    /**
     * Exports data for a requested entity in either JSON or CSV format.
     */
    async exportData(entity, format = 'json') {
        let records = [];
        switch (entity.toLowerCase()) {
            case 'signals':
                records = await signalQuality_service_1.signalQualityService.getSignals(100);
                break;
            case 'alerts':
                records = await alert_service_1.alertService.getAlerts({ limit: 100 });
                break;
            case 'drift':
            case 'strategy_drift':
                records = await strategyDrift_service_1.strategyDriftService.getAllDriftMetrics();
                break;
            case 'anomalies':
                records = await anomalyDetection_service_1.anomalyDetectionService.getAnomalies(100);
                break;
            case 'system_health':
                const health = await systemHealth_service_1.systemHealthService.evaluateSystemHealth();
                records = health.components;
                break;
            default:
                records = await alert_service_1.alertService.getAlerts({ limit: 20 });
        }
        if (format === 'csv') {
            return {
                contentType: 'text/csv',
                data: this.convertToCsv(records)
            };
        }
        return {
            contentType: 'application/json',
            data: JSON.stringify({ entity, count: records.length, records, exportedAt: new Date().toISOString() }, null, 2)
        };
    }
    /**
     * Simple, reliable array to CSV serializer.
     */
    convertToCsv(items) {
        if (!items || items.length === 0)
            return 'No data available\n';
        const headers = Object.keys(items[0]);
        const lines = [headers.join(',')];
        for (const item of items) {
            const row = headers.map(header => {
                let val = item[header];
                if (typeof val === 'object' && val !== null) {
                    val = JSON.stringify(val).replace(/"/g, '""');
                    return `"${val}"`;
                }
                if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
                    return `"${val.replace(/"/g, '""')}"`;
                }
                return val !== undefined && val !== null ? val : '';
            });
            lines.push(row.join(','));
        }
        return lines.join('\n');
    }
}
exports.ExportService = ExportService;
exports.exportService = new ExportService();
