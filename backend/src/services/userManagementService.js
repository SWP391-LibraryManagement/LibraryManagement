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
const USER_LIST_STATUSES = new Set(['ACTIVE', 'INACTIVE', 'LOCKED']);
const USER_LIST_ROLES = new Set(['MEMBER', 'LIBRARIAN', 'ADMIN']);

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function cleanString(value) {
  const cleaned = String(value || '').trim();
  return cleaned || null;
}

function parseListInteger(value, { defaultValue, min, max, code, message }) {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || (max !== undefined && parsed > max)) {
    throw errors.badRequest(code, message);
  }

  return parsed;
}

function normalizeListEnum(value, allowed, code, message) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim().toUpperCase();
  if (!allowed.has(normalized)) {
    throw errors.badRequest(code, message);
  }

  return normalized;
}

function normalizeListSearch(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  if (normalized.length < 1 || normalized.length > 200) {
    throw errors.badRequest(
      'INVALID_USER_SEARCH',
      'Search must be between 1 and 200 characters.'
    );
  }

  return normalized;
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
  if (!email || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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
  userLifecycleRepository,
  userRoleRepository,
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

  if (!userLifecycleRepository) {
    userLifecycleRepository = require('../repositories/userLifecycleRepository');
  }

  if (!accountSetupRepository) {
    accountSetupRepository = require('../repositories/accountSetupRepository');
  }

  if (!notificationRequester) {
    const { defaultNotificationService } = require('./notificationService');
    notificationRequester = defaultNotificationService.createSourceNotificationRequester('FE11');
  }

  function validateCreateInput(input) {
    const email = normalizeEmail(input.email);
    const fullName = cleanString(input.fullName);
    const roleName = ROLE_BY_TYPE[String(input.type || '').toLowerCase()];
    const username = cleanString(input.username) || deriveUsername(email);
    const phone = cleanString(input.phone);
    const address = cleanString(input.address);
    const department = cleanString(input.department);
    const specialization = cleanString(input.specialization);

    validateEmail(email);
    validateUsername(username);
    validatePhone(phone);
    validateLength(fullName, 100, 'FULL_NAME_TOO_LONG', 'Full name');
    validateLength(address, 255, 'ADDRESS_TOO_LONG', 'Address');
    validateLength(department, 100, 'DEPARTMENT_TOO_LONG', 'Department');
    validateLength(specialization, 100, 'SPECIALIZATION_TOO_LONG', 'Specialization');

    if (!fullName) {
      throw errors.badRequest('FULL_NAME_REQUIRED', 'Full name is required.');
    }

    if (!roleName) {
      throw errors.badRequest('INVALID_USER_TYPE', 'User type must be member or librarian.');
    }

    if (roleName !== 'LIBRARIAN' && (department || specialization)) {
      throw errors.badRequest(
        'VALIDATION_ERROR',
        'Department and specialization are only allowed for Librarian accounts.'
      );
    }

    return {
      email,
      username,
      fullName,
      phone,
      address,
      department,
      specialization,
      roleName,
    };
  }

  async function listUsers(query = {}) {
    // @spec FR-FE11-001, AC-FE11-001
    return userRepository.listManagedUsers({
      page: parseListInteger(query.page, {
        defaultValue: 1,
        min: 1,
        code: 'INVALID_PAGE',
        message: 'Page must be a positive integer.',
      }),
      limit: parseListInteger(query.limit, {
        defaultValue: 20,
        min: 1,
        max: 100,
        code: 'INVALID_LIMIT',
        message: 'Limit must be an integer between 1 and 100.',
      }),
      status: normalizeListEnum(
        query.status,
        USER_LIST_STATUSES,
        'INVALID_USER_STATUS',
        'Status must be ACTIVE, INACTIVE, or LOCKED.'
      ),
      role: normalizeListEnum(
        query.role,
        USER_LIST_ROLES,
        'INVALID_USER_ROLE',
        'Role must be MEMBER, LIBRARIAN, or ADMIN.'
      ),
      search: normalizeListSearch(query.search),
    });
  }

  async function getUser(userId) {
    // @spec FR-FE11-002, FR-FE11-016
    const parsedUserId = parsePositiveId(
      userId,
      'INVALID_USER_ID',
      'User id is invalid.'
    );
    const user = await userRepository.getManagedUserDetailById(parsedUserId);

    if (!user) {
      throw errors.notFound('USER_NOT_FOUND', 'User was not found.');
    }

    return user;
  }

  async function listRoles() {
    return {
      data: await userRepository.listRoles(),
    };
  }

  // @spec FR-FE11-003, FR-FE11-005, FR-FE11-006, FR-FE11-009, FR-FE11-022, FR-FE11-037
  async function createUser(input, context = {}) {
    const normalized = validateCreateInput(input);

    const now = clock();
    const passwordHash = await hashPassword(generateRandomToken());
    const setupToken = generateRandomToken();
    const expiresAt = addHours(now, ACCOUNT_SETUP_TTL_HOURS);
    const creation = await accountSetupRepository.createPendingAccount({
      ...normalized,
      passwordHash,
      tokenHash: hashToken(setupToken),
      expiresAt,
      adminUserId: context.adminUserId,
      ip: context.ip || null,
      userAgent: context.userAgent || null,
      now,
    });

    if (creation.outcome === 'ADMIN_NOT_FOUND') {
      throw errors.notFound('ADMIN_NOT_FOUND', 'Acting admin was not found.');
    }
    if (creation.outcome === 'ADMIN_REQUIRED') {
      throw errors.forbidden('ADMIN_REQUIRED', 'Admin access is required.');
    }
    if (creation.outcome === 'EMAIL_ALREADY_EXISTS') {
      throw errors.conflict('EMAIL_ALREADY_EXISTS', 'Email already exists.');
    }
    if (creation.outcome === 'USERNAME_ALREADY_EXISTS') {
      throw errors.conflict('USERNAME_ALREADY_EXISTS', 'Username is already in use.');
    }
    if (creation.outcome !== 'CREATED') {
      throw errors.internal();
    }

    const { user: createdUser, tokenId } = creation;

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

    if (rotation.outcome === 'ADMIN_NOT_FOUND') {
      throw errors.notFound('ADMIN_NOT_FOUND', 'Acting admin was not found.');
    }

    if (rotation.outcome === 'ADMIN_REQUIRED') {
      throw errors.forbidden('ADMIN_REQUIRED', 'Admin access is required.');
    }

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

  // @spec FR-FE11-004, FR-FE11-010, FR-FE11-020, FR-FE11-023, FR-FE11-028
  async function updateUser(userId, input, context = {}) {
    const parsedUserId = parsePositiveId(userId, 'INVALID_USER_ID', 'User id is invalid.');
    const allowedFields = new Set(['expectedUpdatedAt', 'department', 'specialization']);
    const forbiddenField = Object.keys(input || {}).find((field) => !allowedFields.has(field));
    if (forbiddenField) {
      throw errors.forbidden(
        'PERSONAL_PROFILE_ADMIN_FORBIDDEN',
        'Admins may update only Librarian department and specialization fields.'
      );
    }

    const expectedUpdatedAt = new Date(input.expectedUpdatedAt);
    if (!Number.isFinite(expectedUpdatedAt.getTime())) {
      throw errors.badRequest('VALIDATION_ERROR', 'Expected updated timestamp is invalid.');
    }

    const updates = {};
    if (input.department !== undefined) updates.department = cleanString(input.department);
    if (input.specialization !== undefined) {
      updates.specialization = cleanString(input.specialization);
    }

    if (!Object.keys(updates).length) {
      throw errors.badRequest('VALIDATION_ERROR', 'At least one editable field is required.');
    }
    validateLength(updates.department, 100, 'DEPARTMENT_TOO_LONG', 'Department');
    validateLength(updates.specialization, 100, 'SPECIALIZATION_TOO_LONG', 'Specialization');

    const result = await userLifecycleRepository.updateManagedUser({
      adminUserId: context.adminUserId,
      userId: parsedUserId,
      expectedUpdatedAt,
      changes: updates,
      ipAddress: context.ip || null,
      userAgent: context.userAgent || null,
      now: clock(),
    });
    const outcomeErrors = {
      ADMIN_NOT_FOUND: () => errors.notFound('ADMIN_NOT_FOUND', 'Acting admin was not found.'),
      ADMIN_REQUIRED: () => errors.forbidden('ADMIN_REQUIRED', 'Admin access is required.'),
      USER_NOT_FOUND: () => errors.notFound('USER_NOT_FOUND', 'User was not found.'),
      STALE_USER_STATE: () => errors.conflict('STALE_USER_STATE', 'User state is stale.'),
      VALIDATION_ERROR: () => errors.badRequest(
        'VALIDATION_ERROR',
        'Librarian fields are only allowed for Librarian accounts.'
      ),
    };

    if (!['UPDATED', 'NO_CHANGE'].includes(result.outcome)) {
      const createError = outcomeErrors[result.outcome];
      if (!createError) throw errors.internal();
      throw createError();
    }

    return userRepository.getManagedUserById(parsedUserId);
  }

  // @spec FR-FE11-018, FR-FE11-019
  async function updateStatus(userId, input, context = {}) {
    const parsedUserId = parsePositiveId(userId, 'INVALID_USER_ID', 'User id is invalid.');
    const status = String(input.status || '').trim().toUpperCase();

    if (status !== 'INACTIVE') {
      throw errors.badRequest('INVALID_STATUS', 'Only INACTIVE status is supported for this action.');
    }
    const expectedUpdatedAt = new Date(input.expectedUpdatedAt);
    if (!Number.isFinite(expectedUpdatedAt.getTime())) {
      throw errors.badRequest('VALIDATION_ERROR', 'Expected updated timestamp is invalid.');
    }

    const result = await userLifecycleRepository.deactivateManagedUser({
      adminUserId: context.adminUserId,
      userId: parsedUserId,
      expectedUpdatedAt,
      ipAddress: context.ip || null,
      userAgent: context.userAgent || null,
      now: clock(),
    });
    const outcomeErrors = {
      ADMIN_NOT_FOUND: () => errors.notFound('ADMIN_NOT_FOUND', 'Acting admin was not found.'),
      ADMIN_REQUIRED: () => errors.forbidden('ADMIN_REQUIRED', 'Admin access is required.'),
      USER_NOT_FOUND: () => errors.notFound('USER_NOT_FOUND', 'User was not found.'),
      CANNOT_DEACTIVATE_SELF: () => errors.badRequest(
        'CANNOT_DEACTIVATE_SELF',
        'Admins cannot deactivate themselves.'
      ),
      STALE_USER_STATE: () => errors.conflict('STALE_USER_STATE', 'User state is stale.'),
      ACCOUNT_PENDING_ACTIVATION: () => errors.conflict(
        'ACCOUNT_PENDING_ACTIVATION',
        'Pending activation accounts cannot be deactivated.'
      ),
      ACTIVE_BORROWINGS_EXIST: () => errors.conflict(
        'ACTIVE_BORROWINGS_EXIST',
        `This user has ${result.activeBorrowingCount} active borrowed item(s).`,
        { activeBorrowingCount: result.activeBorrowingCount }
      ),
      VALIDATION_ERROR: () => errors.badRequest('VALIDATION_ERROR', 'User cannot be deactivated.'),
    };

    if (!['DEACTIVATED', 'ALREADY_DEACTIVATED'].includes(result.outcome)) {
      const createError = outcomeErrors[result.outcome];
      if (!createError) throw errors.internal();
      throw createError();
    }

    return userRepository.getManagedUserById(parsedUserId);
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
