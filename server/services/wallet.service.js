const TransactionLedger = require("../models/TransactionLedger.model");
const User = require("../models/User.model");
const ApiError = require("../utils/ApiError");
const mongoose = require("mongoose");

const creditStarterBonus = async (userId, session) => {
  const amount = 5;
  await TransactionLedger.create(
    [{ userId, type: "starter_bonus", amount, note: "Welcome bonus — 5 starter credits" }],
    { session }
  );
  await User.findByIdAndUpdate(userId, { $inc: { currentBalance: amount } }, { session });
};

const getWalletSummary = async (userId) => {
  const user = await User.findById(userId).select("currentBalance");
  if (!user) throw new ApiError(404, "User not found");

  const recentTransactions = await TransactionLedger.find({ userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("counterpartyId", "name avatar");

  // Monthly stats for last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyStats = await TransactionLedger.aggregate([
    { $match: { userId: userId, createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        earned: {
          $sum: {
            $cond: [{ $in: ["$type", ["exchange_credit", "gift_received", "starter_bonus"]] }, "$amount", 0],
          },
        },
        spent: {
          $sum: {
            $cond: [{ $in: ["$type", ["exchange_debit", "gift_sent"]] }, "$amount", 0],
          },
        },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  return {
    currentBalance: user.currentBalance,
    recentTransactions,
    monthlyStats,
  };
};

const getPaginatedTransactions = async (userId, cursor, limit = 20) => {
  const query = { userId };
  if (cursor) {
    query.createdAt = { $lt: new Date(cursor) };
  }
  const transactions = await TransactionLedger.find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .populate("counterpartyId", "name avatar");

  const hasMore = transactions.length > limit;
  const results = hasMore ? transactions.slice(0, limit) : transactions;
  const nextCursor = hasMore ? results[results.length - 1].createdAt.toISOString() : null;

  return { transactions: results, nextCursor };
};

// Atomic credit gift: debit sender, credit recipient, two ledger entries
const sendCredits = async (senderId, recipientId, amount, message) => {
  if (amount < 1 || amount > 10) throw new ApiError(400, "Amount must be between 1 and 10 credits");
  if (senderId.toString() === recipientId.toString()) throw new ApiError(400, "Cannot send credits to yourself");

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const sender = await User.findById(senderId).session(session);
    if (!sender) throw new ApiError(404, "Sender not found");
    if (sender.currentBalance < amount) throw new ApiError(400, "Insufficient credits");

    const recipient = await User.findById(recipientId).session(session);
    if (!recipient) throw new ApiError(404, "Recipient not found");

    const noteForSender = message
      ? `Gift to ${recipient.name}: "${message}"`
      : `Gift to ${recipient.name}`;
    const noteForRecipient = message
      ? `Gift from ${sender.name}: "${message}"`
      : `Gift from ${sender.name}`;

    await TransactionLedger.create(
      [{ userId: senderId, type: "gift_sent", amount: -amount, counterpartyId: recipientId, note: noteForSender }],
      { session }
    );
    await TransactionLedger.create(
      [{ userId: recipientId, type: "gift_received", amount, counterpartyId: senderId, note: noteForRecipient }],
      { session }
    );

    await User.findByIdAndUpdate(senderId, { $inc: { currentBalance: -amount } }, { session });
    await User.findByIdAndUpdate(recipientId, { $inc: { currentBalance: amount } }, { session });

    await session.commitTransaction();
    return { senderBalance: sender.currentBalance - amount };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

module.exports = { creditStarterBonus, getWalletSummary, getPaginatedTransactions, sendCredits };
