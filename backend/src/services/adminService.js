const adminRepository = require('../repositories/adminRepository');
const auditLogRepository = require('../repositories/auditLogRepository');
const errors = require('../utils/safeErrors');

const RESOURCE_NAMES = new Set(['authors', 'publishers', 'categories']);
const BORROW_STATUSES = new Set(['REQUESTED', 'BORROWED', 'RETURNED', 'OVERDUE', 'LOST', 'DAMAGED']);
const REQUEST_STATUSES = new Set(['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED']);
const INVALID_AUDIT_VALUE = Symbol('INVALID_AUDIT_VALUE');
const USER_TARGET_TYPES = new Set(['USER', 'USERS', 'ACCOUNT']);
const USER_CHANGED_FIELDS = new Set([
  'email', 'fullName', 'phone', 'address', 'department', 'specialization', 'status',
]);
const PROFILE_CHANGED_FIELDS = new Set([
  'fullName', 'address', 'dateOfBirth', 'avatarUrl', 'phone',
]);
const BOOK_COPY_CHANGED_FIELDS = new Set(['barcode', 'location', 'status']);
const EMPTY_DETAIL_ACTIONS = new Set([
  'AUTH_PASSWORD_CHANGE_FAILURE', 'AUTH_VERIFY_EMAIL', 'AUTH_LOGIN_LOCKED',
  'AUTH_ACCOUNT_AUTO_UNLOCKED', 'AUTH_LOGIN_INACTIVE', 'AUTH_LOGIN_FAILURE',
  'AUTH_LOGIN_SUCCESS', 'AUTH_REFRESH_TOKEN', 'AUTH_LOGOUT',
  'AUTH_PASSWORD_CHANGE_SUCCESS', 'AUTH_CHANGE_PASSWORD_OTP_REQUESTED',
  'AUTH_PASSWORD_RESET_SUCCESS', 'AUTH_REGISTER', 'AUTH_RESEND_VERIFICATION',
  'AUTH_PASSWORD_RESET_REQUEST', 'AUTH_LOGIN_ATTEMPT',
  'AUTH_ACCOUNT_SETUP_COMPLETE', 'USER_ACCOUNT_SETUP_RESEND',
]);
const REPORT_TYPES_BY_ACTION = {
  REPORT_BORROWING_VIEW: 'BORROWING',
  REPORT_INVENTORY_VIEW: 'INVENTORY',
  REPORT_USERS_VIEW: 'USERS',
};
const REPORT_TYPES_BY_PATH = {
  '/api/reports/borrowing': 'BORROWING',
  '/api/reports/inventory': 'INVENTORY',
  '/api/reports/users': 'USERS',
};
const SENSITIVE_AUDIT_KEY = /password|hash|token|otp|authorization|cookie|secret|session|credential|api[-_ ]?key|setup[-_ ]?link|reset[-_ ]?link/i;

function validationError(field, message) {
  return errors.badRequest('VALIDATION_ERROR', 'Invalid request.', [{ field, message }]);
}

function normalizeAuditInteger(value, { field, defaultValue, min = 1, max } = {}) {
  if (value === undefined || value === null) return defaultValue;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || (max !== undefined && parsed > max)) {
    throw validationError(field, `${field} is invalid.`);
  }
  return parsed;
}

function normalizeAuditText(value, field) {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  if (text.length < 1 || text.length > 100) {
    throw validationError(field, `${field} must be between 1 and 100 characters.`);
  }
  return text;
}

function normalizeAuditDate(value, field) {
  if (value === undefined || value === null) return undefined;
  const text = String(value);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? new Date(`${text}T00:00:00.000Z`)
    : new Date(Number.NaN);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text) {
    throw validationError(field, `${field} must use YYYY-MM-DD.`);
  }
  return text;
}

function normalizeAuditListQuery(query = {}) {
  const normalized = {
    page: normalizeAuditInteger(query.page, { field: 'page', defaultValue: 1 }),
    limit: normalizeAuditInteger(query.limit, {
      field: 'limit',
      defaultValue: 20,
      max: 100,
    }),
    q: normalizeAuditText(query.q, 'q'),
    action: normalizeAuditText(query.action, 'action'),
    actorId: normalizeAuditInteger(query.actorId, {
      field: 'actorId',
      defaultValue: undefined,
    }),
    from: normalizeAuditDate(query.from, 'from'),
    to: normalizeAuditDate(query.to, 'to'),
  };

  if (normalized.from && normalized.to && normalized.from > normalized.to) {
    throw validationError('to', 'From date must be before or equal to to date.');
  }

  return normalized;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseMetadataObject(rawMetadata) {
  if (typeof rawMetadata !== 'string' || rawMetadata.trim() === '') return null;
  try {
    const parsed = JSON.parse(rawMetadata);
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function readText(value, { optional = false, max = 255 } = {}) {
  if (value === undefined || value === null) {
    return optional ? undefined : INVALID_AUDIT_VALUE;
  }
  if (typeof value !== 'string') return INVALID_AUDIT_VALUE;
  const text = value.trim();
  if (!text || text.length > max) return INVALID_AUDIT_VALUE;
  return text;
}

function readPositiveInteger(value, { optional = false } = {}) {
  if (value === undefined || value === null) {
    return optional ? undefined : INVALID_AUDIT_VALUE;
  }
  return Number.isInteger(value) && value > 0 ? value : INVALID_AUDIT_VALUE;
}

function readNonNegativeNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : INVALID_AUDIT_VALUE;
}

function readBoolean(value) {
  return typeof value === 'boolean' ? value : INVALID_AUDIT_VALUE;
}

function readIsoDate(value) {
  if (typeof value !== 'string') return INVALID_AUDIT_VALUE;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? INVALID_AUDIT_VALUE : date.toISOString();
}

function readPositiveIntegerArray(value) {
  if (!Array.isArray(value)) return INVALID_AUDIT_VALUE;
  const projected = [];
  for (const item of value.slice(0, 100)) {
    const parsed = readPositiveInteger(item);
    if (parsed === INVALID_AUDIT_VALUE) return INVALID_AUDIT_VALUE;
    projected.push(parsed);
  }
  return projected;
}

function readChangedFields(value, allowedFields) {
  if (!Array.isArray(value)) return INVALID_AUDIT_VALUE;
  const projected = [];
  for (const item of value.slice(0, 100)) {
    const field = readText(item, { max: 50 });
    if (field === INVALID_AUDIT_VALUE) return INVALID_AUDIT_VALUE;
    if (allowedFields.has(field) && !projected.includes(field)) projected.push(field);
  }
  return projected;
}

function hasProvidedText(value) {
  if (value === undefined || value === null || value === '') return false;
  return typeof value === 'string' ? value.trim().length > 0 : INVALID_AUDIT_VALUE;
}

function buildAuditDetails(fields) {
  const output = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === INVALID_AUDIT_VALUE) return null;
    if (value !== undefined) output[key] = value;
  }
  return output;
}

function stripSensitiveKeys(value) {
  if (Array.isArray(value)) return value.slice(0, 100).map(stripSensitiveKeys);
  if (!isPlainObject(value)) return value;
  const output = {};
  for (const [key, item] of Object.entries(value)) {
    if (!SENSITIVE_AUDIT_KEY.test(key)) output[key] = stripSensitiveKeys(item);
  }
  return output;
}

function projectAuditDetails(action, rawMetadata) {
  if (EMPTY_DETAIL_ACTIONS.has(action)) return {};
  if (REPORT_TYPES_BY_ACTION[action]) return { reportType: REPORT_TYPES_BY_ACTION[action] };

  const metadata = parseMetadataObject(rawMetadata);
  if (!metadata) return {};
  let projected;

  switch (action) {
    case 'USER_CREATE':
      projected = buildAuditDetails({ roleName: readText(metadata.roleName, { max: 100 }) });
      break;
    case 'USER_UPDATE':
      projected = buildAuditDetails({
        changedFields: readChangedFields(
          metadata.changedFields ?? metadata.fields,
          USER_CHANGED_FIELDS
        ),
      });
      break;
    case 'USER_DEACTIVATE':
      projected = buildAuditDetails({
        newStatus: readText(metadata.newStatus ?? metadata.status, { max: 50 }),
      });
      break;
    case 'USER_ROLE_ASSIGN':
    case 'USER_ROLE_REVOKE':
      projected = buildAuditDetails({
        roleId: readPositiveInteger(metadata.roleId),
        roleName: readText(metadata.roleName, { max: 100 }),
      });
      break;
    case 'BORROW_REQUEST_CREATE':
      projected = buildAuditDetails({ copyIds: readPositiveIntegerArray(metadata.copyIds) });
      break;
    case 'BORROW_REQUEST_APPROVE':
      projected = buildAuditDetails({
        memberUserId: readPositiveInteger(metadata.memberUserId ?? metadata.approvedMemberId),
        copyIds: readPositiveIntegerArray(metadata.copyIds),
        notesProvided: hasProvidedText(metadata.notes),
      });
      break;
    case 'BORROW_REQUEST_REJECT':
      projected = buildAuditDetails({
        memberUserId: readPositiveInteger(metadata.memberUserId ?? metadata.rejectedMemberId),
        reasonProvided: hasProvidedText(metadata.reason),
      });
      break;
    case 'BORROW_DETAIL_RETURN':
      projected = buildAuditDetails({
        requestId: readPositiveInteger(metadata.requestId),
        memberId: readPositiveInteger(metadata.memberId),
        copyId: readPositiveInteger(metadata.copyId),
        condition: readText(metadata.condition, { max: 50 }),
        overdueDays: readNonNegativeNumber(metadata.overdueDays),
        notesProvided: hasProvidedText(metadata.notes),
      });
      break;
    case 'BORROW_DETAIL_RENEW':
      projected = buildAuditDetails({
        requestId: readPositiveInteger(metadata.requestId),
        memberId: readPositiveInteger(metadata.memberId),
        copyId: readPositiveInteger(metadata.copyId),
        newDueDate: readIsoDate(metadata.newDueDate),
        notesProvided: hasProvidedText(metadata.notes),
      });
      break;
    case 'RESERVATION_FULFILL':
      projected = buildAuditDetails({
        requestId: readPositiveInteger(metadata.requestId),
        copyId: readPositiveInteger(metadata.copyId),
        memberUserId: readPositiveInteger(metadata.memberUserId),
      });
      break;
    case 'RESERVATION_CREATE':
    case 'RESERVATION_EXPIRE':
      projected = buildAuditDetails({ copyId: readPositiveInteger(metadata.copyId) });
      break;
    case 'RESERVATION_CANCEL':
      projected = buildAuditDetails({
        copyId: readPositiveInteger(metadata.copyId),
        reasonProvided: hasProvidedText(metadata.reason),
      });
      break;
    case 'RESERVATION_NOTIFY_FAILED':
      projected = buildAuditDetails({ code: readText(metadata.code, { max: 100 }) });
      break;
    case 'RESERVATION_PROCESS':
      projected = buildAuditDetails({
        copyId: readPositiveInteger(metadata.copyId),
        selectedUserId: readPositiveInteger(metadata.selectedUserId),
        expiresAt: readIsoDate(metadata.expiresAt),
      });
      break;
    case 'FINE_CALCULATE':
      projected = buildAuditDetails({
        borrowDetailId: readPositiveInteger(metadata.borrowDetailId),
        memberId: readPositiveInteger(metadata.memberId),
        overdueDays: readNonNegativeNumber(metadata.overdueDays),
        amount: readNonNegativeNumber(metadata.amount),
      });
      break;
    case 'FINE_COLLECT':
      projected = buildAuditDetails({
        collectedAmount: readNonNegativeNumber(metadata.collectedAmount),
        fullyCollected: readBoolean(metadata.fullyCollected),
        noteProvided: hasProvidedText(metadata.note),
      });
      break;
    case 'FINE_MARK_PAID':
      projected = buildAuditDetails({
        amount: readNonNegativeNumber(metadata.amount),
        noteProvided: hasProvidedText(metadata.note),
      });
      break;
    case 'FINE_WAIVE':
    case 'FINE_CANCEL':
      projected = buildAuditDetails({ reasonProvided: hasProvidedText(metadata.reason) });
      break;
    case 'BOOK_COPY_CREATE':
      projected = buildAuditDetails({
        bookId: readPositiveInteger(metadata.bookId),
        barcode: readText(metadata.barcode, { max: 100 }),
        status: readText(metadata.status, { max: 50 }),
        location: readText(metadata.location, { optional: true, max: 100 }),
      });
      break;
    case 'BOOK_COPY_UPDATE': {
      if (!isPlainObject(metadata.before) || !isPlainObject(metadata.patch)) return {};
      const statusChanged = Object.prototype.hasOwnProperty.call(metadata.patch, 'status')
        && metadata.patch.status !== metadata.before.status;
      projected = buildAuditDetails({
        bookId: readPositiveInteger(metadata.before.bookId),
        changedFields: readChangedFields(Object.keys(metadata.patch), BOOK_COPY_CHANGED_FIELDS),
        previousStatus: statusChanged
          ? readText(metadata.before.status, { max: 50 })
          : undefined,
        newStatus: statusChanged
          ? readText(metadata.patch.status, { max: 50 })
          : undefined,
      });
      break;
    }
    case 'BOOK_COPY_STATUS_UPDATE':
      projected = buildAuditDetails({
        previousStatus: readText(metadata.previousStatus ?? metadata.oldStatus, { max: 50 }),
        newStatus: readText(metadata.newStatus, { max: 50 }),
        reasonProvided: hasProvidedText(metadata.reason),
      });
      break;
    case 'BOOK_COPY_DEACTIVATE':
      projected = buildAuditDetails({
        previousStatus: readText(metadata.previousStatus ?? metadata.oldStatus, { max: 50 }),
        newStatus: readText(metadata.newStatus, { max: 50 }),
      });
      break;
    case 'MEMBERSHIP_APPLICATION_SUBMITTED':
    case 'MEMBERSHIP_APPLICATION_APPROVED':
      projected = buildAuditDetails({
        userId: readPositiveInteger(metadata.userId),
        status: readText(metadata.status, { max: 50 }),
      });
      break;
    case 'MEMBERSHIP_APPLICATION_REJECTED':
      projected = buildAuditDetails({
        userId: readPositiveInteger(metadata.userId),
        status: readText(metadata.status, { max: 50 }),
        reasonProvided: hasProvidedText(metadata.reason),
      });
      break;
    case 'PROFILE_UPDATE':
      projected = buildAuditDetails({
        changedFields: readChangedFields(
          metadata.changedFields ?? metadata.fields,
          PROFILE_CHANGED_FIELDS
        ),
      });
      break;
    case 'REPORT_ACCESS_DENIED': {
      const rawPath = readText(metadata.path, { optional: true, max: 200 });
      if (rawPath === INVALID_AUDIT_VALUE) return {};
      projected = buildAuditDetails({
        code: readText(metadata.code, { max: 100 }),
        statusCode: readNonNegativeNumber(metadata.statusCode),
        method: readText(metadata.method, { optional: true, max: 20 }),
        reportType: rawPath ? REPORT_TYPES_BY_PATH[rawPath] : undefined,
      });
      break;
    }
    case 'NOTIFICATION_REQUEST_CREATE': {
      const sourceEntityType = readText(metadata.sourceEntityType, { optional: true, max: 50 });
      if (sourceEntityType === INVALID_AUDIT_VALUE) return {};
      projected = buildAuditDetails({
        type: readText(metadata.type, { max: 100 }),
        channel: readText(metadata.channel, { max: 50 }),
        sourceFeature: readText(metadata.sourceFeature, { optional: true, max: 50 }),
        sourceEntityType,
        sourceEntityId: sourceEntityType === 'AuthToken'
          ? undefined
          : readPositiveInteger(metadata.sourceEntityId, { optional: true }),
      });
      break;
    }
    case 'NOTIFICATION_RETRY':
      projected = buildAuditDetails({
        previousStatus: readText(metadata.previousStatus ?? metadata.fromStatus, { max: 50 }),
        newStatus: readText(metadata.newStatus ?? metadata.toStatus, { max: 50 }),
      });
      break;
    case 'NOTIFICATION_PROCESS_PENDING':
      projected = buildAuditDetails({
        processed: readNonNegativeNumber(metadata.processed),
        failed: readNonNegativeNumber(metadata.failed),
      });
      break;
    default:
      return {};
  }

  return projected ? stripSensitiveKeys(projected) : {};
}

function projectAuditLog(row) {
  const targetType = typeof row.targetType === 'string' ? row.targetType.trim() : null;
  const isUserTarget = USER_TARGET_TYPES.has(String(targetType || '').toUpperCase());
  return {
    logId: row.logId,
    action: row.action,
    actor: {
      userId: row.userId ?? null,
      email: row.actorEmail ?? null,
      fullName: row.actorName ?? null,
    },
    target: {
      type: targetType,
      id: row.targetId ?? null,
      label: isUserTarget ? (row.targetEmail || row.targetName || null) : null,
    },
    details: projectAuditDetails(row.action, row.metadata),
    ipAddress: row.ipAddress ?? null,
    createdAt: row.createdAt,
  };
}

function cleanText(value, max = 120) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length > max) {
    throw errors.badRequest('INVALID_TEXT_LENGTH', `Text must be at most ${max} characters.`);
  }
  return text;
}

function positiveInt(value, fieldName = 'ID') {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw errors.badRequest('INVALID_ID', `${fieldName} must be a positive integer.`);
  }
  return numberValue;
}

function optionalDate(value, fieldName) {
  const text = cleanText(value, 20);
  if (!text) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(new Date(`${text}T00:00:00`).getTime())) {
    throw errors.badRequest('INVALID_DATE', `${fieldName} must use YYYY-MM-DD.`);
  }
  return text;
}

function normalizeResource(resource) {
  const value = String(resource || '').toLowerCase();
  if (!RESOURCE_NAMES.has(value) || !adminRepository.getResourceConfig(value)) {
    throw errors.notFound('ADMIN_RESOURCE_NOT_FOUND', 'Admin library resource not found.');
  }
  return value;
}

function normalizeName(body = {}) {
  const name = cleanText(body.name, 100);
  if (!name) {
    throw errors.badRequest('NAME_REQUIRED', 'Name is required.');
  }
  return name;
}

async function getDashboard() {
  return adminRepository.getDashboard();
}

// @spec FR-FE11-033, BR-FE11-018, BR-FE11-026, AC-FE11-018
async function listAuditLogs(query = {}) {
  const filters = normalizeAuditListQuery(query);
  const result = await auditLogRepository.listAuditLogs(filters);
  return {
    data: result.data.map(projectAuditLog),
    pagination: result.pagination,
  };
}

async function listBooks(filters = {}) {
  return { data: await adminRepository.listBooks({
    q: cleanText(filters.q, 100),
    status: cleanText(filters.status, 20).toUpperCase(),
  }) };
}

async function listResource(resource, filters = {}) {
  const normalizedResource = normalizeResource(resource);
  return { data: await adminRepository.listResource(normalizedResource, { q: cleanText(filters.q, 100) }) };
}

async function createResource(resource, body = {}) {
  const normalizedResource = normalizeResource(resource);
  return { data: await adminRepository.createResource(normalizedResource, normalizeName(body)) };
}

async function updateResource(resource, idInput, body = {}) {
  const normalizedResource = normalizeResource(resource);
  const id = positiveInt(idInput);
  return { data: await adminRepository.updateResource(normalizedResource, id, normalizeName(body)) };
}

async function deactivateResource(resource, idInput) {
  const normalizedResource = normalizeResource(resource);
  const id = positiveInt(idInput);

  try {
    const affectedRows = await adminRepository.deactivateResource(normalizedResource, id);
    if (!affectedRows) {
      throw errors.notFound('ADMIN_RESOURCE_ITEM_NOT_FOUND', 'Item not found.');
    }
    return { deactivated: true, data: { id, status: 'INACTIVE' } };
  } catch (error) {
    if (error.number === 547) {
      throw errors.conflict('RESOURCE_IN_USE', 'This item is being used and cannot be deactivated.');
    }
    throw error;
  }
}

async function listBorrowings(filters = {}) {
  const status = cleanText(filters.status, 20).toUpperCase();
  if (status && !BORROW_STATUSES.has(status)) {
    throw errors.badRequest('INVALID_BORROW_STATUS', 'Borrowing status is invalid.');
  }
  return { data: await adminRepository.listBorrowings({ q: cleanText(filters.q, 100), status }) };
}

async function listRequests(filters = {}) {
  const status = cleanText(filters.status, 20).toUpperCase();
  if (status && !REQUEST_STATUSES.has(status)) {
    throw errors.badRequest('INVALID_REQUEST_STATUS', 'Request status is invalid.');
  }

  const fromDate = optionalDate(filters.fromDate, 'From date');
  const toDate = optionalDate(filters.toDate, 'To date');
  if (fromDate && toDate && fromDate > toDate) {
    throw errors.badRequest('INVALID_DATE_RANGE', 'From date cannot be after to date.');
  }

  return {
    data: await adminRepository.listRequests({
      q: cleanText(filters.q, 100),
      status,
      fromDate,
      toDate,
    }),
  };
}

module.exports = {
  getDashboard,
  listAuditLogs,
  listBooks,
  listResource,
  createResource,
  updateResource,
  deactivateResource,
  listBorrowings,
  listRequests,
};
