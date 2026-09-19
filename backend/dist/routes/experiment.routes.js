"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const research_controller_1 = require("../controllers/research.controller");
const router = (0, express_1.Router)();
router.get('/:id/timeline', research_controller_1.getExperimentTimeline);
exports.default = router;
