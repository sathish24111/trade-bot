import { Router } from 'express';
import { getAllAssets, getAsset, getCandles, getQuote } from '../controllers/market.controller';

const router = Router();

router.get('/assets', getAllAssets);
router.get('/:asset/quote', getQuote);
router.get('/:asset/candles', getCandles);
router.get('/:asset', getAsset);

export default router;
