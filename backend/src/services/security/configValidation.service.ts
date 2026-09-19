import { env } from '../../config/env';

export interface ConfigValidationResult {
  valid: boolean;
  environment: string;
  tradingMode: string;
  checks: {
    name: string;
    passed: boolean;
    detail: string;
  }[];
  timestamp: string;
}

export class ConfigValidationService {
  /**
   * Validates critical runtime configuration parameters at startup.
   * Throws an error immediately (FAIL FAST) if unsafe or invalid configuration is detected.
   */
  validateStartupConfig(): ConfigValidationResult {
    const checks: { name: string; passed: boolean; detail: string }[] = [];

    // 1. Absolute Safety Check: TRADING_MODE === 'PAPER'
    const isPaper = env.TRADING_MODE === 'PAPER';
    checks.push({
      name: 'TRADING_MODE_PAPER_LOCK',
      passed: isPaper,
      detail: isPaper
        ? 'TRADING_MODE is locked to PAPER (simulation only)'
        : `CRITICAL FAULT: TRADING_MODE is set to '${env.TRADING_MODE}'. Real trading forbidden.`
    });

    if (!isPaper) {
      throw new Error(
        `[CONFIG FATAL] Unsafe TRADING_MODE detected: '${env.TRADING_MODE}'. TradePilot strictly requires TRADING_MODE=PAPER. Refusing startup.`
      );
    }

    // 2. Database Configuration
    const dbValid = !!(env.DATABASE_HOST && env.DATABASE_NAME && env.DATABASE_USER && env.DATABASE_PORT > 0);
    checks.push({
      name: 'DATABASE_CONFIGURATION',
      passed: dbValid,
      detail: dbValid
        ? `Database configured on ${env.DATABASE_HOST}:${env.DATABASE_PORT}/${env.DATABASE_NAME}`
        : 'Invalid database connection parameters'
    });

    if (!dbValid) {
      throw new Error('[CONFIG FATAL] Incomplete or invalid database configuration.');
    }

    // 3. JWT Security
    const jwtValid = typeof env.JWT_SECRET === 'string' && env.JWT_SECRET.length >= 16;
    checks.push({
      name: 'JWT_SECURITY_SECRET',
      passed: jwtValid,
      detail: jwtValid ? 'JWT Secret meets minimum entropy requirements (>= 16 chars)' : 'JWT Secret is too short or missing'
    });

    if (!jwtValid) {
      throw new Error('[CONFIG FATAL] JWT_SECRET must be at least 16 characters long for security.');
    }

    // 4. WebSocket Limits
    const wsValid = env.WEBSOCKET_MAX_CONNECTIONS >= 10 && env.WEBSOCKET_MAX_CONNECTIONS <= 10000;
    checks.push({
      name: 'WEBSOCKET_LIMITS',
      passed: wsValid,
      detail: `Max WebSocket connections set to ${env.WEBSOCKET_MAX_CONNECTIONS}`
    });

    // 5. Research Concurrency Limits
    const researchValid = env.RESEARCH_MAX_CONCURRENT_JOBS >= 1 && env.RESEARCH_MAX_CONCURRENT_JOBS <= 50;
    checks.push({
      name: 'RESEARCH_CONCURRENCY',
      passed: researchValid,
      detail: `Max concurrent research jobs set to ${env.RESEARCH_MAX_CONCURRENT_JOBS}`
    });

    // 6. Market Data Provider Safety Check
    const noBrokerApiKeys = !process.env.BROKER_API_KEY && !process.env.LIVE_TRADING_KEY;
    checks.push({
      name: 'NO_LIVE_BROKER_CREDENTIALS',
      passed: noBrokerApiKeys,
      detail: noBrokerApiKeys ? 'Zero broker API keys detected in runtime environment' : 'CRITICAL: Live broker keys detected'
    });

    if (!noBrokerApiKeys) {
      throw new Error('[CONFIG FATAL] Live broker credentials detected in environment. Startup aborted for safety.');
    }

    return {
      valid: true,
      environment: env.NODE_ENV,
      tradingMode: env.TRADING_MODE,
      checks,
      timestamp: new Date().toISOString()
    };
  }
}

export const configValidationService = new ConfigValidationService();
