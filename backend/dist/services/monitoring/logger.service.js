"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.LoggerService = void 0;
const env_1 = require("../../config/env");
const LOG_LEVEL_PRIORITY = {
    DEBUG: 10,
    INFO: 20,
    WARN: 30,
    ERROR: 40
};
class LoggerService {
    currentLevel = env_1.env.LOG_LEVEL;
    lastMarketTickLog = 0;
    setLevel(level) {
        this.currentLevel = level;
    }
    shouldLog(level) {
        return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.currentLevel];
    }
    sanitize(obj) {
        if (!obj || typeof obj !== 'object')
            return obj;
        const sanitized = Array.isArray(obj) ? [] : {};
        const sensitiveKeys = ['password', 'password_hash', 'token', 'secret', 'jwt_secret', 'fcm', 'authorization'];
        for (const key of Object.keys(obj)) {
            if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
                sanitized[key] = '[REDACTED]';
            }
            else if (typeof obj[key] === 'object') {
                sanitized[key] = this.sanitize(obj[key]);
            }
            else {
                sanitized[key] = obj[key];
            }
        }
        return sanitized;
    }
    log(entry) {
        if (!this.shouldLog(entry.level))
            return;
        // Market data tick throttling: max 1 per 5 seconds to prevent stdout saturation
        if (entry.category === 'MARKET_DATA' && entry.event === 'TICK') {
            const now = Date.now();
            if (now - this.lastMarketTickLog < 5000)
                return;
            this.lastMarketTickLog = now;
        }
        const payload = {
            timestamp: new Date().toISOString(),
            service: 'tradepilot-backend',
            mode: 'PAPER',
            ...entry,
            metadata: entry.metadata ? this.sanitize(entry.metadata) : undefined
        };
        const formatted = JSON.stringify(payload);
        if (entry.level === 'ERROR') {
            console.error(formatted);
        }
        else if (entry.level === 'WARN') {
            console.warn(formatted);
        }
        else {
            console.log(formatted);
        }
    }
    info(category, event, message, metadata, requestId) {
        this.log({ level: 'INFO', category, event, message, metadata, requestId });
    }
    warn(category, event, message, metadata, requestId) {
        this.log({ level: 'WARN', category, event, message, metadata, requestId });
    }
    error(category, event, message, metadata, requestId) {
        this.log({ level: 'ERROR', category, event, message, metadata, requestId });
    }
    debug(category, event, message, metadata, requestId) {
        this.log({ level: 'DEBUG', category, event, message, metadata, requestId });
    }
}
exports.LoggerService = LoggerService;
exports.logger = new LoggerService();
