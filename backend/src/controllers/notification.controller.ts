import { Request, Response } from 'express';
import { notificationService } from '../services/notifications/notification.service';

export class NotificationController {
  async registerDevice(req: Request, res: Response) {
    try {
      const { token, platform } = req.body;
      const userId = (req as any).user?.id || 1;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'device token is required',
          mode: 'PAPER',
          isRealMoney: false,
          brokerConnected: false
        });
      }

      const device = await notificationService.registerDevice(userId, token, platform || 'ANDROID');
      return res.status(201).json({
        success: true,
        device,
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

  async unregisterDevice(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id || 1;

      const ok = await notificationService.unregisterDevice(userId, isNaN(Number(id)) ? id : Number(id));
      return res.json({
        success: ok,
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

  async getPreferences(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || 1;
      const preferences = await notificationService.getPreferences(userId);
      return res.json({
        success: true,
        preferences,
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

  async updatePreferences(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || 1;
      const preferences = await notificationService.updatePreferences(userId, req.body);
      return res.json({
        success: true,
        preferences,
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

export const notificationController = new NotificationController();
