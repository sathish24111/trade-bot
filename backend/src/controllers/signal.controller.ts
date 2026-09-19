import { Request, Response } from 'express';
import { signalQualityService } from '../services/monitoring/signalQuality.service';

export class SignalController {
  async getSignals(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const signals = await signalQualityService.getSignals(limit);
      return res.json({
        success: true,
        signals,
        count: signals.length,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async getSignalById(req: Request, res: Response) {
    try {
      const signal = await signalQualityService.getSignalById(req.params.id);
      if (!signal) {
        return res.status(404).json({ success: false, error: 'Signal not found' });
      }
      return res.json({
        success: true,
        signal,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async getAnalytics(req: Request, res: Response) {
    try {
      const strategy = req.query.strategy as string | undefined;
      const asset = req.query.asset as string | undefined;
      const analytics = await signalQualityService.getSignalAnalytics(strategy, asset);
      return res.json({
        success: true,
        analytics,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const signalController = new SignalController();
