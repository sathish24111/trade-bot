import { Router } from 'express';
import { divergenceController } from '../controllers/divergence.controller';

const router = Router();

router.get('/:experimentId', (req, res) => divergenceController.getDivergence(req, res));

export default router;
