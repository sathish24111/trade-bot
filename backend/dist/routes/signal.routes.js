"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const signal_controller_1 = require("../controllers/signal.controller");
const router = (0, express_1.Router)();
router.get('/', (req, res) => signal_controller_1.signalController.getSignals(req, res));
router.get('/analytics', (req, res) => signal_controller_1.signalController.getAnalytics(req, res));
router.get('/:id', (req, res) => signal_controller_1.signalController.getSignalById(req, res));
exports.default = router;
