const mockQuery = jest.fn();
const mockRequest = jest.fn(() => ({ query: mockQuery }));

jest.mock('../src/config/db', () => ({
  getPool: jest.fn(async () => ({ request: mockRequest })),
}));

const {
  checkCatalogMetadataSchema,
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
});
