jest.mock('../src/config/db', () => ({
  sql: {
    DateTime: 'DateTime',
    Int: 'Int',
    NVarChar: (size) => `NVarChar(${size})`,
  },
  getPool: jest.fn(),
}));

const { getPool } = require('../src/config/db');
const reportRepository = require('../src/repositories/reportRepository');

function useRecordset(recordset) {
  const capture = { inputs: {}, query: '' };

  getPool.mockResolvedValue({
    request() {
      return {
        input(name, _type, value) {
          capture.inputs[name] = value;
          return this;
        },
        async query(query) {
          capture.query = query;
          return { recordset };
        },
      };
    },
  });

  return capture;
}

beforeEach(() => {
  getPool.mockReset();
});

test('borrowing request status counts deduplicate joined detail rows', async () => {
  useRecordset([
    {
      RequestId: 10,
      RequestStatus: 'APPROVED',
      RequestDate: new Date('2026-06-10T08:00:00.000Z'),
      BorrowDetailId: 101,
      DetailStatus: 'BORROWED',
      BorrowDate: new Date('2026-06-10T08:00:00.000Z'),
      BookId: 1,
      Title: 'Clean Code',
    },
    {
      RequestId: 10,
      RequestStatus: 'APPROVED',
      RequestDate: new Date('2026-06-10T08:00:00.000Z'),
      BorrowDetailId: 102,
      DetailStatus: 'BORROWED',
      BorrowDate: new Date('2026-06-10T08:00:00.000Z'),
      BookId: 2,
      Title: 'Refactoring',
    },
  ]);

  const report = await reportRepository.getBorrowingReport();

  expect(report.totals.requests).toBe(1);
  expect(report.totals.details).toBe(2);
  expect(report.requestStatusCounts).toEqual({ APPROVED: 1 });
});

test('borrowing date-only toDate filters use an exclusive next-day boundary', async () => {
  const borrowingCapture = useRecordset([]);
  await reportRepository.getBorrowingReport({ toDate: '2026-06-10' });

  expect(borrowingCapture.query).toContain('br.RequestDate < @ToDateExclusive');
  expect(borrowingCapture.inputs.ToDateExclusive.toISOString()).toBe('2026-06-11T00:00:00.000Z');
});

test('borrowing reports filter derived OVERDUE rows as past-due borrowed details', async () => {
  const capture = useRecordset([]);

  await reportRepository.getBorrowingReport({ status: 'OVERDUE' });

  expect(capture.query).toContain("bd.Status = 'BORROWED'");
  expect(capture.query).toContain('bd.DueDate < CAST(GETDATE() AS DATE)');
  expect(capture.query).not.toContain('bd.Status = @Status');
  expect(capture.inputs).not.toHaveProperty('Status');
});

test('requested-only details do not create borrowing activity metrics', async () => {
  useRecordset([
    {
      RequestId: 30,
      RequestStatus: 'PENDING',
      RequestDate: new Date('2026-06-12T08:00:00.000Z'),
      BorrowDetailId: 301,
      DetailStatus: 'REQUESTED',
      BorrowDate: new Date('2026-06-12T08:00:00.000Z'),
      BookId: 3,
      Title: 'Requested Only',
    },
  ]);

  const report = await reportRepository.getBorrowingReport();

  expect(report.borrowCountByPeriod).toEqual({});
  expect(report.topBorrowedBooks).toEqual([]);
});

test('borrowing activity metrics include all actual-loan statuses and exclude requested details', async () => {
  useRecordset([
    { RequestId: 10, RequestStatus: 'APPROVED', RequestDate: new Date('2026-06-10T08:00:00.000Z'), BorrowDetailId: 101, DetailStatus: 'BORROWED', BorrowDate: new Date('2026-06-10T08:00:00.000Z'), BookId: 1, Title: 'Book One' },
    { RequestId: 10, RequestStatus: 'APPROVED', RequestDate: new Date('2026-06-10T08:00:00.000Z'), BorrowDetailId: 102, DetailStatus: 'RETURNED', BorrowDate: new Date('2026-06-10T08:00:00.000Z'), BookId: 1, Title: 'Book One' },
    { RequestId: 20, RequestStatus: 'APPROVED', RequestDate: new Date('2026-06-11T08:00:00.000Z'), BorrowDetailId: 201, DetailStatus: 'LOST', BorrowDate: new Date('2026-06-11T08:00:00.000Z'), BookId: 2, Title: 'Book Two' },
    { RequestId: 20, RequestStatus: 'APPROVED', RequestDate: new Date('2026-06-11T08:00:00.000Z'), BorrowDetailId: 202, DetailStatus: 'DAMAGED', BorrowDate: new Date('2026-06-11T08:00:00.000Z'), BookId: 2, Title: 'Book Two' },
    { RequestId: 20, RequestStatus: 'APPROVED', RequestDate: new Date('2026-06-11T08:00:00.000Z'), BorrowDetailId: 203, DetailStatus: 'OVERDUE', BorrowDate: new Date('2026-06-11T08:00:00.000Z'), BookId: 2, Title: 'Book Two' },
    { RequestId: 30, RequestStatus: 'PENDING', RequestDate: new Date('2026-06-11T08:00:00.000Z'), BorrowDetailId: 301, DetailStatus: 'REQUESTED', BorrowDate: new Date('2026-06-11T08:00:00.000Z'), BookId: 3, Title: 'Requested Only' },
  ]);

  const report = await reportRepository.getBorrowingReport();

  expect(report.borrowCountByPeriod).toEqual({ '2026-06-10': 2, '2026-06-11': 3 });
  expect(report.topBorrowedBooks).toEqual([
    { bookId: 2, title: 'Book Two', borrowCount: 3 },
    { bookId: 1, title: 'Book One', borrowCount: 2 },
  ]);
});

test('new member periods use membership approval dates instead of account creation dates', async () => {
  const capture = useRecordset([
    {
      UserId: 7,
      UserStatus: 'ACTIVE',
      CreatedAt: new Date('2026-01-05T09:00:00.000Z'),
      RoleId: 3,
      RoleName: 'MEMBER',
      MemberStatus: 'APPROVED',
      MemberApprovedAt: new Date('2026-06-10T14:30:00.000Z'),
    },
  ]);

  const report = await reportRepository.getUserStatistics();

  expect(capture.query).toContain('m.ApprovedAt AS MemberApprovedAt');
  expect(report.newMembersByPeriod).toEqual({ '2026-06-10': 1 });
});

test('user date filters limit approval-period metrics without changing user totals', async () => {
  const capture = useRecordset([
    {
      UserId: 7,
      UserStatus: 'ACTIVE',
      CreatedAt: new Date('2025-01-05T09:00:00.000Z'),
      RoleId: 3,
      RoleName: 'MEMBER',
      MemberStatus: 'APPROVED',
      MemberApprovedAt: new Date('2026-06-10T23:30:00.000Z'),
    },
    {
      UserId: 8,
      UserStatus: 'INACTIVE',
      CreatedAt: new Date('2026-06-10T09:00:00.000Z'),
      RoleId: 3,
      RoleName: 'MEMBER',
      MemberStatus: 'APPROVED',
      MemberApprovedAt: new Date('2026-05-20T09:00:00.000Z'),
    },
  ]);

  const report = await reportRepository.getUserStatistics({
    fromDate: '2026-06-01',
    toDate: '2026-06-10',
  });

  expect(capture.query).not.toContain('u.CreatedAt >= @FromDate');
  expect(capture.query).not.toContain('u.CreatedAt < @ToDateExclusive');
  expect(capture.inputs).not.toHaveProperty('FromDate');
  expect(capture.inputs).not.toHaveProperty('ToDateExclusive');
  expect(report.totals).toEqual({ users: 2, members: 2 });
  expect(report.usersByStatus).toEqual({ ACTIVE: 1, INACTIVE: 1 });
  expect(report.usersByRole).toEqual({ MEMBER: 2 });
  expect(report.newMembersByPeriod).toEqual({ '2026-06-10': 1 });
});

test('inventory categories count books and low-stock includes up to two available copies', async () => {
  useRecordset([
    { BookId: 1, Title: 'Book A', CategoryId: 1, CategoryName: 'Programming', CopyId: 11, CopyStatus: 'AVAILABLE' },
    { BookId: 1, Title: 'Book A', CategoryId: 1, CategoryName: 'Programming', CopyId: 12, CopyStatus: 'BORROWED' },
    { BookId: 2, Title: 'Book B', CategoryId: 1, CategoryName: 'Programming', CopyId: 21, CopyStatus: 'BORROWED' },
    { BookId: 3, Title: 'Book C', CategoryId: 1, CategoryName: 'Programming', CopyId: 31, CopyStatus: 'AVAILABLE' },
    { BookId: 3, Title: 'Book C', CategoryId: 1, CategoryName: 'Programming', CopyId: 32, CopyStatus: 'AVAILABLE' },
    { BookId: 4, Title: 'Book D', CategoryId: 1, CategoryName: 'Programming', CopyId: 41, CopyStatus: 'AVAILABLE' },
    { BookId: 4, Title: 'Book D', CategoryId: 1, CategoryName: 'Programming', CopyId: 42, CopyStatus: 'AVAILABLE' },
    { BookId: 4, Title: 'Book D', CategoryId: 1, CategoryName: 'Programming', CopyId: 43, CopyStatus: 'AVAILABLE' },
    { BookId: 5, Title: 'Book E', CategoryId: 1, CategoryName: 'Programming', CopyId: null, CopyStatus: null },
  ]);

  const report = await reportRepository.getInventoryReport();

  expect(report.categoryCounts).toEqual({ Programming: 5 });
  expect(report.lowAvailabilityBooks).toEqual([
    expect.objectContaining({ bookId: 1, totalCopies: 2, availableCopies: 1 }),
    expect.objectContaining({ bookId: 2, totalCopies: 1, availableCopies: 0 }),
    expect.objectContaining({ bookId: 3, totalCopies: 2, availableCopies: 2 }),
    expect.objectContaining({ bookId: 5, totalCopies: 0, availableCopies: 0 }),
  ]);
  expect(report.lowAvailabilityBooks).not.toEqual(
    expect.arrayContaining([expect.objectContaining({ bookId: 4 })])
  );
});

test('inventory copy filters do not hide full availability from low-stock calculations', async () => {
  const capture = useRecordset([
    { BookId: 1, Title: 'Book A', CategoryId: 1, CategoryName: 'Programming', CopyId: 11, CopyStatus: 'AVAILABLE', Location: 'A1' },
    { BookId: 1, Title: 'Book A', CategoryId: 1, CategoryName: 'Programming', CopyId: 12, CopyStatus: 'AVAILABLE', Location: 'A2' },
    { BookId: 1, Title: 'Book A', CategoryId: 1, CategoryName: 'Programming', CopyId: 13, CopyStatus: 'AVAILABLE', Location: 'A3' },
    { BookId: 1, Title: 'Book A', CategoryId: 1, CategoryName: 'Programming', CopyId: 14, CopyStatus: 'BORROWED', Location: 'A4' },
    { BookId: 2, Title: 'Book B', CategoryId: 1, CategoryName: 'Programming', CopyId: 21, CopyStatus: 'BORROWED', Location: 'B1' },
  ]);

  const report = await reportRepository.getInventoryReport({ status: 'BORROWED' });

  expect(capture.query).not.toContain('bc.Status = @Status');
  expect(capture.inputs).not.toHaveProperty('Status');
  expect(report.totals).toEqual({ books: 2, copies: 2 });
  expect(report.copyStatusCounts).toEqual({ BORROWED: 2 });
  expect(report.categoryCounts).toEqual({ Programming: 2 });
  expect(report.lowAvailabilityBooks).toEqual([
    expect.objectContaining({ bookId: 2, totalCopies: 1, availableCopies: 0 }),
  ]);
});
