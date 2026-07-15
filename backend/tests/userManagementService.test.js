process.env.BCRYPT_COST = '4';

const bcrypt = require('bcrypt');
const { createUserManagementService } = require('../src/services/userManagementService');
const { hashToken } = require('../src/utils/tokenUtils');
const { makeInMemoryAuthDependencies } = require('./helpers/inMemoryAuthRepositories');

const FIXED_NOW = new Date('2026-07-15T02:00:00.000Z');

function makeHarness({ deliveryStatus = 'SENT', deliveryError = null, failureStage = null } = {}) {
  const dependencies = makeInMemoryAuthDependencies();
  dependencies.state.accountSetupControl.failureStage = failureStage;
  const notificationRequester = {
    createNotificationRequest: jest.fn(async () => {
      if (deliveryError) {
        throw deliveryError;
      }

      return { notificationId: 700, status: deliveryStatus };
    }),
  };
  const service = createUserManagementService({
    userRepository: dependencies.userRepository,
    authTokenRepository: dependencies.authTokenRepository,
    auditLogRepository: dependencies.auditLogRepository,
    accountSetupRepository: dependencies.accountSetupRepository,
    notificationRequester,
    clock: () => FIXED_NOW,
    exposeDebugTokens: true,
  });

  return { service, dependencies, notificationRequester };
}

describe('FE11 transactional account setup creation', () => {
  test.each([
    ['member', 'MEMBER'],
    ['librarian', 'LIBRARIAN'],
  ])('creates an INACTIVE %s with one safe FE10 setup request', async (type, roleName) => {
    const { service, dependencies, notificationRequester } = makeHarness();
    notificationRequester.createNotificationRequest.mockImplementation(async () => {
      expect(dependencies.state.users).toHaveLength(1);
      expect(dependencies.state.profiles).toHaveLength(1);
      expect(dependencies.state.tokens).toHaveLength(1);
      expect(dependencies.state.auditLogs).toHaveLength(1);
      return { notificationId: 700, status: 'SENT' };
    });

    const result = await service.createUser(
      {
        email: `${type}@example.test`,
        username: `${type}.account`,
        fullName: `${type} account`,
        type,
        phone: '0900000000',
        address: 'Test address',
      },
      { adminUserId: 99, ip: '127.0.0.1', userAgent: 'jest' }
    );

    expect(result).toEqual({
      userId: 1,
      email: `${type}@example.test`,
      status: 'INACTIVE',
      roles: [roleName],
      setupDeliveryStatus: 'SENT',
      message: 'User created. Password setup email sent.',
    });
    expect(Object.keys(result).sort()).toEqual(
      ['email', 'message', 'roles', 'setupDeliveryStatus', 'status', 'userId'].sort()
    );

    const user = dependencies.state.users[0];
    expect(user.status).toBe('INACTIVE');
    expect(user.passwordHash).not.toBe('ACCOUNT_SETUP_PENDING');
    expect(bcrypt.getRounds(user.passwordHash)).toBe(4);
    expect(dependencies.state.rolesByUserId.get(user.userId)).toEqual([roleName]);

    const token = dependencies.state.tokens[0];
    expect(token).toMatchObject({
      userId: user.userId,
      tokenType: 'ACCOUNT_SETUP',
      usedAt: null,
      revokedAt: null,
    });
    expect(token.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(token.expiresAt).toEqual(new Date('2026-07-16T02:00:00.000Z'));

    expect(notificationRequester.createNotificationRequest).toHaveBeenCalledTimes(1);
    const notificationInput = notificationRequester.createNotificationRequest.mock.calls[0][0];
    expect(notificationInput).toMatchObject({
      type: 'ACCOUNT_SETUP',
      recipientEmail: `${type}@example.test`,
      templateKey: 'ACCOUNT_SETUP',
      templateData: { expiresInHours: 24, setupLink: expect.any(String) },
      sourceEntityType: 'AuthToken',
      sourceEntityId: token.tokenId,
      idempotencyKey: `FE11:ACCOUNT_SETUP:${token.tokenId}`,
    });

    const setupUrl = new URL(notificationInput.templateData.setupLink);
    const rawToken = setupUrl.searchParams.get('token');
    expect(setupUrl.origin).toBe('http://localhost:5173');
    expect(setupUrl.pathname).toBe('/forgot-password');
    expect(rawToken).toBeTruthy();
    expect(hashToken(rawToken)).toBe(token.tokenHash);

    const persistedAndReturned = JSON.stringify({ state: dependencies.state, result });
    expect(persistedAndReturned).not.toContain(rawToken);
    expect(persistedAndReturned).not.toContain(notificationInput.templateData.setupLink);
  });

  test('rolls back user, profile, role, token, and audit together when a source stage fails', async () => {
    for (const failureStage of ['profile', 'role', 'token', 'audit']) {
      const { service, dependencies, notificationRequester } = makeHarness({ failureStage });

      await expect(
        service.createUser(
          {
            email: `${failureStage}@example.test`,
            username: `${failureStage}.account`,
            fullName: 'Rollback account',
            type: 'member',
          },
          { adminUserId: 99, ip: '127.0.0.1', userAgent: 'jest' }
        )
      ).rejects.toThrow();

      expect(dependencies.state.users).toHaveLength(0);
      expect(dependencies.state.profiles).toHaveLength(0);
      expect(dependencies.state.rolesByUserId.size).toBe(0);
      expect(dependencies.state.tokens).toHaveLength(0);
      expect(dependencies.state.auditLogs).toHaveLength(0);
      expect(notificationRequester.createNotificationRequest).not.toHaveBeenCalled();
    }
  });

  test.each([
    ['returns FAILED', { deliveryStatus: 'FAILED' }],
    ['throws', { deliveryError: new Error('smtp provider-secret stack detail') }],
  ])('keeps the committed account INACTIVE when FE10 delivery %s', async (_, deliveryOptions) => {
    const { service, dependencies, notificationRequester } = makeHarness(deliveryOptions);

    const result = await service.createUser(
      {
        email: 'delivery-failure@example.test',
        username: 'delivery.failure',
        fullName: 'Delivery Failure',
        type: 'librarian',
      },
      { adminUserId: 99, ip: '127.0.0.1', userAgent: 'jest' }
    );

    expect(result).toEqual({
      userId: 1,
      email: 'delivery-failure@example.test',
      status: 'INACTIVE',
      roles: ['LIBRARIAN'],
      setupDeliveryStatus: 'FAILED',
      message: 'User created. Password setup email delivery failed.',
    });
    expect(dependencies.state.users[0].status).toBe('INACTIVE');
    expect(dependencies.state.tokens).toHaveLength(1);
    expect(dependencies.state.auditLogs).toHaveLength(1);
    expect(notificationRequester.createNotificationRequest).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(result)).not.toContain('provider-secret');
  });
});
