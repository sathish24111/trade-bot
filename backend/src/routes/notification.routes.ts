import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';

const router = Router();

router.post('/device', (req, res) => notificationController.registerDevice(req, res));
router.delete('/device/:id', (req, res) => notificationController.unregisterDevice(req, res));
router.get('/preferences', (req, res) => notificationController.getPreferences(req, res));
router.patch('/preferences', (req, res) => notificationController.updatePreferences(req, res));

export default router;
