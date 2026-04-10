const { verifyAccessToken } = require("../utils/tokenGenerator");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User.model");

const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "No token provided");
  }
  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired access token");
  }
  const user = await User.findById(decoded.id).select("-password -emailVerificationToken -passwordResetToken");
  if (!user) throw new ApiError(401, "User not found");
  req.user = user;
  next();
});

module.exports = { authenticate };
