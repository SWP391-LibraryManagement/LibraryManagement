const { createReportService } = require('../src/services/reportService');

const LIBRARIAN = { userId: 22, roles: ['LIBRARIAN'] };
const MEMBER = { userId: 11, roles: ['MEMBER'] };

function makeService({ auditLogRepository, repository = {}, clock } = {}) {
  const reportRepository = {
    getBorrowingReport: jest.fn(async () => ({ totals: { requests: 1 } })),
    getInventoryReport: jest.fn(async () => ({ totals: { copies: 2 } })),
    getUserStatistics: jest.fn(async () => ({ totals: { users: 3 } })),
    getOperationsSummary: jest.fn(async () => ({
      pendingBorrowRequests: 1,
      activeLoans: 2,
      overdueLoans: 1,
      openReservations: 3,
      availableCopies: 4,
      lowStockBooks: 2,
    })),
    ...repository,
  };
  const activeAuditRepository =
    auditLogRepository === undefined ? { create: jest.fn(async () => {}) } : auditLogRepository;
  const service = createReportService({
    reportRepository,
    auditLogRepository: activeAuditRepository,
    clock,
  });

  return { service, reportRepository, auditLogRepository: activeAuditRepository };
}

describe('FE12 report service coverage', () => {
  test('forwards filters and writes actor-scoped audit entries for every report', async () => {
    const { service, reportRepository, auditLogRepository } = makeService();
    const context = { userId: 999, ip: '127.0.0.1', userAgent: 'report-service-test' };

    await service.getBorrowingReport({ status: 'BORROWED' }, LIBRARIAN, context);
    await service.getInventoryReport({ status: 'AVAILABLE' }, LIBRARIAN, context);
    await service.getUserStatistics({ status: 'ACTIVE' }, LIBRARIAN, context);

    expect(reportRepository.getBorrowingReport).toHaveBeenCalledWith(
      { status: 'BORROWED' },
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
    );
    expect(reportRepository.getInventoryReport).toHaveBeenCalledWith({ status: 'AVAILABLE' });
    expect(reportRepository.getUserStatistics).toHaveBeenCalledWith({ status: 'ACTIVE' });
    expect(auditLogRepository.create).toHaveBeenCalledTimes(3);
    expect(auditLogRepository.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        userId: LIBRARIAN.userId,
        action: 'REPORT_BORROWING_VIEW',
        metadata: {
          reportType: 'BORROWING',
          result: 'SUCCESS',
          timestamp: expect.anything(),
        },
      })
    );
    expect(JSON.stringify(auditLogRepository.create.mock.calls)).not.toContain('BORROWED');
  });

  test('derives one library business date from the service clock for borrowing reports', async () => {
    const clock = jest.fn(() => new Date('2026-07-13T17:00:00.000Z'));
    const { service, reportRepository, auditLogRepository } = makeService({ clock });

    await service.getBorrowingReport({}, LIBRARIAN);

    expect(clock).toHaveBeenCalledTimes(1);
    expect(reportRepository.getBorrowingReport).toHaveBeenCalledWith({}, '2026-07-14');
    expect(auditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          timestamp: '2026-07-13T17:00:00.000Z',
        }),
      })
    );
  });

  test('derives operations summary businessDate and generatedAt from one clock read', async () => {
    const clock = jest.fn(() => new Date('2026-07-13T17:00:00.000Z'));
    const { service, reportRepository, auditLogRepository } = makeService({ clock });

    const result = await service.getOperationsSummary(LIBRARIAN);

    expect(clock).toHaveBeenCalledTimes(1);
    expect(reportRepository.getOperationsSummary).toHaveBeenCalledWith('2026-07-14');
    expect(result).toEqual({
      pendingBorrowRequests: 1,
      activeLoans: 2,
      overdueLoans: 1,
      openReservations: 3,
      availableCopies: 4,
      lowStockBooks: 2,
      generatedAt: '2026-07-13T17:00:00.000Z',
    });
    expect(auditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: LIBRARIAN.userId,
        action: 'REPORT_OPERATIONS_SUMMARY_VIEW',
        metadata: {
          reportType: 'OPERATIONS_SUMMARY',
          result: 'SUCCESS',
          timestamp: '2026-07-13T17:00:00.000Z',
        },
      })
    );
  });

  test('rejects missing and member roles for all staff report operations', async () => {
    const { service } = makeService();

    await expect(service.getBorrowingReport({}, { userId: 1 })).rejects.toMatchObject({
      code: 'ROLE_REQUIRED',
      statusCode: 403,
    });
    await expect(service.getInventoryReport({}, MEMBER)).rejects.toMatchObject({
      code: 'ROLE_REQUIRED',
      statusCode: 403,
    });
    await expect(service.getUserStatistics({}, MEMBER)).rejects.toMatchObject({
      code: 'ROLE_REQUIRED',
      statusCode: 403,
    });
    await expect(service.getOperationsSummary(MEMBER)).rejects.toMatchObject({
      code: 'ROLE_REQUIRED',
      statusCode: 403,
    });
  });

  // NFR-FE12-LOG-001: access-failure audit entries use safe fallback values.
  test('maps unknown 5xx failures to safe audit metadata', async () => {
    const { service, auditLogRepository } = makeService();

    await service.auditAccessFailure(undefined, undefined, {});

    expect(auditLogRepository.create).toHaveBeenCalledWith({
      userId: null,
      action: 'REPORT_ACCESS_DENIED',
      targetType: 'REPORT',
      targetId: null,
      metadata: {
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        method: null,
        path: null,
      },
      ipAddress: null,
      userAgent: null,
    });
  });

  test('maps non-5xx failures without codes to UNKNOWN_ERROR', async () => {
    const { service, auditLogRepository } = makeService();

    await service.auditAccessFailure(
      { statusCode: 403 },
      LIBRARIAN,
      { method: 'GET', path: '/api/reports/users' }
    );

    expect(auditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: LIBRARIAN.userId,
        metadata: {
          code: 'UNKNOWN_ERROR',
          statusCode: 403,
          method: 'GET',
          path: '/api/reports/users',
        },
      })
    );
  });

  test('allows report reads and failure handling when audit persistence is unavailable', async () => {
    const { service } = makeService({ auditLogRepository: {} });

    await expect(service.getBorrowingReport({}, LIBRARIAN)).resolves.toEqual({
      totals: { requests: 1 },
    });
    await expect(service.auditAccessFailure({ statusCode: 500 }, LIBRARIAN)).resolves.toBeUndefined();
  });
});
