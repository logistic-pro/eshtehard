import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import {
  createCargo, bulkCreateCargo, listCargo, getCargo,
  submitCargo, acceptCargo, setFare, cancelCargo, setCargoStatus,
  rejectCargo, getDriverRequests,
} from './cargo.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticate);

router.get('/', listCargo);
router.get('/:id', getCargo);
router.post('/', requireRole('PRODUCER'), createCargo);
router.post('/bulk', requireRole('PRODUCER'), upload.single('file'), bulkCreateCargo);
router.put('/:id/submit', requireRole('PRODUCER'), submitCargo);
router.put('/:id/accept', requireRole('FREIGHT_COMPANY'), acceptCargo);
router.put('/:id/set-fare', requireRole('FREIGHT_COMPANY'), setFare);
router.put('/:id/cancel', cancelCargo);
// Status updates (IN_TRANSIT/DELIVERED) are now handled by driver via appointments
router.put('/:id/reject', requireRole('FREIGHT_COMPANY', 'TERMINAL_ADMIN'), rejectCargo);
router.get('/:id/driver-requests', requireRole('FREIGHT_COMPANY', 'TERMINAL_ADMIN'), getDriverRequests);

export default router;
