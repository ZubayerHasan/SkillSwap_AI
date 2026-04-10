const notificationService = require("../../services/notification.service");

const setupNotificationHandler = (io) => {
  io.on("connection", (socket) => {
    const userId = socket.handshake.auth?.userId;
    if (!userId) {
      socket.disconnect();
      return;
    }

    // Join personal room
    socket.join(`user:${userId}`);
    console.log(`🔌 Socket connected: user ${userId} (${socket.id})`);

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: user ${userId} (${socket.id})`);
    });

    // Allow client to mark notification read via socket
    socket.on("notification:read", async (notificationId) => {
      await notificationService.markRead(notificationId, userId);
    });
  });
};

module.exports = { setupNotificationHandler };
