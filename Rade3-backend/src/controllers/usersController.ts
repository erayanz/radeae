import { Request, Response } from 'express';
import { listUsers, createUser, findByUsername, setUserActive, getUserById, getSiteIdsForUser, setSiteIdsForUser } from '../data/usersRepository';
import { getSiteById } from '../data/sitesRepository';

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
    const resolvedRole = role === 'admin' ? 'admin' : 'operator';
    // Empty siteIds means "global access" for admin (see canAccessSite),
    // but means "no access to anything" for operator -- block creating a
    // locked-out operator account by accident.
    if (resolvedRole === 'operator' && (!siteIds || siteIds.length === 0)) {
      res.status(400).json({ success: false, message: 'يجب اختيار موقع واحد على الأقل للمشغّل' });
      return;
    }
    const user = createUser(username, password, resolvedRole, siteIds);
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

export const getUserSitesHandler = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    if (!getUserById(id)) {
      res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
      return;
    }
    res.status(200).json({ success: true, data: { siteIds: getSiteIdsForUser(id) }, timestamp: new Date().toISOString() });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, message: 'خطأ في جلب مواقع المستخدم', error: err.message, timestamp: new Date().toISOString() });
  }
};

export const setUserSitesHandler = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { siteIds } = req.body as { siteIds?: string[] };

    const target = getUserById(id);
    if (!target) {
      res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
      return;
    }
    if (!Array.isArray(siteIds)) {
      res.status(400).json({ success: false, message: 'siteIds يجب أن تكون قائمة' });
      return;
    }

    // An operator with an empty siteIds list has access to nothing (unlike
    // admin, where empty siteIds means "global access" -- see
    // middleware/auth.ts canAccessSite). Block this at the API level so it
    // can't be recreated the same way the Users page's create form allowed
    // it before this fix.
    if (target.role === 'operator' && siteIds.length === 0) {
      res.status(400).json({ success: false, message: 'يجب اختيار موقع واحد على الأقل للمشغّل' });
      return;
    }

    for (const siteId of siteIds) {
      if (!getSiteById(siteId)) {
        res.status(400).json({ success: false, message: `الموقع غير موجود: ${siteId}` });
        return;
      }
    }

    setSiteIdsForUser(id, siteIds);
    res.status(200).json({
      success: true,
      message: 'تم تحديث مواقع المستخدم',
      data: { id, siteIds },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, message: 'خطأ في تحديث مواقع المستخدم', error: err.message, timestamp: new Date().toISOString() });
  }
};
