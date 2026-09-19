import { Router } from 'express';
import { getSummary, getDaily, getTrades } from '../controllers/performance.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/summary', authMiddleware, getSummary);
router.get('/daily', authMiddleware, getDaily);
router.get('/trades', authMiddleware, getTrades);

export default router;
