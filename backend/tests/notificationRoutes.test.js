const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

process.env.BCRYPT_COST = '4';
process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
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
  const emailProviderMessages = [];
  const authService = createAuthService(authDependencies);
  const notificationService = createNotificationService({
    notificationRepository: notificationDependencies.notificationRepository,
    userRepository: authDependencies.userRepository,
    auditLogRepository: authDependencies.auditLogRepository,
    emailProvider: {
      async send(message) {
        emailProviderMessages.push(message);

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

  return {
    app,
    authService,
    notificationService,
    authDependencies,
    notificationDependencies,
    emailProviderMessages,
  };
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
  test.each(['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'SKIPPED', 'CANCELLED'])(
    'replays one non-sensitive notification across the %s idempotency status',
    async (status) => {
      const { app, authDependencies, notificationDependencies, emailProviderMessages } = makeTestApp();
      const librarian = await createVerifiedUser({
        app,
        authDependencies,
        email: `notif.replay.${status.toLowerCase()}@example.test`,
        role: 'LIBRARIAN',
      });
      const payload = {
        type: 'DUE_DATE_REMINDER',
        recipientEmail: 'reader@example.test',
        templateKey: 'DUE_DATE_REMINDER',
        templateData: { dueDate: '2026-07-20' },
        idempotencyKey: `all-status-${status.toLowerCase()}`,
      };

      const created = await request(app)
        .post('/api/notifications/requests')
        .set('Authorization', authHeader(librarian.accessToken))
        .send(payload)
        .expect(201);
      notificationDependencies.state.notifications[0].status = status;

      const replay = await request(app)
        .post('/api/notifications/requests')
        .set('Authorization', authHeader(librarian.accessToken))
        .send(payload);

      expect(replay.status).toBe(200);
      expect(replay.body).toEqual({ notificationId: created.body.notificationId, status });
      expect(notificationDependencies.state.notifications).toHaveLength(1);
      expect(emailProviderMessages).toHaveLength(0);
    }
  );

  test('replays a failed sensitive notification through its HMAC key without another provider send', async () => {
    const { app, authDependencies, notificationDependencies, emailProviderMessages } = makeTestApp();
    const admin = await createVerifiedUser({
      app,
      authDependencies,
      email: 'notif.failed-sensitive.replay@example.test',
      role: 'ADMIN',
    });
    const payload = {
      type: 'ACCOUNT_VERIFICATION',
      recipientEmail: 'fail-sensitive-replay@example.test',
      templateKey: 'ACCOUNT_VERIFICATION',
      templateData: { name: 'Reader', verificationLink: 'https://example.test/verify/replay-secret' },
      idempotencyKey: 'sensitive-failed-replay',
    };

    const created = await request(app)
      .post('/api/notifications/requests')
      .set('Authorization', authHeader(admin.accessToken))
      .send(payload)
      .expect(201);
    expect(created.body.status).toBe('FAILED');

    const replay = await request(app)
      .post('/api/notifications/requests')
      .set('Authorization', authHeader(admin.accessToken))
      .send(payload);

    expect(replay.status).toBe(200);
    expect(replay.body).toEqual(created.body);
    expect(notificationDependencies.state.notifications).toHaveLength(1);
    expect(emailProviderMessages).toHaveLength(1);
    expect(notificationDependencies.state.notifications[0].idempotencyKey).toMatch(/^sensitive-hmac-sha256:/);
    expect(JSON.stringify(replay.body)).not.toContain(payload.idempotencyKey);
  });

  test('retries one failed non-sensitive record without sending, changing history, or exposing delivery data', async () => {
    const { app, authDependencies, notificationDependencies, emailProviderMessages } = makeTestApp();
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      email: 'notif.retry.librarian@example.test',
      role: 'LIBRARIAN',
    });
    const notification = {
      notificationId: 700,
      type: 'DUE_DATE_REMINDER',
      templateKey: 'DUE_DATE_REMINDER',
      recipientEmail: 'reader@example.test',
      status: 'FAILED',
      idempotencyKey: 'retry-kept-key',
      attemptCount: 2,
      lastErrorMessage: 'Notification delivery failed.',
    };
    notificationDependencies.state.notifications.push(notification);
    notificationDependencies.state.attempts.push(
      { notificationId: 700, status: 'FAILED', safeErrorMessage: 'Notification delivery failed.' },
      { notificationId: 700, status: 'FAILED', safeErrorMessage: 'Notification delivery failed.' }
    );

    const response = await request(app)
      .post('/api/notifications/700/retry')
      .set('Authorization', authHeader(librarian.accessToken));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ notificationId: 700, status: 'PENDING' });
    expect(Object.keys(response.body).sort()).toEqual(['notificationId', 'status']);
    expect(notificationDependencies.state.notifications[0]).toMatchObject({
      notificationId: 700,
      idempotencyKey: 'retry-kept-key',
      status: 'PENDING',
      attemptCount: 2,
      lastErrorMessage: null,
    });
    expect(notificationDependencies.state.attempts).toHaveLength(2);
    expect(emailProviderMessages).toHaveLength(0);
    expect(authDependencies.state.auditLogs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'NOTIFICATION_RETRY',
          userId: librarian.userId,
          targetId: 700,
          metadata: { fromStatus: 'FAILED', toStatus: 'PENDING' },
        }),
      ])
    );
  });

  test('rejects retry unless the stored record is a failed non-sensitive notification', async () => {
    const { app, authDependencies, notificationDependencies, emailProviderMessages } = makeTestApp();
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      email: 'notif.retry.conflicts@example.test',
      role: 'LIBRARIAN',
    });

    for (const [notificationId, status] of ['PENDING', 'SENT', 'DELIVERED', 'SKIPPED', 'CANCELLED'].entries()) {
      notificationDependencies.state.notifications.push({
        notificationId: 710 + notificationId,
        type: 'DUE_DATE_REMINDER',
        templateKey: 'DUE_DATE_REMINDER',
        recipientEmail: 'reader@example.test',
        status,
        attemptCount: 1,
      });
      const response = await request(app)
        .post(`/api/notifications/${710 + notificationId}/retry`)
        .set('Authorization', authHeader(librarian.accessToken));
      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        error: {
          code: 'NOTIFICATION_RETRY_NOT_ALLOWED',
          message: 'Only failed queued notifications can be retried.',
        },
      });
    }

    for (const [notificationId, type] of ['ACCOUNT_VERIFICATION', 'PASSWORD_RESET'].entries()) {
      notificationDependencies.state.notifications.push({
        notificationId: 720 + notificationId,
        type,
        templateKey: type,
        recipientEmail: 'reader@example.test',
        status: 'FAILED',
        attemptCount: 1,
      });
      const response = await request(app)
        .post(`/api/notifications/${720 + notificationId}/retry`)
        .set('Authorization', authHeader(librarian.accessToken));
      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        error: {
          code: 'REISSUE_REQUIRED',
          message: 'Create a new notification from the source event.',
        },
      });
    }

    notificationDependencies.state.notifications.push({
      notificationId: 730,
      type: null,
      templateKey: 'EMAIL_VERIFY',
      recipientEmail: 'reader@example.test',
      status: 'FAILED',
      attemptCount: 1,
    });
    const legacyResponse = await request(app)
      .post('/api/notifications/730/retry')
      .set('Authorization', authHeader(librarian.accessToken));
    expect(legacyResponse.status).toBe(409);
    expect(legacyResponse.body.error.code).toBe('REISSUE_REQUIRED');
    expect(emailProviderMessages).toHaveLength(0);
  });

  test('protects and validates the retry route before the controller', async () => {
    const { app, authDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      email: 'notif.retry.member@example.test',
      role: 'MEMBER',
    });
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      email: 'notif.retry.validation@example.test',
      role: 'LIBRARIAN',
    });

    await request(app).post('/api/notifications/1/retry').expect(401);
    await request(app)
      .post('/api/notifications/1/retry')
      .set('Authorization', authHeader(member.accessToken))
      .expect(403);

    for (const notificationId of ['abc', '0', '-1', '1.5', '2147483648']) {
      const response = await request(app)
        .post(`/api/notifications/${notificationId}/retry`)
        .set('Authorization', authHeader(librarian.accessToken));
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  test('documents the protected retry contract with safe response schemas', () => {
    const openapi = fs.readFileSync(path.join(__dirname, '../src/docs/openapi.yaml'), 'utf8');
    expect(openapi).toContain('/api/notifications/{id}/retry:');
    expect(openapi).toContain('name: id');
    expect(openapi).toContain('minimum: 1');
    expect(openapi).toContain('REISSUE_REQUIRED');
    expect(openapi).toContain('Create a new notification from the source event.');
  });

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
      type: 'DUE_DATE_REMINDER',
      channel: 'EMAIL',
      userId: member.userId,
      templateKey: 'DUE_DATE_REMINDER',
      templateData: {
        dueDate: '2026-07-20',
      },
      sourceFeature: 'FE07',
      sourceEntityType: 'BORROW_REQUEST',
      sourceEntityId: member.userId,
      idempotencyKey: 'fe07-due-date-member',
    };

    const createResponse = await request(app)
      .post('/api/notifications/requests')
      .set('Authorization', authHeader(admin.accessToken))
      .send(payload);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toEqual({
      notificationId: expect.any(Number),
      status: 'PENDING',
    });

    const duplicateResponse = await request(app)
      .post('/api/notifications/requests')
      .set('Authorization', authHeader(admin.accessToken))
      .send(payload);

    expect(duplicateResponse.status).toBe(200);
    expect(duplicateResponse.body).toEqual(createResponse.body);
    expect(notificationDependencies.state.notifications).toHaveLength(1);
  });

  test('rejects missing template variables and retains a fixed password reset payload summary', async () => {
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
    expect(resetResponse.body).toEqual({
      notificationId: expect.any(Number),
      status: 'SENT',
    });
    expect(notificationDependencies.state.notifications[0].safePayload).toEqual({ redacted: true });
    expect(JSON.stringify(resetResponse.body)).not.toContain('secret-token');
  });

  test('processes queued non-sensitive notifications and excludes sensitive pending fixtures', async () => {
    const { app, authDependencies, notificationDependencies, emailProviderMessages } = makeTestApp();
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

    notificationDependencies.state.notifications.push({
      notificationId: 999,
      type: 'ACCOUNT_VERIFICATION',
      recipientEmail: 'sensitive-pending@example.test',
      title: 'Sensitive rendered title',
      body: 'Verification link: https://example.test/verify/pending-link',
      status: 'PENDING',
      attemptCount: 0,
      safePayload: { verificationLink: '[REDACTED]' },
    });

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
    expect(processResponse.body).toEqual({ processed: 1, failed: 1 });
    expect(notificationDependencies.state.notifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'DUE_DATE_REMINDER', status: 'SENT' }),
        expect.objectContaining({ type: 'FINE_NOTICE', status: 'FAILED' }),
        expect.objectContaining({ type: 'ACCOUNT_VERIFICATION', status: 'PENDING' }),
      ])
    );
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
    expect(JSON.stringify(emailProviderMessages)).not.toContain('https://example.test/verify/pending-link');
  });

  test('excludes null-type legacy auth templates while processing null-type non-sensitive rows', async () => {
    const { app, authDependencies, notificationDependencies, emailProviderMessages } = makeTestApp();
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      email: 'notification.legacy-worker@example.test',
      role: 'LIBRARIAN',
    });

    notificationDependencies.state.notifications.push(
      {
        notificationId: 991,
        type: null,
        templateKey: 'PASSWORD_RESET',
        recipientEmail: 'legacy-reset@example.test',
        title: 'Reset password',
        body: 'Reset link: https://example.test/reset/legacy-secret',
        status: 'PENDING',
        attemptCount: 0,
      },
      {
        notificationId: 992,
        type: null,
        templateKey: 'ACCOUNT_VERIFICATION',
        recipientEmail: 'legacy-verify@example.test',
        title: 'Verify account',
        body: 'Verification link: https://example.test/verify/legacy-secret',
        status: 'PENDING',
        attemptCount: 0,
      },
      {
        notificationId: 993,
        type: null,
        templateKey: 'EMAIL_VERIFY',
        recipientEmail: 'legacy-email-verify@example.test',
        title: 'Legacy verify',
        body: 'Verification link: https://example.test/verify/legacy-email-secret',
        status: 'PENDING',
        attemptCount: 0,
      },
      {
        notificationId: 994,
        type: null,
        templateKey: 'DUE_DATE_REMINDER',
        recipientEmail: 'legacy-due-date@example.test',
        title: 'Due date reminder',
        body: 'Due date: 2026-07-20',
        status: 'PENDING',
        attemptCount: 0,
      }
    );

    const response = await request(app)
      .post('/api/notifications/process-pending')
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ limit: 10 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ processed: 1, failed: 0 });
    expect(emailProviderMessages).toEqual([
      expect.objectContaining({ to: 'legacy-due-date@example.test' }),
    ]);
    expect(notificationDependencies.state.notifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ notificationId: 991, status: 'PENDING' }),
        expect.objectContaining({ notificationId: 992, status: 'PENDING' }),
        expect.objectContaining({ notificationId: 993, status: 'PENDING' }),
        expect.objectContaining({ notificationId: 994, status: 'SENT' }),
      ])
    );
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

  // FE10-H04: source references remain positive JSON integers without coercing strings.
  test('accepts only positive JSON integer sourceEntityId values', async () => {
    const { app, authDependencies, notificationDependencies } = makeTestApp();
    const admin = await createVerifiedUser({
      app,
      authDependencies,
      email: 'notif.source-id.admin@example.test',
      role: 'ADMIN',
    });

    for (const sourceEntityId of [null, '42', 42.5, 0, -1]) {
      const response = await request(app)
        .post('/api/notifications/requests')
        .set('Authorization', authHeader(admin.accessToken))
        .send({
          type: 'DUE_DATE_REMINDER',
          recipientEmail: 'reader@example.test',
          templateKey: 'DUE_DATE_REMINDER',
          templateData: { dueDate: '2026-07-20' },
          sourceEntityId,
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request.',
          details: [
            {
              field: 'sourceEntityId',
              message: 'Source entity ID must be a positive integer.',
            },
          ],
        },
      });
    }

    expect(notificationDependencies.state.notifications).toHaveLength(0);

    const validResponse = await request(app)
      .post('/api/notifications/requests')
      .set('Authorization', authHeader(admin.accessToken))
      .send({
        type: 'DUE_DATE_REMINDER',
        recipientEmail: 'reader@example.test',
        templateKey: 'DUE_DATE_REMINDER',
        templateData: { dueDate: '2026-07-20' },
        sourceEntityId: 42,
      });

    expect(validResponse.status).toBe(201);
    expect(validResponse.body).toEqual({
      notificationId: expect.any(Number),
      status: 'PENDING',
    });
    expect(notificationDependencies.state.notifications[0].sourceEntityId).toBe(42);
  });

  // BR-FE10-002: a template key outside the canonical pair is rejected before lookup.
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
    expect(response.body.error.code).toBe('CANONICAL_TEMPLATE_MISMATCH');
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
    const { app, authDependencies, notificationDependencies } = makeTestApp();
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
        templateData: {
          name: 'Member',
          purpose: 'VERIFY',
          verificationLink: 'https://example.test/verify/member',
        },
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      notificationId: expect.any(Number),
      status: 'SENT',
    });
    expect(notificationDependencies.state.notifications[0]).toMatchObject({
      userId: member.userId,
      recipientEmail: 'notif.audit.member@example.test',
      status: 'SENT',
    });
    expect(authDependencies.state.auditLogs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'NOTIFICATION_REQUEST_CREATE' }),
      ])
    );
  });

  // BR-FE10-004: template data is sanitized so injected markup is not stored/rendered.
  test('sanitizes script content in template data', async () => {
    const { app, authDependencies, notificationDependencies } = makeTestApp();
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
        type: 'FINE_NOTICE',
        recipientEmail: 'reader@example.test',
        templateKey: 'FINE_NOTICE',
        templateData: {
          amount: '<script>alert(1)</script>5000',
        },
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      notificationId: expect.any(Number),
      status: 'PENDING',
    });
    expect(notificationDependencies.state.notifications[0].safePayload.amount).not.toContain('<script>');
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
    expect(response.body).toEqual({ processed: 0, failed: 0 });
  });

  // BR-FE10-002, BR-FE10-007: every supported type has exactly one approved template.
  test.each([
    [
      'ACCOUNT_VERIFICATION',
      'ACCOUNT_VERIFICATION',
      { name: 'Reader', verificationLink: 'https://example.test/verify' },
    ],
    ['PASSWORD_RESET', 'PASSWORD_RESET', { resetLink: 'https://example.test/reset' }],
    ['RESERVATION_AVAILABLE', 'RESERVATION_READY', { copyId: 'COPY-001' }],
    ['DUE_DATE_REMINDER', 'DUE_DATE_REMINDER', { dueDate: '2026-07-20' }],
    ['OVERDUE_NOTICE', 'OVERDUE_NOTICE', { dueDate: '2026-07-01' }],
    ['FINE_NOTICE', 'FINE_NOTICE', { amount: '5000' }],
    ['GENERAL_SYSTEM', 'MEMBERSHIP_RESULT', { membershipStatus: 'APPROVED' }],
  ])('accepts the canonical %s -> %s pair', async (type, templateKey, templateData) => {
    const { app, authDependencies, notificationDependencies } = makeTestApp();
    const admin = await createVerifiedUser({
      app,
      authDependencies,
      email: `notif.canonical.${type.toLowerCase()}@example.test`,
      role: 'ADMIN',
    });

    const response = await request(app)
      .post('/api/notifications/requests')
      .set('Authorization', authHeader(admin.accessToken))
      .send({
        type,
        recipientEmail: 'reader@example.test',
        templateKey,
        templateData,
      });

    expect(response.status).toBe(201);
    expect(notificationDependencies.state.notifications).toHaveLength(1);
  });

  // FE10-H03, AC-FE10-001/002/007: sensitive auth content is rendered only for the
  // immediate provider call and never crosses a persistence, audit, or HTTP boundary.
  test.each([
    [
      'ACCOUNT_VERIFICATION',
      'ACCOUNT_VERIFICATION',
      'verify@example.test',
      { name: 'Reader', verificationLink: 'https://example.test/verify/sensitive-link' },
      'Verify Reader',
      'Verification link: https://example.test/verify/sensitive-link',
      'https://example.test/verify/sensitive-link',
    ],
    [
      'PASSWORD_RESET',
      'PASSWORD_RESET',
      'reset@example.test',
      { resetLink: 'https://example.test/reset/sensitive-link' },
      'Reset password',
      'Use this safe reset link: https://example.test/reset/sensitive-link',
      'https://example.test/reset/sensitive-link',
    ],
  ])(
    'sends %s synchronously without persisting or returning its rendered sensitive content',
    async (type, templateKey, recipientEmail, templateData, renderedSubject, renderedBody, rawLink) => {
      const { app, authDependencies, notificationDependencies, emailProviderMessages } = makeTestApp();
      const admin = await createVerifiedUser({
        app,
        authDependencies,
        email: `notif.sensitive.${type.toLowerCase()}@example.test`,
        role: 'ADMIN',
      });

      const response = await request(app)
        .post('/api/notifications/requests')
        .set('Authorization', authHeader(admin.accessToken))
        .send({ type, recipientEmail, templateKey, templateData, sourceFeature: 'FE02' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        notificationId: expect.any(Number),
        status: 'SENT',
      });
      expect(emailProviderMessages).toEqual([
        expect.objectContaining({ to: recipientEmail, subject: renderedSubject, body: renderedBody }),
      ]);

      const notification = notificationDependencies.state.notifications[0];
      expect(notification).toMatchObject({ status: 'SENT', title: null, body: null });
      expect(notification.safePayload).toEqual({ redacted: true });
      expect(notification).toMatchObject({ sourceFeature: null, sourceEntityType: null });
      expect(notificationDependencies.state.attempts).toEqual([
        expect.objectContaining({ status: 'SENT', providerMessageId: null }),
      ]);

      const persistedAndExposed = JSON.stringify({
        response: response.body,
        notification,
        attempts: notificationDependencies.state.attempts,
        auditLogs: authDependencies.state.auditLogs,
      });
      expect(persistedAndExposed).not.toContain(rawLink);
      expect(persistedAndExposed).not.toContain(renderedSubject);
      expect(persistedAndExposed).not.toContain(renderedBody);
    }
  );

  // FE10-H03, AC-FE10-001/002/009: provider failures leave one safe failed record and
  // attempt while retaining the accepted 201 response.
  test.each([
    [
      'ACCOUNT_VERIFICATION',
      'ACCOUNT_VERIFICATION',
      { name: 'Reader', verificationLink: 'https://example.test/verify/failed-link' },
      'Verify Reader',
      'Verification link: https://example.test/verify/failed-link',
      'https://example.test/verify/failed-link',
    ],
    [
      'PASSWORD_RESET',
      'PASSWORD_RESET',
      { resetLink: 'https://example.test/reset/failed-link' },
      'Reset password',
      'Use this safe reset link: https://example.test/reset/failed-link',
      'https://example.test/reset/failed-link',
    ],
  ])(
    'records a safe synchronous failure for %s without leaking provider or rendered content',
    async (type, templateKey, templateData, renderedSubject, renderedBody, rawLink) => {
      const { app, authDependencies, notificationDependencies, emailProviderMessages } = makeTestApp();
      const admin = await createVerifiedUser({
        app,
        authDependencies,
        email: `notif.sensitive.failure.${type.toLowerCase()}@example.test`,
        role: 'ADMIN',
      });

      const response = await request(app)
        .post('/api/notifications/requests')
        .set('Authorization', authHeader(admin.accessToken))
        .send({
          type,
          recipientEmail: `fail-${type.toLowerCase()}@example.test`,
          templateKey,
          templateData,
          sourceFeature: 'FE02',
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        notificationId: expect.any(Number),
        status: 'FAILED',
      });
      expect(emailProviderMessages).toEqual([
        expect.objectContaining({ subject: renderedSubject, body: renderedBody }),
      ]);

      const notification = notificationDependencies.state.notifications[0];
      expect(notification).toMatchObject({
        status: 'FAILED',
        title: null,
        body: null,
        lastErrorMessage: 'Notification delivery failed.',
      });
      expect(notificationDependencies.state.attempts).toEqual([
        expect.objectContaining({ status: 'FAILED', safeErrorMessage: 'Notification delivery failed.' }),
      ]);

      const persistedAndExposed = JSON.stringify({
        response: response.body,
        notification,
        attempts: notificationDependencies.state.attempts,
        auditLogs: authDependencies.state.auditLogs,
      });
      expect(persistedAndExposed).not.toContain(rawLink);
      expect(persistedAndExposed).not.toContain(renderedSubject);
      expect(persistedAndExposed).not.toContain(renderedBody);
      expect(persistedAndExposed).not.toContain('smtp auth token secret stack trace');
    }
  );

  test.each([
    [
      'ACCOUNT_VERIFICATION',
      'ACCOUNT_VERIFICATION',
      'reader@example.test',
      { name: 'Reader', verificationLink: 'https://example.test/verify/audit-write-secret' },
      'SENT',
    ],
    [
      'PASSWORD_RESET',
      'PASSWORD_RESET',
      'fail-audit@example.test',
      { resetLink: 'https://example.test/reset/audit-write-secret' },
      'FAILED',
    ],
  ])(
    'preserves accepted %s delivery when its post-delivery audit write fails safely',
    async (type, templateKey, recipientEmail, templateData, expectedStatus) => {
      const { app, authDependencies, notificationDependencies, emailProviderMessages } = makeTestApp();
      const admin = await createVerifiedUser({
        app,
        authDependencies,
        email: `notif.sensitive.audit.${type.toLowerCase()}@example.test`,
        role: 'ADMIN',
      });
      const rawLink = Object.values(templateData)[Object.values(templateData).length - 1];
      const auditError = `audit write failed with sensitive data: ${rawLink}`;
      authDependencies.auditLogRepository.create = async () => {
        throw new Error(auditError);
      };

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      let response;
      let capturedLogs;

      try {
        response = await request(app)
          .post('/api/notifications/requests')
          .set('Authorization', authHeader(admin.accessToken))
          .send({ type, recipientEmail, templateKey, templateData });
      } finally {
        capturedLogs = consoleErrorSpy.mock.calls.map((call) => [...call]);
        consoleErrorSpy.mockRestore();
      }

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        notificationId: expect.any(Number),
        status: expectedStatus,
      });
      expect(emailProviderMessages).toHaveLength(1);
      expect(notificationDependencies.state.notifications[0]).toMatchObject({
        status: expectedStatus,
        title: null,
        body: null,
      });
      expect(notificationDependencies.state.attempts).toEqual([
        expect.objectContaining({ status: expectedStatus }),
      ]);

      const fallbackMetadata = capturedLogs.flat().find(
        (value) => value?.code === 'NOTIFICATION_AUDIT_WRITE_FAILED'
      );
      expect(fallbackMetadata).toEqual({
        code: 'NOTIFICATION_AUDIT_WRITE_FAILED',
        message: 'Notification audit record could not be written.',
      });
      expect(fallbackMetadata.stack).toBeUndefined();
      const loggedOutput = capturedLogs
        .flat()
        .map((value) => (value instanceof Error ? `${value.message} ${value.stack}` : JSON.stringify(value)))
        .join(' ');
      expect(loggedOutput).not.toContain(auditError);
      expect(loggedOutput).not.toContain(rawLink);
    }
  );

  // FE10-H03 follow-up: sensitive caller metadata is replaced with a fixed summary and a
  // keyed idempotency representation, while raw template data remains provider-only.
  test('contains sensitive caller metadata and HMAC idempotency data while replaying once', async () => {
    const { app, authDependencies, notificationDependencies, emailProviderMessages } = makeTestApp();
    const admin = await createVerifiedUser({
      app,
      authDependencies,
      email: 'notif.sensitive.idempotency@example.test',
      role: 'ADMIN',
    });
    const rawLink = 'https://example.test/verify/replay-link';
    const rawSourceFeature = 'OTP-482913-source';
    const rawSourceEntityType = 'reset-token-482913';
    const rawIdempotencyKey = '123456';
    const payload = {
      type: 'ACCOUNT_VERIFICATION',
      recipientEmail: 'reader@example.test',
      templateKey: 'ACCOUNT_VERIFICATION',
      templateData: {
        name: 'Reader',
        verificationLink: rawLink,
        [rawLink]: 'caller-controlled-value',
      },
      sourceFeature: rawSourceFeature,
      sourceEntityType: rawSourceEntityType,
      sourceEntityId: 91,
      idempotencyKey: rawIdempotencyKey,
    };

    const createResponse = await request(app)
      .post('/api/notifications/requests')
      .set('Authorization', authHeader(admin.accessToken))
      .send(payload);
    const replayResponse = await request(app)
      .post('/api/notifications/requests')
      .set('Authorization', authHeader(admin.accessToken))
      .send(payload);

    expect(createResponse.status).toBe(201);
    expect(replayResponse.status).toBe(200);
    expect(createResponse.body).toEqual({
      notificationId: expect.any(Number),
      status: 'SENT',
    });
    expect(replayResponse.body).toEqual(createResponse.body);
    expect(emailProviderMessages).toHaveLength(1);
    expect(emailProviderMessages[0].body).toContain(rawLink);

    const notification = notificationDependencies.state.notifications[0];
    expect(notification).toMatchObject({
      templateKey: 'ACCOUNT_VERIFICATION',
      sourceFeature: null,
      sourceEntityType: null,
      sourceEntityId: 91,
      idempotencyKey: expect.stringMatching(/^sensitive-hmac-sha256:[a-f0-9]{64}$/),
      safePayload: { redacted: true },
    });
    expect(notification.idempotencyKey).not.toBe(rawIdempotencyKey);
    expect(notification.idempotencyKey).toBe(
      `sensitive-hmac-sha256:${crypto
        .createHmac('sha256', process.env.JWT_SECRET)
        .update(rawIdempotencyKey)
        .digest('hex')}`
    );
    expect(notification.idempotencyKey).not.toBe(
      `sensitive-hmac-sha256:${crypto.createHash('sha256').update(rawIdempotencyKey).digest('hex')}`
    );

    const persistedAndExposed = JSON.stringify({
      createResponse: createResponse.body,
      replayResponse: replayResponse.body,
      notification,
      attempts: notificationDependencies.state.attempts,
      auditLogs: authDependencies.state.auditLogs,
    });
    expect(persistedAndExposed).not.toContain(rawLink);
    expect(persistedAndExposed).not.toContain(rawIdempotencyKey);
    expect(persistedAndExposed).not.toContain(rawSourceFeature);
    expect(persistedAndExposed).not.toContain(rawSourceEntityType);
  });

  // FE10-H03 follow-up: a persistence transition failure is not a provider failure and must
  // be replaced before it reaches error-handler logging.
  test('contains sensitive markSent failures without recording a false provider failure', async () => {
    const { app, authDependencies, notificationDependencies } = makeTestApp();
    const admin = await createVerifiedUser({
      app,
      authDependencies,
      email: 'notif.sensitive.transition@example.test',
      role: 'ADMIN',
    });
    let markFailedCalled = false;
    const rawLink = 'https://example.test/reset/transition-link';
    const repositoryError = `notification transition storage failed: ${rawLink}`;
    notificationDependencies.notificationRepository.markSent = async () => {
      throw new Error(repositoryError);
    };
    notificationDependencies.notificationRepository.markFailed = async () => {
      markFailedCalled = true;
      throw new Error('markFailed must not run');
    };

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let response;
    let capturedLogs;

    try {
      response = await request(app)
        .post('/api/notifications/requests')
        .set('Authorization', authHeader(admin.accessToken))
        .send({
          type: 'PASSWORD_RESET',
          recipientEmail: 'reader@example.test',
          templateKey: 'PASSWORD_RESET',
          templateData: { resetLink: rawLink },
          sourceFeature: 'FE02',
        });
    } finally {
      capturedLogs = consoleErrorSpy.mock.calls.map((call) => [...call]);
      consoleErrorSpy.mockRestore();
    }

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: {
        code: 'NOTIFICATION_DELIVERY_TRANSITION_FAILED',
        message: 'Internal server error.',
      },
    });
    expect(markFailedCalled).toBe(false);
    expect(notificationDependencies.state.notifications[0]).toMatchObject({ status: 'PENDING' });
    expect(notificationDependencies.state.attempts).toEqual([]);
    expect(capturedLogs).toEqual([
      expect.arrayContaining([
        '[api error]',
        expect.objectContaining({
          code: 'NOTIFICATION_DELIVERY_TRANSITION_FAILED',
          message: 'Notification delivery state could not be recorded.',
          stack: undefined,
        }),
      ]),
    ]);
    const safeBoundaries = JSON.stringify({
      response: response.body,
      notification: notificationDependencies.state.notifications[0],
      attempts: notificationDependencies.state.attempts,
      capturedLogs,
    });
    expect(safeBoundaries).not.toContain(repositoryError);
    expect(safeBoundaries).not.toContain(rawLink);
  });

  // FE10-H03: a provider failure remains distinct from a subsequent failed-state persistence error.
  test('contains a sensitive markFailed persistence failure without recording a false attempt', async () => {
    const { app, authDependencies, notificationDependencies } = makeTestApp();
    const admin = await createVerifiedUser({
      app,
      authDependencies,
      email: 'notif.sensitive.failed-transition@example.test',
      role: 'ADMIN',
    });
    const rawLink = 'https://example.test/reset/failed-transition-link';
    const repositoryError = `failed notification transition storage: ${rawLink}`;
    let markFailedCalled = false;
    notificationDependencies.notificationRepository.markFailed = async () => {
      markFailedCalled = true;
      throw new Error(repositoryError);
    };

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let response;
    let capturedLogs;

    try {
      response = await request(app)
        .post('/api/notifications/requests')
        .set('Authorization', authHeader(admin.accessToken))
        .send({
          type: 'PASSWORD_RESET',
          recipientEmail: 'fail-mark-failed@example.test',
          templateKey: 'PASSWORD_RESET',
          templateData: { resetLink: rawLink },
        });
    } finally {
      capturedLogs = consoleErrorSpy.mock.calls.map((call) => [...call]);
      consoleErrorSpy.mockRestore();
    }

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: {
        code: 'NOTIFICATION_DELIVERY_FAILURE_TRANSITION_FAILED',
        message: 'Internal server error.',
      },
    });
    expect(markFailedCalled).toBe(true);
    expect(notificationDependencies.state.notifications[0]).toMatchObject({ status: 'PENDING' });
    expect(notificationDependencies.state.attempts).toEqual([]);
    expect(capturedLogs).toEqual([
      expect.arrayContaining([
        '[api error]',
        expect.objectContaining({
          code: 'NOTIFICATION_DELIVERY_FAILURE_TRANSITION_FAILED',
          message: 'Notification delivery failure could not be recorded.',
          stack: undefined,
        }),
      ]),
    ]);
    const safeBoundaries = JSON.stringify({
      response: response.body,
      notification: notificationDependencies.state.notifications[0],
      attempts: notificationDependencies.state.attempts,
      capturedLogs,
    });
    expect(safeBoundaries).not.toContain(repositoryError);
    expect(safeBoundaries).not.toContain(rawLink);
  });

  test('contains missing JWT_SECRET failures before sensitive notification side effects', async () => {
    const { app, authService, authDependencies, notificationDependencies, emailProviderMessages } =
      makeTestApp();
    const admin = await createVerifiedUser({
      app,
      authDependencies,
      email: 'notif.sensitive.config@example.test',
      role: 'ADMIN',
    });
    const rawLink = 'https://example.test/verify/config-link';
    const rawIdempotencyKey = 'config-secret-123456';
    const originalJwtSecret = process.env.JWT_SECRET;
    const auditLogCount = authDependencies.state.auditLogs.length;

    // Keep the already-authenticated test actor available while exercising FE10 with no JWT secret.
    authService.authenticateToken = async () => ({ userId: admin.userId, roles: ['ADMIN'] });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let response;
    let capturedLogs;

    try {
      delete process.env.JWT_SECRET;
      response = await request(app)
        .post('/api/notifications/requests')
        .set('Authorization', authHeader(admin.accessToken))
        .send({
          type: 'ACCOUNT_VERIFICATION',
          recipientEmail: 'reader@example.test',
          templateKey: 'ACCOUNT_VERIFICATION',
          templateData: { name: 'Reader', verificationLink: rawLink },
          idempotencyKey: rawIdempotencyKey,
        });
    } finally {
      capturedLogs = consoleErrorSpy.mock.calls.map((call) => [...call]);
      if (originalJwtSecret === undefined) {
        delete process.env.JWT_SECRET;
      } else {
        process.env.JWT_SECRET = originalJwtSecret;
      }
      consoleErrorSpy.mockRestore();
    }

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: { code: 'NOTIFICATION_CONFIG_ERROR', message: 'Internal server error.' },
    });
    expect(notificationDependencies.state.notifications).toEqual([]);
    expect(notificationDependencies.state.attempts).toEqual([]);
    expect(emailProviderMessages).toEqual([]);
    expect(authDependencies.state.auditLogs).toHaveLength(auditLogCount);
    expect(capturedLogs).toEqual([
      expect.arrayContaining([
        '[api error]',
        expect.objectContaining({
          code: 'NOTIFICATION_CONFIG_ERROR',
          message: 'Notification configuration is incomplete.',
          stack: undefined,
        }),
      ]),
    ]);
    const safeBoundaries = JSON.stringify({ response: response.body, capturedLogs });
    expect(safeBoundaries).not.toContain(rawLink);
    expect(safeBoundaries).not.toContain(rawIdempotencyKey);
  });

  // EC-FE10-004: a valid but non-canonical template must not reach persistence.
  test('rejects a mismatched canonical pair before persistence', async () => {
    const { app, authDependencies, notificationDependencies } = makeTestApp();
    const admin = await createVerifiedUser({
      app,
      authDependencies,
      email: 'notif.mismatch.admin@example.test',
      role: 'ADMIN',
    });

    const response = await request(app)
      .post('/api/notifications/requests')
      .set('Authorization', authHeader(admin.accessToken))
      .send({
        type: 'FINE_NOTICE',
        recipientEmail: 'reader@example.test',
        templateKey: 'DUE_DATE_REMINDER',
        templateData: { dueDate: '2026-07-20' },
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('CANONICAL_TEMPLATE_MISMATCH');
    expect(notificationDependencies.state.notifications).toHaveLength(0);
  });

  // BR-FE10-004: queued payload validation traverses every nested object and array.
  test.each([
    ['OTP', { schedule: [{ reminder: { OTP: 'test-otp' } }] }],
    ['reset_token', { schedule: [{ reminder: { reset_token: 'test-reset-token' } }] }],
    ['verification-link', { schedule: [{ reminder: { 'verification-link': 'test-verify-link' } }] }],
    ['user password', { schedule: [{ reminder: { 'user password': 'test-password' } }] }],
    ['reset link', { schedule: [{ reminder: { 'reset link': 'test-reset-link' } }] }],
  ])('rejects nested queued template data containing %s before persistence', async (_, templateData) => {
    const { app, authDependencies, notificationDependencies } = makeTestApp();
    const admin = await createVerifiedUser({
      app,
      authDependencies,
      email: 'notif.queued.admin@example.test',
      role: 'ADMIN',
    });

    const response = await request(app)
      .post('/api/notifications/requests')
      .set('Authorization', authHeader(admin.accessToken))
      .send({
        type: 'DUE_DATE_REMINDER',
        recipientEmail: 'reader@example.test',
        templateKey: 'DUE_DATE_REMINDER',
        templateData: { dueDate: '2026-07-20', ...templateData },
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('SENSITIVE_TEMPLATE_DATA');
    expect(notificationDependencies.state.notifications).toHaveLength(0);
  });

  // FE10-H03: sensitive requests retain a fixed safe payload summary, not caller-controlled shape.
  test('stores only the fixed safe payload summary for nested sensitive request data', async () => {
    const { app, authDependencies, notificationDependencies } = makeTestApp();
    const admin = await createVerifiedUser({
      app,
      authDependencies,
      email: 'notif.redaction.admin@example.test',
      role: 'ADMIN',
    });

    const response = await request(app)
      .post('/api/notifications/requests')
      .set('Authorization', authHeader(admin.accessToken))
      .send({
        type: 'PASSWORD_RESET',
        recipientEmail: 'reader@example.test',
        templateKey: 'PASSWORD_RESET',
        templateData: {
          resetLink: 'https://example.test/reset',
          context: [
            {
              'verification-link': 'test-verify-link',
              details: {
                reset_token: 'test-reset-token',
                'user password': 'test-password',
              },
            },
          ],
        },
      });

    expect(response.status).toBe(201);
    expect(notificationDependencies.state.notifications[0].safePayload).toEqual({ redacted: true });
  });

  function makeInternalRequestInput(overrides = {}) {
    return {
      type: 'DUE_DATE_REMINDER',
      recipientEmail: 'reader@example.test',
      templateKey: 'DUE_DATE_REMINDER',
      templateData: { dueDate: '2026-07-20' },
      ...overrides,
    };
  }

  // FE10-H05, BR-FE10-011: an in-process caller must bind one trusted source up front.
  test('rejects an unallowlisted source requester without side effects', () => {
    const { notificationService, notificationDependencies, authDependencies } = makeTestApp();

    expect(() => notificationService.createSourceNotificationRequester('FE99')).toThrow(
      expect.objectContaining({
        code: 'SOURCE_REQUESTER_NOT_ALLOWED',
        message: 'Notification source is not allowed.',
      })
    );
    expect(notificationDependencies.state.notifications).toHaveLength(0);
    expect(authDependencies.state.auditLogs).toHaveLength(0);
  });

  // FE10-H05, NFR-FE10-SEC-006: payloads cannot replace a construction-bound source.
  test('rejects an internal sourceFeature override before persistence', async () => {
    const { notificationService, notificationDependencies, authDependencies } = makeTestApp();
    const requester = notificationService.createSourceNotificationRequester('FE07');

    await expect(
      requester.createNotificationRequest({
        type: 'DUE_DATE_REMINDER',
        recipientEmail: 'reader@example.test',
        templateKey: 'DUE_DATE_REMINDER',
        templateData: { dueDate: '2026-07-20' },
        sourceFeature: 'FE07',
      })
    ).rejects.toMatchObject({
      code: 'SOURCE_FEATURE_OVERRIDE',
      message: 'Notification source cannot be overridden.',
    });

    expect(notificationDependencies.state.notifications).toHaveLength(0);
    expect(authDependencies.state.auditLogs).toHaveLength(0);
  });

  // FE10-H05, FR-FE10-004: internal non-sensitive events use the shared queued policy and
  // project only the public summary while recording the bound source in a null-user audit.
  test('queues and replays a bound FE07 request with a null-user source audit', async () => {
    const { notificationService, notificationDependencies, authDependencies } = makeTestApp();
    const requester = notificationService.createSourceNotificationRequester(' fe07 ');
    const input = {
      type: 'DUE_DATE_REMINDER',
      recipientEmail: 'reader@example.test',
      templateKey: 'DUE_DATE_REMINDER',
      templateData: { dueDate: '2026-07-20' },
      sourceEntityType: '  BORROW_DETAIL  ',
      sourceEntityId: 42,
      idempotencyKey: 'fe07-bound-source-replay',
    };

    const created = await requester.createNotificationRequest(input, { userId: 777, ip: '127.0.0.1' });
    const replayed = await requester.createNotificationRequest(input, { userId: 888, ip: '127.0.0.1' });

    expect(created).toEqual({ notificationId: expect.any(Number), status: 'PENDING' });
    expect(replayed).toEqual(created);
    expect(notificationDependencies.state.notifications).toEqual([
      expect.objectContaining({
        sourceFeature: 'FE07',
        sourceEntityType: 'BORROW_DETAIL',
        sourceEntityId: 42,
        status: 'PENDING',
      }),
    ]);
    expect(authDependencies.state.auditLogs).toEqual([
      expect.objectContaining({
        userId: null,
        action: 'NOTIFICATION_REQUEST_CREATE',
        targetId: created.notificationId,
        metadata: expect.objectContaining({
          sourceFeature: 'FE07',
          sourceEntityType: 'BORROW_DETAIL',
          sourceEntityId: 42,
        }),
      }),
    ]);
  });

  // FE10-H05, FR-FE10-005: bypassing express-validator retains the shared policy checks.
  test.each([
    [
      'canonical template mismatch',
      {
        type: 'DUE_DATE_REMINDER',
        recipientEmail: 'reader@example.test',
        templateKey: 'FINE_NOTICE',
        templateData: { dueDate: '2026-07-20' },
      },
      'CANONICAL_TEMPLATE_MISMATCH',
    ],
    [
      'nested secret-like queued data',
      {
        type: 'DUE_DATE_REMINDER',
        recipientEmail: 'reader@example.test',
        templateKey: 'DUE_DATE_REMINDER',
        templateData: { dueDate: '2026-07-20', nested: { reset_token: 'secret' } },
      },
      'SENSITIVE_TEMPLATE_DATA',
    ],
  ])('rejects internal %s before persistence', async (_, input, code) => {
    const {
      notificationService,
      notificationDependencies,
      authDependencies,
      emailProviderMessages,
    } = makeTestApp();
    const requester = notificationService.createSourceNotificationRequester('FE07');

    await expect(requester.createNotificationRequest(input)).rejects.toMatchObject({ code });
    expect(notificationDependencies.state.notifications).toHaveLength(0);
    expect(authDependencies.state.auditLogs).toHaveLength(0);
    expect(emailProviderMessages).toHaveLength(0);
  });

  // FE10-H05 P1: the in-process requester must enforce every remaining HTTP-shape boundary
  // before the shared notification pipeline can read, persist, audit, or deliver the request.
  test.each([
    [
      'null input',
      null,
      'INVALID_NOTIFICATION_REQUEST',
      'Notification request must be an object.',
    ],
    [
      'array input',
      [],
      'INVALID_NOTIFICATION_REQUEST',
      'Notification request must be an object.',
    ],
    [
      'string input',
      'request',
      'INVALID_NOTIFICATION_REQUEST',
      'Notification request must be an object.',
    ],
    [
      'non-string type',
      makeInternalRequestInput({ type: 42 }),
      'INVALID_NOTIFICATION_TYPE',
      'Notification type must be a supported string.',
    ],
    [
      'unsupported type',
      makeInternalRequestInput({ type: 'NOT_SUPPORTED' }),
      'UNSUPPORTED_NOTIFICATION_TYPE',
      'Notification type is not supported.',
    ],
    [
      'non-string channel',
      makeInternalRequestInput({ channel: 42 }),
      'INVALID_NOTIFICATION_CHANNEL',
      'Notification channel must be a supported string.',
    ],
    [
      'unsupported channel',
      makeInternalRequestInput({ channel: 'SMS' }),
      'UNSUPPORTED_NOTIFICATION_CHANNEL',
      'Notification channel is not supported.',
    ],
    [
      'string userId',
      makeInternalRequestInput({ userId: '1' }),
      'INVALID_USER_ID',
      'User ID must be a positive integer.',
    ],
    [
      'zero userId',
      makeInternalRequestInput({ userId: 0 }),
      'INVALID_USER_ID',
      'User ID must be a positive integer.',
    ],
    [
      'negative userId',
      makeInternalRequestInput({ userId: -1 }),
      'INVALID_USER_ID',
      'User ID must be a positive integer.',
    ],
    [
      'decimal userId',
      makeInternalRequestInput({ userId: 1.5 }),
      'INVALID_USER_ID',
      'User ID must be a positive integer.',
    ],
    [
      'non-string recipient email',
      makeInternalRequestInput({ recipientEmail: 42 }),
      'INVALID_RECIPIENT_EMAIL',
      'Recipient email must be valid.',
    ],
    [
      'invalid recipient email',
      makeInternalRequestInput({ recipientEmail: 'not-an-email' }),
      'INVALID_RECIPIENT_EMAIL',
      'Recipient email must be valid.',
    ],
    [
      'non-string template key',
      makeInternalRequestInput({ templateKey: 42 }),
      'INVALID_TEMPLATE_KEY',
      'Template key must be a non-empty string of at most 100 characters.',
    ],
    [
      'empty template key',
      makeInternalRequestInput({ templateKey: '' }),
      'INVALID_TEMPLATE_KEY',
      'Template key must be a non-empty string of at most 100 characters.',
    ],
    [
      'blank template key',
      makeInternalRequestInput({ templateKey: '   ' }),
      'INVALID_TEMPLATE_KEY',
      'Template key must be a non-empty string of at most 100 characters.',
    ],
    [
      'overlong template key',
      makeInternalRequestInput({ templateKey: 'T'.repeat(101) }),
      'INVALID_TEMPLATE_KEY',
      'Template key must be a non-empty string of at most 100 characters.',
    ],
    [
      'string template data',
      makeInternalRequestInput({ templateData: 'not-an-object' }),
      'INVALID_TEMPLATE_DATA',
      'Template data must be an object.',
    ],
    [
      'array template data',
      makeInternalRequestInput({ templateData: [] }),
      'INVALID_TEMPLATE_DATA',
      'Template data must be an object.',
    ],
    [
      'non-string source entity type',
      makeInternalRequestInput({ sourceEntityType: 42 }),
      'INVALID_SOURCE_ENTITY_TYPE',
      'Source entity type must be a safe identifier of at most 50 characters.',
    ],
    [
      'overlong source entity type',
      makeInternalRequestInput({ sourceEntityType: 'S'.repeat(51) }),
      'INVALID_SOURCE_ENTITY_TYPE',
      'Source entity type must be a safe identifier of at most 50 characters.',
    ],
    [
      'link-like source entity type',
      makeInternalRequestInput({ sourceEntityType: 'https://example.test/verify/raw-link' }),
      'INVALID_SOURCE_ENTITY_TYPE',
      'Source entity type must be a safe identifier of at most 50 characters.',
    ],
    [
      'token-like source entity type',
      makeInternalRequestInput({ sourceEntityType: 'reset_token' }),
      'INVALID_SOURCE_ENTITY_TYPE',
      'Source entity type must be a safe identifier of at most 50 characters.',
    ],
    [
      'OTP-like source entity type',
      makeInternalRequestInput({ sourceEntityType: 'OTP_EVENT' }),
      'INVALID_SOURCE_ENTITY_TYPE',
      'Source entity type must be a safe identifier of at most 50 characters.',
    ],
    [
      'password-like source entity type',
      makeInternalRequestInput({ sourceEntityType: 'PASSWORD_EVENT' }),
      'INVALID_SOURCE_ENTITY_TYPE',
      'Source entity type must be a safe identifier of at most 50 characters.',
    ],
    [
      'provider-like source entity type',
      makeInternalRequestInput({ sourceEntityType: 'PROVIDER_STACK' }),
      'INVALID_SOURCE_ENTITY_TYPE',
      'Source entity type must be a safe identifier of at most 50 characters.',
    ],
    [
      'non-identifier source entity type',
      makeInternalRequestInput({ sourceEntityType: 'Borrow Detail?' }),
      'INVALID_SOURCE_ENTITY_TYPE',
      'Source entity type must be a safe identifier of at most 50 characters.',
    ],
    [
      'null source entity ID',
      makeInternalRequestInput({ sourceEntityId: null }),
      'INVALID_SOURCE_ENTITY_ID',
      'Source entity ID must be a positive integer.',
    ],
    [
      'string source entity ID',
      makeInternalRequestInput({ sourceEntityId: '42' }),
      'INVALID_SOURCE_ENTITY_ID',
      'Source entity ID must be a positive integer.',
    ],
    [
      'decimal source entity ID',
      makeInternalRequestInput({ sourceEntityId: 42.5 }),
      'INVALID_SOURCE_ENTITY_ID',
      'Source entity ID must be a positive integer.',
    ],
    [
      'zero source entity ID',
      makeInternalRequestInput({ sourceEntityId: 0 }),
      'INVALID_SOURCE_ENTITY_ID',
      'Source entity ID must be a positive integer.',
    ],
    [
      'negative source entity ID',
      makeInternalRequestInput({ sourceEntityId: -1 }),
      'INVALID_SOURCE_ENTITY_ID',
      'Source entity ID must be a positive integer.',
    ],
    [
      'non-string idempotency key',
      makeInternalRequestInput({ idempotencyKey: 42 }),
      'INVALID_IDEMPOTENCY_KEY',
      'Idempotency key must be a string of at most 100 characters.',
    ],
    [
      'overlong idempotency key',
      makeInternalRequestInput({ idempotencyKey: 'I'.repeat(101) }),
      'INVALID_IDEMPOTENCY_KEY',
      'Idempotency key must be a string of at most 100 characters.',
    ],
  ])('rejects direct requester boundary case: %s', async (_, input, code, message) => {
    const {
      notificationService,
      notificationDependencies,
      authDependencies,
      emailProviderMessages,
    } = makeTestApp();
    const requester = notificationService.createSourceNotificationRequester('FE07');

    await expect(requester.createNotificationRequest(input)).rejects.toMatchObject({ code, message });
    expect(notificationDependencies.state.notifications).toHaveLength(0);
    expect(authDependencies.state.auditLogs).toHaveLength(0);
    expect(emailProviderMessages).toHaveLength(0);
  });

  test('accepts optional null requester fields while sourceEntityId remains absent', async () => {
    const { notificationService, notificationDependencies } = makeTestApp();
    const requester = notificationService.createSourceNotificationRequester('FE07');

    const result = await requester.createNotificationRequest(
      makeInternalRequestInput({
        channel: null,
        userId: null,
        sourceEntityType: null,
        idempotencyKey: null,
      })
    );

    expect(result).toEqual({ notificationId: expect.any(Number), status: 'PENDING' });
    expect(notificationDependencies.state.notifications[0]).toMatchObject({
      channel: 'EMAIL',
      userId: null,
      sourceEntityType: null,
      sourceEntityId: null,
      idempotencyKey: null,
    });
  });

  test.each([
    ['  BORROW_DETAIL  ', 'BORROW_DETAIL'],
    ['Reservation', 'Reservation'],
    ['Fine', 'Fine'],
  ])('persists validated source entity type %s as %s', async (sourceEntityType, expected) => {
    const { notificationService, notificationDependencies, authDependencies } = makeTestApp();
    const requester = notificationService.createSourceNotificationRequester('FE07');

    const result = await requester.createNotificationRequest(
      makeInternalRequestInput({ sourceEntityType, sourceEntityId: 42 })
    );

    expect(notificationDependencies.state.notifications[0].sourceEntityType).toBe(expected);
    expect(authDependencies.state.auditLogs).toEqual([
      expect.objectContaining({
        userId: null,
        targetId: result.notificationId,
        metadata: expect.objectContaining({ sourceEntityType: expected, sourceEntityId: 42 }),
      }),
    ]);
  });

  // FE10-H05, FR-FE10-001: sensitive source requests keep the link provider-only while their
  // audit identifies the trusted bound source rather than caller-controlled metadata.
  test('sends a bound FE02 sensitive request with redacted persistence and safe source audit', async () => {
    const { notificationService, notificationDependencies, authDependencies, emailProviderMessages } =
      makeTestApp();
    const requester = notificationService.createSourceNotificationRequester('FE02');
    const rawLink = 'https://example.test/verify/h05-provider-only-link';

    const result = await requester.createNotificationRequest(
      {
        type: 'ACCOUNT_VERIFICATION',
        recipientEmail: 'reader@example.test',
        templateKey: 'ACCOUNT_VERIFICATION',
        templateData: { name: 'Reader', verificationLink: rawLink },
        sourceEntityType: 'AUTH_EVENT',
        sourceEntityId: 9,
      },
      { userId: 456, ip: '127.0.0.1' }
    );

    expect(result).toEqual({ notificationId: expect.any(Number), status: 'SENT' });
    expect(emailProviderMessages).toEqual([
      expect.objectContaining({
        to: 'reader@example.test',
        subject: 'Verify Reader',
        body: `Verification link: ${rawLink}`,
      }),
    ]);
    expect(notificationDependencies.state.notifications[0]).toMatchObject({
      status: 'SENT',
      title: null,
      body: null,
      safePayload: { redacted: true },
      sourceFeature: null,
      sourceEntityType: null,
      sourceEntityId: 9,
    });
    expect(authDependencies.state.auditLogs).toEqual([
      expect.objectContaining({
        userId: null,
        action: 'NOTIFICATION_REQUEST_CREATE',
        targetId: result.notificationId,
        metadata: expect.objectContaining({
          sourceFeature: 'FE02',
          sourceEntityType: 'AUTH_EVENT',
          sourceEntityId: 9,
        }),
      }),
    ]);

    const storedOrAudited = JSON.stringify({
      result,
      notification: notificationDependencies.state.notifications[0],
      attempts: notificationDependencies.state.attempts,
      auditLogs: authDependencies.state.auditLogs,
    });
    expect(storedOrAudited).not.toContain(rawLink);
    expect(storedOrAudited).not.toContain('Verify Reader');
    expect(storedOrAudited).not.toContain('Verification link:');
  });
});
