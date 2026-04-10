const ApiError = require("../utils/ApiError");

const requireVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return next(new ApiError(403, "Email not verified. Please verify your email to access this resource.", [{ resendEndpoint: "/api/auth/resend-verification" }]));
  }
  next();
};

module.exports = { requireVerified };
