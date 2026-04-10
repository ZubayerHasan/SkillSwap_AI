const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directories exist
const avatarDir = path.join(__dirname, "..", "uploads", "avatars");
const portfolioDir = path.join(__dirname, "..", "uploads", "portfolio");
fs.mkdirSync(avatarDir, { recursive: true });
fs.mkdirSync(portfolioDir, { recursive: true });

// --- Local disk storage (always available) ---
const localAvatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarDir),
  filename: (req, file, cb) => {
    const uniqueName = `avatar-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const localPortfolioStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, portfolioDir),
  filename: (req, file, cb) => {
    const uniqueName = `portfolio-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// --- Try Cloudinary, fall back to local ---
let avatarStorage = localAvatarStorage;
let portfolioStorage = localPortfolioStorage;

try {
  const { CloudinaryStorage } = require("multer-storage-cloudinary");
  const cloudinary = require("../config/cloudinary");
  const cfg = cloudinary.config();

  // Validate cloud name format (must be alphanumeric/underscores only)
  if (cfg.cloud_name && cfg.api_key && /^[a-z0-9_]+$/i.test(cfg.cloud_name)) {
    avatarStorage = new CloudinaryStorage({
      cloudinary,
      params: {
        folder: "skillswap/avatars",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
      },
    });

    portfolioStorage = new CloudinaryStorage({
      cloudinary,
      params: {
        folder: "skillswap/portfolio",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "pdf"],
      },
    });

    console.log("📸 Using Cloudinary storage for uploads");
  } else {
    console.log(`📸 Cloudinary cloud_name "${cfg.cloud_name}" appears invalid, using local disk storage`);
  }
} catch (err) {
  console.log("📸 Cloudinary unavailable, using local disk storage for uploads");
}

const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and WebP images are allowed"), false);
  }
};

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

const uploadPortfolio = multer({
  storage: portfolioStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = { uploadAvatar, uploadPortfolio };
