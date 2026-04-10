const nodemailer = require("nodemailer");
const env = require("./env");

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: parseInt(env.SMTP_PORT),
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

transporter.verify((err, success) => {
  if (err) console.error("❌ Mailer verify error:", err.message);
  else console.log("✅ Mailer ready");
});

module.exports = transporter;
