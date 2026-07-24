const errors = require('../utils/safeErrors');
const path = require('path');

// --- Constants ---

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};
const EDITABLE_PROFILE_FIELDS = new Set(['fullName', 'address', 'dateOfBirth', 'phone']);
const MANAGED_AVATAR_PATTERN = /^\/uploads\/avatars\/[A-Za-z0-9][A-Za-z0-9._-]*$/;

// Byte signatures cho từng loại ảnh
const IMAGE_SIGNATURES = {
  'image/jpeg': (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  'image/png': (buf) => buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': (buf) => buf.length >= 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP',
};

// --- Pure helpers ---

/** Trim chuỗi, trả về null nếu rỗng/null/undefined */
function cleanString(value) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  return String(value).trim() || null;
}

/** Chuẩn hoá ngày về dạng 'YYYY-MM-DD', trả về { invalid: true } nếu sai định dạng */
function normalizeDateOnly(value) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  const raw = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return { invalid: true };

  const parsed = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== raw) return { invalid: true };

  return raw;
}

/** Chuyển Date hoặc string thành 'YYYY-MM-DD' */
function toDateOnly(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

/** Thêm lỗi vào details nếu chuỗi vượt quá độ dài tối đa */
function validateLength(value, max, field, label, details) {
  if (value && value.length > max) {
    details.push({ field, code: `${field.toUpperCase()}_TOO_LONG`, message: `${label} không được vượt quá ${max} ký tự.` });
  }
}

/** Kiểm tra số điện thoại hợp lệ */
function validatePhone(value, details) {
  if (!value) return;
  if (!/^\+?\d{10,15}$/.test(value)) {
    details.push({ field: 'phone', code: 'INVALID_PHONE', message: 'Số điện thoại phải có 10-15 chữ số và có thể bắt đầu bằng +.' });
  }
}

/** Kiểm tra ngày sinh hợp lệ và không phải tương lai */
function validateDateOfBirth(value, clock, details) {
  if (!value) return;

  if (value.invalid) {
    details.push({ field: 'dateOfBirth', code: 'INVALID_DATE_OF_BIRTH', message: 'Ngày sinh phải đúng định dạng YYYY-MM-DD.' });
    return;
  }

  const today = clock().toISOString().slice(0, 10);
  if (value > today) {
    details.push({ field: 'dateOfBirth', code: 'FUTURE_DATE_OF_BIRTH', message: 'Ngày sinh không được là ngày trong tương lai.' });
  }
}

/** Validate và chuẩn hoá dữ liệu cập nhật profile, ném lỗi nếu có field không hợp lệ */
// @spec BR-FE03-016 FR-FE03-005 FR-FE03-006 AC-FE03-013
function validateProfileUpdate(input = {}, clock = () => new Date()) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length === 0) {
    throw errors.badRequest(
      'INVALID_PROFILE_DATA',
      'Dữ liệu cập nhật hồ sơ không hợp lệ.',
      [{ field: 'body', code: 'PROFILE_UPDATE_REQUIRED', message: 'Cần cung cấp ít nhất một trường hồ sơ.' }]
    );
  }

  const rejectedFields = Object.keys(input).filter((field) => !EDITABLE_PROFILE_FIELDS.has(field));
  if (rejectedFields.length > 0) {
    throw errors.badRequest(
      'PROTECTED_FIELD_SUBMITTED',
      'Chỉ các trường hồ sơ đã được phê duyệt mới có thể cập nhật tại đây.',
      { fields: rejectedFields }
    );
  }

  const details = Object.keys(input)
    .filter((field) => input[field] !== null && typeof input[field] !== 'string')
    .map((field) => ({
      field,
      code: `${field.toUpperCase()}_INVALID_TYPE`,
      message: `${field} phải là chuỗi.`,
    }));

  if (details.length > 0) {
    throw errors.badRequest('INVALID_PROFILE_DATA', 'Dữ liệu cập nhật hồ sơ không hợp lệ.', details);
  }

  const updates = {
    fullName: cleanString(input.fullName),
    address: cleanString(input.address),
    dateOfBirth: normalizeDateOnly(input.dateOfBirth),
    phone: cleanString(input.phone),
  };

  // Giữ undefined cho field không được gửi lên
  for (const key of Object.keys(updates)) {
    if (input[key] === undefined) updates[key] = undefined;
  }

  validateLength(updates.fullName, 100, 'fullName', 'Full name', details);
  validateLength(updates.address, 255, 'address', 'Address', details);
  validatePhone(updates.phone, details);
  validateDateOfBirth(updates.dateOfBirth, clock, details);

  if (details.length > 0) {
    throw errors.badRequest('INVALID_PROFILE_DATA', 'Dữ liệu cập nhật hồ sơ không hợp lệ.', details);
  }

  return updates;
}

/** Kiểm tra byte signature của file ảnh khớp với mimeType */
function hasValidImageSignature(file) {
  const buffer = file?.buffer;
  if (!Buffer.isBuffer(buffer)) return false;
  const check = IMAGE_SIGNATURES[file.mimeType];
  return check ? check(buffer) : false;
}

/** Validate file avatar: kích thước, loại file, byte signature */
// @spec FR-FE03-009
function validateAvatarUpload(file) {
  if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    throw errors.badRequest('AVATAR_FILE_REQUIRED', 'Vui lòng cung cấp file ảnh đại diện.');
  }

  if (file.size > MAX_AVATAR_BYTES || file.buffer.length > MAX_AVATAR_BYTES) {
    throw errors.badRequest('AVATAR_FILE_TOO_LARGE', 'File ảnh đại diện không được vượt quá 2 MB.');
  }

  const allowedExtensions = ALLOWED_AVATAR_TYPES[file.mimeType];
  const extension = path.extname(file.originalName || '').toLowerCase();

  if (!allowedExtensions || !allowedExtensions.includes(extension) || !hasValidImageSignature(file)) {
    throw errors.badRequest('INVALID_AVATAR_FILE_TYPE', 'Ảnh đại diện phải là file JPG, JPEG, PNG hoặc WebP.');
  }
}

/** Chuyển record DB thành DTO an toàn để trả về client */
// @spec FR-FE03-007
function toSafeProfileDto(record) {
  if (!record) return null;

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

/** Lấy danh sách field thực sự thay đổi so với dữ liệu cũ */
function changedFields(before, updates) {
  return Object.keys(updates).filter((field) => {
    if (updates[field] === undefined) return false;
    const previous = field === 'dateOfBirth' ? toDateOnly(before?.[field]) : before?.[field] ?? null;
    return updates[field] !== previous;
  });
}

function buildAuditEntry(userId, context, fields) {
  return {
    userId,
    action: 'PROFILE_UPDATE',
    targetType: 'USER_PROFILE',
    targetId: userId,
    metadata: { fields },
    ipAddress: context.ip || null,
    userAgent: context.userAgent || null,
  };
}

// --- Factory ---

function createProfileService({
  profileRepository,
  auditLogRepository,
  avatarStorage,
  clock = () => new Date(),
  logger = console,
} = {}) {
  if (!profileRepository) profileRepository = require('../repositories/profileRepository');
  if (!auditLogRepository) auditLogRepository = require('../repositories/auditLogRepository');
  if (!avatarStorage) avatarStorage = require('../utils/avatarStorage');

  // --- Internal helpers ---

  /** Load profile theo userId, tạo blank nếu chưa có, ném lỗi nếu user không tồn tại */
  // @spec FR-FE03-001 AC-FE03-012
  async function getExistingProfile(userId) {
    const parsedUserId = Number(userId);
    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
      throw errors.unauthorized('INVALID_TOKEN', 'Invalid or expired authentication token.');
    }

    let profile = await profileRepository.findByUserId(parsedUserId);
    if (!profile) {
      throw errors.notFound('PROFILE_ACCOUNT_NOT_FOUND', 'Profile account not found.');
    }

    if (!profile.profileId) {
      profile = await profileRepository.createBlankProfile(parsedUserId);
    }

    return profile;
  }

  function requireAuditRepository() {
    if (!auditLogRepository || typeof auditLogRepository.create !== 'function') {
      throw errors.internal('PROFILE_AUDIT_UNAVAILABLE', 'Profile update could not be completed.');
    }
  }

  async function cleanManagedAvatar(avatarUrl, failureMessage) {
    if (!MANAGED_AVATAR_PATTERN.test(avatarUrl || '')) return;
    if (!avatarStorage || typeof avatarStorage.deleteAvatarFile !== 'function') return;

    try {
      await avatarStorage.deleteAvatarFile(avatarUrl);
    } catch {
      logger.error(failureMessage);
    }
  }

  // --- Public methods ---

  async function getMyProfile(userId) {
    return toSafeProfileDto(await getExistingProfile(userId));
  }

  // @spec FR-FE03-004 BR-FE03-017 FR-FE03-010
  async function updateMyProfile(userId, input, context = {}) {
    const existing = await getExistingProfile(userId);
    const updates = validateProfileUpdate(input, clock);
    const fields = changedFields(existing, updates);
    if (fields.length === 0) return toSafeProfileDto(existing);

    requireAuditRepository();
    const updated = await profileRepository.updateByUserId(existing.userId, updates, {
      auditLogRepository,
      auditEntry: buildAuditEntry(existing.userId, context, fields),
    });

    return toSafeProfileDto(updated);
  }

  // @spec FR-FE03-008 BR-FE03-017 FR-FE03-010 AC-FE03-014
  async function updateMyAvatar(userId, file, context = {}) {
    const existing = await getExistingProfile(userId);
    validateAvatarUpload(file);
    requireAuditRepository();

    const avatarUrl = await avatarStorage.saveAvatarFile({
      userId: existing.userId,
      buffer: file.buffer,
      mimeType: file.mimeType,
    });

    let updated;

    try {
      updated = await profileRepository.updateAvatarByUserId(existing.userId, avatarUrl, {
        auditLogRepository,
        auditEntry: buildAuditEntry(existing.userId, context, ['avatarUrl']),
      });
    } catch (error) {
      await cleanManagedAvatar(avatarUrl, 'Failed to clean up an uncommitted avatar file.');
      throw error;
    }

    if (existing.avatarUrl && existing.avatarUrl !== avatarUrl) {
      await cleanManagedAvatar(existing.avatarUrl, 'Failed to clean up a replaced avatar file.');
    }

    return toSafeProfileDto(updated);
  }

  return { getMyProfile, updateMyProfile, updateMyAvatar };
}

const defaultProfileService = createProfileService();

module.exports = {
  createProfileService,
  defaultProfileService,
  validateProfileUpdate,
  validateAvatarUpload,
  toSafeProfileDto,
};
