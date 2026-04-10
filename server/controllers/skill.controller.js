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

module.exports = { createOffer, getMyOffers, updateOffer, deleteOffer, createNeed, getMyNeeds, updateNeed, deleteNeed, getTaxonomy };
