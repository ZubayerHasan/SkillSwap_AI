const Review = require("../models/Review.model");
const Exchange = require("../models/Exchange.model");
const SkillOffer = require("../models/SkillOffer.model");
const User = require("../models/User.model");

/**
 * Weighted Trust Score Calculation
 * 
 * Components:
 *   Rating average   (35%) — user's average review rating / 5
 *   Completion rate  (30%) — completedExchanges / totalAcceptedExchanges
 *   Response time    (15%) — placeholder 0.7 (real data later)
 *   Endorsements     (10%) — min(totalEndorsements / 10, 1)
 *   Account age      (10%) — min(daysSinceRegistration / 180, 1)
 *
 * Final = weighted sum × 100, clamped 0–100
 * New users with no data get a floor score of 40
 */
const updateTrustScore = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return 0;

  // 1. Rating average (35%)
  const reviews = await Review.find({ reviewedUserId: userId });
  let ratingScore = 0;
  if (reviews.length > 0) {
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    ratingScore = avg / 5;
  }

  // 2. Completion rate (30%)
  const [completedCount, totalCount] = await Promise.all([
    Exchange.countDocuments({
      $or: [{ requesterId: userId }, { receiverId: userId }],
      status: "completed",
    }),
    Exchange.countDocuments({
      $or: [{ requesterId: userId }, { receiverId: userId }],
      status: { $in: ["scheduled", "in_progress", "awaiting_completion", "completed"] },
    }),
  ]);
  const completionScore = totalCount > 0 ? completedCount / totalCount : 0;

  // 3. Response time score (15%) — placeholder
  const responseScore = 0.7;

  // 4. Endorsement score (10%)
  const skills = await SkillOffer.find({ userId, isActive: true });
  const totalEndorsements = skills.reduce((sum, s) => sum + (s.endorsementCount || 0), 0);
  const endorsementScore = Math.min(totalEndorsements / 10, 1);

  // 5. Account age (10%)
  const daysSinceRegistration = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const ageScore = Math.min(daysSinceRegistration / 180, 1);

  // Weighted sum
  const raw =
    ratingScore * 0.35 +
    completionScore * 0.30 +
    responseScore * 0.15 +
    endorsementScore * 0.10 +
    ageScore * 0.10;

  // Scale to 0-100, enforce floor of 40 for new users with no data
  let score = Math.round(raw * 100);
  if (reviews.length === 0 && totalCount === 0) {
    score = Math.max(score, 40);
  }
  score = Math.max(0, Math.min(100, score));

  // Save and return sub-scores for frontend display
  await User.findByIdAndUpdate(userId, { trustScore: score });

  return {
    score,
    subScores: {
      rating: Math.round(ratingScore * 100),
      completion: Math.round(completionScore * 100),
      responseTime: Math.round(responseScore * 100),
      endorsements: Math.round(endorsementScore * 100),
      tenure: Math.round(ageScore * 100),
    },
  };
};

module.exports = { updateTrustScore };