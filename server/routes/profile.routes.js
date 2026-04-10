const express = require("express");
const router = express.Router();
const { getMyProfile, updateProfile, uploadAvatar, getPublicProfile } = require("../controllers/profile.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { requireVerified } = require("../middleware/verified.middleware");
const { validate } = require("../middleware/validate.middleware");
const { uploadAvatar: upload } = require("../middleware/upload.middleware");
const { updateProfileSchema } = require("../validators/profile.validator");

router.use(authenticate);
router.get("/me", getMyProfile);
router.put("/me", requireVerified, validate(updateProfileSchema), updateProfile);
router.post("/avatar", requireVerified, upload.single("avatar"), uploadAvatar);
router.get("/:userId", getPublicProfile);

module.exports = router;
