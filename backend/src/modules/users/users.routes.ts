import { Router } from 'express';
import { getMe, updateMe, listUsers, getUserById, createUser, updateUser } from './users.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/me', getMe);
router.put('/me', updateMe);
router.get('/', requireRole('TERMINAL_ADMIN'), listUsers);
router.post('/', requireRole('TERMINAL_ADMIN'), createUser);
router.get('/:id', requireRole('TERMINAL_ADMIN'), getUserById);
router.put('/:id', requireRole('TERMINAL_ADMIN'), updateUser);

export default router;
