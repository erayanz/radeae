import { Router } from 'express';
import {
  getAllEvents,
  getEventById,
  createEvent,
  getStatistics,
  clearAllEvents,
  streamEvents,
  updateEventStatusHandler
} from '../controllers/eventsController';
import { requireAuth, requireApiKey, requireRole, requireAuthSSE, canAccessSite } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.get('/', requireAuth, canAccessSite, getAllEvents);
router.get('/stats', requireAuth, canAccessSite, getStatistics);
router.get('/stream', requireAuthSSE, canAccessSite, streamEvents);
router.get('/:id', requireAuth, canAccessSite, getEventById);
router.patch('/:id/status', requireAuth, canAccessSite, updateEventStatusHandler);
router.post('/', requireApiKey, createEvent);
router.delete('/clear', requireAuth, canAccessSite, requireRole('admin'), clearAllEvents);

export default router;
