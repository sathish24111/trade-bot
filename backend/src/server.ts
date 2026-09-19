import http from 'http';
import { app } from './app';
import { env } from './config/env';
import { initDatabase } from './config/database';
import { initWebSocketServer } from './websocket/websocket.server';

import { configValidationService } from './services/security/configValidation.service';
import { paperSafetyService } from './services/security/paperSafety.service';
import { logger } from './services/monitoring/logger.service';

async function bootstrap() {
  try {
    // 1. Fail-fast configuration validation
    configValidationService.validateStartupConfig();

    // 2. Centralized Paper Safety Guard
    paperSafetyService.verifySafetyOrThrow();

    logger.info('SECURITY', 'STARTUP_SAFETY_VERIFIED', 'TRADING_MODE=PAPER verified. Broker execution disabled.');

    console.log('[Database] Connecting and running schema migrations on MySQL...');
    await initDatabase();
    console.log('[Database] Schema verified and demo data seeded (bcrypt hash secured).');

    console.log('[Recovery] Executing system state recovery and safety reconciliation...');
    const { recoveryService } = await import('./services/monitoring/recovery.service');
    await recoveryService.executeRecovery();
    console.log('[Recovery] Startup recovery completed successfully.');

    const server = http.createServer(app);

    // Attach WebSocket server on /ws
    initWebSocketServer(server);
    console.log('[WebSocket] Live stream attached to endpoint: /ws');

    server.listen(env.PORT, () => {
      console.log(`[Server] TradePilot Paper Trading Backend running on port ${env.PORT} [DEMO MODE]`);
      console.log(`[Health] Healthcheck: http://localhost:${env.PORT}/api/health`);
    });
  } catch (err) {
    console.error('[Fatal] Error starting backend server:', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  bootstrap();
}
