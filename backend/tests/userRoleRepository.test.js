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

    async commit() {
      this.commitCount += 1;
    }

    async rollback() {
      this.rollbackCount += 1;
    }
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

const FIXED_NOW = new Date('2026-07-18T03:00:00.000Z');
const ACTIVE_ADMIN = [{ UserId: 99, Status: 'ACTIVE', IsAdmin: 1 }];
const TARGET_USER = [{ UserId: 7 }];
const LIBRARIAN_ROLE = [{ RoleId: 3, RoleName: 'LIBRARIAN' }];
const ADMIN_ROLE = [{ RoleId: 1, RoleName: 'ADMIN' }];

function useTransactionResults(results) {
  const calls = [];
  const queued = [...results];

  getPool.mockResolvedValue({
    async transactionQuery(query, inputs) {
      calls.push({ query, inputs });
      const next = queued.shift();
      if (next instanceof Error) {
        throw next;
      }
      return { recordset: next || [] };
    },
  });

  return calls;
}

function invoke(overrides = {}) {
  return userRoleRepository.mutateUserRole({
    operation: 'ASSIGN',
    adminUserId: 99,
    userId: 7,
    roleId: 3,
    ipAddress: '127.0.0.1',
    userAgent: 'jest',
    now: FIXED_NOW,
    ...overrides,
  });
}

function expectRolledBackWithoutMutation(calls) {
  expect(calls.some(({ query }) => query.includes('INSERT INTO UserRoles'))).toBe(false);
  expect(calls.some(({ query }) => query.includes('DELETE FROM UserRoles'))).toBe(false);
  expect(calls.some(({ query }) => query.includes('INSERT INTO AuditLogs'))).toBe(false);
  expect(sql.Transaction.instances.at(-1).commitCount).toBe(0);
  expect(sql.Transaction.instances.at(-1).rollbackCount).toBe(1);
}

beforeEach(() => {
  getPool.mockReset();
  sql.Transaction.instances = [];
});

test('assigns a missing mapping and audits in one committed transaction', async () => {
  const calls = useTransactionResults([
    ACTIVE_ADMIN,
    TARGET_USER,
    LIBRARIAN_ROLE,
    [{ RoleId: 4, RoleName: 'MEMBER' }],
    [],
    [],
  ]);

  await expect(invoke()).resolves.toEqual({
    outcome: 'ASSIGNED',
    role: { roleId: 3, roleName: 'LIBRARIAN' },
  });

  expect(calls.some(({ query }) => query.includes('INSERT INTO UserRoles'))).toBe(true);
  expect(calls.some(({ query }) => query.includes('INSERT INTO AuditLogs'))).toBe(true);
  const auditCall = calls.find(({ query }) => query.includes('INSERT INTO AuditLogs'));
  expect(auditCall.inputs).toMatchObject({
    AdminUserId: 99,
    Action: 'USER_ROLE_ASSIGN',
    TargetId: 7,
    IpAddress: '127.0.0.1',
    UserAgent: 'jest',
    Now: FIXED_NOW,
  });
  expect(JSON.parse(auditCall.inputs.Metadata)).toEqual({
    roleId: 3,
    roleName: 'LIBRARIAN',
  });
  expect(sql.Transaction.instances.at(-1).commitCount).toBe(1);
  expect(sql.Transaction.instances.at(-1).rollbackCount).toBe(0);
});

test('revokes an existing mapping and audits in one committed transaction', async () => {
  const calls = useTransactionResults([
    ACTIVE_ADMIN,
    TARGET_USER,
    LIBRARIAN_ROLE,
    [
      { RoleId: 3, RoleName: 'LIBRARIAN' },
      { RoleId: 4, RoleName: 'MEMBER' },
    ],
    [],
    [],
  ]);

  await expect(invoke({ operation: 'REVOKE' })).resolves.toEqual({
    outcome: 'REVOKED',
    role: { roleId: 3, roleName: 'LIBRARIAN' },
  });

  expect(calls.some(({ query }) => query.includes('DELETE FROM UserRoles'))).toBe(true);
  const auditCall = calls.find(({ query }) => query.includes('INSERT INTO AuditLogs'));
  expect(auditCall.inputs.Action).toBe('USER_ROLE_REVOKE');
  expect(sql.Transaction.instances.at(-1).commitCount).toBe(1);
  expect(sql.Transaction.instances.at(-1).rollbackCount).toBe(0);
});

test('returns ADMIN_NOT_FOUND when the acting user does not exist', async () => {
  const calls = useTransactionResults([[]]);

  await expect(invoke()).resolves.toEqual({ outcome: 'ADMIN_NOT_FOUND' });

  expectRolledBackWithoutMutation(calls);
});

test.each([
  ['inactive', { UserId: 99, Status: 'INACTIVE', IsAdmin: 1 }],
  ['without Admin role', { UserId: 99, Status: 'ACTIVE', IsAdmin: 0 }],
])('returns ADMIN_REQUIRED when the actor is %s', async (_, actor) => {
  const calls = useTransactionResults([[actor]]);

  await expect(invoke()).resolves.toEqual({ outcome: 'ADMIN_REQUIRED' });

  expectRolledBackWithoutMutation(calls);
});

test('returns USER_NOT_FOUND when the target does not exist', async () => {
  const calls = useTransactionResults([ACTIVE_ADMIN, []]);

  await expect(invoke()).resolves.toEqual({ outcome: 'USER_NOT_FOUND' });

  expectRolledBackWithoutMutation(calls);
});

test('returns ROLE_NOT_FOUND when the requested role does not exist', async () => {
  const calls = useTransactionResults([ACTIVE_ADMIN, TARGET_USER, []]);

  await expect(invoke()).resolves.toEqual({ outcome: 'ROLE_NOT_FOUND' });

  expectRolledBackWithoutMutation(calls);
});

test('rejects assignment when the user already has the role', async () => {
  const calls = useTransactionResults([
    ACTIVE_ADMIN,
    TARGET_USER,
    LIBRARIAN_ROLE,
    [{ RoleId: 3, RoleName: 'LIBRARIAN' }],
  ]);

  await expect(invoke()).resolves.toEqual({ outcome: 'USER_ALREADY_HAS_ROLE' });

  expectRolledBackWithoutMutation(calls);
});

test('rejects revocation when the user does not have the role', async () => {
  const calls = useTransactionResults([
    ACTIVE_ADMIN,
    TARGET_USER,
    LIBRARIAN_ROLE,
    [{ RoleId: 4, RoleName: 'MEMBER' }],
  ]);

  await expect(invoke({ operation: 'REVOKE' })).resolves.toEqual({
    outcome: 'USER_ROLE_NOT_FOUND',
  });

  expectRolledBackWithoutMutation(calls);
});

test('rejects revocation of the final user role', async () => {
  const calls = useTransactionResults([
    ACTIVE_ADMIN,
    TARGET_USER,
    LIBRARIAN_ROLE,
    [{ RoleId: 3, RoleName: 'LIBRARIAN' }],
  ]);

  await expect(invoke({ operation: 'REVOKE' })).resolves.toEqual({
    outcome: 'LAST_USER_ROLE',
  });

  expectRolledBackWithoutMutation(calls);
});

test('rejects revocation of the last active Admin role under locked reads', async () => {
  const calls = useTransactionResults([
    ACTIVE_ADMIN,
    TARGET_USER,
    ADMIN_ROLE,
    [
      { RoleId: 1, RoleName: 'ADMIN' },
      { RoleId: 4, RoleName: 'MEMBER' },
    ],
    [{ UserId: 7 }],
  ]);

  await expect(invoke({ operation: 'REVOKE', roleId: 1 })).resolves.toEqual({
    outcome: 'LAST_ADMIN_ROLE',
  });

  const adminCountCall = calls.at(-1);
  expect(adminCountCall.query).toContain('UPDLOCK');
  expect(adminCountCall.query).toContain('HOLDLOCK');
  expectRolledBackWithoutMutation(calls);
});

test('rolls back the role mapping when audit insertion fails', async () => {
  const auditError = new Error('audit insert failed');
  const calls = useTransactionResults([
    ACTIVE_ADMIN,
    TARGET_USER,
    LIBRARIAN_ROLE,
    [{ RoleId: 4, RoleName: 'MEMBER' }],
    [],
    auditError,
  ]);

  await expect(invoke()).rejects.toBe(auditError);

  expect(calls.some(({ query }) => query.includes('INSERT INTO UserRoles'))).toBe(true);
  expect(sql.Transaction.instances.at(-1).commitCount).toBe(0);
  expect(sql.Transaction.instances.at(-1).rollbackCount).toBe(1);
});

test('uses locked parameterized reads for actor, target, role, and mappings', async () => {
  const calls = useTransactionResults([
    ACTIVE_ADMIN,
    TARGET_USER,
    LIBRARIAN_ROLE,
    [{ RoleId: 4, RoleName: 'MEMBER' }],
    [],
    [],
  ]);

  await invoke();

  for (const call of calls.slice(0, 4)) {
    expect(call.query).toContain('UPDLOCK');
    expect(call.query).toContain('HOLDLOCK');
  }
  expect(calls[0].inputs.AdminUserId).toBe(99);
  expect(calls[1].inputs.UserId).toBe(7);
  expect(calls[2].inputs.RoleId).toBe(3);
  expect(calls[0].query).not.toContain('99');
  expect(calls[1].query).not.toContain('7');
});

test('rejects unknown mutation operations before opening a transaction', async () => {
  await expect(invoke({ operation: 'UPSERT' })).rejects.toThrow(
    'Role mutation operation must be ASSIGN or REVOKE.'
  );

  expect(getPool).not.toHaveBeenCalled();
  expect(sql.Transaction.instances).toHaveLength(0);
});
