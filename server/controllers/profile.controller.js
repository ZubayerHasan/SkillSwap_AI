const User = require("../models/User.model");
const SkillOffer = require("../models/SkillOffer.model");
const SkillNeed = require("../models/SkillNeed.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const computeAndSaveCompleteness = async (userId) => {
  const user = await User.findById(userId);
  const completeness = user.computeProfileCompleteness();
  user.profileCompleteness = completeness;
  await user.save();
  return completeness;
};

// GET /api/profile/me
const getMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -emailVerificationToken -emailVerificationTokenExpiry -passwordResetToken -passwordResetTokenExpiry");
  if (!user) throw new ApiError(404, "User not found");
  res.status(200).json(new ApiResponse(200, { user }, "Profile fetched successfully"));
});

// PUT /api/profile/me
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ["name", "bio", "university", "department", "contactPreference", "timezone"];
  const updates = {};
  allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select("-password");
  if (!user) throw new ApiError(404, "User not found");

  const completeness = await computeAndSaveCompleteness(req.user._id);
  res.status(200).json(new ApiResponse(200, { user, profileCompleteness: completeness }, "Profile updated successfully"));
});

// POST /api/profile/avatar
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded");

  let avatarUrl, publicId;

  try {
    // Determine avatar URL: Cloudinary gives a full URL in req.file.path,
    // local disk storage gives a relative filesystem path
    avatarUrl = req.file.path;
    publicId = req.file.filename;

    // If it's a local file (not a full URL), construct absolute serving path
    if (!avatarUrl.startsWith("http")) {
      const baseUrl = env.BACKEND_URL.replace(/\/+$/, "");
      avatarUrl = `${baseUrl}/uploads/avatars/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        avatar: {
          cloudinaryPublicId: publicId,
          url: avatarUrl,
        },
      },
      { new: true }
    ).select("-password");

    const completeness = await computeAndSaveCompleteness(req.user._id);
    user.profileCompleteness = completeness;

    res.status(200).json(new ApiResponse(200, { avatar: user.avatar, profileCompleteness: completeness }, "Avatar uploaded successfully"));
  } catch (error) {
    console.error("❌ Avatar upload processing error:", error);
    throw new ApiError(500, "Failed to process uploaded avatar");
  }
});

// GET /api/profile/:userId (public)
const getPublicProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId)
    .select("name university department bio avatar trustScore profileCompleteness role createdAt");
  if (!user) throw new ApiError(404, "User not found");

  const skills = await SkillOffer.find({ userId: req.params.userId, isActive: true })
    .select("skillName category proficiencyLevel endorsementCount displayName");

  res.status(200).json(new ApiResponse(200, { user, skills }, "Public profile fetched"));
});

module.exports = { getMyProfile, updateProfile, uploadAvatar, getPublicProfile };
