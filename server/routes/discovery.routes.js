const express = require("express");
const router = express.Router();
const { discoverSkills, getSmartMatches } = require("../controllers/discovery.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.get("/skills", authenticate, discoverSkills);
router.get("/matches", authenticate, getSmartMatches);

module.exports = router;