const express = require("express");
const router = express.Router();
const {
  getMyConversations,
  startConversation,
  getMessages,
  createMessage,
  createMediaMessage,
  readConversation,
} = require("../controllers/chat.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { uploadChatMedia } = require("../middleware/upload.middleware");

router.use(authenticate);
router.get("/conversations", getMyConversations);
router.post("/conversations", startConversation);
router.get("/conversations/:conversationId/messages", getMessages);
router.post("/conversations/:conversationId/messages", createMessage);
router.post("/conversations/:conversationId/messages/media", uploadChatMedia.single("media"), createMediaMessage);
router.put("/conversations/:conversationId/read", readConversation);

module.exports = router;