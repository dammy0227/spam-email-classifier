import { User } from '../models/User.js';
import { Email } from '../models/Email.js';
import spamDetector from '../utils/spamClassifier.js';

// Helper function for email validation
const validateEmailRequest = (req) => {
  if (!req.body?.to || !req.body?.body) {
    throw new Error('Recipient and body are required');
  }
};

// Enhanced spam classification
const classifyEmail = async (body) => {
  try {
    const result = await spamDetector.detectSpam(body);
    return {
      isSpam: result.label === 'spam',
      confidence: result.confidence,
      details: result.details
    };
  } catch (err) {
    console.warn('Spam classification failed, defaulting to ham:', err);
    return { 
      isSpam: false, 
      confidence: 0,
      details: { error: err.message }
    };
  }
};

export const sendEmail = async (req, res) => {
  try {
    validateEmailRequest(req);
    const { id: senderId, email: senderEmail } = req.user;
    const { to, subject, body } = req.body;

    const recipient = await User.findOne({ email: to });
    if (!recipient) {
      return res.status(404).json({ error: "Recipient not found" });
    }

    // Classify email
    const { isSpam, confidence, details } = await classifyEmail(body);
    const recipientFolder = isSpam ? "spam" : "inbox";

    const email = new Email({
      senderId,
      recipientId: recipient._id,
      from: senderEmail,
      to,
      subject: subject || "(No subject)",
      body,
      spamData: {
        isSpam,
        confidence,
        detectionDetails: details
      },
      folderByUser: {
        [senderId.toString()]: "sent",
        [recipient._id.toString()]: recipientFolder,
      },
    });

    await email.save();

    return res.status(201).json({ 
      success: true, 
      data: {
        ...email.toObject(),
        spamStatus: isSpam ? 'spam' : 'ham'
      }
    });
  } catch (error) {
    console.error("Send email error:", error);
    return res.status(500).json({
      error: "Failed to send email",
      details: error.message,
    });
  }
};

export const getInbox = async (req, res) => {
  try {
    const emails = await Email.find({ to: req.user.email, folder: "inbox" }).sort({ createdAt: -1 });

    // Run spam detection on each email body
    const processedEmails = await Promise.all(
      emails.map(async (email) => {
        const detection = await spamDetector.detectSpam(email.body);

        return {
          ...email._doc,
          spamLabel: detection.label,        // "spam" or "ham"
          spamConfidence: detection.confidence, 
          spamSource: detection.source,      // Regex/HF hybrid
        };
      })
    );

    res.json({ emails: processedEmails });
  } catch (error) {
    console.error("❌ Error fetching inbox:", error);
    res.status(500).json({ error: "Failed to fetch inbox emails" });
  }
};

export const getSpam = async (req, res) => {
  try {
    const emails = await Email.find({
      recipientId: req.user.id,
      [`folderByUser.${req.user.id}`]: 'spam',
      deletedForEveryone: { $ne: true }
    })
    .sort({ createdAt: -1 })
    .lean();

    res.json({ success: true, count: emails.length, emails });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch spam folder' });
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
      $or: [
        { senderId: req.user.id },
        { recipientId: req.user.id }
      ],
      [`folderByUser.${req.user.id}`]: 'trash'
    })
    .sort({ createdAt: -1 })
    .lean();

    res.json({ success: true, count: emails.length, emails });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch trash' });
  }
};

export const moveToTrash = async (req, res) => {
  try {
    const userId = req.user.id.toString();
    const email = await Email.findById(req.params.id);

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const currentFolder = email.folderByUser.get(userId) || 'inbox';
    const allowedFromFolders = ['inbox', 'spam', 'sent'];

    if (!allowedFromFolders.includes(currentFolder)) {
      return res.status(400).json({
        error: `Cannot move from ${currentFolder} to trash`,
        details: { allowedFrom: allowedFromFolders }
      });
    }

    email.folderByUser.set(userId, 'trash');
    await email.save();

    return res.json({
      success: true,
      message: 'Moved to trash',
      previousFolder: currentFolder
    });
  } catch (error) {
    console.error('Move to trash failed:', error);
    return res.status(500).json({
      error: 'Server error during move operation'
    });
  }
};

export const markAsSpam = async (req, res) => {
  try {
    const userId = req.user.id.toString();
    const email = await Email.findById(req.params.id);

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Only recipient can mark as spam
    if (email.recipientId.toString() !== userId) {
      return res.status(403).json({ error: 'Only recipient can mark as spam' });
    }

    const currentFolder = email.folderByUser.get(userId);
    if (currentFolder !== 'inbox') {
      return res.status(400).json({ 
        error: 'Can only mark inbox messages as spam' 
      });
    }

    email.folderByUser.set(userId, 'spam');
    email.spamData = {
      isSpam: true,
      confidence: 1,
      userReported: true,
      detectionDetails: {
        ...email.spamData?.detectionDetails,
        userOverride: true
      }
    };

    await email.save();
    return res.json({ success: true, email });
  } catch (error) {
    console.error('Mark as spam failed:', error);
    return res.status(500).json({ error: 'Failed to mark as spam' });
  }
};

export const markAsNotSpam = async (req, res) => {
  try {
    const userId = req.user.id.toString();
    const email = await Email.findById(req.params.id);

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Only recipient can mark as not spam
    if (email.recipientId.toString() !== userId) {
      return res.status(403).json({ error: 'Only recipient can mark as not spam' });
    }

    const currentFolder = email.folderByUser.get(userId);
    if (currentFolder !== 'spam') {
      return res.status(400).json({ 
        error: 'Can only mark spam messages as not spam' 
      });
    }

    email.folderByUser.set(userId, 'inbox');
    email.spamData = {
      isSpam: false,
      confidence: 0,
      userReported: true,
      detectionDetails: {
        ...email.spamData?.detectionDetails,
        userOverride: true
      }
    };

    await email.save();
    return res.json({ success: true, email });
  } catch (error) {
    console.error('Mark as not spam failed:', error);
    return res.status(500).json({ error: 'Failed to mark as not spam' });
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
      return res.status(404).json({ error: 'Email not found' });
    }

    res.json({ success: true, email });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};

export const deleteEmail = async (req, res) => {
  try {
    const userId = req.user.id.toString();
    const email = await Email.findById(req.params.id);

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const currentFolder = email.folderByUser.get(userId);
    if (!currentFolder) {
      return res.status(400).json({ error: 'Email not in your folders' });
    }

    // Remove folder mapping
    email.folderByUser.delete(userId);
    
    // Track deletion
    if (!email.deletedBy.includes(userId)) {
      email.deletedBy.push(userId);
    }

    // Check if both parties deleted
    const senderDeleted = email.deletedBy.includes(email.senderId);
    const recipientDeleted = email.deletedBy.includes(email.recipientId);

    if (senderDeleted && recipientDeleted) {
      await email.deleteOne();
      return res.json({ 
        success: true,
        message: 'Permanently deleted for all users'
      });
    }

    await email.save();
    return res.json({ 
      success: true,
      message: 'Removed from your view'
    });
  } catch (error) {
    console.error('Delete email failed:', error);
    return res.status(500).json({ error: 'Failed to delete email' });
  }
};