import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { performanceService } from '../services/performance.service';

export async function getSummary(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const summary = await performanceService.getSummary(req.user!.userId);
    res.json({
      success: true,
      summary,
      mode: 'DEMO MODE',
      disclaimer: 'Trading involves risk. Demo performance does not guarantee future results.'
    });
  } catch (err: any) {
    next(err);
  }
}

export async function getDaily(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const summary = await performanceService.getSummary(req.user!.userId);
    res.json({
      success: true,
      dailyPerformances: summary.dailyPerformances,
      mode: 'DEMO MODE'
    });
  } catch (err: any) {
    next(err);
  }
}

export async function getTrades(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const filter = req.query.filter as string | undefined;
    const limit = parseInt(req.query.limit as string || '50', 10);
    const offset = parseInt(req.query.offset as string || '0', 10);

    const trades = await performanceService.getTrades(req.user!.userId, limit, offset, filter);
    res.json({
      success: true,
      trades,
      mode: 'DEMO MODE'
    });
  } catch (err: any) {
    next(err);
  }
}
