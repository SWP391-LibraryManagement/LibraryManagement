function numberFromEnv(name, defaultValue) {
  const rawValue = process.env[name];

  if (rawValue === undefined || rawValue === '') {
    return defaultValue;
  }

  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric environment value for ${name}`);
  }

  return parsed;
}

function booleanFromEnv(name, defaultValue) {
  const rawValue = process.env[name];

  if (rawValue === undefined || rawValue === '') {
    return defaultValue;
  }

  return ['1', 'true', 'yes'].includes(String(rawValue).trim().toLowerCase());
}

function requiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

module.exports = {
  bcryptCost: numberFromEnv('BCRYPT_COST', 10),
  accessTokenTtlSeconds: numberFromEnv('ACCESS_TOKEN_TTL_SECONDS', 15 * 60),
  refreshTokenTtlDays: numberFromEnv('REFRESH_TOKEN_TTL_DAYS', 7),
  emailVerificationTtlHours: numberFromEnv('EMAIL_VERIFICATION_TTL_HOURS', 24),
  passwordResetTtlMinutes: numberFromEnv('PASSWORD_RESET_TTL_MINUTES', 15),
  maxFailedLoginAttempts: numberFromEnv('MAX_FAILED_LOGIN_ATTEMPTS', 5),
  lockoutMinutes: numberFromEnv('LOGIN_LOCKOUT_MINUTES', 15),
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: numberFromEnv('SMTP_PORT', 587),
  smtpSecure: booleanFromEnv('SMTP_SECURE', false),
  smtpUser: process.env.SMTP_USER || '',
  smtpPassword: process.env.SMTP_PASSWORD || '',
  mailFrom: process.env.MAIL_FROM || '',
  frontendBaseUrl: process.env.FRONTEND_BASE_URL || 'http://localhost:5173',
  requiredEnv,
};
