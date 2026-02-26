import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { cargoSummary, driverPerformance, hallActivity, dashboardStats, freightStats, producerStats } from './reports.controller';

const router = Router();
router.use(authenticate);
router.use(requireRole('TERMINAL_ADMIN', 'FREIGHT_COMPANY'));

router.get('/cargo-summary', cargoSummary);
router.get('/driver-performance', driverPerformance);
router.get('/hall-activity', hallActivity);
router.get('/dashboard', dashboardStats);
router.get('/freight-stats', freightStats);
router.get('/producer-stats', producerStats);

export default router;
