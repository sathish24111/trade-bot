import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes';
import marketRoutes from './routes/market.routes';
import tradingRoutes from './routes/trading.routes';
import performanceRoutes from './routes/performance.routes';
import backtestRoutes from './routes/backtest.routes';
import researchRoutes from './routes/research.routes';
import monitorRoutes from './routes/monitor.routes';
import signalRoutes from './routes/signal.routes';
import riskRoutes from './routes/risk.routes';
import strategyControlRoutes from './routes/strategyControl.routes';
import alertRoutes from './routes/alert.routes';
import portfolioExposureRoutes from './routes/portfolioExposure.routes';
import divergenceRoutes from './routes/divergence.routes';
import healthRoutes from './routes/health.routes';
import exportRoutes from './routes/export.routes';
import providerRoutes from './routes/provider.routes';
import notificationRoutes from './routes/notification.routes';
import experimentRoutes from './routes/experiment.routes';
import derivRoutes from './routes/deriv.routes';
import { apiLimiter } from './middleware/rateLimit.middleware';
import { errorHandler } from './middleware/error.middleware';
import { requestTraceMiddleware } from './middleware/requestTrace.middleware';

export const app: Application = express();

// Global Security & Utility Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestTraceMiddleware);

// Rate Limiter
app.use('/api/', apiLimiter);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    service: 'TradePilot Backend API',
    mode: 'PAPER',
    isRealMoney: false,
    brokerConnected: false,
    executionEngine: 'DEMO_PAPER_TRADING_ONLY',
    timestamp: new Date().toISOString(),
    disclaimer: 'Trading involves risk. Demo performance does not guarantee future results.'
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/backtest', backtestRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/monitor', monitorRoutes);
app.use('/api/signals', signalRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/strategies', strategyControlRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/portfolio', portfolioExposureRoutes);
app.use('/api/divergence', divergenceRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/experiments', experimentRoutes);
app.use('/api/deriv', derivRoutes);

// Centralized Error Handler
app.use(errorHandler);
