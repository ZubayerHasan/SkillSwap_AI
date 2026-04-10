const mongoose = require("mongoose");

const exchangeRequestSchema = new mongoose.Schema(
  {
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    offeredSkillId: { type: mongoose.Schema.Types.ObjectId, ref: "SkillOffer", required: true },
    requestedSkillId: { type: mongoose.Schema.Types.ObjectId, ref: "SkillOffer", required: true },
    proposedTime: { type: Date, required: true },
    message: { type: String, default: "", maxlength: 300 },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "expired", "counter"],
      default: "pending",
    },
    declineReason: { type: String, default: "" },
    parentRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "ExchangeRequest", default: null },
    negotiationRound: { type: Number, default: 0, max: 3 },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  },
  { timestamps: true }
);

exchangeRequestSchema.index({ requesterId: 1 });
exchangeRequestSchema.index({ receiverId: 1 });
exchangeRequestSchema.index({ status: 1 });
exchangeRequestSchema.index({ createdAt: -1 });
exchangeRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL for auto-expire

const ExchangeRequest = mongoose.model("ExchangeRequest", exchangeRequestSchema);
module.exports = ExchangeRequest;
