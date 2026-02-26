import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { z } from 'zod';

const createTicketSchema = z.object({
  subject: z.string().min(5),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  message: z.string().min(10),
});

export async function createTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createTicketSchema.parse(req.body);
    const ticket = await prisma.ticket.create({
      data: {
        creatorId: req.user.userId,
        subject: data.subject,
        priority: data.priority,
        messages: { create: { senderId: req.user.userId, body: data.message } },
      },
      include: { messages: true },
    });
    res.status(201).json(ticket);
  } catch (err) { next(err); }
}

export async function listTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: Record<string, unknown> = {};
    if (req.user.role !== 'TERMINAL_ADMIN') where.creatorId = req.user.userId;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.ticket.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { creator: { select: { name: true, phone: true } }, messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
      }),
      prisma.ticket.count({ where }),
    ]);
    res.json({ items, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
}

export async function getTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: {
        creator: { select: { name: true, phone: true } },
        messages: { orderBy: { createdAt: 'asc' }, include: { sender: { select: { name: true, role: true } } } },
      },
    });
    if (!ticket) { res.status(404).json({ message: 'تیکت یافت نشد' }); return; }
    res.json(ticket);
  } catch (err) { next(err); }
}

export async function addMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const schema = z.object({ body: z.string().min(1) });
    const { body } = schema.parse(req.body);
    const msg = await prisma.ticketMessage.create({
      data: { ticketId: req.params.id, senderId: req.user.userId, body },
      include: { sender: { select: { name: true, role: true } } },
    });
    res.status(201).json(msg);
  } catch (err) { next(err); }
}

export async function updateTicketStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const schema = z.object({ status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']) });
    const { status } = schema.parse(req.body);
    const ticket = await prisma.ticket.update({ where: { id: req.params.id }, data: { status } });
    res.json(ticket);
  } catch (err) { next(err); }
}
