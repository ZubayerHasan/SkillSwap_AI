const SkillOffer = require("../models/SkillOffer.model");
const SkillNeed = require("../models/SkillNeed.model");
const SkillTaxonomy = require("../models/SkillTaxonomy.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { normalizeSkillName } = require("../utils/skillNormalizer");

const MAX_SKILLS = 10;

const sanitizeOptionalTaxonomyId = (value) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

// --- SKILL OFFERS ---

// POST /api/skills/offer
const createOffer = asyncHandler(async (req, res) => {
  const count = await SkillOffer.countDocuments({ userId: req.user._id, isActive: true });
  if (count >= MAX_SKILLS) throw new ApiError(400, `Maximum ${MAX_SKILLS} offered skills allowed`);

  const { skillName, category, proficiencyLevel, description, skillTaxonomyId } = req.body;
  const sanitizedTaxonomyId = sanitizeOptionalTaxonomyId(skillTaxonomyId);
  const normalizedName = normalizeSkillName(skillName);

  const existing = await SkillOffer.findOne({ userId: req.user._id, skillName: normalizedName, isActive: true });
  if (existing) throw new ApiError(409, "You already have an offer for this skill");

  const offer = await SkillOffer.create({
    userId: req.user._id,
    skillName: normalizedName,
    displayName: skillName,
    category,
    proficiencyLevel,
    description,
    skillTaxonomyId: sanitizedTaxonomyId,
  });

  res.status(201).json(new ApiResponse(201, { offer }, "Skill offer created"));
});

// GET /api/skills/offer/me
const getMyOffers = asyncHandler(async (req, res) => {
  const offers = await SkillOffer.find({ userId: req.user._id, isActive: true }).sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, { offers, count: offers.length }, "Skill offers fetched"));
});

// PUT /api/skills/offer/:id
const updateOffer = asyncHandler(async (req, res) => {
  const offer = await SkillOffer.findOne({ _id: req.params.id, userId: req.user._id });
  if (!offer) throw new ApiError(404, "Skill offer not found");

  const updatable = ["proficiencyLevel", "description", "category"];
  updatable.forEach((f) => { if (req.body[f] !== undefined) offer[f] = req.body[f]; });
  await offer.save();

  res.status(200).json(new ApiResponse(200, { offer }, "Skill offer updated"));
});

// DELETE /api/skills/offer/:id (soft delete)
const deleteOffer = asyncHandler(async (req, res) => {
  const offer = await SkillOffer.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { isActive: false },
    { new: true }
  );
  if (!offer) throw new ApiError(404, "Skill offer not found");
  res.status(200).json(new ApiResponse(200, {}, "Skill offer removed"));
});

// --- SKILL NEEDS ---

// POST /api/skills/need
const createNeed = asyncHandler(async (req, res) => {
  const count = await SkillNeed.countDocuments({ userId: req.user._id, isActive: true });
  if (count >= MAX_SKILLS) throw new ApiError(400, `Maximum ${MAX_SKILLS} skill needs allowed`);

  const { skillName, category, urgency, description, skillTaxonomyId } = req.body;
  const sanitizedTaxonomyId = sanitizeOptionalTaxonomyId(skillTaxonomyId);
  const normalizedName = normalizeSkillName(skillName);

  const existing = await SkillNeed.findOne({ userId: req.user._id, skillName: normalizedName, isActive: true });
  if (existing) throw new ApiError(409, "You already listed a need for this skill");

  const need = await SkillNeed.create({
    userId: req.user._id,
    skillName: normalizedName,
    displayName: skillName,
    category,
    urgency,
    description,
    skillTaxonomyId: sanitizedTaxonomyId,
  });

  res.status(201).json(new ApiResponse(201, { need }, "Skill need created"));
});

// GET /api/skills/need/me
const getMyNeeds = asyncHandler(async (req, res) => {
  const needs = await SkillNeed.find({ userId: req.user._id, isActive: true }).sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, { needs, count: needs.length }, "Skill needs fetched"));
});

// PUT /api/skills/need/:id
const updateNeed = asyncHandler(async (req, res) => {
  const need = await SkillNeed.findOne({ _id: req.params.id, userId: req.user._id });
  if (!need) throw new ApiError(404, "Skill need not found");

  const updatable = ["urgency", "description"];
  updatable.forEach((f) => { if (req.body[f] !== undefined) need[f] = req.body[f]; });
  await need.save();

  res.status(200).json(new ApiResponse(200, { need }, "Skill need updated"));
});

// DELETE /api/skills/need/:id
const deleteNeed = asyncHandler(async (req, res) => {
  const need = await SkillNeed.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { isActive: false },
    { new: true }
  );
  if (!need) throw new ApiError(404, "Skill need not found");
  res.status(200).json(new ApiResponse(200, {}, "Skill need removed"));
});

// GET /api/skills/taxonomy?q=
const getTaxonomy = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const query = q
    ? { $or: [{ canonicalName: { $regex: q, $options: "i" } }, { aliases: { $regex: q, $options: "i" } }, { displayName: { $regex: q, $options: "i" } }] }
    : {};
  const skills = await SkillTaxonomy.find(query).select("canonicalName displayName category aliases slug").limit(20);
  res.status(200).json(new ApiResponse(200, { skills }, "Taxonomy fetched"));
});

// --- BROADCASTS (F10) ---

const MAX_BROADCASTS = 3;
const BROADCAST_TTL_DAYS = 30;
const URGENCY_LABELS = { 1: "Low", 2: "Medium", 3: "High" };

// POST /api/skills/broadcast
const createBroadcast = asyncHandler(async (req, res) => {
  const active = await SkillNeed.countDocuments({
    userId: req.user._id,
    isBroadcast: true,
    status: "open",
  });
  if (active >= MAX_BROADCASTS) {
    throw new ApiError(400, `You can only have ${MAX_BROADCASTS} active broadcasts. Fulfill or wait for existing ones to expire.`);
  }

  const { skillName, category, description, urgency } = req.body;
  if (!skillName || !category || !urgency) throw new ApiError(400, "skillName, category, and urgency are required");

  const normalizedName = normalizeSkillName(skillName);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + BROADCAST_TTL_DAYS);

  const broadcast = await SkillNeed.create({
    userId: req.user._id,
    skillName: normalizedName,
    displayName: skillName,
    category,
    description: description || "",
    urgency: Number(urgency),
    isBroadcast: true,
    status: "open",
    expiresAt,
  });

  res.status(201).json(new ApiResponse(201, { broadcast }, "Broadcast posted"));
});

// GET /api/skills/broadcasts?page=&limit=
const getBroadcasts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(20, parseInt(req.query.limit) || 12);
  const skip = (page - 1) * limit;

  // Auto-expire
  await SkillNeed.updateMany(
    { isBroadcast: true, status: "open", expiresAt: { $lt: new Date() } },
    { status: "expired", isActive: false }
  );

  const [broadcasts, total] = await Promise.all([
    SkillNeed.find({ isBroadcast: true, status: "open" })
      .sort({ urgency: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name avatar trustScore university"),
    SkillNeed.countDocuments({ isBroadcast: true, status: "open" }),
  ]);

  res.status(200).json(new ApiResponse(200, {
    broadcasts,
    total,
    page,
    pages: Math.ceil(total / limit),
  }, "Broadcasts fetched"));
});

// PATCH /api/skills/broadcasts/:id/fulfill
const fulfillBroadcast = asyncHandler(async (req, res) => {
  const broadcast = await SkillNeed.findOne({
    _id: req.params.id,
    userId: req.user._id,
    isBroadcast: true,
    status: "open",
  });
  if (!broadcast) throw new ApiError(404, "Broadcast not found or already closed");

  broadcast.status = "fulfilled";
  broadcast.isActive = false;
  await broadcast.save();

  res.status(200).json(new ApiResponse(200, { broadcast }, "Broadcast marked as fulfilled"));
});

// GET /api/skills/broadcasts/mine — user's own broadcasts
const getMyBroadcasts = asyncHandler(async (req, res) => {
  const broadcasts = await SkillNeed.find({ userId: req.user._id, isBroadcast: true })
    .sort({ createdAt: -1 })
    .limit(20);
  res.status(200).json(new ApiResponse(200, { broadcasts }, "My broadcasts fetched"));
});

module.exports = {
  createOffer, getMyOffers, updateOffer, deleteOffer,
  createNeed, getMyNeeds, updateNeed, deleteNeed,
  getTaxonomy,
  createBroadcast, getBroadcasts, fulfillBroadcast, getMyBroadcasts,
};

