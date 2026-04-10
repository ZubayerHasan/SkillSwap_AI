const ApiError = require("../utils/ApiError");

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, "Access denied: insufficient permissions"));
  }
  next();
};

module.exports = { requireRole };
