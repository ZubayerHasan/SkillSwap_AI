const Review = require("../models/Review.model");
const SkillOffer = require("../models/SkillOffer.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { updateTrustScore } = require("../services/trustScore.service");

// POST /api/reviews — Create a review for a completed exchange
const createReview = asyncHandler(async (req, res) => {
  const { reviewedUserId, rating, comment, exchangeId, endorsedSkills } = req.body;

  if (!reviewedUserId || !rating || !comment) {
    throw new ApiError(400, "reviewedUserId, rating, and comment are required");
  }

  // Prevent duplicate review for the same exchange by the same reviewer
  const duplicateQuery = { reviewerId: req.user._id, reviewedUserId };
  if (exchangeId) duplicateQuery.exchangeId = exchangeId;

  const existing = await Review.findOne(duplicateQuery);
  if (existing) {
    throw new ApiError(409, "You have already reviewed this user for this exchange");
  }

  // Create the review
  const review = await Review.create({
    reviewerId: req.user._id,
    reviewedUserId,
    exchangeId: exchangeId || null,
    rating,
    comment,
    endorsedSkills: endorsedSkills || [],
  });

  // Increment endorsementCount on each endorsed SkillOffer
  if (endorsedSkills && endorsedSkills.length > 0) {
    await SkillOffer.updateMany(
      { _id: { $in: endorsedSkills } },
      { $inc: { endorsementCount: 1 } }
    );
  }

  // Recalculate trust score via the dedicated service (replaces inline logic)
  await updateTrustScore(reviewedUserId);

  return res.status(201).json(
    new ApiResponse(201, { review }, "Review submitted successfully")
  );
});

// GET /api/reviews/:userId — Get all reviews for a user
const getUserReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ reviewedUserId: req.params.userId })
    .populate("reviewerId", "name email avatar")
    .populate("endorsedSkills", "displayName category")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, { reviews }, "Reviews fetched successfully")
  );
});

module.exports = {
  createReview,
  getUserReviews,
};