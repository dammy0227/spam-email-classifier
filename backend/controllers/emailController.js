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

    validateEmailRequest(req);

    const recipient = await User.findOne({ email: to }).select('_id email');
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const { label, score } = await classifyEmail(body);
    const recipientFolder = label === 'spam' ? 'spam' : 'inbox';

    // Create a SINGLE email document with folder mappings for both users
    const email = await Email.create({
      senderId,
      recipientId: recipient._id,
      from: senderEmail,
      to,
      subject: subject || '(No subject)',
      body,
      folderByUser: new Map([
        [senderId.toString(), 'sent'],
        [recipient._id.toString(), recipientFolder]
      ]),
      spamLabel: label,
      spamScore: score
    });

    res.status(201).json({
      success: true,
      data: { email }
    });
  } catch (error) {
    console.error('Send email error:', error);
    const status = error.message === 'Recipient not found' ? 404 : 400;
    res.status(status).json({
      success: false,
      error: error.message || 'Failed to send email'
    });
  }
};

export const getInbox = async (req, res) => {
  try {
    const emails = await Email.find({
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
    const email = await Email.findById(req.params.id);
    if (!email) return res.status(404).json({ success: false, error: 'Email not found' });

    // Only sender or recipient can move their own email to trash
    if (email.senderId.toString() !== req.user.id && email.recipientId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Update only the current user's folder mapping
    email.folderByUser.set(req.user.id, 'trash');
    await email.save();

    res.json({ success: true, email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to move email to trash' });
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

// Delete only the current user's copy
export const deleteEmail = async (req, res) => {
  try {
    const email = await Email.findById(req.params.id);
    if (!email) {
      return res.status(404).json({ success: false, error: 'Email not found' });
    }

    const userId = req.user.id;

    // Check that current user is sender or recipient
    if (email.senderId.toString() !== userId && email.recipientId.toString() !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Remove current user's folder mapping
    email.folderByUser.delete(userId);

    // Track deleted users for soft-delete
    if (!email.deletedBy.includes(userId)) {
      email.deletedBy.push(userId);
    }

    // If both users have deleted, remove the email entirely
    if (
      email.deletedBy.includes(email.senderId.toString()) &&
      email.deletedBy.includes(email.recipientId.toString())
    ) {
      await email.deleteOne();
      return res.json({ success: true, message: 'Email permanently deleted for both users' });
    }

    await email.save();
    res.json({ success: true, message: 'Email deleted for your account' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to delete email' });
  }
};