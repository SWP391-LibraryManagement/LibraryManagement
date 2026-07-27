const mockQuery = jest.fn();
const mockRequest = jest.fn(() => ({ query: mockQuery }));

jest.mock('../src/config/db', () => ({
  getPool: jest.fn(async () => ({ request: mockRequest })),
}));

const {
  checkCatalogMetadataSchema,
  ensureCatalogMetadataSchema,
  loadCatalogMetadataMigration,
} = require('../src/services/schemaReadinessService');

describe('catalog metadata schema readiness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns ready only when every canonical metadata column exists', async () => {
    mockQuery.mockResolvedValueOnce({ recordset: [{ isReady: 1 }] });

    await expect(checkCatalogMetadataSchema()).resolves.toBe(true);

    const statement = mockQuery.mock.calls[0][0];
    for (const table of ['Authors', 'Publishers', 'Categories']) {
      expect(statement).toContain(`OBJECT_ID(N'dbo.${table}', N'U')`);
      expect(statement).toContain(`COL_LENGTH(N'dbo.${table}', N'Status')`);
      expect(statement).toContain(`COL_LENGTH(N'dbo.${table}', N'CreatedAt')`);
    }
  });

  test('returns not ready for a legacy deployed schema', async () => {
    mockQuery.mockResolvedValueOnce({ recordset: [{ isReady: 0 }] });

    await expect(checkCatalogMetadataSchema()).resolves.toBe(false);
  });

  test('loads the reviewed compatibility migration from the repository', () => {
    const migration = loadCatalogMetadataMigration();

    expect(migration).toContain("ALTER TABLE dbo.Authors ADD Status");
    expect(migration).toContain("ALTER TABLE dbo.Publishers ADD CreatedAt");
    expect(migration).toContain("ALTER TABLE dbo.Categories ADD Status");
    expect(migration).toContain('SET XACT_ABORT ON');
  });

  test('applies the reviewed migration and verifies its postcondition', async () => {
    mockQuery
      .mockResolvedValueOnce({ recordset: [] })
      .mockResolvedValueOnce({ recordset: [{ isReady: 1 }] });

    await expect(ensureCatalogMetadataSchema({
      migrationSql: '-- reviewed migration',
    })).resolves.toBe(true);

    expect(mockQuery.mock.calls[0][0]).toBe('-- reviewed migration');
    expect(mockQuery.mock.calls[1][0]).toContain("COL_LENGTH(N'dbo.Authors', N'Status')");
  });

  test('fails startup when the migration postcondition is not satisfied', async () => {
    mockQuery
      .mockResolvedValueOnce({ recordset: [] })
      .mockResolvedValueOnce({ recordset: [{ isReady: 0 }] });

    await expect(ensureCatalogMetadataSchema({
      migrationSql: '-- reviewed migration',
    })).rejects.toThrow(/not ready after compatibility migration/i);
  });
});
