const express = require("express");
const router = express.Router();
const { register, verifyEmail, resendVerification, login, refresh, logout, forgotPassword, resetPassword } = require("../controllers/auth.controller");
const { validate } = require("../middleware/validate.middleware");
const { registrationLimiter, loginLimiter, resendVerificationLimiter } = require("../middleware/rateLimit.middleware");
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, resendVerificationSchema } = require("../validators/auth.validator");

router.post("/register", registrationLimiter, validate(registerSchema), register);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationLimiter, validate(resendVerificationSchema), resendVerification);
router.post("/login", loginLimiter, validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

module.exports = router;
