import mongoose from 'mongoose';

const emailSchema = new mongoose.Schema(
  {
    // Link to users
    senderId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    recipientId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },

    // Message
    from: { type: String, required: true },
    to: { type: String, required: true },
    subject: { type: String, default: '' },
    body: { type: String, required: true },

    // Status per user
 folderByUser: {
    type: Map,
    of: String,
    default: function() {
      // Auto-set default folders when creating new email
      const map = new Map();
      if (this.senderId) map.set(this.senderId.toString(), 'sent');
      if (this.recipientId) map.set(this.recipientId.toString(), 'inbox');
      return map;
    }
  },
    isRead: { type: Boolean, default: false },

    // Spam metadata
    spamLabel: { 
      type: String, 
      enum: ['spam', 'ham', 'suspicious'], 
      default: 'ham' 
    },
    spamScore: { type: Number, default: 0 },

    // Soft-delete
    deletedForEveryone: { type: Boolean, default: false },
    deletedBy: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }]
  },
{
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
}
);

// Indexes for better performance
emailSchema.index({ senderId: 1 });
emailSchema.index({ recipientId: 1 });
emailSchema.index({ 'folderByUser.$**': 1 });

export const Email = mongoose.model('Email', emailSchema);