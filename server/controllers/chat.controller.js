const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const {
  getOrCreateConversation,
  listConversations,
  getConversationMessages,
  sendMessage,
  markConversationRead,
} = require("../services/chat.service");

const getMyConversations = asyncHandler(async (req, res) => {
  const conversations = await listConversations(req.user._id);
  res.status(200).json(new ApiResponse(200, { conversations }, "Conversations fetched successfully"));
});

const startConversation = asyncHandler(async (req, res) => {
  const { participantId, initialMessage } = req.body;
  if (!participantId) throw new ApiError(400, "participantId is required");

  const conversation = await getOrCreateConversation({ userId: req.user._id, participantId });

  let latestConversation = conversation;
  let latestMessage = null;

  if (initialMessage && String(initialMessage).trim()) {
    const result = await sendMessage({
      userId: req.user._id,
      conversationId: conversation._id,
      body: initialMessage,
    });
    latestConversation = result.conversation;
    latestMessage = result.message;
  }

  res.status(201).json(new ApiResponse(201, { conversation: latestConversation, message: latestMessage }, "Conversation ready"));
});

const getMessages = asyncHandler(async (req, res) => {
  const data = await getConversationMessages({ userId: req.user._id, conversationId: req.params.conversationId });
  res.status(200).json(new ApiResponse(200, data, "Messages fetched successfully"));
});

const createMessage = asyncHandler(async (req, res) => {
  const { body } = req.body;
  const result = await sendMessage({ userId: req.user._id, conversationId: req.params.conversationId, body });
  res.status(201).json(new ApiResponse(201, result, "Message sent successfully"));
});

const readConversation = asyncHandler(async (req, res) => {
  await markConversationRead({ userId: req.user._id, conversationId: req.params.conversationId });
  res.status(200).json(new ApiResponse(200, {}, "Conversation marked as read"));
});

module.exports = { getMyConversations, startConversation, getMessages, createMessage, readConversation };