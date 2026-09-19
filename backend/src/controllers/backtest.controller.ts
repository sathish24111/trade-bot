import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { backtestingService } from '../services/backtesting.service';

export async function runBacktest(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const {
      asset,
      timeframe,
      strategy,
      candles,
      initialBalance,
      tradeAmount,
      spread,
      slippage,
      fee
    } = req.body;

    if (!asset || !strategy) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: asset and strategy are required.'
      });
    }

    const result = await backtestingService.runBacktest({
      userId,
      asset,
      timeframe: timeframe || '5m',
      strategy,
      candles,
      initialBalance: initialBalance ? parseFloat(initialBalance) : undefined,
      tradeAmount: tradeAmount ? parseFloat(tradeAmount) : undefined,
      spread: spread !== undefined ? parseFloat(spread) : undefined,
      slippage: slippage !== undefined ? parseFloat(slippage) : undefined,
      fee: fee !== undefined ? parseFloat(fee) : undefined
    });

    res.json({
      success: true,
      result
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message || 'Backtest execution failed.'
    });
  }
}

export async function compareStrategies(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { asset, timeframe, count, initialBalance } = req.body;

    if (!asset) {
      return res.status(400).json({
        success: false,
        error: 'Asset parameter is required.'
      });
    }

    const result = await backtestingService.compareStrategies(
      userId,
      asset,
      timeframe || '5m',
      count ? parseInt(count, 10) : 100,
      initialBalance ? parseFloat(initialBalance) : 10000
    );

    res.json({
      success: true,
      ...result
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message || 'Strategy comparison failed.'
    });
  }
}

export async function getBacktestHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const history = await backtestingService.getUserBacktests(userId, limit);

    res.json({
      success: true,
      history,
      mode: 'PAPER'
    });
  } catch (err: any) {
    next(err);
  }
}

export async function getBacktestById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const backtest = await backtestingService.getBacktestById(id, userId);

    if (!backtest) {
      return res.status(404).json({
        success: false,
        error: 'Backtest run not found.'
      });
    }

    res.json({
      success: true,
      backtest
    });
  } catch (err: any) {
    next(err);
  }
}
