"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('5000').transform((v) => parseInt(v, 10)),
    DATABASE_HOST: zod_1.z.string().default('localhost'),
    DATABASE_PORT: zod_1.z.string().default('3306').transform((v) => parseInt(v, 10)),
    DATABASE_NAME: zod_1.z.string().default('tradepilot'),
    DATABASE_USER: zod_1.z.string().default('root'),
    DATABASE_PASSWORD: zod_1.z.string().default(''),
    JWT_SECRET: zod_1.z.string().default('tradepilot_jwt_super_secret_key_demo_2026'),
    NODE_ENV: zod_1.z.enum(['development', 'test', 'paper-production', 'production']).default('development'),
    LOG_LEVEL: zod_1.z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR']).default('INFO'),
    DATABASE_POOL_SIZE: zod_1.z.string().default('20').transform((v) => parseInt(v, 10)),
    DATABASE_IDLE_TIMEOUT_MS: zod_1.z.string().default('60000').transform((v) => parseInt(v, 10)),
    WEBSOCKET_MAX_CONNECTIONS: zod_1.z.string().default('500').transform((v) => parseInt(v, 10)),
    RESEARCH_MAX_CONCURRENT_JOBS: zod_1.z.string().default('5').transform((v) => parseInt(v, 10)),
    // Phase 3 Kill Switch: Only PAPER mode is allowed
    TRADING_MODE: zod_1.z.enum(['PAPER', 'LIVE']).default('PAPER'),
    // Phase 3 Market Data Provider: 'mock' or 'real'
    MARKET_DATA_PROVIDER: zod_1.z.enum(['mock', 'real']).default('mock'),
    MARKET_DATA_API_KEY: zod_1.z.string().optional().default(''),
    MARKET_DATA_BASE_URL: zod_1.z.string().optional().default(''),
    // Backtest simulation cost defaults
    BACKTEST_DEFAULT_SPREAD: zod_1.z.string().default('0.0001').transform(Number),
    BACKTEST_DEFAULT_SLIPPAGE: zod_1.z.string().default('0.0002').transform(Number),
    BACKTEST_DEFAULT_FEE: zod_1.z.string().default('0.0005').transform(Number),
    // Phase 7 Market Providers & Notifications
    DATA_PROVIDER_PRIMARY: zod_1.z.string().default('CRYPTO_WS'),
    DATA_PROVIDER_FALLBACK: zod_1.z.string().default('CRYPTO_REST'),
    FCM_SERVER_KEY: zod_1.z.string().optional().default('')
});
exports.env = envSchema.parse(process.env);
