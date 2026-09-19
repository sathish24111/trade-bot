"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = exports.NotificationController = void 0;
const notification_service_1 = require("../services/notifications/notification.service");
class NotificationController {
    async registerDevice(req, res) {
        try {
            const { token, platform } = req.body;
            const userId = req.user?.id || 1;
            if (!token) {
                return res.status(400).json({
                    success: false,
                    error: 'device token is required',
                    mode: 'PAPER',
                    isRealMoney: false,
                    brokerConnected: false
                });
            }
            const device = await notification_service_1.notificationService.registerDevice(userId, token, platform || 'ANDROID');
            return res.status(201).json({
                success: true,
                device,
                mode: 'PAPER',
                isRealMoney: false,
                brokerConnected: false
            });
        }
        catch (err) {
            return res.status(500).json({
                success: false,
                error: err.message,
                mode: 'PAPER',
                isRealMoney: false,
                brokerConnected: false
            });
        }
    }
    async unregisterDevice(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id || 1;
            const ok = await notification_service_1.notificationService.unregisterDevice(userId, isNaN(Number(id)) ? id : Number(id));
            return res.json({
                success: ok,
                mode: 'PAPER',
                isRealMoney: false,
                brokerConnected: false
            });
        }
        catch (err) {
            return res.status(500).json({
                success: false,
                error: err.message,
                mode: 'PAPER',
                isRealMoney: false,
                brokerConnected: false
            });
        }
    }
    async getPreferences(req, res) {
        try {
            const userId = req.user?.id || 1;
            const preferences = await notification_service_1.notificationService.getPreferences(userId);
            return res.json({
                success: true,
                preferences,
                mode: 'PAPER',
                isRealMoney: false,
                brokerConnected: false
            });
        }
        catch (err) {
            return res.status(500).json({
                success: false,
                error: err.message,
                mode: 'PAPER',
                isRealMoney: false,
                brokerConnected: false
            });
        }
    }
    async updatePreferences(req, res) {
        try {
            const userId = req.user?.id || 1;
            const preferences = await notification_service_1.notificationService.updatePreferences(userId, req.body);
            return res.json({
                success: true,
                preferences,
                mode: 'PAPER',
                isRealMoney: false,
                brokerConnected: false
            });
        }
        catch (err) {
            return res.status(500).json({
                success: false,
                error: err.message,
                mode: 'PAPER',
                isRealMoney: false,
                brokerConnected: false
            });
        }
    }
}
exports.NotificationController = NotificationController;
exports.notificationController = new NotificationController();
