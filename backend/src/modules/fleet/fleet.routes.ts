import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { listVehicles, createVehicle, getVehicle, updateVehicle, deleteVehicle } from './fleet.controller';

const router = Router();
router.use(authenticate);

router.get('/', listVehicles);
router.get('/:id', getVehicle);
router.post('/', requireRole('FREIGHT_COMPANY', 'TERMINAL_ADMIN'), createVehicle);
router.put('/:id', requireRole('FREIGHT_COMPANY', 'TERMINAL_ADMIN'), updateVehicle);
router.delete('/:id', requireRole('FREIGHT_COMPANY', 'TERMINAL_ADMIN'), deleteVehicle);

export default router;
