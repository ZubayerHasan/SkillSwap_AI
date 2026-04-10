const TransactionLedger = require("../models/TransactionLedger.model");
const User = require("../models/User.model");
const ApiError = require("../utils/ApiError");

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

module.exports = { creditStarterBonus, getWalletSummary, getPaginatedTransactions };
