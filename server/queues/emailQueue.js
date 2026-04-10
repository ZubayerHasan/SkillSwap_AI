const Bull = require("bull");
const env = require("../config/env");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../services/email.service");

const emailQueue = new Bull("email-queue", env.REDIS_URL);

emailQueue.process("verification", async (job) => {
  const { to, name, token } = job.data;
  await sendVerificationEmail(to, name, token);
});

emailQueue.process("password-reset", async (job) => {
  const { to, name, token } = job.data;
  await sendPasswordResetEmail(to, name, token);
});

emailQueue.on("completed", (job) => {
  console.log(`✅ Email job ${job.id} (${job.name}) completed`);
});

emailQueue.on("failed", (job, err) => {
  console.error(`❌ Email job ${job.id} failed: ${err.message}`);
});

module.exports = emailQueue;
