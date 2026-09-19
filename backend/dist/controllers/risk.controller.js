"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.riskController = exports.RiskController = void 0;
const riskMonitor_service_1 = require("../services/monitoring/riskMonitor.service");
const portfolioExposure_service_1 = require("../services/monitoring/portfolioExposure.service");
class RiskController {
    async getOverview(req, res) {
        try {
            const state = riskMonitor_service_1.riskMonitorService.getLatestState();
            return res.json({
                success: true,
                riskState: state?.riskState || 'NORMAL',
                riskUtilization: state?.riskUtilization || 0,
                state,
                mode: 'PAPER',
                isRealMoney: false,
                brokerConnected: false
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
    async recordEvent(req, res) {
        try {
            const { eventType = 'DRAWDOWN_WARNING', severity = 'WARNING', details = 'Risk warning check' } = req.body;
            await riskMonitor_service_1.riskMonitorService.logRiskEvent({
                eventType,
                severity,
                details,
                currentDrawdown: 2.5,
                currentDailyLoss: 250,
                exposure: 5.0
            });
            return res.json({
                success: true,
                mode: 'PAPER',
                isRealMoney: false,
                brokerConnected: false
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
    async getLimits(req, res) {
        try {
            const limits = portfolioExposure_service_1.portfolioExposureService.getLimits();
            return res.json({
                success: true,
                limits,
                mode: 'PAPER',
                isRealMoney: false,
                brokerConnected: false
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
    async getEvents(req, res) {
        try {
            return res.json({
                success: true,
                events: [],
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
exports.RiskController = RiskController;
exports.riskController = new RiskController();
