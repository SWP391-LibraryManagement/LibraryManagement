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

async function sendVerificationOtpEmail({ to, otp, expiresInMinutes }) {
  const safeOtp = escapeHtml(otp);
  const safeMinutes = escapeHtml(expiresInMinutes);

  return sendMail({
    to,
    subject: 'Mã OTP xác thực tài khoản - Hệ thống Thư viện',
    text: [
      'Mã OTP xác thực tài khoản của bạn là:',
      otp,
      '',
      `Mã này có hiệu lực trong ${expiresInMinutes} phút.`,
      'Nếu bạn không đăng ký tài khoản, hãy bỏ qua email này.',
    ].join('\n'),
    html: `
      <p style="margin:0 0 8px;">Mã OTP xác thực tài khoản của bạn là:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:6px;color:#8B6B4A;margin:12px 0;">${safeOtp}</p>
      <p style="color:#6b6375;font-size:13px;margin:0 0 8px;">Mã này có hiệu lực trong <strong>${safeMinutes} phút</strong>.</p>
      <p style="color:#6b6375;font-size:13px;margin:0;">Nếu bạn không đăng ký tài khoản, hãy bỏ qua email này.</p>
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

async function sendPasswordResetOtpEmail({ to, otp, expiresInMinutes }) {
  const safeOtp = escapeHtml(otp);
  const safeMinutes = escapeHtml(expiresInMinutes);

  return sendMail({
    to,
    subject: 'Mã OTP khôi phục mật khẩu - Hệ thống Thư viện',
    text: [
      'Mã OTP để khôi phục mật khẩu của bạn là:',
      otp,
      '',
      `Mã này có hiệu lực trong ${expiresInMinutes} phút.`,
      'Nếu bạn không yêu cầu khôi phục mật khẩu, hãy bỏ qua email này.',
    ].join('\n'),
    html: `
      <p style="margin:0 0 8px;">Mã OTP để khôi phục mật khẩu của bạn là:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:6px;color:#8B6B4A;margin:12px 0;">${safeOtp}</p>
      <p style="color:#6b6375;font-size:13px;margin:0 0 8px;">Mã này có hiệu lực trong <strong>${safeMinutes} phút</strong>.</p>
      <p style="color:#6b6375;font-size:13px;margin:0;">Nếu bạn không yêu cầu khôi phục mật khẩu, hãy bỏ qua email này.</p>
    `,
  });
}

function resetEmailServiceForTests() {
  transporter = undefined;
}

async function sendChangePasswordOtpEmail({ to, otp, expiresInMinutes }) {
  const safeOtp = escapeHtml(otp);
  const safeMinutes = escapeHtml(expiresInMinutes);

  return sendMail({
    to,
    subject: 'Mã OTP đổi mật khẩu - Hệ thống Thư viện',
    text: [
      'Mã OTP xác nhận đổi mật khẩu của bạn là:',
      otp,
      '',
      `Mã này có hiệu lực trong ${expiresInMinutes} phút.`,
      'Nếu bạn không yêu cầu đổi mật khẩu, hãy bỏ qua email này.',
    ].join('\n'),
    html: `
      <p style="margin:0 0 8px;">Mã OTP xác nhận đổi mật khẩu của bạn là:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:6px;color:#1B3A6B;margin:12px 0;">${safeOtp}</p>
      <p style="color:#6b6375;font-size:13px;margin:0 0 8px;">Mã này có hiệu lực trong <strong>${safeMinutes} phút</strong>.</p>
      <p style="color:#6b6375;font-size:13px;margin:0;">Nếu bạn không yêu cầu đổi mật khẩu, hãy bỏ qua email này.</p>
    `,
  });
}

module.exports = {
  isSmtpConfigured,
  sendVerificationOtpEmail,
  sendPasswordResetEmail,
  sendPasswordResetOtpEmail,
  sendChangePasswordOtpEmail,
  resetEmailServiceForTests,
};
