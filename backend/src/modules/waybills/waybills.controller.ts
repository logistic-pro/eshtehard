import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { z } from 'zod';
import PDFDocument from 'pdfkit';
import { toJalaliDateTime } from '../../utils/farsiDate';
import fs from 'fs';
import path from 'path';

// Persian font: Tahoma on Windows dev, Vazirmatn in Docker (downloaded by Dockerfile)
const FONT_CANDIDATES = [
  path.join(__dirname, '../../assets/fonts/Vazirmatn-Regular.ttf'), // Docker
  'C:/Windows/Fonts/tahoma.ttf',                                     // Windows dev
];
const PERSIAN_FONT = FONT_CANDIDATES.find(p => fs.existsSync(p)) ?? null;

export async function createWaybill(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const schema = z.object({ appointmentId: z.string().uuid() });
    const { appointmentId } = schema.parse(req.body);

    const existing = await prisma.waybill.findUnique({ where: { appointmentId } });
    if (existing) { res.status(400).json({ message: 'حواله برای این نوبت قبلاً صادر شده است' }); return; }

    const appt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { cargo: true },
    });
    if (!appt) { res.status(404).json({ message: 'نوبت یافت نشد' }); return; }

    const waybill = await prisma.waybill.create({
      data: { cargoId: appt.cargoId, appointmentId },
      include: { cargo: true, appointment: { include: { driver: { include: { user: true } } } } },
    });

    // Update cargo to IN_TRANSIT
    await prisma.cargo.update({ where: { id: appt.cargoId }, data: { status: 'IN_TRANSIT' } });
    await prisma.cargoStatusHistory.create({
      data: {
        cargoId: appt.cargoId,
        fromStatus: 'DRIVER_ASSIGNED',
        toStatus: 'IN_TRANSIT',
        changedBy: req.user.userId,
        note: 'صدور حواله الکترونیکی',
      },
    });

    res.status(201).json(waybill);
  } catch (err) { next(err); }
}

export async function listWaybills(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [items, total] = await Promise.all([
      prisma.waybill.findMany({
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          cargo: { select: { referenceCode: true, cargoType: true, originProvince: true, destProvince: true, weight: true } },
          appointment: {
            include: { driver: { include: { user: { select: { name: true, phone: true } } } } },
          },
        },
      }),
      prisma.waybill.count(),
    ]);
    res.json({ items, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
}

export async function getWaybillPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const waybill = await prisma.waybill.findUnique({
      where: { id: req.params.id },
      include: {
        cargo: {
          include: {
            producer: { include: { user: { select: { name: true, phone: true } } } },
            freight: { include: { user: { select: { name: true, phone: true } } } },
          },
        },
        appointment: {
          include: {
            driver: { include: { user: { select: { name: true, phone: true } }, vehicles: true } },
          },
        },
      },
    });

    if (!waybill) { res.status(404).json({ message: 'حواله یافت نشد' }); return; }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=waybill-${waybill.waybillNumber}.pdf`);
    doc.pipe(res);

    if (PERSIAN_FONT) { try { doc.registerFont('Persian', PERSIAN_FONT); } catch { /* ignore */ } }
    const useFont = (size: number) => {
      if (PERSIAN_FONT) { try { doc.font('Persian').fontSize(size); return; } catch { /* ignore */ } }
      doc.fontSize(size);
    };

    // Helper: right-align Persian text (RTL)
    const rtl = (text: string) => ({ align: 'right' as const, features: ['rtla'] });

    useFont(18);
    doc.text('حواله الکترونیکی بار', { align: 'center' });
    doc.moveDown(0.5);

    // Separator line
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    useFont(12);
    const row = (label: string, val: string) => {
      doc.text(`${val}  :${label}`, { align: 'right', features: ['rtla'] });
    };

    row('شماره حواله', waybill.waybillNumber);
    row('کد مرجع بار', waybill.cargo.referenceCode);
    row('نوع بار', waybill.cargo.cargoType);
    row('وزن', `${waybill.cargo.weight} ${waybill.cargo.unit}`);
    row('مبدأ', `${waybill.cargo.originProvince} - ${waybill.cargo.originCity}`);
    row('مقصد', `${waybill.cargo.destProvince} - ${waybill.cargo.destCity}`);
    if (waybill.cargo.fare) row('کرایه', `${waybill.cargo.fare.toLocaleString()} ریال`);

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    row('نام راننده', waybill.appointment.driver.user.name);
    row('تلفن راننده', waybill.appointment.driver.user.phone);
    if (waybill.appointment.driver.vehicles[0]) {
      row('پلاک خودرو', waybill.appointment.driver.vehicles[0].plate);
      row('نوع خودرو', waybill.appointment.driver.vehicles[0].vehicleType);
    }

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    row('تاریخ صدور حواله', toJalaliDateTime(waybill.issuedAt));
    row('تاریخ نوبت بارگیری', waybill.appointment.appointmentDate
      ? toJalaliDateTime(waybill.appointment.appointmentDate) : '-');

    doc.moveDown(1);
    useFont(10);
    doc.text('سامانه مدیریت پایانه بار اشتهارد', { align: 'center' });

    doc.end();
  } catch (err) { next(err); }
}
