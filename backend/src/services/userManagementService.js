const crypto = require('crypto');
const env = require('../config/env');
const errors = require('../utils/safeErrors');
const { addHours, generateRandomToken, hashToken } = require('../utils/tokenUtils');

const ROLE_BY_TYPE = {
  member: 'MEMBER',
  librarian: 'LIBRARIAN',
};
const VALID_ROLE_NAMES = new Set(['ADMIN', 'LIBRARIAN', 'MEMBER', 'GUEST']);

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function cleanString(value) {
  const cleaned = String(value || '').trim();
  return cleaned || null;
}

function deriveUsername(email) {
  const base =
    normalizeEmail(email)
      .split('@')[0]
      .replace(/[^a-z0-9._-]/g, '')
      .slice(0, 20) || 'user';

  return `${base}_${crypto.randomBytes(2).toString('hex')}`;
}

function normalizeRoleName(roleName) {
  return String(roleName || '').trim().toUpperCase();
}

function normalizeFilter(value) {
  const normalized = String(value || '').trim().toUpperCase();
  return normalized && normalized !== 'ALL' ? normalized : null;
}

function validateLength(value, max, code, label) {
  if (value && value.length > max) {
    throw errors.badRequest(code, `${label} must be at most ${max} characters.`);
  }
}

function validateEmail(email) {
  if (!email || email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw errors.badRequest('INVALID_EMAIL', 'Valid email is required.');
  }
}

function validateUsername(username) {
  if (!username || username.length > 50 || !/^[a-zA-Z0-9._-]+$/.test(username)) {
    throw errors.badRequest(
      'INVALID_USERNAME',
      'Username must use letters, numbers, dot, underscore, or dash and be at most 50 characters.'
    );
  }
}

function validatePhone(phone) {
  if (phone && (phone.length > 20 || !/^[0-9+\-\s()]+$/.test(phone))) {
    throw errors.badRequest('INVALID_PHONE', 'Phone number is invalid.');
  }
}

function createUserManagementService({
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

  async function writeAudit(context, action, targetId, metadata) {
    if (!auditLogRepository || typeof auditLogRepository.create !== 'function') {
      return;
    }

    await auditLogRepository.create({
      userId: context.adminUserId,
      action,
      targetType: 'USER',
      targetId,
      metadata,
      ipAddress: context.ip || null,
      userAgent: context.userAgent || null,
    });
  }

  async function getExistingUser(userId) {
    const parsedUserId = Number(userId);

    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
      throw errors.badRequest('INVALID_USER_ID', 'User id is invalid.');
    }

    const user = await userRepository.getManagedUserById(parsedUserId);

    if (!user) {
      throw errors.badRequest('USER_NOT_FOUND', 'User was not found.');
    }

    return user;
  }

  function validateCreateInput(input) {
    const email = normalizeEmail(input.email);
    const fullName = cleanString(input.fullName);
    const roleName = ROLE_BY_TYPE[String(input.type || '').toLowerCase()];
    const username = cleanString(input.username) || deriveUsername(email);
    const phone = cleanString(input.phone);
    const address = cleanString(input.address);

    validateEmail(email);
    validateUsername(username);
    validatePhone(phone);
    validateLength(fullName, 100, 'FULL_NAME_TOO_LONG', 'Full name');
    validateLength(address, 255, 'ADDRESS_TOO_LONG', 'Address');

    if (!fullName) {
      throw errors.badRequest('FULL_NAME_REQUIRED', 'Full name is required.');
    }

    if (!roleName) {
      throw errors.badRequest('INVALID_USER_TYPE', 'User type must be member or librarian.');
    }

    return {
      email,
      username,
      fullName,
      phone,
      address,
      roleName,
    };
  }

  async function resolveRole(roleInput) {
    const roleId = Number(roleInput.roleId ?? roleInput);
    let role = Number.isInteger(roleId) && roleId > 0 ? await userRepository.findRoleById(roleId) : null;

    if (!role) {
      const roleName = normalizeRoleName(roleInput.roleName ?? roleInput);
      if (!VALID_ROLE_NAMES.has(roleName)) {
        throw errors.badRequest('INVALID_ROLE', 'Role is invalid.');
      }
      role = await userRepository.findRoleByName(roleName);
    }

    if (!role) {
      throw errors.badRequest('ROLE_NOT_FOUND', 'Role was not found.');
    }

    return role;
  }

  async function listUsers(query = {}) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
    const result = await userRepository.listManagedUsers({
      page,
      limit,
      status: normalizeFilter(query.status),
      role: normalizeFilter(query.role),
      search: cleanString(query.search),
    });

    return result;
  }

  async function getUser(userId) {
    return getExistingUser(userId);
  }

  async function listRoles() {
    return {
      data: await userRepository.listRoles(),
    };
  }

  async function listAuditLogs(query = {}) {
    return {
      data: await auditLogRepository.listRecent(query.limit),
    };
  }

  async function createUser(input, context = {}) {
    const normalized = validateCreateInput(input);

    const duplicateEmail = await userRepository.findByEmail(normalized.email);
    if (duplicateEmail) {
      throw errors.conflict('EMAIL_ALREADY_EXISTS', 'Email already exists.');
    }

    const duplicateUsername = await userRepository.findByUsername(normalized.username);
    if (duplicateUsername) {
      throw errors.conflict('USERNAME_ALREADY_EXISTS', 'Username is already in use.');
    }

    const createdUser = await userRepository.createAdminManagedUser({
      ...normalized,
      passwordHash: 'ACCOUNT_SETUP_PENDING',
    });

    const setupToken = generateRandomToken();

    await authTokenRepository.createToken({
      userId: createdUser.userId,
      tokenType: 'ACCOUNT_SETUP',
      tokenHash: hashToken(setupToken),
      expiresAt: addHours(clock(), env.emailVerificationTtlHours),
      createdByIp: context.ip || null,
    });

    if (notificationRepository && typeof notificationRepository.createNotification === 'function') {
      await notificationRepository.createNotification({
        userId: createdUser.userId,
        recipientEmail: createdUser.email,
        templateCode: 'ACCOUNT_VERIFICATION',
        sourceFeature: 'FE11',
        safePayload: { purpose: 'ACCOUNT_SETUP' },
      });
    }

    await writeAudit(context, 'USER_CREATE', createdUser.userId, {
      email: createdUser.email,
      roleName: normalized.roleName,
    });

    const response = await userRepository.getManagedUserById(createdUser.userId);
    response.message = 'Account created. Password setup email queued.';

    if (exposeDebugTokens) {
      response.debugSetupToken = setupToken;
    }

    return response;
  }

  async function updateUser(userId, input, context = {}) {
    const existing = await getExistingUser(userId);
    const updates = {
      email: input.email === undefined ? undefined : normalizeEmail(input.email),
      fullName: input.fullName === undefined ? undefined : cleanString(input.fullName),
      phone: input.phone === undefined ? undefined : cleanString(input.phone),
      address: input.address === undefined ? undefined : cleanString(input.address),
    };

    if (updates.email !== undefined) {
      validateEmail(updates.email);

      const duplicateEmail = await userRepository.findByEmail(updates.email);
      if (duplicateEmail && duplicateEmail.userId !== existing.userId) {
        throw errors.conflict('EMAIL_ALREADY_EXISTS', 'Email already exists.');
      }
    }

    if (updates.fullName !== undefined && !updates.fullName) {
      throw errors.badRequest('FULL_NAME_REQUIRED', 'Full name is required.');
    }
    validatePhone(updates.phone);
    validateLength(updates.fullName, 100, 'FULL_NAME_TOO_LONG', 'Full name');
    validateLength(updates.address, 255, 'ADDRESS_TOO_LONG', 'Address');

    await userRepository.updateManagedUser(existing.userId, updates);
    await writeAudit(context, 'USER_UPDATE', existing.userId, { fields: Object.keys(updates) });
    return userRepository.getManagedUserById(existing.userId);
  }

  async function updateStatus(userId, input, context = {}) {
    const existing = await getExistingUser(userId);
    const status = String(input.status || '').trim().toUpperCase();

    if (status !== 'INACTIVE') {
      throw errors.badRequest('INVALID_STATUS', 'Only INACTIVE status is supported for this action.');
    }

    if (existing.userId === context.adminUserId) {
      throw errors.badRequest('CANNOT_DEACTIVATE_SELF', 'Admins cannot deactivate themselves.');
    }

    const activeBorrowingCount = await userRepository.countActiveBorrowingsByUserId(existing.userId);
    if (activeBorrowingCount > 0) {
      throw errors.badRequest(
        'ACTIVE_BORROWINGS_EXIST',
        `This user has ${activeBorrowingCount} active borrowed item(s).`
      );
    }

    await userRepository.updateManagedUserStatus(existing.userId, status);

    if (authTokenRepository && typeof authTokenRepository.revokeActiveTokensForUser === 'function') {
      await authTokenRepository.revokeActiveTokensForUser(existing.userId);
    }

    await writeAudit(context, 'USER_DEACTIVATE', existing.userId, { status });
    return userRepository.getManagedUserById(existing.userId);
  }

  async function assignRole(userId, input, context = {}) {
    const existing = await getExistingUser(userId);
    const role = await resolveRole(input);

    await userRepository.assignRole(existing.userId, role.roleId);
    await writeAudit(context, 'USER_ROLE_ASSIGN', existing.userId, {
      roleId: role.roleId,
      roleName: role.roleName,
    });
    return userRepository.getManagedUserById(existing.userId);
  }

  async function revokeRole(userId, roleIdParam, context = {}) {
    const existing = await getExistingUser(userId);
    const role = await resolveRole(roleIdParam);

    const roleName = normalizeRoleName(role.roleName);
    if (roleName === 'ADMIN') {
      const adminCount = await userRepository.countUsersByRole('ADMIN');
      if (adminCount <= 1) {
        throw errors.badRequest('LAST_ADMIN_ROLE', 'Cannot remove the last Admin role.');
      }
    }

    const roleCount = await userRepository.countRolesByUserId(existing.userId);
    if (roleCount <= 1 && existing.roles.includes(roleName)) {
      throw errors.badRequest('LAST_USER_ROLE', 'Every user must keep at least one role.');
    }

    await userRepository.revokeRole(existing.userId, role.roleId);
    await writeAudit(context, 'USER_ROLE_REVOKE', existing.userId, { roleId: role.roleId, roleName });
    return userRepository.getManagedUserById(existing.userId);
  }

  return {
    listUsers,
    getUser,
    listRoles,
    listAuditLogs,
    createUser,
    updateUser,
    updateStatus,
    assignRole,
    revokeRole,
  };
}

const defaultUserManagementService = createUserManagementService();

module.exports = {
  createUserManagementService,
  defaultUserManagementService,
};
