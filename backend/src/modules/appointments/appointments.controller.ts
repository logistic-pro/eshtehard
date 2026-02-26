import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { sendSms } from '../../config/sms';
import { z } from 'zod';
import { toJalaliDateTime } from '../../utils/farsiDate';

// Driver requests to carry a cargo
export async function requestCargo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cargoId } = z.object({ cargoId: z.string().uuid() }).parse(req.body);

    const driver = await prisma.driverProfile.findUnique({ where: { userId: req.user.userId } });
    if (!driver) { res.status(404).json({ message: 'پروفایل راننده یافت نشد' }); return; }

    // Check 24-hour ban from previous cancellation
    if (driver.cancelBanUntil && new Date() < driver.cancelBanUntil) {
      const banEnd = toJalaliDateTime(driver.cancelBanUntil);
      res.status(403).json({ message: `به دلیل لغو قبلی، تا ${banEnd} اجازه درخواست بار ندارید` }); return;
    }

    // Check driver has no active IN_TRANSIT cargo
    const inTransit = await prisma.appointment.findFirst({
      where: { driverId: driver.id, status: 'CONFIRMED' },
      include: { cargo: true },
    });
    if (inTransit && ['IN_TRANSIT', 'DRIVER_ASSIGNED'].includes(inTransit.cargo?.status ?? '')) {
      res.status(400).json({ message: 'شما در حال حمل بار دیگری هستید. ابتدا آن را تحویل دهید' }); return;
    }

    const cargo = await prisma.cargo.findUnique({ where: { id: cargoId } });
    if (!cargo) { res.status(404).json({ message: 'بار یافت نشد' }); return; }
    if (cargo.status !== 'ANNOUNCED_TO_HALL') {
      res.status(400).json({ message: 'این بار در وضعیت اعلان سالن نیست' }); return;
    }
    if (!cargo.freightId) {
      res.status(400).json({ message: 'بار هنوز باربری ندارد' }); return;
    }

    // Check no duplicate request from this driver
    const existing = await prisma.appointment.findFirst({
      where: { cargoId, driverId: driver.id, status: { in: ['PENDING', 'CONFIRMED'] } },
    });
    if (existing) { res.status(409).json({ message: 'قبلاً درخواست داده‌اید' }); return; }

    const appointment = await prisma.appointment.create({
      data: {
        cargoId,
        driverId: driver.id,
        freightId: cargo.freightId,
        status: 'PENDING',
      },
      include: { cargo: true, driver: { include: { user: true } } },
    });

    res.status(201).json(appointment);
  } catch (err) { next(err); }
}

// Freight approves driver request — appointment date = cargo.loadingDateTime
export async function approveRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { note } = z.object({ note: z.string().optional() }).parse(req.body);

    const appt = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { driver: { include: { user: true } }, cargo: true },
    });
    if (!appt) { res.status(404).json({ message: 'درخواست یافت نشد' }); return; }
    if (appt.status !== 'PENDING') { res.status(400).json({ message: 'این درخواست قابل تأیید نیست' }); return; }

    // Reject all other pending requests for same cargo
    await prisma.appointment.updateMany({
      where: { cargoId: appt.cargoId, id: { not: appt.id }, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });

    // Use cargo.loadingDateTime as appointment date (set by producer)
    const appointmentDate = appt.cargo.loadingDateTime ?? new Date();

    const updated = await prisma.appointment.update({
      where: { id: appt.id },
      data: { status: 'CONFIRMED', appointmentDate, note },
    });

    // Update cargo status → DRIVER_ASSIGNED (removes from hall list)
    await prisma.cargo.update({ where: { id: appt.cargoId }, data: { status: 'DRIVER_ASSIGNED' } });
    await prisma.cargoStatusHistory.create({
      data: {
        cargoId: appt.cargoId,
        fromStatus: 'ANNOUNCED_TO_HALL',
        toStatus: 'DRIVER_ASSIGNED',
        changedBy: req.user.userId,
        note: 'تأیید درخواست راننده',
      },
    });
    await prisma.auditLog.create({
      data: { userId: req.user.userId, action: 'APPOINTMENT_APPROVED', entityType: 'Appointment', entityId: appt.id },
    });

    // SMS to driver
    const jalaliDate = toJalaliDateTime(appointmentDate);
    await sendSms(appt.driver.user.phone, `درخواست حمل بار ${appt.cargo.referenceCode} تأیید شد. تاریخ نوبت: ${jalaliDate}`);
    await prisma.appointment.update({ where: { id: appt.id }, data: { smsSent: true } });

    res.json(updated);
  } catch (err) { next(err); }
}

// Freight rejects driver request
export async function rejectRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const appt = await prisma.appointment.findUnique({ where: { id: req.params.id } });
    if (!appt) { res.status(404).json({ message: 'درخواست یافت نشد' }); return; }
    if (appt.status !== 'PENDING') { res.status(400).json({ message: 'این درخواست قابل رد نیست' }); return; }

    const updated = await prisma.appointment.update({
      where: { id: appt.id },
      data: { status: 'CANCELLED' },
    });
    res.json(updated);
  } catch (err) { next(err); }
}

// Driver cancels their own confirmed appointment → cargo back to ANNOUNCED_TO_HALL + 24h ban
export async function cancelByDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const driver = await prisma.driverProfile.findUnique({ where: { userId: req.user.userId } });
    if (!driver) { res.status(404).json({ message: 'پروفایل راننده یافت نشد' }); return; }

    const appt = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { cargo: true },
    });
    if (!appt) { res.status(404).json({ message: 'نوبت یافت نشد' }); return; }
    if (appt.driverId !== driver.id) { res.status(403).json({ message: 'این نوبت متعلق به شما نیست' }); return; }
    if (appt.status !== 'CONFIRMED') { res.status(400).json({ message: 'فقط نوبت‌های تأیید شده قابل لغو است' }); return; }

    // Cancel appointment
    await prisma.appointment.update({ where: { id: appt.id }, data: { status: 'CANCELLED' } });

    // Return cargo to ANNOUNCED_TO_HALL so other drivers can request
    await prisma.cargo.update({ where: { id: appt.cargoId }, data: { status: 'ANNOUNCED_TO_HALL' } });
    await prisma.cargoStatusHistory.create({
      data: {
        cargoId: appt.cargoId,
        fromStatus: 'DRIVER_ASSIGNED',
        toStatus: 'ANNOUNCED_TO_HALL',
        changedBy: req.user.userId,
        note: 'لغو توسط راننده',
      },
    });

    // Apply 24-hour ban on driver
    const banUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.driverProfile.update({ where: { id: driver.id }, data: { cancelBanUntil: banUntil } });

    res.json({ message: 'نوبت لغو شد. به مدت ۲۴ ساعت امکان درخواست بار جدید ندارید', banUntil });
  } catch (err) { next(err); }
}

// Driver updates cargo status: DRIVER_ASSIGNED → IN_TRANSIT → DELIVERED
export async function driverUpdateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = z.object({ status: z.enum(['IN_TRANSIT', 'DELIVERED']) }).parse(req.body);

    const driver = await prisma.driverProfile.findUnique({ where: { userId: req.user.userId } });
    if (!driver) { res.status(404).json({ message: 'پروفایل راننده یافت نشد' }); return; }

    const appt = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { cargo: true },
    });
    if (!appt) { res.status(404).json({ message: 'نوبت یافت نشد' }); return; }
    if (appt.driverId !== driver.id) { res.status(403).json({ message: 'این نوبت متعلق به شما نیست' }); return; }
    if (appt.status !== 'CONFIRMED') { res.status(400).json({ message: 'نوبت تأیید نشده' }); return; }

    const validTransitions: Record<string, string[]> = {
      DRIVER_ASSIGNED: ['IN_TRANSIT'],
      IN_TRANSIT: ['DELIVERED'],
    };
    if (!validTransitions[appt.cargo.status]?.includes(status)) {
      res.status(400).json({ message: `انتقال از ${appt.cargo.status} به ${status} مجاز نیست` }); return;
    }

    // Waybill must exist before driver can start moving (IN_TRANSIT) or deliver
    const waybill = await prisma.waybill.findUnique({ where: { appointmentId: appt.id } });
    if (!waybill) {
      res.status(400).json({ message: 'قبل از بارگیری، باید حواله الکترونیکی توسط باربری صادر شده باشد' }); return;
    }

    await prisma.cargo.update({ where: { id: appt.cargoId }, data: { status } });
    await prisma.cargoStatusHistory.create({
      data: {
        cargoId: appt.cargoId,
        fromStatus: appt.cargo.status,
        toStatus: status,
        changedBy: req.user.userId,
        note: `راننده وضعیت را به ${status} تغییر داد`,
      },
    });
    await prisma.auditLog.create({
      data: { userId: req.user.userId, action: `CARGO_${status}`, entityType: 'Cargo', entityId: appt.cargoId },
    });

    res.json({ message: 'وضعیت بار بروز شد', status });
  } catch (err) { next(err); }
}

// Admin lifts driver ban
export async function liftDriverBan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { driverId } = req.params;
    await prisma.driverProfile.update({ where: { id: driverId }, data: { cancelBanUntil: null } });
    res.json({ message: 'محدودیت راننده رفع شد' });
  } catch (err) { next(err); }
}

export async function listAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = '1', limit = '20', status } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: Record<string, unknown> = {};

    if (req.user.role === 'DRIVER') {
      const driver = await prisma.driverProfile.findUnique({ where: { userId: req.user.userId } });
      if (!driver) { res.status(404).json({ message: 'پروفایل راننده یافت نشد' }); return; }
      where.driverId = driver.id;
    } else if (req.user.role === 'FREIGHT_COMPANY') {
      const freight = await prisma.freightCompanyProfile.findUnique({ where: { userId: req.user.userId } });
      if (!freight) { res.status(404).json({ message: 'پروفایل باربری یافت نشد' }); return; }
      where.freightId = freight.id;
    }

    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          cargo: { select: { referenceCode: true, cargoType: true, originProvince: true, destProvince: true, status: true, weight: true, unit: true, fare: true, loadingDateTime: true } },
          driver: { include: { user: { select: { name: true, phone: true } }, vehicles: { take: 1 } } },
          waybill: true,
        },
      }),
      prisma.appointment.count({ where }),
    ]);
    res.json({ items, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
}

export async function getAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const appt = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: {
        cargo: true,
        driver: { include: { user: true, vehicles: true } },
        freight: { include: { user: true } },
        waybill: true,
      },
    });
    if (!appt) { res.status(404).json({ message: 'نوبت یافت نشد' }); return; }
    res.json(appt);
  } catch (err) { next(err); }
}
