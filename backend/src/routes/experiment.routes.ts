import { Router } from 'express';
import { getExperimentTimeline } from '../controllers/research.controller';

const router = Router();

router.get('/:id/timeline', getExperimentTimeline);

export default router;
