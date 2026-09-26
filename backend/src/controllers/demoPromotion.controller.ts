import { Request, Response } from 'express';
import { demoPromotionService } from '../services/strategy/demoPromotion.service';

export class DemoPromotionController {
  public async getStatus(req: Request, res: Response) {
    try {
      const status = demoPromotionService.getStatus();
      return res.json({
        success: true,
        ...status,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    }
  }

  public async getMonitoring(req: Request, res: Response) {
    try {
      const monitoring = demoPromotionService.getMonitoring();
      return res.json({
        success: true,
        monitoring,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    }
  }

  public async postRollback(req: Request, res: Response) {
    try {
      const { reason, triggeredBy } = req.body || {};
      const event = demoPromotionService.rollbackToV2(
        reason || 'Manual emergency rollback triggered',
        triggeredBy || 'MANUAL_OPERATOR'
      );
      return res.json({
        success: true,
        message: 'Strategy configuration successfully rolled back to STRATEGY_V2 baseline.',
        event,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    }
  }

  public async postRestore(req: Request, res: Response) {
    try {
      const { reason, triggeredBy } = req.body || {};
      const event = demoPromotionService.restoreAbcCombo(
        reason || 'Restored ABC_COMBO active promoted strategy',
        triggeredBy || 'MANUAL_OPERATOR'
      );
      return res.json({
        success: true,
        message: 'Active strategy successfully restored to promoted ABC_COMBO.',
        event,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    }
  }

  public async postSimulateBatch(req: Request, res: Response) {
    try {
      const { count = 25 } = req.body || {};
      const monitoring = demoPromotionService.simulateDemoTradeBatch(Number(count) || 25);
      return res.json({
        success: true,
        message: `Successfully simulated and recorded batch of ${count} demo trades towards 200 target.`,
        monitoring,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    }
  }
}

export const demoPromotionController = new DemoPromotionController();
