const express = require("express");
const router = express.Router();
const { createRequest, getIncomingRequests, getOutgoingRequests, acceptRequest, declineRequest, counterRequest, getMyExchanges } = require("../controllers/exchange.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { requireVerified } = require("../middleware/verified.middleware");
const { validate } = require("../middleware/validate.middleware");
const { exchangeRequestSchema } = require("../validators/skill.validator");

router.use(authenticate, requireVerified);
router.post("/request", validate(exchangeRequestSchema), createRequest);
router.get("/requests/incoming", getIncomingRequests);
router.get("/requests/outgoing", getOutgoingRequests);
router.put("/requests/:id/accept", acceptRequest);
router.put("/requests/:id/decline", declineRequest);
router.put("/requests/:id/counter", counterRequest);
router.get("/", getMyExchanges);

module.exports = router;
