import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { createWaybill, listWaybills, getWaybill, getWaybillPdf } from './waybills.controller';

const router = Router();
router.use(authenticate);

router.get('/', listWaybills);
router.get('/:id', getWaybill);
router.get('/:id/pdf', getWaybillPdf);
router.post('/', requireRole('FREIGHT_COMPANY', 'TERMINAL_ADMIN'), createWaybill);

export default router;
