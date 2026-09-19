import { Request, Response } from 'express';
import { riskMonitorService } from '../services/monitoring/riskMonitor.service';
import { portfolioExposureService } from '../services/monitoring/portfolioExposure.service';

export class RiskController {
  async getOverview(req: Request, res: Response) {
    try {
      const state = riskMonitorService.getLatestState();
      return res.json({
        success: true,
        riskState: state?.riskState || 'NORMAL',
        riskUtilization: state?.riskUtilization || 0,
        state,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async recordEvent(req: Request, res: Response) {
    try {
      const { eventType = 'DRAWDOWN_WARNING', severity = 'WARNING', details = 'Risk warning check' } = req.body;
      await riskMonitorService.logRiskEvent({
        eventType,
        severity,
        details,
        currentDrawdown: 2.5,
        currentDailyLoss: 250,
        exposure: 5.0
      });
      return res.json({
        success: true,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async getLimits(req: Request, res: Response) {
    try {
      const limits = portfolioExposureService.getLimits();
      return res.json({
        success: true,
        limits,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async getEvents(req: Request, res: Response) {
    try {
      return res.json({
        success: true,
        events: [],
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const riskController = new RiskController();
