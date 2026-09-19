import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((v) => parseInt(v, 10)),
  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_PORT: z.string().default('3306').transform((v) => parseInt(v, 10)),
  DATABASE_NAME: z.string().default('tradepilot'),
  DATABASE_USER: z.string().default('root'),
  DATABASE_PASSWORD: z.string().default(''),
  JWT_SECRET: z.string().default('tradepilot_jwt_super_secret_key_demo_2026'),
  NODE_ENV: z.enum(['development', 'test', 'paper-production', 'production']).default('development'),
  LOG_LEVEL: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR']).default('INFO'),
  DATABASE_POOL_SIZE: z.string().default('20').transform((v) => parseInt(v, 10)),
  DATABASE_IDLE_TIMEOUT_MS: z.string().default('60000').transform((v) => parseInt(v, 10)),
  WEBSOCKET_MAX_CONNECTIONS: z.string().default('500').transform((v) => parseInt(v, 10)),
  RESEARCH_MAX_CONCURRENT_JOBS: z.string().default('5').transform((v) => parseInt(v, 10)),
  
  // Phase 3 Kill Switch: Only PAPER mode is allowed
  TRADING_MODE: z.enum(['PAPER', 'LIVE']).default('PAPER'),
  
  // Phase 3 Market Data Provider: 'mock' or 'real'
  MARKET_DATA_PROVIDER: z.enum(['mock', 'real']).default('mock'),
  MARKET_DATA_API_KEY: z.string().optional().default(''),
  MARKET_DATA_BASE_URL: z.string().optional().default(''),

  // Backtest simulation cost defaults
  BACKTEST_DEFAULT_SPREAD: z.string().default('0.0001').transform(Number),
  BACKTEST_DEFAULT_SLIPPAGE: z.string().default('0.0002').transform(Number),
  BACKTEST_DEFAULT_FEE: z.string().default('0.0005').transform(Number),

  // Phase 7 Market Providers & Notifications
  DATA_PROVIDER_PRIMARY: z.string().default('CRYPTO_WS'),
  DATA_PROVIDER_FALLBACK: z.string().default('CRYPTO_REST'),
  FCM_SERVER_KEY: z.string().optional().default('')
});

export const env = envSchema.parse(process.env);
