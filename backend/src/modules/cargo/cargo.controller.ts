import { Request, Response, NextFunction } from 'express';
import { CargoService } from './cargo.service';
import { createCargoSchema, updateFareSchema } from './cargo.schema';
import { parseCargoExcel } from '../../utils/excelParser';
import { CargoStatus } from '@prisma/client';

const svc = new CargoService();

export async function createCargo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createCargoSchema.parse(req.body);
    const producer = await import('../../config/database').then(m =>
      m.prisma.producerProfile.findUnique({ where: { userId: req.user.userId } })
    );
    if (!producer) { res.status(404).json({ message: 'پروفایل تولیدکننده یافت نشد' }); return; }
    const cargo = await svc.create(producer.id, data as never, req.user.userId);
    res.status(201).json(cargo);
  } catch (err) { next(err); }
}

export async function bulkCreateCargo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) { res.status(400).json({ message: 'فایل اکسل ارسال نشده است' }); return; }
    const { prisma } = await import('../../config/database');
    const producer = await prisma.producerProfile.findUnique({ where: { userId: req.user.userId } });
    if (!producer) { res.status(404).json({ message: 'پروفایل تولیدکننده یافت نشد' }); return; }

    const rows = parseCargoExcel(req.file.buffer);
    const created = await Promise.all(rows.map(row => svc.create(producer.id, row as never, req.user.userId)));
    res.status(201).json({ count: created.length, items: created });
  } catch (err) { next(err); }
}

export async function listCargo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filters = req.query as Record<string, string>;
    const role = req.user.role;
    let result;
    if (role === 'PRODUCER') result = await svc.listForProducer(req.user.userId, filters);
    else if (role === 'FREIGHT_COMPANY') result = await svc.listForFreight(req.user.userId, filters);
    else if (role === 'TERMINAL_ADMIN') result = await svc.listAll(filters);
    else result = await svc.listForDriver(filters);
    res.json(result);
  } catch (err) { next(err); }
}

export async function getCargo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cargo = await svc.findById(req.params.id);
    if (!cargo) { res.status(404).json({ message: 'بار یافت نشد' }); return; }
    res.json(cargo);
  } catch (err) { next(err); }
}

export async function submitCargo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cargo = await svc.submit(req.params.id, req.user.userId);
    res.json(cargo);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطا';
    res.status(400).json({ message: msg });
  }
}

export async function acceptCargo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cargo = await svc.accept(req.params.id, req.user.userId);
    res.json(cargo);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطا';
    res.status(400).json({ message: msg });
  }
}

export async function setFare(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { fare } = updateFareSchema.parse(req.body);
    const cargo = await svc.setFare(req.params.id, fare, req.user.userId);
    res.json(cargo);
  } catch (err) { next(err); }
}

export async function cancelCargo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cargo = await svc.cancel(req.params.id, req.user.userId, req.body.note);
    res.json(cargo);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطا';
    res.status(400).json({ message: msg });
  }
}

export async function rejectCargo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { note } = req.body as { note?: string };
    const cargo = await svc.rejectWithNote(req.params.id, req.user.userId, note);
    res.json(cargo);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطا';
    res.status(400).json({ message: msg });
  }
}

export async function getDriverRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await svc.getDriverRequestsWithPriority(req.params.id);
    res.json(result);
  } catch (err) { next(err); }
}

export async function setCargoStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, note } = req.body as { status: CargoStatus; note?: string };
    const allowed: CargoStatus[] = ['IN_TRANSIT', 'DELIVERED'];
    if (!allowed.includes(status)) {
      res.status(400).json({ message: 'وضعیت نامعتبر است' }); return;
    }
    const cargo = await svc.setStatus(req.params.id, status, req.user.userId, note);
    res.json(cargo);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطا';
    res.status(400).json({ message: msg });
  }
}
