const errors = require('../utils/safeErrors');
const { overdueDaysBetween } = require('../utils/libraryBusinessTime');

const DAILY_FINE_RATE = 5000;
const OVERDUE_REASON = 'OVERDUE';
const FINE_STATUSES = new Set(['UNPAID', 'PAID', 'WAIVED', 'CANCELLED']);

function normalizeRole(role) {
  return String(role || '').toUpperCase();
}

function hasAnyRole(user, allowedRoles) {
  const currentRoles = Array.isArray(user?.roles) ? user.roles.map(normalizeRole) : [];
  return allowedRoles.map(normalizeRole).some((role) => currentRoles.includes(role));
}

function hasOwn(value, property) {
  return Object.prototype.hasOwnProperty.call(value || {}, property);
}

function toPositiveInteger(value, fieldName) {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw errors.badRequest('INVALID_ID', `${fieldName} must be a positive integer.`);
  }
  return numberValue;
}

function parseListInteger(value, defaultValue, fieldName, maximum) {
  if (value === undefined) return defaultValue;

  const raw = String(value);
  const parsed = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isInteger(parsed) || parsed < 1 || (maximum && parsed > maximum)) {
    throw errors.badRequest('INVALID_FINE_FILTER', `${fieldName} is invalid.`);
  }
  return parsed;
}

function normalizeListFilters(filters = {}, { allowSearch = true, userId } = {}) {
  // @spec FR-FE09-016 - reject invalid list controls before repository access.
  const page = parseListInteger(filters.page, 1, 'Page');
  const limit = parseListInteger(filters.limit, 20, 'Limit', 100);
  let status;

  if (filters.status !== undefined) {
    status = String(filters.status);
    if (!FINE_STATUSES.has(status)) {
      throw errors.badRequest('INVALID_FINE_FILTER', 'Status is invalid.');
    }
  }

  let selectedUserId = userId;
  if (selectedUserId === undefined && filters.userId !== undefined) {
    selectedUserId = toPositiveInteger(filters.userId, 'User ID');
  }

  let q;
  if (allowSearch && filters.q !== undefined) {
    q = String(filters.q).trim();
    if (q.length > 200) {
      throw errors.badRequest('INVALID_FINE_FILTER', 'Search query must not exceed 200 characters.');
    }
    if (!q) q = undefined;
  }

  return { q, userId: selectedUserId, status, page, limit };
}

function normalizePaymentInput(input = {}) {
  if (hasOwn(input, 'collectedAmount')) {
    throw errors.badRequest(
      'PARTIAL_PAYMENT_NOT_SUPPORTED',
      'Phase 1 records only full fine collection; client amounts are not accepted.'
    );
  }

  const paymentMethod = String(input.paymentMethod || '').trim();
  if (!paymentMethod) {
    throw errors.badRequest('PAYMENT_METHOD_REQUIRED', 'Payment method is required.');
  }
  if (paymentMethod.length > 50) {
    throw errors.badRequest('PAYMENT_METHOD_TOO_LONG', 'Payment method must not exceed 50 characters.');
  }

  const note = String(input.note || '').trim();
  if (note.length > 500) {
    throw errors.badRequest('COLLECTION_NOTE_TOO_LONG', 'Collection note must not exceed 500 characters.');
  }

  return { paymentMethod, note: note || null };
}

function createFineManagementService({
  fineRepository,
  auditLogRepository,
  clock = () => new Date(),
} = {}) {
  if (!fineRepository) fineRepository = require('../repositories/fineRepository');
  if (!auditLogRepository) auditLogRepository = require('../repositories/auditLogRepository');

  async function inTransaction(work) {
    if (typeof fineRepository.withTransaction === 'function') {
      return fineRepository.withTransaction(work);
    }
    return work(undefined);
  }

  async function writeAudit(context, action, extra = {}, transaction) {
    if (!auditLogRepository || typeof auditLogRepository.create !== 'function') return;

    await auditLogRepository.create({
      userId: extra.userId ?? context?.userId ?? null,
      action,
      targetType: extra.targetType || 'FINE',
      targetId: extra.targetId ?? null,
      metadata: extra.metadata || null,
      ipAddress: context?.ip || null,
      userAgent: context?.userAgent || null,
      transaction,
    });
  }

  function requireStaff(actor) {
    if (!hasAnyRole(actor, ['LIBRARIAN', 'ADMIN'])) {
      throw errors.forbidden('STAFF_ROLE_REQUIRED', 'Only librarian or admin can manage fines.');
    }
  }

  function requireAdmin(actor) {
    if (!hasAnyRole(actor, ['ADMIN'])) {
      throw errors.forbidden('ADMIN_ROLE_REQUIRED', 'Only an admin can waive or cancel a fine.');
    }
  }

  // @spec FR-FE09-003 FR-FE09-004 FR-FE09-005 FR-FE09-006 FR-FE09-017
  async function calculateFine(input = {}, actor, context = {}) {
    requireStaff(actor);
    const borrowDetailId = toPositiveInteger(input.borrowDetailId, 'Borrow detail ID');

    return inTransaction(async (transaction) => {
      const detail = await fineRepository.getBorrowDetailForFine(borrowDetailId, transaction);
      if (!detail) {
        throw errors.notFound('BORROW_DETAIL_NOT_FOUND', 'Borrow detail was not found.');
      }
      if (!detail.dueDate) {
        throw errors.badRequest('MISSING_DUE_DATE', 'Borrow detail has no due date; cannot calculate a fine.');
      }

      const calculatedAt = clock();
      const referenceDate = detail.returnDate || calculatedAt;
      const overdueDays = overdueDaysBetween(detail.dueDate, referenceDate);
      const amount = overdueDays * DAILY_FINE_RATE;

      if (amount <= 0) {
        return { fine: null, created: false, overdueDays: 0, amount: 0 };
      }

      const result = await fineRepository.createFine(
        {
          userId: detail.userId,
          borrowDetailId,
          overdueDays,
          ratePerDay: DAILY_FINE_RATE,
          amount,
          reason: OVERDUE_REASON,
          createdBy: actor.userId,
          calculatedAt,
        },
        transaction
      );
      const fine = await fineRepository.findFineById(result.fineId, transaction);

      if (result.created || result.changed) {
        await writeAudit(
          context,
          'FINE_CALCULATE',
          {
            userId: actor.userId,
            targetId: fine.fineId,
            metadata: {
              borrowDetailId,
              memberId: detail.userId,
              overdueDays: fine.overdueDays,
              amount: fine.amount,
              result: result.created ? 'CREATED' : 'RECALCULATED',
            },
          },
          transaction
        );
      }

      return {
        fine,
        created: result.created,
        overdueDays: fine?.overdueDays ?? overdueDays,
        amount: fine?.amount ?? amount,
      };
    });
  }

  // @spec FR-FE09-001
  async function listMyFines(filters, actor) {
    const normalized = normalizeListFilters(filters, { allowSearch: false, userId: actor.userId });
    const result = await fineRepository.listFines(normalized);
    return {
      fines: result.rows,
      page: normalized.page,
      limit: normalized.limit,
      total: result.total,
      totalPages: result.total === 0 ? 0 : Math.ceil(result.total / normalized.limit),
    };
  }

  // @spec FR-FE09-002 FR-FE09-011
  async function listFines(filters, actor) {
    requireStaff(actor);
    const normalized = normalizeListFilters(filters);
    const result = await fineRepository.listFines(normalized);
    return {
      fines: result.rows,
      page: normalized.page,
      limit: normalized.limit,
      total: result.total,
      totalPages: result.total === 0 ? 0 : Math.ceil(result.total / normalized.limit),
    };
  }

  async function getFine(fineIdInput, actor) {
    const fineId = toPositiveInteger(fineIdInput, 'Fine ID');
    const fine = await fineRepository.findFineById(fineId);
    if (!fine) throw errors.notFound('FINE_NOT_FOUND', 'Fine was not found.');

    if (!hasAnyRole(actor, ['LIBRARIAN', 'ADMIN']) && fine.userId !== actor.userId) {
      throw errors.forbidden('FINE_OWNER_REQUIRED', 'You can view only your own fines.');
    }
    return { fine };
  }

  // @spec FR-FE09-007 FR-FE09-009 FR-FE09-010 FR-FE09-012 FR-FE09-013
  async function recordCollection(fineIdInput, input, actor, context = {}) {
    requireStaff(actor);
    const fineId = toPositiveInteger(fineIdInput, 'Fine ID');

    return inTransaction(async (transaction) => {
      const fine = await fineRepository.findFineById(fineId, transaction);
      if (!fine) throw errors.notFound('FINE_NOT_FOUND', 'Fine was not found.');
      if (fine.status !== 'UNPAID') {
        throw errors.conflict('FINE_NOT_COLLECTIBLE', `Fine is already ${fine.status} and cannot be collected.`);
      }

      const payment = normalizePaymentInput(input);
      const updated = await fineRepository.recordCollection(
        {
          fineId,
          paymentMethod: payment.paymentMethod,
          collectedBy: actor.userId,
          paidAt: clock(),
        },
        transaction
      );
      if (!updated) {
        throw errors.conflict('FINE_NOT_COLLECTIBLE', 'Fine is no longer collectible.');
      }

      await writeAudit(
        context,
        'FINE_COLLECT',
        {
          userId: actor.userId,
          targetId: fineId,
          metadata: {
            amount: updated.amount,
            paymentMethod: payment.paymentMethod,
            note: payment.note,
            result: 'PAID',
          },
        },
        transaction
      );
      return { fine: updated };
    });
  }

  // @spec FR-FE09-008 FR-FE09-009 FR-FE09-010
  async function markPaid(fineIdInput, input, actor, context = {}) {
    requireStaff(actor);
    const fineId = toPositiveInteger(fineIdInput, 'Fine ID');

    return inTransaction(async (transaction) => {
      const fine = await fineRepository.findFineById(fineId, transaction);
      if (!fine) throw errors.notFound('FINE_NOT_FOUND', 'Fine was not found.');
      if (fine.status !== 'UNPAID') {
        throw errors.conflict('FINE_NOT_PAYABLE', `Fine is already ${fine.status}.`);
      }

      const payment = normalizePaymentInput(input);
      const updated = await fineRepository.markPaid(
        {
          fineId,
          collectedBy: actor.userId,
          paidAt: clock(),
          paymentMethod: payment.paymentMethod,
        },
        transaction
      );
      if (!updated) throw errors.conflict('FINE_NOT_PAYABLE', 'Fine is no longer payable.');

      await writeAudit(
        context,
        'FINE_MARK_PAID',
        {
          userId: actor.userId,
          targetId: fineId,
          metadata: {
            amount: updated.amount,
            paymentMethod: payment.paymentMethod,
            note: payment.note,
            result: 'PAID',
          },
        },
        transaction
      );
      return { fine: updated };
    });
  }

  async function resolveWithoutCollection(fineIdInput, input, actor, context, targetStatus, action) {
    // @spec FR-FE09-010 FR-FE09-014 FR-FE09-015
    requireAdmin(actor);
    const fineId = toPositiveInteger(fineIdInput, 'Fine ID');
    const reason = String(input?.reason || '').trim();
    if (!reason) {
      throw errors.badRequest('REASON_REQUIRED', 'A reason is required to waive or cancel a fine.');
    }
    if (reason.length > 500) {
      throw errors.badRequest('REASON_TOO_LONG', 'Reason must not exceed 500 characters.');
    }

    return inTransaction(async (transaction) => {
      const fine = await fineRepository.findFineById(fineId, transaction);
      if (!fine) throw errors.notFound('FINE_NOT_FOUND', 'Fine was not found.');
      if (fine.status !== 'UNPAID') {
        throw errors.conflict('FINE_NOT_RESOLVABLE', `Fine is already ${fine.status}.`);
      }

      const updated = await fineRepository.resolveFine({ fineId, status: targetStatus }, transaction);
      if (!updated) {
        throw errors.conflict('FINE_NOT_RESOLVABLE', 'Fine is no longer resolvable.');
      }

      await writeAudit(
        context,
        action,
        {
          userId: actor.userId,
          targetId: fineId,
          metadata: { reason, result: targetStatus },
        },
        transaction
      );
      return { fine: updated };
    });
  }

  async function waiveFine(fineIdInput, input, actor, context = {}) {
    return resolveWithoutCollection(fineIdInput, input, actor, context, 'WAIVED', 'FINE_WAIVE');
  }

  async function cancelFine(fineIdInput, input, actor, context = {}) {
    return resolveWithoutCollection(fineIdInput, input, actor, context, 'CANCELLED', 'FINE_CANCEL');
  }

  return {
    calculateFine,
    listMyFines,
    listFines,
    getFine,
    recordCollection,
    markPaid,
    waiveFine,
    cancelFine,
  };
}

const defaultFineManagementService = createFineManagementService();

module.exports = {
  createFineManagementService,
  defaultFineManagementService,
  DAILY_FINE_RATE,
};
