import { Router } from 'express';
import {
  getAllEvents,
  getEventById,
  createEvent,
  getStatistics
} from '../controllers/eventsController';

const router = Router();

router.get('/', getAllEvents);
router.get('/stats', getStatistics);
router.get('/:id', getEventById);
router.post('/', createEvent);

export default router;
