const errors = require('../utils/safeErrors');

// FE09 Fine Management — server-side calculation, collection and paid-marking.
// This service is the production-aligned implementation required by SPEC §11.1: fines are computed
// from stored borrowing data, never from client input (BR-FE09-007, BR-FE09-008, NFR-FE09-SEC-004).

const DAILY_FINE_RATE = 5000; // VND per overdue day per copy (BR-FE09-005, DEC-GEN-003)
const OVERDUE_REASON = 'OVERDUE';

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

function toDateOnly(date) {
  const value = new Date(date);
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

// Overdue days start the day AFTER the due date (BR-FE09-006). Returns 0 when not overdue.
function overdueDaysBetween(dueDate, referenceDate) {
  const due = toDateOnly(dueDate).getTime();
  const reference = toDateOnly(referenceDate).getTime();
  return Math.max(0, Math.round((reference - due) / 86400000));
}

function createFineManagementService({
  fineRepository,
  auditLogRepository,
  clock = () => new Date(),
} = {}) {
  if (!fineRepository) {
    fineRepository = require('../repositories/fineRepository');
  }

  if (!auditLogRepository) {
    auditLogRepository = require('../repositories/auditLogRepository');
  }

  // @spec NFR-FE09-LOG-001 — calculate/collect/paid/waive/cancel actions are written to the audit log (INV-8)
  async function writeAudit(context, action, extra = {}) {
    if (!auditLogRepository || typeof auditLogRepository.create !== 'function') {
      return;
    }

    await auditLogRepository.create({
      userId: extra.userId ?? context?.userId ?? null,
      action,
      targetType: extra.targetType || 'FINE',
      targetId: extra.targetId ?? null,
      metadata: extra.metadata || null,
      ipAddress: context?.ip || null,
      userAgent: context?.userAgent || null,
    });
  }

  function requireStaff(actor) {
    // @spec FR-FE09-009, BR-FE09-004 — only librarian/admin may calculate, collect, or mark fines paid
    if (!hasAnyRole(actor, ['LIBRARIAN', 'ADMIN'])) {
      throw errors.forbidden('STAFF_ROLE_REQUIRED', 'Only librarian or admin can manage fines.');
    }
  }

  function requireAdmin(actor) {
    if (!hasAnyRole(actor, ['ADMIN'])) {
      throw errors.forbidden('ADMIN_ROLE_REQUIRED', 'Only an admin can waive or cancel a fine.');
    }
  }

  // @spec FR-FE09-003, FR-FE09-004, FR-FE09-005, FR-FE09-006 — compute overdue fine from stored
  // due/return dates; create an UNPAID fine only when the amount is positive (AF-FE09-001, EC-FE09-004/007).
  async function calculateFine(input, actor, context = {}) {
    requireStaff(actor);

    const borrowDetailId = toPositiveInteger(input.borrowDetailId, 'Borrow detail ID');
    const detail = await fineRepository.getBorrowDetailForFine(borrowDetailId);

    // @spec EC-FE09-002 — reject calculation when the borrow detail does not exist
    if (!detail) {
      throw errors.notFound('BORROW_DETAIL_NOT_FOUND', 'Borrow detail was not found.');
    }

    // @spec EC-FE09-003 — reject calculation when the borrow detail has no due date (incomplete data)
    if (!detail.dueDate) {
      throw errors.badRequest('MISSING_DUE_DATE', 'Borrow detail has no due date; cannot calculate a fine.');
    }

    const referenceDate = detail.returnDate ? new Date(detail.returnDate) : clock();
    const overdueDays = overdueDaysBetween(detail.dueDate, referenceDate);
    const amount = overdueDays * DAILY_FINE_RATE;

    // @spec FR-FE09-004 — not overdue (or amount <= 0): no fine is created
    if (amount <= 0) {
      return { fine: null, created: false, overdueDays: 0, amount: 0 };
    }

    // @spec FR-FE09-006 — do not create a duplicate active overdue fine for the same borrow detail (AF-FE09-002, EC-FE09-006)
    const existing = await fineRepository.findActiveFineByBorrowDetail(borrowDetailId, OVERDUE_REASON);
    if (existing) {
      return { fine: existing, created: false, overdueDays: existing.overdueDays, amount: existing.amount };
    }

    const result = await fineRepository.createFine({
      userId: detail.userId,
      borrowDetailId,
      overdueDays,
      ratePerDay: DAILY_FINE_RATE,
      amount,
      reason: OVERDUE_REASON,
      createdBy: actor.userId,
      calculatedAt: clock(),
    });

    if (!result.created) {
      // Lost the race to another calculate request; return the fine that won.
      const winner = await fineRepository.findFineById(result.fineId);
      return { fine: winner, created: false, overdueDays: winner?.overdueDays ?? overdueDays, amount: winner?.amount ?? amount };
    }

    const fine = await fineRepository.findFineById(result.fineId);

    await writeAudit(context, 'FINE_CALCULATE', {
      userId: actor.userId,
      targetId: fine.fineId,
      metadata: { borrowDetailId, memberId: detail.userId, overdueDays, amount },
    });

    return { fine, created: true, overdueDays, amount };
  }

  // @spec FR-FE09-001, BR-FE09-002, NFR-FE09-SEC-002 — a member sees only their own fines
  async function listMyFines(filters, actor) {
    const fines = await fineRepository.listFines({
      userId: actor.userId,
      status: filters.status || undefined,
    });

    return { fines };
  }

  // @spec FR-FE09-002, BR-FE09-003 — staff may list fines and filter by member/status
  async function listFines(filters, actor) {
    requireStaff(actor);

    const fines = await fineRepository.listFines({
      userId: filters.userId ? Number(filters.userId) : undefined,
      status: filters.status || undefined,
    });

    return { fines };
  }

  // @spec BR-FE09-002, NFR-FE09-SEC-002 — owner or staff only; a member cannot read another member's fine
  async function getFine(fineIdInput, actor) {
    const fineId = toPositiveInteger(fineIdInput, 'Fine ID');
    const fine = await fineRepository.findFineById(fineId);

    if (!fine) {
      throw errors.notFound('FINE_NOT_FOUND', 'Fine was not found.');
    }

    if (!hasAnyRole(actor, ['LIBRARIAN', 'ADMIN']) && fine.userId !== actor.userId) {
      throw errors.forbidden('FINE_OWNER_REQUIRED', 'You can view only your own fines.');
    }

    return { fine };
  }

  // @spec FR-FE09-007 — staff records a collection; PAID iff fully collected, 0 <= collectedAmount <= amount (INV-4, INV-5)
  async function recordCollection(fineIdInput, input, actor, context = {}) {
    requireStaff(actor);

    const fineId = toPositiveInteger(fineIdInput, 'Fine ID');
    const fine = await fineRepository.findFineById(fineId);

    if (!fine) {
      throw errors.notFound('FINE_NOT_FOUND', 'Fine was not found.');
    }

    // @spec EC-FE09-009, INV-6 — no collection against a resolved (PAID/WAIVED/CANCELLED) fine
    if (fine.status !== 'UNPAID') {
      throw errors.conflict('FINE_NOT_COLLECTIBLE', `Fine is already ${fine.status} and cannot be collected.`);
    }

    if (input.collectedAmount !== undefined) {
      throw errors.badRequest('COLLECTED_AMOUNT_NOT_ALLOWED', 'Partial or client-supplied collection amounts are not supported in Phase 1.');
    }
    const collectedAmount = fine.amount;
    const fullyCollected = true;
    const updated = await fineRepository.recordCollection({
      fineId,
      collectedAmount,
      paymentMethod: input.paymentMethod,
      collectedBy: actor.userId,
      paidAt: clock(),
    });

    if (!updated) {
      throw errors.conflict('FINE_NOT_COLLECTIBLE', 'Fine is no longer collectible.');
    }

    await writeAudit(context, 'FINE_COLLECT', {
      userId: actor.userId,
      targetId: fineId,
      metadata: { collectedAmount, fullyCollected, note: input.note || null },
    });

    return { fine: updated };
  }

  // @spec FR-FE09-008, BR-FE09-012 — staff marks an UNPAID fine PAID and records PaidAt (AF-FE09-004, EC-FE09-009)
  async function markPaid(fineIdInput, input, actor, context = {}) {
    requireStaff(actor);

    const fineId = toPositiveInteger(fineIdInput, 'Fine ID');
    const fine = await fineRepository.findFineById(fineId);

    if (!fine) {
      throw errors.notFound('FINE_NOT_FOUND', 'Fine was not found.');
    }

    if (fine.status !== 'UNPAID') {
      throw errors.conflict('FINE_NOT_PAYABLE', `Fine is already ${fine.status}.`);
    }

    const updated = await fineRepository.markPaid({
      fineId,
      collectedBy: actor.userId,
      paidAt: clock(),
      paymentMethod: input.paymentMethod,
    });

    if (!updated) {
      throw errors.conflict('FINE_NOT_PAYABLE', 'Fine is no longer payable.');
    }

    await writeAudit(context, 'FINE_MARK_PAID', {
      userId: actor.userId,
      targetId: fineId,
      metadata: { amount: updated.amount, note: input.note || null },
    });

    return { fine: updated };
  }

  // @spec Q-FE09-005, BR-FE09-011 — admin waives or cancels an UNPAID fine with a required reason + audit log
  async function resolveWithoutCollection(fineIdInput, input, actor, context, targetStatus, action) {
    requireAdmin(actor);

    const fineId = toPositiveInteger(fineIdInput, 'Fine ID');
    const reason = String(input.reason || '').trim();

    if (!reason || reason.length > 500) {
      throw errors.badRequest('REASON_REQUIRED', 'A reason is required to waive or cancel a fine.');
    }

    const fine = await fineRepository.findFineById(fineId);

    if (!fine) {
      throw errors.notFound('FINE_NOT_FOUND', 'Fine was not found.');
    }

    if (fine.status !== 'UNPAID') {
      throw errors.conflict('FINE_NOT_RESOLVABLE', `Fine is already ${fine.status}.`);
    }

    const updated = await fineRepository.resolveFine({ fineId, status: targetStatus });

    if (!updated) {
      throw errors.conflict('FINE_NOT_RESOLVABLE', 'Fine is no longer resolvable.');
    }

    await writeAudit(context, action, {
      userId: actor.userId,
      targetId: fineId,
      metadata: { reason },
    });

    return { fine: updated };
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
