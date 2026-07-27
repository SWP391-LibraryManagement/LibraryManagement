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

const FIXED_NOW = new Date('2026-07-19T08:30:00.000Z');
const FIXED_VERSION = new Date('2026-07-19T08:00:00.000Z');
const ACTIVE_ADMIN = [{ UserId: 99, Status: 'ACTIVE', IsAdmin: 1 }];
const CURRENT_USER = {
  UserId: 7,
  FullName: 'Current User',
  Phone: '0900000000',
  Address: 'Hà Nội',
  Status: 'ACTIVE',
  DeactivatedAt: null,
  EffectiveUpdatedAt: FIXED_VERSION,
};
const STALE_TARGET = {
  ...CURRENT_USER,
  EffectiveUpdatedAt: new Date('2026-07-19T08:05:00.000Z'),
};
const CURRENT_LIBRARIAN = CURRENT_USER;
const CURRENT_ROLES = [{ RoleName: 'LIBRARIAN' }];
const CURRENT_CHANGES = { fullName: 'Current User', phone: '0900000000', address: 'Hà Nội' };

function loadRepository() {
  return require('../src/repositories/userLifecycleRepository');
}

function makeLifecycleHarness(results) {
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

  return {
    calls,
    invokeUpdate(overrides = {}) {
      return loadRepository().updateManagedUser({
        adminUserId: 99,
        userId: 7,
        expectedUpdatedAt: FIXED_VERSION,
        changes: { fullName: 'Updated User' },
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
        now: FIXED_NOW,
        ...overrides,
      });
    },
    invokeDeactivate(overrides = {}) {
      return loadRepository().deactivateManagedUser({
        adminUserId: 99,
        userId: 7,
        expectedUpdatedAt: FIXED_VERSION,
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
        now: FIXED_NOW,
        ...overrides,
      });
    },
    get transaction() {
      return sql.Transaction.instances.at(-1);
    },
  };
}

beforeEach(() => {
  getPool.mockReset();
  sql.Transaction.instances = [];
});

test.each([
  ['missing actor', [[]], 'ADMIN_NOT_FOUND'],
  ['inactive actor', [[{ UserId: 99, Status: 'INACTIVE', IsAdmin: 1 }]], 'ADMIN_REQUIRED'],
  ['missing target', [ACTIVE_ADMIN, []], 'USER_NOT_FOUND'],
  ['stale version', [ACTIVE_ADMIN, [STALE_TARGET]], 'STALE_USER_STATE'],
])('%s rolls back without update or audit', async (_, queuedResults, outcome) => {
  const harness = makeLifecycleHarness(queuedResults);

  await expect(harness.invokeUpdate()).resolves.toEqual({ outcome });

  expect(harness.calls.some(({ query }) => /UPDATE Users|UPDATE UserProfiles|INSERT INTO AuditLogs/.test(query))).toBe(false);
  expect(harness.transaction.commitCount).toBe(0);
  expect(harness.transaction.rollbackCount).toBe(1);
});

test('no-op writes no field update or audit', async () => {
  const harness = makeLifecycleHarness([ACTIVE_ADMIN, [CURRENT_USER]]);

  await expect(harness.invokeUpdate({ changes: CURRENT_CHANGES })).resolves.toEqual({
    outcome: 'NO_CHANGE',
  });

  expect(harness.calls.some(({ query }) => /UPDATE Users|UPDATE UserProfiles|INSERT INTO AuditLogs/.test(query))).toBe(false);
  expect(harness.transaction.commitCount).toBe(1);
  expect(harness.transaction.rollbackCount).toBe(0);
});

test('rejects an explicit blank full name', async () => {
  const harness = makeLifecycleHarness([ACTIVE_ADMIN, [CURRENT_USER]]);

  await expect(harness.invokeUpdate({ changes: { fullName: null } })).resolves.toEqual({
    outcome: 'VALIDATION_ERROR',
  });

  expect(harness.calls.some(({ query }) => /UPDATE Users|UPDATE UserProfiles|INSERT INTO AuditLogs/.test(query))).toBe(false);
  expect(harness.transaction.rollbackCount).toBe(1);
});

test('effective update writes one sorted audit and commits', async () => {
  const harness = makeLifecycleHarness([
    ACTIVE_ADMIN,
    [CURRENT_USER],
    [],
  ]);

  await expect(harness.invokeUpdate({
    changes: { phone: '0911111111', fullName: 'Updated User', address: 'Đà Nẵng' },
  })).resolves.toEqual({
    outcome: 'UPDATED',
    changedFields: ['address', 'fullName', 'phone'],
  });

  const userUpdate = harness.calls.find(({ query }) => query.includes('UPDATE Users'));
  expect(userUpdate.inputs).toMatchObject({
    UserId: 7,
    Phone: '0911111111',
    Now: FIXED_NOW,
  });
  const profileUpdate = harness.calls.find(({ query }) => query.includes('MERGE UserProfiles'));
  expect(profileUpdate.inputs).toMatchObject({
    FullName: 'Updated User',
    Address: 'Đà Nẵng',
  });
  expect(userUpdate.inputs).not.toHaveProperty('Email');
  const auditCalls = harness.calls.filter(({ query }) => query.includes('INSERT INTO AuditLogs'));
  expect(auditCalls).toHaveLength(1);
  expect(JSON.parse(auditCalls[0].inputs.Metadata)).toEqual({
    changedFields: ['address', 'fullName', 'phone'],
  });
  expect(harness.transaction.commitCount).toBe(1);
  expect(harness.transaction.rollbackCount).toBe(0);
});

test('uses parameterized locked reads for actor and target', async () => {
  const harness = makeLifecycleHarness([
    ACTIVE_ADMIN,
    [CURRENT_USER],
  ]);

  await harness.invokeUpdate({ changes: { fullName: 'Updated User' } });

  for (const call of harness.calls.slice(0, 2)) {
    expect(call.query).toContain('UPDLOCK');
    expect(call.query).toContain('HOLDLOCK');
  }
  expect(harness.calls[0].inputs.AdminUserId).toBe(99);
  expect(harness.calls[1].inputs).toMatchObject({
    UserId: 7,
    ExpectedUpdatedAt: FIXED_VERSION,
  });
});

test('rolls back an effective update when audit persistence fails', async () => {
  const auditError = new Error('audit insert failed');
  const harness = makeLifecycleHarness([
    ACTIVE_ADMIN,
    [CURRENT_USER],
    auditError,
  ]);

  await expect(harness.invokeUpdate({ changes: { fullName: 'Updated User' } })).rejects.toBe(auditError);

  expect(harness.calls.some(({ query }) => query.includes('UPDATE Users'))).toBe(true);
  expect(harness.transaction.commitCount).toBe(0);
  expect(harness.transaction.rollbackCount).toBe(1);
});

describe('deactivateManagedUser', () => {
  const DEACTIVATED_TARGET = {
    ...CURRENT_LIBRARIAN,
    Status: 'INACTIVE',
    DeactivatedAt: new Date('2026-07-18T08:00:00.000Z'),
  };

  test.each([
    ['missing actor', [[]], {}, 'ADMIN_NOT_FOUND'],
    ['inactive actor', [[{ UserId: 99, Status: 'INACTIVE', IsAdmin: 1 }]], {}, 'ADMIN_REQUIRED'],
    ['missing target', [ACTIVE_ADMIN, []], {}, 'USER_NOT_FOUND'],
    ['self target', [ACTIVE_ADMIN, [{ ...CURRENT_LIBRARIAN, UserId: 99 }]], { userId: 99 }, 'CANNOT_DEACTIVATE_SELF'],
    ['stale version', [ACTIVE_ADMIN, [STALE_TARGET]], {}, 'STALE_USER_STATE'],
    ['pending activation', [ACTIVE_ADMIN, [{ ...CURRENT_LIBRARIAN, Status: 'INACTIVE', DeactivatedAt: null }]], {}, 'ACCOUNT_PENDING_ACTIVATION'],
  ])('%s rolls back without lifecycle DML', async (_, results, overrides, outcome) => {
    const harness = makeLifecycleHarness(results);

    await expect(harness.invokeDeactivate(overrides)).resolves.toEqual({ outcome });

    expect(harness.calls.some(({ query }) => /UPDATE Users|UPDATE AuthTokens|INSERT INTO AuditLogs/.test(query))).toBe(false);
    expect(harness.transaction.commitCount).toBe(0);
    expect(harness.transaction.rollbackCount).toBe(1);
  });

  test('already-deactivated account is idempotent without DML', async () => {
    const harness = makeLifecycleHarness([ACTIVE_ADMIN, [DEACTIVATED_TARGET]]);

    await expect(harness.invokeDeactivate()).resolves.toEqual({
      outcome: 'ALREADY_DEACTIVATED',
    });

    expect(harness.calls.some(({ query }) => /UPDATE Users|UPDATE AuthTokens|INSERT INTO AuditLogs/.test(query))).toBe(false);
    expect(harness.transaction.commitCount).toBe(1);
  });

  test('active borrowings block deactivation after the target member lock', async () => {
    const harness = makeLifecycleHarness([
      ACTIVE_ADMIN,
      [CURRENT_LIBRARIAN],
      CURRENT_ROLES,
      [{ MemberId: 5 }],
      [{ ActiveBorrowingCount: 2 }],
    ]);

    await expect(harness.invokeDeactivate()).resolves.toEqual({
      outcome: 'ACTIVE_BORROWINGS_EXIST',
      activeBorrowingCount: 2,
    });

    const memberLockIndex = harness.calls.findIndex(({ query }) => query.includes('FROM Members'));
    const borrowingReadIndex = harness.calls.findIndex(({ query }) => query.includes('BorrowDetails'));
    expect(memberLockIndex).toBeGreaterThan(-1);
    expect(borrowingReadIndex).toBeGreaterThan(memberLockIndex);
    expect(harness.calls[memberLockIndex].query).toContain('UPDLOCK');
    expect(harness.calls[borrowingReadIndex].query).toContain('UPDLOCK');
    expect(harness.transaction.rollbackCount).toBe(1);
  });

  test('pending borrow requests block deactivation', async () => {
    const harness = makeLifecycleHarness([
      ACTIVE_ADMIN,
      [CURRENT_LIBRARIAN],
      CURRENT_ROLES,
      [{ MemberId: 5 }],
      [{ ActiveBorrowingCount: 0 }],
      [{ PendingRequestCount: 2 }],
    ]);

    await expect(harness.invokeDeactivate()).resolves.toEqual({
      outcome: 'PENDING_BORROW_REQUESTS_EXIST',
      pendingRequestCount: 2,
    });
    expect(harness.calls.find(({ query }) => query.includes('PendingRequestCount')).query)
      .toContain('UPDLOCK');
    expect(harness.transaction.rollbackCount).toBe(1);
  });

  test.each(['ACTIVE', 'LOCKED'])('atomically deactivates a %s account', async (status) => {
    const target = { ...CURRENT_LIBRARIAN, Status: status };
    const harness = makeLifecycleHarness([
      ACTIVE_ADMIN,
      [target],
      CURRENT_ROLES,
      [{ MemberId: 5 }],
      [{ ActiveBorrowingCount: 0 }],
      [],
      [],
      [],
    ]);

    await expect(harness.invokeDeactivate()).resolves.toEqual({
      outcome: 'DEACTIVATED',
      previousStatus: status,
    });

    const userUpdate = harness.calls.find(({ query }) => query.includes('UPDATE Users'));
    expect(userUpdate.query).toContain("Status = 'INACTIVE'");
    expect(userUpdate.query).toContain('DeactivatedAt = @Now');
    const tokenUpdate = harness.calls.find(({ query }) => query.includes('UPDATE AuthTokens'));
    expect(tokenUpdate.query).toContain("TokenType = 'REFRESH'");
    expect(tokenUpdate.query).toContain('UsedAt IS NULL');
    expect(tokenUpdate.query).toContain('RevokedAt IS NULL');
    const auditCall = harness.calls.find(({ query }) => query.includes('INSERT INTO AuditLogs'));
    expect(JSON.parse(auditCall.inputs.Metadata)).toEqual({
      previousStatus: status,
      newStatus: 'INACTIVE',
    });
    expect(harness.transaction.commitCount).toBe(1);
    expect(harness.transaction.rollbackCount).toBe(0);
  });

  test.each([
    ['token revocation', new Error('token update failed'), 6],
    ['audit insert', new Error('audit insert failed'), 7],
  ])('rolls back when %s fails', async (_, injectedError, failureIndex) => {
    const results = [
      ACTIVE_ADMIN,
      [CURRENT_LIBRARIAN],
      CURRENT_ROLES,
      [{ MemberId: 5 }],
      [{ ActiveBorrowingCount: 0 }],
      [],
      [],
      [],
    ];
    results[failureIndex] = injectedError;
    const harness = makeLifecycleHarness(results);

    await expect(harness.invokeDeactivate()).rejects.toBe(injectedError);

    expect(harness.transaction.commitCount).toBe(0);
    expect(harness.transaction.rollbackCount).toBe(1);
  });
});
