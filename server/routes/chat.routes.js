const express = require("express");
const router = express.Router();
const {
  getMyConversations,
  startConversation,
  getMessages,
  createMessage,
  readConversation,
} = require("../controllers/chat.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.use(authenticate);
router.get("/conversations", getMyConversations);
router.post("/conversations", startConversation);
router.get("/conversations/:conversationId/messages", getMessages);
router.post("/conversations/:conversationId/messages", createMessage);
router.put("/conversations/:conversationId/read", readConversation);

module.exports = router;