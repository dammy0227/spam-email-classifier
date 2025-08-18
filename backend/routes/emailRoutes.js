import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  sendEmail,
  getInbox,
  getSpam,
  getSent,
  getTrash,
  moveToTrash,
  markAsSpam,
  markAsNotSpam,
  markRead,
  deleteEmail
} from '../controllers/emailController.js';

const router = Router();

// Email operations
router.post('/send', requireAuth, sendEmail);
router.get('/inbox', requireAuth, getInbox);
router.get('/spam', requireAuth, getSpam);
router.get('/sent', requireAuth, getSent);
router.get('/trash', requireAuth, getTrash);

// Email management
router.patch('/:id/trash', requireAuth, moveToTrash);
router.patch('/:id/spam', requireAuth, markAsSpam);
router.patch('/:id/not-spam', requireAuth, markAsNotSpam);
router.patch('/:id/read', requireAuth, markRead);
router.delete('/:id', requireAuth, deleteEmail);

export default router;