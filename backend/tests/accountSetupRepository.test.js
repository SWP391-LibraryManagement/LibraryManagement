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
const accountSetupRepository = require('../src/repositories/accountSetupRepository');

const FIXED_NOW = new Date('2026-07-19T08:30:00.000Z');
const FIXED_EXPIRY = new Date('2026-07-20T08:30:00.000Z');
const ACTIVE_ADMIN = [{ UserId: 99, Status: 'ACTIVE', IsAdmin: 1 }];
const CREATED_USER = [{
  UserId: 7,
  Username: 'reference.librarian',
  Email: 'reference@example.test',
  Phone: null,
  Status: 'INACTIVE',
  CreatedAt: FIXED_NOW,
}];

function useTransactionResults(results) {
  const calls = [];
  const queued = [...results];
  getPool.mockResolvedValue({
    async transactionQuery(query, inputs) {
      calls.push({ query, inputs });
      const next = queued.shift();
      if (next instanceof Error) throw next;
      return { recordset: next || [] };
    },
  });
  return calls;
}

function invokeCreate(overrides = {}) {
  return accountSetupRepository.createPendingAccount({
    username: 'reference.librarian',
    email: 'reference@example.test',
    passwordHash: 'bcrypt-hash',
    phone: null,
    fullName: 'Reference Librarian',
    address: null,
    department: 'Reference',
    specialization: 'Research Support',
    roleName: 'LIBRARIAN',
    tokenHash: 'token-hash',
    expiresAt: FIXED_EXPIRY,
    adminUserId: 99,
    ip: '127.0.0.1',
    userAgent: 'jest',
    now: FIXED_NOW,
    ...overrides,
  });
}

function invokeRotate(overrides = {}) {
  return accountSetupRepository.rotateSetupToken({
    userId: 7,
    tokenHash: 'rotated-token-hash',
    expiresAt: FIXED_EXPIRY,
    adminUserId: 99,
    ip: '127.0.0.1',
    userAgent: 'jest',
    now: FIXED_NOW,
    cooldownSeconds: 60,
    ...overrides,
  });
}

function invokeComplete(overrides = {}) {
  return accountSetupRepository.completeSetup({
    tokenHash: 'setup-token-hash',
    passwordHash: 'new-bcrypt-hash',
    now: FIXED_NOW,
    context: { ip: '127.0.0.1', userAgent: 'jest' },
    ...overrides,
  });
}

function expectNoSetupMutation(calls) {
  expect(calls.some(({ query }) => /INSERT INTO Users|UPDATE AuthTokens|INSERT INTO AuthTokens|INSERT INTO AuditLogs/.test(query))).toBe(false);
  expect(sql.Transaction.instances.at(-1).commitCount).toBe(0);
  expect(sql.Transaction.instances.at(-1).rollbackCount).toBe(1);
}

beforeEach(() => {
  getPool.mockReset();
  sql.Transaction.instances = [];
});

test('creates Librarian profile fields after locking the active Admin and uniqueness sources', async () => {
  const calls = useTransactionResults([
    ACTIVE_ADMIN,
    [],
    [],
    CREATED_USER,
    [],
    [{ RoleId: 3 }],
    [{ TokenId: 21 }],
    [],
  ]);

  await expect(invokeCreate()).resolves.toEqual({
    outcome: 'CREATED',
    user: {
      userId: 7,
      username: 'reference.librarian',
      email: 'reference@example.test',
      phone: null,
      status: 'INACTIVE',
      createdAt: FIXED_NOW,
    },
    tokenId: 21,
  });

  expect(calls[0].query).toContain('UPDLOCK');
  expect(calls[0].query).toContain('HOLDLOCK');
  expect(calls[0].inputs.AdminUserId).toBe(99);
  expect(calls[1].query).toContain('LOWER(Email) = LOWER(@Email)');
  expect(calls[2].query).toContain('LOWER(Username) = LOWER(@Username)');
  const userInsert = calls.find(({ query }) => query.includes('INSERT INTO Users'));
  expect(userInsert.query).toContain('UpdatedAt');
  expect(userInsert.inputs.Now).toBe(FIXED_NOW);
  const profileInsert = calls.find(({ query }) => query.includes('INSERT INTO UserProfiles'));
  expect(profileInsert.inputs).toMatchObject({
    Department: 'Reference',
    Specialization: 'Research Support',
  });
  expect(profileInsert.query).toContain('Department');
  expect(profileInsert.query).toContain('Specialization');
  expect(sql.Transaction.instances.at(-1).commitCount).toBe(1);
});

test.each([
  ['missing actor', [], 'ADMIN_NOT_FOUND'],
  ['inactive actor', [{ UserId: 99, Status: 'INACTIVE', IsAdmin: 1 }], 'ADMIN_REQUIRED'],
  ['non-admin actor', [{ UserId: 99, Status: 'ACTIVE', IsAdmin: 0 }], 'ADMIN_REQUIRED'],
])('create: %s rolls back before any setup-source mutation', async (_, actorRows, outcome) => {
  const calls = useTransactionResults([actorRows]);

  await expect(invokeCreate()).resolves.toEqual({ outcome });

  expectNoSetupMutation(calls);
});

test('returns deterministic create conflicts before inserts', async () => {
  let calls = useTransactionResults([ACTIVE_ADMIN, [{ UserId: 10 }]]);
  await expect(invokeCreate()).resolves.toEqual({ outcome: 'EMAIL_ALREADY_EXISTS' });
  expectNoSetupMutation(calls);

  calls = useTransactionResults([ACTIVE_ADMIN, [], [{ UserId: 11 }]]);
  await expect(invokeCreate()).resolves.toEqual({ outcome: 'USERNAME_ALREADY_EXISTS' });
  expectNoSetupMutation(calls);
});

test('maps only the deterministic email index duplicate error to EMAIL_ALREADY_EXISTS', async () => {
  const emailConflict = Object.assign(new Error("Violation of UNIQUE KEY index 'UX_Users_Email'."), {
    number: 2601,
  });
  useTransactionResults([ACTIVE_ADMIN, [], [], emailConflict]);

  await expect(invokeCreate()).resolves.toEqual({ outcome: 'EMAIL_ALREADY_EXISTS' });
  expect(sql.Transaction.instances.at(-1).rollbackCount).toBe(1);

  const unrelatedConflict = Object.assign(new Error("Violation of UNIQUE KEY index 'UQ_Users_Username'."), {
    number: 2627,
  });
  useTransactionResults([ACTIVE_ADMIN, [], [], unrelatedConflict]);

  await expect(invokeCreate()).rejects.toBe(unrelatedConflict);
  expect(sql.Transaction.instances.at(-1).rollbackCount).toBe(1);
});

test('setup completion rejects a deactivated inactive account before mutation', async () => {
  const calls = useTransactionResults([[
    {
      TokenId: 21,
      UserId: 7,
      ExpiresAt: FIXED_EXPIRY,
      UsedAt: null,
      RevokedAt: null,
      Status: 'INACTIVE',
      DeactivatedAt: new Date('2026-07-19T08:00:00.000Z'),
    },
  ]]);

  await expect(invokeComplete()).resolves.toEqual({ matched: true, outcome: 'INVALID' });

  expect(calls[0].query).toContain('u.DeactivatedAt');
  expect(calls.some(({ query }) => /UPDATE Users|UPDATE AuthTokens|INSERT INTO AuditLogs/.test(query))).toBe(false);
  expect(sql.Transaction.instances.at(-1).commitCount).toBe(0);
  expect(sql.Transaction.instances.at(-1).rollbackCount).toBe(1);
});

test.each([
  ['missing actor', [], 'ADMIN_NOT_FOUND'],
  ['inactive actor', [{ UserId: 99, Status: 'INACTIVE', IsAdmin: 1 }], 'ADMIN_REQUIRED'],
  ['non-admin actor', [{ UserId: 99, Status: 'ACTIVE', IsAdmin: 0 }], 'ADMIN_REQUIRED'],
])('resend: %s rolls back before target or token mutation', async (_, actorRows, outcome) => {
  const calls = useTransactionResults([actorRows]);

  await expect(invokeRotate()).resolves.toEqual({ outcome });

  expect(calls).toHaveLength(1);
  expectNoSetupMutation(calls);
});

test('resend locks the acting Admin before the target setup history', async () => {
  const latestIssuedAt = new Date(FIXED_NOW.getTime() - 60 * 1000);
  const calls = useTransactionResults([
    ACTIVE_ADMIN,
    [{
      UserId: 7,
      Email: 'reference@example.test',
      Status: 'INACTIVE',
      TokenId: 20,
      CreatedAt: latestIssuedAt,
      UsedAt: null,
      RevokedAt: null,
    }],
    [],
    [{ TokenId: 21 }],
    [],
  ]);

  await expect(invokeRotate()).resolves.toMatchObject({
    outcome: 'ROTATED',
    tokenId: 21,
  });

  expect(calls[0].inputs.AdminUserId).toBe(99);
  expect(calls[0].query).toContain('UPDLOCK');
  expect(calls[1].inputs.UserId).toBe(7);
  expect(calls[1].query).toContain("TokenType = 'ACCOUNT_SETUP'");
  expect(sql.Transaction.instances.at(-1).commitCount).toBe(1);
});
