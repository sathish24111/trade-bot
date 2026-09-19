import { Request, Response } from 'express';
import { exportService } from '../services/monitoring/export.service';

export class ExportController {
  async exportData(req: Request, res: Response) {
    try {
      const entity = req.params.entity || 'signals';
      const format = ((req.query.format as string) || 'json').toLowerCase() as 'json' | 'csv';

      const result = await exportService.exportData(entity, format);
      res.setHeader('Content-Type', result.contentType);
      if (format === 'csv') {
        res.setHeader('Content-Disposition', `attachment; filename="${entity}_export_${Date.now()}.csv"`);
      }
      return res.send(result.data);
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const exportController = new ExportController();
