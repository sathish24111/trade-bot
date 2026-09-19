"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const portfolioExposure_controller_1 = require("../controllers/portfolioExposure.controller");
const router = (0, express_1.Router)();
router.get('/overview', (req, res) => portfolioExposure_controller_1.portfolioExposureController.getOverview(req, res));
router.get('/exposure', (req, res) => portfolioExposure_controller_1.portfolioExposureController.getExposure(req, res));
exports.default = router;
