const crypto = require('crypto');
const env = require('../config/env');
const errors = require('../utils/safeErrors');
const {
  addHours,
  addMinutes,
  addDays,
  generateRandomToken,
  hashToken,
  signAccessToken,
  verifyAccessToken,
} = require('../utils/tokenUtils');
const { validatePasswordPolicy, hashPassword, verifyPassword } = require('../utils/passwordPolicy');
const { defaultEmailService } = require('./emailService');

function normalizeInput(input = {}) {
  const email = String(input.email || '').trim().toLowerCase();
  const username = String(input.username || '').trim() || deriveUsername(email);
  return { ...input, email, username };
}

function deriveUsername(email) {
  const base = email.split('@')[0].replace(/[^a-z0-9._-]/g, '').slice(0, 20) || 'user';
  return `${base}_${crypto.randomBytes(2).toString('hex')}`;
}

function assertPasswordPolicy(password) {
  const check = validatePasswordPolicy(password);

  if (!check.valid) {
    throw errors.badRequest('WEAK_PASSWORD', 'Password does not meet the password policy.', check.errors);
  }
}

function assertRegistrationPassword(input) {
  if (input.password !== input.confirmPassword) {
    throw errors.badRequest('PASSWORD_MISMATCH', 'Passwords must match.');
  }

  assertPasswordPolicy(input.password);
}

function isExpired(date, clock) {
  return new Date(date) <= clock();
}

function safeContext(context = {}) {
  if (typeof context === 'string') {
    return { ip: context };
  }

  return context || {};
}

function createAuthService(deps = {}) {
  const userRepo = deps.userRepository || require('../repositories/userRepository');
  const tokenRepo = deps.authTokenRepository || require('../repositories/authTokenRepository');
  const auditRepo = deps.auditLogRepository || require('../repositories/auditLogRepository');
  const notifyRepo = deps.notificationRepository || require('../repositories/notificationRepository');
  const emailSvc = deps.emailService || defaultEmailService;
  const clock = deps.clock || (() => new Date());
  const exposeTokens = process.env.AUTH_EXPOSE_TEST_TOKENS === 'true';

  async function writeAuditSafe(context, action, extra = {}) {
    try {
      if (!auditRepo?.create) {
        return;
      }

      await auditRepo.create({
        userId: extra.userId ?? context?.userId ?? null,
        action,
        targetType: extra.targetType || 'USER',
        targetId: extra.targetId ?? null,
        metadata: extra.metadata || null,
        ipAddress: context?.ip || null,
        userAgent: context?.userAgent || null,
      });
    } catch (error) {
      console.error(`[Audit Error] ${action}:`, error.message);
    }
  }

  async function createStoredToken(userId, tokenType, expiresAt, context, rawToken = null) {
    const token = rawToken || generateRandomToken();
    const record = await tokenRepo.createToken({
      userId,
      tokenType,
      tokenHash: hashToken(token),
      expiresAt,
      createdByIp: context?.ip || null,
    });

    return { token, record };
  }

  async function queueNotification({ userId, recipientEmail, templateCode, safePayload }) {
    try {
      if (!notifyRepo?.createNotification) {
        return;
      }

      await notifyRepo.createNotification({
        userId,
        recipientEmail,
        templateCode,
        sourceFeature: 'FE02',
        safePayload,
      });
    } catch (error) {
      console.error('[Notify Error]:', error.message);
    }
  }

  async function sendVerificationEmail({ recipientEmail, token, fullName }) {
    if (emailSvc?.sendVerificationOtpEmail) {
      return emailSvc.sendVerificationOtpEmail({
        recipientEmail,
        otp: token,
        expiresInHours: env.emailVerificationTtlHours,
        fullName,
      });
    }

    if (emailSvc?.sendVerificationOTP) {
      return emailSvc.sendVerificationOTP(recipientEmail, token);
    }

    return null;
  }

  async function sendPasswordResetEmail({ recipientEmail, token }) {
    if (emailSvc?.sendPasswordResetOtpEmail) {
      return emailSvc.sendPasswordResetOtpEmail({
        recipientEmail,
        otp: token,
        expiresInMinutes: env.passwordResetTtlMinutes,
      });
    }

    if (emailSvc?.sendPasswordResetOTP) {
      return emailSvc.sendPasswordResetOTP(recipientEmail, token);
    }

    return null;
  }

  async function dispatchVerification(user, context) {
    const expiresAt = addHours(clock(), env.emailVerificationTtlHours);
    const { token } = await createStoredToken(user.userId, 'EMAIL_VERIFY', expiresAt, context);

    await queueNotification({
      userId: user.userId,
      recipientEmail: user.email,
      templateCode: 'ACCOUNT_VERIFICATION',
      safePayload: { purpose: 'EMAIL_VERIFY', otp: token, expiresInHours: env.emailVerificationTtlHours },
    });

    let emailSent = true;
    try {
      await sendVerificationEmail({ recipientEmail: user.email, token, fullName: user.fullName });
    } catch (error) {
      emailSent = false;
    }

    return { token, emailSent };
  }

  async function checkUserUniqueness(email, username) {
    if (await userRepo.findByEmail(email)) {
      throw errors.conflict('EMAIL_REGISTERED', 'Email already registered.');
    }

    if (await userRepo.findByUsername(username)) {
      throw errors.conflict('USERNAME_REGISTERED', 'Username is already in use.');
    }
  }

  async function handleLoginFailure(user, context) {
    const failedCount = (user.failedLoginCount || 0) + 1;
    const lockedUntil = failedCount >= env.maxFailedLoginAttempts ? addMinutes(clock(), env.lockoutMinutes) : null;

    await userRepo.updateFailedLogin(user.userId, failedCount, lockedUntil);
    await writeAuditSafe(context, 'AUTH_LOGIN_FAILURE', {
      userId: user.userId,
      targetId: user.userId,
      metadata: { locked: Boolean(lockedUntil) },
    });

    throw errors.unauthorized('INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  async function handleLoginSuccess(user, context) {
    await userRepo.resetFailedLoginsAndSetLastLogin(user.userId);

    const expiresAt = addDays(clock(), env.refreshTokenTtlDays);
    const refresh = await createStoredToken(user.userId, 'REFRESH', expiresAt, context);
    const roles = await userRepo.getRolesByUserId(user.userId);
    const accessToken = signAccessToken({
      userId: user.userId,
      email: user.email,
      username: user.username,
      roles,
      sessionId: refresh.record.tokenId,
    });

    await writeAuditSafe(context, 'AUTH_LOGIN_SUCCESS', { userId: user.userId, targetId: user.userId });

    return {
      userId: user.userId,
      email: user.email,
      roles,
      accessToken,
      refreshToken: refresh.token,
      expiresIn: env.accessTokenTtlSeconds,
    };
  }

  async function consumeToken(tokenType, rawToken, errorPrefix) {
    const record = await tokenRepo.findActiveTokenByHash(tokenType, hashToken(rawToken || ''));

    if (!record) {
      throw errors.badRequest(`INVALID_${errorPrefix}_TOKEN`, 'This token is no longer valid.');
    }

    if (isExpired(record.expiresAt, clock)) {
      await tokenRepo.markTokenUsed(record.tokenId);
      throw errors.badRequest(`EXPIRED_${errorPrefix}_TOKEN`, 'This token has expired.');
    }

    return record;
  }

  async function register(input, contextInput = {}) {
    const context = safeContext(contextInput);
    const data = normalizeInput(input);

    if (!data.email) {
      throw errors.badRequest('EMAIL_REQUIRED', 'Email is required.');
    }

    assertRegistrationPassword(data);
    await checkUserUniqueness(data.email, data.username);

    const passwordHash = await hashPassword(data.password);
    const user = await userRepo.createRegisteredUser({
      username: data.username,
      email: data.email,
      passwordHash,
      phoneNumber: data.phoneNumber,
      fullName: data.fullName,
    });

    const { token, emailSent } = await dispatchVerification({ ...user, fullName: data.fullName }, context);
    await writeAuditSafe(context, 'AUTH_REGISTER', {
      userId: user.userId,
      targetId: user.userId,
      metadata: { email: data.email, emailSent },
    });

    const response = {
      userId: user.userId,
      email: data.email,
      emailSent,
      message: 'Verification email sent',
    };

    if (exposeTokens) {
      response.debugVerificationToken = token;
    }

    return response;
  }

  async function verifyEmail(token, contextInput = {}) {
    const context = safeContext(contextInput);
    const record = await consumeToken('EMAIL_VERIFY', token, 'VERIFICATION');

    await userRepo.markEmailVerified(record.userId);
    await tokenRepo.markTokenUsed(record.tokenId);
    await writeAuditSafe(context, 'AUTH_EMAIL_VERIFIED', { userId: record.userId, targetId: record.userId });

    return record.userId;
  }

  async function resendVerification(email, contextInput = {}) {
    const context = safeContext(contextInput);
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const user = await userRepo.findByEmail(normalizedEmail);
    const response = { message: 'Verification email sent' };

    if (!user || user.status === 'ACTIVE') {
      return response;
    }

    await tokenRepo.revokeActiveTokensForUserType(user.userId, 'EMAIL_VERIFY');
    const { token } = await dispatchVerification(user, context);
    await writeAuditSafe(context, 'AUTH_VERIFICATION_RESENT', { userId: user.userId, targetId: user.userId });

    if (exposeTokens) {
      response.debugVerificationToken = token;
    }

    return response;
  }

  async function login(input, contextInput = {}) {
    const context = safeContext(contextInput);
    const identifier = String(input.email || input.identifier || input.username || '').trim().toLowerCase();

    await writeAuditSafe(context, 'AUTH_LOGIN_ATTEMPT', { metadata: { identifier } });

    const user = await userRepo.findByEmailOrUsername(identifier);
    if (!user) {
      throw errors.unauthorized('INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    if (user.lockedUntil && new Date(user.lockedUntil) > clock()) {
      throw errors.tooManyRequests(
        'ACCOUNT_LOCKED',
        'Account is locked due to too many failed attempts. Please try again later.'
      );
    }

    if (user.status !== 'ACTIVE') {
      throw errors.forbidden('ACCOUNT_INACTIVE', 'Please verify your email address before logging in.');
    }

    const isValid = await verifyPassword(input.password || '', user.passwordHash);
    if (!isValid) {
      return handleLoginFailure(user, context);
    }

    return handleLoginSuccess(user, context);
  }

  async function refreshToken(rawToken, contextInput = {}) {
    const context = safeContext(contextInput);
    const record = await tokenRepo.findActiveTokenByHash('REFRESH', hashToken(rawToken || ''));

    if (!record || isExpired(record.expiresAt, clock)) {
      throw errors.unauthorized('INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token.');
    }

    const user = await userRepo.findById(record.userId);
    if (!user || user.status !== 'ACTIVE') {
      throw errors.unauthorized('INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token.');
    }

    const roles = await userRepo.getRolesByUserId(user.userId);
    const accessToken = signAccessToken({
      userId: user.userId,
      email: user.email,
      username: user.username,
      roles,
      sessionId: record.tokenId,
    });

    await writeAuditSafe(context, 'AUTH_REFRESH_TOKEN', { userId: user.userId, targetId: user.userId });

    return { accessToken, expiresIn: env.accessTokenTtlSeconds };
  }

  async function logout(userId, refreshToken, contextInput = {}, sessionId = null) {
    const context = safeContext(contextInput);

    if (refreshToken) {
      const record = await tokenRepo.findActiveTokenByHash('REFRESH', hashToken(refreshToken));

      if (record && (!userId || Number(record.userId) === Number(userId))) {
        await tokenRepo.revokeToken(record.tokenId);
      }
    } else if (sessionId) {
      const record = await tokenRepo.findActiveTokenById(Number(sessionId), 'REFRESH');

      if (record && (!userId || Number(record.userId) === Number(userId))) {
        await tokenRepo.revokeToken(record.tokenId);
      }
    }

    await writeAuditSafe(context, 'AUTH_LOGOUT', { userId: userId || null, targetId: userId || null });
  }

  async function authenticateToken(accessToken) {
    const payload = verifyAccessToken(accessToken);
    const userId = Number(payload.sub);

    if (payload.sid) {
      const session = await tokenRepo.findActiveTokenById(Number(payload.sid), 'REFRESH');
      if (!session || Number(session.userId) !== userId || isExpired(session.expiresAt, clock)) {
        throw errors.unauthorized('INVALID_TOKEN', 'Invalid or expired authentication token.');
      }
    }

    const user = await userRepo.getSafeUserById(userId);
    if (!user || user.status !== 'ACTIVE') {
      throw errors.unauthorized('INVALID_TOKEN', 'Invalid or expired authentication token.');
    }

    user.sessionId = payload.sid ? Number(payload.sid) : null;
    return user;
  }

  async function me(userId) {
    const user = await userRepo.getSafeUserById(userId);

    if (!user) {
      throw errors.unauthorized('INVALID_TOKEN', 'Invalid or expired authentication token.');
    }

    return user;
  }

  async function changePassword(userId, input, contextInput = {}) {
    const context = safeContext(contextInput);
    const user = await userRepo.findById(userId);

    if (!user) {
      throw errors.unauthorized('INVALID_TOKEN', 'Invalid or expired authentication token.');
    }

    const currentPasswordValid = await verifyPassword(input.currentPassword || '', user.passwordHash);
    if (!currentPasswordValid) {
      await writeAuditSafe(context, 'AUTH_PASSWORD_CHANGE_FAILURE', { userId, targetId: userId });
      throw errors.unauthorized('INVALID_CURRENT_PASSWORD', 'Current password verification failed.');
    }

    if (await verifyPassword(input.newPassword || '', user.passwordHash)) {
      throw errors.badRequest('PASSWORD_REUSE', 'New password must be different from current password.');
    }

    assertPasswordPolicy(input.newPassword);

    await userRepo.updatePassword(userId, await hashPassword(input.newPassword));
    await writeAuditSafe(context, 'AUTH_PASSWORD_CHANGED', { userId, targetId: userId });
  }

  async function forgotPassword(email, contextInput = {}) {
    const context = safeContext(contextInput);
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const response = { message: 'Password reset email sent' };
    const user = await userRepo.findByEmail(normalizedEmail);

    if (!user || user.status === 'DELETED') {
      await writeAuditSafe(context, 'AUTH_PASSWORD_RESET_REQUEST', { metadata: { emailFound: false } });
      return response;
    }

    await tokenRepo.revokeActiveTokensForUserType(user.userId, 'PASSWORD_RESET');
    const { token } = await createStoredToken(
      user.userId,
      'PASSWORD_RESET',
      addMinutes(clock(), env.passwordResetTtlMinutes),
      context
    );

    await queueNotification({
      userId: user.userId,
      recipientEmail: user.email,
      templateCode: 'PASSWORD_RESET',
      safePayload: { purpose: 'PASSWORD_RESET', token, expiresInMinutes: env.passwordResetTtlMinutes },
    });

    try {
      await sendPasswordResetEmail({ recipientEmail: user.email, token });
    } catch (error) {
      // The reset request remains intentionally generic to prevent user enumeration.
    }

    await writeAuditSafe(context, 'AUTH_PASSWORD_RESET_REQUEST', { userId: user.userId, targetId: user.userId });

    if (exposeTokens) {
      response.debugResetToken = token;
    }

    return response;
  }

  async function resetPassword(input, contextInput = {}) {
    const context = safeContext(contextInput);
    const rawToken = input.token;
    let record = await tokenRepo.findActiveTokenByHash('PASSWORD_RESET', hashToken(rawToken || ''));
    let tokenPurpose = 'PASSWORD_RESET';

    if (!record) {
      record = await tokenRepo.findActiveTokenByHash('ACCOUNT_SETUP', hashToken(rawToken || ''));
      tokenPurpose = 'ACCOUNT_SETUP';
    }

    if (!record) {
      throw errors.badRequest('INVALID_RESET_TOKEN', 'This reset link is no longer valid. Request a new one.');
    }

    if (isExpired(record.expiresAt, clock)) {
      await tokenRepo.markTokenUsed(record.tokenId);
      throw errors.badRequest('EXPIRED_RESET_TOKEN', 'This reset link is no longer valid. Request a new one.');
    }

    assertPasswordPolicy(input.newPassword);

    const passwordHash = await hashPassword(input.newPassword);
    if (tokenPurpose === 'ACCOUNT_SETUP') {
      await userRepo.updatePasswordAndActivate(record.userId, passwordHash);
    } else {
      await userRepo.updatePassword(record.userId, passwordHash);
    }

    await tokenRepo.markTokenUsed(record.tokenId);
    await writeAuditSafe(context, 'AUTH_PASSWORD_RESET_COMPLETED', {
      userId: record.userId,
      targetId: record.userId,
      metadata: { tokenPurpose },
    });

    return { userId: record.userId, message: 'Password reset successful' };
  }

  return {
    register,
    verifyEmail,
    resendVerification,
    login,
    refreshToken,
    logout,
    authenticateToken,
    me,
    changePassword,
    forgotPassword,
    resetPassword,
  };
}

const defaultAuthService = createAuthService();

module.exports = {
  createAuthService,
  defaultAuthService,
};
