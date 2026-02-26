import { prisma } from '../../config/database';
import { sendOtp as sendOtpSms } from '../../config/sms';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { generateOtpCode } from '../../utils/farsiDate';
import { env } from '../../config/env';

export class AuthService {
  async sendOtp(phone: string): Promise<{ registered?: boolean }> {
    let user = await prisma.user.findUnique({ where: { phone } });

    // New user → auto-register as PENDING, needs admin approval before login
    if (!user) {
      await prisma.user.create({
        data: { phone, name: phone, role: 'DRIVER', status: 'PENDING' },
      });
      return { registered: true };
    }

    if (user.status === 'SUSPENDED') {
      throw new Error('حساب کاربری شما مسدود شده است. با مدیر پایانه تماس بگیرید');
    }
    if (user.status === 'PENDING') {
      throw new Error('حساب شما در انتظار تأیید مدیر پایانه است');
    }

    // Approved user → send OTP
    await prisma.otpCode.updateMany({
      where: { phone, used: false },
      data: { used: true },
    });

    const code = generateOtpCode();
    const expiresAt = new Date(
      Date.now() + parseInt(env.OTP_EXPIRY_MINUTES) * 60 * 1000
    );

    await prisma.otpCode.create({
      data: { phone, code, expiresAt },
    });

    await sendOtpSms(phone, code);
    return {};
  }

  async verifyOtp(
    phone: string,
    code: string
  ): Promise<{ accessToken: string; user: Record<string, unknown> }> {
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        phone,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new Error('کد تأیید نامعتبر یا منقضی شده است');
    }

    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      throw new Error('کاربر یافت نشد');
    }
    if (user.status === 'PENDING') {
      throw new Error('حساب شما در انتظار تأیید مدیر پایانه است');
    }
    if (user.status === 'SUSPENDED') {
      throw new Error('حساب کاربری شما مسدود شده است. با مدیر پایانه تماس بگیرید');
    }
    if (!user.isActive) {
      throw new Error('حساب کاربری شما غیرفعال است');
    }

    const payload = { userId: user.id, role: user.role, phone: user.phone };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt },
    });

    return {
      accessToken,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        status: user.status,
        isActive: user.isActive,
        _refreshToken: refreshToken,
      },
    };
  }

  async refreshTokens(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new Error('توکن نامعتبر یا منقضی شده است');
    }

    verifyRefreshToken(refreshToken); // throws if invalid

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });

    const payload = {
      userId: tokenRecord.user.id,
      role: tokenRecord.user.role,
      phone: tokenRecord.user.phone,
    };

    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: { token: newRefreshToken, userId: tokenRecord.user.id, expiresAt },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }
}
