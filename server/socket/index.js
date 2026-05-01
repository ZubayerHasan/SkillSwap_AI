const { Server } = require("socket.io");
const { setupNotificationHandler } = require("./handlers/notificationHandler");
const { setupChatHandler } = require("./handlers/chatHandler");
const notificationService = require("../services/notification.service");
const chatService = require("../services/chat.service");
const env = require("../config/env");

const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  // Register handlers
  setupNotificationHandler(io);
  setupChatHandler(io);

  // Give notification service access to io
  notificationService.setIo(io);
  chatService.setIo(io);

  console.log("✅ Socket.io initialized");
  return io;
};

module.exports = { initSocket };
