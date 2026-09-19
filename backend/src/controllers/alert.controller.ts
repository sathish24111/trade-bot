import { Request, Response } from 'express';
import { alertService } from '../services/monitoring/alert.service';

export class AlertController {
  async getAlerts(req: Request, res: Response) {
    try {
      const severity = req.query.severity as any;
      const acknowledged = req.query.acknowledged ? req.query.acknowledged === 'true' : undefined;
      const resolved = req.query.resolved ? req.query.resolved === 'true' : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 50;

      const alerts = await alertService.getAlerts({ severity, acknowledged, resolved, limit });
      return res.json({
        success: true,
        alerts,
        count: alerts.length,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async acknowledgeAlert(req: Request, res: Response) {
    try {
      const alert = await alertService.acknowledgeAlert(req.params.id);
      return res.json({
        success: true,
        alert,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async resolveAlert(req: Request, res: Response) {
    try {
      const alert = await alertService.resolveAlert(req.params.id);
      return res.json({
        success: true,
        alert,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async createAlert(req: Request, res: Response) {
    try {
      const { type = 'SYSTEM', severity = 'LOW', asset = 'BTC/USD', strategy = 'EMA_RSI', message = 'Alert notification', metadata = {} } = req.body;
      const alert = await alertService.createAlert({
        type,
        severity,
        asset,
        strategy,
        message,
        metadata
      });
      return res.json({
        success: true,
        alert,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const alertController = new AlertController();
