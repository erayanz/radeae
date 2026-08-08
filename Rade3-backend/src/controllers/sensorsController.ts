import { Request, Response } from 'express';
import { getSensorsBySite, createSensor, updateSensor, deleteSensor } from '../data/sensorsRepository';

export const listSensors = (req: Request, res: Response): void => {
  try {
    res.status(200).json({ success: true, data: getSensorsBySite(req.params.siteId), timestamp: new Date().toISOString() });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, message: 'خطأ في جلب المجسات', error: err.message, timestamp: new Date().toISOString() });
  }
};

export const createSensorHandler = (req: Request, res: Response): void => {
  try {
    const { sensorLabel, name, latitude, longitude, status } = req.body;
    if (!sensorLabel || !name || latitude == null || longitude == null) {
      res.status(400).json({ success: false, message: 'بيانات المجس غير مكتملة', timestamp: new Date().toISOString() });
      return;
    }
    const sensor = createSensor(req.params.siteId, { sensorLabel, name, latitude, longitude, status: status === 'inactive' ? 'inactive' : 'active' });
    if (!sensor) {
      res.status(404).json({ success: false, message: 'الموقع غير موجود', timestamp: new Date().toISOString() });
      return;
    }
    res.status(201).json({ success: true, message: 'تم إنشاء المجس بنجاح', data: sensor, timestamp: new Date().toISOString() });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, message: 'خطأ في إنشاء المجس', error: err.message, timestamp: new Date().toISOString() });
  }
};

export const updateSensorHandler = (req: Request, res: Response): void => {
  try {
    const updated = updateSensor(req.params.siteId, req.params.sensorId, req.body);
    if (!updated) {
      res.status(404).json({ success: false, message: 'المجس غير موجود', timestamp: new Date().toISOString() });
      return;
    }
    res.status(200).json({ success: true, message: 'تم تحديث المجس بنجاح', data: updated, timestamp: new Date().toISOString() });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, message: 'خطأ في تحديث المجس', error: err.message, timestamp: new Date().toISOString() });
  }
};

export const deleteSensorHandler = (req: Request, res: Response): void => {
  try {
    deleteSensor(req.params.siteId, req.params.sensorId);
    res.status(200).json({ success: true, message: 'تم حذف المجس بنجاح', timestamp: new Date().toISOString() });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, message: 'خطأ في حذف المجس', error: err.message, timestamp: new Date().toISOString() });
  }
};
