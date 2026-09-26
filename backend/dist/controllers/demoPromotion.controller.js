"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.demoPromotionController = exports.DemoPromotionController = void 0;
const demoPromotion_service_1 = require("../services/strategy/demoPromotion.service");
class DemoPromotionController {
    async getStatus(req, res) {
        try {
            const status = demoPromotion_service_1.demoPromotionService.getStatus();
            return res.json({
                success: true,
                ...status,
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
    async getMonitoring(req, res) {
        try {
            const monitoring = demoPromotion_service_1.demoPromotionService.getMonitoring();
            return res.json({
                success: true,
                monitoring,
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
    async postRollback(req, res) {
        try {
            const { reason, triggeredBy } = req.body || {};
            const event = demoPromotion_service_1.demoPromotionService.rollbackToV2(reason || 'Manual emergency rollback triggered', triggeredBy || 'MANUAL_OPERATOR');
            return res.json({
                success: true,
                message: 'Strategy configuration successfully rolled back to STRATEGY_V2 baseline.',
                event,
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
    async postRestore(req, res) {
        try {
            const { reason, triggeredBy } = req.body || {};
            const event = demoPromotion_service_1.demoPromotionService.restoreAbcCombo(reason || 'Restored ABC_COMBO active promoted strategy', triggeredBy || 'MANUAL_OPERATOR');
            return res.json({
                success: true,
                message: 'Active strategy successfully restored to promoted ABC_COMBO.',
                event,
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
exports.DemoPromotionController = DemoPromotionController;
exports.demoPromotionController = new DemoPromotionController();
