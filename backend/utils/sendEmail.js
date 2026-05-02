// utils/sendEmail.js
// Nodemailer transporter using Gmail SMTP (free)

const nodemailer = require('nodemailer');

/**
 * sendEmail — wraps Nodemailer with the configured SMTP transport
 * @param {Object} options - { to, subject, html, text }
 */
const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // TLS (STARTTLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || '', // Fallback plain-text
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Email sent: ${info.messageId}`);
  return info;
};

module.exports = sendEmail;
