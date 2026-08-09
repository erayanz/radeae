import { Request, Response } from 'express';
import { listUsers, createUser, findByUsername, setUserActive } from '../data/usersRepository';

export const getAllUsers = (req: Request, res: Response): void => {
  try {
    const users = listUsers();
    res.status(200).json({
      success: true,
      message: 'تم جلب المستخدمين بنجاح',
      data: users,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المستخدمين',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
};

export const createUserHandler = (req: Request, res: Response): void => {
  try {
    const { username, password, role, siteIds } = req.body as { username?: string; password?: string; role?: 'operator' | 'admin'; siteIds?: string[] };
    if (!username || !password) {
      res.status(400).json({ success: false, message: 'اسم المستخدم وكلمة المرور مطلوبان' });
      return;
    }
    if (findByUsername(username)) {
      res.status(409).json({ success: false, message: 'اسم المستخدم مستخدم بالفعل' });
      return;
    }
    const user = createUser(username, password, role === 'admin' ? 'admin' : 'operator', siteIds);
    res.status(201).json({
      success: true,
      message: 'تم إنشاء المستخدم بنجاح',
      data: { id: user.id, username: user.username, role: user.role, active: user.active },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, message: 'خطأ في إنشاء المستخدم', error: err.message, timestamp: new Date().toISOString() });
  }
};

export const setUserActiveHandler = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { active } = req.body as { active?: boolean };

    if (typeof active !== 'boolean') {
      res.status(400).json({ success: false, message: 'قيمة active مطلوبة (true/false)' });
      return;
    }

    // Guard against an admin locking themselves out -- deactivating your
    // own account would leave you unable to log back in and reverse it
    // (deactivation blocks future logins; an existing token still works
    // until it expires, but that's a thin, confusing safety net to rely on).
    if (req.user?.userId === id && !active) {
      res.status(400).json({ success: false, message: 'لا يمكنك تعطيل حسابك الخاص' });
      return;
    }

    const user = setUserActive(id, active);
    if (!user) {
      res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
      return;
    }

    res.status(200).json({
      success: true,
      message: active ? 'تم تفعيل المستخدم' : 'تم تعطيل المستخدم',
      data: { id: user.id, username: user.username, role: user.role, active: user.active },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, message: 'خطأ في تحديث حالة المستخدم', error: err.message, timestamp: new Date().toISOString() });
  }
};
