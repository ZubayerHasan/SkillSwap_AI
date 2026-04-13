const crypto = require("crypto");
const User = require("../models/User.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../utils/tokenGenerator");
const emailQueue = require("../queues/emailQueue");
const walletService = require("../services/wallet.service");
const env = require("../config/env");

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, university, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, "Email already registered");

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  const user = await User.create({
    name, email, university, password,
    emailVerificationToken: hashedToken,
    emailVerificationTokenExpiry: tokenExpiry,
  });

  // Queue verification email
  await emailQueue.add("verification", { to: email, name, token: rawToken }, { attempts: 3, backoff: 5000 });

  res.status(201).json(new ApiResponse(201, { email }, "Registration successful. Please check your email to verify your account."));
});

// GET /api/auth/verify-email?token=xxx
const verifyEmail = asyncHandler(async (req, res) => {
  const { token, email } = req.query;
  if (!token) throw new ApiError(400, "Verification token is required");

  // First, try to find user by token
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  let user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationTokenExpiry: { $gt: new Date() },
  });

  // If not found by token, check if they are already verified via email
  if (!user && email) {
    const existingUser = await User.findOne({ email });
    if (existingUser?.isVerified) {
      return res.status(200).json(new ApiResponse(200, {}, "Email already verified. You can log in."));
    }
  }

  if (!user) {
    throw new ApiError(400, "Invalid or expired verification token. Please request a new one.");
  }

  // Credit starter bonus
  user.isVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationTokenExpiry = null;
  await user.save();

  // Add 5 starter credits
  await walletService.creditStarterBonus(user._id, null);

  res.status(200).json(new ApiResponse(200, {}, "Email verified successfully! You can now log in."));
});

// POST /api/auth/resend-verification
const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "No account found with that email address");
  if (user.isVerified) throw new ApiError(400, "Email is already verified");

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  user.emailVerificationToken = hashedToken;
  user.emailVerificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  await emailQueue.add("verification", { to: email, name: user.name, token: rawToken }, { attempts: 3 });

  res.status(200).json(new ApiResponse(200, {}, "Verification email sent. Please check your inbox."));
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(401, "Invalid email or password");

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new ApiError(401, "Invalid email or password");

  if (!user.isVerified) {
    throw new ApiError(403, "Email not verified. Please verify your email before logging in.", [
      { resendEndpoint: "/api/auth/resend-verification" },
    ]);
  }

  const payload = { id: user._id, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
  res.status(200).json(
    new ApiResponse(200, {
      accessToken,
      user: {
        _id: user._id, name: user.name, email: user.email,
        university: user.university, avatar: user.avatar,
        role: user.role, currentBalance: user.currentBalance,
        profileCompleteness: user.profileCompleteness,
        isVerified: user.isVerified,
      },
    }, "Login successful")
  );
});

// POST /api/auth/refresh
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError(401, "No refresh token");

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(decoded.id).select("_id role isVerified");
  if (!user) throw new ApiError(401, "User not found");

  const payload = { id: user._id, role: user.role };
  const accessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS);
  res.status(200).json(new ApiResponse(200, { accessToken }, "Token refreshed"));
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  res.clearCookie("refreshToken");
  res.status(200).json(new ApiResponse(200, {}, "Logged out successfully"));
});

// POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  // Always return 200 to prevent email enumeration
  if (!user) return res.status(200).json(new ApiResponse(200, {}, "If that email exists, a reset link was sent."));

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  user.passwordResetToken = hashedToken;
  user.passwordResetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1h
  await user.save();

  await emailQueue.add("password-reset", { to: email, name: user.name, token: rawToken }, { attempts: 3 });

  res.status(200).json(new ApiResponse(200, {}, "If that email exists, a reset link was sent."));
});

// POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpiry: { $gt: new Date() },
  });

  if (!user) throw new ApiError(400, "Invalid or expired reset token");

  user.password = password;
  user.passwordResetToken = null;
  user.passwordResetTokenExpiry = null;
  await user.save();

  res.status(200).json(new ApiResponse(200, {}, "Password reset successful. You can now log in."));
});

module.exports = { register, verifyEmail, resendVerification, login, refresh, logout, forgotPassword, resetPassword };
