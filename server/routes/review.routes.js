const express = require("express");
const { authenticate } = require("../middleware/auth.middleware");
const { createReview, getUserReviews } = require("../controllers/review.controller");

const router = express.Router();

router.post("/", authenticate, createReview);
router.get("/:userId", getUserReviews);

module.exports = router;