import { User } from '../models/User.js';
import { Email } from '../models/Email.js';
import { checkSpam } from '../utils/spamClassifier.js';

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

    // Create with explicit Map
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
      recipientId: req.user.id, // only emails you received
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
      senderId: req.user.id, // only emails you sent
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




// controllers/emailController.js
export const moveToTrash = async (req, res) => {
  try {
    const userId = req.user.id.toString();
    const email = await Email.findById(req.params.id);

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const senderId = email.senderId.toString();
    const recipientId = email.recipientId.toString();
    const isRecipient = recipientId === userId;

    // Only recipient can move to trash
    if (!isRecipient) {
      return res.status(403).json({
        error: 'Only the recipient can move this email to trash'
      });
    }

    const currentFolder = email.folderByUser?.get?.(userId) || 'inbox';

    // Recipient can only trash from inbox or spam
    const allowedFromFolders = ['inbox', 'spam'];
    if (!allowedFromFolders.includes(currentFolder)) {
      return res.status(403).json({
        error: `Cannot move from ${currentFolder} to trash`,
        details: { allowedFrom: allowedFromFolders }
      });
    }

    // Move to trash
    email.folderByUser.set(userId, 'trash');
    await email.save();

    return res.json({
      success: true,
      message: 'Moved to trash',
      previousFolder: currentFolder
    });
  } catch (err) {
    console.error('Move to trash failed:', err);
    return res.status(500).json({
      error: 'Server error during move operation'
    });
  }
};



export const markRead = async (req, res) => {
  try {
    const email = await Email.findOneAndUpdate(
      {
        _id: req.params.id,
        recipientId: req.user.id
      },
      { isRead: true },
      { new: true }
    );

    if (!email) {
      return res.status(404).json({ success: false, error: 'Email not found' });
    }

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

    const isSender = senderId === userId;
    const isRecipient = recipientId === userId;

    // Check permissions
    if (!isSender && !isRecipient) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Check allowed folder transitions
    const currentFolder = email.folderByUser?.get?.(userId);
    const allowedFolders = isSender ? ['sent'] : ['inbox', 'trash'];

    if (!allowedFolders.includes(currentFolder)) {
      return res.status(403).json({
        success: false,
        error: `You can only delete from ${allowedFolders.join(', ')}`,
      });
    }

    // Remove this user's folder mapping
    email.folderByUser.delete(userId);

    // Track user deletion
    if (!email.deletedBy.includes(userId)) {
      email.deletedBy.push(userId);
    }

    // If both sender & recipient deleted, remove email from DB
    const senderDeleted = email.deletedBy.includes(senderId);
    const recipientDeleted = email.deletedBy.includes(recipientId);

    if (senderDeleted && recipientDeleted) {
      await email.deleteOne();
      return res.json({
        success: true,
        message: 'Email permanently deleted for both users',
      });
    }

    await email.save();
    return res.json({
      success: true,
      message: 'Email deleted from your account',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to delete email' });
  }
};
