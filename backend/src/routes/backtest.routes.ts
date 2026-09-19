import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  runBacktest,
  compareStrategies,
  getBacktestHistory,
  getBacktestById
} from '../controllers/backtest.controller';

const router = Router();

router.use(authMiddleware);

router.post('/run', runBacktest);
router.post('/compare', compareStrategies);
router.get('/history', getBacktestHistory);
router.get('/:id', getBacktestById);

export default router;
