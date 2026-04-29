const ApiError = require("../utils/ApiError");

/**
 * requireAdmin — blocks access unless the authenticated user has role "admin"
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
};

module.exports = { requireAdmin };
