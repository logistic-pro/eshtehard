import { Router } from 'express';
import { listTerminals, getTerminal, createTerminal, updateTerminal, deleteTerminal } from './terminals.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';

const router = Router();
router.use(authenticate);

router.get('/', listTerminals);
router.get('/:id', getTerminal);
router.post('/', requireRole('TERMINAL_ADMIN'), createTerminal);
router.put('/:id', requireRole('TERMINAL_ADMIN'), updateTerminal);
router.delete('/:id', requireRole('TERMINAL_ADMIN'), deleteTerminal);

export default router;
