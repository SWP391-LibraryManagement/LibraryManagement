jest.mock('../src/config/db', () => ({
  sql: {
    Date: 'Date',
    Int: 'Int',
    MAX: 'MAX',
    NVarChar: (size) => `NVarChar(${size})`,
  },
  getPool: jest.fn(),
}));

const { getPool } = require('../src/config/db');
const auditLogRepository = require('../src/repositories/auditLogRepository');

function useRecordsets(recordsets) {
  const capture = { inputs: {}, query: '' };
  getPool.mockResolvedValue({
    request() {
      return {
        input(name, type, value) {
          capture.inputs[name] = { type, value };
          return this;
        },
        async query(statement) {
          capture.query = statement;
          return { recordsets };
        },
      };
    },
  });
  return capture;
}

beforeEach(() => getPool.mockReset());

test('listAuditLogs binds typed pagination and every supplied filter', async () => {
  const capture = useRecordsets([[], [{ Total: 0 }]]);

  await auditLogRepository.listAuditLogs({
    page: 2,
    limit: 20,
    q: 'login',
    action: 'AUTH_LOGIN_SUCCESS',
    actorId: 7,
    from: '2026-07-01',
    to: '2026-07-18',
  });

  expect(capture.inputs).toMatchObject({
    Offset: { type: 'Int', value: 20 },
    Limit: { type: 'Int', value: 20 },
    Search: { type: 'NVarChar(202)', value: '%login%' },
    Action: { type: 'NVarChar(100)', value: 'AUTH_LOGIN_SUCCESS' },
    ActorId: { type: 'Int', value: 7 },
    FromDate: { type: 'Date', value: '2026-07-01' },
    ToDate: { type: 'Date', value: '2026-07-18' },
  });
});

test('listAuditLogs escapes LIKE metacharacters and keeps request text out of SQL', async () => {
  const capture = useRecordsets([[], [{ Total: 0 }]]);

  await auditLogRepository.listAuditLogs({ page: 1, limit: 20, q: '50%_[' });

  expect(capture.inputs.Search.value).toBe(String.raw`%50\%\_\[%`);
  expect(capture.query).toContain("LIKE LOWER(@Search) ESCAPE '\\'");
  expect(capture.query).not.toContain('50%_[x]');
});

test('listAuditLogs applies one filter scope to data and count with stable order', async () => {
  const capture = useRecordsets([[], [{ Total: 21 }]]);

  const result = await auditLogRepository.listAuditLogs({
    page: 2,
    limit: 20,
    q: 'login',
    action: 'AUTH_LOGIN_SUCCESS',
    actorId: 7,
    from: '2026-07-01',
    to: '2026-07-18',
  });

  expect(capture.query.match(/al\.Action = @Action/g)).toHaveLength(2);
  expect(capture.query.match(/al\.UserId = @ActorId/g)).toHaveLength(2);
  expect(capture.query.match(/al\.CreatedAt >= @FromDate/g)).toHaveLength(2);
  expect(capture.query.match(/al\.CreatedAt < DATEADD\(DAY, 1, @ToDate\)/g)).toHaveLength(2);
  expect(capture.query).toContain('LOWER(al.Action) LIKE LOWER(@Search)');
  expect(capture.query).toContain("LOWER(COALESCE(actor.Email, '')) LIKE LOWER(@Search)");
  expect(capture.query).toContain("LOWER(COALESCE(actorProfile.FullName, '')) LIKE LOWER(@Search)");
  expect(capture.query).toContain("LOWER(COALESCE(al.TargetType, '')) LIKE LOWER(@Search)");
  expect(capture.query).toContain('CONVERT(NVARCHAR(20), al.TargetId) LIKE @Search');
  expect(capture.query).toContain('ORDER BY al.CreatedAt DESC, al.LogId DESC');
  expect(capture.query).toContain("IN ('USER', 'USERS', 'ACCOUNT')");
  expect(result.pagination).toEqual({ page: 2, limit: 20, total: 21, totalPages: 2 });
});

test('listAuditLogs maps raw rows and keeps metadata inside the repository boundary', async () => {
  const createdAt = new Date('2026-07-18T10:00:00.000Z');
  useRecordsets([[
    {
      LogId: 10,
      UserId: 7,
      ActorEmail: 'admin@example.test',
      ActorName: 'Admin User',
      Action: 'USER_ROLE_ASSIGN',
      TargetType: 'USER',
      TargetId: 15,
      TargetEmail: 'member@example.test',
      TargetName: 'Member User',
      Metadata: '{"roleId":2,"roleName":"LIBRARIAN"}',
      IpAddress: '203.0.113.10',
      CreatedAt: createdAt,
    },
  ], [{ Total: 1 }]]);

  const result = await auditLogRepository.listAuditLogs({ page: 1, limit: 20 });

  expect(result.data[0]).toEqual({
    logId: 10,
    userId: 7,
    actorEmail: 'admin@example.test',
    actorName: 'Admin User',
    action: 'USER_ROLE_ASSIGN',
    targetType: 'USER',
    targetId: 15,
    targetEmail: 'member@example.test',
    targetName: 'Member User',
    metadata: '{"roleId":2,"roleName":"LIBRARIAN"}',
    ipAddress: '203.0.113.10',
    createdAt,
  });
  expect(result.pagination.totalPages).toBe(1);
});

test('listAuditLogs reports zero pages for an empty result', async () => {
  useRecordsets([[], [{ Total: 0 }]]);

  await expect(auditLogRepository.listAuditLogs({ page: 1, limit: 20 })).resolves.toMatchObject({
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  });
});
