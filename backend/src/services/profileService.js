const errors = require('../utils/safeErrors');
const path = require('path');

// --- Constants ---

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};
const PROTECTED_FIELDS = new Set([
  'password', 'passwordHash', 'role', 'roles', 'roleId',
  'status', 'email', 'membershipStatus', 'membershipApproval',
  'userId', 'profileId',
]);

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

/** Kiểm tra avatarUrl là đường dẫn nội bộ hoặc URL http/https hợp lệ */
function validateAvatarUrl(value, details) {
  if (!value) return;
  if (/^\/uploads\/avatars\/[A-Za-z0-9._-]+$/.test(value)) return;

  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Unsupported protocol');
  } catch {
    details.push({ field: 'avatarUrl', code: 'INVALID_AVATAR_URL', message: 'URL ảnh đại diện phải là đường dẫn http hoặc https hợp lệ.' });
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
function validateProfileUpdate(input = {}, clock = () => new Date()) {
  const protectedFields = Object.keys(input).filter((f) => PROTECTED_FIELDS.has(f));
  if (protectedFields.length > 0) {
    throw errors.badRequest('PROTECTED_FIELD_SUBMITTED', 'Không thể cập nhật các trường được bảo vệ tại đây.', { fields: protectedFields });
  }

  const updates = {
    fullName: cleanString(input.fullName),
    address: cleanString(input.address),
    dateOfBirth: normalizeDateOnly(input.dateOfBirth),
    avatarUrl: cleanString(input.avatarUrl),
    phone: cleanString(input.phone),
  };

  // Giữ undefined cho field không được gửi lên
  for (const key of Object.keys(updates)) {
    if (input[key] === undefined) updates[key] = undefined;
  }

  const details = [];
  validateLength(updates.fullName, 100, 'fullName', 'Full name', details);
  validateLength(updates.address, 255, 'address', 'Address', details);
  validateLength(updates.avatarUrl, 255, 'avatarUrl', 'Avatar URL', details);
  validateAvatarUrl(updates.avatarUrl, details);
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
  return Object.keys(updates).filter((f) => updates[f] !== undefined && updates[f] !== before?.[f]);
}

// --- Factory ---

function createProfileService({
  profileRepository,
  auditLogRepository,
  avatarStorage,
  clock = () => new Date(),
} = {}) {
  if (!profileRepository) profileRepository = require('../repositories/profileRepository');
  if (!auditLogRepository) auditLogRepository = require('../repositories/auditLogRepository');
  if (!avatarStorage) avatarStorage = require('../utils/avatarStorage');

  // --- Internal helpers ---

  /** Load profile theo userId, tạo blank nếu chưa có, ném lỗi nếu user không tồn tại */
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

  /** Ghi audit log, bỏ qua lỗi để không làm gián đoạn luồng chính */
  async function writeAudit(userId, context, fields) {
    if (!auditLogRepository || typeof auditLogRepository.create !== 'function') return;

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

  // --- Public methods ---

  async function getMyProfile(userId) {
    return toSafeProfileDto(await getExistingProfile(userId));
  }

  async function updateMyProfile(userId, input, context = {}) {
    const existing = await getExistingProfile(userId);
    const updates = validateProfileUpdate(input, clock);
    const updated = await profileRepository.updateByUserId(existing.userId, updates);
    const fields = changedFields(existing, updates);

    if (fields.length > 0) await writeAudit(existing.userId, context, fields);

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

    if (avatarUrl !== existing.avatarUrl) await writeAudit(existing.userId, context, ['avatarUrl']);

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
