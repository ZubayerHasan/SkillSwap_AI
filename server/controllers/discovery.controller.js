const SkillOffer = require("../models/SkillOffer.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const mongoose = require("mongoose");
const { getSmartMatchesForUser } = require("../services/match.service");

// GET /api/discovery/skills?q=&category=&level=&cursor=&limit=&userId=
const discoverSkills = asyncHandler(async (req, res) => {
  const { q, category, level, cursor, limit = 12, userId } = req.query;
  const pageSize = Math.min(parseInt(limit), 50);

  const matchStage = { isActive: true };

  if (category) matchStage.category = category;
  if (level) matchStage.proficiencyLevel = parseInt(level);
  if (cursor) matchStage._id = { $lt: new mongoose.Types.ObjectId(cursor) };
  if (userId) matchStage.userId = new mongoose.Types.ObjectId(userId);

  const pipeline = [];

  if (q) {
    pipeline.push({
      $match: {
        ...matchStage,
        $or: [
          { displayName: { $regex: q, $options: "i" } },
          { skillName: { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } },
          { category: { $regex: q, $options: "i" } },
        ],
      },
    });
  } else {
    pipeline.push({ $match: matchStage });
  }

  pipeline.push({ $sort: { _id: -1 } });
  pipeline.push({ $limit: pageSize + 1 });
  pipeline.push({
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "user",
      pipeline: [
        {
          $project: {
            name: 1,
            university: 1,
            avatar: 1,
            trustScore: 1,
            profileCompleteness: 1,
          },
        },
      ],
    },
  });
  pipeline.push({
    $unwind: { path: "$user", preserveNullAndEmptyArrays: false },
  });

  const results = await SkillOffer.aggregate(pipeline);

  const hasMore = results.length > pageSize;
  const items = hasMore ? results.slice(0, pageSize) : results;
  const nextCursor = hasMore ? items[items.length - 1]._id.toString() : null;

  const facetMatch = { isActive: true };
  if (userId) facetMatch.userId = new mongoose.Types.ObjectId(userId);

  const facets = await SkillOffer.aggregate([
    { $match: facetMatch },
    {
      $facet: {
        categories: [
          { $group: { _id: "$category", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        levels: [
          { $group: { _id: "$proficiencyLevel", count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ],
      },
    },
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      { results: items, nextCursor, facets: facets[0] },
      "Discovery results"
    )
  );
});

// GET /api/discovery/matches?limit=
const getSmartMatches = asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;

  const results = await getSmartMatchesForUser(req.user._id, { limit });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          results,
          count: results.length,
        },
        "Smart matches fetched"
      )
    );
});

module.exports = { discoverSkills, getSmartMatches };