import { User } from '../models/User.js';
import { Email } from '../models/Email.js';
import { checkSpam } from '../utils/spamClassifier.js';
import { io } from '../server.js'; // ✅ Add this

// Helper function for email validation
const validateEmailRequest = (req) => {
  if (!req.body?.to || !req.body?.body) {
    throw new Error('Recipient and body are required');
  }
};

// Helper for spam classification
const classifyEmail = async (body) => {
  try {
    const result = await checkSpam(body);
    return {
      label: ['spam', 'ham', 'suspicious'].includes(result.label) ? result.label : 'ham',
      score: result.score ?? 1
    };
  } catch (err) {
    console.warn('Spam classification failed, defaulting to ham:', err);
    return { label: 'ham', score: 1 };
  }
};

export const sendEmail = async (req, res) => {
  try {
    const { id: senderId, email: senderEmail } = req.user;
    const { to, subject, body } = req.body;

    const recipient = await User.findOne({ email: to });
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const email = new Email({
      senderId,
      recipientId: recipient._id,
      from: senderEmail,
      to,
      subject: subject || '(No subject)',
      body,
      folderByUser: {
        [senderId.toString()]: 'sent',
        [recipient._id.toString()]: 'inbox'
      }
    });

    await email.save();

    // ✅ Notify recipient in real-time
    io.to(recipient._id.toString()).emit('new_email', email);

    return res.status(201).json({
      success: true,
      data: email
    });

  } catch (error) {
    console.error('Send email error:', error);
    return res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message 
    });
  }
};

export const getInbox = async (req, res) => {
  try {
    const emails = await Email.find({
      recipientId: req.user.id,
      [`folderByUser.${req.user.id}`]: 'inbox',
      deletedForEveryone: { $ne: true }
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: emails.length, emails });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch inbox' });
  }
};

export const getSent = async (req, res) => {
  try {
    const emails = await Email.find({
      senderId: req.user.id,
      [`folderByUser.${req.user.id}`]: 'sent',
      deletedForEveryone: { $ne: true }
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: emails.length, emails });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch sent emails' });
  }
};

export const getTrash = async (req, res) => {
  try {
    const emails = await Email.find({
      [`folderByUser.${req.user.id}`]: 'trash'
    });
    res.json({ success: true, emails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to get trash emails' });
  }
};

export const moveToTrash = async (req, res) => {
  try {
    const userId = req.user.id.toString();
    const email = await Email.findById(req.params.id);

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const recipientId = email.recipientId.toString();
    if (recipientId !== userId) {
      return res.status(403).json({ error: 'Only the recipient can move this email to trash' });
    }

    const currentFolder = email.folderByUser?.get?.(userId) || 'inbox';
    const allowedFromFolders = ['inbox', 'spam'];
    if (!allowedFromFolders.includes(currentFolder)) {
      return res.status(403).json({ error: `Cannot move from ${currentFolder} to trash` });
    }

    email.folderByUser.set(userId, 'trash');
    await email.save();

    // ✅ Notify this user
    io.to(userId).emit('email_moved_to_trash', { emailId: email._id });

    return res.json({ success: true, message: 'Moved to trash', previousFolder: currentFolder });
  } catch (err) {
    console.error('Move to trash failed:', err);
    return res.status(500).json({ error: 'Server error during move operation' });
  }
};

export const markRead = async (req, res) => {
  try {
    const email = await Email.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!email) {
      return res.status(404).json({ success: false, error: 'Email not found' });
    }

    // ✅ Notify this user
    io.to(req.user.id.toString()).emit('email_marked_read', { emailId: email._id });

    res.json({ success: true, email });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to mark as read' });
  }
};

export const deleteEmail = async (req, res) => {
  try {
    const email = await Email.findById(req.params.id);
    if (!email) {
      return res.status(404).json({ success: false, error: 'Email not found' });
    }

    const userId = req.user.id.toString();
    const senderId = email.senderId.toString();
    const recipientId = email.recipientId.toString();

    if (![senderId, recipientId].includes(userId)) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const currentFolder = email.folderByUser?.get?.(userId);
    const allowedFolders = userId === senderId ? ['sent'] : ['inbox', 'trash'];

    if (!allowedFolders.includes(currentFolder)) {
      return res.status(403).json({
        success: false,
        error: `You can only delete from ${allowedFolders.join(', ')}`,
      });
    }

    email.folderByUser.delete(userId);
    if (!email.deletedBy.includes(userId)) {
      email.deletedBy.push(userId);
    }

    const senderDeleted = email.deletedBy.includes(senderId);
    const recipientDeleted = email.deletedBy.includes(recipientId);

    if (senderDeleted && recipientDeleted) {
      await email.deleteOne();
      // ✅ Permanent delete event
      io.to(userId).emit('email_deleted', { emailId: req.params.id, permanent: true });
      return res.json({ success: true, message: 'Email permanently deleted for both users' });
    }

    await email.save();

    // ✅ Soft delete event
    io.to(userId).emit('email_deleted', { emailId: req.params.id, permanent: false });

    return res.json({ success: true, message: 'Email deleted from your account' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to delete email' });
  }
};
