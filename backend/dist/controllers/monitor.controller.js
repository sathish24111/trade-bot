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
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitorController = exports.MonitorController = void 0;
const monitor_service_1 = require("../services/monitoring/monitor.service");
const marketHealth_service_1 = require("../services/monitoring/marketHealth.service");
class MonitorController {
    async getOverview(req, res) {
        try {
            const asset = req.query.asset || 'BTC/USD';
            const strategy = req.query.strategy || 'EMA_RSI';
            const data = await monitor_service_1.monitorService.getMonitorOverview(asset, strategy);
            return res.json({
                success: true,
                data,
                mode: 'PAPER',
                isRealMoney: false,
                brokerConnected: false
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
    async getAssetHealth(req, res) {
        try {
            const asset = req.params.asset || 'BTC/USD';
            const timeframe = req.query.timeframe || '5m';
            const data = await marketHealth_service_1.marketHealthService.evaluateAssetHealth(asset, timeframe);
            return res.json({
                success: true,
                data,
                mode: 'PAPER',
                isRealMoney: false,
                brokerConnected: false
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
    async getAllMarketHealth(req, res) {
        try {
            const data = await marketHealth_service_1.marketHealthService.getAllMarketHealth();
            return res.json({
                success: true,
                data,
                mode: 'PAPER',
                isRealMoney: false,
                brokerConnected: false
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
    async calculateDrift(req, res) {
        try {
            const { strategy = 'EMA_RSI', asset = 'BTC/USD', timeframe = '5m', paperWinRate, backtestWinRate, paperTrades } = req.body;
            const { strategyDriftService } = await Promise.resolve().then(() => __importStar(require('../services/monitoring/strategyDrift.service')));
            const metric = await strategyDriftService.calculateDrift({
                strategy,
                asset,
                timeframe,
                paperWinRate,
                backtestWinRate,
                paperTrades
            });
            return res.json({
                success: true,
                metric,
                mode: 'PAPER',
                isRealMoney: false,
                brokerConnected: false
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
}
exports.MonitorController = MonitorController;
exports.monitorController = new MonitorController();
