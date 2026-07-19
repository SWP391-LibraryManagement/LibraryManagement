const errors = require('../utils/safeErrors');

const ACTIVE_STATUS = 'ACTIVE';
const MAX_ACTIVE_RESERVATIONS = 3;
const RESERVATION_HOLD_DAYS = 2;
const RESERVABLE_COPY_STATUSES = ['BORROWED', 'RESERVED'];

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

  async function writeAudit(context, action, extra = {}) {
    if (!auditLogRepository || typeof auditLogRepository.create !== 'function') {
      return;
    }

    await auditLogRepository.create({
      userId: extra.userId ?? context?.userId ?? null,
      action,
      targetType: extra.targetType || 'RESERVATION',
      targetId: extra.targetId ?? null,
      metadata: extra.metadata || null,
      ipAddress: context?.ip || null,
      userAgent: context?.userAgent || null,
    });
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

  async function ensureEligibleMember(userId) {
    const eligibility = await reservationRepository.getMemberEligibility(userId);

    // @spec FR-FE08-011 — reject reservation when the member ID does not exist (EC-FE08-001)
    if (!eligibility) {
      throw errors.notFound('MEMBER_NOT_FOUND', 'Member account was not found.');
    }

    // @spec FR-FE08-012 — reject reservation when the member account is inactive (EC-FE08-002, BR-FE08-005)
    if (eligibility.userStatus !== 'ACTIVE') {
      throw errors.forbidden('MEMBER_ACCOUNT_INACTIVE', 'Member account is not active.');
    }

    // @spec FR-FE08-013 — reject reservation when membership is not approved (EC-FE08-003, BR-FE08-005)
    if (eligibility.memberStatus !== 'APPROVED') {
      throw errors.forbidden('MEMBERSHIP_NOT_APPROVED', 'Approved membership is required to reserve books.');
    }

    return eligibility;
  }

  async function createReservation(input, actor, context = {}) {
    requireMember(actor);

    const userId = actor.userId;
    const copyId = toPositiveInteger(input.copyId, 'Copy ID');
    const copy = await reservationRepository.findCopyById(copyId);

    // @spec FR-FE08-014 — reject reservation when the requested copy does not exist (EC-FE08-004)
    if (!copy) {
      throw errors.notFound('COPY_NOT_FOUND', 'Book copy was not found.');
    }

    if (copy.bookStatus === 'INACTIVE') {
      throw errors.conflict('BOOK_INACTIVE', 'The requested book is inactive and cannot be reserved.');
    }

    await ensureEligibleMember(userId);

    if (copy.status === 'AVAILABLE') {
      throw errors.conflict('COPY_AVAILABLE', 'This copy is available. Please borrow it instead.');
    }

    if (!RESERVABLE_COPY_STATUSES.includes(copy.status)) {
      throw errors.conflict('RESERVATION_NOT_ALLOWED', 'Reservation is not allowed for this copy status.');
    }

    const duplicate = await reservationRepository.findActiveReservationByUserAndCopy(userId, copyId);
    if (duplicate) {
      throw errors.conflict('DUPLICATE_ACTIVE_RESERVATION', 'You already have an active reservation for this copy.');
    }

    // @spec FR-FE08-015 — reject when the member already holds the max active reservations (Q-FE08-003)
    const activeCount = await reservationRepository.countActiveReservationsForUser(userId);
    if (activeCount >= MAX_ACTIVE_RESERVATIONS) {
      throw errors.conflict('ACTIVE_RESERVATION_LIMIT', 'A member can have at most 3 active reservations.');
    }

    const reservation = await reservationRepository.createReservation({ userId, copyId });

    await writeAudit(context, 'RESERVATION_CREATE', {
      userId,
      targetId: reservation.reservationId,
      metadata: { copyId },
    });

    return {
      reservation,
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

    const cancelledReservation = await reservationRepository.cancelReservation(reservationId);

    if (!cancelledReservation) {
      throw errors.conflict('RESERVATION_NOT_ACTIVE', 'Only active reservations can be cancelled.');
    }

    await writeAudit(context, 'RESERVATION_CANCEL', {
      userId: actor.userId,
      targetId: reservationId,
      metadata: {
        copyId: reservation.copyId,
        reason: input.reason || null,
      },
    });

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
    await ensureEligibleMember(reservation.userId);

    const notifiedAt = clock();
    const expiresAt = addDays(notifiedAt, RESERVATION_HOLD_DAYS);
    const processedReservation = await reservationRepository.holdReservation({
      reservationId: reservation.reservationId,
      copyId: reservation.copyId,
      notifiedAt,
      expiresAt,
    });

    if (!processedReservation) {
      throw errors.conflict('COPY_NOT_AVAILABLE', 'Copy is not available for reservation queue processing.');
    }

    // @spec FR-FE08-021 — a notification failure must not undo the hold; keep the held
    // state and record the failure so it can be retried later (EC-FE08-009, BR-FE08-012).
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
        // Notification failure auditing is best-effort and must not undo the hold.
      }
    }

    await writeAudit(context, 'RESERVATION_PROCESS', {
      userId: actor.userId,
      targetId: processedReservation.reservationId,
      metadata: {
        copyId: processedReservation.copyId,
        selectedUserId: processedReservation.userId,
        expiresAt,
      },
    });

    return processedReservation;
  }

  async function processReservation(reservationIdInput, input, actor, context = {}) {
    requireStaff(actor);

    const reservationId = toPositiveInteger(reservationIdInput, 'Reservation ID');
    const reservation = await reservationRepository.findReservationById(reservationId);

    if (!reservation) {
      throw errors.notFound('RESERVATION_NOT_FOUND', 'Reservation was not found.');
    }

    if (reservation.status !== ACTIVE_STATUS) {
      throw errors.conflict('RESERVATION_NOT_ACTIVE', 'Only active reservations can be processed.');
    }

    if (input.copyId && Number(input.copyId) !== reservation.copyId) {
      throw errors.badRequest('COPY_MISMATCH', 'Copy ID does not match the reservation target.');
    }

    const processedReservation = await holdReservation(reservation, actor, context);

    return {
      reservation: processedReservation,
    };
  }

  async function processQueue(input, actor, context = {}) {
    requireStaff(actor);

    const copyId = toPositiveInteger(input.copyId, 'Copy ID');
    const copy = await reservationRepository.findCopyById(copyId);

    if (!copy) {
      throw errors.notFound('COPY_NOT_FOUND', 'Book copy was not found.');
    }

    const nextReservation = await reservationRepository.findNextActiveReservationForCopy(copyId);

    // @spec FR-FE08-020 — when no eligible active reservation exists, select nothing and leave the copy available (EC-FE08-008)
    if (!nextReservation) {
      return {
        selectedReservation: null,
        message: 'No eligible active reservation found.',
      };
    }

    const processedReservation = await holdReservation(nextReservation, actor, context);

    return {
      selectedReservation: processedReservation,
    };
  }

  async function expireHolds(actor, context = {}) {
    requireStaff(actor);

    const expired = await reservationRepository.expireOverdueHolds(clock());
    const promoted = [];

    for (const item of expired) {
      await writeAudit(context, 'RESERVATION_EXPIRE', {
        userId: actor.userId,
        targetId: item.reservationId,
        metadata: { copyId: item.copyId },
      });

      // @spec FR-FE08-019 — offer the freed copy to the next eligible reservation in the queue (AF-FE08-004).
      const next = await reservationRepository.findNextActiveReservationForCopy(item.copyId);
      if (next) {
        const held = await holdReservation(next, actor, context);
        promoted.push(held);
      }
    }

    return { expiredCount: expired.length, expired, promoted };
  }

  return {
    createReservation,
    listMyReservations,
    cancelReservation,
    listReservations,
    processReservation,
    processQueue,
    expireHolds,
  };
}

const defaultReservationService = createReservationService();

module.exports = {
  createReservationService,
  defaultReservationService,
};
