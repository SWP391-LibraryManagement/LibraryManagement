const errors = require('../utils/safeErrors');

const RESERVATION_HOLD_DAYS = 2;

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

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function createReservationService({
  reservationRepository,
  auditLogRepository,
  notificationService,
  clock = () => new Date(),
} = {}) {
  if (!reservationRepository) {
    reservationRepository = require('../repositories/reservationRepository');
  }

  if (!auditLogRepository) {
    auditLogRepository = require('../repositories/auditLogRepository');
  }

  if (!notificationService) {
    notificationService = require('./notificationService').defaultNotificationService;
  }

  const notificationRequester = notificationService.createSourceNotificationRequester('FE08');

  function buildAuditEntry(context, action, extra = {}) {
    return {
      userId: extra.userId ?? context?.userId ?? null,
      action,
      targetType: extra.targetType || 'RESERVATION',
      targetId: extra.targetId ?? null,
      metadata: extra.metadata || null,
      ipAddress: context?.ip || null,
      userAgent: context?.userAgent || null,
    };
  }

  async function writeAudit(context, action, extra = {}) {
    if (!auditLogRepository || typeof auditLogRepository.create !== 'function') {
      return;
    }

    await auditLogRepository.create(buildAuditEntry(context, action, extra));
  }

  async function createReservationReadyNotification(reservation) {
    await notificationRequester.createNotificationRequest({
      type: 'RESERVATION_AVAILABLE',
      channel: 'EMAIL',
      templateKey: 'RESERVATION_READY',
      userId: reservation.userId,
      recipientEmail: reservation.member.email,
      templateData: {
        reservationId: reservation.reservationId,
        copyId: reservation.copyId,
        bookId: reservation.copy.bookId,
        expiresAt: reservation.expiresAt,
      },
      sourceEntityType: 'RESERVATION',
      sourceEntityId: reservation.reservationId,
      idempotencyKey: `FE08:RESERVATION_AVAILABLE:${reservation.reservationId}`,
    });
  }

  function requireMember(actor) {
    if (!hasAnyRole(actor, ['MEMBER'])) {
      throw errors.forbidden('MEMBER_ROLE_REQUIRED', 'Only members can perform this action.');
    }
  }

  function requireStaff(actor) {
    if (!hasAnyRole(actor, ['LIBRARIAN', 'ADMIN'])) {
      throw errors.forbidden('STAFF_ROLE_REQUIRED', 'Only librarian or admin can perform this action.');
    }
  }

  async function createReservation(input, actor, context = {}) {
    requireMember(actor);

    const userId = actor.userId;
    const copyId = toPositiveInteger(input.copyId, 'Copy ID');
    const result = await reservationRepository.createReservation({
      userId,
      copyId,
      auditLogRepository,
      auditEntry: buildAuditEntry(context, 'RESERVATION_CREATE', {
        userId,
        metadata: { copyId },
      }),
    });

    if (result.outcome !== 'CREATED') {
      switch (result.outcome) {
        case 'MEMBER_ROLE_REQUIRED':
          throw errors.forbidden('MEMBER_ROLE_REQUIRED', 'Only active member accounts can create reservations.');
        case 'MEMBER_ACCOUNT_INACTIVE':
          throw errors.forbidden('MEMBER_ACCOUNT_INACTIVE', 'Member account is not active.');
        case 'COPY_NOT_FOUND':
          throw errors.notFound('COPY_NOT_FOUND', 'Book copy was not found.');
        case 'BOOK_INACTIVE':
          throw errors.conflict('BOOK_INACTIVE', 'The requested book is inactive and cannot be reserved.');
        case 'COPY_AVAILABLE':
          throw errors.conflict('COPY_AVAILABLE', 'This copy is available. Please borrow it instead.');
        case 'RESERVATION_NOT_ALLOWED':
          throw errors.conflict('RESERVATION_NOT_ALLOWED', 'Reservation is not allowed for this copy status.');
        case 'DUPLICATE_ACTIVE_RESERVATION':
          throw errors.conflict('DUPLICATE_ACTIVE_RESERVATION', 'You already have an active reservation for this copy.');
        case 'ACTIVE_RESERVATION_LIMIT':
          throw errors.conflict('ACTIVE_RESERVATION_LIMIT', 'A member can have at most 3 open reservations.');
        default:
          throw errors.internal('RESERVATION_CREATE_FAILED', 'Reservation could not be created.');
      }
    }

    const { reservation } = result;

    return {
      reservation,
    };
  }

  // @spec FR-FE08-029, AC-FE08-015, NFR-FE08-SEC-004, NFR-FE08-PERF-003
  async function listReservationCandidates(filters = {}, actor) {
    requireMember(actor);

    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const result = await reservationRepository.listReservationCandidates({
      q: typeof filters.q === 'string' ? filters.q.trim() : '',
      page,
      limit,
      userId: actor.userId,
    });
    const total = Number(result.total || 0);

    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async function listMyReservations(filters, actor) {
    requireMember(actor);

    const repositoryFilters = {
      userId: actor.userId,
      status: filters.status || undefined,
    };
    if (filters.page || filters.limit) {
      repositoryFilters.page = Number(filters.page) || 1;
      repositoryFilters.limit = Number(filters.limit) || 20;
    }
    const result = await reservationRepository.listReservations(repositoryFilters);
    const reservations = Array.isArray(result) ? result : result.rows;
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const total = Array.isArray(result) ? reservations.length : result.total;

    return {
      reservations,
      ...(Array.isArray(result) && !filters.page && !filters.limit
        ? {}
        : { pagination: { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) } }),
    };
  }

  async function cancelReservation(reservationIdInput, input, actor, context = {}) {
    requireMember(actor);

    const reservationId = toPositiveInteger(reservationIdInput, 'Reservation ID');
    const reservation = await reservationRepository.findReservationById(reservationId);

    if (!reservation) {
      throw errors.notFound('RESERVATION_NOT_FOUND', 'Reservation was not found.');
    }

    // @spec FR-FE08-016 — a member may cancel only their own reservation (EC-FE08-006, BR-FE08-003)
    if (reservation.userId !== actor.userId) {
      throw errors.forbidden('RESERVATION_OWNER_REQUIRED', 'You can cancel only your own reservations.');
    }

    // @spec FR-FE08-017 — reject re-cancelling a reservation that is already cancelled/expired and
    // return its current state alongside the 409 so the caller can resync (EC-FE08-007).
    if (reservation.status !== 'ACTIVE' && reservation.status !== 'NOTIFIED') {
      throw errors.conflict(
        'RESERVATION_NOT_ACTIVE',
        'Only active or notified reservations can be cancelled.',
        { reservationId: reservation.reservationId, status: reservation.status }
      );
    }

    const cancelledReservation = await reservationRepository.cancelReservation(reservationId, {
      auditLogRepository,
      auditEntry: buildAuditEntry(context, 'RESERVATION_CANCEL', {
        userId: actor.userId,
        targetId: reservationId,
        metadata: {
          copyId: reservation.copyId,
          reason: input.reason || null,
        },
      }),
    });

    if (!cancelledReservation) {
      throw errors.conflict('RESERVATION_NOT_ACTIVE', 'Only active reservations can be cancelled.');
    }

    return {
      reservation: cancelledReservation,
    };
  }

  // @spec FR-FE08-027
  async function listReservations(filters, actor) {
    requireStaff(actor);

    const repositoryFilters = {
      bookId: filters.bookId ? Number(filters.bookId) : undefined,
      memberId: filters.memberId ? Number(filters.memberId) : undefined,
      status: filters.status || undefined,
    };
    if (filters.page || filters.limit) {
      repositoryFilters.page = Number(filters.page) || 1;
      repositoryFilters.limit = Number(filters.limit) || 20;
    }
    const result = await reservationRepository.listReservations(repositoryFilters);
    const reservations = Array.isArray(result) ? result : result.rows;
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const total = Array.isArray(result) ? reservations.length : result.total;

    return {
      reservations,
      ...(Array.isArray(result) && !filters.page && !filters.limit
        ? {}
        : { pagination: { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) } }),
    };
  }

  async function holdReservation(reservation, actor, context = {}) {
    const notifiedAt = clock();
    const expiresAt = addDays(notifiedAt, RESERVATION_HOLD_DAYS);
    const processedReservation = await reservationRepository.holdReservation({
      reservationId: reservation.reservationId,
      userId: reservation.userId,
      copyId: reservation.copyId,
      notifiedAt,
      expiresAt,
      auditLogRepository,
      auditEntry: buildAuditEntry(context, 'RESERVATION_PROCESS', {
        userId: actor.userId,
        targetId: reservation.reservationId,
        metadata: {
          copyId: reservation.copyId,
          selectedUserId: reservation.userId,
          expiresAt,
        },
      }),
    });

    if (processedReservation?.outcome === 'MEMBER_INELIGIBLE') {
      return processedReservation;
    }

    if (!processedReservation) {
      return null;
    }

    // @spec FR-FE08-021 — a notification failure must not undo the hold; keep the held
    // state and record the failure so it can be retried later (EC-FE08-009, BR-FE08-012).
    let notificationWarning;
    try {
      await createReservationReadyNotification(processedReservation);
    } catch {
      try {
        await writeAudit(context, 'RESERVATION_NOTIFY_FAILED', {
          userId: processedReservation.userId,
          targetId: processedReservation.reservationId,
          metadata: {
            code: 'NOTIFICATION_REQUEST_FAILED',
            message: 'Reservation notification request failed.',
          },
        });
      } catch {
        notificationWarning = {
          code: 'RESERVATION_NOTIFY_AUDIT_FAILED',
          message: 'The reservation hold was created, but notification failure auditing was unavailable.',
        };
        console.error('[reservation notification audit unavailable]', {
          reservationId: processedReservation.reservationId,
        });
      }
    }

    if (notificationWarning) {
      Object.defineProperty(processedReservation, 'notificationWarning', {
        value: notificationWarning,
        enumerable: false,
      });
    }

    return processedReservation;
  }

  async function processNextEligibleReservation(copyId, actor, context = {}) {
    const excludedReservationIds = [];

    while (true) {
      const nextReservation = await reservationRepository.findNextActiveReservationForCopy(
        copyId,
        excludedReservationIds
      );

      if (!nextReservation) {
        return null;
      }

      const processedReservation = await holdReservation(nextReservation, actor, context);
      if (processedReservation?.outcome !== 'MEMBER_INELIGIBLE') {
        return processedReservation;
      }

      excludedReservationIds.push(nextReservation.reservationId);
    }
  }

  async function processQueue(input, actor, context = {}) {
    requireStaff(actor);

    const copyId = toPositiveInteger(input.copyId, 'Copy ID');
    const copy = await reservationRepository.findCopyById(copyId);

    if (!copy) {
      throw errors.notFound('COPY_NOT_FOUND', 'Book copy was not found.');
    }

    const processedReservation = await processNextEligibleReservation(copyId, actor, context);

    // @spec FR-FE08-020 — when no eligible active reservation exists, select nothing and leave the copy available (EC-FE08-008)
    if (!processedReservation) {
      return {
        selectedReservation: null,
        message: 'No eligible active reservation found.',
      };
    }

    const result = {
      selectedReservation: processedReservation,
    };
    if (processedReservation.notificationWarning) {
      result.notificationWarning = processedReservation.notificationWarning;
    }
    return result;
  }

  async function expireHolds(actor, context = {}) {
    requireStaff(actor);

    const expired = await reservationRepository.expireOverdueHolds({
      now: clock(),
      auditLogRepository,
      auditEntry: buildAuditEntry(context, 'RESERVATION_EXPIRE', {
        userId: actor.userId,
      }),
    });
    const promoted = [];
    const notificationWarnings = [];

    for (const item of expired) {
      // @spec FR-FE08-019 — offer the freed copy to the next eligible reservation in the queue (AF-FE08-004).
      const held = await processNextEligibleReservation(item.copyId, actor, context);
      if (held) {
        promoted.push(held);
        if (held.notificationWarning) {
          notificationWarnings.push({
            reservationId: held.reservationId,
            copyId: held.copyId,
            code: held.notificationWarning.code,
            message: held.notificationWarning.message,
          });
        }
      }
    }

    const result = { expiredCount: expired.length, expired, promoted };
    if (notificationWarnings.length > 0) {
      result.notificationWarnings = notificationWarnings;
    }
    return result;
  }

  return {
    createReservation,
    listReservationCandidates,
    listMyReservations,
    cancelReservation,
    listReservations,
    processQueue,
    expireHolds,
  };
}

const defaultReservationService = createReservationService();

module.exports = {
  createReservationService,
  defaultReservationService,
};
