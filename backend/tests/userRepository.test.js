jest.mock('../src/config/db', () => ({
  sql: {
    Int: 'Int',
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
          return { recordset };
        },
      };
    },
  });
  return capture;
}

beforeEach(() => getPool.mockReset());

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
