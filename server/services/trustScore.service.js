const Review = require("../models/Review.model");
const User = require("../models/User.model");

const updateTrustScore = async (userId) => {
  const reviews = await Review.find({ reviewedUserId: userId });

  if (reviews.length === 0) {
    await User.findByIdAndUpdate(userId, { trustScore: 0 });
    return;
  }

  const avg =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  const score = Math.round((avg / 5) * 100);

  await User.findByIdAndUpdate(userId, {
    trustScore: score,
  });

  return score;
};

module.exports = { updateTrustScore };