import { Router } from 'express';
import { getAllUsers, createUserHandler } from '../controllers/usersController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, getAllUsers);
router.post('/', requireAuth, requireRole('admin'), createUserHandler);

export default router;
