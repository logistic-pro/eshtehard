import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { createTicket, listTickets, getTicket, addMessage, updateTicketStatus } from './tickets.controller';

const router = Router();
router.use(authenticate);

router.get('/', listTickets);
router.get('/:id', getTicket);
router.post('/', createTicket);
router.post('/:id/messages', addMessage);
router.put('/:id/status', requireRole('TERMINAL_ADMIN'), updateTicketStatus);

export default router;
