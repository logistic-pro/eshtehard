import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

const authService = new AuthService();
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export async function sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.sendOtp(req.body.phone);
    if (result.registered) {
      res.status(202).json({ registered: true, message: 'ثبت‌نام شما انجام شد. پس از تأیید مدیر پایانه می‌توانید وارد شوید' });
    } else {
      res.json({ message: 'کد تأیید ارسال شد' });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'خطا';
    res.status(403).json({ message });
  }
}

export async function verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { accessToken, user } = await authService.verifyOtp(req.body.phone, req.body.code);
    const { _refreshToken, ...userWithoutToken } = user as Record<string, unknown>;

    res.cookie('refreshToken', _refreshToken as string, COOKIE_OPTIONS);
    res.json({ accessToken, user: userWithoutToken });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'خطای احراز هویت';
    res.status(401).json({ message });
  }
}

export async function refreshTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ message: 'توکن تجدید یافت نشد' });
      return;
    }
    const { accessToken, refreshToken: newRefreshToken } =
      await authService.refreshTokens(refreshToken);
    res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);
    res.json({ accessToken });
  } catch (err: unknown) {
    res.clearCookie('refreshToken');
    const message = err instanceof Error ? err.message : 'خطا';
    res.status(401).json({ message });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    await authService.logout(refreshToken).catch(() => null);
  }
  res.clearCookie('refreshToken');
  res.json({ message: 'با موفقیت خارج شدید' });
}
