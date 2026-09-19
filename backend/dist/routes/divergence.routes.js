"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const divergence_controller_1 = require("../controllers/divergence.controller");
const router = (0, express_1.Router)();
router.get('/:experimentId', (req, res) => divergence_controller_1.divergenceController.getDivergence(req, res));
exports.default = router;
