// src/routes/emailRoutes.js
import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  sendEmail,
  getInbox,
  getSent,
  getTrash,
  moveToTrash,
  markRead,
  deleteEmail
} from '../controllers/emailController.js';

const router = Router();

router.post('/send', requireAuth, sendEmail);
router.get('/inbox', requireAuth, getInbox);
router.get('/sent', requireAuth, getSent);
router.get('/trash', requireAuth, getTrash);

router.patch('/:id/trash', requireAuth, moveToTrash);
router.patch('/:id/read', requireAuth, markRead);
router.delete('/:id', requireAuth, deleteEmail);


export default router;
