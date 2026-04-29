/**
 * makeAdmin.js — Promote a user to admin role
 *
 * Usage:
 *   node scripts/makeAdmin.js --email="mdxubayerhasan@gmail.com"
 *
 * Run from the server/ directory:
 *   cd f:\SkillSwap_AI\server
 *   node scripts/makeAdmin.js --email="mdxubayerhasan@gmail.com"
 */

require("dotenv").config(); // loads server/.env automatically
const mongoose = require("mongoose");
const User = require("../models/User.model");

// ── Parse --email= argument ───────────────────────────────────────────────────
const arg = process.argv.find((a) => a.startsWith("--email="));
if (!arg) {
  console.error("❌  Usage: node scripts/makeAdmin.js --email=\"user@example.com\"");
  process.exit(1);
}
const email = arg.split("=")[1].replace(/^["']|["']$/g, "").trim().toLowerCase();
if (!email) {
  console.error("❌  Email cannot be empty.");
  process.exit(1);
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  try {
    console.log(`\n🔗  Connecting to MongoDB…`);
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      tls: true,
      tlsAllowInvalidCertificates: false,
    });
    console.log("✅  Connected to MongoDB Atlas — database: SkillSwap_AI\n");

    const user = await User.findOne({ email });
    if (!user) {
      console.error(`❌  No user found with email: ${email}`);
      process.exit(1);
    }

    const previousRole = user.role;
    if (previousRole === "admin") {
      console.log(`ℹ️   ${user.name} <${email}> is already an admin. Nothing changed.`);
      process.exit(0);
    }

    user.role = "admin";
    await user.save();

    console.log("✅  SUCCESS!");
    console.log(`    Name  : ${user.name}`);
    console.log(`    Email : ${user.email}`);
    console.log(`    Role  : ${previousRole} → admin`);
    console.log(`    ID    : ${user._id}\n`);
  } catch (err) {
    console.error("❌  Error:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌  Disconnected from MongoDB.");
  }
})();
