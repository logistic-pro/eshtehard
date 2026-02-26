import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  console.error('[Error]', err.message, err.stack);
  res.status(500).json({ message: 'خطای سرور. لطفاً دوباره تلاش کنید.' });
}
