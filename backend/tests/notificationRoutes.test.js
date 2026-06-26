process.env.BCRYPT_COST = '4';
process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');
process.env.AUTH_EXPOSE_TEST_TOKENS = 'true';

const request = require('supertest');
const { createApp } = require('../src/app');
const { createAuthService } = require('../src/services/authService');
const { createNotificationService } = require('../src/services/notificationService');
const { makeInMemoryAuthDependencies } = require('./helpers/inMemoryAuthRepositories');
const {
  makeInMemoryNotificationDependencies,
} = require('./helpers/inMemoryNotificationRepositories');

function makeTestApp() {
  const authDependencies = makeInMemoryAuthDependencies();
  const notificationDependencies = makeInMemoryNotificationDependencies();
  const authService = createAuthService(authDependencies);
  const notificationService = createNotificationService({
    notificationRepository: notificationDependencies.notificationRepository,
    userRepository: authDependencies.userRepository,
    auditLogRepository: authDependencies.auditLogRepository,
    emailProvider: {
      async send(message) {
        if (message.to.includes('fail')) {
          const error = new Error('smtp auth token secret stack trace');
          error.safeMessage = 'Email provider unavailable.';
          throw error;
        }

        return { providerMessageId: `mock-${message.to}` };
      },
    },
  });
  const app = createApp({ authService, notificationService });

  return { app, authDependencies, notificationDependencies };
}

async function createVerifiedUser({ app, authDependencies, email, role = 'MEMBER' }) {
  const password = 'Password1!';
  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({
      email,
      password,
      confirmPassword: password,
      fullName: email.split('@')[0],
    });

  expect(registerResponse.status).toBe(201);

  const userId = registerResponse.body.userId;

  await request(app)
    .post('/api/auth/verify-email')
    .send({ token: registerResponse.body.debugVerificationToken })
    .expect(200);

  authDependencies.state.rolesByUserId.set(userId, [role]);

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  expect(loginResponse.status).toBe(200);

  return {
    userId,
    accessToken: loginResponse.body.accessToken,
  };
}

function authHeader(accessToken) {
  return `Bearer ${accessToken}`;
}

describe('FE10 notification management', () => {
  test('creates notification request and returns duplicate by idempotency key', async () => {
    const { app, authDependencies, notificationDependencies } = makeTestApp();
    const admin = await createVerifiedUser({
      app,
      authDependencies,
      email: 'notification.admin@example.test',
      role: 'ADMIN',
    });
    const member = await createVerifiedUser({
      app,
      authDependencies,
      email: 'notification.member@example.test',
      role: 'MEMBER',
    });

    const payload = {
      type: 'ACCOUNT_VERIFICATION',
      channel: 'EMAIL',
      userId: member.userId,
      templateKey: 'ACCOUNT_VERIFICATION',
      templateData: { name: 'Member', purpose: 'VERIFY' },
      sourceFeature: 'FE02',
      sourceEntityType: 'USER',
      sourceEntityId: member.userId,
      idempotencyKey: 'fe02-verify-member',
    };

    const createResponse = await request(app)
      .post('/api/notifications/requests')
      .set('Authorization', authHeader(admin.accessToken))
      .send(payload);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.notification).toMatchObject({
      type: 'ACCOUNT_VERIFICATION',
      status: 'PENDING',
      sourceFeature: 'FE02',
      idempotencyKey: 'fe02-verify-member',
    });

    const duplicateResponse = await request(app)
      .post('/api/notifications/requests')
      .set('Authorization', authHeader(admin.accessToken))
      .send(payload);

    expect(duplicateResponse.status).toBe(200);
    expect(duplicateResponse.body.duplicate).toBe(true);
    expect(notificationDependencies.state.notifications).toHaveLength(1);
  });

  test('rejects missing template variables and redacts password reset token data', async () => {
    const { app, authDependencies, notificationDependencies } = makeTestApp();
    const admin = await createVerifiedUser({
      app,
      authDependencies,
      email: 'notification.reset.admin@example.test',
      role: 'ADMIN',
    });

    const missingDataResponse = await request(app)
      .post('/api/notifications/requests')
      .set('Authorization', authHeader(admin.accessToken))
      .send({
        type: 'RESERVATION_AVAILABLE',
        recipientEmail: 'reader@example.test',
        templateKey: 'RESERVATION_READY',
        templateData: {},
      });

    expect(missingDataResponse.status).toBe(400);
    expect(missingDataResponse.body.error.code).toBe('TEMPLATE_DATA_MISSING');
    expect(notificationDependencies.state.notifications).toHaveLength(0);

    const resetResponse = await request(app)
      .post('/api/notifications/requests')
      .set('Authorization', authHeader(admin.accessToken))
      .send({
        type: 'PASSWORD_RESET',
        recipientEmail: 'reader@example.test',
        templateKey: 'PASSWORD_RESET',
        templateData: {
          resetLink: 'https://example.test/reset?token=secret-token',
          resetToken: 'secret-token',
        },
        sourceFeature: 'FE02',
      });

    expect(resetResponse.status).toBe(201);
    expect(resetResponse.body.notification.safePayload).toMatchObject({
      resetLink: '[REDACTED]',
      resetToken: '[REDACTED]',
    });
    expect(JSON.stringify(resetResponse.body)).not.toContain('secret-token');
  });

  test('processes pending notifications and records safe delivery failures', async () => {
    const { app, authDependencies, notificationDependencies } = makeTestApp();
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      email: 'notification.worker@example.test',
      role: 'LIBRARIAN',
    });

    await request(app)
      .post('/api/notifications/requests')
      .set('Authorization', authHeader(librarian.accessToken))
      .send({
        type: 'DUE_DATE_REMINDER',
        recipientEmail: 'ok@example.test',
        templateKey: 'DUE_DATE_REMINDER',
        templateData: { dueDate: '2026-06-24' },
        sourceFeature: 'FE07',
      })
      .expect(201);

    await request(app)
      .post('/api/notifications/requests')
      .set('Authorization', authHeader(librarian.accessToken))
      .send({
        type: 'FINE_NOTICE',
        recipientEmail: 'fail@example.test',
        templateKey: 'FINE_NOTICE',
        templateData: { amount: '5000' },
        sourceFeature: 'FE09',
      })
      .expect(201);

    const processResponse = await request(app)
      .post('/api/notifications/process-pending')
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ limit: 10 });

    expect(processResponse.status).toBe(200);
    expect(processResponse.body).toMatchObject({ processed: 1, failed: 1 });
    expect(notificationDependencies.state.notifications.map((notification) => notification.status)).toEqual([
      'SENT',
      'FAILED',
    ]);
    expect(notificationDependencies.state.attempts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: 'SENT' }),
        expect.objectContaining({
          status: 'FAILED',
          safeErrorMessage: 'Email provider unavailable.',
        }),
      ])
    );
    expect(JSON.stringify(notificationDependencies.state.attempts)).not.toContain('secret');
  });

  test('notification APIs are protected from public callers', async () => {
    const { app, authDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      email: 'notification.member.role@example.test',
      role: 'MEMBER',
    });

    await request(app)
      .post('/api/notifications/requests')
      .send({
        type: 'ACCOUNT_VERIFICATION',
        recipientEmail: 'reader@example.test',
        templateKey: 'ACCOUNT_VERIFICATION',
        templateData: { name: 'Reader', purpose: 'VERIFY' },
      })
      .expect(401);

    const memberResponse = await request(app)
      .post('/api/notifications/requests')
      .set('Authorization', authHeader(member.accessToken))
      .send({
        type: 'ACCOUNT_VERIFICATION',
        recipientEmail: 'reader@example.test',
        templateKey: 'ACCOUNT_VERIFICATION',
        templateData: { name: 'Reader', purpose: 'VERIFY' },
      });

    expect(memberResponse.status).toBe(403);
  });

  // FR-FE10-005, BR-FE10-002: unsupported type and non-EMAIL channel are rejected at the
  // request-validation layer (before the service), with no notification created.
  test('rejects unsupported notification type and channel', async () => {
    const { app, authDependencies, notificationDependencies } = makeTestApp();
    const admin = await createVerifiedUser({
      app,
      authDependencies,
      email: 'notif.unsupported.admin@example.test',
      role: 'ADMIN',
    });

    const badType = await request(app)
      .post('/api/notifications/requests')
      .set('Authorization', authHeader(admin.accessToken))
      .send({
        type: 'NOT_A_REAL_TYPE',
        recipientEmail: 'reader@example.test',
        templateKey: 'ACCOUNT_VERIFICATION',
        templateData: { name: 'Reader', purpose: 'VERIFY' },
      });
    expect(badType.status).toBe(400);
    expect(badType.body.error.code).toBe('VALIDATION_ERROR');

    const badChannel = await request(app)
      .post('/api/notifications/requests')
      .set('Authorization', authHeader(admin.accessToken))
      .send({
        type: 'ACCOUNT_VERIFICATION',
        channel: 'SMS',
        recipientEmail: 'reader@example.test',
        templateKey: 'ACCOUNT_VERIFICATION',
        templateData: { name: 'Reader', purpose: 'VERIFY' },
      });
    expect(badChannel.status).toBe(400);
    expect(badChannel.body.error.code).toBe('VALIDATION_ERROR');

    expect(notificationDependencies.state.notifications).toHaveLength(0);
  });

  // BR-FE10-010: a request whose template key does not exist is rejected.
  test('rejects an unknown template key', async () => {
    const { app, authDependencies } = makeTestApp();
    const admin = await createVerifiedUser({
      app,
      authDependencies,
      email: 'notif.template.admin@example.test',
      role: 'ADMIN',
    });

    const response = await request(app)
      .post('/api/notifications/requests')
      .set('Authorization', authHeader(admin.accessToken))
      .send({
        type: 'GENERAL_SYSTEM',
        recipientEmail: 'reader@example.test',
        templateKey: 'DOES_NOT_EXIST',
        templateData: {},
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('TEMPLATE_NOT_AVAILABLE');
  });

  // AC-FE10-006: a request with neither recipient userId nor email is rejected; a non-existent
  // recipient user returns not found.
  test('rejects request without a recipient and 404 for a non-existent recipient user', async () => {
    const { app, authDependencies } = makeTestApp();
    const admin = await createVerifiedUser({
      app,
      authDependencies,
      email: 'notif.recipient.admin@example.test',
      role: 'ADMIN',
    });

    const noRecipient = await request(app)
      .post('/api/notifications/requests')
      .set('Authorization', authHeader(admin.accessToken))
      .send({
        type: 'ACCOUNT_VERIFICATION',
        templateKey: 'ACCOUNT_VERIFICATION',
        templateData: { name: 'Reader', purpose: 'VERIFY' },
      });
    expect(noRecipient.status).toBe(400);
    expect(noRecipient.body.error.code).toBe('RECIPIENT_REQUIRED');

    const missingUser = await request(app)
      .post('/api/notifications/requests')
      .set('Authorization', authHeader(admin.accessToken))
      .send({
        type: 'ACCOUNT_VERIFICATION',
        userId: 999999,
        templateKey: 'ACCOUNT_VERIFICATION',
        templateData: { name: 'Reader', purpose: 'VERIFY' },
      });
    expect(missingUser.status).toBe(404);
    expect(missingUser.body.error.code).toBe('RECIPIENT_NOT_FOUND');
  });

  // AC-FE10-001 (userId path) + BR-FE10-013: resolve recipient by userId and write an audit entry.
  test('resolves recipient by userId and writes an audit log on create', async () => {
    const { app, authDependencies } = makeTestApp();
    const admin = await createVerifiedUser({
      app,
      authDependencies,
      email: 'notif.audit.admin@example.test',
      role: 'ADMIN',
    });
    const member = await createVerifiedUser({
      app,
      authDependencies,
      email: 'notif.audit.member@example.test',
      role: 'MEMBER',
    });

    const response = await request(app)
      .post('/api/notifications/requests')
      .set('Authorization', authHeader(admin.accessToken))
      .send({
        type: 'ACCOUNT_VERIFICATION',
        userId: member.userId,
        templateKey: 'ACCOUNT_VERIFICATION',
        templateData: { name: 'Member', purpose: 'VERIFY' },
      });

    expect(response.status).toBe(201);
    expect(response.body.notification).toMatchObject({
      userId: member.userId,
      recipientEmail: 'notif.audit.member@example.test',
      status: 'PENDING',
    });
    expect(authDependencies.state.auditLogs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'NOTIFICATION_REQUEST_CREATE' }),
      ])
    );
  });

  // BR-FE10-004: template data is sanitized so injected markup is not stored/rendered.
  test('sanitizes script content in template data', async () => {
    const { app, authDependencies } = makeTestApp();
    const admin = await createVerifiedUser({
      app,
      authDependencies,
      email: 'notif.xss.admin@example.test',
      role: 'ADMIN',
    });

    const response = await request(app)
      .post('/api/notifications/requests')
      .set('Authorization', authHeader(admin.accessToken))
      .send({
        type: 'ACCOUNT_VERIFICATION',
        recipientEmail: 'reader@example.test',
        templateKey: 'ACCOUNT_VERIFICATION',
        templateData: { name: '<script>alert(1)</script>Bob', purpose: 'VERIFY' },
      });

    expect(response.status).toBe(201);
    expect(response.body.notification.safePayload.name).not.toContain('<script>');
    expect(JSON.stringify(response.body)).not.toContain('<script>');
  });

  // FR-FE10-006/007: processing with no pending notifications is a safe no-op.
  test('process-pending with no pending notifications returns zero counts', async () => {
    const { app, authDependencies } = makeTestApp();
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      email: 'notif.empty.worker@example.test',
      role: 'LIBRARIAN',
    });

    const response = await request(app)
      .post('/api/notifications/process-pending')
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ limit: 10 });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ processed: 0, failed: 0 });
  });
});
