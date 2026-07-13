const { makeInMemoryReportDependencies } = require('./helpers/inMemoryReportRepositories');

// These IDs follow the stable Roles seed order in database/Librarymanagement.sql.
const ROLE_IDS = {
  ADMIN: 1,
  LIBRARIAN: 2,
  MEMBER: 3,
  GUEST: 4,
};
const VALID_COPY_STATUSES = new Set(['AVAILABLE', 'BORROWED', 'RESERVED', 'DAMAGED', 'LOST', 'INACTIVE']);

function makeReportRepository() {
  const authState = {
    users: [
      { userId: 1, status: 'ACTIVE' },
      { userId: 2, status: 'INACTIVE' },
      { userId: 3, status: 'ACTIVE' },
      { userId: 4, status: 'LOCKED' },
    ],
    rolesByUserId: new Map([
      [1, ['ADMIN']],
      [2, ['LIBRARIAN']],
      [3, ['MEMBER']],
      [4, ['LIBRARIAN', 'MEMBER']],
    ]),
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
    borrowDetails: [
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
    memberApprovedAt: new Map([[1, new Date('2026-01-10T12:00:00.000Z')]]),
  };

  return makeInMemoryReportDependencies(authState, borrowingState).reportRepository;
}

describe('in-memory FE12 report repository parity', () => {
  test('borrowing date filters retain every joined detail from requests in the request-date range', async () => {
    const report = await makeReportRepository().getBorrowingReport({
      fromDate: '2026-01-10',
      toDate: '2026-01-10',
    });

    expect(report.totals).toMatchObject({ requests: 2, details: 6, activeLoans: 1 });
    expect(report.requestStatusCounts).toEqual({ APPROVED: 1, PENDING: 1 });
    expect(report.detailStatusCounts).toEqual({ BORROWED: 1, RETURNED: 1, REQUESTED: 1, LOST: 1, DAMAGED: 1, OVERDUE: 1 });
  });

  test('borrowing book filters retain only matching joined rows and deduplicate request totals', async () => {
    const report = await makeReportRepository().getBorrowingReport({ bookId: 1 });

    expect(report.totals).toMatchObject({ requests: 1, details: 2, activeLoans: 1 });
    expect(report.requestStatusCounts).toEqual({ APPROVED: 1 });
    expect(report.detailStatusCounts).toEqual({ BORROWED: 1, RETURNED: 1 });
  });

  test('borrowing request-status and owner filters select matching joined rows', async () => {
    const repository = makeReportRepository();
    const statusReport = await repository.getBorrowingReport({ status: 'APPROVED' });
    const ownerReport = await repository.getBorrowingReport({ userId: 1 });

    expect(statusReport.totals).toMatchObject({ requests: 1, details: 2 });
    expect(statusReport.detailStatusCounts).toEqual({ BORROWED: 1, RETURNED: 1 });
    expect(ownerReport.totals).toMatchObject({ requests: 1, details: 2 });
    expect(ownerReport.detailStatusCounts).toEqual({ BORROWED: 1, RETURNED: 1 });
  });

  test('requested-only details do not create in-memory borrowing activity metrics', async () => {
    const report = await makeReportRepository().getBorrowingReport({ bookId: 2 });

    expect(report.borrowCountByPeriod).toEqual({});
    expect(report.topBorrowedBooks).toEqual([]);
  });

  test('in-memory borrowing activity metrics include actual-loan statuses and exclude requested details', async () => {
    const report = await makeReportRepository().getBorrowingReport();

    expect(report.borrowCountByPeriod).toEqual({
      '2025-12-31': 1,
      '2026-01-11': 1,
      '2026-01-12': 3,
    });
    expect(report.topBorrowedBooks).toEqual(expect.arrayContaining([
      { bookId: 1, title: 'Book One', borrowCount: 2 },
      { bookId: 4, title: 'Book Four', borrowCount: 1 },
      { bookId: 5, title: 'Book Five', borrowCount: 2 },
    ]));
    expect(report.topBorrowedBooks).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ bookId: 2 }),
    ]));
  });

  test('in-memory low-stock rows mirror the production category and copy envelope', async () => {
    const report = await makeReportRepository().getInventoryReport({ bookId: 1 });

    expect(report.lowAvailabilityBooks).toEqual([
      {
        bookId: 1,
        title: 'Book One',
        categoryId: 10,
        categoryName: 'Programming',
        copies: [
          { copyId: 1, status: 'AVAILABLE', location: 'A1' },
          { copyId: 2, status: 'BORROWED', location: 'A2' },
        ],
        totalCopies: 2,
        availableCopies: 1,
      },
    ]);

    const allRows = await makeReportRepository().getInventoryReport();
    expect(allRows.categoryCounts).toEqual({ Programming: 1, Technology: 1, UNKNOWN: 3 });
    expect(allRows.copyStatusCounts).toEqual({ AVAILABLE: 2, BORROWED: 1, LOST: 1, DAMAGED: 1 });
    expect(Object.keys(allRows.copyStatusCounts).every((status) => VALID_COPY_STATUSES.has(status))).toBe(true);
    expect(allRows.lowAvailabilityBooks).toEqual(expect.arrayContaining([
      expect.objectContaining({ bookId: 2, categoryName: 'Technology' }),
      expect.objectContaining({ bookId: 3, categoryName: null, copies: [] }),
    ]));
  });

  test('user role filters constrain every aggregate to the selected SQL role rows', async () => {
    const report = await makeReportRepository().getUserStatistics({ roleId: ROLE_IDS.LIBRARIAN });

    expect(report.totals).toEqual({ users: 2, members: 0 });
    expect(report.usersByStatus).toEqual({ INACTIVE: 1, LOCKED: 1 });
    expect(report.usersByRole).toEqual({ LIBRARIAN: 2 });
    expect(report.membersByStatus).toEqual({ PENDING: 1, INACTIVE: 1 });
  });

  test('user status and membership filters apply before role and membership aggregates', async () => {
    const repository = makeReportRepository();
    const activeReport = await repository.getUserStatistics({ status: 'ACTIVE' });
    const pendingReport = await repository.getUserStatistics({ membershipStatus: 'PENDING' });

    expect(activeReport.totals).toEqual({ users: 2, members: 1 });
    expect(activeReport.usersByRole).toEqual({ ADMIN: 1, MEMBER: 1 });
    expect(activeReport.membersByStatus).toEqual({ APPROVED: 1, REJECTED: 1 });
    expect(pendingReport.totals).toEqual({ users: 1, members: 0 });
    expect(pendingReport.usersByRole).toEqual({ LIBRARIAN: 1 });
    expect(pendingReport.membersByStatus).toEqual({ PENDING: 1 });
  });
});
