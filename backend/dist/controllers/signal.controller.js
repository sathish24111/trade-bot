"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signalController = exports.SignalController = void 0;
const signalQuality_service_1 = require("../services/monitoring/signalQuality.service");
class SignalController {
    async getSignals(req, res) {
        try {
            const limit = req.query.limit ? Number(req.query.limit) : 50;
            const signals = await signalQuality_service_1.signalQualityService.getSignals(limit);
            return res.json({
                success: true,
                signals,
                count: signals.length,
                mode: 'PAPER',
                isRealMoney: false,
                brokerConnected: false
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
    async getSignalById(req, res) {
        try {
            const signal = await signalQuality_service_1.signalQualityService.getSignalById(req.params.id);
            if (!signal) {
                return res.status(404).json({ success: false, error: 'Signal not found' });
            }
            return res.json({
                success: true,
                signal,
                mode: 'PAPER',
                isRealMoney: false,
                brokerConnected: false
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
    async getAnalytics(req, res) {
        try {
            const strategy = req.query.strategy;
            const asset = req.query.asset;
            const analytics = await signalQuality_service_1.signalQualityService.getSignalAnalytics(strategy, asset);
            return res.json({
                success: true,
                analytics,
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
exports.SignalController = SignalController;
exports.signalController = new SignalController();
