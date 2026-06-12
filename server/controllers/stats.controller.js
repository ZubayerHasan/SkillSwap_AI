const User = require("../models/User.model");
const SkillOffer = require("../models/SkillOffer.model");
const Exchange = require("../models/Exchange.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");

// GET /api/stats — public platform statistics (no auth required)
const getPublicStats = asyncHandler(async (req, res) => {
  const [skillCount, exchangeCount, studentCount] = await Promise.all([
    SkillOffer.countDocuments({ isActive: true }),
    Exchange.countDocuments({ status: "completed" }),
    User.countDocuments({ isVerified: true }),
  ]);

  res.status(200).json(
    new ApiResponse(200, { skillCount, exchangeCount, studentCount }, "Public stats fetched")
  );
});

module.exports = { getPublicStats };
