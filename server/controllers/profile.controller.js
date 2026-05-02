const User = require("../models/User.model");
const SkillOffer = require("../models/SkillOffer.model");
const SkillNeed = require("../models/SkillNeed.model");
const PortfolioItem = require("../models/PortfolioItem.model");
const env = require("../config/env");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const getPublicBaseUrl = (req) => {
  const configuredBaseUrl = env.BACKEND_URL?.trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, "");
  }

  return `${req.protocol}://${req.get("host")}`;
};

const detectPortfolioType = ({ mimeType, sourceFileName, fallbackType = "link" }) => {
  const loweredMimeType = String(mimeType || "").toLowerCase();
  const loweredFileName = String(sourceFileName || "").toLowerCase();

  if (loweredMimeType === "application/pdf" || loweredFileName.endsWith(".pdf")) {
    return "pdf";
  }

  if (loweredMimeType.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(loweredFileName)) {
    return "image";
  }

  return fallbackType;
};

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
      const baseUrl = getPublicBaseUrl(req);
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
  const portfolio = await PortfolioItem.find({ userId: req.params.userId })
    .sort({ createdAt: -1 })
    .select("title caption type url cloudinaryPublicId sourceFileName mimeType createdAt");

  res.status(200).json(new ApiResponse(200, { user, skills, portfolio }, "Public profile fetched"));
});

// GET /api/profile/portfolio/me
const getMyPortfolio = asyncHandler(async (req, res) => {
  const portfolio = await PortfolioItem.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .select("title caption type url cloudinaryPublicId sourceFileName mimeType createdAt");
  res.status(200).json(new ApiResponse(200, { portfolio }, "Portfolio fetched successfully"));
});

// POST /api/profile/portfolio
const addPortfolioItem = asyncHandler(async (req, res) => {
  const { title, caption, url: externalUrl } = req.body;

  if (!title || !String(title).trim()) {
    throw new ApiError(400, "Portfolio title is required");
  }

  let itemUrl = externalUrl ? String(externalUrl).trim() : "";
  let cloudinaryPublicId = "";
  let sourceFileName = "";
  let mimeType = "";
  let type = "link";

  if (req.file) {
    itemUrl = req.file.path;
    cloudinaryPublicId = req.file.filename || "";
    sourceFileName = req.file.originalname || "";
    mimeType = req.file.mimetype || "";

    if (!itemUrl.startsWith("http")) {
      const baseUrl = getPublicBaseUrl(req);
      itemUrl = `${baseUrl}/uploads/portfolio/${req.file.filename}`;
    }

    type = detectPortfolioType({ mimeType, sourceFileName });
  } else if (!itemUrl) {
    throw new ApiError(400, "Upload a file or provide a URL");
  }

  const portfolioItem = await PortfolioItem.create({
    userId: req.user._id,
    title: String(title).trim(),
    caption: caption ? String(caption).trim() : "",
    type,
    url: itemUrl,
    cloudinaryPublicId,
    sourceFileName,
    mimeType,
  });

  res.status(201).json(new ApiResponse(201, { portfolioItem }, "Portfolio item added successfully"));
});

// DELETE /api/profile/portfolio/:itemId
const deletePortfolioItem = asyncHandler(async (req, res) => {
  const portfolioItem = await PortfolioItem.findOneAndDelete({ _id: req.params.itemId, userId: req.user._id });
  if (!portfolioItem) throw new ApiError(404, "Portfolio item not found");
  res.status(200).json(new ApiResponse(200, {}, "Portfolio item deleted successfully"));
});

module.exports = {
  getMyProfile,
  updateProfile,
  uploadAvatar,
  getPublicProfile,
  getMyPortfolio,
  addPortfolioItem,
  deletePortfolioItem,
};
