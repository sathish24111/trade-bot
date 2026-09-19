import { Router } from 'express';
import { portfolioExposureController } from '../controllers/portfolioExposure.controller';

const router = Router();

router.get('/overview', (req, res) => portfolioExposureController.getOverview(req, res));
router.get('/exposure', (req, res) => portfolioExposureController.getExposure(req, res));

export default router;
