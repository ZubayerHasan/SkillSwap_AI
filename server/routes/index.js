const express = require("express");
const router = express.Router();

router.use("/auth", require("./auth.routes"));
router.use("/profile", require("./profile.routes"));
router.use("/skills", require("./skill.routes"));
router.use("/availability", require("./availability.routes"));
router.use("/discovery", require("./discovery.routes"));
router.use("/wallet", require("./wallet.routes"));
router.use("/notifications", require("./notification.routes"));
router.use("/exchanges", require("./exchange.routes"));
router.use("/reviews", require("./review.routes"));
router.use("/chat", require("./chat.routes"));
router.use("/admin", require("./admin.routes"));

module.exports = router;
