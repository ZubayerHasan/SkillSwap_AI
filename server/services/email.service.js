const mailer = require("../config/mailer");
const env = require("../config/env");

const sendVerificationEmail = async (to, name, token) => {
  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;
  const mailOptions = {
    from: `"SkillSwap AI" <${env.EMAIL_FROM}>`,
    to,
    subject: "Verify your SkillSwap AI account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0d0f14; color: #e8eaf0; padding: 40px; border-radius: 12px;">
        <h1 style="color: #6c8eff; margin-bottom: 8px;">SkillSwap AI</h1>
        <h2 style="color: #e8eaf0;">Welcome, ${name}! 🎉</h2>
        <p style="color: #9197a8;">Please verify your email address to get started. Your verification link expires in 24 hours.</p>
        <a href="${verifyUrl}" style="display: inline-block; background: #6c8eff; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0;">Verify Email Address</a>
        <p style="color: #5c6275; font-size: 12px; margin-top: 32px;">If you did not create this account, please ignore this email.</p>
        <p style="color: #5c6275; font-size: 12px;">Or copy this link: <a href="${verifyUrl}" style="color: #6c8eff;">${verifyUrl}</a></p>
      </div>
    `,
  };
  if (env.NODE_ENV === "development") {
    console.log(`📧 [DEV] Verification email to ${to}: ${verifyUrl}`);
  }
  await mailer.sendMail(mailOptions);
};

const sendPasswordResetEmail = async (to, name, token) => {
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;
  const mailOptions = {
    from: `"SkillSwap AI" <${env.EMAIL_FROM}>`,
    to,
    subject: "Reset your SkillSwap AI password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0d0f14; color: #e8eaf0; padding: 40px; border-radius: 12px;">
        <h1 style="color: #6c8eff;">SkillSwap AI</h1>
        <h2>Password Reset Request</h2>
        <p style="color: #9197a8;">Hi ${name}, we received a request to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display: inline-block; background: #ff4d6d; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0;">Reset Password</a>
        <p style="color: #5c6275; font-size: 12px; margin-top: 32px;">If you did not request this, ignore this email — your password will not change.</p>
      </div>
    `,
  };
  if (env.NODE_ENV === "development") {
    console.log(`📧 [DEV] Password reset email to ${to}: ${resetUrl}`);
  }
  await mailer.sendMail(mailOptions);
};

const sendNotificationDigestEmail = async (to, name, notifications) => {
  const items = notifications
    .map((n) => `<li style="margin: 8px 0; color: #9197a8;">${n.payload?.message || n.type}</li>`)
    .join("");
  const mailOptions = {
    from: `"SkillSwap AI" <${env.EMAIL_FROM}>`,
    to,
    subject: "You have unread notifications on SkillSwap AI",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0d0f14; color: #e8eaf0; padding: 40px; border-radius: 12px;">
        <h1 style="color: #6c8eff;">SkillSwap AI</h1>
        <h2>You have unread notifications, ${name}</h2>
        <ul>${items}</ul>
        <a href="${env.CLIENT_URL}/notifications" style="display: inline-block; background: #6c8eff; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin: 20px 0;">View Notifications</a>
      </div>
    `,
  };
  await mailer.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendNotificationDigestEmail };
