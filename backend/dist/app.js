"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const market_routes_1 = __importDefault(require("./routes/market.routes"));
const trading_routes_1 = __importDefault(require("./routes/trading.routes"));
const performance_routes_1 = __importDefault(require("./routes/performance.routes"));
const backtest_routes_1 = __importDefault(require("./routes/backtest.routes"));
const research_routes_1 = __importDefault(require("./routes/research.routes"));
const monitor_routes_1 = __importDefault(require("./routes/monitor.routes"));
const signal_routes_1 = __importDefault(require("./routes/signal.routes"));
const risk_routes_1 = __importDefault(require("./routes/risk.routes"));
const strategyControl_routes_1 = __importDefault(require("./routes/strategyControl.routes"));
const alert_routes_1 = __importDefault(require("./routes/alert.routes"));
const portfolioExposure_routes_1 = __importDefault(require("./routes/portfolioExposure.routes"));
const divergence_routes_1 = __importDefault(require("./routes/divergence.routes"));
const health_routes_1 = __importDefault(require("./routes/health.routes"));
const export_routes_1 = __importDefault(require("./routes/export.routes"));
const provider_routes_1 = __importDefault(require("./routes/provider.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const experiment_routes_1 = __importDefault(require("./routes/experiment.routes"));
const deriv_routes_1 = __importDefault(require("./routes/deriv.routes"));
const rateLimit_middleware_1 = require("./middleware/rateLimit.middleware");
const error_middleware_1 = require("./middleware/error.middleware");
const requestTrace_middleware_1 = require("./middleware/requestTrace.middleware");
exports.app = (0, express_1.default)();
// Global Security & Utility Middlewares
exports.app.use((0, helmet_1.default)());
exports.app.use((0, cors_1.default)());
exports.app.use(express_1.default.json());
exports.app.use(express_1.default.urlencoded({ extended: true }));
exports.app.use(requestTrace_middleware_1.requestTraceMiddleware);
// Rate Limiter
exports.app.use('/api/', rateLimit_middleware_1.apiLimiter);
// Health check endpoint
exports.app.get('/api/health', (req, res) => {
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
exports.app.use('/api/auth', auth_routes_1.default);
exports.app.use('/api/market', market_routes_1.default);
exports.app.use('/api/trading', trading_routes_1.default);
exports.app.use('/api/performance', performance_routes_1.default);
exports.app.use('/api/backtest', backtest_routes_1.default);
exports.app.use('/api/research', research_routes_1.default);
exports.app.use('/api/monitor', monitor_routes_1.default);
exports.app.use('/api/signals', signal_routes_1.default);
exports.app.use('/api/risk', risk_routes_1.default);
exports.app.use('/api/strategies', strategyControl_routes_1.default);
exports.app.use('/api/strategy-control', strategyControl_routes_1.default);
exports.app.use('/api/alerts', alert_routes_1.default);
exports.app.use('/api/portfolio', portfolioExposure_routes_1.default);
exports.app.use('/api/divergence', divergence_routes_1.default);
exports.app.use('/api/health', health_routes_1.default);
exports.app.use('/api/export', export_routes_1.default);
exports.app.use('/api/providers', provider_routes_1.default);
exports.app.use('/api/notifications', notification_routes_1.default);
exports.app.use('/api/experiments', experiment_routes_1.default);
exports.app.use('/api/deriv', deriv_routes_1.default);
// Centralized Error Handler
exports.app.use(error_middleware_1.errorHandler);
