import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import { paperExecutionEngine } from '../services/paperExecution.service';
import { RiskLevel, StrategyName } from '../models/TradingSession';

const startSessionSchema = z.object({
  investmentAmount: z.number().positive('Investment amount must be positive'),
  asset: z.string().optional().default('R_100'),
  strategy: z.enum(['EMA_RSI', 'MACD', 'BOLLINGER_BANDS', 'MULTI_INDICATOR', 'STRATEGY_V2', 'ABC_COMBO']),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  duration: z.number().int().min(1).max(240).default(30)
});

export async function startSession(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = startSessionSchema.parse(req.body);
    const userId = req.user!.userId;

    const session = await paperExecutionEngine.startSession(
      userId,
      data.investmentAmount,
      data.strategy as StrategyName,
      data.riskLevel as RiskLevel,
      data.duration,
      data.asset
    );

    res.status(201).json({
      success: true,
      sessionId: session.id,
      status: session.status,
      startingBalance: session.starting_balance,
      configuration: {
        investmentAmount: session.investment_amount,
        strategy: session.strategy,
        riskLevel: session.risk_level,
        duration: session.duration
      },
      mode: 'DEMO MODE',
      disclaimer: 'Trading involves risk. Demo performance does not guarantee future results.'
    });
  } catch (err: any) {
    next(err);
  }
}

export async function getSession(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const session = await paperExecutionEngine.getSessionById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }
    res.json({
      success: true,
      session,
      mode: 'DEMO MODE'
    });
  } catch (err: any) {
    next(err);
  }
}

export async function stopSession(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const session = await paperExecutionEngine.stopSession(req.params.id, 'Stopped by user');
    res.json({
      success: true,
      sessionId: session.id,
      status: session.status,
      endingBalance: session.ending_balance,
      currentPnL: session.current_pnl,
      mode: 'DEMO MODE'
    });
  } catch (err: any) {
    next(err);
  }
}

export async function executeTrade(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { asset = 'BTC/USD', direction = 'BUY', amount = 500, strategy = 'EMA_RSI' } = req.body;
    const trade = await paperExecutionEngine.executeSimulatedTrade({
      userId: req.user?.userId || 1,
      asset,
      direction,
      amount,
      strategy,
      entryPrice: 65000
    });
    res.json({
      success: true,
      trade,
      mode: 'DEMO MODE',
      isRealMoney: false
    });
  } catch (err: any) {
    next(err);
  }
}

export async function getUserSessions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const sessions = await paperExecutionEngine.getUserSessions(req.user!.userId);
    res.json({
      success: true,
      sessions,
      mode: 'DEMO MODE'
    });
  } catch (err: any) {
    next(err);
  }
}

