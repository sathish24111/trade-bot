import { Request, Response, NextFunction } from 'express';
import { marketService } from '../services/market.service';

export async function getAllAssets(req: Request, res: Response, next: NextFunction) {
  try {
    const assets = await marketService.getAllAssets();
    res.json({
      success: true,
      assets,
      dataSource: 'SIMULATED MARKET DATA',
      mode: 'DEMO MODE',
      disclaimer: 'Trading involves risk. Demo performance does not guarantee future results.'
    });
  } catch (err: any) {
    next(err);
  }
}

export async function getAsset(req: Request, res: Response, next: NextFunction) {
  try {
    const timeframe = (req.query.timeframe as string) || '5m';
    const asset = await marketService.getAsset(req.params.asset, timeframe);
    if (!asset) {
      return res.status(404).json({
        success: false,
        error: `Asset ${req.params.asset} is not supported by active provider`
      });
    }
    res.json({
      success: true,
      asset,
      mode: 'DEMO MODE'
    });
  } catch (err: any) {
    next(err);
  }
}

export async function getCandles(req: Request, res: Response, next: NextFunction) {
  try {
    const timeframe = (req.query.timeframe as string) || '5m';
    const count = req.query.count ? parseInt(req.query.count as string, 10) : 60;
    const candles = await marketService.getCandles(req.params.asset, timeframe, count);
    res.json({
      success: true,
      asset: req.params.asset,
      timeframe,
      candles,
      mode: 'DEMO MODE'
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message || `Failed to fetch candles for ${req.params.asset}`
    });
  }
}

export async function getQuote(req: Request, res: Response, next: NextFunction) {
  try {
    const timeframe = (req.query.timeframe as string) || '5m';
    const quote = await marketService.getQuote(req.params.asset, timeframe);
    res.json({
      success: true,
      ...quote
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message || `Failed to fetch quote for ${req.params.asset}`
    });
  }
}
