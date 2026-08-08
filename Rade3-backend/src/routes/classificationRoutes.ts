import { Router } from 'express';
import { getClassificationHealth, getClassificationManifest, classifyWindow, classifyBatch } from '../controllers/classificationController';
import { requireAuth } from '../middleware/auth';

// Not site-scoped: classification acts on a submitted feature vector, not
// on any site's stored event data, so canAccessSite doesn't apply here.
// Still requires a logged-in session like the rest of the authenticated API.
const router = Router();

router.get('/health', requireAuth, getClassificationHealth);
router.get('/manifest', requireAuth, getClassificationManifest);
router.post('/predict', requireAuth, classifyWindow);
router.post('/predict/batch', requireAuth, classifyBatch);

export default router;
