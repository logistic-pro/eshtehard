import { env } from './env';

export async function sendOtp(phone: string, code: string): Promise<boolean> {
  console.log(`[OTP] Phone: ${phone}, Code: ${code}`);
  return true;
}

export async function sendSms(phone: string, message: string): Promise<boolean> {
  console.log(`[SMS] Phone: ${phone}, Message: ${message}`);
  return true;
}
