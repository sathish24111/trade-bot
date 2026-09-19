import { exportService } from '../src/services/monitoring/export.service';

describe('JSON and CSV Export Service Tests', () => {
  test('exports signals in JSON and CSV formats', async () => {
    const jsonExport = await exportService.exportData('signals', 'json');
    expect(jsonExport.contentType).toBe('application/json');
    const parsed = JSON.parse(jsonExport.data);
    expect(parsed.entity).toBe('signals');
    expect(Array.isArray(parsed.records)).toBe(true);

    const csvExport = await exportService.exportData('signals', 'csv');
    expect(csvExport.contentType).toBe('text/csv');
    expect(typeof csvExport.data).toBe('string');
  });

  test('exports alerts in CSV format with headers', async () => {
    const csvExport = await exportService.exportData('alerts', 'csv');
    expect(csvExport.contentType).toBe('text/csv');
    expect(csvExport.data.length).toBeGreaterThan(0);
  });
});
