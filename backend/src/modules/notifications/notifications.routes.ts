import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { listNotifications, markRead } from './notifications.controller';

const router = Router();
router.use(authenticate);

router.get('/', listNotifications);
router.put('/mark-read', markRead);

export default router;
