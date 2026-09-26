"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = require("./app");
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const websocket_server_1 = require("./websocket/websocket.server");
const configValidation_service_1 = require("./services/security/configValidation.service");
const paperSafety_service_1 = require("./services/security/paperSafety.service");
const demoPromotion_service_1 = require("./services/strategy/demoPromotion.service");
const logger_service_1 = require("./services/monitoring/logger.service");
async function bootstrap() {
    try {
        // 1. Fail-fast configuration validation
        configValidation_service_1.configValidationService.validateStartupConfig();
        // 2. Centralized Paper Safety Guard
        paperSafety_service_1.paperSafetyService.verifySafetyOrThrow();
        // 3. Promoted ABC_COMBO Demo Strategy Startup Safety Gate
        demoPromotion_service_1.demoPromotionService.verifyStartupSafetyGate();
        logger_service_1.logger.info('SECURITY', 'STARTUP_SAFETY_VERIFIED', 'TRADING_MODE=PAPER and ACTIVE_STRATEGY=ABC_COMBO verified. Broker execution disabled.');
        console.log('[Database] Connecting and running schema migrations on MySQL...');
        await (0, database_1.initDatabase)();
        console.log('[Database] Schema verified and demo data seeded (bcrypt hash secured).');
        console.log('[Recovery] Executing system state recovery and safety reconciliation...');
        const { recoveryService } = await Promise.resolve().then(() => __importStar(require('./services/monitoring/recovery.service')));
        await recoveryService.executeRecovery();
        console.log('[Recovery] Startup recovery completed successfully.');
        const server = http_1.default.createServer(app_1.app);
        // Attach WebSocket server on /ws
        (0, websocket_server_1.initWebSocketServer)(server);
        console.log('[WebSocket] Live stream attached to endpoint: /ws');
        server.listen(env_1.env.PORT, () => {
            console.log(`[Server] TradePilot Paper Trading Backend running on port ${env_1.env.PORT} [DEMO MODE]`);
            console.log(`[Health] Healthcheck: http://localhost:${env_1.env.PORT}/api/health`);
        });
    }
    catch (err) {
        console.error('[Fatal] Error starting backend server:', err);
        process.exit(1);
    }
}
if (process.env.NODE_ENV !== 'test') {
    bootstrap();
}
