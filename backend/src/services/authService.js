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

// --- Pure helpers ---

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

function maskEmail(email) {
  const [localPart = '', domain = ''] = String(email || '').split('@');
  const maskedLocal = localPart
    ? `${localPart.slice(0, 1)}***${localPart.slice(-1)}`
    : '***';

  return domain ? `${maskedLocal}@${domain}` : maskedLocal;
}

/** Tạo mã OTP 6 chữ số ngẫu nhiên */
function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// --- Factory ---

function createAuthService({
  userRepository,
  authTokenRepository,
  auditLogRepository,
  notificationRepository,
  emailService,
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

  if (!emailService) {
    emailService = require('./emailService');
  }

  // --- Internal helpers ---

  /** Ghi audit log, bỏ qua lỗi để không ảnh hưởng luồng chính */
  async function writeAudit(context, action, extra = {}) {
    if (!auditLogRepository || typeof auditLogRepository.create !== 'function') {
      return;
    }

    try {
      await auditLogRepository.create({
        userId: extra.userId ?? context?.userId ?? null,
        action,
        targetType: extra.targetType || 'USER',
        targetId: extra.targetId ?? null,
        metadata: extra.metadata || null,
        ipAddress: context?.ip || null,
        userAgent: context?.userAgent || null,
      });
    } catch (error) {
      console.error(`[auth audit] Failed to write ${action}:`, error.message);
    }
  }

  /** Tạo notification trong DB, bỏ qua lỗi */
  async function createNotification({ userId, recipientEmail, templateCode, safePayload }) {
    if (!notificationRepository || typeof notificationRepository.createNotification !== 'function') {
      return;
    }

    const insertedCount = await notificationRepository.createNotification({
      userId,
      recipientEmail,
      templateCode,
      sourceFeature: 'FE02',
      safePayload,
    });

    if (insertedCount === 0) {
      console.warn(`[auth notification] Template ${templateCode} was not found; notification was not queued.`);
    }
  }

  /** Gửi email qua emailService, bỏ qua lỗi để không làm gián đoạn luồng chính */
  async function sendEmail(emailFnName, params, label) {
    if (!emailService || typeof emailService[emailFnName] !== 'function') {
      return;
    }

    try {
      const result = await emailService[emailFnName](params);

      if (result && result.sent === false && result.reason === 'SMTP_NOT_CONFIGURED') {
        console.warn(`[auth email] SMTP not configured; ${label} email was not sent.`);
      } else if (result && result.sent === true) {
        console.info(`[auth email] ${label} email sent to ${maskEmail(params.to)} (${result.providerMessageId || 'no id'}).`);
      }
    } catch (emailError) {
      console.error(`[auth email] Failed to send ${label} email:`, emailError.message);
    }
  }

  /** Tạo OTP token mới (thu hồi token cũ cùng loại trước) */
  async function createOtpToken(userId, tokenType, ttlMinutes, ip = null) {
    const otp = generateOtp();
    const expiresAt = addMinutes(clock(), ttlMinutes);

    await authTokenRepository.revokeActiveTokensForUserType(userId, tokenType);
    await authTokenRepository.createToken({
      userId,
      tokenType,
      tokenHash: hashToken(otp),
      expiresAt,
      createdByIp: ip,
    });

    return { otp, expiresAt };
  }

  /** Xác thực OTP token, ném lỗi nếu không hợp lệ hoặc hết hạn */
  async function validateOtpToken(tokenType, otp, userId) {
    const tokenHash = hashToken(String(otp || '').trim());
    const tokenRecord = await authTokenRepository.findActiveTokenByHash(tokenType, tokenHash);

    if (!tokenRecord || tokenRecord.userId !== userId) {
      throw errors.badRequest('INVALID_OTP', 'Mã OTP không hợp lệ hoặc đã được sử dụng.');
    }

    if (new Date(tokenRecord.expiresAt).getTime() <= clock().getTime()) {
      throw errors.badRequest('EXPIRED_OTP', 'Mã OTP đã hết hiệu lực. Vui lòng yêu cầu mã mới.');
    }

    return tokenRecord;
  }

  async function validateLegacyToken(tokenTypes, token, { invalidCode, invalidMessage, expiredCode, expiredMessage }) {
    const tokenHash = hashToken(String(token || '').trim());

    for (const tokenType of tokenTypes) {
      const tokenRecord = await authTokenRepository.findActiveTokenByHash(tokenType, tokenHash);

      if (tokenRecord) {
        if (new Date(tokenRecord.expiresAt).getTime() <= clock().getTime()) {
          throw errors.badRequest(expiredCode, expiredMessage);
        }

        return tokenRecord;
      }
    }

    throw errors.badRequest(invalidCode, invalidMessage);
  }

  /** Load user và đảm bảo đang ACTIVE, ném lỗi nếu không */
  async function requireActiveUser(userId) {
    const user = await userRepository.findById(userId);

    if (!user || user.status !== 'ACTIVE') {
      throw errors.unauthorized('INVALID_TOKEN', 'Invalid or expired authentication token.');
    }

    return user;
  }

  /** Xác minh mật khẩu hiện tại, ghi audit và ném lỗi nếu sai */
  async function verifyCurrentPassword(user, password, context) {
    const valid = await verifyPassword(password || '', user.passwordHash);

    if (!valid) {
      await writeAudit(context, 'AUTH_PASSWORD_CHANGE_FAILURE', {
        userId: user.userId,
        targetId: user.userId,
      });
      throw errors.unauthorized('INVALID_CURRENT_PASSWORD', 'Mật khẩu hiện tại không đúng.');
    }
  }

  /** Kiểm tra policy mật khẩu, ném lỗi nếu không đạt */
  function validateNewPassword(password) {
    const check = validatePasswordPolicy(password);
    if (!check.valid) {
      throw errors.badRequest('WEAK_PASSWORD', 'Mật khẩu mới không đủ độ phức tạp.', check.errors);
    }
  }

  /** Cấp access token cho user dựa vào sessionId */
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

  /** Tạo refresh token ngẫu nhiên và lưu vào DB */
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

  /** Gửi email xác thực kèm OTP */
  async function sendVerificationMessage({ userId, recipientEmail, otp }) {
    try {
      await createNotification({
        userId,
        recipientEmail,
        templateCode: 'EMAIL_VERIFY',
        safePayload: { purpose: 'EMAIL_VERIFY' },
      });
    } catch (notifyError) {
      console.error('[auth notification] Failed to queue verification notification:', notifyError.message);
    }

    await sendEmail('sendVerificationOtpEmail', {
      to: recipientEmail,
      otp,
      expiresInMinutes: env.emailVerificationTtlHours * 60,
    }, 'verification');
  }

  // -------------------------------------------------------------------------
  // Public service methods
  // -------------------------------------------------------------------------

  async function register(input, context = {}) {
    const email = normalizeEmail(input.email);
    const username = normalizeUsername(input.username) || deriveUsername(email);
    const fullName = input.fullName ? String(input.fullName).trim() : null;
    const phoneNumber = input.phoneNumber ? String(input.phoneNumber).trim() : null;
    const { password, confirmPassword } = input;

    if (!email) {
      throw errors.badRequest('EMAIL_REQUIRED', 'Email is required.');
    }

    validateNewPassword(password);

    if (password !== confirmPassword) {
      throw errors.badRequest('PASSWORD_MISMATCH', 'Password confirmation must match password.');
    }

    const existingByEmail = await userRepository.findByEmail(email);
    if (existingByEmail) {
      throw errors.conflict('EMAIL_ALREADY_REGISTERED', 'Email is already registered. Please login or use forgot password.');
    }

    const existingByUsername = await userRepository.findByUsername(username);
    if (existingByUsername) {
      throw errors.conflict('USERNAME_ALREADY_REGISTERED', 'Username is already in use.');
    }

    const passwordHash = await hashPassword(password);
    const createdUser = await userRepository.createRegisteredUser({ username, email, passwordHash, phoneNumber, fullName });

    const expiresAt = addHours(clock(), env.emailVerificationTtlHours);
    const otp = generateOtp();
    await authTokenRepository.createToken({
      userId: createdUser.userId,
      tokenType: 'EMAIL_VERIFY',
      tokenHash: hashToken(otp),
      expiresAt,
      createdByIp: context.ip || null,
    });

    await sendVerificationMessage({ userId: createdUser.userId, recipientEmail: email, otp });

    await writeAudit(context, 'AUTH_REGISTER', {
      userId: createdUser.userId,
      targetId: createdUser.userId,
      metadata: { email },
    });

    const response = { userId: createdUser.userId, email, message: 'Verification email sent' };
    if (exposeDebugTokens) {
      response.debugOtp = otp;
      response.debugVerificationToken = otp;
    }

    return response;
  }

  async function verifyEmail(input, context = {}) {
    if (input.token) {
      const tokenRecord = await validateLegacyToken(['EMAIL_VERIFY'], input.token, {
        invalidCode: 'INVALID_VERIFICATION_TOKEN',
        invalidMessage: 'Invalid or expired verification token.',
        expiredCode: 'EXPIRED_VERIFICATION_TOKEN',
        expiredMessage: 'Verification link expired. Request a new one.',
      });

      const user = await userRepository.findById(tokenRecord.userId);
      if (!user) {
        throw errors.badRequest('INVALID_VERIFICATION_TOKEN', 'Invalid or expired verification token.');
      }

      await userRepository.markEmailVerified(tokenRecord.userId);
      await authTokenRepository.markTokenUsed(tokenRecord.tokenId);
      await writeAudit(context, 'AUTH_VERIFY_EMAIL', {
        userId: tokenRecord.userId,
        targetId: tokenRecord.userId,
      });

      return { message: 'Account verified. You can now login.' };
    }

    const email = normalizeEmail(input.email);
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw errors.badRequest('INVALID_VERIFICATION_TOKEN', 'Email hoặc mã OTP không hợp lệ.');
    }

    if (user.status === 'ACTIVE' && user.emailVerifiedAt) {
      return { message: 'Tài khoản đã được xác thực trước đó.' };
    }

    const tokenRecord = await validateOtpToken('EMAIL_VERIFY', input.otp, user.userId);

    await userRepository.markEmailVerified(tokenRecord.userId);
    await authTokenRepository.markTokenUsed(tokenRecord.tokenId);
    await writeAudit(context, 'AUTH_VERIFY_EMAIL', {
      userId: tokenRecord.userId,
      targetId: tokenRecord.userId,
    });

    return { message: 'Account verified. You can now login.' };
  }

  async function resendVerification(input, context = {}) {
    const email = normalizeEmail(input.email);
    const user = await userRepository.findByEmail(email);
    let otp = null;

    if (user && user.status !== 'ACTIVE') {
      const result = await createOtpToken(user.userId, 'EMAIL_VERIFY', env.emailVerificationTtlHours * 60, context.ip);
      otp = result.otp;
      await sendVerificationMessage({ userId: user.userId, recipientEmail: user.email, otp });
    }

    await writeAudit(context, 'AUTH_RESEND_VERIFICATION', {
      userId: user?.userId || null,
      targetId: user?.userId || null,
      metadata: { email },
    });

    const response = { message: 'Verification email sent' };
    if (exposeDebugTokens && otp) {
      response.debugOtp = otp;
      response.debugVerificationToken = otp;
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

    const isLockedByTime = user.lockedUntil && new Date(user.lockedUntil).getTime() > clock().getTime();
    if (isLockedByTime || user.status === 'LOCKED') {
      await writeAudit(context, 'AUTH_LOGIN_LOCKED', { userId: user.userId, targetId: user.userId });
      throw errors.tooManyRequests('ACCOUNT_LOCKED', 'Account is locked due to too many failed attempts. Please reset your password or contact support.');
    }

    if (user.status !== 'ACTIVE') {
      await writeAudit(context, 'AUTH_LOGIN_INACTIVE', { userId: user.userId, targetId: user.userId });
      throw errors.forbidden('ACCOUNT_INACTIVE', 'Account is not active.');
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      const failedCount = (user.failedLoginCount || 0) + 1;
      const shouldLock = failedCount >= env.maxFailedLoginAttempts;
      const lockedUntil = shouldLock ? addMinutes(clock(), env.lockoutMinutes) : null;
      await userRepository.updateFailedLogin(user.userId, failedCount, lockedUntil);
      await writeAudit(context, 'AUTH_LOGIN_FAILURE', { userId: user.userId, targetId: user.userId });
      throw errors.unauthorized('INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    await userRepository.resetFailedLoginsAndSetLastLogin(user.userId);
    const storedRefreshToken = await createStoredToken(user.userId, 'REFRESH', addDays(clock(), env.refreshTokenTtlDays), context);
    const { roles, accessToken, expiresIn } = await issueAccessTokenForUser(user, storedRefreshToken.record.tokenId);

    await writeAudit(context, 'AUTH_LOGIN_SUCCESS', { userId: user.userId, targetId: user.userId });

    return {
      userId: user.userId,
      email: user.email,
      roles,
      accessToken,
      refreshToken: storedRefreshToken.token,
      expiresIn,
    };
  }

  async function refreshToken(input, context = {}) {
    const tokenHash = hashToken(String(input.refreshToken || '').trim());
    const tokenRecord = await authTokenRepository.findActiveTokenByHash('REFRESH', tokenHash);

    if (!tokenRecord || new Date(tokenRecord.expiresAt).getTime() <= clock().getTime()) {
      throw errors.unauthorized('INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token.');
    }

    const user = await userRepository.findById(tokenRecord.userId);
    if (!user || user.status !== 'ACTIVE') {
      throw errors.unauthorized('INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token.');
    }

    const { accessToken, expiresIn } = await issueAccessTokenForUser(user, tokenRecord.tokenId);
    await writeAudit(context, 'AUTH_REFRESH_TOKEN', { userId: user.userId, targetId: user.userId });

    return { accessToken, expiresIn };
  }

  async function logout(input, context = {}) {
    const refreshTokenHash = hashToken(String(input.refreshToken || '').trim());
    const tokenRecord = await authTokenRepository.findActiveTokenByHash('REFRESH', refreshTokenHash);

    if (tokenRecord) {
      const revoke = typeof authTokenRepository.revokeToken === 'function'
        ? authTokenRepository.revokeToken
        : authTokenRepository.markTokenUsed;
      await revoke(tokenRecord.tokenId);
    }

    await writeAudit(context, 'AUTH_LOGOUT', {
      userId: context.userId || tokenRecord?.userId || null,
      targetId: context.userId || tokenRecord?.userId || null,
    });

    return { message: 'Logged out' };
  }

  async function changePassword(input, context = {}) {
    const user = await requireActiveUser(context.userId);
    await verifyCurrentPassword(user, input.currentPassword, context);
    validateNewPassword(input.newPassword);

    await userRepository.updatePassword(user.userId, await hashPassword(input.newPassword));
    await writeAudit(context, 'AUTH_PASSWORD_CHANGE_SUCCESS', { userId: user.userId, targetId: user.userId });

    return { message: 'Password changed' };
  }

  async function requestChangePasswordOtp(input, context = {}) {
    const user = await requireActiveUser(context.userId);
    await verifyCurrentPassword(user, input.currentPassword, context);
    validateNewPassword(input.newPassword);

    const { otp } = await createOtpToken(user.userId, 'CHANGE_PASSWORD_OTP', env.changePasswordOtpTtlMinutes, context.ip);

    await sendEmail('sendChangePasswordOtpEmail', {
      to: user.email,
      otp,
      expiresInMinutes: env.changePasswordOtpTtlMinutes,
    }, 'change-password OTP');

    await writeAudit(context, 'AUTH_CHANGE_PASSWORD_OTP_REQUESTED', { userId: user.userId, targetId: user.userId });

    const response = { message: 'OTP đã được gửi đến email của bạn.', maskedEmail: maskEmail(user.email) };
    if (exposeDebugTokens) response.debugOtp = otp;

    return response;
  }

  async function confirmChangePassword(input, context = {}) {
    const user = await requireActiveUser(context.userId);
    const tokenRecord = await validateOtpToken('CHANGE_PASSWORD_OTP', input.otp, user.userId);
    validateNewPassword(input.newPassword);

    await userRepository.updatePassword(user.userId, await hashPassword(input.newPassword));
    await authTokenRepository.markTokenUsed(tokenRecord.tokenId);
    await writeAudit(context, 'AUTH_PASSWORD_CHANGE_SUCCESS', { userId: user.userId, targetId: user.userId });

    return { message: 'Đổi mật khẩu thành công.' };
  }

  async function forgotPassword(input, context = {}) {
    const email = normalizeEmail(input.email);
    const user = await userRepository.findByEmail(email);
    let otp = null;

    if (user && user.status === 'ACTIVE' && user.emailVerifiedAt) {
      const result = await createOtpToken(user.userId, 'PASSWORD_RESET', env.passwordResetTtlMinutes, context.ip);
      otp = result.otp;

      try {
        await createNotification({
          userId: user.userId,
          recipientEmail: user.email,
          templateCode: 'PASSWORD_RESET',
          safePayload: { purpose: 'PASSWORD_RESET' },
        });
      } catch (notifyError) {
        console.error('[auth notification] Failed to queue password reset notification:', notifyError.message);
      }

      await sendEmail('sendPasswordResetOtpEmail', {
        to: user.email,
        otp,
        expiresInMinutes: env.passwordResetTtlMinutes,
      }, 'password reset OTP');
    }

    await writeAudit(context, 'AUTH_PASSWORD_RESET_REQUEST', {
      userId: user?.userId || null,
      targetId: user?.userId || null,
      metadata: { email },
    });

    const response = { message: 'Password reset email sent' };
    if (exposeDebugTokens && otp) {
      response.debugOtp = otp;
      response.debugResetToken = otp;
    }

    return response;
  }

  async function resetPassword(input, context = {}) {
    validateNewPassword(input.newPassword);

    if (input.token) {
      const tokenRecord = await validateLegacyToken(['PASSWORD_RESET', 'ACCOUNT_SETUP'], input.token, {
        invalidCode: 'INVALID_RESET_TOKEN',
        invalidMessage: 'Invalid or expired reset token.',
        expiredCode: 'EXPIRED_RESET_TOKEN',
        expiredMessage: 'Password reset link expired. Request a new one.',
      });
      const user = await userRepository.findById(tokenRecord.userId);

      if (!user || (tokenRecord.tokenType !== 'ACCOUNT_SETUP' && user.status !== 'ACTIVE')) {
        throw errors.badRequest('INVALID_RESET_TOKEN', 'Invalid or expired reset token.');
      }

      const passwordHash = await hashPassword(input.newPassword);
      if (
        tokenRecord.tokenType === 'ACCOUNT_SETUP' &&
        typeof userRepository.updatePasswordAndActivate === 'function'
      ) {
        await userRepository.updatePasswordAndActivate(user.userId, passwordHash);
      } else {
        await userRepository.updatePassword(user.userId, passwordHash);
      }

      await authTokenRepository.markTokenUsed(tokenRecord.tokenId);
      await writeAudit(context, 'AUTH_PASSWORD_RESET_SUCCESS', { userId: user.userId, targetId: user.userId });

      return { message: 'Password reset successful' };
    }

    const email = normalizeEmail(input.email);
    const user = await userRepository.findByEmail(email);

    if (!user || user.status !== 'ACTIVE') {
      throw errors.badRequest('INVALID_RESET_TOKEN', 'Email hoặc mã OTP không hợp lệ.');
    }

    const tokenRecord = await validateOtpToken('PASSWORD_RESET', input.otp, user.userId);

    await userRepository.updatePassword(user.userId, await hashPassword(input.newPassword));
    await authTokenRepository.markTokenUsed(tokenRecord.tokenId);
    await writeAudit(context, 'AUTH_PASSWORD_RESET_SUCCESS', { userId: user.userId, targetId: user.userId });

    return { message: 'Password reset successful' };
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
    requestChangePasswordOtp,
    confirmChangePassword,
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
