const ExchangeRequest = require("../models/ExchangeRequest.model");
const Exchange = require("../models/Exchange.model");
const SkillOffer = require("../models/SkillOffer.model");
const User = require("../models/User.model");
const TransactionLedger = require("../models/TransactionLedger.model");
const mongoose = require("mongoose");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const notificationService = require("../services/notification.service");
const { scheduleReminders } = require("../queues/reminderQueue");

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

  // Schedule session reminders (24h + 1h before)
  try {
    await scheduleReminders(exchange);
  } catch (err) {
    console.error("Failed to schedule reminders:", err.message);
  }

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

  const counterReq = await ExchangeRequest.create({
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
    requestId: counterReq._id,
    status: "counter",
  });

  res.status(201).json(new ApiResponse(201, { counterRequest: counterReq }, "Counter proposal sent"));
});

// GET /api/exchanges — list exchanges for logged-in user
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
    .sort({ scheduledTime: -1 });

  res.status(200).json(new ApiResponse(200, { exchanges }, "Exchanges fetched"));
});

// GET /api/exchanges/:id — single exchange with full populated data
const getExchangeById = asyncHandler(async (req, res) => {
  const exchange = await Exchange.findById(req.params.id)
    .populate("requesterId", "name avatar university")
    .populate("receiverId", "name avatar university")
    .populate("offeredSkillId", "displayName category proficiencyLevel")
    .populate("requestedSkillId", "displayName category proficiencyLevel");

  if (!exchange) throw new ApiError(404, "Exchange not found");

  // Only the two parties can view the exchange
  const userId = req.user._id.toString();
  if (exchange.requesterId._id.toString() !== userId && exchange.receiverId._id.toString() !== userId) {
    throw new ApiError(403, "Not authorized to view this exchange");
  }

  res.status(200).json(new ApiResponse(200, { exchange }, "Exchange fetched"));
});

// PUT /api/exchanges/:id/confirm — confirm completion
const confirmExchange = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();

  const exchange = await Exchange.findById(req.params.id);
  if (!exchange) throw new ApiError(404, "Exchange not found");

  // Must be a party in this exchange
  const isRequester = exchange.requesterId.toString() === userId;
  const isReceiver = exchange.receiverId.toString() === userId;
  if (!isRequester && !isReceiver) throw new ApiError(403, "Not authorized to confirm this exchange");

  // Can only confirm scheduled or awaiting_completion exchanges
  if (!["scheduled", "in_progress", "awaiting_completion"].includes(exchange.status)) {
    throw new ApiError(400, `Cannot confirm an exchange with status '${exchange.status}'`);
  }

  // Idempotency: if already confirmed by this user, return current state
  if ((isRequester && exchange.requesterConfirmed) || (isReceiver && exchange.receiverConfirmed)) {
    return res.status(200).json(new ApiResponse(200, { exchange }, "You have already confirmed this exchange"));
  }

  // Set the appropriate confirmation flag
  if (isRequester) exchange.requesterConfirmed = true;
  if (isReceiver) exchange.receiverConfirmed = true;

  // Check if both parties have now confirmed
  if (exchange.requesterConfirmed && exchange.receiverConfirmed) {
    // === ATOMIC CREDIT TRANSFER via multi-document transaction ===
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // Check requester has sufficient balance
      const requester = await User.findById(exchange.requesterId).session(session);
      if (!requester) throw new ApiError(404, "Requester user not found");
      if (requester.currentBalance < exchange.creditHours) {
        throw new ApiError(400, "Insufficient credits for this exchange");
      }

      // Debit requester
      await User.findByIdAndUpdate(
        exchange.requesterId,
        { $inc: { currentBalance: -exchange.creditHours } },
        { session }
      );

      // Credit receiver
      await User.findByIdAndUpdate(
        exchange.receiverId,
        { $inc: { currentBalance: exchange.creditHours } },
        { session }
      );

      // Write two TransactionLedger records
      await TransactionLedger.create(
        [{
          userId: exchange.requesterId,
          type: "exchange_debit",
          amount: -exchange.creditHours,
          counterpartyId: exchange.receiverId,
          exchangeId: exchange._id,
          note: `Exchange completed — skill swap`,
        }],
        { session }
      );

      await TransactionLedger.create(
        [{
          userId: exchange.receiverId,
          type: "exchange_credit",
          amount: exchange.creditHours,
          counterpartyId: exchange.requesterId,
          exchangeId: exchange._id,
          note: `Exchange completed — skill swap`,
        }],
        { session }
      );

      // Update exchange status
      exchange.status = "completed";
      exchange.completedAt = new Date();
      exchange.disputeDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000); // +48 hours
      await exchange.save({ session });

      await session.commitTransaction();

      // Notify both parties (outside transaction)
      await notificationService.send(exchange.requesterId, "exchange_complete", {
        message: "Exchange completed! Credits have been transferred.",
        exchangeId: exchange._id,
        creditHours: exchange.creditHours,
      });
      await notificationService.send(exchange.receiverId, "exchange_complete", {
        message: "Exchange completed! Credits have been transferred.",
        exchangeId: exchange._id,
        creditHours: exchange.creditHours,
      });
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } else {
    // Only one party confirmed — set status to awaiting_completion
    exchange.status = "awaiting_completion";
    await exchange.save();

    // Notify the other party
    const otherUserId = isRequester ? exchange.receiverId : exchange.requesterId;
    await notificationService.send(otherUserId, "exchange_complete", {
      message: `${req.user.name} has confirmed the exchange. Please confirm on your end.`,
      exchangeId: exchange._id,
    });
  }

  // Re-fetch with populated data to return
  const updated = await Exchange.findById(exchange._id)
    .populate("requesterId", "name avatar")
    .populate("receiverId", "name avatar")
    .populate("offeredSkillId", "displayName category")
    .populate("requestedSkillId", "displayName category");

  res.status(200).json(new ApiResponse(200, { exchange: updated }, "Exchange confirmation recorded"));
});

module.exports = {
  createRequest,
  getIncomingRequests,
  getOutgoingRequests,
  acceptRequest,
  declineRequest,
  counterRequest,
  getMyExchanges,
  getExchangeById,
  confirmExchange,
};
