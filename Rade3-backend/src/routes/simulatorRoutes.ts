import { Router } from 'express';
import { getSimulatorState, startSimulator, stopSimulator, triggerSimulatorEvent } from '../controllers/simulatorController';
import { requireAuth, requireRole } from '../middleware/auth';

// Admin-only: simulator control (start/stop/trigger fake events) is a
// privileged action, not something every logged-in operator should be able
// to do. requireRole('admin') rejects non-admins with 403 before the
// request ever reaches the simulator service.
const router = Router();

router.get('/state', requireAuth, requireRole('admin'), getSimulatorState);
router.post('/start', requireAuth, requireRole('admin'), startSimulator);
router.post('/stop', requireAuth, requireRole('admin'), stopSimulator);
router.post('/trigger-event', requireAuth, requireRole('admin'), triggerSimulatorEvent);

export default router;
