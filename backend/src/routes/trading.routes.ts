import { Router } from 'express';
import { startSession, getSession, stopSession, getUserSessions, executeTrade } from '../controllers/trading.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/session/start', authMiddleware, startSession);
router.get('/session/:id', authMiddleware, getSession);
router.post('/session/:id/stop', authMiddleware, stopSession);
router.get('/sessions', authMiddleware, getUserSessions);
router.post('/trade', authMiddleware, executeTrade);

export default router;
