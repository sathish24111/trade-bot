import { Router } from 'express';
import {
  getDerivStatus,
  getDerivAssets,
  connectDerivDemo,
  disconnectDerivDemo,
  getDerivDemoProposal,
  executeDerivDemoTrade
} from '../controllers/deriv.controller';

const router = Router();

router.get('/status', getDerivStatus);
router.get('/assets', getDerivAssets);
router.post('/connect-demo', connectDerivDemo);
router.post('/disconnect-demo', disconnectDerivDemo);
router.post('/demo-proposal', getDerivDemoProposal);
router.post('/demo-trade', executeDerivDemoTrade);

export default router;
