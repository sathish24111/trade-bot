"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const export_controller_1 = require("../controllers/export.controller");
const router = (0, express_1.Router)();
router.get('/:entity', (req, res) => export_controller_1.exportController.exportData(req, res));
router.get('/:entity/:format', (req, res) => {
    req.query.format = req.params.format;
    export_controller_1.exportController.exportData(req, res);
});
exports.default = router;
