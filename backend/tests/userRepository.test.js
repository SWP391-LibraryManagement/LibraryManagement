jest.mock('../src/config/db', () => ({
  sql: {
    Int: 'Int',
    DateTime: 'DateTime',
    NVarChar: (size) => `NVarChar(${size})`,
  },
  getPool: jest.fn(),
}));

const { getPool } = require('../src/config/db');
const userRepository = require('../src/repositories/userRepository');

function useRecordset(recordset) {
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
          return { recordset, recordsets: [recordset, []] };
        },
      };
    },
  });
  return capture;
}

beforeEach(() => getPool.mockReset());

test('authentication lookup maps the FE11 deactivation marker', async () => {
  const deactivatedAt = new Date('2026-07-27T08:00:00.000Z');
  useRecordset([{
    UserId: 9,
    Username: 'deactivated.user',
    Email: 'deactivated@example.test',
    PasswordHash: 'hash',
    Status: 'INACTIVE',
    EmailVerifiedAt: null,
    DeactivatedAt: deactivatedAt,
  }]);

  await expect(userRepository.findByEmailOrUsername('deactivated@example.test')).resolves.toMatchObject({
    userId: 9,
    deactivatedAt,
  });
});

test('email activation update cannot overwrite deactivation', async () => {
  const capture = useRecordset([]);

  await userRepository.markEmailVerified(9);

  expect(capture.inputs.UserId).toBe(9);
  expect(capture.query).toContain("Status = 'INACTIVE'");
  expect(capture.query).toContain('DeactivatedAt IS NULL');
});

test('successful login update applies only to a currently active account', async () => {
  const capture = useRecordset([{ Applied: true }]);

  await expect(userRepository.resetFailedLoginsAndSetLastLogin(9)).resolves.toBe(true);

  expect(capture.query).toContain("Status = 'ACTIVE'");
  expect(capture.query).toContain('DeactivatedAt IS NULL');
});

test('auto-unlock applies only to the expired lock observed by the login attempt', async () => {
  const now = new Date('2026-07-27T08:00:00.000Z');
  const capture = useRecordset([{ Applied: true }]);

  await expect(userRepository.unlockExpiredAccount(9, now)).resolves.toBe(true);

  expect(capture.inputs.Now).toBe(now);
  expect(capture.query).toContain("Status = 'LOCKED'");
  expect(capture.query).toContain('LockedUntil <= @Now');
});

test('listManagedUsers returns only the approved base DTO', async () => {
  useRecordset([{
    UserId: 7,
    Username: 'safe.user',
    Email: 'safe@example.test',
    Phone: '0900000000',
    Status: 'ACTIVE',
    FullName: 'Safe User',
    Address: 'Shelf Street',
    LastLoginAt: null,
    CreatedAt: new Date('2026-07-01T00:00:00.000Z'),
    UpdatedAt: new Date('2026-07-18T00:00:00.000Z'),
    Roles: 'member,ADMIN',
    TotalCount: 1,
    PasswordHash: 'forbidden-hash',
    TokenHash: 'forbidden-token',
    SessionId: 'forbidden-session',
    SetupLink: 'https://forbidden.example/setup',
    AuditSecret: 'forbidden-audit',
  }]);

  const result = await userRepository.listManagedUsers({ page: 1, limit: 20 });

  expect(Object.keys(result).sort()).toEqual(['data', 'pagination']);
  expect(result.data[0]).toEqual({
    userId: 7,
    username: 'safe.user',
    email: 'safe@example.test',
    phoneNumber: '0900000000',
    status: 'ACTIVE',
    fullName: 'Safe User',
    address: 'Shelf Street',
    lastLoginAt: null,
    createdAt: new Date('2026-07-01T00:00:00.000Z'),
    updatedAt: new Date('2026-07-18T00:00:00.000Z'),
    roles: ['ADMIN', 'MEMBER'],
  });
  expect(result.data[0]).not.toHaveProperty('relatedSummary');
  expect(JSON.stringify(result.data[0])).not.toContain('forbidden-');
});

test('listManagedUsers does not execute a global summary aggregate query', async () => {
  const capture = useRecordset([]);

  await userRepository.listManagedUsers({ page: 1, limit: 20 });

  expect(capture.query).not.toContain('COUNT_BIG(1) AS Total');
  expect(capture.query).not.toContain("SUM(CASE WHEN u.Status = 'ACTIVE'");
});

test('listManagedUsers uses only approved search fields and stable ordering', async () => {
  const capture = useRecordset([]);

  await userRepository.listManagedUsers({
    page: 2,
    limit: 20,
    status: 'ACTIVE',
    role: 'MEMBER',
    search: 'safe',
  });

  expect(capture.inputs).toMatchObject({
    Offset: 20,
    Limit: 20,
    Status: 'ACTIVE',
    Role: 'MEMBER',
    Search: '%safe%',
  });
  expect(capture.query).toContain('LOWER(u.Email) LIKE LOWER(@Search)');
  expect(capture.query).toContain('LOWER(up.FullName) LIKE LOWER(@Search)');
  expect(capture.query).toContain('CONVERT(NVARCHAR(20), u.UserId) LIKE @Search');
  expect(capture.query).not.toContain('LOWER(u.Username) LIKE LOWER(@Search)');
  expect(capture.query).not.toContain('u.Phone LIKE @Search');
  expect(capture.query).not.toContain('LOWER(up.Address) LIKE LOWER(@Search)');
  expect(capture.query).not.toContain('LOWER(roleList.Roles) LIKE LOWER(@Search)');
  expect(capture.query).toContain('ORDER BY CreatedAt DESC, UserId DESC');
});

test('getManagedUserDetailById returns exactly three numeric summaries', async () => {
  const capture = useRecordset([{
    UserId: 7,
    Username: 'detail.user',
    Email: 'detail@example.test',
    Phone: '0900000000',
    Status: 'ACTIVE',
    FullName: 'Detail User',
    Address: 'Detail Street',
    LastLoginAt: null,
    CreatedAt: new Date('2026-07-01T00:00:00.000Z'),
    UpdatedAt: new Date('2026-07-18T00:00:00.000Z'),
    Roles: 'MEMBER',
    ActiveBorrowingCount: 2,
    UnpaidFineTotal: '15000.00',
    OpenReservationCount: 3,
    PasswordHash: 'forbidden-hash',
  }]);

  expect(typeof userRepository.getManagedUserDetailById).toBe('function');
  const result = await userRepository.getManagedUserDetailById(7);

  expect(capture.inputs.UserId).toBe(7);
  expect(result.relatedSummary).toEqual({
    activeBorrowingCount: 2,
    unpaidFineTotal: 15000,
    openReservationCount: 3,
  });
  expect(Object.keys(result.relatedSummary).sort()).toEqual(
    ['activeBorrowingCount', 'openReservationCount', 'unpaidFineTotal'].sort()
  );
  expect(result).not.toHaveProperty('passwordHash');
  expect(capture.query).toContain("bd.Status = 'BORROWED'");
  expect(capture.query).not.toContain("bd.Status = 'OVERDUE'");
  expect(capture.query).toContain("f.Status = 'UNPAID'");
  expect(capture.query).toContain('f.Amount - f.PaidAmount');
  expect(capture.query).toContain("r.Status IN ('ACTIVE', 'NOTIFIED')");
});

test('getManagedUserDetailById maps missing aggregates to zero and missing users to null', async () => {
  expect(typeof userRepository.getManagedUserDetailById).toBe('function');
  useRecordset([{
    UserId: 8,
    Username: 'zero.user',
    Email: 'zero@example.test',
    Phone: null,
    Status: 'INACTIVE',
    FullName: 'Zero User',
    Address: null,
    LastLoginAt: null,
    CreatedAt: new Date('2026-07-01T00:00:00.000Z'),
    UpdatedAt: null,
    Roles: 'MEMBER',
    ActiveBorrowingCount: null,
    UnpaidFineTotal: null,
    OpenReservationCount: null,
  }]);

  await expect(userRepository.getManagedUserDetailById(8)).resolves.toMatchObject({
    relatedSummary: {
      activeBorrowingCount: 0,
      unpaidFineTotal: 0,
      openReservationCount: 0,
    },
  });

  useRecordset([]);
  await expect(userRepository.getManagedUserDetailById(999)).resolves.toBeNull();
});

test('getManagedUserById returns the latest Users/UserProfiles effective version without work fields', async () => {
  const createdAt = new Date('2026-07-01T00:00:00.000Z');
  const capture = useRecordset([{
    UserId: 7,
    Username: 'reference.librarian',
    Email: 'reference@example.test',
    Phone: null,
    Status: 'ACTIVE',
    FullName: 'Reference Librarian',
    Address: null,
    LastLoginAt: null,
    CreatedAt: createdAt,
    UpdatedAt: null,
    EffectiveUpdatedAt: createdAt,
    Roles: 'LIBRARIAN',
    Department: 'Reference',
    Specialization: 'Research Support',
  }]);

  const result = await userRepository.getManagedUserById(7);
  expect(result).toMatchObject({
    updatedAt: createdAt,
    roles: ['LIBRARIAN'],
  });
  expect(capture.query).toContain('WHEN COALESCE(up.UpdatedAt, up.CreatedAt) > COALESCE(u.UpdatedAt, u.CreatedAt)');
  expect(result).not.toHaveProperty('department');
  expect(result).not.toHaveProperty('specialization');
});
