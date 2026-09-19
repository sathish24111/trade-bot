"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertController = exports.AlertController = void 0;
const alert_service_1 = require("../services/monitoring/alert.service");
class AlertController {
    async getAlerts(req, res) {
        try {
            const severity = req.query.severity;
            const acknowledged = req.query.acknowledged ? req.query.acknowledged === 'true' : undefined;
            const resolved = req.query.resolved ? req.query.resolved === 'true' : undefined;
            const limit = req.query.limit ? Number(req.query.limit) : 50;
            const alerts = await alert_service_1.alertService.getAlerts({ severity, acknowledged, resolved, limit });
            return res.json({
                success: true,
                alerts,
                count: alerts.length,
                mode: 'PAPER',
                isRealMoney: false,
                brokerConnected: false
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
    async acknowledgeAlert(req, res) {
        try {
            const alert = await alert_service_1.alertService.acknowledgeAlert(req.params.id);
            return res.json({
                success: true,
                alert,
                mode: 'PAPER',
                isRealMoney: false,
                brokerConnected: false
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
    async resolveAlert(req, res) {
        try {
            const alert = await alert_service_1.alertService.resolveAlert(req.params.id);
            return res.json({
                success: true,
                alert,
                mode: 'PAPER',
                isRealMoney: false,
                brokerConnected: false
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
    async createAlert(req, res) {
        try {
            const { type = 'SYSTEM', severity = 'LOW', asset = 'BTC/USD', strategy = 'EMA_RSI', message = 'Alert notification', metadata = {} } = req.body;
            const alert = await alert_service_1.alertService.createAlert({
                type,
                severity,
                asset,
                strategy,
                message,
                metadata
            });
            return res.json({
                success: true,
                alert,
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
exports.AlertController = AlertController;
exports.alertController = new AlertController();
