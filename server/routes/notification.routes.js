const express = require("express");
const router = express.Router();
const { getNotifications, markAllRead, markOneRead } = require("../controllers/notification.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.use(authenticate);
router.get("/", getNotifications);
router.put("/read-all", markAllRead);
router.put("/:id/read", markOneRead);

module.exports = router;
