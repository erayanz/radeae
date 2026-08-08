import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me';

export interface AuthPayload {
  userId: string;
  username: string;
  role: 'operator' | 'admin';
  siteIds: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export const signToken = (payload: AuthPayload): string =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });

// siteIds defaults to [] for tokens issued before site-scoping existed, so a
// pre-existing session doesn't crash on req.user.siteIds.includes(...).
const verifyToken = (token: string): AuthPayload => {
  const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
  return { ...decoded, siteIds: decoded.siteIds ?? [] };
};

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ success: false, message: 'مطلوب تسجيل الدخول' });
    return;
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ success: false, message: 'جلسة غير صالحة أو منتهية' });
  }
};

export const requireRole = (role: 'operator' | 'admin') =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (req.user?.role !== role && req.user?.role !== 'admin') {
      res.status(403).json({ success: false, message: 'صلاحيات غير كافية' });
      return;
    }
    next();
  };

export const canAccessSite = (req: Request, res: Response, next: NextFunction): void => {
  const siteId = req.params.siteId;
  const user = req.user;
  if (!user) {
    // Reached here with no req.user means requireApiKeyOrAuth's API-key branch
    // already authenticated this request (requireAuth always sets req.user on
    // success or returns 401 before next(), so this branch is unreachable on
    // requireAuth-gated routes).
    next();
    return;
  }
  const isGlobalAdmin = user.role === 'admin' && user.siteIds.length === 0;
  if (isGlobalAdmin || user.siteIds.includes(siteId)) {
    next();
    return;
  }
  res.status(403).json({ success: false, message: 'لا تملك صلاحية الوصول لهذا الموقع' });
};

export const requireAuthSSE = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  const headerToken = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  const queryToken = typeof req.query.token === 'string' ? req.query.token : undefined;
  const token = headerToken || queryToken;

  if (!token) {
    res.status(401).json({ success: false, message: 'مطلوب تسجيل الدخول' });
    return;
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ success: false, message: 'جلسة غير صالحة أو منتهية' });
  }
};

export const requireApiKeyOrAuth = (req: Request, res: Response, next: NextFunction): void => {
  const key = req.headers['x-api-key'];
  const expected = process.env.SENSOR_API_KEY;
  if (expected && key === expected) {
    next();
    return;
  }
  requireAuth(req, res, next);
};

export const requireApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const key = req.headers['x-api-key'];
  const expected = process.env.SENSOR_API_KEY;

  if (!expected) {
    res.status(500).json({ success: false, message: 'SENSOR_API_KEY غير مُعرّف على الخادم' });
    return;
  }
  if (key !== expected) {
    res.status(401).json({ success: false, message: 'مفتاح API غير صالح' });
    return;
  }
  next();
};
