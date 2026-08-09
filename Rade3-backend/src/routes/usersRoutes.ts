import { Router } from 'express';
import { getAllUsers, createUserHandler, setUserActiveHandler } from '../controllers/usersController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, getAllUsers);
router.post('/', requireAuth, requireRole('admin'), createUserHandler);
router.patch('/:id/active', requireAuth, requireRole('admin'), setUserActiveHandler);

export default router;
