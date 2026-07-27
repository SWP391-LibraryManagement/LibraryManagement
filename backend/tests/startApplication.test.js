const { startApplication } = require('../src/startApplication');

describe('backend application startup', () => {
  test('reconciles the catalog metadata schema before listening', async () => {
    const calls = [];
    const schemaReadinessService = {
      ensureCatalogMetadataSchema: jest.fn(async () => {
        calls.push('catalog-schema');
      }),
      ensureChangePasswordOtpTokenType: jest.fn(async () => {
        calls.push('auth-token-schema');
      }),
    };
    const runtime = {
      start: jest.fn(() => {
        calls.push('listen');
        return 'server';
      }),
    };
    const logger = { info: jest.fn() };

    await expect(startApplication({
      runtime,
      schemaReadinessService,
      logger,
    })).resolves.toBe('server');

    expect(calls).toEqual(['catalog-schema', 'auth-token-schema', 'listen']);
    expect(logger.info).toHaveBeenCalledWith('Deployment schema is ready.');
  });

  test('does not listen when schema reconciliation fails', async () => {
    const failure = new Error('ALTER permission denied');
    const schemaReadinessService = {
      ensureCatalogMetadataSchema: jest.fn().mockRejectedValue(failure),
      ensureChangePasswordOtpTokenType: jest.fn(),
    };
    const runtime = { start: jest.fn() };

    await expect(startApplication({
      runtime,
      schemaReadinessService,
      logger: { info: jest.fn() },
    })).rejects.toBe(failure);

    expect(runtime.start).not.toHaveBeenCalled();
    expect(schemaReadinessService.ensureChangePasswordOtpTokenType).not.toHaveBeenCalled();
  });
});
