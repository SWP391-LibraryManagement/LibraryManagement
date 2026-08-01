const mockQuery = jest.fn();
const mockInput = jest.fn(() => ({ input: mockInput, query: mockQuery }));
const mockRequest = jest.fn(() => ({ input: mockInput, query: mockQuery }));
const mockSqlRequest = jest.fn(() => ({ input: mockInput, query: mockQuery }));
const mockTransactionBegin = jest.fn();
const mockTransactionCommit = jest.fn();
const mockTransactionRollback = jest.fn();
const mockTransaction = {
  begin: mockTransactionBegin,
  commit: mockTransactionCommit,
  rollback: mockTransactionRollback,
};
const mockSqlTransaction = jest.fn(() => mockTransaction);

jest.mock('../src/config/db', () => ({
  getPool: jest.fn(async () => ({ request: mockRequest })),
  sql: {
    Int: 'INT',
    NVarChar: jest.fn((length) => `NVARCHAR(${length})`),
    Request: mockSqlRequest,
    Transaction: mockSqlTransaction,
  },
}));

const adminRepository = require('../src/repositories/adminRepository');

describe('admin catalog metadata persistence', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    [
      mockInput,
      mockRequest,
      mockSqlRequest,
      mockTransactionBegin,
      mockTransactionCommit,
      mockTransactionRollback,
      mockSqlTransaction,
    ].forEach((mock) => mock.mockClear());
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

  test('update returns null when SQL Server updates no resource row', async () => {
    mockQuery.mockResolvedValueOnce({ recordset: [] });

    await expect(adminRepository.updateResource('authors', 999, 'Missing')).resolves.toBeNull();
    expect(mockQuery.mock.calls[0][0]).toContain('OUTPUT INSERTED.AuthorId AS id');
  });

  test('metadata mutations use the supplied SQL transaction request', async () => {
    const transaction = { id: 'tx' };
    mockQuery.mockResolvedValueOnce({
      recordset: [{ id: 7, name: 'Transactional', status: 'ACTIVE', createdAt: new Date() }],
    });

    await adminRepository.createResource('authors', 'Transactional', transaction);

    expect(mockSqlRequest).toHaveBeenCalledWith(transaction);
    expect(mockRequest).not.toHaveBeenCalled();
  });

  test('withTransaction rolls back when its work rejects', async () => {
    const failure = new Error('audit failed');

    await expect(adminRepository.withTransaction(async () => { throw failure; }))
      .rejects.toBe(failure);
    expect(mockTransactionBegin).toHaveBeenCalledTimes(1);
    expect(mockTransactionRollback).toHaveBeenCalledTimes(1);
    expect(mockTransactionCommit).not.toHaveBeenCalled();
  });

  test('withTransaction commits and returns successful work', async () => {
    await expect(adminRepository.withTransaction(async () => 'committed')).resolves.toBe('committed');
    expect(mockTransactionBegin).toHaveBeenCalledTimes(1);
    expect(mockTransactionCommit).toHaveBeenCalledTimes(1);
    expect(mockTransactionRollback).not.toHaveBeenCalled();
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
