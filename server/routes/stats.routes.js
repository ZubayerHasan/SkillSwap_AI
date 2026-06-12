const express = require("express");
const router = express.Router();
const { getPublicStats } = require("../controllers/stats.controller");

// Public — no auth required
router.get("/", getPublicStats);

module.exports = router;
