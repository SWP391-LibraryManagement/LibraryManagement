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

    async query(statement) {
      return this.transaction.pool.transactionQuery(statement, this.inputs);
    }
  }

  return {
    sql: {
      Date: 'Date',
      Int: 'Int',
      NVarChar: (size) => `NVarChar(${size})`,
      Transaction,
      Request,
    },
    getPool: jest.fn(),
  };
});

const { getPool, sql } = require('../src/config/db');
const profileRepository = require('../src/repositories/profileRepository');

const PROFILE_ROW = {
  UserId: 7,
  Username: 'member',
  Email: 'member@example.test',
  Phone: '0900000001',
  Status: 'ACTIVE',
  CreatedAt: new Date('2026-01-01T00:00:00.000Z'),
  UpdatedAt: null,
  ProfileId: 3,
  FullName: 'Demo Member',
  Address: 'Old Address',
  DateOfBirth: new Date('2000-01-02T00:00:00.000Z'),
  AvatarUrl: '/uploads/avatars/7-old.png',
  ProfileCreatedAt: new Date('2026-01-01T00:00:00.000Z'),
  ProfileUpdatedAt: null,
};

function usePool({ transactionResults = [], directResults = [] } = {}) {
  const transactionCalls = [];
  const directCalls = [];
  const transactionQueue = [...transactionResults];
  const directQueue = [...directResults];

  const pool = {
    async transactionQuery(statement, inputs) {
      transactionCalls.push({ statement, inputs });
      const next = transactionQueue.shift();
      if (next instanceof Error) throw next;
      return { recordset: next || [] };
    },
    request() {
      const inputs = {};
      return {
        input(name, _type, value) {
          inputs[name] = value;
          return this;
        },
        async query(statement) {
          directCalls.push({ statement, inputs: { ...inputs } });
          const next = directQueue.shift();
          if (next instanceof Error) throw next;
          return { recordset: next || [] };
        },
      };
    },
  };

  getPool.mockResolvedValue(pool);
  return { transactionCalls, directCalls };
}

beforeEach(() => {
  getPool.mockReset();
  sql.Transaction.instances = [];
});

test('findByUserId returns null when the authenticated account does not exist', async () => {
  usePool({ directResults: [[]] });

  await expect(profileRepository.findByUserId(999)).resolves.toBeNull();
});

test('createBlankProfile serializes first-view creation and returns one profile row', async () => {
  const { transactionCalls } = usePool({
    transactionResults: [[], [PROFILE_ROW]],
    directResults: [[PROFILE_ROW]],
  });

  await expect(profileRepository.createBlankProfile(7)).resolves.toMatchObject({
    userId: 7,
    profileId: 3,
  });

  const creationSql = transactionCalls.map((call) => call.statement).join('\n');
  expect(creationSql).toContain('UPDLOCK');
  expect(creationSql).toContain('HOLDLOCK');
  expect(creationSql).toContain('INSERT INTO UserProfiles');
  expect(transactionCalls[0].inputs.UserId).toBe(7);
  expect(sql.Transaction.instances.at(-1).commitCount).toBe(1);
  expect(sql.Transaction.instances.at(-1).rollbackCount).toBe(0);
});

test('updateByUserId commits profile fields and mandatory audit in one transaction', async () => {
  const { transactionCalls, directCalls } = usePool({
    transactionResults: [[], [], [{ ...PROFILE_ROW, FullName: 'Updated Member', Phone: '0900000002' }]],
    directResults: [[{ ...PROFILE_ROW, FullName: 'Updated Member' }]],
  });
  const auditLogRepository = { create: jest.fn(async () => undefined) };
  const auditEntry = {
    userId: 7,
    action: 'PROFILE_UPDATE',
    targetType: 'USER_PROFILE',
    targetId: 7,
    metadata: { fields: ['fullName'] },
  };

  await profileRepository.updateByUserId(
    7,
    { fullName: 'Updated Member', phone: '0900000002' },
    { auditLogRepository, auditEntry }
  );

  expect(auditLogRepository.create).toHaveBeenCalledWith({
    ...auditEntry,
    transaction: sql.Transaction.instances.at(-1),
  });
  expect(transactionCalls.some(({ statement }) => statement.includes('UPDATE Users'))).toBe(true);
  expect(transactionCalls.some(({ statement }) => statement.includes('UPDATE UserProfiles'))).toBe(true);
  expect(transactionCalls.at(-1).statement).toContain('SELECT TOP 1');
  expect(directCalls).toHaveLength(0);
  expect(sql.Transaction.instances.at(-1).commitCount).toBe(1);
  expect(sql.Transaction.instances.at(-1).rollbackCount).toBe(0);
});

test('updateByUserId rolls back profile changes when the mandatory audit fails', async () => {
  const { directCalls } = usePool({ transactionResults: [[], []] });
  const auditError = new Error('audit insert failed');
  const auditLogRepository = { create: jest.fn(async () => { throw auditError; }) };

  await expect(profileRepository.updateByUserId(
    7,
    { fullName: 'Updated Member', phone: '0900000002' },
    {
      auditLogRepository,
      auditEntry: {
        userId: 7,
        action: 'PROFILE_UPDATE',
        targetType: 'USER_PROFILE',
        targetId: 7,
        metadata: { fields: ['fullName'] },
      },
    }
  )).rejects.toBe(auditError);

  expect(sql.Transaction.instances.at(-1).commitCount).toBe(0);
  expect(sql.Transaction.instances.at(-1).rollbackCount).toBe(1);
  expect(directCalls).toHaveLength(0);
});

test('updateByUserId changes profile-only fields without touching the Users row', async () => {
  const { transactionCalls } = usePool({
    transactionResults: [[], [{ ...PROFILE_ROW, Address: 'New Address', DateOfBirth: null }]],
  });
  const auditLogRepository = { create: jest.fn(async () => undefined) };

  await profileRepository.updateByUserId(
    7,
    { address: 'New Address', dateOfBirth: null },
    {
      auditLogRepository,
      auditEntry: {
        userId: 7,
        action: 'PROFILE_UPDATE',
        targetType: 'USER_PROFILE',
        targetId: 7,
        metadata: { fields: ['address', 'dateOfBirth'] },
      },
    }
  );

  expect(transactionCalls.some(({ statement }) => statement.includes('UPDATE Users'))).toBe(false);
  expect(transactionCalls[0].statement).toContain('Address = @Address');
  expect(transactionCalls[0].statement).toContain('DateOfBirth = @DateOfBirth');
});

test('updateAvatarByUserId commits the generated URL and safe audit in one transaction', async () => {
  const { transactionCalls, directCalls } = usePool({
    transactionResults: [[], [{ ...PROFILE_ROW, AvatarUrl: '/uploads/avatars/7-new.png' }]],
    directResults: [[{ ...PROFILE_ROW, AvatarUrl: '/uploads/avatars/7-new.png' }]],
  });
  const auditLogRepository = { create: jest.fn(async () => undefined) };
  const auditEntry = {
    userId: 7,
    action: 'PROFILE_UPDATE',
    targetType: 'USER_PROFILE',
    targetId: 7,
    metadata: { fields: ['avatarUrl'] },
  };

  await profileRepository.updateAvatarByUserId(
    7,
    '/uploads/avatars/7-new.png',
    { auditLogRepository, auditEntry }
  );

  expect(auditLogRepository.create).toHaveBeenCalledWith({
    ...auditEntry,
    transaction: sql.Transaction.instances.at(-1),
  });
  expect(transactionCalls.at(-1).statement).toContain('SELECT TOP 1');
  expect(directCalls).toHaveLength(0);
  expect(sql.Transaction.instances.at(-1).commitCount).toBe(1);
  expect(sql.Transaction.instances.at(-1).rollbackCount).toBe(0);
});
