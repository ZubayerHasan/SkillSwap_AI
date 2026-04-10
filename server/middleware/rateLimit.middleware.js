const rateLimit = require("express-rate-limit");

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
  });

const registrationLimiter = createLimiter(60 * 60 * 1000, 5, "Too many registrations from this IP. Try again in 1 hour.");
const loginLimiter = createLimiter(15 * 60 * 1000, 10, "Too many login attempts. Try again in 15 minutes.");
const resendVerificationLimiter = createLimiter(60 * 60 * 1000, 3, "Too many resend requests. Try again in 1 hour.");
const generalLimiter = createLimiter(15 * 60 * 1000, 100, "Too many requests. Please slow down.");

module.exports = {
  registrationLimiter,
  loginLimiter,
  resendVerificationLimiter,
  generalLimiter,
};
