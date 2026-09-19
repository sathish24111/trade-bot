import { Router } from 'express';
import { exportController } from '../controllers/export.controller';

const router = Router();

router.get('/:entity', (req, res) => exportController.exportData(req, res));
router.get('/:entity/:format', (req, res) => {
  req.query.format = req.params.format;
  exportController.exportData(req, res);
});

export default router;
