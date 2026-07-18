const crypto = require('crypto');
const env = require('../config/env');
const errors = require('../utils/safeErrors');
const { addHours, generateRandomToken, hashToken } = require('../utils/tokenUtils');
const { hashPassword } = require('../utils/passwordPolicy');

const ACCOUNT_SETUP_TTL_HOURS = 24;
const ACCOUNT_SETUP_RESEND_COOLDOWN_SECONDS = 60;

const ROLE_BY_TYPE = {
  member: 'MEMBER',
  librarian: 'LIBRARIAN',
};

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

function parsePositiveId(value, code, message, errorFactory = errors.badRequest) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw errorFactory(code, message);
  }

  return parsed;
}

function throwRoleMutationError(outcome) {
  const mappings = {
    ADMIN_NOT_FOUND: () =>
      errors.notFound('ADMIN_NOT_FOUND', 'Acting admin was not found.'),
    ADMIN_REQUIRED: () =>
      errors.forbidden('ADMIN_REQUIRED', 'Admin access is required.'),
    USER_NOT_FOUND: () => errors.notFound('USER_NOT_FOUND', 'User was not found.'),
    ROLE_NOT_FOUND: () => errors.notFound('ROLE_NOT_FOUND', 'Role was not found.'),
    USER_ALREADY_HAS_ROLE: () =>
      errors.conflict('USER_ALREADY_HAS_ROLE', 'User already has this role.'),
    USER_ROLE_NOT_FOUND: () =>
      errors.notFound('USER_ROLE_NOT_FOUND', 'User does not have this role.'),
    LAST_USER_ROLE: () =>
      errors.badRequest('LAST_USER_ROLE', 'Every user must keep at least one role.'),
    LAST_ADMIN_ROLE: () =>
      errors.badRequest('LAST_ADMIN_ROLE', 'Cannot remove the last Admin role.'),
  };
  const createError = mappings[outcome];

  if (!createError) {
    throw errors.internal();
  }

  throw createError();
}

function createUserManagementService({
  userRepository,
  userRoleRepository,
  authTokenRepository,
  auditLogRepository,
  accountSetupRepository,
  notificationRequester,
  clock = () => new Date(),
} = {}) {
  if (!userRepository) {
    userRepository = require('../repositories/userRepository');
  }

  if (!userRoleRepository) {
    userRoleRepository = require('../repositories/userRoleRepository');
  }

  if (!authTokenRepository) {
    authTokenRepository = require('../repositories/authTokenRepository');
  }

  if (!auditLogRepository) {
    auditLogRepository = require('../repositories/auditLogRepository');
  }

  if (!accountSetupRepository) {
    accountSetupRepository = require('../repositories/accountSetupRepository');
  }

  if (!notificationRequester) {
    const { defaultNotificationService } = require('./notificationService');
    notificationRequester = defaultNotificationService.createSourceNotificationRequester('FE11');
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

  // @spec FR-FE11-003, FR-FE11-009, FR-FE11-037 - create inactive state, then deliver non-blockingly.
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

    const now = clock();
    const passwordHash = await hashPassword(generateRandomToken());
    const setupToken = generateRandomToken();
    const expiresAt = addHours(now, ACCOUNT_SETUP_TTL_HOURS);
    const { user: createdUser, tokenId } = await accountSetupRepository.createPendingAccount({
      ...normalized,
      passwordHash,
      tokenHash: hashToken(setupToken),
      expiresAt,
      adminUserId: context.adminUserId,
      ip: context.ip || null,
      userAgent: context.userAgent || null,
      now,
    });

    const setupLink = `${env.frontendBaseUrl.replace(/\/$/, '')}/forgot-password?token=${encodeURIComponent(
      setupToken
    )}`;
    let setupDeliveryStatus = 'FAILED';

    try {
      const delivery = await notificationRequester.createNotificationRequest({
        type: 'ACCOUNT_SETUP',
        recipientEmail: createdUser.email,
        templateKey: 'ACCOUNT_SETUP',
        templateData: { setupLink, expiresInHours: ACCOUNT_SETUP_TTL_HOURS },
        sourceEntityType: 'AuthToken',
        sourceEntityId: tokenId,
        idempotencyKey: `FE11:ACCOUNT_SETUP:${tokenId}`,
      });
      setupDeliveryStatus = delivery?.status === 'SENT' ? 'SENT' : 'FAILED';
    } catch {
      setupDeliveryStatus = 'FAILED';
    }

    return {
      userId: createdUser.userId,
      email: createdUser.email,
      status: 'INACTIVE',
      roles: [normalized.roleName],
      setupDeliveryStatus,
      message:
        setupDeliveryStatus === 'SENT'
          ? 'User created. Password setup email sent.'
          : 'User created. Password setup email delivery failed.',
    };
  }

  // @spec BR-FE11-021..025, FR-FE11-036..038 - Admin resend rotates first, then delivers.
  async function resendSetup(userId, context = {}) {
    const parsedUserId = Number(userId);
    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
      throw errors.badRequest('INVALID_USER_ID', 'User id is invalid.');
    }

    const now = clock();
    const setupToken = generateRandomToken();
    const rotation = await accountSetupRepository.rotateSetupToken({
      userId: parsedUserId,
      tokenHash: hashToken(setupToken),
      expiresAt: addHours(now, ACCOUNT_SETUP_TTL_HOURS),
      adminUserId: context.adminUserId,
      ip: context.ip || null,
      userAgent: context.userAgent || null,
      now,
      cooldownSeconds: ACCOUNT_SETUP_RESEND_COOLDOWN_SECONDS,
    });

    if (rotation.outcome === 'MISSING') {
      throw errors.notFound('USER_NOT_FOUND', 'User was not found.');
    }

    if (rotation.outcome === 'NOT_ELIGIBLE') {
      throw errors.badRequest(
        'ACCOUNT_SETUP_NOT_ELIGIBLE',
        'Account setup cannot be resent for this user.'
      );
    }

    if (rotation.outcome === 'COOLDOWN') {
      throw errors.tooManyRequests(
        'ACCOUNT_SETUP_RESEND_COOLDOWN',
        'Password setup email was requested too recently.',
        { retryAfterSeconds: rotation.retryAfterSeconds }
      );
    }

    const setupLink = `${env.frontendBaseUrl.replace(/\/$/, '')}/forgot-password?token=${encodeURIComponent(
      setupToken
    )}`;
    let setupDeliveryStatus = 'FAILED';

    try {
      const delivery = await notificationRequester.createNotificationRequest({
        type: 'ACCOUNT_SETUP',
        recipientEmail: rotation.user.email,
        templateKey: 'ACCOUNT_SETUP',
        templateData: { setupLink, expiresInHours: ACCOUNT_SETUP_TTL_HOURS },
        sourceEntityType: 'AuthToken',
        sourceEntityId: rotation.tokenId,
        idempotencyKey: `FE11:ACCOUNT_SETUP:${rotation.tokenId}`,
      });
      setupDeliveryStatus = delivery?.status === 'SENT' ? 'SENT' : 'FAILED';
    } catch {
      setupDeliveryStatus = 'FAILED';
    }

    return {
      userId: rotation.user.userId,
      status: 'INACTIVE',
      setupDeliveryStatus,
      message:
        setupDeliveryStatus === 'SENT'
          ? 'Password setup email sent.'
          : 'Password setup email delivery failed.',
    };
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

  // @spec FR-FE11-012, FR-FE11-013, FR-FE11-014, FR-FE11-017
  // @spec FR-FE11-024, FR-FE11-025, FR-FE11-026, FR-FE11-027
  async function mutateRole(operation, userId, roleIdInput, context = {}) {
    const parsedAdminUserId = parsePositiveId(
      context.adminUserId,
      'ADMIN_NOT_FOUND',
      'Acting admin was not found.',
      errors.notFound
    );
    const parsedUserId = parsePositiveId(
      userId,
      'INVALID_USER_ID',
      'User id is invalid.'
    );
    const parsedRoleId = parsePositiveId(
      roleIdInput,
      'INVALID_ROLE_ID',
      'Role id is invalid.'
    );
    const result = await userRoleRepository.mutateUserRole({
      operation,
      adminUserId: parsedAdminUserId,
      userId: parsedUserId,
      roleId: parsedRoleId,
      ipAddress: context.ip || null,
      userAgent: context.userAgent || null,
    });
    const successOutcome = operation === 'ASSIGN' ? 'ASSIGNED' : 'REVOKED';

    if (result.outcome !== successOutcome) {
      throwRoleMutationError(result.outcome);
    }

    const updatedUser = await userRepository.getManagedUserById(parsedUserId);
    if (!updatedUser) {
      throw errors.notFound('USER_NOT_FOUND', 'User was not found.');
    }

    return updatedUser;
  }

  async function assignRole(userId, input, context = {}) {
    return mutateRole('ASSIGN', userId, input?.roleId, context);
  }

  async function revokeRole(userId, roleIdParam, context = {}) {
    return mutateRole('REVOKE', userId, roleIdParam, context);
  }

  return {
    listUsers,
    getUser,
    listRoles,
    listAuditLogs,
    createUser,
    resendSetup,
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
