const Review = require("../models/Review.model");
const User = require("../models/User.model");

// CREATE REVIEW
const createReview = async (req, res) => {
  try {
    const { reviewedUserId, rating, comment, exchangeId, endorsedSkills } = req.body;

    // ❌ Prevent duplicate review
    const existing = await Review.findOne({
      reviewerId: req.user._id,
      reviewedUserId,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You already reviewed this user",
      });
    }

    // Create review
    const review = await Review.create({
      reviewerId: req.user._id,
      reviewedUserId,
      exchangeId,
      rating,
      comment,
      endorsedSkills: endorsedSkills || [],
    });

    // 🔥 Recalculate trust score
    const reviews = await Review.find({ reviewedUserId });

    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    const trustScore = Math.round((avgRating / 5) * 100);

    await User.findByIdAndUpdate(reviewedUserId, {
      trustScore,
    });

    res.status(201).json({
      success: true,
      review,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// GET REVIEWS OF USER
const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      reviewedUserId: req.params.userId,
    })
      .populate("reviewerId", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      reviews,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  createReview,
  getUserReviews,
};