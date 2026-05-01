const chatService = require("../../services/chat.service");

const setupChatHandler = (io) => {
  io.on("connection", (socket) => {
    const userId = socket.handshake.auth?.userId;
    if (!userId) {
      socket.disconnect();
      return;
    }

    socket.on("chat:join", (conversationId) => {
      if (conversationId) {
        socket.join(`conversation:${conversationId}`);
      }
    });

    socket.on("chat:leave", (conversationId) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    socket.on("chat:read", async ({ conversationId }) => {
      if (!conversationId) return;
      await chatService.markConversationRead({ userId, conversationId });
    });

    socket.on("disconnect", () => {
      console.log(`💬 Chat socket disconnected: user ${userId} (${socket.id})`);
    });
  });
};

module.exports = { setupChatHandler };