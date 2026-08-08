import { Request, Response } from 'express';
import { getAllSites, getSiteById, createSite, updateSite, deleteSite } from '../data/sitesRepository';

export const listSites = (req: Request, res: Response): void => {
  try {
    res.status(200).json({ success: true, data: getAllSites(), timestamp: new Date().toISOString() });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, message: 'خطأ في جلب المواقع', error: err.message, timestamp: new Date().toISOString() });
  }
};

export const getSite = (req: Request, res: Response): void => {
  try {
    const site = getSiteById(req.params.siteId);
    if (!site) {
      res.status(404).json({ success: false, message: 'الموقع غير موجود', timestamp: new Date().toISOString() });
      return;
    }
    res.status(200).json({ success: true, data: site, timestamp: new Date().toISOString() });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, message: 'خطأ في جلب الموقع', error: err.message, timestamp: new Date().toISOString() });
  }
};

export const createSiteHandler = (req: Request, res: Response): void => {
  try {
    const { name, nameAr, centerLatitude, centerLongitude, boundaryPolygon, protectionRadiusMeters } = req.body;
    if (!name || !nameAr || centerLatitude == null || centerLongitude == null) {
      res.status(400).json({ success: false, message: 'الاسم والإحداثيات مطلوبة', timestamp: new Date().toISOString() });
      return;
    }
    const site = createSite({ name, nameAr, centerLatitude, centerLongitude, boundaryPolygon: boundaryPolygon ?? null, protectionRadiusMeters: protectionRadiusMeters ?? null });
    res.status(201).json({ success: true, message: 'تم إنشاء الموقع بنجاح', data: site, timestamp: new Date().toISOString() });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, message: 'خطأ في إنشاء الموقع', error: err.message, timestamp: new Date().toISOString() });
  }
};

export const updateSiteHandler = (req: Request, res: Response): void => {
  try {
    const updated = updateSite(req.params.siteId, req.body);
    if (!updated) {
      res.status(404).json({ success: false, message: 'الموقع غير موجود', timestamp: new Date().toISOString() });
      return;
    }
    res.status(200).json({ success: true, message: 'تم تحديث الموقع بنجاح', data: updated, timestamp: new Date().toISOString() });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, message: 'خطأ في تحديث الموقع', error: err.message, timestamp: new Date().toISOString() });
  }
};

export const deleteSiteHandler = (req: Request, res: Response): void => {
  try {
    const result = deleteSite(req.params.siteId);
    if (!result.success) {
      res.status(409).json({ success: false, message: result.reason, timestamp: new Date().toISOString() });
      return;
    }
    res.status(200).json({ success: true, message: 'تم حذف الموقع بنجاح', timestamp: new Date().toISOString() });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, message: 'خطأ في حذف الموقع', error: err.message, timestamp: new Date().toISOString() });
  }
};
