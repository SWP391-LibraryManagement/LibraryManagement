jest.mock('../src/config/db', () => {
  class Transaction {
    static instances = [];
    constructor(pool) {
      this.pool = pool;
      this.commitCount = 0;
      this.rollbackCount = 0;
      Transaction.instances.push(this);
    }
    async begin() {}
    async commit() { this.commitCount += 1; }
    async rollback() { this.rollbackCount += 1; }
  }

  class Request {
    constructor(transaction) {
      this.transaction = transaction;
      this.inputs = {};
    }
    input(name, _type, value) {
      this.inputs[name] = value;
      return this;
    }
    async query(query) {
      return this.transaction.pool.transactionQuery(query, this.inputs);
    }
  }

  return {
    sql: {
      Int: 'Int',
      DateTime: 'DateTime',
      MAX: 'MAX',
      NVarChar: (size) => `NVarChar(${size})`,
      Transaction,
      Request,
    },
    getPool: jest.fn(),
  };
});

const { sql, getPool } = require('../src/config/db');
const userRoleRepository = require('../src/repositories/userRoleRepository');

const FIXED_NOW = new Date('2026-07-27T03:00:00.000Z');
const ACTIVE_ADMIN = [{ UserId: 99, Status: 'ACTIVE', IsAdmin: 1 }];
const TARGET_USER = [{ UserId: 7, Status: 'ACTIVE' }];
const LIBRARIAN_ROLE = [{ RoleId: 2, RoleName: 'LIBRARIAN' }];

function useTransactionResults(results) {
  const calls = [];
  const queued = [...results];
  getPool.mockResolvedValue({
    async transactionQuery(query, inputs) {
      calls.push({ query, inputs });
      if (query.includes('sp_getapplock')) {
        return { recordset: [] };
      }
      const next = queued.shift();
      if (next instanceof Error) throw next;
      return { recordset: next || [] };
    },
  });
  return calls;
}

function invoke(overrides = {}) {
  return userRoleRepository.replaceUserRole({
    adminUserId: 99,
    userId: 7,
    roleId: 2,
    ipAddress: '127.0.0.1',
    userAgent: 'jest',
    now: FIXED_NOW,
    ...overrides,
  });
}

function expectRolledBackWithoutMutation(calls) {
  expect(calls.some(({ query }) => query.includes('DELETE FROM UserRoles'))).toBe(false);
  expect(calls.some(({ query }) => query.includes('INSERT INTO UserRoles'))).toBe(false);
  expect(calls.some(({ query }) => query.includes('INSERT INTO AuditLogs'))).toBe(false);
  expect(sql.Transaction.instances.at(-1).commitCount).toBe(0);
  expect(sql.Transaction.instances.at(-1).rollbackCount).toBe(1);
}

beforeEach(() => {
  getPool.mockReset();
  sql.Transaction.instances = [];
});

test('replaces every existing mapping with exactly one role and audits atomically', async () => {
  const calls = useTransactionResults([
    ACTIVE_ADMIN,
    TARGET_USER,
    LIBRARIAN_ROLE,
    [{ RoleId: 3, RoleName: 'MEMBER' }],
    [],
    [],
    [],
  ]);

  await expect(invoke()).resolves.toEqual({
    outcome: 'REPLACED',
    role: { roleId: 2, roleName: 'LIBRARIAN' },
  });

  expect(calls.filter(({ query }) => query.includes('DELETE FROM UserRoles'))).toHaveLength(1);
  expect(calls.filter(({ query }) => query.includes('INSERT INTO UserRoles'))).toHaveLength(1);
  const sessionCall = calls.find(({ query }) => query.includes('UPDATE AuthTokens'));
  expect(sessionCall.inputs.UserId).toBe(7);
  expect(sessionCall.inputs.Now).toEqual(FIXED_NOW);
  const auditCall = calls.find(({ query }) => query.includes('INSERT INTO AuditLogs'));
  expect(auditCall.inputs.Action).toBe('USER_ROLE_REPLACE');
  expect(JSON.parse(auditCall.inputs.Metadata)).toEqual({
    previousRoles: [{ roleId: 3, roleName: 'MEMBER' }],
    role: { roleId: 2, roleName: 'LIBRARIAN' },
  });
  expect(sql.Transaction.instances.at(-1).commitCount).toBe(1);
});

test('repairs legacy multiple mappings by replacing all of them with one role', async () => {
  const calls = useTransactionResults([
    ACTIVE_ADMIN,
    TARGET_USER,
    LIBRARIAN_ROLE,
    [
      { RoleId: 3, RoleName: 'MEMBER' },
      { RoleId: 4, RoleName: 'GUEST' },
    ],
    [],
    [],
    [],
  ]);

  await expect(invoke()).resolves.toMatchObject({ outcome: 'REPLACED' });
  expect(calls.find(({ query }) => query.includes('DELETE FROM UserRoles')).inputs.UserId).toBe(7);
});

test('blocks removing MEMBER while borrowing workflows are still active', async () => {
  const calls = useTransactionResults([
    ACTIVE_ADMIN,
    TARGET_USER,
    LIBRARIAN_ROLE,
    [{ RoleId: 3, RoleName: 'MEMBER' }],
    [{ PendingRequestCount: 2, ActiveBorrowingCount: 1 }],
  ]);

  await expect(invoke()).resolves.toEqual({
    outcome: 'MEMBER_BORROWING_WORKFLOW_EXISTS',
    pendingRequestCount: 2,
    activeBorrowingCount: 1,
  });
  const workflowRead = calls.find(({ query }) => query.includes('PendingRequestCount'));
  expect(workflowRead.query).toContain('UPDLOCK');
  expectRolledBackWithoutMutation(calls);
});

test('returns unchanged without audit when the account already has exactly the selected role', async () => {
  const calls = useTransactionResults([
    ACTIVE_ADMIN,
    TARGET_USER,
    LIBRARIAN_ROLE,
    [{ RoleId: 2, RoleName: 'LIBRARIAN' }],
  ]);

  await expect(invoke()).resolves.toEqual({
    outcome: 'UNCHANGED',
    role: { roleId: 2, roleName: 'LIBRARIAN' },
  });
  expect(calls.some(({ query }) => query.includes('AuditLogs'))).toBe(false);
  expect(sql.Transaction.instances.at(-1).commitCount).toBe(1);
});

test.each([
  ['ADMIN_NOT_FOUND', [[]]],
  ['ADMIN_REQUIRED', [[{ UserId: 99, Status: 'INACTIVE', IsAdmin: 1 }]]],
  ['USER_NOT_FOUND', [ACTIVE_ADMIN, []]],
  ['ROLE_NOT_FOUND', [ACTIVE_ADMIN, TARGET_USER, []]],
])('returns %s without mutation', async (outcome, results) => {
  const calls = useTransactionResults(results);
  await expect(invoke()).resolves.toEqual({ outcome });
  expectRolledBackWithoutMutation(calls);
});

test('rejects replacing the last active Admin role under locked reads', async () => {
  const calls = useTransactionResults([
    ACTIVE_ADMIN,
    TARGET_USER,
    LIBRARIAN_ROLE,
    [{ RoleId: 1, RoleName: 'ADMIN' }],
    [{ UserId: 7 }],
  ]);

  await expect(invoke()).resolves.toEqual({ outcome: 'LAST_ADMIN_ROLE' });
  const adminCountCall = calls.at(-1);
  expect(adminCountCall.query).toContain('SELECT DISTINCT');
  expect(adminCountCall.query).toContain('UPDLOCK');
  expect(adminCountCall.query).toContain('HOLDLOCK');
  expectRolledBackWithoutMutation(calls);
});

test('allows replacing an inactive Admin because it is not an active Admin holder', async () => {
  const calls = useTransactionResults([
    ACTIVE_ADMIN,
    [{ UserId: 7, Status: 'INACTIVE' }],
    LIBRARIAN_ROLE,
    [{ RoleId: 1, RoleName: 'ADMIN' }],
    [],
    [],
    [],
  ]);

  await expect(invoke()).resolves.toMatchObject({ outcome: 'REPLACED' });
  expect(calls.some(({ query }) => query.includes('SELECT DISTINCT'))).toBe(false);
});

test('rolls back the role replacement when audit insertion fails', async () => {
  const auditError = new Error('audit insert failed');
  const calls = useTransactionResults([
    ACTIVE_ADMIN,
    TARGET_USER,
    LIBRARIAN_ROLE,
    [{ RoleId: 3, RoleName: 'MEMBER' }],
    [],
    [],
    [],
    auditError,
  ]);

  await expect(invoke()).rejects.toBe(auditError);
  expect(calls.some(({ query }) => query.includes('DELETE FROM UserRoles'))).toBe(true);
  expect(calls.some(({ query }) => query.includes('INSERT INTO UserRoles'))).toBe(true);
  expect(sql.Transaction.instances.at(-1).rollbackCount).toBe(1);
});

test('uses locked parameterized reads for actor, target, role, and current mapping', async () => {
  const calls = useTransactionResults([
    ACTIVE_ADMIN,
    TARGET_USER,
    LIBRARIAN_ROLE,
    [{ RoleId: 3, RoleName: 'MEMBER' }],
    [],
    [],
    [],
  ]);

  await invoke();
  const lockedReads = calls.filter(({ query }) => query.includes('UPDLOCK')).slice(0, 4);
  for (const call of lockedReads) {
    expect(call.query).toContain('UPDLOCK');
    expect(call.query).toContain('HOLDLOCK');
  }
  expect(calls[0].inputs.AdminUserId).toBe(99);
  expect(lockedReads[1].inputs.UserId).toBe(7);
  expect(lockedReads[2].inputs.RoleId).toBe(2);
});
