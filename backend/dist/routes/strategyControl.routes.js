"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const strategyControl_controller_1 = require("../controllers/strategyControl.controller");
const router = (0, express_1.Router)();
router.get('/', (req, res) => strategyControl_controller_1.strategyControlController.getStrategies(req, res));
router.get('/audit-log', (req, res) => strategyControl_controller_1.strategyControlController.getAuditLog(req, res));
router.patch('/:id/state', (req, res) => strategyControl_controller_1.strategyControlController.updateState(req, res));
// Phase 7 Policy & Adaptive Controls
router.get('/:id/policy', (req, res) => strategyControl_controller_1.strategyControlController.getPolicy(req, res));
router.put('/:id/policy', (req, res) => strategyControl_controller_1.strategyControlController.updatePolicy(req, res));
router.get('/:id/adaptation-history', (req, res) => strategyControl_controller_1.strategyControlController.getAdaptationHistory(req, res));
router.post('/:id/pause', (req, res) => strategyControl_controller_1.strategyControlController.pauseStrategy(req, res));
router.post('/:id/resume', (req, res) => strategyControl_controller_1.strategyControlController.resumeStrategy(req, res));
exports.default = router;
