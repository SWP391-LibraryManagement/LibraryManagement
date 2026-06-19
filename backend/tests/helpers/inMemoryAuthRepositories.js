function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeInMemoryAuthDependencies() {
  let nextUserId = 1;
  let nextTokenId = 1;
  const users = [];
  const rolesByUserId = new Map();
  const tokens = [];
  const auditLogs = [];
  const notifications = [];

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

  return {
    userRepository,
    authTokenRepository,
    auditLogRepository,
    notificationRepository,
    state: {
      users,
      tokens,
      auditLogs,
      notifications,
      rolesByUserId,
    },
  };
}

module.exports = {
  makeInMemoryAuthDependencies,
};
