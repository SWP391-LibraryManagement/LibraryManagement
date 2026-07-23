jest.mock('../src/config/db', () => ({
  sql: {
    Date: 'Date',
    DateTime: 'DateTime',
    Int: 'Int',
    NVarChar: (size) => `NVarChar(${size})`,
  },
  getPool: jest.fn(),
}));

const { getPool } = require('../src/config/db');
const reportRepository = require('../src/repositories/reportRepository');
const fs = require('fs');
const path = require('path');

const repositorySource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'repositories', 'reportRepository.js'),
  'utf8'
);

function useQueryResult(queryResult) {
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
          return queryResult;
        },
      };
    },
  });

  return capture;
}

function useRecordset(recordset) {
  return useQueryResult({ recordset });
}

function useRecordsets(recordsets) {
  return useQueryResult({ recordsets, recordset: recordsets[0] || [] });
}

function useUserReport({
  totalMembers,
  totalRows,
  usersByStatus = [],
  usersByRole = [],
  membershipByStatus = [],
  newMembersByPeriod = [],
  pageRows = [],
}) {
  return useRecordsets([
    [{ TotalMembers: totalMembers }],
    [{ TotalRows: totalRows }],
    usersByStatus,
    usersByRole,
    membershipByStatus,
    newMembersByPeriod,
    pageRows,
  ]);
}

beforeEach(() => {
  getPool.mockReset();
});

test('all detailed report rows are paged by SQL with stable OFFSET/FETCH queries', () => {
  expect(
    repositorySource.match(/OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY/g)
  ).toHaveLength(3);
  expect(repositorySource).not.toContain('rows.slice(offset, offset + limit)');
});

test('report metrics are aggregated in SQL without returning full temp-table snapshots', () => {
  expect(repositorySource).not.toMatch(
    /SELECT \*\s+FROM #(Borrow|Inventory|User)ReportRows\s+(?:u\s+)?ORDER BY/g
  );
  expect(repositorySource).not.toContain('snapshot.allRows');
  expect(repositorySource).toContain('GROUP BY CONVERT(DATE, BorrowDate)');
  expect(repositorySource).toContain('COUNT(DISTINCT BookId) AS TotalBooks');
  expect(repositorySource).toContain('COUNT(DISTINCT UserId) AS TotalMembers');
});

test('report searches are parameterized and user rows use increasing IDs', async () => {
  const borrowing = useRecordset([]);
  await reportRepository.getBorrowingReport({ q: '1984' });
  expect(borrowing.inputs.Search).toBe('%1984%');
  expect(borrowing.query).toContain('b.Title LIKE @Search');

  const inventory = useRecordset([]);
  await reportRepository.getInventoryReport({ q: 'BC14' });
  expect(inventory.inputs.Search).toBe('%BC14%');
  expect(inventory.query).toContain('bc.Barcode LIKE @Search');

  const users = useRecordset([
    { UserId: 9, UserStatus: 'ACTIVE', CreatedAt: new Date('2026-01-01') },
    { UserId: 2, UserStatus: 'ACTIVE', CreatedAt: new Date('2026-07-01') },
  ]);
  const report = await reportRepository.getUserStatistics({ q: 'member' });
  expect(users.inputs.Search).toBe('%member%');
  expect(users.query).toContain('ORDER BY userRows.UserId ASC');
  expect(report.rows.map((row) => row.userId)).toEqual([2, 9]);
});

test('borrowing request status counts deduplicate joined detail rows', async () => {
  useRecordsets([
    [{ ActiveLoans: 2, OverdueLoans: 0, TotalRows: 2 }],
    [{ PeriodDate: new Date('2026-06-10T00:00:00.000Z'), BorrowCount: 2 }],
    [],
    [
      {
        RequestId: 10,
        RequestStatus: 'APPROVED',
        RequestDate: new Date('2026-06-10T08:00:00.000Z'),
        BorrowDetailId: 101,
        DetailStatus: 'BORROWED',
        BorrowDate: new Date('2026-06-10T08:00:00.000Z'),
        DueDate: null,
        ReturnDate: null,
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
    ],
  ]);

  const report = await reportRepository.getBorrowingReport();

  expect(report.totalRows).toBe(2);
  expect(report.metrics.activeLoans).toBe(2);
  expect(report.rows.map((row) => row.borrowDetailId)).toEqual([102, 101]);
  expect(report.rows.map((row) => row.borrowDate)).toEqual(['2026-06-10', '2026-06-10']);
  expect(report.rows.find((row) => row.borrowDetailId === 101)).toEqual(
    expect.objectContaining({ dueDate: null, returnDate: null })
  );
});

test('borrowing date-only toDate filters use an exclusive next-day boundary', async () => {
  const borrowingCapture = useRecordset([]);
  await reportRepository.getBorrowingReport({ toDate: '2026-06-10' });

  expect(borrowingCapture.query).toContain('bd.BorrowDate < @ToDateExclusive');
  expect(borrowingCapture.inputs.ToDateExclusive.toISOString()).toBe('2026-06-11T00:00:00.000Z');
});

test('borrowing rows sort by the raw borrow timestamp before the detail ID tie-breaker', async () => {
  useRecordset([
    {
      RequestId: 10,
      UserId: 1,
      BorrowDetailId: 200,
      CopyId: 2,
      DetailStatus: 'RETURNED',
      BorrowDate: new Date('2026-06-10T08:00:00.000Z'),
      BookId: 2,
    },
    {
      RequestId: 10,
      UserId: 1,
      BorrowDetailId: 100,
      CopyId: 1,
      DetailStatus: 'RETURNED',
      BorrowDate: new Date('2026-06-10T09:00:00.000Z'),
      BookId: 1,
    },
  ]);

  const report = await reportRepository.getBorrowingReport();

  expect(report.rows.map((row) => row.borrowDetailId)).toEqual([100, 200]);
  expect(report.rows.map((row) => row.borrowDate)).toEqual(['2026-06-10', '2026-06-10']);
});

test('borrowing reports filter derived OVERDUE rows as past-due borrowed details', async () => {
  const capture = useRecordset([]);

  await reportRepository.getBorrowingReport({ status: 'OVERDUE' });

  expect(capture.query).toContain("bd.Status = 'BORROWED'");
  expect(capture.query).toContain('bd.DueDate < @BusinessDate');
  expect(capture.query).not.toContain('GETDATE()');
  expect(capture.inputs.BusinessDate).toBeInstanceOf(Date);
  expect(capture.query).not.toContain('bd.Status = @Status');
  expect(capture.inputs).not.toHaveProperty('Status');
});

test('borrowing period metrics do not substitute RequestDate when BorrowDate is missing', async () => {
  useRecordset([
    {
      RequestId: 30,
      RequestStatus: 'APPROVED',
      RequestDate: new Date('2026-06-12T08:00:00.000Z'),
      BorrowDetailId: 301,
      DetailStatus: 'RETURNED',
      BorrowDate: null,
      BookId: 3,
      Title: 'Missing Borrow Date',
    },
  ]);

  const report = await reportRepository.getBorrowingReport();

  expect(report.metrics.borrowCountByPeriod).toEqual({});
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

  expect(report.metrics.borrowCountByPeriod).toEqual({});
  expect(report.metrics.topBorrowedBooks).toEqual([]);
});

test('borrowing activity metrics include all actual-loan statuses and exclude requested details', async () => {
  useRecordsets([
    [{ ActiveLoans: 1, OverdueLoans: 1, TotalRows: 6 }],
    [
      { PeriodDate: new Date('2026-06-10T00:00:00.000Z'), BorrowCount: 2 },
      { PeriodDate: new Date('2026-06-11T00:00:00.000Z'), BorrowCount: 3 },
    ],
    [
      { BookId: 2, Title: 'Book Two', BorrowCount: 3 },
      { BookId: 1, Title: 'Book One', BorrowCount: 2 },
    ],
    [],
  ]);

  const report = await reportRepository.getBorrowingReport();

  expect(report.metrics.borrowCountByPeriod).toEqual({ '2026-06-10': 2, '2026-06-11': 3 });
  expect(report.metrics.topBorrowedBooks).toEqual([
    { bookId: 2, title: 'Book Two', borrowCount: 3 },
    { bookId: 1, title: 'Book One', borrowCount: 2 },
  ]);
});

test('new member periods use membership approval dates instead of account creation dates', async () => {
  const pageRows = [{
    UserId: 7,
    UserStatus: 'ACTIVE',
    CreatedAt: new Date('2026-01-05T09:00:00.000Z'),
    RoleId: 3,
    RoleName: 'MEMBER',
    MemberStatus: 'APPROVED',
    MemberApprovedAt: new Date('2026-06-10T14:30:00.000Z'),
  }];
  const capture = useUserReport({
    totalMembers: 1,
    totalRows: 1,
    usersByStatus: [{ UserStatus: 'ACTIVE', UserCount: 1 }],
    usersByRole: [{ RoleName: 'MEMBER', UserCount: 1 }],
    membershipByStatus: [{ MemberStatus: 'APPROVED', UserCount: 1 }],
    newMembersByPeriod: [{
      PeriodDate: new Date('2026-06-10T00:00:00.000Z'),
      MemberCount: 1,
    }],
    pageRows,
  });

  const report = await reportRepository.getUserStatistics();

  expect(capture.query).toContain('m.ApprovedAt AS MemberApprovedAt');
  expect(report.metrics.newMembersByPeriod).toEqual({ '2026-06-10': 1 });
});

test('historically approved members remain in growth metrics after membership becomes inactive', async () => {
  useUserReport({
    totalMembers: 1,
    totalRows: 1,
    usersByStatus: [{ UserStatus: 'INACTIVE', UserCount: 1 }],
    usersByRole: [{ RoleName: 'MEMBER', UserCount: 1 }],
    membershipByStatus: [{ MemberStatus: 'INACTIVE', UserCount: 1 }],
    newMembersByPeriod: [{
      PeriodDate: new Date('2026-06-10T00:00:00.000Z'),
      MemberCount: 1,
    }],
    pageRows: [{
      UserId: 7,
      UserStatus: 'INACTIVE',
      CreatedAt: new Date('2026-01-05T09:00:00.000Z'),
      RoleId: 3,
      RoleName: 'MEMBER',
      MemberStatus: 'INACTIVE',
      MemberApprovedAt: new Date('2026-06-10T14:30:00.000Z'),
      IsInApprovalPeriod: 1,
    }],
  });

  const report = await reportRepository.getUserStatistics({
    fromDate: '2026-06-01',
    toDate: '2026-06-30',
  });

  expect(report.metrics.membershipByStatus).toEqual({ INACTIVE: 1 });
  expect(report.metrics.newMembersByPeriod).toEqual({ '2026-06-10': 1 });
});

test('user date filters limit approval-period metrics without changing user totals', async () => {
  const pageRows = [
    {
      UserId: 7,
      UserStatus: 'ACTIVE',
      CreatedAt: new Date('2025-01-05T09:00:00.000Z'),
      RoleId: 3,
      RoleName: 'MEMBER',
      MemberStatus: 'APPROVED',
      MemberApprovedAt: new Date('2026-06-10T23:30:00.000Z'),
      IsInApprovalPeriod: 1,
    },
    {
      UserId: 8,
      UserStatus: 'INACTIVE',
      CreatedAt: new Date('2026-06-10T09:00:00.000Z'),
      RoleId: 3,
      RoleName: 'MEMBER',
      MemberStatus: 'APPROVED',
      MemberApprovedAt: new Date('2026-05-20T09:00:00.000Z'),
      IsInApprovalPeriod: 0,
    },
  ];
  const capture = useUserReport({
    totalMembers: 2,
    totalRows: 2,
    usersByStatus: [
      { UserStatus: 'ACTIVE', UserCount: 1 },
      { UserStatus: 'INACTIVE', UserCount: 1 },
    ],
    usersByRole: [{ RoleName: 'MEMBER', UserCount: 2 }],
    membershipByStatus: [{ MemberStatus: 'APPROVED', UserCount: 2 }],
    newMembersByPeriod: [{
      PeriodDate: new Date('2026-06-10T00:00:00.000Z'),
      MemberCount: 1,
    }],
    pageRows,
  });

  const report = await reportRepository.getUserStatistics({
    fromDate: '2026-06-01',
    toDate: '2026-06-10',
  });

  expect(capture.query).toContain('m.ApprovedAt >= @FromDate');
  expect(capture.query).toContain('m.ApprovedAt < @ToDateExclusive');
  expect(capture.query).not.toMatch(/WHERE[\s\S]*m\.ApprovedAt >= @FromDate/);
  expect(capture.inputs.FromDate.toISOString()).toBe('2026-06-01T00:00:00.000Z');
  expect(capture.inputs.ToDateExclusive.toISOString()).toBe('2026-06-11T00:00:00.000Z');
  expect(report.metrics.totalMembers).toBe(2);
  expect(report.metrics.usersByStatus).toEqual({ ACTIVE: 1, INACTIVE: 1 });
  expect(report.metrics.usersByRole).toEqual({ MEMBER: 2 });
  expect(report.metrics.newMembersByPeriod).toEqual({ '2026-06-10': 1 });
});

test('inventory categories count books and low-stock includes up to two available copies', async () => {
  useRecordsets([
    [{ TotalBooks: 5, TotalCopies: 8, TotalRows: 8 }],
    [
      { CopyStatus: 'AVAILABLE', CopyCount: 6 },
      { CopyStatus: 'BORROWED', CopyCount: 2 },
    ],
    [
      { BookId: 1, Title: 'Book A', EffectiveAvailability: 1 },
      { BookId: 2, Title: 'Book B', EffectiveAvailability: 0 },
      { BookId: 3, Title: 'Book C', EffectiveAvailability: 2 },
      { BookId: 5, Title: 'Book E', EffectiveAvailability: 0 },
    ],
    [],
  ]);

  const report = await reportRepository.getInventoryReport();

  expect(report.metrics.totalBooks).toBe(5);
  expect(report.metrics.lowStockBooks).toEqual([
    expect.objectContaining({ bookId: 1, effectiveAvailability: 1 }),
    expect.objectContaining({ bookId: 2, effectiveAvailability: 0 }),
    expect.objectContaining({ bookId: 3, effectiveAvailability: 2 }),
    expect.objectContaining({ bookId: 5, effectiveAvailability: 0 }),
  ]);
  expect(report.metrics.lowStockBooks).not.toEqual(
    expect.arrayContaining([expect.objectContaining({ bookId: 4 })])
  );
});

test('inventory copy filters do not hide full availability from low-stock calculations', async () => {
  const capture = useRecordsets([
    [{ TotalBooks: 2, TotalCopies: 2, TotalRows: 2 }],
    [{ CopyStatus: 'BORROWED', CopyCount: 2 }],
    [{ BookId: 2, Title: 'Book B', EffectiveAvailability: 0 }],
    [
      { BookId: 1, Title: 'Book A', CopyId: 14, CopyStatus: 'BORROWED', Location: 'A4', EffectiveAvailability: 3 },
      { BookId: 2, Title: 'Book B', CopyId: 21, CopyStatus: 'BORROWED', Location: 'B1', EffectiveAvailability: 0 },
    ],
  ]);

  const report = await reportRepository.getInventoryReport({ status: 'BORROWED' });

  expect(capture.query).toContain('bc.Status = @CopyStatus');
  expect(capture.query).toContain('EffectiveAvailability');
  expect(capture.inputs.CopyStatus).toBe('BORROWED');
  expect(report.metrics).toEqual(
    expect.objectContaining({ totalBooks: 2, totalCopies: 2, copiesByStatus: { BORROWED: 2 } })
  );
  expect(report.metrics.lowStockBooks).toEqual([
    expect.objectContaining({ bookId: 2, effectiveAvailability: 0 }),
  ]);
});

test('inventory status and location filters must match the same copy in SQL', async () => {
  const capture = useRecordset([]);

  await reportRepository.getInventoryReport({ status: 'BORROWED', location: 'A1' });

  expect(capture.query).toContain('bc.Status = @CopyStatus');
  expect(capture.query).toContain('bc.Location = @Location');
  expect(capture.query).not.toContain('FROM BookCopies selectedCopy');
});
