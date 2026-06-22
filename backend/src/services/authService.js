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

function maskEmail(email) {
  const [localPart = '', domain = ''] = String(email || '').split('@');
  const maskedLocal = localPart
    ? `${localPart.slice(0, 1)}***${localPart.slice(-1)}`
    : '***';

  return domain ? `${maskedLocal}@${domain}` : maskedLocal;
}

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

    if (!emailService || typeof emailService.sendVerificationOtpEmail !== 'function') {
      return;
    }

    try {
      const result = await emailService.sendVerificationOtpEmail({
        to: recipientEmail,
        otp,
        expiresInMinutes: env.emailVerificationTtlHours * 60,
      });

      if (result && result.sent === false && result.reason === 'SMTP_NOT_CONFIGURED') {
        console.warn('[auth email] SMTP is not configured; verification email was not sent.');
      } else if (result && result.sent === true) {
        console.info(
          `[auth email] Verification email sent to ${maskEmail(recipientEmail)} (${result.providerMessageId || 'no provider id'}).`
        );
      }
    } catch (emailError) {
      console.error('[auth email] Failed to send verification email:', emailError.message);
    }
  }

  async function sendPasswordResetMessage({ userId, recipientEmail, token }) {
    try {
      await createNotification({
        userId,
        recipientEmail,
        templateCode: 'PASSWORD_RESET',
        safePayload: { purpose: 'PASSWORD_RESET' },
      });
    } catch (notifyError) {
      console.error('[auth notification] Failed to queue password reset notification:', notifyError.message);
    }

    if (!emailService || typeof emailService.sendPasswordResetEmail !== 'function') {
      return;
    }

    try {
      const result = await emailService.sendPasswordResetEmail({
        to: recipientEmail,
        token,
        expiresInMinutes: env.passwordResetTtlMinutes,
      });

      if (result && result.sent === false && result.reason === 'SMTP_NOT_CONFIGURED') {
        console.warn('[auth email] SMTP is not configured; password reset email was not sent.');
      } else if (result && result.sent === true) {
        console.info(
          `[auth email] Password reset email sent to ${maskEmail(recipientEmail)} (${result.providerMessageId || 'no provider id'}).`
        );
      }
    } catch (emailError) {
      console.error('[auth email] Failed to send password reset email:', emailError.message);
    }
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

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = addHours(clock(), env.emailVerificationTtlHours);
    
    await authTokenRepository.createToken({
      userId: createdUser.userId,
      tokenType: 'EMAIL_VERIFY',
      tokenHash: hashToken(otp),
      expiresAt,
      createdByIp: context.ip || null,
    });

    await sendVerificationMessage({
      userId: createdUser.userId,
      recipientEmail: email,
      otp,
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
      response.debugOtp = otp;
    }

    return response;
  }

  async function verifyEmail(input, context = {}) {
    const email = normalizeEmail(input.email);
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw errors.badRequest('INVALID_VERIFICATION_TOKEN', 'Email hoặc mã OTP không hợp lệ.');
    }

    if (user.status === 'ACTIVE' && user.emailVerifiedAt) {
      return { message: 'Tài khoản đã được xác thực trước đó.' };
    }

    const otp = String(input.otp || '').trim();
    const tokenHash = hashToken(otp);
    
    const tokenRecord = await authTokenRepository.findActiveTokenByHash('EMAIL_VERIFY', tokenHash);

    if (!tokenRecord || tokenRecord.userId !== user.userId) {
      throw errors.badRequest('INVALID_VERIFICATION_TOKEN', 'Mã OTP không hợp lệ hoặc đã hết hạn.');
    }

    if (new Date(tokenRecord.expiresAt).getTime() <= clock().getTime()) {
      throw errors.badRequest('EXPIRED_VERIFICATION_TOKEN', 'Mã OTP đã hết hiệu lực. Vui lòng yêu cầu mã mới.');
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

  async function resendVerification(input, context = {}) {
    const email = normalizeEmail(input.email);
    const user = await userRepository.findByEmail(email);
    let otp = null;

    if (user && user.status !== 'ACTIVE') {
      await authTokenRepository.revokeActiveTokensForUserType(user.userId, 'EMAIL_VERIFY');
      
      otp = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = addHours(clock(), env.emailVerificationTtlHours);
      
      await authTokenRepository.createToken({
        userId: user.userId,
        tokenType: 'EMAIL_VERIFY',
        tokenHash: hashToken(otp),
        expiresAt,
        createdByIp: context.ip || null,
      });

      await sendVerificationMessage({
        userId: user.userId,
        recipientEmail: user.email,
        otp,
      });
    }

    await writeAudit(context, 'AUTH_RESEND_VERIFICATION', {
      userId: user?.userId || null,
      targetId: user?.userId || null,
      metadata: { email },
    });

    const response = {
      message: 'If the email is valid and unverified, a new verification link was sent.',
    };

    if (exposeDebugTokens && otp) {
      response.debugOtp = otp;
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

    const lockedUntilTime = user.lockedUntil ? new Date(user.lockedUntil).getTime() : null;
    if (lockedUntilTime && lockedUntilTime > clock().getTime()) {
      await writeAudit(context, 'AUTH_LOGIN_LOCKED', {
        userId: user.userId,
        targetId: user.userId,
      });
      throw errors.tooManyRequests(
        'ACCOUNT_LOCKED',
        'Account is locked due to too many failed attempts. Please reset your password or contact support.'
      );
    }

    if (user.status === 'LOCKED') {
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

  async function requestChangePasswordOtp(input, context = {}) {
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
      throw errors.unauthorized('INVALID_CURRENT_PASSWORD', 'Mật khẩu hiện tại không đúng.');
    }

    const passwordCheck = validatePasswordPolicy(input.newPassword);
    if (!passwordCheck.valid) {
      throw errors.badRequest('WEAK_PASSWORD', 'Mật khẩu mới không đủ độ phức tạp.', passwordCheck.errors);
    }

    // Tạo OTP 6 chữ số
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // Thu hồi OTP cũ chưa dùng (nếu có)
    await authTokenRepository.revokeActiveTokensForUserType(user.userId, 'CHANGE_PASSWORD_OTP');

    // Lưu hash của OTP vào DB
    const expiresAt = addMinutes(clock(), env.changePasswordOtpTtlMinutes);
    await authTokenRepository.createToken({
      userId: user.userId,
      tokenType: 'CHANGE_PASSWORD_OTP',
      tokenHash: hashToken(otp),
      expiresAt,
      createdByIp: context.ip || null,
    });

    // Gửi email OTP
    if (emailService && typeof emailService.sendChangePasswordOtpEmail === 'function') {
      try {
        const result = await emailService.sendChangePasswordOtpEmail({
          to: user.email,
          otp,
          expiresInMinutes: env.changePasswordOtpTtlMinutes,
        });
        if (result && result.sent === false && result.reason === 'SMTP_NOT_CONFIGURED') {
          console.warn('[auth email] SMTP is not configured; change-password OTP email was not sent.');
        } else if (result && result.sent === true) {
          console.info(`[auth email] Change-password OTP sent to ${maskEmail(user.email)}.`);
        }
      } catch (emailError) {
        console.error('[auth email] Failed to send change-password OTP email:', emailError.message);
      }
    }

    await writeAudit(context, 'AUTH_CHANGE_PASSWORD_OTP_REQUESTED', {
      userId: user.userId,
      targetId: user.userId,
    });

    const response = {
      message: 'OTP đã được gửi đến email của bạn.',
      maskedEmail: maskEmail(user.email),
    };

    if (exposeDebugTokens) {
      response.debugOtp = otp;
    }

    return response;
  }

  async function confirmChangePassword(input, context = {}) {
    const user = await userRepository.findById(context.userId);

    if (!user || user.status !== 'ACTIVE') {
      throw errors.unauthorized('INVALID_TOKEN', 'Invalid or expired authentication token.');
    }

    const otp = String(input.otp || '').trim();
    const tokenHash = hashToken(otp);
    const tokenRecord = await authTokenRepository.findActiveTokenByHash('CHANGE_PASSWORD_OTP', tokenHash);

    if (!tokenRecord || tokenRecord.userId !== user.userId) {
      throw errors.badRequest('INVALID_OTP', 'Mã OTP không hợp lệ hoặc đã được sử dụng.');
    }

    if (new Date(tokenRecord.expiresAt).getTime() <= clock().getTime()) {
      throw errors.badRequest('EXPIRED_OTP', 'Mã OTP đã hết hiệu lực. Vui lòng yêu cầu mã mới.');
    }

    const passwordCheck = validatePasswordPolicy(input.newPassword);
    if (!passwordCheck.valid) {
      throw errors.badRequest('WEAK_PASSWORD', 'Mật khẩu mới không đủ độ phức tạp.', passwordCheck.errors);
    }

    await userRepository.updatePassword(user.userId, await hashPassword(input.newPassword));
    await authTokenRepository.markTokenUsed(tokenRecord.tokenId);

    await writeAudit(context, 'AUTH_PASSWORD_CHANGE_SUCCESS', {
      userId: user.userId,
      targetId: user.userId,
    });

    return {
      message: 'Đổi mật khẩu thành công.',
    };
  }

  async function forgotPassword(input, context = {}) {
    const email = normalizeEmail(input.email);
    const user = await userRepository.findByEmail(email);
    let resetToken = null;
    let otp = null;

    if (user && user.status === 'ACTIVE' && user.emailVerifiedAt) {
      // Thu hồi các token reset trước đó
      await authTokenRepository.revokeActiveTokensForUserType(user.userId, 'PASSWORD_RESET');
      
      // Tạo OTP 6 số
      otp = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = addMinutes(clock(), env.passwordResetTtlMinutes);
      
      const storedResetToken = await authTokenRepository.createToken({
        userId: user.userId,
        tokenType: 'PASSWORD_RESET',
        tokenHash: hashToken(otp),
        expiresAt,
        createdByIp: context.ip || null,
      });
      resetToken = storedResetToken.tokenId;

      if (emailService && typeof emailService.sendPasswordResetOtpEmail === 'function') {
        try {
          const result = await emailService.sendPasswordResetOtpEmail({
            to: user.email,
            otp,
            expiresInMinutes: env.passwordResetTtlMinutes,
          });
          if (result && result.sent === false && result.reason === 'SMTP_NOT_CONFIGURED') {
            console.warn('[auth email] SMTP is not configured; password reset OTP email was not sent.');
          }
        } catch (emailError) {
          console.error('[auth email] Failed to send password reset OTP email:', emailError.message);
        }
      }
    }

    await writeAudit(context, 'AUTH_PASSWORD_RESET_REQUEST', {
      userId: user?.userId || null,
      targetId: user?.userId || null,
      metadata: { email },
    });

    const response = {
      message: 'Password reset email sent',
    };

    if (exposeDebugTokens && otp) {
      response.debugOtp = otp;
    }

    return response;
  }

  async function resetPassword(input, context = {}) {
    const passwordCheck = validatePasswordPolicy(input.newPassword);
    if (!passwordCheck.valid) {
      throw errors.badRequest('WEAK_PASSWORD', 'Password does not meet complexity requirements.', passwordCheck.errors);
    }

    const email = normalizeEmail(input.email);
    const user = await userRepository.findByEmail(email);

    if (!user || user.status !== 'ACTIVE') {
      throw errors.badRequest('INVALID_RESET_TOKEN', 'Email hoặc mã OTP không hợp lệ.');
    }

    const otp = String(input.otp || '').trim();
    const tokenHash = hashToken(otp);
    const tokenRecord = await authTokenRepository.findActiveTokenByHash('PASSWORD_RESET', tokenHash);

    if (!tokenRecord || tokenRecord.userId !== user.userId) {
      throw errors.badRequest('INVALID_RESET_TOKEN', 'Mã OTP không hợp lệ hoặc đã được sử dụng.');
    }

    if (new Date(tokenRecord.expiresAt).getTime() <= clock().getTime()) {
      throw errors.badRequest('EXPIRED_RESET_TOKEN', 'Mã OTP đã hết hiệu lực. Vui lòng yêu cầu mã mới.');
    }

    const passwordHash = await hashPassword(input.newPassword);
    await userRepository.updatePassword(user.userId, passwordHash);
    await authTokenRepository.markTokenUsed(tokenRecord.tokenId);

    await writeAudit(context, 'AUTH_PASSWORD_RESET_SUCCESS', {
      userId: user.userId,
      targetId: user.userId,
    });

    return {
      message: 'Password reset successfully.',
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
