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

function positiveIntegerFromEnv(name, defaultValue) {
  const value = numberFromEnv(name, defaultValue);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Invalid positive integer environment value for ${name}`);
  }

  return value;
}

function emailVerificationTtlMinutesFromEnv() {
  const minuteValue = process.env.EMAIL_VERIFICATION_TTL_MINUTES;

  if (minuteValue !== undefined && minuteValue !== '') {
    return positiveIntegerFromEnv('EMAIL_VERIFICATION_TTL_MINUTES', 15);
  }

  const legacyHourValue = process.env.EMAIL_VERIFICATION_TTL_HOURS;

  if (legacyHourValue !== undefined && legacyHourValue !== '') {
    const legacyMinutes = numberFromEnv('EMAIL_VERIFICATION_TTL_HOURS', 0.25) * 60;

    if (!Number.isInteger(legacyMinutes) || legacyMinutes <= 0) {
      throw new Error(
        'Invalid positive integer minute conversion for EMAIL_VERIFICATION_TTL_HOURS'
      );
    }

    return legacyMinutes;
  }

  return 15;
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
  emailVerificationTtlMinutes: emailVerificationTtlMinutesFromEnv(),
  passwordResetTtlMinutes: numberFromEnv('PASSWORD_RESET_TTL_MINUTES', 15),
  changePasswordOtpTtlMinutes: numberFromEnv('CHANGE_PASSWORD_OTP_TTL_MINUTES', 10),
  maxFailedLoginAttempts: numberFromEnv('MAX_FAILED_LOGIN_ATTEMPTS', 5),
  lockoutMinutes: numberFromEnv('LOGIN_LOCKOUT_MINUTES', 30),
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: numberFromEnv('SMTP_PORT', 587),
  smtpSecure: booleanFromEnv('SMTP_SECURE', false),
  smtpUser: process.env.SMTP_USER || '',
  smtpPassword: process.env.SMTP_PASSWORD || '',
  mailFrom: process.env.MAIL_FROM || '',
  frontendBaseUrl: process.env.FRONTEND_BASE_URL || 'http://localhost:5173',
  requiredEnv,
};
