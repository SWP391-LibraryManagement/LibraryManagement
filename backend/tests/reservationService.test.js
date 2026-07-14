const { createReservationService } = require('../src/services/reservationService');

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
    createReservation: jest.fn(async ({ userId, copyId }) => reservation({ userId, copyId })),
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
    expect(successful.auditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: { copyId: 7, reason: null } })
    );
  });

  // FR-FE08-018: direct processing validates identity, state, and copy consistency before holding.
  test.each([
    ['missing reservation', null, {}, 'RESERVATION_NOT_FOUND', 404],
    ['inactive reservation', reservation({ status: 'CANCELLED' }), {}, 'RESERVATION_NOT_ACTIVE', 409],
    ['copy mismatch', reservation(), { copyId: 99 }, 'COPY_MISMATCH', 400],
  ])('rejects processReservation for %s', async (_label, foundReservation, input, code, statusCode) => {
    const { service } = makeService({
      repository: { findReservationById: jest.fn(async () => foundReservation) },
    });

    await expect(service.processReservation(51, input, LIBRARIAN)).rejects.toMatchObject({
      code,
      statusCode,
    });
  });

  test('rejects invalid IDs and a hold race without changing business rules', async () => {
    const invalid = makeService();
    await expect(invalid.service.processReservation(0, {}, LIBRARIAN)).rejects.toMatchObject({
      code: 'INVALID_ID',
      statusCode: 400,
    });

    const raced = makeService({ repository: { holdReservation: jest.fn(async () => null) } });
    await expect(raced.service.processReservation(51, {}, LIBRARIAN)).rejects.toMatchObject({
      code: 'COPY_NOT_AVAILABLE',
      statusCode: 409,
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

  // FR-FE08-021: notification and its failure audit are best effort after a successful hold.
  test('keeps a held reservation when notification and failure-audit requests fail', async () => {
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
    const { service, heldReservation } = makeService({ auditLogRepository, notificationRequest });

    await expect(service.processReservation(51, {}, LIBRARIAN, {})).resolves.toEqual({
      reservation: heldReservation,
    });
    expect(auditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'RESERVATION_PROCESS' })
    );
  });

  test('supports auditing-disabled repositories without blocking reservation creation', async () => {
    const { service } = makeService({ auditLogRepository: {} });

    await expect(service.createReservation({ copyId: 7 }, MEMBER, {})).resolves.toEqual({
      reservation: expect.objectContaining({ userId: MEMBER.userId, copyId: 7 }),
    });
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
