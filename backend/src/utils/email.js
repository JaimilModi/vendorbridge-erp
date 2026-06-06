const nodemailer = require('nodemailer');
const env = require('../config/env');

const createTransporter = () => {
  // If user provided custom SMTP configuration in .env, use that.
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT || 587,
      secure: env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  // Fallback to Gmail if they provide just EMAIL and PASSWORD (common hackathon setup)
  if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });
  }

  console.warn('⚠️ WARNING: No SMTP/Gmail credentials found in .env. Emails will only be logged to console!');
  return null;
};

const transporter = createTransporter();

const sendEmail = async ({ to, subject, text, html }) => {
  if (!transporter) {
    console.log(`\n📧 [SIMULATED EMAIL TO: ${to}]`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${text}\n`);
    return;
  }

  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.GMAIL_USER || '"VendorBridge ERP" <noreply@vendorbridge.com>',
      to,
      subject,
      text,
      html: html || text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent successfully to ${to} (MessageId: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    throw new Error('Failed to send email. Please check server configuration.');
  }
};

module.exports = { sendEmail };
