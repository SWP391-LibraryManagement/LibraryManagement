function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeInMemoryAuthDependencies(options = {}) {
  let nextUserId = 1;
  let nextTokenId = 1;
  let nextNotificationId = 1;
  let nextOtpIndex = 0;
  const users = [];
  const profiles = [];
  const rolesByUserId = new Map();
  const tokens = [];
  const auditLogs = [];
  const notifications = [];
  const notificationRequests = [];
  const directEmails = [];
  const generatedOtps = [];
  const otpSequence = options.otpSequence || ['123456', '234567', '345678', '456789'];
  const notificationRequesterControl = {
    status: options.notificationStatus || 'SENT',
    error: null,
  };
  const accountSetupControl = {
    failureStage: null,
    completionFailureStage: null,
    resendFailureStage: null,
  };

  const userRepository = {
    async findByEmail(email) {
      return clone(users.find((user) => user.email.toLowerCase() === email.toLowerCase()) || null);
    },

    async findByUsername(username) {
      return clone(users.find((user) => user.username.toLowerCase() === username.toLowerCase()) || null);
    },

    async findByEmailOrUsername(identifier) {
      const normalized = identifier.toLowerCase();
      return clone(
        users.find(
          (user) => user.email.toLowerCase() === normalized || user.username.toLowerCase() === normalized
        ) || null
      );
    },

    async findById(userId) {
      return clone(users.find((user) => user.userId === Number(userId)) || null);
    },

    async getRolesByUserId(userId) {
      return clone(rolesByUserId.get(Number(userId)) || []);
    },

    async getSafeUserById(userId) {
      const user = users.find((item) => item.userId === Number(userId));

      if (!user) {
        return null;
      }

      const safeUser = clone(user);
      delete safeUser.passwordHash;
      safeUser.roles = clone(rolesByUserId.get(Number(userId)) || []);
      return safeUser;
    },

    async getManagedUserById(userId) {
      const user = users.find((item) => item.userId === Number(userId));

      if (!user) {
        return null;
      }

      const profile = profiles.find((item) => item.userId === Number(userId)) || {};
      return clone({
        userId: user.userId,
        username: user.username,
        email: user.email,
        phone: user.phone,
        status: user.status,
        fullName: profile.fullName || null,
        address: profile.address || null,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        roles: rolesByUserId.get(Number(userId)) || [],
      });
    },

    async createRegisteredUser({ username, email, passwordHash, phoneNumber, fullName }) {
      const now = new Date();
      const user = {
        userId: nextUserId,
        username,
        email,
        passwordHash,
        phone: phoneNumber || null,
        status: 'INACTIVE',
        emailVerifiedAt: null,
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: null,
        fullName: fullName || null,
      };

      nextUserId += 1;
      users.push(user);
      rolesByUserId.set(user.userId, ['MEMBER']);

      return clone(user);
    },

    async markEmailVerified(userId) {
      const user = users.find((item) => item.userId === Number(userId));
      user.status = 'ACTIVE';
      user.emailVerifiedAt = new Date();
      user.updatedAt = new Date();
    },

    async updateFailedLogin(userId, failedLoginCount, lockedUntil) {
      const user = users.find((item) => item.userId === Number(userId));
      user.failedLoginCount = failedLoginCount;
      user.lockedUntil = lockedUntil;
      if (lockedUntil) {
        user.status = 'LOCKED';
      }
      user.updatedAt = new Date();
    },

    async resetFailedLoginsAndSetLastLogin(userId) {
      const user = users.find((item) => item.userId === Number(userId));
      user.failedLoginCount = 0;
      user.lockedUntil = null;
      if (user.status === 'LOCKED') {
        user.status = 'ACTIVE';
      }
      user.lastLoginAt = new Date();
      user.updatedAt = new Date();
    },

    async unlockExpiredAccount(userId) {
      const user = users.find((item) => item.userId === Number(userId));
      user.failedLoginCount = 0;
      user.lockedUntil = null;
      if (user.status === 'LOCKED') {
        user.status = 'ACTIVE';
      }
      user.updatedAt = new Date();
    },

    async updatePassword(userId, passwordHash) {
      const user = users.find((item) => item.userId === Number(userId));
      user.passwordHash = passwordHash;
      user.failedLoginCount = 0;
      user.lockedUntil = null;
      if (user.status === 'LOCKED') {
        user.status = 'ACTIVE';
      }
      user.updatedAt = new Date();
    },

    async updatePasswordAndActivate(userId, passwordHash) {
      const user = users.find((item) => item.userId === Number(userId));
      user.passwordHash = passwordHash;
      user.status = 'ACTIVE';
      user.emailVerifiedAt = user.emailVerifiedAt || new Date();
      user.failedLoginCount = 0;
      user.lockedUntil = null;
      user.updatedAt = new Date();
    },
  };

  const authTokenRepository = {
    async createToken({ userId, tokenType, tokenHash, expiresAt, createdByIp }) {
      const token = {
        tokenId: nextTokenId,
        userId,
        tokenType,
        tokenHash,
        expiresAt,
        usedAt: null,
        revokedAt: null,
        createdAt: new Date(),
        createdByIp: createdByIp || null,
      };

      nextTokenId += 1;
      tokens.push(token);
      return clone(token);
    },

    async findActiveTokenByHash(tokenType, tokenHash) {
      return clone(
        tokens.find(
          (token) =>
            token.tokenType === tokenType &&
            token.tokenHash === tokenHash &&
            !token.usedAt &&
            !token.revokedAt
        ) || null
      );
    },

    async findActiveTokenById(tokenId, tokenType) {
      return clone(
        tokens.find(
          (token) =>
            token.tokenId === Number(tokenId) &&
            token.tokenType === tokenType &&
            !token.usedAt &&
            !token.revokedAt
        ) || null
      );
    },

    async markTokenUsed(tokenId) {
      const token = tokens.find((item) => item.tokenId === Number(tokenId));
      token.usedAt = new Date();
    },

    async revokeToken(tokenId) {
      const token = tokens.find((item) => item.tokenId === Number(tokenId));
      token.revokedAt = new Date();
    },

    async revokeActiveTokensForUserType(userId, tokenType) {
      tokens
        .filter(
          (token) =>
            token.userId === Number(userId) &&
            token.tokenType === tokenType &&
            !token.usedAt &&
            !token.revokedAt
        )
        .forEach((token) => {
          token.revokedAt = new Date();
        });
    },
  };

  const auditLogRepository = {
    async create(entry) {
      auditLogs.push(clone({ ...entry, createdAt: new Date() }));
    },
  };

  const notificationRepository = {
    async createNotification(entry) {
      notifications.push(clone({ ...entry, createdAt: new Date() }));
    },
  };

  const notificationRequester = {
    async createNotificationRequest(entry) {
      notificationRequests.push(clone(entry));

      if (notificationRequesterControl.error) {
        throw notificationRequesterControl.error;
      }

      const result = {
        notificationId: nextNotificationId,
        status: notificationRequesterControl.status,
      };
      nextNotificationId += 1;
      return result;
    },
  };

  function otpGenerator() {
    const otp = otpSequence[nextOtpIndex] || String(567890 + nextOtpIndex).slice(-6);
    nextOtpIndex += 1;
    generatedOtps.push(otp);
    return otp;
  }

  const emailService = {
    async sendVerificationOtpEmail(entry) {
      directEmails.push(clone({ method: 'sendVerificationOtpEmail', ...entry }));
      return { sent: true, providerMessageId: 'test-verification-message' };
    },
    async sendPasswordResetOtpEmail(entry) {
      directEmails.push(clone({ method: 'sendPasswordResetOtpEmail', ...entry }));
      return { sent: true, providerMessageId: 'test-reset-message' };
    },
    async sendChangePasswordOtpEmail(entry) {
      directEmails.push(clone({ method: 'sendChangePasswordOtpEmail', ...entry }));
      return { sent: true, providerMessageId: 'test-change-password-message' };
    },
  };

  const accountSetupRepository = {
    async createPendingAccount(input) {
      const now = input.now || new Date();
      const user = {
        userId: nextUserId,
        username: input.username,
        email: input.email,
        passwordHash: input.passwordHash,
        phone: input.phone || null,
        status: 'INACTIVE',
        emailVerifiedAt: null,
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: null,
      };

      if (accountSetupControl.failureStage === 'profile') {
        throw new Error('profile insert failed');
      }

      const profile = {
        userId: user.userId,
        fullName: input.fullName,
        address: input.address || null,
        department: input.department || null,
        specialization: input.specialization || null,
      };

      if (accountSetupControl.failureStage === 'role') {
        throw new Error('role assignment failed');
      }

      const token = {
        tokenId: nextTokenId,
        userId: user.userId,
        tokenType: 'ACCOUNT_SETUP',
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        usedAt: null,
        revokedAt: null,
        createdAt: now,
        createdByIp: input.ip || null,
      };

      if (accountSetupControl.failureStage === 'token') {
        throw new Error('token insert failed');
      }

      const audit = {
        userId: input.adminUserId,
        action: 'USER_CREATE',
        targetType: 'USER',
        targetId: user.userId,
        metadata: { email: user.email, roleName: input.roleName },
        ipAddress: input.ip || null,
        userAgent: input.userAgent || null,
        createdAt: now,
      };

      if (accountSetupControl.failureStage === 'audit') {
        throw new Error('audit insert failed');
      }

      nextUserId += 1;
      nextTokenId += 1;
      users.push(user);
      profiles.push(profile);
      rolesByUserId.set(user.userId, [input.roleName]);
      tokens.push(token);
      auditLogs.push(audit);

      return clone({ outcome: 'CREATED', user, tokenId: token.tokenId });
    },

    async completeSetup({ tokenHash, passwordHash, now, context = {} }) {
      const token = tokens.find(
        (item) => item.tokenType === 'ACCOUNT_SETUP' && item.tokenHash === tokenHash
      );

      if (!token) {
        return { matched: false };
      }

      const user = users.find((item) => item.userId === token.userId);

      if (token.usedAt || token.revokedAt || !user || user.status !== 'INACTIVE') {
        return { matched: true, outcome: 'INVALID' };
      }

      if (new Date(token.expiresAt).getTime() <= now.getTime()) {
        return { matched: true, outcome: 'EXPIRED' };
      }

      const updatedUser = {
        ...user,
        passwordHash,
        status: 'ACTIVE',
        emailVerifiedAt: user.emailVerifiedAt || now,
        failedLoginCount: 0,
        lockedUntil: null,
        updatedAt: now,
      };
      const updatedTokens = tokens.map((item) => {
        if (item.tokenId === token.tokenId) {
          return { ...item, usedAt: now };
        }

        if (
          item.userId === user.userId &&
          item.tokenType === 'ACCOUNT_SETUP' &&
          !item.usedAt &&
          !item.revokedAt
        ) {
          return { ...item, revokedAt: now };
        }

        return item;
      });
      const audit = {
        userId: user.userId,
        action: 'AUTH_ACCOUNT_SETUP_COMPLETE',
        targetType: 'USER',
        targetId: user.userId,
        metadata: null,
        ipAddress: context.ip || null,
        userAgent: context.userAgent || null,
        createdAt: now,
      };

      if (accountSetupControl.completionFailureStage) {
        throw new Error(`${accountSetupControl.completionFailureStage} update failed`);
      }

      Object.assign(user, updatedUser);
      updatedTokens.forEach((updatedToken, index) => {
        tokens[index] = updatedToken;
      });
      auditLogs.push(audit);

      return { matched: true, outcome: 'COMPLETED', userId: user.userId };
    },

    async rotateSetupToken({
      userId,
      tokenHash,
      expiresAt,
      adminUserId,
      ip,
      userAgent,
      now,
      cooldownSeconds,
    }) {
      const user = users.find((item) => item.userId === Number(userId));
      if (!user) {
        return { outcome: 'MISSING' };
      }

      const setupHistory = tokens
        .filter((item) => item.userId === user.userId && item.tokenType === 'ACCOUNT_SETUP')
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime() ||
            right.tokenId - left.tokenId
        );

      if (
        user.status !== 'INACTIVE' ||
        !setupHistory.length ||
        setupHistory.some((item) => item.usedAt)
      ) {
        return { outcome: 'NOT_ELIGIBLE' };
      }

      const cooldownMs = cooldownSeconds * 1000;
      const elapsedMs = now.getTime() - new Date(setupHistory[0].createdAt).getTime();
      if (elapsedMs < cooldownMs) {
        return {
          outcome: 'COOLDOWN',
          retryAfterSeconds: Math.ceil((cooldownMs - elapsedMs) / 1000),
        };
      }

      const newToken = {
        tokenId: nextTokenId,
        userId: user.userId,
        tokenType: 'ACCOUNT_SETUP',
        tokenHash,
        expiresAt,
        usedAt: null,
        revokedAt: null,
        createdAt: now,
        createdByIp: ip || null,
      };
      const audit = {
        userId: adminUserId,
        action: 'USER_ACCOUNT_SETUP_RESEND',
        targetType: 'USER',
        targetId: user.userId,
        metadata: { tokenId: newToken.tokenId },
        ipAddress: ip || null,
        userAgent: userAgent || null,
        createdAt: now,
      };

      if (accountSetupControl.resendFailureStage === 'token') {
        throw new Error('token insert failed');
      }
      if (accountSetupControl.resendFailureStage === 'audit') {
        throw new Error('audit insert failed');
      }

      setupHistory
        .filter((item) => !item.usedAt && !item.revokedAt)
        .forEach((item) => {
          item.revokedAt = now;
        });
      nextTokenId += 1;
      tokens.push(newToken);
      auditLogs.push(audit);

      return clone({
        outcome: 'ROTATED',
        user: { userId: user.userId, email: user.email, status: user.status },
        tokenId: newToken.tokenId,
      });
    },
  };

  return {
    userRepository,
    authTokenRepository,
    auditLogRepository,
    notificationRepository,
    notificationRequester,
    otpGenerator,
    emailService,
    accountSetupRepository,
    state: {
      users,
      profiles,
      tokens,
      auditLogs,
      notifications,
      notificationRequests,
      directEmails,
      generatedOtps,
      notificationRequesterControl,
      rolesByUserId,
      accountSetupControl,
    },
  };
}

module.exports = {
  makeInMemoryAuthDependencies,
};
