"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportController = exports.ExportController = void 0;
const export_service_1 = require("../services/monitoring/export.service");
class ExportController {
    async exportData(req, res) {
        try {
            const entity = req.params.entity || 'signals';
            const format = (req.query.format || 'json').toLowerCase();
            const result = await export_service_1.exportService.exportData(entity, format);
            res.setHeader('Content-Type', result.contentType);
            if (format === 'csv') {
                res.setHeader('Content-Disposition', `attachment; filename="${entity}_export_${Date.now()}.csv"`);
            }
            return res.send(result.data);
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
}
exports.ExportController = ExportController;
exports.exportController = new ExportController();
