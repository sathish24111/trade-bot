import { Request, Response } from 'express';
import { monitorService } from '../services/monitoring/monitor.service';
import { marketHealthService } from '../services/monitoring/marketHealth.service';

export class MonitorController {
  async getOverview(req: Request, res: Response) {
    try {
      const asset = (req.query.asset as string) || 'BTC/USD';
      const strategy = (req.query.strategy as string) || 'EMA_RSI';
      const data = await monitorService.getMonitorOverview(asset, strategy);
      return res.json({
        success: true,
        data,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async getAssetHealth(req: Request, res: Response) {
    try {
      const asset = req.params.asset || 'BTC/USD';
      const timeframe = (req.query.timeframe as string) || '5m';
      const data = await marketHealthService.evaluateAssetHealth(asset, timeframe);
      return res.json({
        success: true,
        data,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async getAllMarketHealth(req: Request, res: Response) {
    try {
      const data = await marketHealthService.getAllMarketHealth();
      return res.json({
        success: true,
        data,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async calculateDrift(req: Request, res: Response) {
    try {
      const { strategy = 'EMA_RSI', asset = 'BTC/USD', timeframe = '5m', paperWinRate, backtestWinRate, paperTrades } = req.body;
      const { strategyDriftService } = await import('../services/monitoring/strategyDrift.service');
      const metric = await strategyDriftService.calculateDrift({
        strategy,
        asset,
        timeframe,
        paperWinRate,
        backtestWinRate,
        paperTrades
      });
      return res.json({
        success: true,
        metric,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const monitorController = new MonitorController();
