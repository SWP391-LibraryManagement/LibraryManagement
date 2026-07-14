process.env.BCRYPT_COST = '4';
process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');
process.env.AUTH_EXPOSE_TEST_TOKENS = 'true';

const { makeSystemIntegrationApp } = require('./helpers/systemIntegrationHarness');

describe('System integration', () => {
  test('SIT-000 wires every completed service into one Express app', () => {
    const setup = makeSystemIntegrationApp();

    expect(setup.app).toBeTruthy();
    expect(setup.services).toEqual(expect.objectContaining({
      authService: expect.any(Object),
      borrowingService: expect.any(Object),
      reservationService: expect.any(Object),
      fineManagementService: expect.any(Object),
      notificationService: expect.any(Object),
      reportService: expect.any(Object),
    }));
  });
});
