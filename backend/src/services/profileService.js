const errors = require('../utils/safeErrors');
const path = require('path');

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

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

  if (/^\/uploads\/avatars\/[A-Za-z0-9._-]+$/.test(value)) {
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

function hasValidImageSignature(file) {
  const buffer = file?.buffer;

  if (!Buffer.isBuffer(buffer)) {
    return false;
  }

  if (file.mimeType === 'image/jpeg') {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (file.mimeType === 'image/png') {
    return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  if (file.mimeType === 'image/webp') {
    return buffer.length >= 12
      && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
      && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  }

  return false;
}

function validateAvatarUpload(file) {
  if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    throw errors.badRequest('AVATAR_FILE_REQUIRED', 'Avatar file is required.');
  }

  if (file.size > MAX_AVATAR_BYTES || file.buffer.length > MAX_AVATAR_BYTES) {
    throw errors.badRequest('AVATAR_FILE_TOO_LARGE', 'Avatar file must be at most 2 MB.');
  }

  const allowedExtensions = ALLOWED_AVATAR_TYPES[file.mimeType];
  const extension = path.extname(file.originalName || '').toLowerCase();

  if (!allowedExtensions || !allowedExtensions.includes(extension) || !hasValidImageSignature(file)) {
    throw errors.badRequest('INVALID_AVATAR_FILE_TYPE', 'Avatar must be a JPG, JPEG, PNG, or WebP image.');
  }
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
  avatarStorage,
  clock = () => new Date(),
} = {}) {
  if (!profileRepository) {
    profileRepository = require('../repositories/profileRepository');
  }

  if (!auditLogRepository) {
    auditLogRepository = require('../repositories/auditLogRepository');
  }

  if (!avatarStorage) {
    avatarStorage = require('../utils/avatarStorage');
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

  async function updateMyAvatar(userId, file, context = {}) {
    const existing = await getExistingProfile(userId);
    validateAvatarUpload(file);

    const avatarUrl = await avatarStorage.saveAvatarFile({
      userId: existing.userId,
      buffer: file.buffer,
      mimeType: file.mimeType,
    });
    const updated = await profileRepository.updateAvatarByUserId(existing.userId, avatarUrl);

    if (avatarUrl !== existing.avatarUrl) {
      await writeAudit(existing.userId, context, ['avatarUrl']);
    }

    return toSafeProfileDto(updated);
  }

  return {
    getMyProfile,
    updateMyProfile,
    updateMyAvatar,
  };
}

const defaultProfileService = createProfileService();

module.exports = {
  createProfileService,
  defaultProfileService,
  validateProfileUpdate,
  validateAvatarUpload,
  toSafeProfileDto,
};
