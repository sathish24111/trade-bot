import { Request, Response } from 'express';
import { portfolioExposureService } from '../services/monitoring/portfolioExposure.service';

export class PortfolioExposureController {
  async getOverview(req: Request, res: Response) {
    try {
      const exposure = await portfolioExposureService.calculatePortfolioExposure({
        portfolioId: 'default-portfolio',
        totalEquity: 10000.0,
        cashBalance: 8500.0,
        positions: [
          {
            asset: 'BTC/USD',
            strategy: 'EMA_RSI',
            direction: 'BUY',
            amount: 1500.0,
            unrealizedPnl: 45.0
          }
        ],
        dailyLoss: 0.0,
        currentDrawdown: 1.2
      });

      return res.json({
        success: true,
        exposure,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async getExposure(req: Request, res: Response) {
    return this.getOverview(req, res);
  }
}

export const portfolioExposureController = new PortfolioExposureController();
