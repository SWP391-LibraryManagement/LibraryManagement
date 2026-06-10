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
  requiredEnv,
};
