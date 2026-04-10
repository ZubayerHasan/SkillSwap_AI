const express = require("express");
const router = express.Router();
const { getWallet, getTransactions, exportTransactions } = require("../controllers/wallet.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { requireVerified } = require("../middleware/verified.middleware");

router.use(authenticate, requireVerified);
router.get("/me", getWallet);
router.get("/transactions", getTransactions);
router.get("/transactions/export", exportTransactions);

module.exports = router;
