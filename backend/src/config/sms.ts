import { env } from './env';

export async function sendOtp(phone: string, code: string): Promise<boolean> {
  if (env.KAVENEGAR_API_KEY && env.KAVENEGAR_API_KEY !== 'your_kavenegar_api_key') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const KavenegarAPI = require('kavenegar');
      const client = KavenegarAPI.KavenegarFactory({ apikey: env.KAVENEGAR_API_KEY });
      return new Promise((resolve) => {
        client.VerifyLookup(
          { receptor: phone, token: code, template: 'verify' },
          (_res: unknown, status: number) => resolve(status === 200)
        );
      });
    } catch {
      console.log(`[OTP] Kavenegar error — Phone: ${phone}, Code: ${code}`);
      return true;
    }
  }

  // No real API key — log OTP (visible via docker logs)
  console.log(`[OTP] Phone: ${phone}, Code: ${code}`);
  return true;
}

export async function sendSms(phone: string, message: string): Promise<boolean> {
  if (env.KAVENEGAR_API_KEY && env.KAVENEGAR_API_KEY !== 'your_kavenegar_api_key') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const KavenegarAPI = require('kavenegar');
      const client = KavenegarAPI.KavenegarFactory({ apikey: env.KAVENEGAR_API_KEY });
      return new Promise((resolve) => {
        client.Send(
          { receptor: phone, message },
          (_res: unknown, status: number) => resolve(status === 200)
        );
      });
    } catch {
      console.log(`[SMS] Kavenegar error — Phone: ${phone}, Message: ${message}`);
      return true;
    }
  }

  console.log(`[SMS] Phone: ${phone}, Message: ${message}`);
  return true;
}
