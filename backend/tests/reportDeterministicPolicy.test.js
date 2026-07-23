process.env.JWT_SECRET = process.env.JWT_SECRET || require('crypto').randomBytes(32).toString('hex');

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const YAML = require('yamljs');
const { createApp } = require('../src/app');
const { makeInMemoryReportDependencies } = require('./helpers/inMemoryReportRepositories');

function makeBoundaryApp() {
  const authService = {
    authenticateToken: jest.fn(async () => ({ userId: 1, roles: ['ADMIN'] })),
  };
  const emptyReport = { metrics: {}, rows: [], page: 1, limit: 20, totalRows: 0 };
  const reportService = {
    getBorrowingReport: jest.fn(async () => emptyReport),
    getInventoryReport: jest.fn(async () => emptyReport),
    getUserStatistics: jest.fn(async () => emptyReport),
    auditAccessFailure: jest.fn(async () => {}),
  };

  return { app: createApp({ authService, reportService }), reportService };
}

function makeRepository() {
  const authState = {
    users: [
      { userId: 1, status: 'MYSTERY', createdAt: new Date('2026-06-02T00:00:00.000Z') },
      { userId: 2, status: 'ACTIVE', createdAt: new Date('2026-06-03T00:00:00.000Z') },
    ],
    rolesByUserId: new Map([
      [1, ['ALIEN_ROLE']],
      [2, ['ADMIN']],
    ]),
  };
  const borrowingState = {
    categories: [{ categoryId: 1, categoryName: 'Programming' }],
    books: [
      { bookId: 2, title: 'Zebra', categoryId: 1 },
      { bookId: 1, title: 'Alpha', categoryId: 1 },
    ],
    copies: [
      { copyId: 3, bookId: 2, status: 'ALIEN_COPY', location: 'Z1' },
      { copyId: 2, bookId: 1, status: 'BORROWED', location: 'A2' },
      { copyId: 1, bookId: 1, status: 'AVAILABLE', location: 'A1' },
    ],
    borrowRequests: [
      {
        requestId: 1,
        userId: 1,
        requestDate: new Date('2026-06-01T00:00:00.000Z'),
        status: 'MYSTERY_REQUEST',
      },
    ],
    borrowDetails: [
      {
        borrowDetailId: 11,
        requestId: 1,
        copyId: 1,
        borrowDate: new Date('2026-06-01T00:00:00.000Z'),
        dueDate: new Date('2099-01-01T00:00:00.000Z'),
        status: 'MYSTERY_DETAIL',
      },
      {
        borrowDetailId: 13,
        requestId: 1,
        copyId: 3,
        borrowDate: new Date('2026-06-02T00:00:00.000Z'),
        dueDate: new Date('2099-01-01T00:00:00.000Z'),
        status: 'BORROWED',
      },
      {
        borrowDetailId: 12,
        requestId: 1,
        copyId: 2,
        borrowDate: new Date('2026-06-03T00:00:00.000Z'),
        dueDate: new Date('2026-06-04T00:00:00.000Z'),
        returnDate: new Date('2026-06-05T00:00:00.000Z'),
        status: 'RETURNED',
      },
    ],
    memberStatuses: new Map([
      [1, 'MYSTERY_MEMBER'],
      [2, 'APPROVED'],
    ]),
    memberApprovedAt: new Map([[2, new Date('2026-06-03T00:00:00.000Z')]]),
  };

  return makeInMemoryReportDependencies(authState, borrowingState).reportRepository;
}

// @spec AC-FE12-005 AC-FE12-010 FR-FE12-005
test('all report endpoints reject invalid page and limit before calling the service', async () => {
  const cases = [
    ['/api/reports/borrowing?page=0', 'getBorrowingReport'],
    ['/api/reports/borrowing?limit=101', 'getBorrowingReport'],
    ['/api/reports/inventory?page=0', 'getInventoryReport'],
    ['/api/reports/inventory?limit=101', 'getInventoryReport'],
    ['/api/reports/users?page=0', 'getUserStatistics'],
    ['/api/reports/users?limit=101', 'getUserStatistics'],
  ];

  for (const [url, method] of cases) {
    const { app, reportService } = makeBoundaryApp();
    const response = await request(app).get(url).set('Authorization', 'Bearer token');
    expect(response.status).toBe(400);
    expect(reportService[method]).not.toHaveBeenCalled();
  }
});

// @spec AC-FE12-006 AC-FE12-010 BR-FE12-008 BR-FE12-015
test('unknown IDs return canonical empty reports with default pagination', async () => {
  const repository = makeRepository();
  const reports = await Promise.all([
    repository.getBorrowingReport({ userId: 999999 }),
    repository.getInventoryReport({ bookId: 999999 }),
    repository.getUserStatistics({ roleId: 999999 }),
  ]);

  for (const report of reports) {
    expect(Object.keys(report).sort()).toEqual(['limit', 'metrics', 'page', 'rows', 'totalRows']);
    expect(report).toEqual(
      expect.objectContaining({ rows: [], page: 1, limit: 20, totalRows: 0 })
    );
  }
});

// @spec AC-FE12-010 BR-FE12-010 BR-FE12-015
test('detailed rows normalize unknown statuses and use report-specific stable ordering', async () => {
  const repository = makeRepository();
  const borrowing = await repository.getBorrowingReport({ page: 1, limit: 2 });
  const borrowingAll = await repository.getBorrowingReport({ page: 1, limit: 20 });
  const inventory = await repository.getInventoryReport({ page: 1, limit: 20 });
  const users = await repository.getUserStatistics({ page: 1, limit: 20 });

  expect(borrowing.rows.map((row) => row.borrowDetailId)).toEqual([12, 13]);
  expect(borrowing).toEqual(expect.objectContaining({ page: 1, limit: 2, totalRows: 3 }));
  expect(borrowingAll.rows.find((row) => row.borrowDetailId === 11).status).toBe('UNKNOWN');
  expect(borrowingAll.rows.find((row) => row.borrowDetailId === 12)).toEqual(
    expect.objectContaining({
      borrowDate: '2026-06-03',
      dueDate: '2026-06-04',
      returnDate: '2026-06-05',
    })
  );

  expect(inventory.rows.map((row) => row.copyId)).toEqual([1, 2, 3]);
  expect(inventory.rows.find((row) => row.copyId === 3).status).toBe('UNKNOWN');
  expect(inventory.metrics.copiesByStatus).toEqual({ AVAILABLE: 1, BORROWED: 1, UNKNOWN: 1 });

  expect(users.rows.map((row) => row.userId)).toEqual([1, 2]);
  expect(users.rows.find((row) => row.userId === 1)).toEqual(
    expect.objectContaining({ status: 'UNKNOWN', roles: ['UNKNOWN'], membershipStatus: 'UNKNOWN' })
  );
  expect(users.metrics.usersByStatus).toEqual({ ACTIVE: 1, UNKNOWN: 1 });
  expect(users.metrics.membershipByStatus).toEqual({ APPROVED: 1, UNKNOWN: 1 });
});

// @spec BR-FE12-013
test('report routes, OpenAPI, and report pages expose no export surface', () => {
  const document = YAML.load(path.resolve(__dirname, '../src/docs/openapi.yaml'));
  expect(Object.keys(document.paths).filter((route) => route.startsWith('/api/reports/'))).toEqual([
    '/api/reports/borrowing',
    '/api/reports/inventory',
    '/api/reports/users',
  ]);

  const reportUi = [
    'BorrowingReportPage.jsx',
    'InventoryReportPage.jsx',
    'UserStatisticsPage.jsx',
  ]
    .map((file) =>
      fs.readFileSync(path.resolve(__dirname, `../../frontend/src/page/report/${file}`), 'utf8')
    )
    .join('\n');
  expect(reportUi).not.toMatch(/\b(download|csv|pdf|spreadsheet)\b/i);
});
