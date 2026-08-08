import { Request, Response } from 'express';
import { listUsers, createUser, findByUsername } from '../data/usersRepository';

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
      data: { id: user.id, username: user.username, role: user.role },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, message: 'خطأ في إنشاء المستخدم', error: err.message, timestamp: new Date().toISOString() });
  }
};
