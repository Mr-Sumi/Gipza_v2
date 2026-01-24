const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      maxLength: 200
    },
    message: {
      type: String,
      required: true,
      maxLength: 1000
    },
    type: {
      type: String,
      enum: [
        "order_created",
        "multi_vendor_order_created",
        "order_status_update", 
        "payment_confirmation",
        "multi_vendor_payment_confirmation",
        "order_cancelled",
        "order_delivered",
        "refund_processed",
        "login_alert",
        "general",
        "promotion",
        "system"
      ],
      required: true,
      index: true
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium"
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date,
      default: null
    },
    relatedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null
    },
    relatedTicket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket", 
      default: null
    },
    actionUrl: {
      type: String,
      default: null
    },
    actionText: {
      type: String,
      default: null
    },
    metadata: {
      type: Map,
      of: String,
      default: new Map()
    },
    expiresAt: {
      type: Date,
      default: null
    },
    channels: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: false },
      whatsapp: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: false }
    },
    deliveryStatus: {
      inApp: { type: String, enum: ["pending", "delivered", "failed"], default: "delivered" },
      email: { type: String, enum: ["pending", "delivered", "failed", "not_sent"], default: "not_sent" },
      whatsapp: { type: String, enum: ["pending", "delivered", "failed", "not_sent"], default: "not_sent" },
      sms: { type: String, enum: ["pending", "delivered", "failed", "not_sent"], default: "not_sent" },
      push: { type: String, enum: ["pending", "delivered", "failed", "not_sent"], default: "not_sent" }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // Auto-delete after 90 days

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return this.createdAt.toLocaleDateString();
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(notificationData) {
  try {
    const notification = new this(notificationData);
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Static method to mark multiple notifications as read
notificationSchema.statics.markMultipleAsRead = async function(userId, notificationIds) {
  try {
    const result = await this.updateMany(
      { 
        user: userId, 
        _id: { $in: notificationIds },
        isRead: false 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );
    return result;
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    throw error;
  }
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  try {
    const count = await this.countDocuments({ 
      user: userId, 
      isRead: false 
    });
    return count;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

module.exports = mongoose.model("Notification", notificationSchema); 