jest.mock('mssql', () => ({
  connect: jest.fn(),
}));

const sql = require('mssql');
const { getPool, resetPoolForTests } = require('../src/config/db');

describe('SQL connection pool bootstrap', () => {
  beforeEach(() => {
    resetPoolForTests();
    sql.connect.mockReset();
    process.env.DB_SERVER = 'sql.example.test';
    process.env.DB_NAME = 'LibraryManagement';
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_CONNECTION_TIMEOUT_MS;
  });

  afterEach(() => {
    resetPoolForTests();
  });

  test('allows a later request to retry after the first connection fails', async () => {
    const firstError = new Error('temporary SQL connection failure');
    const pool = { connected: true };
    sql.connect.mockRejectedValueOnce(firstError).mockResolvedValueOnce(pool);

    await expect(getPool()).rejects.toBe(firstError);
    await expect(getPool()).resolves.toBe(pool);

    expect(sql.connect).toHaveBeenCalledTimes(2);
  });

  test('uses a wake-up tolerant connection timeout by default', async () => {
    sql.connect.mockResolvedValue({ connected: true });

    await getPool();

    expect(sql.connect).toHaveBeenCalledWith(expect.objectContaining({ connectionTimeout: 60000 }));
  });
});
