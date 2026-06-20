const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter;

function isSmtpConfigured() {
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPassword && env.mailFrom);
}

function getTransporter() {
  if (!isSmtpConfigured()) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPassword,
      },
    });
  }

  return transporter;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function sendMail({ to, subject, text, html }) {
  const smtpTransporter = getTransporter();

  if (!smtpTransporter) {
    return { sent: false, reason: 'SMTP_NOT_CONFIGURED' };
  }

  const result = await smtpTransporter.sendMail({
    from: env.mailFrom,
    to,
    subject,
    text,
    html,
  });

  return {
    sent: true,
    providerMessageId: result.messageId || null,
  };
}

async function sendVerificationEmail({ to, token, expiresInHours }) {
  const safeToken = escapeHtml(token);
  const safeHours = escapeHtml(expiresInHours);

  return sendMail({
    to,
    subject: 'Library account verification',
    text: [
      'Your Library Management verification code is:',
      token,
      '',
      `This code expires in ${expiresInHours} hour(s).`,
      'If you did not create this account, you can ignore this email.',
    ].join('\n'),
    html: `
      <p>Your Library Management verification code is:</p>
      <p style="font-size:20px;font-weight:700;letter-spacing:1px;">${safeToken}</p>
      <p>This code expires in ${safeHours} hour(s).</p>
      <p>If you did not create this account, you can ignore this email.</p>
    `,
  });
}

async function sendPasswordResetEmail({ to, token, expiresInMinutes }) {
  const resetUrl = `${env.frontendBaseUrl.replace(/\/$/, '')}/forgot-password?token=${encodeURIComponent(token)}`;
  const safeResetUrl = escapeHtml(resetUrl);
  const safeMinutes = escapeHtml(expiresInMinutes);

  return sendMail({
    to,
    subject: 'Library password reset',
    text: [
      'Use this link to reset your Library Management password:',
      resetUrl,
      '',
      `This link expires in ${expiresInMinutes} minute(s).`,
      'If you did not request a password reset, you can ignore this email.',
    ].join('\n'),
    html: `
      <p>Use this link to reset your Library Management password:</p>
      <p><a href="${safeResetUrl}">${safeResetUrl}</a></p>
      <p>This link expires in ${safeMinutes} minute(s).</p>
      <p>If you did not request a password reset, you can ignore this email.</p>
    `,
  });
}

function resetEmailServiceForTests() {
  transporter = undefined;
}

module.exports = {
  isSmtpConfigured,
  sendVerificationEmail,
  sendPasswordResetEmail,
  resetEmailServiceForTests,
};
