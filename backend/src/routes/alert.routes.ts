import { Router } from 'express';
import { alertController } from '../controllers/alert.controller';

const router = Router();

router.get('/', (req, res) => alertController.getAlerts(req, res));
router.post('/', (req, res) => alertController.createAlert(req, res));
router.patch('/:id/acknowledge', (req, res) => alertController.acknowledgeAlert(req, res));
router.patch('/:id/resolve', (req, res) => alertController.resolveAlert(req, res));

export default router;
