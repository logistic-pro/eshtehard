import { Router } from 'express';
import { listHalls, getHall, createHall, updateHall, deleteHall } from './halls.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';

const router = Router();
router.use(authenticate);

router.get('/', listHalls);
router.get('/:id', getHall);
router.post('/', requireRole('TERMINAL_ADMIN'), createHall);
router.put('/:id', requireRole('TERMINAL_ADMIN'), updateHall);
router.delete('/:id', requireRole('TERMINAL_ADMIN'), deleteHall);

export default router;
