import { Request, Response } from 'express';
import axios from 'axios';

// Separate Python microservice (RadeaeAIModel/inference_api) — this backend
// stays Node/TypeScript; classification is proxied over HTTP rather than
// embedding Python in this process. See DASHBOARD_OVERVIEW.md §8 for context.
// 127.0.0.1 (not 'localhost') to avoid an IPv6 (::1) resolution mismatch
// against uvicorn's default IPv4 bind on this Windows dev machine.
const INFERENCE_API_URL = process.env.INFERENCE_API_URL || 'http://127.0.0.1:8000';

const client = axios.create({ baseURL: INFERENCE_API_URL, timeout: 10000 });

// Every response from the inference service already carries its own
// experimental-status disclaimer, model version and per-class precision
// (see RadeaeAIModel/inference_api/schemas.py) — this proxy forwards that
// payload as-is rather than reshaping or stripping it, so it must never be
// wired into anything that presents a prediction as a confirmed fact.
const forwardError = (res: Response, error: unknown, message: string): void => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        message,
        error: error.response.data,
        timestamp: new Date().toISOString()
      });
      return;
    }
    res.status(502).json({
      success: false,
      message: 'تعذر الاتصال بخدمة التصنيف (Python inference API)',
      error: error.message,
      timestamp: new Date().toISOString()
    });
    return;
  }
  const err = error as Error;
  res.status(500).json({ success: false, message, error: err.message, timestamp: new Date().toISOString() });
};

export const getClassificationHealth = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data } = await client.get('/health');
    res.status(200).json({ success: true, message: 'حالة خدمة التصنيف', data, timestamp: new Date().toISOString() });
  } catch (error) {
    forwardError(res, error, 'فشل جلب حالة خدمة التصنيف');
  }
};

export const getClassificationManifest = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data } = await client.get('/manifest');
    res.status(200).json({ success: true, message: 'بيانات النموذج', data, timestamp: new Date().toISOString() });
  } catch (error) {
    forwardError(res, error, 'فشل جلب بيانات النموذج');
  }
};

export const classifyWindow = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data } = await client.post('/predict', req.body);
    res.status(200).json({ success: true, message: 'تصنيف تجريبي — غير معتمد للتنبيه التلقائي', data, timestamp: new Date().toISOString() });
  } catch (error) {
    forwardError(res, error, 'فشل التصنيف');
  }
};

export const classifyBatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data } = await client.post('/predict/batch', req.body);
    res.status(200).json({ success: true, message: 'تصنيف تجريبي دفعي — غير معتمد للتنبيه التلقائي', data, timestamp: new Date().toISOString() });
  } catch (error) {
    forwardError(res, error, 'فشل التصنيف الدفعي');
  }
};
