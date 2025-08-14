import mongoose from 'mongoose';

const emailSchema = new mongoose.Schema(
  {
    // Link to users
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Message
    from: { type: String, required: true },
    to: { type: String, required: true },
    subject: { type: String, default: '' },
    body: { type: String, required: true },

    // Status per user
    folderByUser: {
      type: Map,
      of: { type: String, enum: ['inbox', 'sent', 'trash', 'spam'], default: 'inbox' }
    },

    isRead: { type: Boolean, default: false },

    // Spam metadata
    spamLabel: { type: String, enum: ['spam', 'ham', 'suspicious'], default: 'ham' },
    spamScore: { type: Number, default: 0 },

    // Soft-delete
    deletedForEveryone: { type: Boolean, default: false },
    deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

export const Email = mongoose.model('Email', emailSchema);
