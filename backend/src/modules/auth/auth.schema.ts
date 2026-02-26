import { z } from 'zod';

export const sendOtpSchema = z.object({
  phone: z
    .string()
    .regex(/^09[0-9]{9}$/, 'شماره موبایل نامعتبر است'),
});

export const verifyOtpSchema = z.object({
  phone: z
    .string()
    .regex(/^09[0-9]{9}$/, 'شماره موبایل نامعتبر است'),
  code: z.string().length(6, 'کد تأیید باید ۶ رقم باشد'),
});

export const refreshTokenSchema = z.object({
  // refreshToken comes from httpOnly cookie, not body
});

export type SendOtpDto = z.infer<typeof sendOtpSchema>;
export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;
