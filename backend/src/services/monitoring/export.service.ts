import { alertService } from './alert.service';
import { anomalyDetectionService } from './anomalyDetection.service';
import { signalQualityService } from './signalQuality.service';
import { strategyDriftService } from './strategyDrift.service';
import { systemHealthService } from './systemHealth.service';

export class ExportService {
  /**
   * Exports data for a requested entity in either JSON or CSV format.
   */
  async exportData(entity: string, format: 'json' | 'csv' = 'json'): Promise<{ contentType: string; data: string }> {
    let records: any[] = [];

    switch (entity.toLowerCase()) {
      case 'signals':
        records = await signalQualityService.getSignals(100);
        break;
      case 'alerts':
        records = await alertService.getAlerts({ limit: 100 });
        break;
      case 'drift':
      case 'strategy_drift':
        records = await strategyDriftService.getAllDriftMetrics();
        break;
      case 'anomalies':
        records = await anomalyDetectionService.getAnomalies(100);
        break;
      case 'system_health':
        const health = await systemHealthService.evaluateSystemHealth();
        records = health.components;
        break;
      default:
        records = await alertService.getAlerts({ limit: 20 });
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
  private convertToCsv(items: any[]): string {
    if (!items || items.length === 0) return 'No data available\n';

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

export const exportService = new ExportService();
