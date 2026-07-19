jest.mock('../src/repositories/auditLogRepository', () => ({
  create: jest.fn(),
  listAuditLogs: jest.fn(),
}));

const auditLogRepository = require('../src/repositories/auditLogRepository');
const adminService = require('../src/services/adminService');

function rawRow(action, metadata, overrides = {}) {
  return {
    logId: 10,
    userId: 7,
    actorEmail: 'admin@example.test',
    actorName: 'Admin User',
    action,
    targetType: 'USER',
    targetId: 15,
    targetEmail: 'member@example.test',
    targetName: 'Member User',
    metadata: JSON.stringify(metadata),
    ipAddress: '203.0.113.10',
    createdAt: new Date('2026-07-18T10:00:00.000Z'),
    userAgent: 'must-not-leak',
    ...overrides,
  };
}

async function project(action, metadata, overrides) {
  auditLogRepository.listAuditLogs.mockResolvedValue({
    data: [rawRow(action, metadata, overrides)],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  });
  const result = await adminService.listAuditLogs({});
  return result.data[0];
}

beforeEach(() => auditLogRepository.listAuditLogs.mockReset());

test('listAuditLogs applies defaults and returns only the canonical DTO', async () => {
  auditLogRepository.listAuditLogs.mockResolvedValue({
    data: [rawRow('USER_ROLE_ASSIGN', { roleId: 2, roleName: 'LIBRARIAN' })],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  });

  const result = await adminService.listAuditLogs({});

  expect(auditLogRepository.listAuditLogs).toHaveBeenCalledWith({
    page: 1,
    limit: 20,
    q: undefined,
    action: undefined,
    actorId: undefined,
    from: undefined,
    to: undefined,
  });
  expect(result.data[0]).toEqual({
    logId: 10,
    action: 'USER_ROLE_ASSIGN',
    actor: { userId: 7, email: 'admin@example.test', fullName: 'Admin User' },
    target: { type: 'USER', id: 15, label: 'member@example.test' },
    details: { roleId: 2, roleName: 'LIBRARIAN' },
    ipAddress: '203.0.113.10',
    createdAt: new Date('2026-07-18T10:00:00.000Z'),
  });
  expect(result.data[0]).not.toHaveProperty('metadata');
  expect(result.data[0]).not.toHaveProperty('userAgent');
});

test('non-user targets never borrow a user label', async () => {
  const row = await project('FINE_CALCULATE', {
    borrowDetailId: 4,
    memberId: 9,
    overdueDays: 2,
    amount: 10000,
  }, {
    targetType: 'FINE',
    targetId: 15,
    targetEmail: 'wrong-user@example.test',
    targetName: 'Wrong User',
  });

  expect(row.target).toEqual({ type: 'FINE', id: 15, label: null });
});

const projectorCases = [
  { actions: ['USER_CREATE'], metadata: { roleName: 'MEMBER', email: 'omit@example.test' }, expected: { roleName: 'MEMBER' } },
  { actions: ['USER_UPDATE'], metadata: { fields: ['email', 'fullName', 'passwordHash'] }, expected: { changedFields: ['email', 'fullName'] } },
  { actions: ['USER_DEACTIVATE'], metadata: { status: 'INACTIVE' }, expected: { newStatus: 'INACTIVE' } },
  { actions: ['USER_ROLE_ASSIGN', 'USER_ROLE_REVOKE'], metadata: { roleId: 2, roleName: 'LIBRARIAN' }, expected: { roleId: 2, roleName: 'LIBRARIAN' } },
  { actions: ['BORROW_REQUEST_CREATE'], metadata: { copyIds: [1, 2] }, expected: { copyIds: [1, 2] } },
  { actions: ['BORROW_REQUEST_APPROVE'], metadata: { approvedMemberId: 9, copyIds: [1, 2], notes: 'omit' }, expected: { memberUserId: 9, copyIds: [1, 2], notesProvided: true } },
  { actions: ['BORROW_REQUEST_REJECT'], metadata: { rejectedMemberId: 9, reason: 'omit' }, expected: { memberUserId: 9, reasonProvided: true } },
  { actions: ['BORROW_DETAIL_RETURN'], metadata: { requestId: 3, memberId: 9, copyId: 1, condition: 'NORMAL', overdueDays: 0, notes: null }, expected: { requestId: 3, memberId: 9, copyId: 1, condition: 'NORMAL', overdueDays: 0, notesProvided: false } },
  { actions: ['BORROW_DETAIL_RENEW'], metadata: { requestId: 3, memberId: 9, copyId: 1, newDueDate: '2026-08-01T00:00:00.000Z', notes: 'ok' }, expected: { requestId: 3, memberId: 9, copyId: 1, newDueDate: '2026-08-01T00:00:00.000Z', notesProvided: true } },
  { actions: ['RESERVATION_FULFILL'], metadata: { requestId: 3, copyId: 1, memberUserId: 9 }, expected: { requestId: 3, copyId: 1, memberUserId: 9 } },
  { actions: ['RESERVATION_CREATE', 'RESERVATION_EXPIRE'], metadata: { copyId: 1 }, expected: { copyId: 1 } },
  { actions: ['RESERVATION_CANCEL'], metadata: { copyId: 1, reason: 'omit' }, expected: { copyId: 1, reasonProvided: true } },
  { actions: ['RESERVATION_NOTIFY_FAILED'], metadata: { code: 'NOTIFICATION_REQUEST_FAILED', message: 'omit' }, expected: { code: 'NOTIFICATION_REQUEST_FAILED' } },
  { actions: ['RESERVATION_PROCESS'], metadata: { copyId: 1, selectedUserId: 9, expiresAt: '2026-07-20T00:00:00.000Z' }, expected: { copyId: 1, selectedUserId: 9, expiresAt: '2026-07-20T00:00:00.000Z' } },
  { actions: ['FINE_CALCULATE'], metadata: { borrowDetailId: 4, memberId: 9, overdueDays: 2, amount: 10000 }, expected: { borrowDetailId: 4, memberId: 9, overdueDays: 2, amount: 10000 } },
  { actions: ['FINE_COLLECT'], metadata: { collectedAmount: 5000, fullyCollected: false, note: 'omit' }, expected: { collectedAmount: 5000, fullyCollected: false, noteProvided: true } },
  { actions: ['FINE_MARK_PAID'], metadata: { amount: 10000, note: null }, expected: { amount: 10000, noteProvided: false } },
  { actions: ['FINE_WAIVE', 'FINE_CANCEL'], metadata: { reason: 'omit' }, expected: { reasonProvided: true } },
  { actions: ['BOOK_COPY_CREATE'], metadata: { bookId: 3, barcode: 'BC-1', status: 'AVAILABLE', location: 'A1' }, expected: { bookId: 3, barcode: 'BC-1', status: 'AVAILABLE', location: 'A1' } },
  { actions: ['BOOK_COPY_UPDATE'], metadata: { before: { bookId: 3, status: 'AVAILABLE', title: 'omit', isbn: 'omit' }, patch: { location: 'B2', status: 'DAMAGED' } }, expected: { bookId: 3, changedFields: ['location', 'status'], previousStatus: 'AVAILABLE', newStatus: 'DAMAGED' } },
  { actions: ['BOOK_COPY_STATUS_UPDATE'], metadata: { oldStatus: 'AVAILABLE', newStatus: 'DAMAGED', reason: 'omit' }, expected: { previousStatus: 'AVAILABLE', newStatus: 'DAMAGED', reasonProvided: true } },
  { actions: ['BOOK_COPY_DEACTIVATE'], metadata: { oldStatus: 'AVAILABLE', newStatus: 'INACTIVE' }, expected: { previousStatus: 'AVAILABLE', newStatus: 'INACTIVE' } },
  { actions: ['MEMBERSHIP_APPLICATION_SUBMITTED', 'MEMBERSHIP_APPLICATION_APPROVED'], metadata: { userId: 9, status: 'APPROVED' }, expected: { userId: 9, status: 'APPROVED' } },
  { actions: ['MEMBERSHIP_APPLICATION_REJECTED'], metadata: { userId: 9, status: 'REJECTED', reason: 'omit' }, expected: { userId: 9, status: 'REJECTED', reasonProvided: true } },
  { actions: ['PROFILE_UPDATE'], metadata: { fields: ['fullName', 'phone', 'passwordHash'] }, expected: { changedFields: ['fullName', 'phone'] } },
  { actions: ['REPORT_ACCESS_DENIED'], metadata: { code: 'ROLE_REQUIRED', statusCode: 403, method: 'GET', path: '/api/reports/users' }, expected: { code: 'ROLE_REQUIRED', statusCode: 403, method: 'GET', reportType: 'USERS' } },
  { actions: ['NOTIFICATION_REQUEST_CREATE'], metadata: { type: 'DUE_DATE_REMINDER', channel: 'EMAIL', sourceFeature: 'FE07', sourceEntityType: 'BorrowRequest', sourceEntityId: 3 }, expected: { type: 'DUE_DATE_REMINDER', channel: 'EMAIL', sourceFeature: 'FE07', sourceEntityType: 'BorrowRequest', sourceEntityId: 3 } },
  { actions: ['NOTIFICATION_RETRY'], metadata: { fromStatus: 'FAILED', toStatus: 'PENDING' }, expected: { previousStatus: 'FAILED', newStatus: 'PENDING' } },
  { actions: ['NOTIFICATION_PROCESS_PENDING'], metadata: { processed: 4, failed: 1 }, expected: { processed: 4, failed: 1 } },
];

for (const fixture of projectorCases) {
  for (const action of fixture.actions) {
    test(`${action} returns only its approved detail fields`, async () => {
      await expect(project(action, fixture.metadata)).resolves.toMatchObject({
        details: fixture.expected,
      });
    });

    test(`${action} ignores hostile extra keys`, async () => {
      const hostile = {
        ...fixture.metadata,
        passwordHash: 'forbidden',
        tokenId: 88,
        nested: { sessionSecret: 'forbidden' },
      };
      const row = await project(action, hostile);
      expect(row.details).toEqual(fixture.expected);
      expect(JSON.stringify(row.details)).not.toContain('forbidden');
    });

    test(`${action} fails closed for a malformed required field`, async () => {
      const [requiredKey] = Object.keys(fixture.metadata);
      const malformed = { ...fixture.metadata, [requiredKey]: { invalid: true } };
      await expect(project(action, malformed)).resolves.toMatchObject({ details: {} });
    });
  }
}

const emptyDetailActions = [
  'AUTH_PASSWORD_CHANGE_FAILURE', 'AUTH_VERIFY_EMAIL', 'AUTH_LOGIN_LOCKED',
  'AUTH_ACCOUNT_AUTO_UNLOCKED', 'AUTH_LOGIN_INACTIVE', 'AUTH_LOGIN_FAILURE',
  'AUTH_LOGIN_SUCCESS', 'AUTH_REFRESH_TOKEN', 'AUTH_LOGOUT',
  'AUTH_PASSWORD_CHANGE_SUCCESS', 'AUTH_CHANGE_PASSWORD_OTP_REQUESTED',
  'AUTH_PASSWORD_RESET_SUCCESS', 'AUTH_REGISTER', 'AUTH_RESEND_VERIFICATION',
  'AUTH_PASSWORD_RESET_REQUEST', 'AUTH_LOGIN_ATTEMPT',
  'AUTH_ACCOUNT_SETUP_COMPLETE', 'USER_ACCOUNT_SETUP_RESEND',
];

test.each(emptyDetailActions)('%s always returns empty details', async (action) => {
  await expect(project(action, { tokenId: 99, email: 'omit@example.test' }))
    .resolves.toMatchObject({ details: {} });
});

test.each([
  ['REPORT_BORROWING_VIEW', 'BORROWING'],
  ['REPORT_INVENTORY_VIEW', 'INVENTORY'],
  ['REPORT_USERS_VIEW', 'USERS'],
])('%s derives reportType without exposing metadata', async (action, reportType) => {
  await expect(project(action, {})).resolves.toMatchObject({ details: { reportType } });
});

test.each(['{', '[]', '"scalar"', 'null'])('invalid metadata %s returns empty details', async (metadata) => {
  const row = await project('USER_ROLE_ASSIGN', {}, { metadata });
  expect(row.details).toEqual({});
});

test('unknown actions return empty details', async () => {
  await expect(project('UNKNOWN_ACTION', { passwordHash: 'forbidden' }))
    .resolves.toMatchObject({ details: {} });
});

test('AuthToken notification sources omit the credential identifier', async () => {
  const row = await project('NOTIFICATION_REQUEST_CREATE', {
    type: 'ACCOUNT_SETUP',
    channel: 'EMAIL',
    sourceFeature: 'FE11',
    sourceEntityType: 'AuthToken',
    sourceEntityId: 99,
  });
  expect(row.details).toEqual({
    type: 'ACCOUNT_SETUP',
    channel: 'EMAIL',
    sourceFeature: 'FE11',
    sourceEntityType: 'AuthToken',
  });
});

test('invalid IDs, numbers, dates, arrays, and nested allowed values fail closed', async () => {
  await expect(project('USER_ROLE_ASSIGN', { roleId: 0, roleName: 'ADMIN' }))
    .resolves.toMatchObject({ details: {} });
  await expect(project('FINE_CALCULATE', { borrowDetailId: 1, memberId: 2, overdueDays: -1, amount: Infinity }))
    .resolves.toMatchObject({ details: {} });
  await expect(project('BORROW_DETAIL_RENEW', { requestId: 1, memberId: 2, copyId: 3, newDueDate: 'not-a-date', notes: null }))
    .resolves.toMatchObject({ details: {} });
  await expect(project('BORROW_REQUEST_CREATE', { copyIds: [1, { token: 'nested' }] }))
    .resolves.toMatchObject({ details: {} });
});

test('projected arrays are capped at 100 values', async () => {
  const row = await project('BORROW_REQUEST_CREATE', {
    copyIds: Array.from({ length: 120 }, (_, index) => index + 1),
  });
  expect(row.details.copyIds).toHaveLength(100);
});
