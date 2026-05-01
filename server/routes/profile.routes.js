const express = require("express");
const router = express.Router();
const {
	getMyProfile,
	updateProfile,
	uploadAvatar,
	getPublicProfile,
	getMyPortfolio,
	addPortfolioItem,
	deletePortfolioItem,
} = require("../controllers/profile.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { requireVerified } = require("../middleware/verified.middleware");
const { validate } = require("../middleware/validate.middleware");
const { uploadAvatar: uploadAvatarStorage, uploadPortfolio } = require("../middleware/upload.middleware");
const { updateProfileSchema } = require("../validators/profile.validator");

router.use(authenticate);
router.get("/me", getMyProfile);
router.put("/me", requireVerified, validate(updateProfileSchema), updateProfile);
router.post("/avatar", requireVerified, uploadAvatarStorage.single("avatar"), uploadAvatar);
router.get("/portfolio/me", getMyPortfolio);
router.post("/portfolio", requireVerified, uploadPortfolio.single("portfolio"), addPortfolioItem);
router.delete("/portfolio/:itemId", requireVerified, deletePortfolioItem);
router.get("/:userId", getPublicProfile);

module.exports = router;
