import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { findByUsername, getSiteIdsForUser } from '../data/usersRepository';
import { signToken } from '../middleware/auth';

export const login = (req: Request, res: Response): void => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ success: false, message: 'اسم المستخدم وكلمة المرور مطلوبان' });
    return;
  }

  const user = findByUsername(username);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    res.status(401).json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    return;
  }

  const siteIds = getSiteIdsForUser(user.id);
  const token = signToken({ userId: user.id, username: user.username, role: user.role, siteIds });

  res.json({
    success: true,
    message: 'تم تسجيل الدخول بنجاح',
    data: { token, user: { username: user.username, role: user.role, siteIds } },
    timestamp: new Date().toISOString()
  });
};

export const me = (req: Request, res: Response): void => {
  res.json({ success: true, data: req.user, timestamp: new Date().toISOString() });
};
