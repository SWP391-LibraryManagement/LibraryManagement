const { makeInMemoryReportDependencies } = require('./helpers/inMemoryReportRepositories');

// These IDs follow the stable Roles seed order in database/Librarymanagement.sql.
const ROLE_IDS = {
  ADMIN: 1,
  LIBRARIAN: 2,
  MEMBER: 3,
  GUEST: 4,
};
const VALID_COPY_STATUSES = new Set(['AVAILABLE', 'BORROWED', 'RESERVED', 'DAMAGED', 'LOST', 'INACTIVE']);

function makeReportRepository({ borrowDetails, roleOverrides = [] } = {}) {
  const rolesByUserId = new Map([
    [1, ['ADMIN']],
    [2, ['LIBRARIAN']],
    [3, ['MEMBER']],
    [4, ['LIBRARIAN', 'MEMBER']],
  ]);
  for (const [userId, roles] of roleOverrides) {
    rolesByUserId.set(userId, roles);
  }

  const authState = {
    users: [
      { userId: 4, status: 'LOCKED' },
      { userId: 1, status: 'ACTIVE' },
      { userId: 3, status: 'ACTIVE' },
      { userId: 2, status: 'INACTIVE' },
    ],
    rolesByUserId,
  };
  const borrowingState = {
    categories: [
      { categoryId: 10, categoryName: 'Programming' },
      { categoryId: 20, categoryName: 'Technology' },
    ],
    books: [
      { bookId: 1, title: 'Book One', categoryId: 10 },
      { bookId: 2, title: 'Book Two', categoryId: 20 },
      { bookId: 3, title: 'Book Three', categoryId: 30 },
      { bookId: 4, title: 'Book Four' },
      { bookId: 5, title: 'Book Five' },
    ],
    copies: [
      { copyId: 1, bookId: 1, status: 'AVAILABLE', location: 'A1' },
      { copyId: 2, bookId: 1, status: 'BORROWED', location: 'A2' },
      { copyId: 3, bookId: 2, status: 'AVAILABLE', location: 'B1' },
      { copyId: 4, bookId: 4, status: 'LOST', location: 'C1' },
      { copyId: 5, bookId: 5, status: 'DAMAGED', location: 'D1' },
    ],
    borrowRequests: [
      { requestId: 10, userId: 1, requestDate: new Date('2026-01-10T12:00:00.000Z'), status: 'APPROVED' },
      { requestId: 20, userId: 2, requestDate: new Date('2026-01-10T12:00:00.000Z'), status: 'PENDING' },
    ],
    borrowDetails: borrowDetails || [
      // Detail userId is deliberately not the request owner: SQL filters br.UserId, not a detail field.
      { borrowDetailId: 101, requestId: 10, userId: 99, copyId: 1, borrowDate: new Date('2025-12-31T00:00:00.000Z'), dueDate: new Date('2099-01-01T00:00:00.000Z'), status: 'BORROWED' },
      { borrowDetailId: 102, requestId: 10, userId: 1, copyId: 2, borrowDate: new Date('2026-01-11T00:00:00.000Z'), dueDate: new Date('2026-01-12T00:00:00.000Z'), status: 'RETURNED' },
      { borrowDetailId: 201, requestId: 20, userId: 2, copyId: 3, borrowDate: new Date('2026-01-12T00:00:00.000Z'), dueDate: new Date('2099-01-01T00:00:00.000Z'), status: 'REQUESTED' },
      { borrowDetailId: 202, requestId: 20, userId: 2, copyId: 4, borrowDate: new Date('2026-01-12T00:00:00.000Z'), dueDate: new Date('2099-01-01T00:00:00.000Z'), status: 'LOST' },
      { borrowDetailId: 203, requestId: 20, userId: 2, copyId: 5, borrowDate: new Date('2026-01-12T00:00:00.000Z'), dueDate: new Date('2099-01-01T00:00:00.000Z'), status: 'DAMAGED' },
      { borrowDetailId: 204, requestId: 20, userId: 2, copyId: 5, borrowDate: new Date('2026-01-12T00:00:00.000Z'), dueDate: new Date('2099-01-01T00:00:00.000Z'), status: 'OVERDUE' },
    ],
    memberStatuses: new Map([
      [1, 'APPROVED'],
      [2, 'PENDING'],
      [3, 'REJECTED'],
      [4, 'INACTIVE'],
    ]),
    memberApprovedAt: new Map([
      [1, new Date('2026-01-10T12:00:00.000Z')],
      [4, new Date('2026-01-11T12:00:00.000Z')],
    ]),
  };

  return makeInMemoryReportDependencies(authState, borrowingState).reportRepository;
}

describe('in-memory FE12 report repository parity', () => {
  test('borrowing date filters apply to BorrowDate', async () => {
    const report = await makeReportRepository().getBorrowingReport({
      fromDate: '2026-01-11',
      toDate: '2026-01-12',
    });

    expect(report.totalRows).toBe(5);
    expect(report.rows.map((row) => row.borrowDetailId)).toEqual([204, 203, 202, 201, 102]);
  });

  test('borrowing book filters retain only matching joined rows and deduplicate request totals', async () => {
    const report = await makeReportRepository().getBorrowingReport({ bookId: 1 });

    expect(report.totalRows).toBe(2);
    expect(report.metrics.activeLoans).toBe(1);
  });

  test('borrowing request-status and owner filters select matching joined rows', async () => {
    const repository = makeReportRepository();
    const statusReport = await repository.getBorrowingReport({ status: 'APPROVED' });
    const ownerReport = await repository.getBorrowingReport({ userId: 1 });

    expect(statusReport.totalRows).toBe(2);
    expect(ownerReport.totalRows).toBe(2);
  });

  test('requested-only details do not create in-memory borrowing activity metrics', async () => {
    const report = await makeReportRepository().getBorrowingReport({ bookId: 2 });

    expect(report.metrics.borrowCountByPeriod).toEqual({});
    expect(report.metrics.topBorrowedBooks).toEqual([]);
  });

  test('in-memory borrowing activity metrics include actual-loan statuses and exclude requested details', async () => {
    const report = await makeReportRepository().getBorrowingReport();

    expect(report.metrics.borrowCountByPeriod).toEqual({
      '2025-12-31': 1,
      '2026-01-11': 1,
      '2026-01-12': 3,
    });
    expect(report.metrics.topBorrowedBooks).toEqual(expect.arrayContaining([
      { bookId: 1, title: 'Book One', borrowCount: 2 },
      { bookId: 4, title: 'Book Four', borrowCount: 1 },
      { bookId: 5, title: 'Book Five', borrowCount: 2 },
    ]));
    expect(report.metrics.topBorrowedBooks).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ bookId: 2 }),
    ]));
  });

  test('in-memory borrowing period metrics do not substitute RequestDate when BorrowDate is missing', async () => {
    const report = await makeReportRepository({
      borrowDetails: [
        {
          borrowDetailId: 101,
          requestId: 10,
          copyId: 1,
          borrowDate: null,
          dueDate: new Date('2026-01-20T00:00:00.000Z'),
          status: 'RETURNED',
        },
      ],
    }).getBorrowingReport();

    expect(report.metrics.borrowCountByPeriod).toEqual({});
  });

  test('in-memory OVERDUE filter includes derived past-due borrowed details', async () => {
    const report = await makeReportRepository({
      borrowDetails: [
        {
          borrowDetailId: 101,
          requestId: 10,
          copyId: 1,
          borrowDate: new Date('2020-01-01T00:00:00.000Z'),
          dueDate: new Date('2020-01-15T00:00:00.000Z'),
          status: 'BORROWED',
        },
      ],
    }).getBorrowingReport({ status: 'OVERDUE' });

    expect(report.totalRows).toBe(1);
    expect(report.rows[0].status).toBe('OVERDUE');
  });

  test('in-memory low-stock rows mirror the production category and copy envelope', async () => {
    const report = await makeReportRepository().getInventoryReport({ bookId: 1 });

    expect(report.metrics.lowStockBooks).toEqual([
      { bookId: 1, title: 'Book One', effectiveAvailability: 1 },
    ]);

    const allRows = await makeReportRepository().getInventoryReport();
    expect(allRows.metrics.copiesByStatus).toEqual({ AVAILABLE: 2, BORROWED: 1, LOST: 1, DAMAGED: 1 });
    expect(Object.keys(allRows.metrics.copiesByStatus).every((status) => VALID_COPY_STATUSES.has(status))).toBe(true);
    expect(allRows.metrics.lowStockBooks).toEqual(expect.arrayContaining([
      expect.objectContaining({ bookId: 2, effectiveAvailability: 1 }),
      expect.objectContaining({ bookId: 3, effectiveAvailability: 0 }),
    ]));
  });

  test('user role filters constrain every aggregate to the selected SQL role rows', async () => {
    const report = await makeReportRepository().getUserStatistics({ roleId: ROLE_IDS.LIBRARIAN });

    expect(report.metrics.totalMembers).toBe(0);
    expect(report.metrics.usersByStatus).toEqual({ INACTIVE: 1, LOCKED: 1 });
    expect(report.metrics.usersByRole).toEqual({ LIBRARIAN: 2 });
    expect(report.metrics.membershipByStatus).toEqual({ PENDING: 1, INACTIVE: 1 });
  });

  test('user status and membership filters apply before role and membership aggregates', async () => {
    const repository = makeReportRepository();
    const activeReport = await repository.getUserStatistics({ status: 'ACTIVE' });
    const pendingReport = await repository.getUserStatistics({ membershipStatus: 'PENDING' });

    expect(activeReport.metrics.totalMembers).toBe(1);
    expect(activeReport.metrics.usersByRole).toEqual({ ADMIN: 1, MEMBER: 1 });
    expect(activeReport.metrics.membershipByStatus).toEqual({ APPROVED: 1, REJECTED: 1 });
    expect(pendingReport.metrics.totalMembers).toBe(0);
    expect(pendingReport.metrics.usersByRole).toEqual({ LIBRARIAN: 1 });
    expect(pendingReport.metrics.membershipByStatus).toEqual({ PENDING: 1 });
  });

  test('user q search matches approved account fields before aggregation and pagination', async () => {
    const report = await makeReportRepository().getUserStatistics({ q: 'inactive' });

    expect(report.totalRows).toBe(2);
    expect(report.rows.map((row) => row.userId)).toEqual([2, 4]);
    expect(report.metrics.usersByStatus).toEqual({ INACTIVE: 1, LOCKED: 1 });
  });

  test.each([
    ['%MEMBER%', [3, 4]],
    ['L_BRARIAN', [2, 4]],
    ['[1-2]', [1, 2]],
    ['[^A-Z0-9]', []],
    ['[^]]', [1, 2, 3, 4]],
  ])('user q preserves SQL LIKE semantics for %s', async (q, expectedUserIds) => {
    const report = await makeReportRepository().getUserStatistics({ q });

    expect(report.rows.map((row) => row.userId)).toEqual(expectedUserIds);
  });

  test('user q treats a leading closing bracket as a SQL LIKE class member', async () => {
    const report = await makeReportRepository({
      roleOverrides: [[4, ['LIBRARIAN', 'MEMBER', ']']]],
    }).getUserStatistics({ q: '[]]' });

    expect(report.rows.map((row) => row.userId)).toEqual([4]);
  });

  test('user q keeps ordinary literal matching case-insensitive', async () => {
    const report = await makeReportRepository().getUserStatistics({ q: 'lIbRaRiAn' });

    expect(report.rows.map((row) => row.userId)).toEqual([2, 4]);
  });

  test('historical approvals remain in growth metrics after membership becomes inactive', async () => {
    const report = await makeReportRepository().getUserStatistics({
      fromDate: '2026-01-10',
      toDate: '2026-01-11',
    });

    expect(report.metrics.newMembersByPeriod).toEqual({
      '2026-01-10': 1,
      '2026-01-11': 1,
    });
  });

  test('user detail rows use stable ascending user ID order', async () => {
    const report = await makeReportRepository().getUserStatistics();

    expect(report.rows.map((row) => row.userId)).toEqual([1, 2, 3, 4]);
  });
});
