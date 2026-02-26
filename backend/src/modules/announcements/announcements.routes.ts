import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { createAnnouncement, listAnnouncements, suspendAnnouncement, resumeAnnouncement } from './announcements.controller';

const router = Router();
router.use(authenticate);

router.get('/', listAnnouncements);
router.post('/', requireRole('FREIGHT_COMPANY'), createAnnouncement);
router.put('/:id/suspend', requireRole('FREIGHT_COMPANY'), suspendAnnouncement);
router.put('/:id/resume', requireRole('FREIGHT_COMPANY'), resumeAnnouncement);

export default router;
