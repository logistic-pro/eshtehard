import { Router } from 'express';
import { sendOtp, verifyOtp, refreshTokens, logout } from './auth.controller';
import { validate } from '../../middleware/validate';
import { sendOtpSchema, verifyOtpSchema } from './auth.schema';
import rateLimit from 'express-rate-limit';

const router = Router();

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  skip: (req) => req.body?.phone === '09120644653',
  message: { message: 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً ۵ دقیقه صبر کنید.' },
});

router.post('/send-otp', otpLimiter, validate(sendOtpSchema), sendOtp);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtp);
router.post('/refresh', refreshTokens);
router.post('/logout', logout);

export default router;
