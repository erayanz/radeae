import { Request, Response } from 'express';
import axios from 'axios';

// Proxies to the separate Rade3-sensor-simulator service. Routed through
// this backend (rather than the frontend calling it directly on its own
// port) specifically so the existing requireAuth + requireRole('admin')
// middleware can gate simulator control — the simulator service itself has
// no concept of dashboard users/roles, so enforcing "admin only" has to
// happen here, not there.
const SIMULATOR_API_URL = process.env.SIMULATOR_API_URL || 'http://localhost:5001';

const client = axios.create({ baseURL: SIMULATOR_API_URL, timeout: 10000 });

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
      message: 'تعذر الاتصال بخدمة المحاكاة',
      error: error.message,
      timestamp: new Date().toISOString()
    });
    return;
  }
  const err = error as Error;
  res.status(500).json({ success: false, message, error: err.message, timestamp: new Date().toISOString() });
};

export const getSimulatorState = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data } = await client.get('/api/simulator/state');
    res.status(200).json(data);
  } catch (error) {
    forwardError(res, error, 'فشل جلب حالة المحاكاة');
  }
};

export const startSimulator = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data } = await client.post('/api/simulator/start');
    res.status(200).json(data);
  } catch (error) {
    forwardError(res, error, 'فشل بدء المحاكاة');
  }
};

export const stopSimulator = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data } = await client.post('/api/simulator/stop');
    res.status(200).json(data);
  } catch (error) {
    forwardError(res, error, 'فشل إيقاف المحاكاة');
  }
};

export const triggerSimulatorEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data } = await client.post('/api/simulator/trigger-event', req.body);
    res.status(200).json(data);
  } catch (error) {
    forwardError(res, error, 'فشل إرسال الحدث');
  }
};
