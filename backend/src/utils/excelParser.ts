import * as XLSX from 'xlsx';

export interface CargoExcelRow {
  originProvince: string;
  originCity: string;
  destProvince: string;
  destCity: string;
  cargoType: string;
  weight: number;
  unit?: string;
  description?: string;
}

export function parseCargoExcel(buffer: Buffer): CargoExcelRow[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

  return rows.map((row, index) => {
    const originProvince = String(row['مبدأ استان'] || row['originProvince'] || '').trim();
    const originCity = String(row['مبدأ شهر'] || row['originCity'] || '').trim();
    const destProvince = String(row['مقصد استان'] || row['destProvince'] || '').trim();
    const destCity = String(row['مقصد شهر'] || row['destCity'] || '').trim();
    const cargoType = String(row['نوع بار'] || row['cargoType'] || '').trim();
    const weight = parseFloat(String(row['وزن'] || row['weight'] || '0'));
    const unit = String(row['واحد'] || row['unit'] || 'تن').trim();
    const description = String(row['توضیحات'] || row['description'] || '').trim();

    if (!originProvince || !destProvince || !cargoType || isNaN(weight)) {
      throw new Error(`ردیف ${index + 2}: داده‌های ناقص یا نامعتبر`);
    }

    return { originProvince, originCity, destProvince, destCity, cargoType, weight, unit, description };
  });
}
