import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { listAuditLogs } from './audit.controller';

const router = Router();
router.use(authenticate);
router.use(requireRole('TERMINAL_ADMIN'));

router.get('/', listAuditLogs);

export default router;
