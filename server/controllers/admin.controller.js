const User = require("../models/User.model");
const Exchange = require("../models/Exchange.model");
const TransactionLedger = require("../models/TransactionLedger.model");
const AdminAuditLog = require("../models/AdminAuditLog.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// Helper: write audit log entry
const audit = async (adminId, action, targetUserId, reason = "", meta = {}) => {
  await AdminAuditLog.create({ adminId, action, targetUserId, reason, meta }).catch(() => {});
};

// GET /api/admin/stats
const getStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [totalUsers, newUsersThisWeek, activeExchanges, creditAgg] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: weekAgo } }),
    Exchange.countDocuments({ status: { $in: ["accepted", "in_progress"] } }).catch(() => 0),
    TransactionLedger.aggregate([
      { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } },
    ]),
  ]);

  const creditCirculation = creditAgg[0]?.total || 0;

  res.status(200).json(new ApiResponse(200, {
    totalUsers,
    newUsersThisWeek,
    activeExchanges,
    creditCirculation,
    disputeRate: 0, // placeholder — add dispute model when available
  }, "Stats fetched"));
});

// GET /api/admin/users?page=&search=&sortBy=
const getUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const search = req.query.search?.trim();
  const sortBy = req.query.sortBy || "createdAt";
  const sortDir = req.query.sortDir === "asc" ? 1 : -1;

  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { university: { $regex: search, $options: "i" } },
    ];
  }

  const validSort = ["createdAt", "name", "email", "trustScore", "currentBalance", "role"];
  const sortField = validSort.includes(sortBy) ? sortBy : "createdAt";

  const [users, total] = await Promise.all([
    User.find(query)
      .select("name email role trustScore currentBalance isSuspended suspensionReason isVerified university createdAt avatar")
      .sort({ [sortField]: sortDir })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(query),
  ]);

  res.status(200).json(new ApiResponse(200, {
    users,
    total,
    page,
    pages: Math.ceil(total / limit),
  }, "Users fetched"));
});

// PATCH /api/admin/users/:id/role
const changeRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!["student", "moderator", "admin"].includes(role)) throw new ApiError(400, "Invalid role");

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  const oldRole = user.role;
  user.role = role;
  await user.save();

  await audit(req.user._id, "role_change", user._id, req.body.reason || "", { from: oldRole, to: role });

  res.status(200).json(new ApiResponse(200, { user: { _id: user._id, name: user.name, role: user.role } }, "Role updated"));
});

// PATCH /api/admin/users/:id/suspend
const toggleSuspend = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  if (user.role === "admin") throw new ApiError(403, "Cannot suspend another admin");

  user.isSuspended = !user.isSuspended;
  user.suspensionReason = user.isSuspended ? (req.body.reason || "Suspended by admin") : "";
  await user.save();

  const action = user.isSuspended ? "suspend" : "unsuspend";
  await audit(req.user._id, action, user._id, user.suspensionReason);

  res.status(200).json(new ApiResponse(200, { isSuspended: user.isSuspended }, `User ${action}ed`));
});

// GET /api/admin/audit?page=
const getAuditLog = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 30;
  const [logs, total] = await Promise.all([
    AdminAuditLog.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("adminId", "name email")
      .populate("targetUserId", "name email"),
    AdminAuditLog.countDocuments(),
  ]);
  res.status(200).json(new ApiResponse(200, { logs, total, page }, "Audit log fetched"));
});

module.exports = { getStats, getUsers, changeRole, toggleSuspend, getAuditLog };
