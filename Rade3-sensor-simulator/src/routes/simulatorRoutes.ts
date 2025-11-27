import { Router, Request, Response } from 'express';
import { SimulationService } from '../services/simulationService';

const router = Router();
const simulator = new SimulationService();

router.post('/start', (_req: Request, res: Response) => {
  simulator.start();
  res.json({
    success: true,
    message: 'تم بدء المحاكاة',
    state: simulator.getState()
  });
});

router.post('/stop', (_req: Request, res: Response) => {
  simulator.stop();
  res.json({
    success: true,
    message: 'تم إيقاف المحاكاة',
    state: simulator.getState()
  });
});

router.get('/state', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: simulator.getState()
  });
});

router.post('/trigger-event', async (req: Request, res: Response) => {
  try {
    const { eventType, riskLevel, sensorId } = req.body;
    
    if (!eventType || !riskLevel) {
      return res.status(400).json({
        success: false,
        message: 'eventType و riskLevel مطلوبان'
      });
    }
    
    const event = await simulator.sendSpecificEvent(eventType, riskLevel, sensorId);
    
    res.json({
      success: true,
      message: 'تم إرسال الحدث',
      data: event
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      message: 'خطأ في إرسال الحدث',
      error: err.message
    });
  }
});

export default router;
export { simulator };
