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

function toPositiveInteger(value, fieldName) {
  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw errors.badRequest('INVALID_ID', `${fieldName} must be a positive integer.`);
  }

  return numberValue;
}

function normalizeBarcode(value) {
  const barcode = String(value || '').trim();

  if (!barcode) {
    throw errors.badRequest('BARCODE_REQUIRED', 'Barcode is required.');
  }

  if (barcode.length > 100) {
    throw errors.badRequest('BARCODE_TOO_LONG', 'Barcode must be at most 100 characters.');
  }

  return barcode;
}

function normalizeLocation(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const location = String(value).trim();

  if (location.length > 100) {
    throw errors.badRequest('LOCATION_TOO_LONG', 'Location must be at most 100 characters.');
  }

  return location || null;
}

function normalizeStatus(status, { manualOnly = false } = {}) {
  const normalized = String(status || '').trim().toUpperCase();
  const allowed = manualOnly ? MANUAL_STATUSES : COPY_STATUSES;

  if (!allowed.includes(normalized)) {
    throw errors.badRequest('INVALID_COPY_STATUS', 'Copy status is not supported.');
  }

  return normalized;
}

function createInventoryService({ inventoryRepository, auditLogRepository } = {}) {
  if (!inventoryRepository) {
    inventoryRepository = require('../repositories/inventoryRepository');
  }

  if (!auditLogRepository) {
    auditLogRepository = require('../repositories/auditLogRepository');
  }

  function requireStaff(actor) {
    if (!hasAnyRole(actor, ['LIBRARIAN', 'ADMIN'])) {
      throw errors.forbidden('STAFF_ROLE_REQUIRED', 'Only librarian or admin can manage inventory.');
    }
  }

  async function writeAudit(context, action, extra = {}) {
    if (!auditLogRepository || typeof auditLogRepository.create !== 'function') {
      return;
    }

    await auditLogRepository.create({
      userId: extra.userId ?? context?.userId ?? null,
      action,
      targetType: extra.targetType || 'BOOK_COPY',
      targetId: extra.targetId ?? null,
      metadata: extra.metadata || null,
      ipAddress: context?.ip || null,
      userAgent: context?.userAgent || null,
    });
  }

  async function ensureBookExists(bookId) {
    const book = await inventoryRepository.findBookById(bookId);

    if (!book) {
      throw errors.notFound('BOOK_NOT_FOUND', 'Book was not found.');
    }

    return book;
  }

  async function ensureCopyExists(copyId) {
    const copy = await inventoryRepository.findCopyById(copyId);

    if (!copy) {
      throw errors.notFound('COPY_NOT_FOUND', 'Book copy was not found.');
    }

    return copy;
  }

  async function ensureBarcodeUnique(barcode, copyId) {
    const existing = await inventoryRepository.findCopyByBarcode(barcode);

    if (existing && (!copyId || existing.copyId !== copyId)) {
      throw errors.conflict('DUPLICATE_BARCODE', 'Barcode is already used by another copy.');
    }
  }

  async function ensureNoActiveConflict(copy) {
    if (copy.status === 'BORROWED' || await inventoryRepository.hasActiveBorrow(copy.copyId)) {
      throw errors.conflict('ACTIVE_BORROW_CONFLICT', 'Borrowed copies must be handled through the return flow.');
    }

    if (copy.status === 'RESERVED' || await inventoryRepository.hasActiveReservation(copy.copyId)) {
      throw errors.conflict('ACTIVE_RESERVATION_CONFLICT', 'Reserved copies must be handled through reservation flow.');
    }
  }

  async function listInventory(filters, actor) {
    requireStaff(actor);

    return inventoryRepository.listInventory({
      bookId: filters.bookId ? toPositiveInteger(filters.bookId, 'Book ID') : undefined,
      status: filters.status ? normalizeStatus(filters.status) : undefined,
      barcode: filters.barcode ? String(filters.barcode).trim() : undefined,
      location: filters.location ? String(filters.location).trim() : undefined,
      page: filters.page ? toPositiveInteger(filters.page, 'Page') : 1,
      limit: filters.limit ? Math.min(toPositiveInteger(filters.limit, 'Limit'), 100) : 20,
    });
  }

  async function getCopy(copyIdInput, actor) {
    requireStaff(actor);
    const copyId = toPositiveInteger(copyIdInput, 'Copy ID');
    return { copy: await ensureCopyExists(copyId) };
  }

  async function getCopyByBarcode(barcodeInput, actor) {
    requireStaff(actor);
    const barcode = normalizeBarcode(barcodeInput);
    const copy = await inventoryRepository.findCopyByBarcode(barcode);

    if (!copy) {
      throw errors.notFound('COPY_NOT_FOUND', 'Book copy was not found.');
    }

    return { copy };
  }

  async function createCopy(bookIdInput, input, actor, context = {}) {
    requireStaff(actor);
    const bookId = toPositiveInteger(bookIdInput, 'Book ID');
    const barcode = normalizeBarcode(input.barcode);
    const status = input.status ? normalizeStatus(input.status, { manualOnly: true }) : 'AVAILABLE';
    const location = normalizeLocation(input.location);

    await ensureBookExists(bookId);
    await ensureBarcodeUnique(barcode);

    const copy = await inventoryRepository.createCopy({ bookId, barcode, status, location });

    await writeAudit(context, 'BOOK_COPY_CREATE', {
      userId: actor.userId,
      targetId: copy.copyId,
      metadata: { bookId, barcode, status, location },
    });

    return { copy };
  }

  async function updateCopy(copyIdInput, input, actor, context = {}) {
    requireStaff(actor);
    const copyId = toPositiveInteger(copyIdInput, 'Copy ID');
    const current = await ensureCopyExists(copyId);
    const patch = {};

    if (input.barcode !== undefined) {
      patch.barcode = normalizeBarcode(input.barcode);
      await ensureBarcodeUnique(patch.barcode, copyId);
    }

    if (input.location !== undefined) {
      patch.location = normalizeLocation(input.location);
    }

    if (input.status !== undefined) {
      patch.status = normalizeStatus(input.status, { manualOnly: true });

      if (patch.status !== current.status) {
        await ensureNoActiveConflict(current);
      }
    }

    const copy = await inventoryRepository.updateCopy(copyId, patch);

    await writeAudit(context, 'BOOK_COPY_UPDATE', {
      userId: actor.userId,
      targetId: copyId,
      metadata: { before: current, patch },
    });

    return { copy };
  }

  async function updateCopyStatus(copyIdInput, input, actor, context = {}) {
    requireStaff(actor);
    const copyId = toPositiveInteger(copyIdInput, 'Copy ID');
    const status = normalizeStatus(input.status, { manualOnly: true });
    const current = await ensureCopyExists(copyId);

    if (status !== current.status) {
      await ensureNoActiveConflict(current);
    }

    const copy = await inventoryRepository.updateCopyStatus(copyId, status);

    await writeAudit(context, 'BOOK_COPY_STATUS_UPDATE', {
      userId: actor.userId,
      targetId: copyId,
      metadata: { oldStatus: current.status, newStatus: status, reason: input.reason || null },
    });

    return { copy };
  }

  async function deactivateCopy(copyIdInput, actor, context = {}) {
    requireStaff(actor);
    const copyId = toPositiveInteger(copyIdInput, 'Copy ID');
    const current = await ensureCopyExists(copyId);

    if (current.status === 'INACTIVE') {
      return { copy: current };
    }

    await ensureNoActiveConflict(current);
    const copy = await inventoryRepository.updateCopyStatus(copyId, 'INACTIVE');

    await writeAudit(context, 'BOOK_COPY_DEACTIVATE', {
      userId: actor.userId,
      targetId: copyId,
      metadata: { oldStatus: current.status, newStatus: 'INACTIVE' },
    });

    return { copy };
  }

  return {
    listInventory,
    getCopy,
    getCopyByBarcode,
    createCopy,
    updateCopy,
    updateCopyStatus,
    deactivateCopy,
  };
}

const defaultInventoryService = createInventoryService();

module.exports = {
  COPY_STATUSES,
  MANUAL_STATUSES,
  createInventoryService,
  defaultInventoryService,
};
