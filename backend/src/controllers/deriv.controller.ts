import { Request, Response, NextFunction } from 'express';
import { derivMarketProvider } from '../services/market/derivMarket.provider';
import { derivDemoTradingService } from '../services/trading/derivDemoTrading.service';
import { paperSafetyService } from '../services/security/paperSafety.service';

export async function getDerivStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const marketStatus = derivMarketProvider.getStatus();
    const demoAccount = derivDemoTradingService.getAccountInfo();

    return res.json({
      success: true,
      provider: marketStatus,
      demoTrading: demoAccount,
      ...paperSafetyService.getSafetyEnvelope()
    });
  } catch (err) {
    next(err);
  }
}

export async function getDerivAssets(req: Request, res: Response, next: NextFunction) {
  try {
    const assets = await derivMarketProvider.getAllAssets();
    return res.json({
      success: true,
      count: assets.length,
      assets,
      ...paperSafetyService.getSafetyEnvelope()
    });
  } catch (err) {
    next(err);
  }
}

export async function connectDerivDemo(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, appId } = req.body;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Deriv Demo API token is required in request body { "token": "..." }',
        ...paperSafetyService.getSafetyEnvelope()
      });
    }

    const account = await derivDemoTradingService.connectDemo(token, appId);
    return res.json({
      success: true,
      message: `Successfully connected to Deriv Demo Account (${account.loginId})`,
      account,
      ...paperSafetyService.getSafetyEnvelope()
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Failed to connect to Deriv Demo account',
      ...paperSafetyService.getSafetyEnvelope()
    });
  }
}

export async function disconnectDerivDemo(req: Request, res: Response, next: NextFunction) {
  try {
    derivDemoTradingService.disconnect();
    return res.json({
      success: true,
      message: 'Disconnected from Deriv Demo Account',
      ...paperSafetyService.getSafetyEnvelope()
    });
  } catch (err) {
    next(err);
  }
}

export async function getDerivDemoProposal(req: Request, res: Response, next: NextFunction) {
  try {
    const { symbol = 'R_100', amount = 10, contractType = 'CALL', duration = 5, durationUnit = 't' } = req.body;
    const proposal = await derivDemoTradingService.getProposal(
      symbol,
      Number(amount),
      contractType as 'CALL' | 'PUT',
      Number(duration),
      durationUnit
    );

    return res.json({
      success: true,
      proposal,
      ...paperSafetyService.getSafetyEnvelope()
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message,
      ...paperSafetyService.getSafetyEnvelope()
    });
  }
}

export async function executeDerivDemoTrade(req: Request, res: Response, next: NextFunction) {
  try {
    const { proposalId, price } = req.body;
    if (!proposalId || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'proposalId and price are required',
        ...paperSafetyService.getSafetyEnvelope()
      });
    }

    const result = await derivDemoTradingService.executeDemoTrade(proposalId, Number(price));
    return res.json({
      success: true,
      result,
      ...paperSafetyService.getSafetyEnvelope()
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message,
      ...paperSafetyService.getSafetyEnvelope()
    });
  }
}
