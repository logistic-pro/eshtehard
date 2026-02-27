import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';

export async function listAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = '1', limit = '50', action, userId } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: Record<string, unknown> = {};
    if (action) where.action = action;
    if (userId) where.userId = userId;

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, phone: true, role: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ items, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
}
