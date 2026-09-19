import { Router } from 'express';
import { signalController } from '../controllers/signal.controller';

const router = Router();

router.get('/', (req, res) => signalController.getSignals(req, res));
router.get('/analytics', (req, res) => signalController.getAnalytics(req, res));
router.get('/:id', (req, res) => signalController.getSignalById(req, res));

export default router;
