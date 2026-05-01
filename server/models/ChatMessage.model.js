const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: null },
    resourceType: { type: String, enum: ["image", "video", "raw"], default: null },
    mimeType: { type: String, default: null },
    originalName: { type: String, default: null },
    bytes: { type: Number, default: null },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    duration: { type: Number, default: null },
    format: { type: String, default: null },
  },
  { _id: false }
);

const chatMessageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "ChatConversation", required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    messageType: { type: String, enum: ["text", "image", "video"], default: "text" },
    body: {
      type: String,
      trim: true,
      maxlength: 2000,
      required: function requiredBody() {
        return this.messageType === "text";
      },
      default: "",
    },
    attachments: { type: [attachmentSchema], default: [] },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

chatMessageSchema.index({ conversationId: 1, createdAt: 1 });

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

module.exports = ChatMessage;