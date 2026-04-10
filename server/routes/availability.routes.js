const express = require("express");
const router = express.Router();
const { updateAvailability, getMyAvailability } = require("../controllers/availability.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { requireVerified } = require("../middleware/verified.middleware");
const { validate } = require("../middleware/validate.middleware");
const { availabilitySchema } = require("../validators/skill.validator");

router.use(authenticate, requireVerified);
router.put("/", validate(availabilitySchema), updateAvailability);
router.get("/me", getMyAvailability);

module.exports = router;
