import { Router } from 'express';
import { riskController } from '../controllers/risk.controller';

const router = Router();

router.get('/overview', (req, res) => riskController.getOverview(req, res));
router.get('/dashboard', (req, res) => riskController.getOverview(req, res));
router.get('/limits', (req, res) => riskController.getLimits(req, res));
router.get('/events', (req, res) => riskController.getEvents(req, res));
router.post('/event', (req, res) => riskController.recordEvent(req, res));

export default router;
