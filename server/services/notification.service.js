const Notification = require("../models/Notification.model");
const User = require("../models/User.model");

// This will be set by socket setup
let io = null;

const setIo = (socketIo) => {
  io = socketIo;
};

const send = async (userId, type, payload) => {
  try {
    const notification = await Notification.create({ userId, type, payload });

    // Emit via Socket.io if connected
    if (io) {
      io.to(`user:${userId.toString()}`).emit("notification", {
        _id: notification._id,
        type,
        payload,
        read: false,
        createdAt: notification.createdAt,
      });
    }

    return notification;
  } catch (err) {
    console.error("Notification send error:", err.message);
  }
};

const markRead = async (notificationId, userId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { read: true },
    { new: true }
  );
};

const markAllRead = async (userId) => {
  return Notification.updateMany({ userId, read: false }, { read: true });
};

const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ userId, read: false });
};

module.exports = { setIo, send, markRead, markAllRead, getUnreadCount };
