process.env.BCRYPT_COST = '4';

const bcrypt = require('bcrypt');
const { createUserManagementService } = require('../src/services/userManagementService');
const { hashToken } = require('../src/utils/tokenUtils');
const { makeInMemoryAuthDependencies } = require('./helpers/inMemoryAuthRepositories');

const FIXED_NOW = new Date('2026-07-15T02:00:00.000Z');

function makeHarness({
  deliveryStatus = 'SENT',
  deliveryError = null,
  failureStage = null,
  initialNow = FIXED_NOW,
} = {}) {
  const dependencies = makeInMemoryAuthDependencies();
  dependencies.state.accountSetupControl.failureStage = failureStage;
  let currentNow = initialNow;
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
    clock: () => currentNow,
    exposeDebugTokens: true,
  });

  return {
    service,
    dependencies,
    notificationRequester,
    setNow(value) {
      currentNow = value;
    },
  };
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

describe('FE11 admin account setup resend', () => {
  async function createPendingAccount(harness, email = 'resend@example.test') {
    return harness.service.createUser(
      {
        email,
        username: email.split('@')[0],
        fullName: 'Resend Account',
        type: 'member',
      },
      { adminUserId: 99, ip: '127.0.0.1', userAgent: 'jest' }
    );
  }

  test('rotates the setup credential and requests a new FE10 event after 60 seconds', async () => {
    const harness = makeHarness();
    await createPendingAccount(harness);
    const originalToken = harness.dependencies.state.tokens[0];
    const resendNow = new Date(FIXED_NOW.getTime() + 60 * 1000);
    harness.setNow(resendNow);

    const result = await harness.service.resendSetup(1, {
      adminUserId: 99,
      ip: '127.0.0.2',
      userAgent: 'jest-resend',
    });

    expect(result).toEqual({
      userId: 1,
      status: 'INACTIVE',
      setupDeliveryStatus: 'SENT',
      message: 'Password setup email sent.',
    });
    expect(Object.keys(result).sort()).toEqual(
      ['message', 'setupDeliveryStatus', 'status', 'userId'].sort()
    );

    expect(originalToken.revokedAt).toEqual(resendNow);
    expect(harness.dependencies.state.tokens).toHaveLength(2);
    const newToken = harness.dependencies.state.tokens[1];
    expect(newToken).toMatchObject({
      tokenId: 2,
      userId: 1,
      tokenType: 'ACCOUNT_SETUP',
      usedAt: null,
      revokedAt: null,
      createdAt: resendNow,
      expiresAt: new Date('2026-07-16T02:01:00.000Z'),
    });
    expect(newToken.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(newToken.tokenHash).not.toBe(originalToken.tokenHash);

    expect(harness.notificationRequester.createNotificationRequest).toHaveBeenCalledTimes(2);
    const notificationInput =
      harness.notificationRequester.createNotificationRequest.mock.calls[1][0];
    expect(notificationInput).toMatchObject({
      type: 'ACCOUNT_SETUP',
      recipientEmail: 'resend@example.test',
      templateKey: 'ACCOUNT_SETUP',
      templateData: { expiresInHours: 24, setupLink: expect.any(String) },
      sourceEntityType: 'AuthToken',
      sourceEntityId: newToken.tokenId,
      idempotencyKey: `FE11:ACCOUNT_SETUP:${newToken.tokenId}`,
    });

    const setupUrl = new URL(notificationInput.templateData.setupLink);
    const rawToken = setupUrl.searchParams.get('token');
    expect(rawToken).toBeTruthy();
    expect(hashToken(rawToken)).toBe(newToken.tokenHash);
    expect(harness.dependencies.state.auditLogs.at(-1)).toMatchObject({
      userId: 99,
      action: 'USER_ACCOUNT_SETUP_RESEND',
      targetType: 'USER',
      targetId: 1,
      metadata: { tokenId: newToken.tokenId },
      ipAddress: '127.0.0.2',
      userAgent: 'jest-resend',
      createdAt: resendNow,
    });

    const persistedAndReturned = JSON.stringify({ state: harness.dependencies.state, result });
    expect(persistedAndReturned).not.toContain(rawToken);
    expect(persistedAndReturned).not.toContain(notificationInput.templateData.setupLink);
  });

  test('rejects resend during the 60-second issuance cooldown without changing source state', async () => {
    const harness = makeHarness();
    await createPendingAccount(harness);
    harness.setNow(new Date(FIXED_NOW.getTime() + 59 * 1000));

    await expect(
      harness.service.resendSetup(1, { adminUserId: 99 })
    ).rejects.toMatchObject({
      statusCode: 429,
      code: 'ACCOUNT_SETUP_RESEND_COOLDOWN',
      details: { retryAfterSeconds: 1 },
    });

    expect(harness.dependencies.state.tokens).toHaveLength(1);
    expect(harness.dependencies.state.tokens[0].revokedAt).toBeNull();
    expect(harness.dependencies.state.auditLogs).toHaveLength(1);
    expect(harness.notificationRequester.createNotificationRequest).toHaveBeenCalledTimes(1);
  });

  test.each([
    ['active account', 'ACTIVE', false],
    ['locked account', 'LOCKED', false],
    ['deleted account', 'DELETED', false],
    ['completed setup account', 'INACTIVE', true],
  ])('rejects resend for an %s', async (_, status, completed) => {
    const harness = makeHarness();
    await createPendingAccount(harness);
    harness.dependencies.state.users[0].status = status;
    if (completed) {
      harness.dependencies.state.tokens[0].usedAt = new Date(
        FIXED_NOW.getTime() + 30 * 1000
      );
    }
    harness.setNow(new Date(FIXED_NOW.getTime() + 60 * 1000));

    await expect(
      harness.service.resendSetup(1, { adminUserId: 99 })
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'ACCOUNT_SETUP_NOT_ELIGIBLE',
    });

    expect(harness.dependencies.state.tokens).toHaveLength(1);
    expect(harness.notificationRequester.createNotificationRequest).toHaveBeenCalledTimes(1);
  });

  test('rejects a self-registered inactive account with no FE11 setup history', async () => {
    const harness = makeHarness();
    await harness.dependencies.userRepository.createRegisteredUser({
      username: 'self.registered',
      email: 'self-registered@example.test',
      passwordHash: await bcrypt.hash('Password1!', 4),
      fullName: 'Self Registered',
    });

    await expect(
      harness.service.resendSetup(1, { adminUserId: 99 })
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'ACCOUNT_SETUP_NOT_ELIGIBLE',
    });

    expect(harness.dependencies.state.tokens).toHaveLength(0);
    expect(harness.notificationRequester.createNotificationRequest).not.toHaveBeenCalled();
  });

  test('rejects a missing target without creating a credential', async () => {
    const harness = makeHarness();

    await expect(
      harness.service.resendSetup(404, { adminUserId: 99 })
    ).rejects.toMatchObject({
      statusCode: 404,
      code: 'USER_NOT_FOUND',
    });

    expect(harness.dependencies.state.tokens).toHaveLength(0);
    expect(harness.dependencies.state.auditLogs).toHaveLength(0);
    expect(harness.notificationRequester.createNotificationRequest).not.toHaveBeenCalled();
  });

  test('keeps the rotated token committed and returns safe FAILED when FE10 delivery fails', async () => {
    const harness = makeHarness();
    await createPendingAccount(harness);
    harness.setNow(new Date(FIXED_NOW.getTime() + 60 * 1000));
    harness.notificationRequester.createNotificationRequest.mockRejectedValueOnce(
      new Error('smtp provider-secret stack detail')
    );

    const result = await harness.service.resendSetup(1, { adminUserId: 99 });

    expect(result).toEqual({
      userId: 1,
      status: 'INACTIVE',
      setupDeliveryStatus: 'FAILED',
      message: 'Password setup email delivery failed.',
    });
    expect(harness.dependencies.state.users[0].status).toBe('INACTIVE');
    expect(harness.dependencies.state.tokens).toHaveLength(2);
    expect(harness.dependencies.state.tokens[0].revokedAt).not.toBeNull();
    expect(harness.dependencies.state.tokens[1].revokedAt).toBeNull();
    expect(harness.dependencies.state.auditLogs.at(-1).action).toBe(
      'USER_ACCOUNT_SETUP_RESEND'
    );
    expect(JSON.stringify(result)).not.toContain('provider-secret');
  });

  test('rolls back token rotation when the resend audit stage fails', async () => {
    const harness = makeHarness();
    await createPendingAccount(harness);
    harness.setNow(new Date(FIXED_NOW.getTime() + 60 * 1000));
    harness.dependencies.state.accountSetupControl.resendFailureStage = 'audit';

    await expect(
      harness.service.resendSetup(1, { adminUserId: 99 })
    ).rejects.toThrow('audit insert failed');

    expect(harness.dependencies.state.tokens).toHaveLength(1);
    expect(harness.dependencies.state.tokens[0].revokedAt).toBeNull();
    expect(harness.dependencies.state.auditLogs).toHaveLength(1);
    expect(harness.notificationRequester.createNotificationRequest).toHaveBeenCalledTimes(1);
  });
});

describe('FE11 transactional role service', () => {
  function makeRoleHarness(outcome = 'ASSIGNED') {
    const updatedUser = {
      userId: 7,
      email: 'staff@example.test',
      roles: outcome === 'REVOKED' ? ['MEMBER'] : ['LIBRARIAN', 'MEMBER'],
    };
    const userRepository = {
      getManagedUserById: jest.fn(async () => updatedUser),
    };
    const userRoleRepository = {
      mutateUserRole: jest.fn(async () => ({
        outcome,
        role: { roleId: 3, roleName: 'LIBRARIAN' },
      })),
    };
    const auditLogRepository = {
      create: jest.fn(),
    };
    const service = createUserManagementService({
      userRepository,
      userRoleRepository,
      authTokenRepository: {},
      auditLogRepository,
      accountSetupRepository: {},
      notificationRequester: { createNotificationRequest: jest.fn() },
    });

    return {
      service,
      userRepository,
      userRoleRepository,
      auditLogRepository,
      updatedUser,
    };
  }

  test('assigns through the transactional repository and returns safe readback', async () => {
    const harness = makeRoleHarness('ASSIGNED');

    await expect(
      harness.service.assignRole(7, { roleId: 3 }, {
        adminUserId: 99,
        ip: '127.0.0.1',
        userAgent: 'jest',
      })
    ).resolves.toEqual(harness.updatedUser);

    expect(harness.userRoleRepository.mutateUserRole).toHaveBeenCalledWith({
      operation: 'ASSIGN',
      adminUserId: 99,
      userId: 7,
      roleId: 3,
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    });
    expect(harness.userRepository.getManagedUserById).toHaveBeenCalledWith(7);
    expect(harness.auditLogRepository.create).not.toHaveBeenCalled();
  });

  test('revokes through the transactional repository and returns safe readback', async () => {
    const harness = makeRoleHarness('REVOKED');

    await expect(
      harness.service.revokeRole(7, 3, {
        adminUserId: 99,
        ip: '127.0.0.2',
        userAgent: 'jest-revoke',
      })
    ).resolves.toEqual(harness.updatedUser);

    expect(harness.userRoleRepository.mutateUserRole).toHaveBeenCalledWith({
      operation: 'REVOKE',
      adminUserId: 99,
      userId: 7,
      roleId: 3,
      ipAddress: '127.0.0.2',
      userAgent: 'jest-revoke',
    });
    expect(harness.userRepository.getManagedUserById).toHaveBeenCalledWith(7);
    expect(harness.auditLogRepository.create).not.toHaveBeenCalled();
  });

  test.each([
    ['ADMIN_NOT_FOUND', 404, 'ADMIN_NOT_FOUND', 'Acting admin was not found.'],
    ['ADMIN_REQUIRED', 403, 'ADMIN_REQUIRED', 'Admin access is required.'],
    ['USER_NOT_FOUND', 404, 'USER_NOT_FOUND', 'User was not found.'],
    ['ROLE_NOT_FOUND', 404, 'ROLE_NOT_FOUND', 'Role was not found.'],
    ['USER_ALREADY_HAS_ROLE', 409, 'USER_ALREADY_HAS_ROLE', 'User already has this role.'],
    ['USER_ROLE_NOT_FOUND', 404, 'USER_ROLE_NOT_FOUND', 'User does not have this role.'],
    ['LAST_USER_ROLE', 400, 'LAST_USER_ROLE', 'Every user must keep at least one role.'],
    ['LAST_ADMIN_ROLE', 400, 'LAST_ADMIN_ROLE', 'Cannot remove the last Admin role.'],
  ])('maps %s to a safe service error', async (outcome, statusCode, code, message) => {
    const harness = makeRoleHarness(outcome);

    await expect(
      harness.service.assignRole(7, { roleId: 3 }, { adminUserId: 99 })
    ).rejects.toMatchObject({ statusCode, code, message });

    expect(harness.userRepository.getManagedUserById).not.toHaveBeenCalled();
    expect(harness.auditLogRepository.create).not.toHaveBeenCalled();
  });

  test.each([
    [
      'invalid target',
      (service) => service.assignRole(0, { roleId: 3 }, { adminUserId: 99 }),
      400,
      'INVALID_USER_ID',
    ],
    [
      'invalid assignment role',
      (service) => service.assignRole(7, { roleId: 0 }, { adminUserId: 99 }),
      400,
      'INVALID_ROLE_ID',
    ],
    [
      'invalid revocation role',
      (service) => service.revokeRole(7, 'not-a-role', { adminUserId: 99 }),
      400,
      'INVALID_ROLE_ID',
    ],
    [
      'missing acting Admin',
      (service) => service.assignRole(7, { roleId: 3 }, {}),
      404,
      'ADMIN_NOT_FOUND',
    ],
  ])('rejects %s before repository access', async (_, invokeRole, statusCode, code) => {
    const harness = makeRoleHarness();

    await expect(invokeRole(harness.service)).rejects.toMatchObject({ statusCode, code });

    expect(harness.userRoleRepository.mutateUserRole).not.toHaveBeenCalled();
    expect(harness.userRepository.getManagedUserById).not.toHaveBeenCalled();
  });

  test('maps an unknown repository outcome to a safe internal error', async () => {
    const harness = makeRoleHarness('UNEXPECTED_OUTCOME');

    await expect(
      harness.service.assignRole(7, { roleId: 3 }, { adminUserId: 99 })
    ).rejects.toMatchObject({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error.',
    });

    expect(harness.userRepository.getManagedUserById).not.toHaveBeenCalled();
  });

  test('preserves unexpected repository failures without a readback', async () => {
    const harness = makeRoleHarness();
    const repositoryError = new Error('role transaction failed');
    harness.userRoleRepository.mutateUserRole.mockRejectedValueOnce(repositoryError);

    await expect(
      harness.service.assignRole(7, { roleId: 3 }, { adminUserId: 99 })
    ).rejects.toBe(repositoryError);

    expect(harness.userRepository.getManagedUserById).not.toHaveBeenCalled();
  });
});

function makeReadHarness(userRepositoryOverrides = {}) {
  const userRepository = {
    listManagedUsers: jest.fn(async (query) => ({
      data: [],
      pagination: { ...query, total: 0, totalPages: 0 },
    })),
    getManagedUserById: jest.fn(),
    ...userRepositoryOverrides,
  };
  const service = createUserManagementService({
    userRepository,
    userRoleRepository: {},
    authTokenRepository: {},
    auditLogRepository: {},
    accountSetupRepository: {},
    notificationRequester: { createNotificationRequest: jest.fn() },
  });
  return { service, userRepository };
}

describe('FE11 safe managed-user reads', () => {
  test('listUsers applies defaults only when values are omitted', async () => {
    const { service, userRepository } = makeReadHarness();

    await service.listUsers({});

    expect(userRepository.listManagedUsers).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      status: null,
      role: null,
      search: null,
    });
  });

  test('listUsers normalizes approved filters before repository access', async () => {
    const { service, userRepository } = makeReadHarness();

    await service.listUsers({
      page: '2',
      limit: '50',
      status: ' active ',
      role: ' librarian ',
      search: '  user@example.test  ',
    });

    expect(userRepository.listManagedUsers).toHaveBeenCalledWith({
      page: 2,
      limit: 50,
      status: 'ACTIVE',
      role: 'LIBRARIAN',
      search: 'user@example.test',
    });
  });

  test.each([
    [{ page: 0 }, 'INVALID_PAGE'],
    [{ page: 1.5 }, 'INVALID_PAGE'],
    [{ limit: 101 }, 'INVALID_LIMIT'],
    [{ status: 'DELETED' }, 'INVALID_USER_STATUS'],
    [{ role: 'GUEST' }, 'INVALID_USER_ROLE'],
    [{ search: '   ' }, 'INVALID_USER_SEARCH'],
    [{ search: 'x'.repeat(201) }, 'INVALID_USER_SEARCH'],
  ])('listUsers rejects invalid direct input %j', async (query, code) => {
    const { service, userRepository } = makeReadHarness();

    await expect(service.listUsers(query)).rejects.toMatchObject({ statusCode: 400, code });
    expect(userRepository.listManagedUsers).not.toHaveBeenCalled();
  });

  test('getUser returns the dedicated detail projection', async () => {
    const detail = {
      userId: 7,
      phoneNumber: '0900000000',
      roles: ['MEMBER'],
      relatedSummary: {
        activeBorrowingCount: 1,
        unpaidFineTotal: 5000,
        openReservationCount: 2,
      },
    };
    const { service, userRepository } = makeReadHarness({
      getManagedUserDetailById: jest.fn(async () => detail),
    });

    await expect(service.getUser(7)).resolves.toEqual(detail);
    expect(userRepository.getManagedUserDetailById).toHaveBeenCalledWith(7);
    expect(userRepository.getManagedUserById).not.toHaveBeenCalled();
  });

  test('getUser returns 404 USER_NOT_FOUND for a missing valid ID', async () => {
    const { service } = makeReadHarness({
      getManagedUserDetailById: jest.fn(async () => null),
    });

    await expect(service.getUser(404)).rejects.toMatchObject({
      statusCode: 404,
      code: 'USER_NOT_FOUND',
      message: 'User was not found.',
    });
  });

  test.each([0, -1, 1.5, 'not-a-user'])(
    'getUser rejects invalid direct ID %p before repository access',
    async (userId) => {
      const { service, userRepository } = makeReadHarness({
        getManagedUserDetailById: jest.fn(),
      });

      await expect(service.getUser(userId)).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_USER_ID',
      });
      expect(userRepository.getManagedUserDetailById).not.toHaveBeenCalled();
    }
  );
});
