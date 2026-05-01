const mongoose = require("mongoose");

const chatConversationSchema = new mongoose.Schema(
  {
    participantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    participantKey: { type: String, required: true, unique: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lastMessageId: { type: mongoose.Schema.Types.ObjectId, ref: "ChatMessage", default: null },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

chatConversationSchema.index({ participantIds: 1, lastMessageAt: -1 });

const ChatConversation = mongoose.model("ChatConversation", chatConversationSchema);

module.exports = ChatConversation;