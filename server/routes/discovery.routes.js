const express = require("express");
const router = express.Router();
const { discoverSkills } = require("../controllers/discovery.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.get("/skills", authenticate, discoverSkills);

module.exports = router;
