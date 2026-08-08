import { Router } from 'express';
import { listSites, getSite, createSiteHandler, updateSiteHandler, deleteSiteHandler } from '../controllers/sitesController';
import { requireAuth, requireRole, canAccessSite } from '../middleware/auth';
import sensorsRoutes from './sensorsRoutes';
import zonesRoutes from './zonesRoutes';
import eventsRoutes from './eventsRoutes';

const router = Router();

router.get('/', requireAuth, listSites);
router.post('/', requireAuth, requireRole('admin'), createSiteHandler);
router.get('/:siteId', requireAuth, canAccessSite, getSite);
router.patch('/:siteId', requireAuth, canAccessSite, requireRole('admin'), updateSiteHandler);
router.delete('/:siteId', requireAuth, canAccessSite, requireRole('admin'), deleteSiteHandler);
router.use('/:siteId/sensors', sensorsRoutes);
router.use('/:siteId/zones', zonesRoutes);
router.use('/:siteId/events', eventsRoutes);

export default router;
