import { Router } from 'express';
import { listZones, createZoneHandler, updateZoneHandler, deleteZoneHandler } from '../controllers/zonesController';
import { requireAuth, requireRole, canAccessSite, requireApiKeyOrAuth } from '../middleware/auth';

const router = Router({ mergeParams: true }); // mergeParams so req.params.siteId from the parent /:siteId/zones mount is accessible here

router.get('/', requireApiKeyOrAuth, canAccessSite, listZones);
router.post('/', requireAuth, canAccessSite, requireRole('admin'), createZoneHandler);
router.patch('/:zoneId', requireAuth, canAccessSite, requireRole('admin'), updateZoneHandler);
router.delete('/:zoneId', requireAuth, canAccessSite, requireRole('admin'), deleteZoneHandler);

export default router;
