const Bull = require("bull");
const env = require("../config/env");
const Notification = require("../models/Notification.model");
const User = require("../models/User.model");
const { sendNotificationDigestEmail } = require("../services/email.service");

const notificationQueue = new Bull("notification-queue", env.REDIS_URL);

// Process: send email digest for notifications unread after 2h
notificationQueue.process("email-digest", async (job) => {
  const { userId, notificationIds } = job.data;
  const unreadNotifications = await Notification.find({
    _id: { $in: notificationIds },
    read: false,
  });
  if (unreadNotifications.length === 0) return; // already read

  const user = await User.findById(userId).select("name email contactPreference");
  if (!user || user.contactPreference === "in_app") return;

  await sendNotificationDigestEmail(user.email, user.name, unreadNotifications);

  await Notification.updateMany({ _id: { $in: notificationIds } }, { emailSentAt: new Date() });
});

notificationQueue.on("completed", (job) => {
  console.log(`✅ Notification queue job ${job.id} done`);
});

notificationQueue.on("failed", (job, err) => {
  console.error(`❌ Notification queue job ${job.id} failed: ${err.message}`);
});

module.exports = notificationQueue;
