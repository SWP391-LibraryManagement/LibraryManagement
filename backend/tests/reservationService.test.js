const { createReservationService } = require('../src/services/reservationService');
const fs = require('fs');
const path = require('path');

const MEMBER = { userId: 11, roles: ['MEMBER'] };
const LIBRARIAN = { userId: 22, roles: ['LIBRARIAN'] };
const FIXED_NOW = new Date('2026-07-14T00:00:00.000Z');

function reservation(overrides = {}) {
  return {
    reservationId: 51,
    userId: MEMBER.userId,
    copyId: 7,
    status: 'ACTIVE',
    expiresAt: null,
    member: { email: 'member@example.test' },
    copy: { bookId: 3 },
    ...overrides,
  };
}

function makeService({ repository = {}, auditLogRepository, notificationRequest } = {}) {
  const heldReservation = reservation({ status: 'NOTIFIED', expiresAt: '2026-07-16' });
  const reservationRepository = {
    getMemberEligibility: jest.fn(async () => ({
      userStatus: 'ACTIVE',
      memberStatus: 'APPROVED',
    })),
    findCopyById: jest.fn(async (copyId) => ({ copyId, status: 'BORROWED' })),
    findActiveReservationByUserAndCopy: jest.fn(async () => null),
    countActiveReservationsForUser: jest.fn(async () => 0),
    createReservation: jest.fn(async ({ userId, copyId }) => ({
      outcome: 'CREATED',
      reservation: reservation({ userId, copyId }),
    })),
    listReservations: jest.fn(async () => []),
    findReservationById: jest.fn(async () => reservation()),
    cancelReservation: jest.fn(async () => reservation({ status: 'CANCELLED' })),
    holdReservation: jest.fn(async () => heldReservation),
    findNextActiveReservationForCopy: jest.fn(async () => null),
    expireOverdueHolds: jest.fn(async () => []),
    ...repository,
  };
  const createNotificationRequest = notificationRequest || jest.fn(async () => ({ notificationId: 1 }));
  const notificationService = {
    createSourceNotificationRequester: jest.fn(() => ({ createNotificationRequest })),
  };
  const activeAuditRepository =
    auditLogRepository === undefined ? { create: jest.fn(async () => {}) } : auditLogRepository;
  const service = createReservationService({
    reservationRepository,
    auditLogRepository: activeAuditRepository,
    notificationService,
    clock: () => FIXED_NOW,
  });

  return {
    service,
    reservationRepository,
    auditLogRepository: activeAuditRepository,
    createNotificationRequest,
    heldReservation,
  };
}

describe('FE08 reservation service coverage', () => {
  // FR-FE08-010: member/staff list filters preserve ownership and optional query filters.
  test('normalizes optional member and staff list filters', async () => {
    const { service, reservationRepository } = makeService();

    await service.listMyReservations({}, MEMBER);
    await service.listMyReservations({ status: 'ACTIVE' }, MEMBER);
    await service.listReservations({}, LIBRARIAN);
    await service.listReservations({ bookId: '3', memberId: '11', status: 'ACTIVE' }, LIBRARIAN);

    expect(reservationRepository.listReservations).toHaveBeenNthCalledWith(1, {
      userId: MEMBER.userId,
      status: undefined,
    });
    expect(reservationRepository.listReservations).toHaveBeenNthCalledWith(2, {
      userId: MEMBER.userId,
      status: 'ACTIVE',
    });
    expect(reservationRepository.listReservations).toHaveBeenNthCalledWith(3, {
      bookId: undefined,
      memberId: undefined,
      status: undefined,
    });
    expect(reservationRepository.listReservations).toHaveBeenNthCalledWith(4, {
      bookId: 3,
      memberId: 11,
      status: 'ACTIVE',
    });
  });

  test('rejects list actions for actors without the required role', async () => {
    const { service } = makeService();

    await expect(service.listMyReservations({}, { userId: 1 })).rejects.toMatchObject({
      statusCode: 403,
      code: 'MEMBER_ROLE_REQUIRED',
    });
    await expect(service.listReservations({}, { userId: 1, roles: ['MEMBER'] })).rejects.toMatchObject({
      statusCode: 403,
      code: 'STAFF_ROLE_REQUIRED',
    });
  });

  // FR-FE08-016/017: cancellation distinguishes missing, ownership, terminal-state, and race outcomes.
  test.each([
    ['missing reservation', null, MEMBER, 'RESERVATION_NOT_FOUND', 404],
    ['different owner', reservation({ userId: 999 }), MEMBER, 'RESERVATION_OWNER_REQUIRED', 403],
    ['terminal reservation', reservation({ status: 'EXPIRED' }), MEMBER, 'RESERVATION_NOT_ACTIVE', 409],
  ])('rejects cancellation for %s', async (_label, foundReservation, actor, code, statusCode) => {
    const { service } = makeService({
      repository: { findReservationById: jest.fn(async () => foundReservation) },
    });

    await expect(service.cancelReservation(51, {}, actor)).rejects.toMatchObject({ code, statusCode });
  });

  test('reports a cancellation race and preserves the optional reason boundary', async () => {
    const raced = makeService({
      repository: { cancelReservation: jest.fn(async () => null) },
    });
    await expect(raced.service.cancelReservation(51, {}, MEMBER)).rejects.toMatchObject({
      code: 'RESERVATION_NOT_ACTIVE',
      statusCode: 409,
    });

    const successful = makeService();
    await successful.service.cancelReservation(51, {}, MEMBER, {});
    expect(successful.reservationRepository.cancelReservation).toHaveBeenCalledWith(
      51,
      expect.objectContaining({
        auditLogRepository: successful.auditLogRepository,
        auditEntry: expect.objectContaining({ metadata: { copyId: 7, reason: null } }),
      })
    );
  });

  test('exposes only the canonical copy-level queue processing command', () => {
    const serviceSource = fs.readFileSync(
      path.join(__dirname, '..', 'src', 'services', 'reservationService.js'),
      'utf8'
    );
    const routeSource = fs.readFileSync(
      path.join(__dirname, '..', 'src', 'routes', 'reservationRoutes.js'),
      'utf8'
    );

    expect(serviceSource).not.toMatch(/async function processReservation/);
    expect(routeSource).not.toContain('/:reservationId/process');
  });

  test.each([
    ['MEMBER_ROLE_REQUIRED', 'MEMBER_ROLE_REQUIRED', 403],
    ['MEMBER_ACCOUNT_INACTIVE', 'MEMBER_ACCOUNT_INACTIVE', 403],
    ['BOOK_INACTIVE', 'BOOK_INACTIVE', 409],
    ['COPY_AVAILABLE', 'COPY_AVAILABLE', 409],
    ['RESERVATION_NOT_ALLOWED', 'RESERVATION_NOT_ALLOWED', 409],
    ['DUPLICATE_ACTIVE_RESERVATION', 'DUPLICATE_ACTIVE_RESERVATION', 409],
    ['ACTIVE_RESERVATION_LIMIT', 'ACTIVE_RESERVATION_LIMIT', 409],
  ])('maps atomic create outcome %s to the safe service error', async (outcome, code, statusCode) => {
    const { service } = makeService({
      repository: {
        createReservation: jest.fn(async () => ({ outcome })),
      },
    });

    await expect(service.createReservation({ copyId: 7 }, MEMBER, {})).rejects.toMatchObject({
      code,
      statusCode,
    });
  });

  // FR-FE08-020: an empty queue is a successful no-selection result.
  test('handles missing copies and empty reservation queues', async () => {
    const missingCopy = makeService({
      repository: { findCopyById: jest.fn(async () => null) },
    });
    await expect(missingCopy.service.processQueue({ copyId: 7 }, LIBRARIAN)).rejects.toMatchObject({
      code: 'COPY_NOT_FOUND',
      statusCode: 404,
    });

    const empty = makeService();
    await expect(empty.service.processQueue({ copyId: 7 }, LIBRARIAN)).resolves.toEqual({
      selectedReservation: null,
      message: 'No eligible active reservation found.',
    });
  });

  // FR-FE08-021: notification failure never undoes the hold, but audit loss must be explicit.
  test('keeps a held reservation and returns a safe warning when notification failure auditing fails', async () => {
    const auditLogRepository = {
      create: jest.fn(async (entry) => {
        if (entry.action === 'RESERVATION_NOTIFY_FAILED') {
          throw new Error('audit unavailable');
        }
      }),
    };
    const notificationRequest = jest.fn(async () => {
      throw new Error('notification unavailable');
    });
    const nextReservation = reservation();
    const { service, heldReservation, reservationRepository } = makeService({
      auditLogRepository,
      notificationRequest,
      repository: {
        findNextActiveReservationForCopy: jest.fn(async () => nextReservation),
      },
    });

    await expect(service.processQueue({ copyId: 7 }, LIBRARIAN, {})).resolves.toEqual({
      selectedReservation: heldReservation,
      notificationWarning: {
        code: 'RESERVATION_NOTIFY_AUDIT_FAILED',
        message: 'The reservation hold was created, but notification failure auditing was unavailable.',
      },
    });
    expect(reservationRepository.holdReservation).toHaveBeenCalledWith(expect.objectContaining({
      auditLogRepository,
      auditEntry: expect.objectContaining({ action: 'RESERVATION_PROCESS' }),
    }));
  });

  test('returns every safe promotion warning in expiration order', async () => {
    const expired = [
      { reservationId: 50, copyId: 7 },
      { reservationId: 60, copyId: 8 },
    ];
    const nextByCopy = new Map([
      [7, reservation({ reservationId: 51, userId: 101, copyId: 7 })],
      [8, reservation({ reservationId: 61, userId: 102, copyId: 8 })],
    ]);
    const heldByCopy = new Map([
      [7, reservation({
        reservationId: 51,
        userId: 101,
        copyId: 7,
        status: 'NOTIFIED',
        notifiedAt: FIXED_NOW,
        expiresAt: new Date('2026-07-25T00:00:00.000Z'),
      })],
      [8, reservation({
        reservationId: 61,
        userId: 102,
        copyId: 8,
        status: 'NOTIFIED',
        notifiedAt: FIXED_NOW,
        expiresAt: new Date('2026-07-25T00:00:00.000Z'),
      })],
    ]);
    const auditLogRepository = {
      create: jest.fn(async (entry) => {
        if (entry.action === 'RESERVATION_NOTIFY_FAILED') {
          throw new Error('audit unavailable');
        }
      }),
    };
    const notificationRequest = jest.fn(async () => {
      throw new Error('notification unavailable');
    });
    const { service } = makeService({
      auditLogRepository,
      notificationRequest,
      repository: {
        expireOverdueHolds: jest.fn(async () => expired),
        findNextActiveReservationForCopy: jest.fn(async (copyId) => nextByCopy.get(copyId)),
        holdReservation: jest.fn(async ({ copyId }) => heldByCopy.get(copyId)),
      },
    });

    const result = await service.expireHolds(LIBRARIAN, {});

    expect(result.expiredCount).toBe(2);
    expect(result.expired).toEqual(expired);
    expect(result.promoted).toEqual([heldByCopy.get(7), heldByCopy.get(8)]);
    expect(result.notificationWarnings).toEqual([
      {
        reservationId: 51,
        copyId: 7,
        code: 'RESERVATION_NOTIFY_AUDIT_FAILED',
        message: 'The reservation hold was created, but notification failure auditing was unavailable.',
      },
      {
        reservationId: 61,
        copyId: 8,
        code: 'RESERVATION_NOTIFY_AUDIT_FAILED',
        message: 'The reservation hold was created, but notification failure auditing was unavailable.',
      },
    ]);
    expect(Object.keys(heldByCopy.get(7))).not.toContain('notificationWarning');
    expect(Object.keys(heldByCopy.get(8))).not.toContain('notificationWarning');
  });

  test('passes required lifecycle audits into reservation mutation transactions', async () => {
    const nextReservation = reservation();
    const { service, reservationRepository, auditLogRepository } = makeService({
      repository: {
        findNextActiveReservationForCopy: jest.fn(async () => nextReservation),
        expireOverdueHolds: jest.fn(async () => []),
      },
    });

    await service.createReservation({ copyId: 7 }, MEMBER, {});
    await service.cancelReservation(51, { reason: 'Không còn nhu cầu' }, MEMBER, {});
    await service.processQueue({ copyId: 7 }, LIBRARIAN, {});
    await service.expireHolds(LIBRARIAN, {});

    expect(reservationRepository.createReservation).toHaveBeenCalledWith(expect.objectContaining({
      userId: MEMBER.userId,
      copyId: 7,
      auditLogRepository,
      auditEntry: expect.objectContaining({ action: 'RESERVATION_CREATE' }),
    }));
    expect(reservationRepository.cancelReservation).toHaveBeenCalledWith(
      51,
      expect.objectContaining({
        auditLogRepository,
        auditEntry: expect.objectContaining({ action: 'RESERVATION_CANCEL' }),
      })
    );
    expect(reservationRepository.holdReservation).toHaveBeenCalledWith(expect.objectContaining({
      reservationId: 51,
      auditLogRepository,
      auditEntry: expect.objectContaining({ action: 'RESERVATION_PROCESS' }),
    }));
    expect(reservationRepository.expireOverdueHolds).toHaveBeenCalledWith(expect.objectContaining({
      now: FIXED_NOW,
      auditLogRepository,
      auditEntry: expect.objectContaining({ action: 'RESERVATION_EXPIRE' }),
    }));
  });

  test('re-reads the queue when transaction-time eligibility rejects a stale selection', async () => {
    const staleReservation = reservation({ reservationId: 51, userId: 11 });
    const nextReservation = reservation({ reservationId: 52, userId: 12 });
    const heldNext = reservation({
      reservationId: 52,
      userId: 12,
      status: 'NOTIFIED',
      expiresAt: '2026-07-16',
    });
    const findNextActiveReservationForCopy = jest
      .fn()
      .mockResolvedValueOnce(staleReservation)
      .mockResolvedValueOnce(nextReservation);
    const holdReservation = jest
      .fn()
      .mockResolvedValueOnce({ outcome: 'MEMBER_INELIGIBLE' })
      .mockResolvedValueOnce(heldNext);
    const { service } = makeService({
      repository: {
        findNextActiveReservationForCopy,
        holdReservation,
      },
    });

    await expect(service.processQueue({ copyId: 7 }, LIBRARIAN, {})).resolves.toEqual({
      selectedReservation: heldNext,
    });
    expect(findNextActiveReservationForCopy).toHaveBeenNthCalledWith(2, 7, [51]);
    expect(holdReservation).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ reservationId: 52, userId: 12 })
    );
  });

  test('supports auditing-disabled repositories without blocking reservation creation', async () => {
    const { service } = makeService({ auditLogRepository: {} });

    await expect(service.createReservation({ copyId: 7 }, MEMBER, {})).resolves.toEqual({
      reservation: expect.objectContaining({ userId: MEMBER.userId, copyId: 7 }),
    });
  });

  test('rejects a new reservation when the parent book is inactive', async () => {
    const { service, reservationRepository } = makeService({
      repository: {
        createReservation: jest.fn(async () => ({ outcome: 'BOOK_INACTIVE' })),
      },
    });

    await expect(service.createReservation({ copyId: 7 }, MEMBER, {})).rejects.toMatchObject({
      statusCode: 409,
      code: 'BOOK_INACTIVE',
    });
    expect(reservationRepository.createReservation).toHaveBeenCalledWith(expect.objectContaining({
      userId: MEMBER.userId,
      copyId: 7,
      auditEntry: expect.objectContaining({ action: 'RESERVATION_CREATE' }),
    }));
  });

  // FR-FE08-019: expiration promotes only when a next eligible reservation exists.
  test('expires holds and promotes only the copies that still have a queue', async () => {
    const expired = [
      { reservationId: 1, copyId: 7 },
      { reservationId: 2, copyId: 8 },
    ];
    const next = reservation({ reservationId: 3, copyId: 8 });
    const repository = {
      expireOverdueHolds: jest.fn(async () => expired),
      findNextActiveReservationForCopy: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(next),
    };
    const { service, heldReservation } = makeService({ repository });

    await expect(service.expireHolds(LIBRARIAN, {})).resolves.toEqual({
      expiredCount: 2,
      expired,
      promoted: [heldReservation],
    });
  });
});
