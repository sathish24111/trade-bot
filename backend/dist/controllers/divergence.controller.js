"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.divergenceController = exports.DivergenceController = void 0;
const divergence_service_1 = require("../services/monitoring/divergence.service");
class DivergenceController {
    async getDivergence(req, res) {
        try {
            const experimentId = req.params.experimentId;
            const report = await divergence_service_1.divergenceService.analyzeDivergence(experimentId);
            return res.json({
                success: true,
                report,
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
exports.DivergenceController = DivergenceController;
exports.divergenceController = new DivergenceController();
