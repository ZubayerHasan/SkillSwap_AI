const walletService = require("../services/wallet.service");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const TransactionLedger = require("../models/TransactionLedger.model");
const User = require("../models/User.model");
const { stringify } = require("csv-stringify/sync");

// GET /api/wallet/me
const getWallet = asyncHandler(async (req, res) => {
  const summary = await walletService.getWalletSummary(req.user._id);
  res.status(200).json(new ApiResponse(200, summary, "Wallet summary fetched"));
});

// GET /api/wallet/transactions
const getTransactions = asyncHandler(async (req, res) => {
  const { cursor, limit } = req.query;
  const data = await walletService.getPaginatedTransactions(req.user._id, cursor, parseInt(limit) || 20);
  res.status(200).json(new ApiResponse(200, data, "Transactions fetched"));
});

// GET /api/wallet/transactions/export (CSV)
const exportTransactions = asyncHandler(async (req, res) => {
  const transactions = await TransactionLedger.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .populate("counterpartyId", "name email");

  const rows = transactions.map((t) => ({
    Date: t.createdAt.toISOString(),
    Type: t.type,
    Amount: t.amount,
    Counterparty: t.counterpartyId?.name || "—",
    Note: t.note,
  }));

  const csv = stringify(rows, { header: true });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=skillswap-transactions.csv");
  res.status(200).send(csv);
});

// POST /api/wallet/send — gift credits to another user
const sendCredits = asyncHandler(async (req, res) => {
  const { recipientId, amount, message } = req.body;
  if (!recipientId) throw new ApiError(400, "recipientId is required");
  if (!amount || isNaN(Number(amount))) throw new ApiError(400, "Valid amount is required");

  const result = await walletService.sendCredits(
    req.user._id,
    recipientId,
    Number(amount),
    message?.trim() || ""
  );
  res.status(200).json(new ApiResponse(200, result, "Credits sent successfully"));
});

// GET /api/wallet/users/search?q= — search users to send credits to
const searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return res.status(200).json(new ApiResponse(200, { users: [] }, "Users fetched"));
  }
  const users = await User.find({
    _id: { $ne: req.user._id },
    $or: [
      { name: { $regex: q.trim(), $options: "i" } },
      { email: { $regex: q.trim(), $options: "i" } },
    ],
  })
    .select("name email avatar university")
    .limit(8);
  res.status(200).json(new ApiResponse(200, { users }, "Users fetched"));
});

module.exports = { getWallet, getTransactions, exportTransactions, sendCredits, searchUsers };
