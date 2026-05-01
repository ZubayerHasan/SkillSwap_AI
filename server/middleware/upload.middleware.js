const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directories exist
const avatarDir = path.join(__dirname, "..", "uploads", "avatars");
const portfolioDir = path.join(__dirname, "..", "uploads", "portfolio");
const chatDir = path.join(__dirname, "..", "uploads", "chat");
fs.mkdirSync(avatarDir, { recursive: true });
fs.mkdirSync(portfolioDir, { recursive: true });
fs.mkdirSync(chatDir, { recursive: true });

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

const localChatStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, chatDir),
  filename: (req, file, cb) => {
    const uniqueName = `chat-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// --- Try Cloudinary, fall back to local ---
let avatarStorage = localAvatarStorage;
let portfolioStorage = localPortfolioStorage;
let chatStorage = localChatStorage;

try {
  const { CloudinaryStorage } = require("multer-storage-cloudinary");
  const cloudinary = require("../config/cloudinary");
  const cfg = cloudinary.config();

  const isCloudinaryConfigured = cfg.cloud_name && cfg.api_key && cfg.api_secret;
  const isPlaceholderCloudinaryConfig =
    cfg.cloud_name === "dev_cloud" ||
    cfg.api_key === "dev_key" ||
    cfg.api_secret === "dev_secret";

  // Validate cloud name format (must be alphanumeric/underscores only)
  if (isCloudinaryConfigured && !isPlaceholderCloudinaryConfig && /^[a-z0-9_-]+$/i.test(cfg.cloud_name)) {
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

    chatStorage = new CloudinaryStorage({
      cloudinary,
      params: {
        folder: "skillswap/chat",
        resource_type: "auto",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "gif", "mp4", "mov", "webm"],
      },
    });

    console.log(`📸 Using Cloudinary storage for uploads (Cloud: ${cfg.cloud_name})`);
  } else {
    if (!isCloudinaryConfigured) {
      console.log("📸 Cloudinary environment variables missing, using local disk storage");
    } else if (isPlaceholderCloudinaryConfig) {
      console.log("📸 Cloudinary is configured with placeholder dev values, using local disk storage");
    } else {
      console.log(`📸 Cloudinary cloud_name "${cfg.cloud_name}" appears invalid (regex check), using local disk storage`);
    }
  }
} catch (err) {
  console.error("📸 Cloudinary initialization error:", err.message);
  console.log("📸 [DIAGNOSTIC] Falling back to local disk storage. Please check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment variables.");
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

const chatMediaFilter = (req, file, cb) => {
  const allowedImageMimes = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/gif"];
  const allowedVideoMimes = ["video/mp4", "video/quicktime", "video/webm"];

  if (allowedImageMimes.includes(file.mimetype) || allowedVideoMimes.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(new Error("Only images (JPEG/PNG/WebP/GIF) and videos (MP4/MOV/WebM) are allowed"), false);
};

const uploadChatMedia = multer({
  storage: chatStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: chatMediaFilter,
});

module.exports = { uploadAvatar, uploadPortfolio, uploadChatMedia };
