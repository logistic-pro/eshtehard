import { toJalaliDateTime } from './jalali';

type WaybillDetail = {
  waybillNumber: string;
  issuedAt: string;
  cargo: {
    referenceCode: string; cargoType: string;
    originProvince: string; originCity: string;
    destProvince: string; destCity: string;
    weight: number; unit: string; fare?: number;
    producer?: { user: { name: string; phone: string } };
    freight?: { user: { name: string; phone: string } };
  };
  appointment: {
    appointmentDate?: string;
    driver: { user: { name: string; phone: string }; vehicles: { plate: string; vehicleType: string }[] };
  };
};

export function printWaybill(w: WaybillDetail) {
  const cargo = w.cargo;
  const driver = w.appointment.driver;
  const vehicle = driver.vehicles[0];

  const row = (label: string, value: string) => `
    <tr>
      <td class="label">${label}</td>
      <td class="value">${value}</td>
    </tr>`;

  const section = (title: string) => `
    <tr class="section-row">
      <td colspan="2" class="section">${title}</td>
    </tr>`;

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8" />
  <title>حواله ${w.waybillNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Vazirmatn', Tahoma, Arial, sans-serif; font-size: 13px; color: #222; padding: 30px; direction: rtl; }
    h1 { text-align: center; color: #1a237e; font-size: 20px; margin-bottom: 6px; }
    .subtitle { text-align: center; color: #666; font-size: 11px; margin-bottom: 18px; }
    hr.thick { border: none; border-top: 2px solid #1a237e; margin-bottom: 18px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    td { padding: 6px 10px; border-bottom: 1px solid #eee; vertical-align: middle; }
    .label { width: 140px; font-weight: bold; color: #444; text-align: right; }
    .value { text-align: right; }
    .section { background: #e8eaf6; color: #1a237e; font-weight: bold; font-size: 13px; padding: 6px 10px; text-align: right; }
    .footer { text-align: center; color: #999; font-size: 10px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; }
    @media print {
      body { padding: 10px; }
      button { display: none !important; }
    }
  </style>
</head>
<body>
  <h1>حواله الکترونیکی بار</h1>
  <div class="subtitle">سامانه مدیریت پایانه بار اشتهارد</div>
  <hr class="thick" />
  <table>
    ${section('اطلاعات بار')}
    ${row('شماره حواله', w.waybillNumber)}
    ${row('کد مرجع', cargo.referenceCode)}
    ${row('نوع بار', cargo.cargoType)}
    ${row('وزن', `${cargo.weight} ${cargo.unit}`)}
    ${row('مبدأ', `${cargo.originProvince} - ${cargo.originCity}`)}
    ${row('مقصد', `${cargo.destProvince} - ${cargo.destCity}`)}
    ${cargo.fare ? row('کرایه (ریال)', cargo.fare.toLocaleString('fa-IR')) : ''}

    ${section('اطلاعات راننده')}
    ${row('نام راننده', driver.user.name)}
    ${row('موبایل راننده', driver.user.phone)}
    ${vehicle ? row('پلاک خودرو', vehicle.plate) : ''}
    ${vehicle ? row('نوع خودرو', vehicle.vehicleType) : ''}

    ${cargo.freight ? section('باربری') + row('نام', cargo.freight.user.name) + row('موبایل', cargo.freight.user.phone) : ''}
    ${cargo.producer ? section('تولیدکننده / فرستنده') + row('نام', cargo.producer.user.name) + row('موبایل', cargo.producer.user.phone) : ''}

    ${section('تاریخ‌ها')}
    ${row('تاریخ صدور', toJalaliDateTime(w.issuedAt) ?? '-')}
    ${row('تاریخ نوبت بارگیری', toJalaliDateTime(w.appointment.appointmentDate) ?? '-')}
  </table>
  <div class="footer">سامانه پایانه بار اشتهارد — حواله شماره ${w.waybillNumber}</div>

  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=700,height=900');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
