import { Router } from 'express';
import { getAllUsers, createUserHandler, setUserActiveHandler, getUserSitesHandler, setUserSitesHandler } from '../controllers/usersController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, getAllUsers);
router.post('/', requireAuth, requireRole('admin'), createUserHandler);
router.patch('/:id/active', requireAuth, requireRole('admin'), setUserActiveHandler);
router.get('/:id/sites', requireAuth, requireRole('admin'), getUserSitesHandler);
router.patch('/:id/sites', requireAuth, requireRole('admin'), setUserSitesHandler);

export default router;
