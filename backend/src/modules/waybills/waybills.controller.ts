import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { z } from 'zod';
import { toJalaliDateTime } from '../../utils/farsiDate';
import fs from 'fs';
import path from 'path';

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
          cargo: { select: { referenceCode: true, cargoType: true, originProvince: true, destProvince: true, weight: true, unit: true } },
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

    if (!regularExists) {
      res.status(500).json({ message: 'فونت PDF یافت نشد — لطفاً مجدد deploy کنید' }); return;
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfMake = require('pdfmake/build/pdfmake');
    pdfMake.fonts = {
      Vazirmatn: {
        normal:      REGULAR,
        bold:        boldExists ? BOLD : REGULAR,
        italics:     REGULAR,
        bolditalics: boldExists ? BOLD : REGULAR,
      },
    };

    const cargo  = waybill.cargo;
    const driver = waybill.appointment.driver;
    const vehicle = driver.vehicles[0];

    const R = 'right' as const;
    const C = 'center' as const;

    // Two-column row: label (bold, right) | value (right)
    const row = (label: string, value: string) => ({
      columns: [
        { text: value, alignment: R, width: '*' },
        { text: label, alignment: R, bold: true, color: '#444', width: 130 },
      ],
      columnGap: 10,
      margin: [0, 3, 0, 3] as [number,number,number,number],
    });

    const divider = {
      canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#ccc' }],
      margin: [0, 6, 0, 8] as [number,number,number,number],
    };

    const section = (title: string) => ({
      text: title, fontSize: 13, bold: true, color: '#1a237e', alignment: R,
      margin: [0, 6, 0, 4] as [number,number,number,number],
    });

    const docDef = {
      defaultStyle: { font: 'Vazirmatn', fontSize: 11, rtl: true },
      pageMargins: [40, 50, 40, 50] as [number,number,number,number],
      content: [
        { text: 'حواله الکترونیکی بار', fontSize: 20, bold: true, color: '#1a237e', alignment: C, margin: [0,0,0,4] as [number,number,number,number] },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: '#1a237e' }], margin: [0,0,0,12] as [number,number,number,number] },

        section('اطلاعات بار'),
        divider,
        row('شماره حواله', waybill.waybillNumber),
        row('کد مرجع', cargo.referenceCode),
        row('نوع بار', cargo.cargoType),
        row('وزن', `${cargo.weight} ${cargo.unit}`),
        row('مبدأ', `${cargo.originProvince} - ${cargo.originCity}`),
        row('مقصد', `${cargo.destProvince} - ${cargo.destCity}`),
        ...(cargo.fare ? [row('کرایه (ریال)', cargo.fare.toLocaleString())] : []),
        divider,

        section('اطلاعات راننده'),
        divider,
        row('نام راننده', driver.user.name),
        row('موبایل راننده', driver.user.phone),
        ...(vehicle ? [
          row('پلاک خودرو', vehicle.plate),
          row('نوع خودرو', vehicle.vehicleType),
        ] : []),
        divider,

        ...(cargo.producer ? [
          section('تولیدکننده / فرستنده'),
          divider,
          row('نام', cargo.producer.user.name),
          row('موبایل', cargo.producer.user.phone),
          divider,
        ] : []),

        section('تاریخ‌ها'),
        divider,
        row('تاریخ صدور حواله', toJalaliDateTime(waybill.issuedAt)),
        row('تاریخ نوبت بارگیری', waybill.appointment.appointmentDate
          ? toJalaliDateTime(waybill.appointment.appointmentDate) : '-'),

        { text: 'سامانه مدیریت پایانه بار اشتهارد', fontSize: 9, color: '#999', alignment: C, margin: [0, 30, 0, 0] as [number,number,number,number] },
      ],
    };

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=waybill-${waybill.waybillNumber}.pdf`);

    const pdfDoc = pdfMake.createPdf(docDef);
    pdfDoc.getBuffer((buffer: Buffer) => res.send(buffer));
  } catch (err) { next(err); }
}
