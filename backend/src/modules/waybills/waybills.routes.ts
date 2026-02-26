import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { createWaybill, listWaybills, getWaybillPdf } from './waybills.controller';

const router = Router();
router.use(authenticate);

router.get('/', listWaybills);
router.get('/:id/pdf', getWaybillPdf);
router.post('/', requireRole('FREIGHT_COMPANY', 'TERMINAL_ADMIN'), createWaybill);

export default router;
