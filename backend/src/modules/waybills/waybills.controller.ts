import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { z } from 'zod';
import { toJalaliDateTime } from '../../utils/farsiDate';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const FONT_DIR = path.join(process.cwd(), 'assets/fonts');
const REGULAR = path.join(FONT_DIR, 'Vazirmatn-Regular.ttf');
const BOLD    = path.join(FONT_DIR, 'Vazirmatn-Bold.ttf');

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
    if (appt.status !== 'CONFIRMED') {
      res.status(400).json({ message: 'فقط برای نوبت‌های تأیید شده می‌توان حواله صادر کرد' }); return;
    }

    // Waybill issued — cargo stays DRIVER_ASSIGNED until driver picks up
    const waybill = await prisma.waybill.create({
      data: { cargoId: appt.cargoId, appointmentId },
      include: { cargo: true, appointment: { include: { driver: { include: { user: true } } } } },
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
          cargo: { select: { referenceCode: true, cargoType: true, originProvince: true, destProvince: true, weight: true, unit: true, fare: true } },
          appointment: {
            include: { driver: { include: { user: { select: { name: true, phone: true } }, vehicles: { take: 1 } } } },
          },
        },
      }),
      prisma.waybill.count(),
    ]);
    res.json({ items, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
}

export async function getWaybill(req: Request, res: Response, next: NextFunction): Promise<void> {
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
    res.json(waybill);
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

    const regularExists = fs.existsSync(REGULAR);
    const boldExists    = fs.existsSync(BOLD);
    if (!regularExists) { res.status(500).json({ message: `فونت یافت نشد: ${REGULAR}` }); return; }

    const cargo  = waybill.cargo;
    const driver = waybill.appointment.driver;
    const vehicle = driver.vehicles[0];
    const boldFont = boldExists ? BOLD : REGULAR;

    const doc = new PDFDocument({ size: 'A4', rtl: true, margins: { top: 50, bottom: 50, left: 40, right: 40 } });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=waybill-${waybill.waybillNumber}.pdf`);
    doc.pipe(res);

    doc.registerFont('Regular', REGULAR);
    doc.registerFont('Bold', boldFont);

    const W = doc.page.width - 80;
    const L = 40; // left margin
    const R = doc.page.width - 40; // right edge

    const section = (title: string) => {
      doc.moveDown(0.4);
      doc.font('Bold').fontSize(12).fillColor('#1a237e').text(title, L, doc.y, { width: W, align: 'right' });
      const y = doc.y + 2;
      doc.moveTo(L, y).lineTo(R, y).strokeColor('#cccccc').lineWidth(0.5).stroke();
      doc.moveDown(0.3);
    };

    const field = (label: string, value: string) => {
      const y = doc.y;
      doc.font('Bold').fontSize(10).fillColor('#555555')
        .text(label, R - 130, y, { width: 125, align: 'right' });
      doc.font('Regular').fontSize(10).fillColor('#111111')
        .text(value, L, y, { width: W - 135, align: 'right' });
      doc.moveDown(0.35);
    };

    // Title
    doc.font('Bold').fontSize(20).fillColor('#1a237e').text('حواله الکترونیکی بار', L, doc.y, { width: W, align: 'center' });
    doc.moveDown(0.3);
    doc.moveTo(L, doc.y).lineTo(R, doc.y).strokeColor('#1a237e').lineWidth(2).stroke();
    doc.moveDown(0.5);

    section('اطلاعات بار');
    field('شماره حواله', waybill.waybillNumber);
    field('کد مرجع', cargo.referenceCode);
    field('نوع بار', cargo.cargoType);
    field('وزن', `${cargo.weight} ${cargo.unit}`);
    field('مبدأ', `${cargo.originProvince} - ${cargo.originCity}`);
    field('مقصد', `${cargo.destProvince} - ${cargo.destCity}`);
    if (cargo.fare) field('کرایه (ریال)', cargo.fare.toLocaleString());

    section('اطلاعات راننده');
    field('نام راننده', driver.user.name);
    field('موبایل راننده', driver.user.phone);
    if (vehicle) { field('پلاک خودرو', vehicle.plate); field('نوع خودرو', vehicle.vehicleType); }

    if (cargo.producer) {
      section('تولیدکننده / فرستنده');
      field('نام', cargo.producer.user.name);
      field('موبایل', cargo.producer.user.phone);
    }

    section('تاریخ‌ها');
    field('تاریخ صدور', toJalaliDateTime(waybill.issuedAt));
    field('تاریخ نوبت', waybill.appointment.appointmentDate ? toJalaliDateTime(waybill.appointment.appointmentDate) : '-');

    doc.moveDown(2);
    doc.font('Regular').fontSize(9).fillColor('#999999').text('سامانه مدیریت پایانه بار اشتهارد', L, doc.y, { width: W, align: 'center' });

    doc.end();
  } catch (err) { next(err); }
}
