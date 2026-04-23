const SkillOffer = require("../models/SkillOffer.model");
const SkillNeed = require("../models/SkillNeed.model");
const User = require("../models/User.model");

// ---------- Small helpers ----------
const toIdString = (value) => (value ? String(value) : "");
const normalizeText = (value) => String(value || "").trim().toLowerCase();

const normalizeBitfield = (value) => {
  if (!value) return null;

  if (Buffer.isBuffer(value)) return value;

  // Handles { type: "Buffer", data: [...] }
  if (value.type === "Buffer" && Array.isArray(value.data)) {
    return Buffer.from(value.data);
  }

  // Handles BSON Binary-like objects
  if (value.buffer) {
    return Buffer.from(value.buffer);
  }

  return null;
};

// Precomputed popcount table for fast bit counting
const POPCOUNT_TABLE = Array.from({ length: 256 }, (_, i) => {
  let count = 0;
  let n = i;
  while (n) {
    count += n & 1;
    n >>= 1;
  }
  return count;
});

// ---------- Availability overlap ----------
const computeAvailabilityOverlapMinutes = (bitfieldA, bitfieldB) => {
  const a = normalizeBitfield(bitfieldA);
  const b = normalizeBitfield(bitfieldB);

  if (!a || !b) return 0;

  const len = Math.min(a.length, b.length);
  let overlapMinutes = 0;

  for (let i = 0; i < len; i++) {
    overlapMinutes += POPCOUNT_TABLE[a[i] & b[i]];
  }

  return overlapMinutes;
};

const computeAvailabilityScore = (overlapMinutes) => {
  if (overlapMinutes <= 0) return 0;
  if (overlapMinutes < 60) return 5;
  if (overlapMinutes < 180) return 10;
  if (overlapMinutes < 360) return 15;
  return 20;
};

// ---------- Skill compatibility ----------
const getCompatibilityMeta = (need, offer) => {
  const taxonomyMatch =
    need.skillTaxonomyId &&
    offer.skillTaxonomyId &&
    toIdString(need.skillTaxonomyId) === toIdString(offer.skillTaxonomyId);

  const exactSkillMatch =
    normalizeText(need.skillName) &&
    normalizeText(need.skillName) === normalizeText(offer.skillName);

  const categoryMatch =
    normalizeText(need.category) &&
    normalizeText(need.category) === normalizeText(offer.category);

  const isCompatible = taxonomyMatch || exactSkillMatch || categoryMatch;

  return {
    isCompatible,
    taxonomyMatch,
    exactSkillMatch,
    categoryMatch,
  };
};

const computeSkillScore = (need, offer, compatibilityMeta) => {
  if (!compatibilityMeta.isCompatible) return 0;

  let baseScore = 0;

  if (compatibilityMeta.taxonomyMatch) baseScore = 30;
  else if (compatibilityMeta.exactSkillMatch) baseScore = 25;
  else if (compatibilityMeta.categoryMatch) baseScore = 10;

  const proficiencyBonusMap = { 1: 4, 2: 7, 3: 10 };
  const urgencyBonusMap = { 1: 1, 2: 3, 3: 5 };

  const proficiencyBonus = proficiencyBonusMap[offer.proficiencyLevel] || 0;
  const urgencyBonus = urgencyBonusMap[need.urgency] || 0;

  return Math.min(50, baseScore + proficiencyBonus + urgencyBonus);
};

// ---------- Quality / trust ----------
const computeQualityScore = (candidateUser, matchedOffer) => {
  const trustComponent = Math.round(((candidateUser.trustScore || 0) / 100) * 6);
  const endorsementComponent = Math.min(4, matchedOffer.endorsementCount || 0);

  return Math.min(10, trustComponent + endorsementComponent);
};

// ---------- Reciprocity ----------
const findBestReciprocalMatch = (currentUserOffers, candidateNeeds) => {
  let best = null;

  for (const offer of currentUserOffers) {
    for (const need of candidateNeeds) {
      const compatibilityMeta = getCompatibilityMeta(need, offer);

      if (!compatibilityMeta.isCompatible) continue;

      const score = computeSkillScore(need, offer, compatibilityMeta);

      if (!best || score > best.score) {
        best = {
          offer,
          need,
          score,
          compatibilityMeta,
        };
      }
    }
  }

  return best;
};

// ---------- Formatters ----------
const formatOffer = (offer) => ({
  _id: offer._id,
  userId: offer.userId,
  skillName: offer.skillName,
  displayName: offer.displayName,
  skillTaxonomyId: offer.skillTaxonomyId || null,
  category: offer.category,
  proficiencyLevel: offer.proficiencyLevel,
  description: offer.description || "",
  endorsementCount: offer.endorsementCount || 0,
});

const formatNeed = (need) => ({
  _id: need._id,
  userId: need.userId,
  skillName: need.skillName,
  displayName: need.displayName,
  skillTaxonomyId: need.skillTaxonomyId || null,
  category: need.category,
  urgency: need.urgency,
  description: need.description || "",
});

const buildReasons = ({
  compatibilityMeta,
  overlapMinutes,
  reciprocalMatch,
  matchedOffer,
  matchedNeed,
}) => {
  const reasons = [];

  if (compatibilityMeta.taxonomyMatch) reasons.push("Same skill taxonomy");
  else if (compatibilityMeta.exactSkillMatch) reasons.push("Exact skill name match");
  else if (compatibilityMeta.categoryMatch) reasons.push("Same skill category");

  if ((matchedOffer.proficiencyLevel || 0) === 3) reasons.push("Expert-level offer");
  else if ((matchedOffer.proficiencyLevel || 0) === 2) reasons.push("Intermediate-level offer");

  if ((matchedNeed.urgency || 0) === 3) reasons.push("High urgency need");
  else if ((matchedNeed.urgency || 0) === 2) reasons.push("Medium urgency need");

  if (overlapMinutes >= 180) reasons.push("Strong schedule overlap");
  else if (overlapMinutes > 0) reasons.push("Some schedule overlap");

  if (reciprocalMatch) reasons.push("Two-way barter opportunity");

  return reasons;
};

// ---------- Main service ----------
const getSmartMatchesForUser = async (userId, options = {}) => {
  const limit = Number(options.limit) > 0 ? Number(options.limit) : 20;

  const currentUser = await User.findById(userId)
    .select("name university department bio avatar trustScore profileCompleteness timezone availability availabilityBitfield")
    .lean();

  if (!currentUser) {
    throw new Error("User not found");
  }

  const currentUserNeeds = await SkillNeed.find({
    userId,
    isActive: true,
  }).lean();

  const currentUserOffers = await SkillOffer.find({
    userId,
    isActive: true,
  }).lean();

  if (!currentUserNeeds.length) {
    return [];
  }

  // Pull all active offers from other users
  const otherUserOffers = await SkillOffer.find({
    userId: { $ne: userId },
    isActive: true,
  }).lean();

  const candidateBestMatchMap = new Map();

  // Find each candidate user's best offer against current user's needs
  for (const need of currentUserNeeds) {
    for (const offer of otherUserOffers) {
      const compatibilityMeta = getCompatibilityMeta(need, offer);

      if (!compatibilityMeta.isCompatible) continue;

      const skillScore = computeSkillScore(need, offer, compatibilityMeta);
      const candidateId = toIdString(offer.userId);

      const existing = candidateBestMatchMap.get(candidateId);

      if (!existing || skillScore > existing.skillScore) {
        candidateBestMatchMap.set(candidateId, {
          matchedNeed: need,
          matchedOffer: offer,
          compatibilityMeta,
          skillScore,
        });
      }
    }
  }

  const candidateIds = [...candidateBestMatchMap.keys()];

  if (!candidateIds.length) {
    return [];
  }

  const candidateUsers = await User.find({
    _id: { $in: candidateIds },
  })
    .select("name university department bio avatar trustScore profileCompleteness timezone availability availabilityBitfield")
    .lean();

  const candidateNeeds = await SkillNeed.find({
    userId: { $in: candidateIds },
    isActive: true,
  }).lean();

  const candidateNeedsByUserId = new Map();

  for (const need of candidateNeeds) {
    const key = toIdString(need.userId);
    if (!candidateNeedsByUserId.has(key)) {
      candidateNeedsByUserId.set(key, []);
    }
    candidateNeedsByUserId.get(key).push(need);
  }

  const results = candidateUsers.map((candidateUser) => {
    const candidateId = toIdString(candidateUser._id);
    const bestSeed = candidateBestMatchMap.get(candidateId);
    const candidateUserNeeds = candidateNeedsByUserId.get(candidateId) || [];

    const reciprocal = findBestReciprocalMatch(currentUserOffers, candidateUserNeeds);
    const reciprocalMatch = Boolean(reciprocal);

    const overlapMinutes = computeAvailabilityOverlapMinutes(
      currentUser.availabilityBitfield,
      candidateUser.availabilityBitfield
    );

    const availabilityScore = computeAvailabilityScore(overlapMinutes);
    const reciprocityScore = reciprocalMatch ? 20 : 0;
    const qualityScore = computeQualityScore(candidateUser, bestSeed.matchedOffer);
    const totalScore =
      bestSeed.skillScore + reciprocityScore + availabilityScore + qualityScore;

    return {
      userId: candidateUser._id,
      name: candidateUser.name,
      university: candidateUser.university,
      department: candidateUser.department,
      bio: candidateUser.bio,
      avatar: candidateUser.avatar,
      trustScore: candidateUser.trustScore,
      profileCompleteness: candidateUser.profileCompleteness,
      timezone: candidateUser.timezone,

      matchedNeed: formatNeed(bestSeed.matchedNeed),
      matchedOffer: formatOffer(bestSeed.matchedOffer),

      reciprocalMatch,
      reciprocalNeed: reciprocal ? formatNeed(reciprocal.need) : null,
      reciprocalOffer: reciprocal ? formatOffer(reciprocal.offer) : null,

      overlapMinutes,
      overlapHours: Number((overlapMinutes / 60).toFixed(1)),

      scoreBreakdown: {
        skillScore: bestSeed.skillScore,
        reciprocityScore,
        availabilityScore,
        qualityScore,
      },

      totalScore,

      reasons: buildReasons({
        compatibilityMeta: bestSeed.compatibilityMeta,
        overlapMinutes,
        reciprocalMatch,
        matchedOffer: bestSeed.matchedOffer,
        matchedNeed: bestSeed.matchedNeed,
      }),
    };
  });

  return results
    .sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (b.overlapMinutes !== a.overlapMinutes) return b.overlapMinutes - a.overlapMinutes;
      return (b.trustScore || 0) - (a.trustScore || 0);
    })
    .slice(0, limit);
};

module.exports = {
  computeAvailabilityOverlapMinutes,
  computeSkillScore,
  getSmartMatchesForUser,
};