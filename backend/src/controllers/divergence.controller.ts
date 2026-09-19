import { Request, Response } from 'express';
import { divergenceService } from '../services/monitoring/divergence.service';

export class DivergenceController {
  async getDivergence(req: Request, res: Response) {
    try {
      const experimentId = req.params.experimentId;
      const report = await divergenceService.analyzeDivergence(experimentId);
      return res.json({
        success: true,
        report,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const divergenceController = new DivergenceController();
