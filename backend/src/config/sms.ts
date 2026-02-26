import * as KavenegarAPI from 'kavenegar';
import { env } from './env';

let kavenegarClient: ReturnType<typeof KavenegarAPI.KavenegarFactory> | null = null;

export function getSmsClient() {
  if (!kavenegarClient && env.KAVENEGAR_API_KEY) {
    kavenegarClient = KavenegarAPI.KavenegarFactory({ apikey: env.KAVENEGAR_API_KEY });
  }
  return kavenegarClient;
}

export async function sendOtp(phone: string, code: string): Promise<boolean> {
  const client = getSmsClient();
  if (!client) {
    // No valid Kavenegar key — log OTP to console (visible in docker logs)
    console.log(`[OTP] Phone: ${phone}, Code: ${code}`);
    return true;
  }

  return new Promise((resolve) => {
    client.VerifyLookup(
      {
        receptor: phone,
        token: code,
        template: 'verify',
      },
      (res: unknown, status: number) => {
        resolve(status === 200);
      }
    );
  });
}

export async function sendSms(phone: string, message: string): Promise<boolean> {
  const client = getSmsClient();
  if (!client) {
    if (env.NODE_ENV === 'development') {
      console.log(`[SMS DEV] Phone: ${phone}, Message: ${message}`);
      return true;
    }
    return false;
  }

  return new Promise((resolve) => {
    client.Send(
      {
        receptor: phone,
        message,
      },
      (res: unknown, status: number) => {
        resolve(status === 200);
      }
    );
  });
}
