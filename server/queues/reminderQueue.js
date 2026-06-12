const Bull = require("bull");
const env = require("../config/env");
const Exchange = require("../models/Exchange.model");
const User = require("../models/User.model");
const SkillOffer = require("../models/SkillOffer.model");
const notificationService = require("../services/notification.service");
const { sendReminderEmail } = require("../services/email.service");

const reminderQueue = new Bull("reminder-queue", env.REDIS_URL, {
  prefix: `${env.NODE_ENV}:bull`,
});

// Process 24-hour reminder
reminderQueue.process("reminder-24h", async (job) => {
  const { exchangeId } = job.data;
  await sendReminder(exchangeId, "tomorrow");
});

// Process 1-hour reminder
reminderQueue.process("reminder-1h", async (job) => {
  const { exchangeId } = job.data;
  await sendReminder(exchangeId, "in 1 hour");
});

async function sendReminder(exchangeId, timeLabel) {
  const exchange = await Exchange.findById(exchangeId)
    .populate("requesterId", "name email")
    .populate("receiverId", "name email")
    .populate("offeredSkillId", "displayName")
    .populate("requestedSkillId", "displayName");

  if (!exchange) return;

  // Don't send reminders for exchanges that are no longer scheduled
  if (!["scheduled", "in_progress"].includes(exchange.status)) return;

  const requester = exchange.requesterId;
  const receiver = exchange.receiverId;
  const offeredSkill = exchange.offeredSkillId?.displayName || "a skill";
  const requestedSkill = exchange.requestedSkillId?.displayName || "a skill";
  const scheduledTime = exchange.scheduledTime.toLocaleString();

  // Notify requester
  await notificationService.send(requester._id, "exchange_request", {
    message: `Your exchange with ${receiver.name} is ${timeLabel}! ${offeredSkill} ↔ ${requestedSkill} at ${scheduledTime}.`,
    exchangeId: exchange._id,
  });

  // Notify receiver
  await notificationService.send(receiver._id, "exchange_request", {
    message: `Your exchange with ${requester.name} is ${timeLabel}! ${requestedSkill} ↔ ${offeredSkill} at ${scheduledTime}.`,
    exchangeId: exchange._id,
  });

  // Send emails (fail silently if email service not available)
  try {
    if (typeof sendReminderEmail === "function") {
      await sendReminderEmail(requester.email, requester.name, {
        partnerName: receiver.name,
        timeLabel,
        offeredSkill,
        requestedSkill,
        scheduledTime,
      });
      await sendReminderEmail(receiver.email, receiver.name, {
        partnerName: requester.name,
        timeLabel,
        offeredSkill: requestedSkill,
        requestedSkill: offeredSkill,
        scheduledTime,
      });
    }
  } catch (err) {
    console.error("Reminder email failed:", err.message);
  }
}

/**
 * Schedule reminders for a newly created/accepted exchange.
 * Returns the Bull job IDs so they can be cancelled if needed.
 */
const scheduleReminders = async (exchange) => {
  const scheduledMs = new Date(exchange.scheduledTime).getTime();
  const now = Date.now();
  const jobIds = [];

  // 24-hour reminder
  const delay24h = scheduledMs - 24 * 60 * 60 * 1000 - now;
  if (delay24h > 0) {
    const job24 = await reminderQueue.add(
      "reminder-24h",
      { exchangeId: exchange._id.toString() },
      { delay: delay24h, removeOnComplete: true }
    );
    jobIds.push(job24.id);
  }

  // 1-hour reminder
  const delay1h = scheduledMs - 60 * 60 * 1000 - now;
  if (delay1h > 0) {
    const job1h = await reminderQueue.add(
      "reminder-1h",
      { exchangeId: exchange._id.toString() },
      { delay: delay1h, removeOnComplete: true }
    );
    jobIds.push(job1h.id);
  }

  return jobIds;
};

/**
 * Cancel scheduled reminders by job IDs
 */
const cancelReminders = async (jobIds = []) => {
  for (const jobId of jobIds) {
    try {
      const job = await reminderQueue.getJob(jobId);
      if (job) await job.remove();
    } catch (err) {
      console.error(`Failed to cancel reminder job ${jobId}:`, err.message);
    }
  }
};

reminderQueue.on("completed", (job) => {
  console.log(`✅ Reminder job ${job.id} (${job.name}) completed`);
});

reminderQueue.on("failed", (job, err) => {
  console.error(`❌ Reminder job ${job.id} failed: ${err.message}`);
});

module.exports = { reminderQueue, scheduleReminders, cancelReminders };
