const ExchangeRequest = require("../models/ExchangeRequest.model");
const Exchange = require("../models/Exchange.model");
const SkillOffer = require("../models/SkillOffer.model");
const User = require("../models/User.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const notificationService = require("../services/notification.service");

const MAX_PENDING_OUTGOING = 5;

// POST /api/exchanges/request
const createRequest = asyncHandler(async (req, res) => {
  const { receiverId, offeredSkillId, requestedSkillId, proposedTime, message } = req.body;

  // Cannot request yourself
  if (receiverId === req.user._id.toString()) throw new ApiError(400, "Cannot request an exchange with yourself");

  // Check max pending outgoing
  const pendingCount = await ExchangeRequest.countDocuments({ requesterId: req.user._id, status: "pending" });
  if (pendingCount >= MAX_PENDING_OUTGOING) throw new ApiError(429, `Maximum ${MAX_PENDING_OUTGOING} pending outgoing requests allowed`);

  // Check no duplicate pending between same pair
  const duplicate = await ExchangeRequest.findOne({
    $or: [
      { requesterId: req.user._id, receiverId, status: "pending" },
      { requesterId: receiverId, receiverId: req.user._id, status: "pending" },
    ],
  });
  if (duplicate) throw new ApiError(409, "A pending exchange request already exists between you and this user");

  // Validate skills
  const offeredSkill = await SkillOffer.findOne({ _id: offeredSkillId, userId: req.user._id, isActive: true });
  if (!offeredSkill) throw new ApiError(404, "Your offered skill not found");

  const requestedSkill = await SkillOffer.findOne({ _id: requestedSkillId, userId: receiverId, isActive: true });
  if (!requestedSkill) throw new ApiError(404, "Requested skill not found");

  const exchangeRequest = await ExchangeRequest.create({
    requesterId: req.user._id,
    receiverId,
    offeredSkillId,
    requestedSkillId,
    proposedTime: new Date(proposedTime),
    message,
  });

  // Notify receiver
  await notificationService.send(receiverId, "exchange_request", {
    message: `${req.user.name} wants to exchange skills with you`,
    requestId: exchangeRequest._id,
    requesterName: req.user.name,
    offeredSkill: offeredSkill.displayName,
    requestedSkill: requestedSkill.displayName,
  });

  res.status(201).json(new ApiResponse(201, { exchangeRequest }, "Exchange request sent"));
});

// GET /api/exchanges/requests/incoming
const getIncomingRequests = asyncHandler(async (req, res) => {
  const requests = await ExchangeRequest.find({ receiverId: req.user._id, status: "pending" })
    .populate("requesterId", "name avatar university")
    .populate("offeredSkillId", "displayName category proficiencyLevel")
    .populate("requestedSkillId", "displayName category proficiencyLevel")
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, { requests }, "Incoming requests fetched"));
});

// GET /api/exchanges/requests/outgoing
const getOutgoingRequests = asyncHandler(async (req, res) => {
  const requests = await ExchangeRequest.find({ requesterId: req.user._id })
    .populate("receiverId", "name avatar university")
    .populate("offeredSkillId", "displayName category proficiencyLevel")
    .populate("requestedSkillId", "displayName category proficiencyLevel")
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, { requests }, "Outgoing requests fetched"));
});

// PUT /api/exchanges/requests/:id/accept
const acceptRequest = asyncHandler(async (req, res) => {
  const request = await ExchangeRequest.findOne({ _id: req.params.id, receiverId: req.user._id, status: "pending" });
  if (!request) throw new ApiError(404, "Request not found or already actioned");

  request.status = "accepted";
  await request.save();

  // Create Exchange document
  const exchange = await Exchange.create({
    requesterId: request.requesterId,
    receiverId: request.receiverId,
    offeredSkillId: request.offeredSkillId,
    requestedSkillId: request.requestedSkillId,
    exchangeRequestId: request._id,
    scheduledTime: request.proposedTime,
  });

  // Notify requester
  await notificationService.send(request.requesterId, "exchange_request", {
    message: `${req.user.name} accepted your exchange request!`,
    exchangeId: exchange._id,
    status: "accepted",
  });

  res.status(200).json(new ApiResponse(200, { exchange }, "Exchange request accepted"));
});

// PUT /api/exchanges/requests/:id/decline
const declineRequest = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const request = await ExchangeRequest.findOne({ _id: req.params.id, receiverId: req.user._id, status: "pending" });
  if (!request) throw new ApiError(404, "Request not found or already actioned");

  request.status = "declined";
  request.declineReason = reason || "";
  await request.save();

  await notificationService.send(request.requesterId, "exchange_request", {
    message: `${req.user.name} declined your exchange request`,
    requestId: request._id,
    status: "declined",
    reason,
  });

  res.status(200).json(new ApiResponse(200, {}, "Exchange request declined"));
});

// PUT /api/exchanges/requests/:id/counter
const counterRequest = asyncHandler(async (req, res) => {
  const { proposedTime, message } = req.body;
  const originalRequest = await ExchangeRequest.findOne({ _id: req.params.id, receiverId: req.user._id, status: "pending" });
  if (!originalRequest) throw new ApiError(404, "Request not found");
  if (originalRequest.negotiationRound >= 3) throw new ApiError(400, "Maximum negotiation rounds reached (3)");

  originalRequest.status = "counter";
  await originalRequest.save();

  const counterRequest = await ExchangeRequest.create({
    requesterId: req.user._id,
    receiverId: originalRequest.requesterId,
    offeredSkillId: originalRequest.requestedSkillId,
    requestedSkillId: originalRequest.offeredSkillId,
    proposedTime: new Date(proposedTime),
    message,
    parentRequestId: originalRequest._id,
    negotiationRound: originalRequest.negotiationRound + 1,
  });

  await notificationService.send(originalRequest.requesterId, "exchange_request", {
    message: `${req.user.name} sent a counter-proposal for your exchange request`,
    requestId: counterRequest._id,
    status: "counter",
  });

  res.status(201).json(new ApiResponse(201, { counterRequest }, "Counter proposal sent"));
});

// GET /api/exchanges (My exchanges)
const getMyExchanges = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = {
    $or: [{ requesterId: req.user._id }, { receiverId: req.user._id }],
    ...(status && { status }),
  };

  const exchanges = await Exchange.find(query)
    .populate("requesterId", "name avatar")
    .populate("receiverId", "name avatar")
    .populate("offeredSkillId", "displayName category")
    .populate("requestedSkillId", "displayName category")
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, { exchanges }, "Exchanges fetched"));
});

module.exports = { createRequest, getIncomingRequests, getOutgoingRequests, acceptRequest, declineRequest, counterRequest, getMyExchanges };
