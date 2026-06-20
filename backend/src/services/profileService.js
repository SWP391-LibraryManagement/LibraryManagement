const errors = require('../utils/safeErrors');

const PROTECTED_FIELDS = new Set([
  'password',
  'passwordHash',
  'role',
  'roles',
  'roleId',
  'status',
  'email',
  'membershipStatus',
  'membershipApproval',
  'userId',
  'profileId',
]);

function cleanString(value) {
  if (value === null || value === '') {
    return null;
  }

  if (value === undefined) {
    return undefined;
  }

  return String(value).trim() || null;
}

function normalizeDateOnly(value) {
  if (value === null || value === '') {
    return null;
  }

  if (value === undefined) {
    return undefined;
  }

  const raw = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return { invalid: true };
  }

  const parsed = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== raw) {
    return { invalid: true };
  }

  return raw;
}

function toDateOnly(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
}

function validateLength(value, max, field, label, details) {
  if (value && value.length > max) {
    details.push({
      field,
      code: `${field.toUpperCase()}_TOO_LONG`,
      message: `${label} must be at most ${max} characters.`,
    });
  }
}

function validateAvatarUrl(value, details) {
  if (!value) {
    return;
  }

  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Unsupported protocol');
    }
  } catch (error) {
    details.push({
      field: 'avatarUrl',
      code: 'INVALID_AVATAR_URL',
      message: 'Avatar URL must be a valid http or https URL.',
    });
  }
}

function validatePhone(value, details) {
  if (!value) {
    return;
  }

  if (!/^\+?\d{10,15}$/.test(value)) {
    details.push({
      field: 'phone',
      code: 'INVALID_PHONE',
      message: 'Phone must be 10-15 digits and may start with +.',
    });
  }
}

function validateProfileUpdate(input = {}, clock = () => new Date()) {
  const protectedFields = Object.keys(input).filter((field) => PROTECTED_FIELDS.has(field));

  if (protectedFields.length > 0) {
    throw errors.badRequest('PROTECTED_FIELD_SUBMITTED', 'Protected profile fields cannot be updated here.', {
      fields: protectedFields,
    });
  }

  const updates = {
    fullName: input.fullName === undefined ? undefined : cleanString(input.fullName),
    address: input.address === undefined ? undefined : cleanString(input.address),
    dateOfBirth: normalizeDateOnly(input.dateOfBirth),
    avatarUrl: input.avatarUrl === undefined ? undefined : cleanString(input.avatarUrl),
    phone: input.phone === undefined ? undefined : cleanString(input.phone),
  };
  const details = [];

  validateLength(updates.fullName, 100, 'fullName', 'Full name', details);
  validateLength(updates.address, 255, 'address', 'Address', details);
  validateLength(updates.avatarUrl, 255, 'avatarUrl', 'Avatar URL', details);
  validateAvatarUrl(updates.avatarUrl, details);
  validatePhone(updates.phone, details);

  if (updates.dateOfBirth && updates.dateOfBirth.invalid) {
    details.push({
      field: 'dateOfBirth',
      code: 'INVALID_DATE_OF_BIRTH',
      message: 'Date of birth must be a valid ISO date in YYYY-MM-DD format.',
    });
  } else if (updates.dateOfBirth) {
    const today = clock().toISOString().slice(0, 10);
    if (updates.dateOfBirth > today) {
      details.push({
        field: 'dateOfBirth',
        code: 'FUTURE_DATE_OF_BIRTH',
        message: 'Date of birth cannot be in the future.',
      });
    }
  }

  if (details.length > 0) {
    throw errors.badRequest('INVALID_PROFILE_DATA', 'Profile update contains invalid fields.', details);
  }

  return updates;
}

function toSafeProfileDto(record) {
  if (!record) {
    return null;
  }

  return {
    userId: record.userId,
    username: record.username,
    email: record.email,
    phone: record.phone ?? null,
    status: record.status,
    createdAt: record.createdAt,
    profileId: record.profileId,
    fullName: record.fullName ?? null,
    address: record.address ?? null,
    dateOfBirth: toDateOnly(record.dateOfBirth),
    avatarUrl: record.avatarUrl ?? null,
  };
}

function changedFields(before, updates) {
  return Object.keys(updates).filter((field) => updates[field] !== undefined && updates[field] !== before?.[field]);
}

function createProfileService({
  profileRepository,
  auditLogRepository,
  clock = () => new Date(),
} = {}) {
  if (!profileRepository) {
    profileRepository = require('../repositories/profileRepository');
  }

  if (!auditLogRepository) {
    auditLogRepository = require('../repositories/auditLogRepository');
  }

  async function getExistingProfile(userId) {
    const parsedUserId = Number(userId);

    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
      throw errors.unauthorized('INVALID_TOKEN', 'Invalid or expired authentication token.');
    }

    let profile = await profileRepository.findByUserId(parsedUserId);

    if (!profile) {
      throw errors.unauthorized('INVALID_TOKEN', 'Invalid or expired authentication token.');
    }

    if (!profile.profileId) {
      profile = await profileRepository.createBlankProfile(parsedUserId);
    }

    return profile;
  }

  async function writeAudit(userId, context, fields) {
    if (!auditLogRepository || typeof auditLogRepository.create !== 'function') {
      return;
    }

    try {
      await auditLogRepository.create({
        userId,
        action: 'PROFILE_UPDATE',
        targetType: 'USER_PROFILE',
        targetId: userId,
        metadata: { fields },
        ipAddress: context.ip || null,
        userAgent: context.userAgent || null,
      });
    } catch (error) {
      console.error('[profile audit] Failed to write PROFILE_UPDATE:', error.message);
    }
  }

  async function getMyProfile(userId) {
    return toSafeProfileDto(await getExistingProfile(userId));
  }

  async function updateMyProfile(userId, input, context = {}) {
    const existing = await getExistingProfile(userId);
    const updates = validateProfileUpdate(input, clock);
    const updated = await profileRepository.updateByUserId(existing.userId, updates);
    const fields = changedFields(existing, updates);

    if (fields.length > 0) {
      await writeAudit(existing.userId, context, fields);
    }

    return toSafeProfileDto(updated);
  }

  return {
    getMyProfile,
    updateMyProfile,
  };
}

const defaultProfileService = createProfileService();

module.exports = {
  createProfileService,
  defaultProfileService,
  validateProfileUpdate,
  toSafeProfileDto,
};
