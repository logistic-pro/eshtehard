import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { z } from 'zod';
import PDFDocument from 'pdfkit';
import { toJalaliDateTime } from '../../utils/farsiDate';
import fs from 'fs';
import path from 'path';

const FONT_CANDIDATES = [
  path.join(__dirname, '../../assets/fonts/Vazirmatn-Regular.ttf'), // Docker
  'C:/Windows/Fonts/tahoma.ttf',                                     // Windows dev
];
const PERSIAN_FONT = FONT_CANDIDATES.find(p => fs.existsSync(p)) ?? null;

// Options for RTL Persian text in PDFKit
const RTL_OPTS = {
  align: 'right' as const,
  direction: 'rtl',
  script: 'arab',
  language: 'FAR',
  lineBreak: false,
};

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

    let fontLoaded = false;
    if (PERSIAN_FONT) {
      try {
        doc.registerFont('Persian', PERSIAN_FONT);
        fontLoaded = true;
      } catch { /* ignore */ }
    }

    const setFont = (size: number) => {
      if (fontLoaded) doc.font('Persian').fontSize(size);
      else doc.fontSize(size);
    };

    const pageWidth = doc.page.width;
    const margin = 50;
    const contentWidth = pageWidth - margin * 2;

    // Helper: draw a row with label on LEFT (LTR) and RTL value on RIGHT
    const row = (label: string, value: string) => {
      const y = doc.y;
      // Draw label left-aligned (LTR, monospace-friendly)
      setFont(11);
      doc.fillColor('#555').text(label + ':', margin, y, { width: 150, align: 'left', lineBreak: false });
      // Draw value right-aligned with RTL options
      doc.fillColor('#111').text(value, margin + 155, y, { width: contentWidth - 155, ...RTL_OPTS });
      doc.moveDown(0.6);
    };

    const separator = () => {
      doc.moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).strokeColor('#ccc').stroke();
      doc.moveDown(0.5);
    };

    // --- Title ---
    setFont(20);
    doc.fillColor('#1a237e').text('حواله الکترونیکی بار', margin, 50, { width: contentWidth, ...RTL_OPTS });
    doc.moveDown(0.3);
    doc.moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).strokeColor('#1a237e').lineWidth(2).stroke();
    doc.lineWidth(1);
    doc.moveDown(0.8);

    // --- Cargo info ---
    setFont(13);
    doc.fillColor('#333').text('اطلاعات بار', margin, doc.y, { width: contentWidth, ...RTL_OPTS });
    doc.moveDown(0.4);
    separator();

    setFont(11);
    row('Waybill No', waybill.waybillNumber);
    row('Ref Code', waybill.cargo.referenceCode);
    row('Cargo Type', waybill.cargo.cargoType);
    row('Weight', `${waybill.cargo.weight} ${waybill.cargo.unit}`);
    row('Origin', `${waybill.cargo.originProvince} - ${waybill.cargo.originCity}`);
    row('Destination', `${waybill.cargo.destProvince} - ${waybill.cargo.destCity}`);
    if (waybill.cargo.fare) row('Fare (IRR)', waybill.cargo.fare.toLocaleString());

    doc.moveDown(0.5);
    separator();

    // --- Driver info ---
    setFont(13);
    doc.fillColor('#333').text('اطلاعات راننده', margin, doc.y, { width: contentWidth, ...RTL_OPTS });
    doc.moveDown(0.4);
    separator();

    setFont(11);
    row('Driver', waybill.appointment.driver.user.name);
    row('Phone', waybill.appointment.driver.user.phone);
    if (waybill.appointment.driver.vehicles[0]) {
      row('Plate', waybill.appointment.driver.vehicles[0].plate);
      row('Vehicle', waybill.appointment.driver.vehicles[0].vehicleType);
    }

    doc.moveDown(0.5);
    separator();

    // --- Dates ---
    setFont(13);
    doc.fillColor('#333').text('تاریخ‌ها', margin, doc.y, { width: contentWidth, ...RTL_OPTS });
    doc.moveDown(0.4);
    separator();

    setFont(11);
    row('Issued', toJalaliDateTime(waybill.issuedAt));
    row('Loading', waybill.appointment.appointmentDate
      ? toJalaliDateTime(waybill.appointment.appointmentDate) : '-');

    doc.moveDown(1.5);
    setFont(9);
    doc.fillColor('#999').text('سامانه مدیریت پایانه بار اشتهارد', margin, doc.y, { width: contentWidth, align: 'center' });

    doc.end();
  } catch (err) { next(err); }
}
