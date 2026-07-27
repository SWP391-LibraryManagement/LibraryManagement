const {
  migrateLibraryMetadata,
  migrationPath,
} = require('../scripts/migrateLibraryMetadata');

test('runs only the approved metadata migration and verifies the result', async () => {
  const query = jest.fn().mockResolvedValue({});
  const close = jest.fn().mockResolvedValue();
  const getPoolImpl = jest.fn(async () => ({
    request: () => ({ query }),
    close,
  }));
  const readFileImpl = jest.fn(async () => 'SET XACT_ABORT ON; SELECT 1;');
  const checkSchemaImpl = jest.fn(async () => true);

  await migrateLibraryMetadata({
    getPoolImpl,
    readFileImpl,
    checkSchemaImpl,
  });

  expect(readFileImpl).toHaveBeenCalledWith(migrationPath, 'utf8');
  expect(query).toHaveBeenCalledWith('SET XACT_ABORT ON; SELECT 1;');
  expect(checkSchemaImpl).toHaveBeenCalledTimes(1);
  expect(close).toHaveBeenCalledTimes(1);
});

test('fails safely when post-migration schema verification is not ready', async () => {
  await expect(migrateLibraryMetadata({
    getPoolImpl: async () => ({
      request: () => ({ query: jest.fn().mockResolvedValue({}) }),
    }),
    readFileImpl: async () => 'SELECT 1;',
    checkSchemaImpl: async () => false,
  })).rejects.toThrow('schema verification failed');
});
