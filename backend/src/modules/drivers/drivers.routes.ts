import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { listDrivers, createDriver, getDriver, updateDriver } from './drivers.controller';

const router = Router();
router.use(authenticate);

router.get('/', requireRole('FREIGHT_COMPANY', 'TERMINAL_ADMIN'), listDrivers);
router.get('/:id', requireRole('FREIGHT_COMPANY', 'TERMINAL_ADMIN'), getDriver);
router.post('/', requireRole('TERMINAL_ADMIN'), createDriver);
router.put('/:id', requireRole('TERMINAL_ADMIN'), updateDriver);

export default router;
