"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const strategyControl_controller_1 = require("../controllers/strategyControl.controller");
const demoPromotion_controller_1 = require("../controllers/demoPromotion.controller");
const router = (0, express_1.Router)();
// ABC_COMBO Demo Promotion & Rollback Endpoints
router.get('/demo-promotion/status', (req, res) => demoPromotion_controller_1.demoPromotionController.getStatus(req, res));
router.get('/demo-promotion/monitoring', (req, res) => demoPromotion_controller_1.demoPromotionController.getMonitoring(req, res));
router.post('/demo-promotion/rollback', (req, res) => demoPromotion_controller_1.demoPromotionController.postRollback(req, res));
router.post('/demo-promotion/restore', (req, res) => demoPromotion_controller_1.demoPromotionController.postRestore(req, res));
router.post('/demo-promotion/simulate-batch', (req, res) => demoPromotion_controller_1.demoPromotionController.postSimulateBatch(req, res));
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
