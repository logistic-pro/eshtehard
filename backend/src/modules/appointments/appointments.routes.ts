import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import {
  requestCargo, approveRequest, rejectRequest,
  cancelByDriver, driverUpdateStatus, liftDriverBan,
  listAppointments, getAppointment,
} from './appointments.controller';

const router = Router();
router.use(authenticate);

router.get('/', listAppointments);
router.get('/:id', getAppointment);

// Driver: request cargo, cancel own appointment, update status
router.post('/request', requireRole('DRIVER'), requestCargo);
router.put('/:id/cancel', requireRole('DRIVER'), cancelByDriver);
router.put('/:id/driver-status', requireRole('DRIVER'), driverUpdateStatus);

// Freight: approve or reject driver requests
router.put('/:id/approve', requireRole('FREIGHT_COMPANY', 'TERMINAL_ADMIN'), approveRequest);
router.put('/:id/reject', requireRole('FREIGHT_COMPANY', 'TERMINAL_ADMIN'), rejectRequest);

// Admin: lift driver ban
router.put('/drivers/:driverId/lift-ban', requireRole('TERMINAL_ADMIN'), liftDriverBan);

export default router;
