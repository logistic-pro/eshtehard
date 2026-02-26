// Jalali (Shamsi) date formatting using Intl API with Persian calendar
// All dates in the app must use these functions

const TEHRAN_TZ = 'Asia/Tehran';

export function toJalaliDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleDateString('fa-IR', {
      calendar: 'persian',
      timeZone: TEHRAN_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return '-';
  }
}

export function toJalaliDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleString('fa-IR', {
      calendar: 'persian',
      timeZone: TEHRAN_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

export function toJalaliTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleTimeString('fa-IR', {
      calendar: 'persian',
      timeZone: TEHRAN_TZ,
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}
