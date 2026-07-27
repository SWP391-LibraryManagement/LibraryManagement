const fs = require('fs');
const path = require('path');
const {
  makeInMemoryNotificationDependencies,
} = require('./helpers/inMemoryNotificationRepositories');

const utilityPath = path.join(__dirname, '..', 'src', 'utils', 'notificationInbox.js');
const repositoryPath = path.join(
  __dirname,
  '..',
  'src',
  'repositories',
  'notificationRepository.js'
);
const utilityExists = fs.existsSync(utilityPath);
const inboxUtility = utilityExists ? require(utilityPath) : {};
const repositorySource = fs.readFileSync(repositoryPath, 'utf8');

// @spec BR-FE10-015 BR-FE10-017 FR-FE10-015 AC-FE10-015
test('safe inbox projection exposes seven fields and derives only canonical action paths', () => {
  expect(utilityExists).toBe(true);
  expect(typeof inboxUtility.toSafeInboxItem).toBe('function');
  expect(typeof inboxUtility.getInboxActionPath).toBe('function');
  if (!utilityExists || typeof inboxUtility.toSafeInboxItem !== 'function') return;

  const base = {
    notificationId: 41,
    type: 'DUE_DATE_REMINDER',
    templateKey: 'DUE_DATE_REMINDER',
    sourceFeature: 'FE07',
    title: 'Due date reminder',
    body: 'Please return the book on time.',
    createdAt: '2026-07-28T01:00:00.000Z',
    readAt: null,
    recipientEmail: 'must-not-leak@example.test',
    safePayload: { internal: true },
    idempotencyKey: 'must-not-leak',
  };

  expect(inboxUtility.toSafeInboxItem(base)).toEqual({
    notificationId: 41,
    type: 'DUE_DATE_REMINDER',
    title: 'Due date reminder',
    message: 'Please return the book on time.',
    createdAt: '2026-07-28T01:00:00.000Z',
    readAt: null,
    actionPath: '/borrowing/history',
  });
  expect(Object.keys(inboxUtility.toSafeInboxItem(base)).sort()).toEqual([
    'actionPath',
    'createdAt',
    'message',
    'notificationId',
    'readAt',
    'title',
    'type',
  ]);

  const canonicalMappings = [
    ['GENERAL_SYSTEM', 'MEMBERSHIP_RESULT', 'FE04', '/membership'],
    ['RESERVATION_AVAILABLE', 'RESERVATION_READY', 'FE08', '/reservations/mine'],
    ['DUE_DATE_REMINDER', 'DUE_DATE_REMINDER', 'FE07', '/borrowing/history'],
    ['OVERDUE_NOTICE', 'OVERDUE_NOTICE', 'FE07', '/borrowing/history'],
    ['FINE_NOTICE', 'FINE_NOTICE', 'FE09', '/fines/mine'],
  ];

  for (const [type, templateKey, sourceFeature, actionPath] of canonicalMappings) {
    expect(inboxUtility.getInboxActionPath({ type, templateKey, sourceFeature })).toBe(actionPath);
  }
  expect(inboxUtility.getInboxActionPath({ ...base, templateKey: 'MEMBERSHIP_RESULT' })).toBeNull();
  expect(inboxUtility.getInboxActionPath({ ...base, sourceFeature: 'FE04' })).toBeNull();
  expect(inboxUtility.getInboxActionPath({ ...base, actionPath: 'https://evil.test' })).toBe(
    '/borrowing/history'
  );
});

// @spec BR-FE10-014 BR-FE10-015 BR-FE10-020 FR-FE10-011 FR-FE10-012
test('SQL inbox queries enforce ownership, eligibility, filters, ordering, and bounded pagination', () => {
  expect(repositorySource).toMatch(/async function listInboxForUser/);
  expect(repositorySource).toMatch(/async function countUnreadForUser/);
  expect(repositorySource).toMatch(/UserId\s*=\s*@UserId/i);
  expect(repositorySource).toMatch(/ReadAt\s+IS\s+NULL/i);
  expect(repositorySource).toMatch(/ReadAt\s+IS\s+NOT\s+NULL/i);
  expect(repositorySource).toMatch(/NotificationType\s*=\s*@Type/i);
  expect(repositorySource).toMatch(/ORDER BY\s+CreatedAt\s+DESC\s*,\s*NotificationId\s+DESC/i);
  expect(repositorySource).toMatch(/\.input\(\s*['"]Offset['"]\s*,\s*sql\.BigInt\s*,\s*offset\s*\)/i);
  expect(repositorySource).toMatch(/OFFSET\s+@Offset\s+ROWS/i);
  expect(repositorySource).toMatch(/FETCH\s+NEXT\s+@Limit\s+ROWS\s+ONLY/i);
  expect(repositorySource).toMatch(/COUNT_BIG\s*\(\s*1\s*\)/i);

  for (const [type, templateKey] of [
    ['GENERAL_SYSTEM', 'MEMBERSHIP_RESULT'],
    ['RESERVATION_AVAILABLE', 'RESERVATION_READY'],
    ['DUE_DATE_REMINDER', 'DUE_DATE_REMINDER'],
    ['OVERDUE_NOTICE', 'OVERDUE_NOTICE'],
    ['FINE_NOTICE', 'FINE_NOTICE'],
  ]) {
    expect(repositorySource).toMatch(
      new RegExp(
        `NotificationType\\s*=\\s*'${type}'[\\s\\S]{0,120}TemplateKey\\s*=\\s*'${templateKey}'`,
        'i'
      )
    );
  }
});

// @spec BR-FE10-014 BR-FE10-015 BR-FE10-016 FR-FE10-011 FR-FE10-012 AC-FE10-011 AC-FE10-012
test('in-memory inbox mirrors own-user eligibility, pagination, and unread count', async () => {
  const dependencies = makeInMemoryNotificationDependencies();
  const repository = dependencies.notificationRepository;
  expect(typeof repository.listInboxForUser).toBe('function');
  expect(typeof repository.countUnreadForUser).toBe('function');
  if (typeof repository.listInboxForUser !== 'function') return;

  dependencies.state.notifications.push(
    {
      notificationId: 101,
      userId: 7,
      type: 'DUE_DATE_REMINDER',
      templateKey: 'DUE_DATE_REMINDER',
      sourceFeature: 'FE07',
      createdAt: '2026-07-28T03:00:00.000Z',
      readAt: null,
    },
    {
      notificationId: 102,
      userId: 8,
      type: 'DUE_DATE_REMINDER',
      templateKey: 'DUE_DATE_REMINDER',
      sourceFeature: 'FE07',
      createdAt: '2026-07-28T04:00:00.000Z',
      readAt: null,
    },
    {
      notificationId: 103,
      userId: 7,
      type: 'ACCOUNT_SETUP',
      templateKey: 'ACCOUNT_SETUP',
      sourceFeature: 'FE11',
      createdAt: '2026-07-28T05:00:00.000Z',
      readAt: null,
    },
    {
      notificationId: 104,
      userId: null,
      type: 'FINE_NOTICE',
      templateKey: 'FINE_NOTICE',
      sourceFeature: 'FE09',
      createdAt: '2026-07-28T06:00:00.000Z',
      readAt: null,
    },
    {
      notificationId: 105,
      userId: 7,
      type: 'DUE_DATE_REMINDER',
      templateKey: 'MEMBERSHIP_RESULT',
      sourceFeature: 'FE07',
      createdAt: '2026-07-28T07:00:00.000Z',
      readAt: null,
    }
  );

  await expect(
    repository.listInboxForUser({ userId: 7, page: 1, limit: 20, readState: 'unread' })
  ).resolves.toMatchObject({
    total: 1,
    notifications: [expect.objectContaining({ notificationId: 101 })],
  });
  await expect(repository.countUnreadForUser(7)).resolves.toBe(1);
});

// @spec BR-FE10-014 BR-FE10-015 BR-FE10-016 FR-FE10-013 FR-FE10-014 AC-FE10-013 AC-FE10-014
test('read mutations are owned, sensitive-safe, and idempotent with one mark-all timestamp', async () => {
  const dependencies = makeInMemoryNotificationDependencies();
  const repository = dependencies.notificationRepository;
  expect(typeof repository.markInboxReadForUser).toBe('function');
  expect(typeof repository.markAllInboxReadForUser).toBe('function');
  if (typeof repository.markInboxReadForUser !== 'function') return;

  dependencies.state.notifications.push(
    {
      notificationId: 201,
      userId: 7,
      type: 'DUE_DATE_REMINDER',
      templateKey: 'DUE_DATE_REMINDER',
      sourceFeature: 'FE07',
      createdAt: '2026-07-28T01:00:00.000Z',
      readAt: null,
      status: 'PENDING',
      attemptCount: 0,
    },
    {
      notificationId: 202,
      userId: 8,
      type: 'DUE_DATE_REMINDER',
      templateKey: 'DUE_DATE_REMINDER',
      sourceFeature: 'FE07',
      createdAt: '2026-07-28T02:00:00.000Z',
      readAt: null,
    },
    {
      notificationId: 203,
      userId: 7,
      type: 'PASSWORD_RESET',
      templateKey: 'PASSWORD_RESET',
      sourceFeature: 'FE02',
      createdAt: '2026-07-28T03:00:00.000Z',
      readAt: null,
    }
  );

  await expect(
    repository.markInboxReadForUser({ notificationId: 202, userId: 7 })
  ).resolves.toBeNull();
  await expect(
    repository.markInboxReadForUser({ notificationId: 203, userId: 7 })
  ).resolves.toBeNull();

  const first = await repository.markInboxReadForUser({ notificationId: 201, userId: 7 });
  const replay = await repository.markInboxReadForUser({ notificationId: 201, userId: 7 });
  expect(first.readAt).toBeTruthy();
  expect(replay.readAt).toBe(first.readAt);
  expect(replay).toEqual(expect.objectContaining({ status: 'PENDING', attemptCount: 0 }));

  dependencies.state.notifications.push(
    {
      notificationId: 204,
      userId: 7,
      type: 'OVERDUE_NOTICE',
      templateKey: 'OVERDUE_NOTICE',
      sourceFeature: 'FE07',
      createdAt: '2026-07-28T04:00:00.000Z',
      readAt: null,
    },
    {
      notificationId: 205,
      userId: 7,
      type: 'FINE_NOTICE',
      templateKey: 'FINE_NOTICE',
      sourceFeature: 'FE09',
      createdAt: '2026-07-28T05:00:00.000Z',
      readAt: null,
    }
  );

  await expect(repository.markAllInboxReadForUser(7)).resolves.toEqual({ updated: 2 });
  const markedRows = dependencies.state.notifications.filter(({ notificationId }) =>
    [204, 205].includes(notificationId)
  );
  expect(markedRows[0].readAt).toEqual(markedRows[1].readAt);
  await expect(repository.markAllInboxReadForUser(7)).resolves.toEqual({ updated: 0 });
});

// @spec BR-FE10-016 FR-FE10-013 FR-FE10-014
test('SQL read mutations preserve first read time and use one server time for mark-all', () => {
  expect(repositorySource).toMatch(/async function markInboxReadForUser/);
  expect(repositorySource).toMatch(/ReadAt\s*=\s*COALESCE\(ReadAt\s*,\s*SYSUTCDATETIME\(\)\)/i);
  expect(repositorySource).toMatch(/async function markAllInboxReadForUser/);
  expect(repositorySource).toMatch(/DECLARE\s+@ReadAt\s+DATETIME2\s*=\s*SYSUTCDATETIME\(\)/i);
  expect(repositorySource).toMatch(/SET\s+ReadAt\s*=\s*@ReadAt/i);
  expect(repositorySource).toMatch(/AND\s+ReadAt\s+IS\s+NULL/i);
});
