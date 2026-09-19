import { Router } from 'express';
import { strategyControlController } from '../controllers/strategyControl.controller';

const router = Router();

router.get('/', (req, res) => strategyControlController.getStrategies(req, res));
router.get('/audit-log', (req, res) => strategyControlController.getAuditLog(req, res));
router.patch('/:id/state', (req, res) => strategyControlController.updateState(req, res));

// Phase 7 Policy & Adaptive Controls
router.get('/:id/policy', (req, res) => strategyControlController.getPolicy(req, res));
router.put('/:id/policy', (req, res) => strategyControlController.updatePolicy(req, res));
router.get('/:id/adaptation-history', (req, res) => strategyControlController.getAdaptationHistory(req, res));
router.post('/:id/pause', (req, res) => strategyControlController.pauseStrategy(req, res));
router.post('/:id/resume', (req, res) => strategyControlController.resumeStrategy(req, res));

export default router;
