const express = require("express");
const router = express.Router();
const { getStats, getUsers, changeRole, toggleSuspend, getAuditLog } = require("../controllers/admin.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { requireAdmin } = require("../middleware/requireAdmin");

// All admin routes require auth + admin role
router.use(authenticate, requireAdmin);

router.get("/stats", getStats);
router.get("/users", getUsers);
router.patch("/users/:id/role", changeRole);
router.patch("/users/:id/suspend", toggleSuspend);
router.get("/audit", getAuditLog);

module.exports = router;
