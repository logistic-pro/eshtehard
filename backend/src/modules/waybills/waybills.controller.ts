import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { z } from 'zod';
import { toJalaliDateTime } from '../../utils/farsiDate';
import fs from 'fs';
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PdfPrinter = require('@digicole/pdfmake-rtl');

const FONT_DIR = path.join(__dirname, '../../assets/fonts');
const REGULAR_FONT = path.join(FONT_DIR, 'Vazirmatn-Regular.ttf');
const BOLD_FONT = path.join(FONT_DIR, 'Vazirmatn-Bold.ttf');

function buildPrinter() {
  const regular = fs.existsSync(REGULAR_FONT) ? REGULAR_FONT : undefined;
  const bold = fs.existsSync(BOLD_FONT) ? BOLD_FONT : (regular ?? undefined);
  if (!regular) return null;
  return new PdfPrinter({
    Vazirmatn: { normal: regular, bold, italics: regular, bolditalics: bold },
  });
}

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

    // Create waybill — cargo stays DRIVER_ASSIGNED until driver starts moving
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

    const printer = buildPrinter();
    if (!printer) {
      res.status(500).json({ message: 'فونت PDF یافت نشد' }); return;
    }

    const cargo = waybill.cargo;
    const driver = waybill.appointment.driver;
    const vehicle = driver.vehicles[0];

    // Helper: a two-column row (label | value) — both in Persian, auto-RTL by pdfmake-rtl
    const row = (label: string, value: string) => ({
      columns: [
        { text: value, alignment: 'right', width: '*' },
        { text: label, alignment: 'right', width: 120, bold: true, color: '#555' },
      ],
      columnGap: 8,
      margin: [0, 2, 0, 2] as [number, number, number, number],
    });

    const separator = {
      canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#ccc' }],
      margin: [0, 6, 0, 6] as [number, number, number, number],
    };

    const sectionTitle = (text: string) => ({
      text,
      fontSize: 13,
      bold: true,
      color: '#1a237e',
      alignment: 'right',
      margin: [0, 8, 0, 4] as [number, number, number, number],
    });

    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60] as [number, number, number, number],
      defaultStyle: { font: 'Vazirmatn', fontSize: 11 },
      content: [
        // Title
        {
          text: 'حواله الکترونیکی بار',
          fontSize: 20,
          bold: true,
          color: '#1a237e',
          alignment: 'center',
          margin: [0, 0, 0, 4] as [number, number, number, number],
        },
        {
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: '#1a237e' }],
          margin: [0, 0, 0, 12] as [number, number, number, number],
        },

        // Cargo section
        sectionTitle('اطلاعات بار'),
        separator,
        row('شماره حواله', waybill.waybillNumber),
        row('کد مرجع بار', cargo.referenceCode),
        row('نوع بار', cargo.cargoType),
        row('وزن', `${cargo.weight} ${cargo.unit}`),
        row('مبدأ', `${cargo.originProvince} - ${cargo.originCity}`),
        row('مقصد', `${cargo.destProvince} - ${cargo.destCity}`),
        ...(cargo.fare ? [row('کرایه', `${cargo.fare.toLocaleString()} ریال`)] : []),

        separator,

        // Driver section
        sectionTitle('اطلاعات راننده'),
        separator,
        row('نام راننده', driver.user.name),
        row('تلفن راننده', driver.user.phone),
        ...(vehicle ? [
          row('پلاک خودرو', vehicle.plate),
          row('نوع خودرو', vehicle.vehicleType),
        ] : []),

        separator,

        // Parties
        ...(cargo.producer ? [
          sectionTitle('اطلاعات تولیدکننده'),
          separator,
          row('نام', cargo.producer.user.name),
          row('تلفن', cargo.producer.user.phone),
          separator,
        ] : []),

        // Dates
        sectionTitle('تاریخ‌ها'),
        separator,
        row('تاریخ صدور حواله', toJalaliDateTime(waybill.issuedAt)),
        row('تاریخ نوبت بارگیری', waybill.appointment.appointmentDate
          ? toJalaliDateTime(waybill.appointment.appointmentDate) : '-'),

        // Footer
        {
          text: 'سامانه مدیریت پایانه بار اشتهارد',
          fontSize: 9,
          color: '#999',
          alignment: 'center',
          margin: [0, 30, 0, 0] as [number, number, number, number],
        },
      ],
    };

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=waybill-${waybill.waybillNumber}.pdf`);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (err) { next(err); }
}
