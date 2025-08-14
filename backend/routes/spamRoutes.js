// src/routes/spamRoutes.js
import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { checkSpamController } from '../controllers/spamController.js';

const router = Router();
router.post('/check-spam', requireAuth, checkSpamController);

export default router;
