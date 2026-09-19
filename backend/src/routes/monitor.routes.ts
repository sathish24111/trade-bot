import { Router } from 'express';
import { monitorController } from '../controllers/monitor.controller';

const router = Router();

router.get('/overview', (req, res) => monitorController.getOverview(req, res));
router.get('/market-health', (req, res) => monitorController.getAllMarketHealth(req, res));
router.get('/assets/:asset', (req, res) => monitorController.getAssetHealth(req, res));
router.post('/drift', (req, res) => monitorController.calculateDrift(req, res));

export default router;
