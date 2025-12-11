import { Router } from 'express';
import {
  getAllEvents,
  getEventById,
  createEvent,
  getStatistics,
  clearAllEvents
} from '../controllers/eventsController';

const router = Router();

router.get('/', getAllEvents);
router.get('/stats', getStatistics);
router.get('/:id', getEventById);
router.post('/', createEvent);
router.delete('/clear', clearAllEvents);

export default router;
