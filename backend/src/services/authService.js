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
const {
  validatePasswordPolicy,
  hashPassword,
  verifyPassword,
} = require('../utils/passwordPolicy');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeUsername(username) {
  return String(username || '').trim();
}

function deriveUsername(email) {
  const base = normalizeEmail(email)
    .split('@')[0]
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 20) || 'user';

  const suffix = crypto.randomBytes(2).toString('hex');
  return `${base}_${suffix}`;
}

function createAuthService({
  userRepository,
  authTokenRepository,
  auditLogRepository,
  notificationRepository,
  clock = () => new Date(),
  exposeDebugTokens = process.env.AUTH_EXPOSE_TEST_TOKENS === 'true' || process.env.NODE_ENV === 'test',
} = {}) {
  if (!userRepository) {
    userRepository = require('../repositories/userRepository');
  }

  if (!authTokenRepository) {
    authTokenRepository = require('../repositories/authTokenRepository');
  }

  if (!auditLogRepository) {
    auditLogRepository = require('../repositories/auditLogRepository');
  }

  if (!notificationRepository) {
    notificationRepository = require('../repositories/notificationRepository');
  }

  async function writeAudit(context, action, extra = {}) {
    if (!auditLogRepository || typeof auditLogRepository.create !== 'function') {
      return;
    }

    await auditLogRepository.create({
      userId: extra.userId ?? context?.userId ?? null,
      action,
      targetType: extra.targetType || 'USER',
      targetId: extra.targetId ?? null,
      metadata: extra.metadata || null,
      ipAddress: context?.ip || null,
      userAgent: context?.userAgent || null,
    });
  }

  async function createStoredToken(userId, tokenType, expiresAt, context = {}) {
    const token = generateRandomToken();

    const record = await authTokenRepository.createToken({
      userId,
      tokenType,
      tokenHash: hashToken(token),
      expiresAt,
      createdByIp: context.ip || null,
    });

    return { token, record };
  }

  async function createNotification({ userId, recipientEmail, templateCode, safePayload }) {
    if (!notificationRepository || typeof notificationRepository.createNotification !== 'function') {
      return;
    }

    await notificationRepository.createNotification({
      userId,
      recipientEmail,
      templateCode,
      sourceFeature: 'FE02',
      safePayload,
    });
  }

  async function issueAccessTokenForUser(user, sessionId) {
    const roles = await userRepository.getRolesByUserId(user.userId);
    const accessToken = signAccessToken({
      userId: user.userId,
      email: user.email,
      username: user.username,
      roles,
      sessionId,
    });

    return {
      roles,
      accessToken,
      expiresIn: env.accessTokenTtlSeconds,
    };
  }

  async function findUsableToken(tokenType, token, invalidCode, expiredCode, invalidMessage) {
    const tokenHash = hashToken(String(token || '').trim());
    const tokenRecord = await authTokenRepository.findActiveTokenByHash(tokenType, tokenHash);

    if (!tokenRecord) {
      throw errors.badRequest(invalidCode, invalidMessage);
    }

    if (new Date(tokenRecord.expiresAt).getTime() <= clock().getTime()) {
      throw errors.badRequest(expiredCode, invalidMessage);
    }

    return tokenRecord;
  }

  async function register(input, context = {}) {
    const email = normalizeEmail(input.email);
    const username = normalizeUsername(input.username) || deriveUsername(email);
    const fullName = input.fullName ? String(input.fullName).trim() : null;
    const phoneNumber = input.phoneNumber ? String(input.phoneNumber).trim() : null;
    const password = input.password;
    const confirmPassword = input.confirmPassword;

    if (!email) {
      throw errors.badRequest('EMAIL_REQUIRED', 'Email is required.');
    }

    const passwordCheck = validatePasswordPolicy(password);
    if (!passwordCheck.valid) {
      throw errors.badRequest('WEAK_PASSWORD', 'Password does not meet complexity requirements.', passwordCheck.errors);
    }

    if (password !== confirmPassword) {
      throw errors.badRequest('PASSWORD_MISMATCH', 'Password confirmation must match password.');
    }

    const existingByEmail = await userRepository.findByEmail(email);
    if (existingByEmail) {
      throw errors.conflict(
        'EMAIL_ALREADY_REGISTERED',
        'Email is already registered. Please login or use forgot password.'
      );
    }

    const existingByUsername = await userRepository.findByUsername(username);
    if (existingByUsername) {
      throw errors.conflict('USERNAME_ALREADY_REGISTERED', 'Username is already in use.');
    }

    const passwordHash = await hashPassword(password);
    const createdUser = await userRepository.createRegisteredUser({
      username,
      email,
      passwordHash,
      phoneNumber,
      fullName,
    });

    const { token: verificationToken } = await createStoredToken(
      createdUser.userId,
      'EMAIL_VERIFY',
      addHours(clock(), env.emailVerificationTtlHours),
      context
    );

    await createNotification({
      userId: createdUser.userId,
      recipientEmail: email,
      templateCode: 'ACCOUNT_VERIFICATION',
      safePayload: { purpose: 'EMAIL_VERIFY' },
    });

    await writeAudit(context, 'AUTH_REGISTER', {
      userId: createdUser.userId,
      targetId: createdUser.userId,
      metadata: { email },
    });

    const response = {
      userId: createdUser.userId,
      email,
      message: 'Verification email sent',
    };

    if (exposeDebugTokens) {
      response.debugVerificationToken = verificationToken;
    }

    return response;
  }

  async function verifyEmail(input, context = {}) {
    const token = String(input.token || '').trim();
    const tokenRecord = await findUsableToken(
      'EMAIL_VERIFY',
      token,
      'INVALID_VERIFICATION_TOKEN',
      'EXPIRED_VERIFICATION_TOKEN',
      'This verification link is no longer valid. Request a new one.'
    );

    await userRepository.markEmailVerified(tokenRecord.userId);
    await authTokenRepository.markTokenUsed(tokenRecord.tokenId);
    await writeAudit(context, 'AUTH_VERIFY_EMAIL', {
      userId: tokenRecord.userId,
      targetId: tokenRecord.userId,
    });

    return {
      message: 'Account verified. You can now login.',
    };
  }

  async function resendVerification(input, context = {}) {
    const email = normalizeEmail(input.email);
    const user = await userRepository.findByEmail(email);
    let verificationToken = null;

    if (user && user.status !== 'ACTIVE') {
      await authTokenRepository.revokeActiveTokensForUserType(user.userId, 'EMAIL_VERIFY');
      const storedVerification = await createStoredToken(
        user.userId,
        'EMAIL_VERIFY',
        addHours(clock(), env.emailVerificationTtlHours),
        context
      );
      verificationToken = storedVerification.token;

      await createNotification({
        userId: user.userId,
        recipientEmail: user.email,
        templateCode: 'ACCOUNT_VERIFICATION',
        safePayload: { purpose: 'EMAIL_VERIFY' },
      });
    }

    await writeAudit(context, 'AUTH_RESEND_VERIFICATION', {
      userId: user?.userId || null,
      targetId: user?.userId || null,
      metadata: { email },
    });

    const response = {
      message: 'Verification email sent',
    };

    if (exposeDebugTokens && verificationToken) {
      response.debugVerificationToken = verificationToken;
    }

    return response;
  }

  async function login(input, context = {}) {
    const identifier = normalizeEmail(input.email || input.identifier || input.username);
    const password = input.password || '';
    const user = await userRepository.findByEmailOrUsername(identifier);

    await writeAudit(context, 'AUTH_LOGIN_ATTEMPT', {
      userId: user?.userId || null,
      targetId: user?.userId || null,
      metadata: { identifier },
    });

    if (!user) {
      throw errors.unauthorized('INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    if (user.lockedUntil && new Date(user.lockedUntil).getTime() > clock().getTime()) {
      await writeAudit(context, 'AUTH_LOGIN_LOCKED', {
        userId: user.userId,
        targetId: user.userId,
      });
      throw errors.tooManyRequests(
        'ACCOUNT_LOCKED',
        'Account is locked due to too many failed attempts. Please reset your password or contact support.'
      );
    }

    if (user.status !== 'ACTIVE') {
      await writeAudit(context, 'AUTH_LOGIN_INACTIVE', {
        userId: user.userId,
        targetId: user.userId,
      });
      throw errors.forbidden('ACCOUNT_INACTIVE', 'Account is not active.');
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      const failedCount = (user.failedLoginCount || 0) + 1;
      const shouldLock = failedCount >= env.maxFailedLoginAttempts;
      const lockedUntil = shouldLock ? addMinutes(clock(), env.lockoutMinutes) : null;
      await userRepository.updateFailedLogin(user.userId, failedCount, lockedUntil);
      await writeAudit(context, 'AUTH_LOGIN_FAILURE', {
        userId: user.userId,
        targetId: user.userId,
      });
      throw errors.unauthorized('INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    await userRepository.resetFailedLoginsAndSetLastLogin(user.userId);
    const storedRefreshToken = await createStoredToken(
      user.userId,
      'REFRESH',
      addDays(clock(), env.refreshTokenTtlDays),
      context
    );
    const { roles, accessToken, expiresIn } = await issueAccessTokenForUser(
      user,
      storedRefreshToken.record.tokenId
    );
    const refreshToken = storedRefreshToken.token;

    await writeAudit(context, 'AUTH_LOGIN_SUCCESS', {
      userId: user.userId,
      targetId: user.userId,
    });

    return {
      userId: user.userId,
      email: user.email,
      roles,
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  async function refreshToken(input, context = {}) {
    const tokenHash = hashToken(String(input.refreshToken || '').trim());
    const tokenRecord = await authTokenRepository.findActiveTokenByHash('REFRESH', tokenHash);

    if (!tokenRecord) {
      throw errors.unauthorized('INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token.');
    }

    if (new Date(tokenRecord.expiresAt).getTime() <= clock().getTime()) {
      throw errors.unauthorized('EXPIRED_REFRESH_TOKEN', 'Invalid or expired refresh token.');
    }

    const user = await userRepository.findById(tokenRecord.userId);

    if (!user || user.status !== 'ACTIVE') {
      throw errors.unauthorized('INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token.');
    }

    const { accessToken, expiresIn } = await issueAccessTokenForUser(user, tokenRecord.tokenId);

    await writeAudit(context, 'AUTH_REFRESH_TOKEN', {
      userId: user.userId,
      targetId: user.userId,
    });

    return {
      accessToken,
      expiresIn,
    };
  }

  async function logout(input, context = {}) {
    const refreshTokenHash = hashToken(String(input.refreshToken || '').trim());
    const tokenRecord = await authTokenRepository.findActiveTokenByHash('REFRESH', refreshTokenHash);

    if (tokenRecord) {
      if (typeof authTokenRepository.revokeToken === 'function') {
        await authTokenRepository.revokeToken(tokenRecord.tokenId);
      } else {
        await authTokenRepository.markTokenUsed(tokenRecord.tokenId);
      }
    }

    await writeAudit(context, 'AUTH_LOGOUT', {
      userId: context.userId || tokenRecord?.userId || null,
      targetId: context.userId || tokenRecord?.userId || null,
    });

    return {
      message: 'Logged out',
    };
  }

  async function changePassword(input, context = {}) {
    const user = await userRepository.findById(context.userId);

    if (!user || user.status !== 'ACTIVE') {
      throw errors.unauthorized('INVALID_TOKEN', 'Invalid or expired authentication token.');
    }

    const currentPasswordValid = await verifyPassword(input.currentPassword || '', user.passwordHash);

    if (!currentPasswordValid) {
      await writeAudit(context, 'AUTH_PASSWORD_CHANGE_FAILURE', {
        userId: user.userId,
        targetId: user.userId,
      });
      throw errors.unauthorized('INVALID_CURRENT_PASSWORD', 'Current password is incorrect.');
    }

    const passwordCheck = validatePasswordPolicy(input.newPassword);
    if (!passwordCheck.valid) {
      throw errors.badRequest('WEAK_PASSWORD', 'Password does not meet complexity requirements.', passwordCheck.errors);
    }

    await userRepository.updatePassword(user.userId, await hashPassword(input.newPassword));
    await writeAudit(context, 'AUTH_PASSWORD_CHANGE_SUCCESS', {
      userId: user.userId,
      targetId: user.userId,
    });

    return {
      message: 'Password changed',
    };
  }

  async function forgotPassword(input, context = {}) {
    const email = normalizeEmail(input.email);
    const user = await userRepository.findByEmail(email);
    let resetToken = null;

    if (user && user.status === 'ACTIVE' && user.emailVerifiedAt) {
      await authTokenRepository.revokeActiveTokensForUserType(user.userId, 'PASSWORD_RESET');
      const storedResetToken = await createStoredToken(
        user.userId,
        'PASSWORD_RESET',
        addMinutes(clock(), env.passwordResetTtlMinutes),
        context
      );
      resetToken = storedResetToken.token;

      await createNotification({
        userId: user.userId,
        recipientEmail: user.email,
        templateCode: 'PASSWORD_RESET',
        safePayload: { purpose: 'PASSWORD_RESET' },
      });
    }

    await writeAudit(context, 'AUTH_PASSWORD_RESET_REQUEST', {
      userId: user?.userId || null,
      targetId: user?.userId || null,
      metadata: { email },
    });

    const response = {
      message: 'Password reset email sent',
    };

    if (exposeDebugTokens && resetToken) {
      response.debugResetToken = resetToken;
    }

    return response;
  }

  async function findResetOrSetupToken(token) {
    const tokenHash = hashToken(String(token || '').trim());
    const tokenRecord =
      (await authTokenRepository.findActiveTokenByHash('PASSWORD_RESET', tokenHash)) ||
      (await authTokenRepository.findActiveTokenByHash('ACCOUNT_SETUP', tokenHash));

    if (!tokenRecord) {
      throw errors.badRequest('INVALID_RESET_TOKEN', 'This password reset link is no longer valid.');
    }

    if (new Date(tokenRecord.expiresAt).getTime() <= clock().getTime()) {
      throw errors.badRequest('EXPIRED_RESET_TOKEN', 'This password reset link is no longer valid.');
    }

    return tokenRecord;
  }

  async function resetPassword(input, context = {}) {
    const passwordCheck = validatePasswordPolicy(input.newPassword);
    if (!passwordCheck.valid) {
      throw errors.badRequest('WEAK_PASSWORD', 'Password does not meet complexity requirements.', passwordCheck.errors);
    }

    const tokenRecord = await findResetOrSetupToken(input.token);
    const user = await userRepository.findById(tokenRecord.userId);

    if (!user) {
      throw errors.badRequest('INVALID_RESET_TOKEN', 'This password reset link is no longer valid.');
    }

    const passwordHash = await hashPassword(input.newPassword);

    if (tokenRecord.tokenType === 'ACCOUNT_SETUP' && typeof userRepository.updatePasswordAndActivate === 'function') {
      await userRepository.updatePasswordAndActivate(user.userId, passwordHash);
    } else {
      await userRepository.updatePassword(user.userId, passwordHash);
    }

    await authTokenRepository.markTokenUsed(tokenRecord.tokenId);
    await writeAudit(context, 'AUTH_PASSWORD_RESET_SUCCESS', {
      userId: user.userId,
      targetId: user.userId,
      metadata: { tokenType: tokenRecord.tokenType },
    });

    return {
      message: 'Password reset successful',
    };
  }

  async function me(userId) {
    const user = await userRepository.getSafeUserById(userId);

    if (!user) {
      throw errors.unauthorized('INVALID_TOKEN', 'Invalid or expired authentication token.');
    }

    return {
      userId: user.userId,
      email: user.email,
      username: user.username,
      roles: user.roles || [],
      status: user.status,
    };
  }

  async function authenticateToken(token) {
    const payload = verifyAccessToken(token);
    const userId = Number(payload.sub);
    const user = await userRepository.getSafeUserById(userId);

    if (!user) {
      throw errors.unauthorized('INVALID_TOKEN', 'Invalid or expired authentication token.');
    }

    const sessionId = Number(payload.sid);

    if (!Number.isFinite(sessionId)) {
      throw errors.unauthorized('INVALID_TOKEN', 'Invalid or expired authentication token.');
    }

    const sessionRecord = await authTokenRepository.findActiveTokenById(sessionId, 'REFRESH');

    if (
      !sessionRecord ||
      sessionRecord.userId !== userId ||
      new Date(sessionRecord.expiresAt).getTime() <= clock().getTime()
    ) {
      throw errors.unauthorized('INVALID_TOKEN', 'Invalid or expired authentication token.');
    }

    return {
      userId,
      email: user.email,
      username: user.username,
      roles: user.roles || [],
    };
  }

  return {
    register,
    verifyEmail,
    resendVerification,
    login,
    refreshToken,
    logout,
    changePassword,
    forgotPassword,
    resetPassword,
    me,
    authenticateToken,
  };
}

const defaultAuthService = createAuthService();

module.exports = {
  createAuthService,
  defaultAuthService,
};
