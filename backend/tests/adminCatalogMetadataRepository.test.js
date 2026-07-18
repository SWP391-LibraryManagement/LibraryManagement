const mockQuery = jest.fn();
const mockInput = jest.fn(() => ({ input: mockInput, query: mockQuery }));
const mockRequest = jest.fn(() => ({ input: mockInput, query: mockQuery }));

jest.mock('../src/config/db', () => ({
  getPool: jest.fn(async () => ({ request: mockRequest })),
  sql: { NVarChar: jest.fn((length) => `NVARCHAR(${length})`) },
}));

const adminRepository = require('../src/repositories/adminRepository');

describe('admin catalog metadata persistence', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockInput.mockClear();
    mockRequest.mockClear();
  });

  test.each(['authors', 'publishers', 'categories'])('%s list reads persisted CreatedAt', async (resource) => {
    const createdAt = new Date('2026-07-18T04:00:00.000Z');
    mockQuery.mockResolvedValueOnce({ recordset: [{ id: 1, name: 'Test', status: 'ACTIVE', createdAt }] });

    const rows = await adminRepository.listResource(resource);

    expect(rows[0].createdAt).toBe(createdAt);
    expect(mockQuery.mock.calls[0][0]).toContain('Status AS status');
    expect(mockQuery.mock.calls[0][0]).toContain('CreatedAt AS createdAt');
    expect(mockQuery.mock.calls[0][0]).not.toContain('Không lưu trong DB');
  });

  test('create returns the database-generated creation timestamp', async () => {
    const createdAt = new Date('2026-07-18T04:00:00.000Z');
    mockQuery.mockResolvedValueOnce({ recordset: [{ id: 7, name: 'New author', status: 'ACTIVE', createdAt }] });

    const row = await adminRepository.createResource('authors', 'New author');

    expect(row).toEqual({ id: 7, name: 'New author', status: 'ACTIVE', createdAt });
    expect(mockQuery.mock.calls[0][0]).toContain('INSERTED.CreatedAt AS createdAt');
    expect(mockQuery.mock.calls[0][0]).toContain('INSERTED.Status AS status');
  });

  test.each(['authors', 'publishers', 'categories'])('%s deactivation preserves the row', async (resource) => {
    mockQuery.mockResolvedValueOnce({ recordset: [{ affectedRows: 1 }] });

    await expect(adminRepository.deactivateResource(resource, 3)).resolves.toBe(1);

    expect(mockQuery.mock.calls[0][0]).toContain("SET Status = 'INACTIVE'");
    expect(mockQuery.mock.calls[0][0]).not.toContain('DELETE FROM');
  });

  test('admin borrowing read model derives overdue instead of expecting a persisted status', async () => {
    mockQuery.mockResolvedValueOnce({ recordset: [] });

    await adminRepository.listBorrowings({ status: 'OVERDUE' });

    const statement = mockQuery.mock.calls[0][0];
    expect(statement).toContain("bd.Status = 'BORROWED' AND bd.DueDate < CAST(GETDATE() AS DATE)");
    expect(statement).toContain("THEN 'OVERDUE'");
    expect(statement).toContain('ORDER BY bd.BorrowDetailId ASC');
  });
});
