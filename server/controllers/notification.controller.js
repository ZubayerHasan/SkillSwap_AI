const Notification = require("../models/Notification.model");
const notificationService = require("../services/notification.service");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// GET /api/notifications?limit=20&cursor=
const getNotifications = asyncHandler(async (req, res) => {
  const { cursor, limit = 20 } = req.query;
  const pageSize = Math.min(parseInt(limit), 50);
  const query = { userId: req.user._id };
  if (cursor) query.createdAt = { $lt: new Date(cursor) };

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(pageSize + 1);

  const hasMore = notifications.length > pageSize;
  const items = hasMore ? notifications.slice(0, pageSize) : notifications;
  const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

  const unreadCount = await notificationService.getUnreadCount(req.user._id);

  res.status(200).json(new ApiResponse(200, { notifications: items, nextCursor, unreadCount }, "Notifications fetched"));
});

// PUT /api/notifications/read-all
const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user._id);
  res.status(200).json(new ApiResponse(200, {}, "All notifications marked as read"));
});

// PUT /api/notifications/:id/read
const markOneRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markRead(req.params.id, req.user._id);
  if (!notification) throw new ApiError(404, "Notification not found");
  res.status(200).json(new ApiResponse(200, { notification }, "Notification marked as read"));
});

module.exports = { getNotifications, markAllRead, markOneRead };
