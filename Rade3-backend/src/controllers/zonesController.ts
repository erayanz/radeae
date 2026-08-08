import { Request, Response } from 'express';
import { getZonesBySite, createZone, updateZone, deleteZone } from '../data/zonesRepository';

export const listZones = (req: Request, res: Response): void => {
  try {
    res.status(200).json({ success: true, data: getZonesBySite(req.params.siteId), timestamp: new Date().toISOString() });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, message: 'خطأ في جلب المناطق', error: err.message, timestamp: new Date().toISOString() });
  }
};

export const createZoneHandler = (req: Request, res: Response): void => {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: 'اسم المنطقة مطلوب', timestamp: new Date().toISOString() });
      return;
    }
    const zone = createZone(req.params.siteId, { name });
    if (!zone) {
      res.status(404).json({ success: false, message: 'الموقع غير موجود', timestamp: new Date().toISOString() });
      return;
    }
    res.status(201).json({ success: true, message: 'تم إنشاء المنطقة بنجاح', data: zone, timestamp: new Date().toISOString() });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, message: 'خطأ في إنشاء المنطقة', error: err.message, timestamp: new Date().toISOString() });
  }
};

export const updateZoneHandler = (req: Request, res: Response): void => {
  try {
    const updated = updateZone(req.params.siteId, req.params.zoneId, req.body);
    if (!updated) {
      res.status(404).json({ success: false, message: 'المنطقة غير موجودة', timestamp: new Date().toISOString() });
      return;
    }
    res.status(200).json({ success: true, message: 'تم تحديث المنطقة بنجاح', data: updated, timestamp: new Date().toISOString() });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, message: 'خطأ في تحديث المنطقة', error: err.message, timestamp: new Date().toISOString() });
  }
};

export const deleteZoneHandler = (req: Request, res: Response): void => {
  try {
    deleteZone(req.params.siteId, req.params.zoneId);
    res.status(200).json({ success: true, message: 'تم حذف المنطقة بنجاح', timestamp: new Date().toISOString() });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, message: 'خطأ في حذف المنطقة', error: err.message, timestamp: new Date().toISOString() });
  }
};
