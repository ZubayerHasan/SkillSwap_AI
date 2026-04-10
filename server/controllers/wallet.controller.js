const walletService = require("../services/wallet.service");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const TransactionLedger = require("../models/TransactionLedger.model");
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

module.exports = { getWallet, getTransactions, exportTransactions };
