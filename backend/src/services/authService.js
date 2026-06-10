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

    const verificationToken = generateRandomToken();
    await authTokenRepository.createToken({
      userId: createdUser.userId,
      tokenType: 'EMAIL_VERIFY',
      tokenHash: hashToken(verificationToken),
      expiresAt: addHours(clock(), env.emailVerificationTtlHours),
      createdByIp: context.ip || null,
    });

    if (notificationRepository.createNotification) {
      await notificationRepository.createNotification({
        userId: createdUser.userId,
        recipientEmail: email,
        templateCode: 'ACCOUNT_VERIFICATION',
        sourceFeature: 'FE02',
        safePayload: { purpose: 'EMAIL_VERIFY' },
      });
    }

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
    const tokenHash = hashToken(token);
    const tokenRecord = await authTokenRepository.findActiveTokenByHash('EMAIL_VERIFY', tokenHash);

    if (!tokenRecord) {
      throw errors.badRequest(
        'INVALID_VERIFICATION_TOKEN',
        'This verification link is no longer valid. Request a new one.'
      );
    }

    if (new Date(tokenRecord.expiresAt).getTime() <= clock().getTime()) {
      throw errors.badRequest(
        'EXPIRED_VERIFICATION_TOKEN',
        'This verification link is no longer valid. Request a new one.'
      );
    }

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
    const roles = await userRepository.getRolesByUserId(user.userId);
    const accessToken = signAccessToken({
      userId: user.userId,
      email: user.email,
      username: user.username,
      roles,
    });
    const refreshToken = generateRandomToken();

    await authTokenRepository.createToken({
      userId: user.userId,
      tokenType: 'REFRESH',
      tokenHash: hashToken(refreshToken),
      expiresAt: addDays(clock(), env.refreshTokenTtlDays),
      createdByIp: context.ip || null,
    });

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
      expiresIn: env.accessTokenTtlSeconds,
    };
  }

  async function me(userId) {
    const user = await userRepository.getSafeUserById(userId);

    if (!user) {
      throw errors.unauthorized('INVALID_TOKEN', 'Invalid or expired authentication token.');
    }

    return user;
  }

  async function authenticateToken(token) {
    const payload = verifyAccessToken(token);
    const userId = Number(payload.sub);
    const user = await userRepository.getSafeUserById(userId);

    if (!user) {
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
    login,
    me,
    authenticateToken,
  };
}

const defaultAuthService = createAuthService();

module.exports = {
  createAuthService,
  defaultAuthService,
};
