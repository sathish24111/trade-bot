"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const provider_controller_1 = require("../controllers/provider.controller");
const router = (0, express_1.Router)();
router.get('/', (req, res) => provider_controller_1.providerController.listProviders(req, res));
router.get('/health', (req, res) => provider_controller_1.providerController.getHealth(req, res));
router.get('/events', (req, res) => provider_controller_1.providerController.getEvents(req, res));
exports.default = router;
