import moment from 'moment-jalaali';

export function toJalali(date: Date | string): string {
  return moment(date).format('jYYYY/jMM/jDD');
}

export function toJalaliDateTime(date: Date | string): string {
  return moment(date).format('jYYYY/jMM/jDD HH:mm');
}

export function fromJalali(jDate: string): Date {
  return moment(jDate, 'jYYYY/jMM/jDD').toDate();
}

export function generateOtpCode(): string {
  return '123456';
}
