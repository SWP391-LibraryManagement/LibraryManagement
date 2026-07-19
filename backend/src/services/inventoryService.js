const errors = require('../utils/safeErrors');

const COPY_STATUSES = ['AVAILABLE', 'BORROWED', 'RESERVED', 'DAMAGED', 'LOST', 'INACTIVE'];
const MANUAL_STATUSES = ['AVAILABLE', 'DAMAGED', 'LOST', 'INACTIVE'];

function normalizeRole(role) {
  return String(role || '').toUpperCase();
}

function hasAnyRole(user, allowedRoles) {
  const currentRoles = Array.isArray(user?.roles) ? user.roles.map(normalizeRole) : [];
  return allowedRoles.map(normalizeRole).some((role) => currentRoles.includes(role));
}

function toPositiveInteger(value, fieldName, { defaultValue } = {}) {
  if (value === undefined || value === null) {
    if (defaultValue !== undefined) return defaultValue;
    throw errors.badRequest('INVALID_ID', `${fieldName} must be a positive integer.`);
  }

  const text = String(value);
  if (!text || !/^\d+$/.test(text)) {
    throw errors.badRequest('VALIDATION_ERROR', `${fieldName} must be a positive integer.`);
  }

  const numberValue = Number(text);
  if (!Number.isSafeInteger(numberValue) || numberValue <= 0) {
    throw errors.badRequest('VALIDATION_ERROR', `${fieldName} must be a positive integer.`);
  }

  return numberValue;
}

function normalizeBarcode(value) {
  const barcode = typeof value === 'string' ? value.trim() : '';
  if (!barcode) throw errors.badRequest('BARCODE_REQUIRED', 'Barcode is required.');
  if (barcode.length > 100) throw errors.badRequest('BARCODE_TOO_LONG', 'Barcode must be at most 100 characters.');
  return barcode;
}

function normalizeLocation(value, { requiredWhenProvided = false } = {}) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw errors.badRequest('INVALID_LOCATION', 'Location must be a string.');

  const location = value.trim();
  if (requiredWhenProvided && !location) {
    throw errors.badRequest('LOCATION_REQUIRED', 'Location cannot be blank when provided.');
  }
  if (location.length > 100) throw errors.badRequest('LOCATION_TOO_LONG', 'Location must be at most 100 characters.');
  if (/[\u0000-\u001F\u007F]/.test(location)) {
    throw errors.badRequest('INVALID_LOCATION', 'Location cannot contain control characters.');
  }
  return location || null;
}

function normalizeStatus(status, { manualOnly = false } = {}) {
  const normalized = typeof status === 'string' ? status.trim().toUpperCase() : '';
  const allowed = manualOnly ? MANUAL_STATUSES : COPY_STATUSES;
  if (!allowed.includes(normalized)) throw errors.badRequest('INVALID_COPY_STATUS', 'Copy status is not supported.');
  return normalized;
}

function normalizeReason(value) {
  if (typeof value !== 'string') throw errors.badRequest('REASON_REQUIRED', 'A reason is required.');
  const reason = value.trim();
  if (!reason || reason.length > 500) {
    throw errors.badRequest('REASON_REQUIRED', 'Reason must contain 1 to 500 characters.');
  }
  return reason;
}

function normalizeIfMatch(value) {
  const version = Array.isArray(value) ? value[0] : value;
  if (typeof version !== 'string' || !version.trim()) {
    throw errors.conflict('STALE_COPY_STATE', 'Copy version is missing or stale. Reload before retrying.');
  }
  return version.trim().replace(/^W\//, '').replace(/^"|"$/g, '');
}

function safeCopy(copy) {
  if (!copy) return null;
  const result = {
    copyId: copy.copyId,
    bookId: copy.bookId,
    barcode: copy.barcode,
    status: copy.status,
    location: copy.location ?? null,
    version: copy.version,
  };
  if (copy.book) {
    result.book = {
      bookId: copy.book.bookId,
      title: copy.book.title,
      isbn: copy.book.isbn,
      publishYear: copy.book.publishYear,
      status: copy.book.status,
      authorName: copy.book.authorName,
      categoryName: copy.book.categoryName,
      publisherName: copy.book.publisherName,
    };
  }
  return result;
}

function createInventoryService({ inventoryRepository, auditLogRepository } = {}) {
  inventoryRepository ||= require('../repositories/inventoryRepository');
  auditLogRepository ||= require('../repositories/auditLogRepository');

  // @spec FR-FE06-020
  function requireStaff(actor) {
    if (!hasAnyRole(actor, ['LIBRARIAN', 'ADMIN'])) {
      throw errors.forbidden('STAFF_ROLE_REQUIRED', 'Only librarian or admin can manage inventory.');
    }
  }

  async function writeAudit(context, action, extra = {}, transaction) {
    if (!auditLogRepository || typeof auditLogRepository.create !== 'function') return;
    await auditLogRepository.create({
      userId: extra.userId ?? context?.userId ?? null,
      action,
      targetType: extra.targetType || 'BOOK_COPY',
      targetId: extra.targetId ?? null,
      metadata: extra.metadata || null,
      ipAddress: context?.ip || null,
      userAgent: context?.userAgent || null,
      transaction,
    });
  }

  async function ensureBookExists(bookId) {
    const book = await inventoryRepository.findBookById(bookId);
    if (!book) throw errors.notFound('BOOK_NOT_FOUND', 'Book was not found.');
    return book;
  }

  async function ensureCopyExists(copyId) {
    const copy = await inventoryRepository.findCopyById(copyId);
    if (!copy) throw errors.notFound('COPY_NOT_FOUND', 'Book copy was not found.');
    return copy;
  }

  async function ensureBarcodeUnique(barcode, copyId) {
    const existing = await inventoryRepository.findCopyByBarcode(barcode);
    if (existing && (!copyId || Number(existing.copyId) !== Number(copyId))) {
      throw errors.conflict('DUPLICATE_BARCODE', 'Barcode is already used by another copy.');
    }
  }

  async function ensureNoActiveConflict(copy) {
    if (copy.status === 'BORROWED' || await inventoryRepository.hasActiveBorrow(copy.copyId)) {
      throw errors.conflict('ACTIVE_BORROW_CONFLICT', 'Borrowed copies must be handled through the return flow.');
    }
    if (copy.status === 'RESERVED' || await inventoryRepository.hasActiveReservation(copy.copyId)) {
      throw errors.conflict('RESERVATION_STATE_CONFLICT', 'Reserved copies must be handled through the reservation flow.');
    }
  }

  async function ensureVersion(current, ifMatch) {
    const expected = normalizeIfMatch(ifMatch);
    if (!current.version || current.version !== expected) {
      throw errors.conflict('STALE_COPY_STATE', 'Copy version is missing or stale. Reload before retrying.');
    }
    return expected;
  }

  async function runMutation(work, { copyId, before, created } = {}) {
    if (typeof inventoryRepository.withTransaction === 'function') {
      return inventoryRepository.withTransaction(work);
    }

    try {
      return await work(undefined);
    } catch (error) {
      const createdId = typeof created === 'function' ? created() : created;
      if (createdId && typeof inventoryRepository.removeCopy === 'function') {
        await inventoryRepository.removeCopy(createdId);
      } else if (copyId && before && typeof inventoryRepository.restoreCopy === 'function') {
        await inventoryRepository.restoreCopy(copyId, before);
      }
      throw error;
    }
  }

  // @spec FR-FE06-001 FR-FE06-008 FR-FE06-009 FR-FE06-024
  async function listInventory(filters = {}, actor) {
    requireStaff(actor);
    const page = filters.page === undefined ? 1 : toPositiveInteger(filters.page, 'Page');
    const limit = filters.limit === undefined ? 20 : toPositiveInteger(filters.limit, 'Limit');
    if (limit > 100) throw errors.badRequest('VALIDATION_ERROR', 'Limit must be between 1 and 100.');
    const normalized = {
      bookId: filters.bookId === undefined ? undefined : toPositiveInteger(filters.bookId, 'Book ID'),
      status: filters.status === undefined ? undefined : normalizeStatus(filters.status),
      barcode: filters.barcode === undefined ? undefined : normalizeBarcode(filters.barcode),
      location: filters.location === undefined ? undefined : normalizeLocation(filters.location, { requiredWhenProvided: true }),
      page,
      limit,
    };
    const result = await inventoryRepository.listInventory(normalized);
    const totalItems = Number(result.pagination?.total || 0);
    const countsByStatus = typeof inventoryRepository.countInventoryByStatus === 'function'
      ? await inventoryRepository.countInventoryByStatus(normalized)
      : (result.copies || []).reduce((counts, copy) => {
          counts[copy.status] = (counts[copy.status] || 0) + 1;
          return counts;
        }, {});
    for (const status of COPY_STATUSES) countsByStatus[status] ||= 0;
    return {
      items: (result.copies || []).map(safeCopy),
      countsByStatus,
      page,
      limit,
      totalItems,
      totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / limit),
    };
  }

  // @spec FR-FE06-002 FR-FE06-003 FR-FE06-009
  async function getCopy(copyIdInput, actor) {
    requireStaff(actor);
    return { copy: safeCopy(await ensureCopyExists(toPositiveInteger(copyIdInput, 'Copy ID'))) };
  }

  // @spec FR-FE06-002 FR-FE06-003 FR-FE06-009
  async function getCopyByBarcode(barcodeInput, actor) {
    requireStaff(actor);
    const barcode = normalizeBarcode(barcodeInput);
    const copy = await inventoryRepository.findCopyByBarcode(barcode);
    if (!copy) throw errors.notFound('COPY_NOT_FOUND', 'Book copy was not found.');
    return { copy: safeCopy(copy) };
  }

  // @spec FR-FE06-004 FR-FE06-005 FR-FE06-011 FR-FE06-012 FR-FE06-022
  async function createCopy(bookIdInput, input = {}, actor, context = {}) {
    requireStaff(actor);
    const bookId = toPositiveInteger(bookIdInput, 'Book ID');
    const barcode = normalizeBarcode(input.barcode);
    const location = normalizeLocation(input.location, { requiredWhenProvided: true });
    const book = await ensureBookExists(bookId);
    if (book.status !== 'ACTIVE') throw errors.conflict('INACTIVE_PARENT_BOOK', 'A copy cannot be made available under an inactive book.');
    await ensureBarcodeUnique(barcode);

    let createdId;
    const result = await runMutation(async (transaction) => {
      const copy = await inventoryRepository.createCopy({ bookId, barcode, status: 'AVAILABLE', location }, transaction);
      createdId = copy.copyId;
      await writeAudit(context, 'BOOK_COPY_CREATE', {
        userId: actor.userId,
        targetId: copy.copyId,
        metadata: { bookId, barcode, status: 'AVAILABLE', location },
      }, transaction);
      return { copy: safeCopy(copy) };
    }, { created: () => createdId });
    return result;
  }

  // @spec FR-FE06-005 FR-FE06-006 FR-FE06-013 FR-FE06-016 FR-FE06-019 FR-FE06-021
  async function updateCopy(copyIdInput, input = {}, actor, context = {}, ifMatch) {
    requireStaff(actor);
    const copyId = toPositiveInteger(copyIdInput, 'Copy ID');
    const current = await ensureCopyExists(copyId);
    await ensureVersion(current, ifMatch);
    if (Object.prototype.hasOwnProperty.call(input, 'status')) {
      throw errors.badRequest('STATUS_OWNERSHIP', 'Copy status must use the dedicated status command.');
    }
    const patch = {};
    if (input.barcode !== undefined) {
      patch.barcode = normalizeBarcode(input.barcode);
      await ensureBarcodeUnique(patch.barcode, copyId);
    }
    if (input.location !== undefined) patch.location = normalizeLocation(input.location, { requiredWhenProvided: true });

    return runMutation(async (transaction) => {
      const copy = await inventoryRepository.updateCopy(copyId, patch, current.version, transaction);
      await writeAudit(context, 'BOOK_COPY_UPDATE', {
        userId: actor.userId,
        targetId: copyId,
        metadata: { before: safeCopy(current), patch },
      }, transaction);
      return { copy: safeCopy(copy) };
    }, { copyId, before: current });
  }

  // @spec FR-FE06-006 FR-FE06-007 FR-FE06-013 FR-FE06-014 FR-FE06-015 FR-FE06-016 FR-FE06-023
  async function updateCopyStatus(copyIdInput, input = {}, actor, context = {}, ifMatch) {
    requireStaff(actor);
    const copyId = toPositiveInteger(copyIdInput, 'Copy ID');
    const status = normalizeStatus(input.status, { manualOnly: true });
    const reason = normalizeReason(input.reason);
    const current = await ensureCopyExists(copyId);
    await ensureVersion(current, ifMatch);
    const book = await ensureBookExists(current.bookId);
    if (status === 'AVAILABLE' && book.status !== 'ACTIVE') {
      throw errors.conflict('INACTIVE_PARENT_BOOK', 'A copy cannot be made available under an inactive book.');
    }
    if (status !== current.status) await ensureNoActiveConflict(current);

    return runMutation(async (transaction) => {
      const copy = await inventoryRepository.updateCopyStatus(copyId, status, current.version, transaction);
      await writeAudit(context, 'BOOK_COPY_STATUS_UPDATE', {
        userId: actor.userId,
        targetId: copyId,
        metadata: { oldStatus: current.status, newStatus: status, reason },
      }, transaction);
      return { copy: safeCopy(copy) };
    }, { copyId, before: current });
  }

  // @spec FR-FE06-008 FR-FE06-010 FR-FE06-017 FR-FE06-018 FR-FE06-019 FR-FE06-023
  async function deactivateCopy(copyIdInput, input = {}, actor, context = {}, ifMatch) {
    requireStaff(actor);
    const copyId = toPositiveInteger(copyIdInput, 'Copy ID');
    const reason = normalizeReason(input.reason);
    const current = await ensureCopyExists(copyId);
    await ensureVersion(current, ifMatch);
    if (current.status === 'INACTIVE') return { changed: false, copy: safeCopy(current) };
    await ensureNoActiveConflict(current);

    return runMutation(async (transaction) => {
      const copy = await inventoryRepository.updateCopyStatus(copyId, 'INACTIVE', current.version, transaction);
      await writeAudit(context, 'BOOK_COPY_DEACTIVATE', {
        userId: actor.userId,
        targetId: copyId,
        metadata: { oldStatus: current.status, newStatus: 'INACTIVE', reason },
      }, transaction);
      return { changed: true, copy: safeCopy(copy) };
    }, { copyId, before: current });
  }

  return { listInventory, getCopy, getCopyByBarcode, createCopy, updateCopy, updateCopyStatus, deactivateCopy };
}

const defaultInventoryService = createInventoryService();

module.exports = { COPY_STATUSES, MANUAL_STATUSES, createInventoryService, defaultInventoryService };
