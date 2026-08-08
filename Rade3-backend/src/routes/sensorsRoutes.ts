import { Router } from 'express';
import { listSensors, createSensorHandler, updateSensorHandler, deleteSensorHandler } from '../controllers/sensorsController';
import { requireAuth, requireRole, canAccessSite, requireApiKeyOrAuth } from '../middleware/auth';

const router = Router({ mergeParams: true }); // mergeParams so req.params.siteId from the parent /:siteId/sensors mount is accessible here

router.get('/', requireApiKeyOrAuth, canAccessSite, listSensors);
router.post('/', requireAuth, canAccessSite, requireRole('admin'), createSensorHandler);
router.patch('/:sensorId', requireAuth, canAccessSite, requireRole('admin'), updateSensorHandler);
router.delete('/:sensorId', requireAuth, canAccessSite, requireRole('admin'), deleteSensorHandler);

export default router;
