const mongoose = require("mongoose");

const exchangeSchema = new mongoose.Schema(
  {
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    offeredSkillId: { type: mongoose.Schema.Types.ObjectId, ref: "SkillOffer", required: true },
    requestedSkillId: { type: mongoose.Schema.Types.ObjectId, ref: "SkillOffer", required: true },
    exchangeRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "ExchangeRequest" },
    scheduledTime: { type: Date, required: true },
    conversationId: { type: mongoose.Schema.Types.ObjectId, default: null },
    status: {
      type: String,
      enum: ["scheduled", "in_progress", "awaiting_completion", "completed", "disputed"],
      default: "scheduled",
    },
    requesterConfirmed: { type: Boolean, default: false },
    receiverConfirmed: { type: Boolean, default: false },
    disputeDeadline: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    creditHours: { type: Number, default: 1 },
  },
  { timestamps: true }
);

exchangeSchema.index({ requesterId: 1 });
exchangeSchema.index({ receiverId: 1 });
exchangeSchema.index({ status: 1 });

const Exchange = mongoose.model("Exchange", exchangeSchema);
module.exports = Exchange;
