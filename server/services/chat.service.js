const mongoose = require("mongoose");
const ChatConversation = require("../models/ChatConversation.model");
const ChatMessage = require("../models/ChatMessage.model");
const ApiError = require("../utils/ApiError");

let io = null;

const setIo = (socketIo) => {
  io = socketIo;
};

const buildParticipantKey = (userA, userB) => [String(userA), String(userB)].sort().join(":");

const populateConversation = async (conversation) => conversation.populate([
  { path: "participantIds", select: "name email avatar university trustScore profileCompleteness" },
  { path: "lastMessageId", select: "body senderId createdAt messageType attachments" },
]);

const getOrCreateConversation = async ({ userId, participantId }) => {
  if (String(userId) === String(participantId)) {
    throw new ApiError(400, "You cannot start a chat with yourself");
  }

  const participantKey = buildParticipantKey(userId, participantId);
  let conversation = await ChatConversation.findOne({ participantKey });

  if (!conversation) {
    conversation = await ChatConversation.create({
      participantIds: [userId, participantId],
      participantKey,
      createdBy: userId,
    });
  }

  return populateConversation(conversation);
};

const listConversations = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const conversations = await ChatConversation.find({ participantIds: userObjectId })
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .populate([
      { path: "participantIds", select: "name email avatar university trustScore profileCompleteness" },
      { path: "lastMessageId", select: "body senderId createdAt messageType attachments" },
    ]);

  const unreadCounts = await ChatMessage.aggregate([
    {
      $match: {
        conversationId: { $in: conversations.map((conversation) => conversation._id) },
        senderId: { $ne: userObjectId },
        readBy: { $nin: [userObjectId] },
      },
    },
    { $group: { _id: "$conversationId", count: { $sum: 1 } } },
  ]);

  const unreadMap = new Map(unreadCounts.map((item) => [String(item._id), item.count]));

  return conversations.map((conversation) => {
    const item = conversation.toObject();
    item.unreadCount = unreadMap.get(String(item._id)) || 0;
    return item;
  });
};

const getConversationMessages = async ({ userId, conversationId }) => {
  const conversation = await ChatConversation.findOne({ _id: conversationId, participantIds: userId }).populate([
    { path: "participantIds", select: "name email avatar university trustScore profileCompleteness" },
    { path: "lastMessageId", select: "body senderId createdAt messageType attachments" },
  ]);

  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  const messages = await ChatMessage.find({ conversationId })
    .sort({ createdAt: 1 })
    .populate({ path: "senderId", select: "name avatar university trustScore" });

  return { conversation: conversation.toObject(), messages };
};

const emitConversationUpdate = (conversation, message) => {
  if (!io) return;

  const participantIds = (conversation.participantIds || []).map((participant) => participant?._id || participant).filter(Boolean);
  const payload = {
    conversationId: String(conversation._id),
    conversation: conversation.toObject ? conversation.toObject() : conversation,
    message: message.toObject ? message.toObject() : message,
  };

  io.to(`conversation:${conversation._id}`).emit("chat:message", payload);

  participantIds.forEach((participantId) => {
    io.to(`user:${participantId}`).emit("chat:conversation:update", payload.conversation);
  });
};

const sendMessage = async ({ userId, conversationId, body }) => {
  const trimmedBody = String(body || "").trim();
  if (!trimmedBody) throw new ApiError(400, "Message body is required");

  const conversation = await ChatConversation.findOne({ _id: conversationId, participantIds: userId });
  if (!conversation) throw new ApiError(404, "Conversation not found");

  const message = await ChatMessage.create({
    conversationId: conversation._id,
    senderId: userId,
    body: trimmedBody,
    readBy: [userId],
  });

  conversation.lastMessageId = message._id;
  conversation.lastMessageAt = message.createdAt;
  await conversation.save();

  await conversation.populate([
    { path: "participantIds", select: "name email avatar university trustScore profileCompleteness" },
    { path: "lastMessageId", select: "body senderId createdAt messageType attachments" },
  ]);

  const populatedMessage = await message.populate({ path: "senderId", select: "name avatar university trustScore" });
  const conversationObject = conversation.toObject();
  const messageObject = populatedMessage.toObject();

  emitConversationUpdate(conversationObject, messageObject);

  return { conversation: conversationObject, message: messageObject };
};

const buildMediaAttachmentFromFile = (file) => {
  if (!file) return null;

  // `multer-storage-cloudinary` sets `path` to the URL and `filename` to the Cloudinary public_id.
  // Local disk storage sets `path` to a filesystem path.
  const url = file.path ? String(file.path) : null;
  if (!url) return null;

  return {
    url,
    publicId: file.filename || null,
    resourceType: file.resource_type || null,
    mimeType: file.mimetype || null,
    originalName: file.originalname || null,
    bytes: typeof file.size === "number" ? file.size : null,
    width: typeof file.width === "number" ? file.width : null,
    height: typeof file.height === "number" ? file.height : null,
    duration: typeof file.duration === "number" ? file.duration : null,
    format: file.format || null,
  };
};

const inferMediaMessageType = (file) => {
  const mime = String(file?.mimetype || "");
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("image/")) return "image";
  return null;
};

const sendMediaMessage = async ({ userId, conversationId, file, body }) => {
  if (!file) throw new ApiError(400, "Media file is required");

  const conversation = await ChatConversation.findOne({ _id: conversationId, participantIds: userId });
  if (!conversation) throw new ApiError(404, "Conversation not found");

  const messageType = inferMediaMessageType(file);
  if (!messageType) throw new ApiError(400, "Unsupported media type");

  const attachment = buildMediaAttachmentFromFile(file);
  if (!attachment) throw new ApiError(500, "Failed to process uploaded media");

  const trimmedBody = String(body || "").trim();
  const previewBody = trimmedBody || (messageType === "image" ? "[Image]" : "[Video]");

  const message = await ChatMessage.create({
    conversationId: conversation._id,
    senderId: userId,
    messageType,
    body: previewBody,
    attachments: [attachment],
    readBy: [userId],
  });

  conversation.lastMessageId = message._id;
  conversation.lastMessageAt = message.createdAt;
  await conversation.save();

  await conversation.populate([
    { path: "participantIds", select: "name email avatar university trustScore profileCompleteness" },
    { path: "lastMessageId", select: "body senderId createdAt messageType attachments" },
  ]);

  const populatedMessage = await message.populate({ path: "senderId", select: "name avatar university trustScore" });
  const conversationObject = conversation.toObject();
  const messageObject = populatedMessage.toObject();

  emitConversationUpdate(conversationObject, messageObject);

  return { conversation: conversationObject, message: messageObject };
};

const markConversationRead = async ({ userId, conversationId }) => {
  const conversation = await ChatConversation.findOne({ _id: conversationId, participantIds: userId });
  if (!conversation) throw new ApiError(404, "Conversation not found");

  await ChatMessage.updateMany(
    { conversationId, senderId: { $ne: userId }, readBy: { $nin: [userId] } },
    { $addToSet: { readBy: userId } }
  );

  if (io) {
    io.to(`user:${userId}`).emit("chat:conversation:read", { conversationId: String(conversationId) });
  }

  return true;
};

module.exports = {
  setIo,
  getOrCreateConversation,
  listConversations,
  getConversationMessages,
  sendMessage,
  sendMediaMessage,
  markConversationRead,
};