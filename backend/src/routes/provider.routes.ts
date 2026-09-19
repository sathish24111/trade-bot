import { Router } from 'express';
import { providerController } from '../controllers/provider.controller';

const router = Router();

router.get('/', (req, res) => providerController.listProviders(req, res));
router.get('/health', (req, res) => providerController.getHealth(req, res));
router.get('/events', (req, res) => providerController.getEvents(req, res));

export default router;
