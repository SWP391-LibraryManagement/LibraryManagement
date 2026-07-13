const crypto = require('crypto');

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

  return { app, authService, authDependencies, notificationDependencies, emailProviderMessages };
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

    for (const sourceEntityId of ['42', 42.5, 0, -1]) {
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
});
