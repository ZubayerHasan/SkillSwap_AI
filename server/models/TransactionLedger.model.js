const mongoose = require("mongoose");

const transactionLedgerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      required: true,
      enum: ["exchange_credit", "exchange_debit", "gift_sent", "gift_received", "starter_bonus"],
    },
    amount: { type: Number, required: true },
    counterpartyId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    exchangeId: { type: mongoose.Schema.Types.ObjectId, ref: "Exchange" },
    note: { type: String, default: "" },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // IMMUTABLE: no updatedAt
    versionKey: false,
  }
);

// No update hooks — immutable records
transactionLedgerSchema.index({ userId: 1, createdAt: -1 });

const TransactionLedger = mongoose.model("TransactionLedger", transactionLedgerSchema);
module.exports = TransactionLedger;
