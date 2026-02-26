import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'احراز هویت الزامی است' });
      return;
    }
    if (!roles.includes(req.user.role as Role)) {
      res.status(403).json({ message: 'دسترسی مجاز نیست' });
      return;
    }
    next();
  };
}
