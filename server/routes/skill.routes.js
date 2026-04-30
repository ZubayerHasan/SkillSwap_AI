const express = require("express");
const router = express.Router();
const {
  createOffer, getMyOffers, updateOffer, deleteOffer,
  createNeed, getMyNeeds, updateNeed, deleteNeed,
  getTaxonomy,
  createBroadcast, getBroadcasts, fulfillBroadcast, getMyBroadcasts,
} = require("../controllers/skill.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { requireVerified } = require("../middleware/verified.middleware");
const { validate } = require("../middleware/validate.middleware");
const { skillOfferSchema, skillNeedSchema } = require("../validators/skill.validator");

router.use(authenticate, requireVerified);

// Taxonomy (auth only)
router.get("/taxonomy", getTaxonomy);

// Offers
router.post("/offer", validate(skillOfferSchema), createOffer);
router.get("/offer/me", getMyOffers);
router.put("/offer/:id", updateOffer);
router.delete("/offer/:id", deleteOffer);

// Needs
router.post("/need", validate(skillNeedSchema), createNeed);
router.get("/need/me", getMyNeeds);
router.put("/need/:id", updateNeed);
router.delete("/need/:id", deleteNeed);

// Broadcasts (F10)
router.post("/broadcast", createBroadcast);
router.get("/broadcasts", getBroadcasts);
router.get("/broadcasts/mine", getMyBroadcasts);
router.patch("/broadcasts/:id/fulfill", fulfillBroadcast);

module.exports = router;
