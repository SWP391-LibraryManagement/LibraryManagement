describe('authentication expiry environment configuration', () => {
  const originalMinutes = process.env.EMAIL_VERIFICATION_TTL_MINUTES;
  const originalHours = process.env.EMAIL_VERIFICATION_TTL_HOURS;
  const originalLockoutMinutes = process.env.LOGIN_LOCKOUT_MINUTES;
  const workerEnvNames = [
    'NOTIFICATION_WORKER_ENABLED',
    'NOTIFICATION_WORKER_INTERVAL_MS',
    'NOTIFICATION_WORKER_BATCH_SIZE',
  ];
  const originalWorkerEnv = Object.fromEntries(
    workerEnvNames.map((name) => [name, process.env[name]])
  );

  afterEach(() => {
    if (originalMinutes === undefined) {
      delete process.env.EMAIL_VERIFICATION_TTL_MINUTES;
    } else {
      process.env.EMAIL_VERIFICATION_TTL_MINUTES = originalMinutes;
    }

    if (originalHours === undefined) {
      delete process.env.EMAIL_VERIFICATION_TTL_HOURS;
    } else {
      process.env.EMAIL_VERIFICATION_TTL_HOURS = originalHours;
    }

    if (originalLockoutMinutes === undefined) {
      delete process.env.LOGIN_LOCKOUT_MINUTES;
    } else {
      process.env.LOGIN_LOCKOUT_MINUTES = originalLockoutMinutes;
    }

    for (const name of workerEnvNames) {
      if (originalWorkerEnv[name] === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = originalWorkerEnv[name];
      }
    }

    jest.resetModules();
  });

  test('uses the explicit 15-minute verification OTP setting', () => {
    process.env.EMAIL_VERIFICATION_TTL_MINUTES = '15';
    process.env.EMAIL_VERIFICATION_TTL_HOURS = '24';

    const env = require('../src/config/env');

    expect(env.emailVerificationTtlMinutes).toBe(15);
  });

  test('temporarily supports the legacy hour setting', () => {
    delete process.env.EMAIL_VERIFICATION_TTL_MINUTES;
    process.env.EMAIL_VERIFICATION_TTL_HOURS = '0.25';

    const env = require('../src/config/env');

    expect(env.emailVerificationTtlMinutes).toBe(15);
  });

  test('rejects a non-positive or fractional minute setting', () => {
    process.env.EMAIL_VERIFICATION_TTL_MINUTES = '15.5';

    expect(() => require('../src/config/env')).toThrow(
      'Invalid positive integer environment value for EMAIL_VERIFICATION_TTL_MINUTES'
    );
  });

  test('defaults account lockout duration to 30 minutes', () => {
    delete process.env.LOGIN_LOCKOUT_MINUTES;

    const env = require('../src/config/env');

    expect(env.lockoutMinutes).toBe(30);
  });

  test('uses safe disabled notification worker defaults', () => {
    for (const name of workerEnvNames) {
      delete process.env[name];
    }

    const env = require('../src/config/env');

    expect(env.notificationWorkerEnabled).toBe(false);
    expect(env.notificationWorkerIntervalMs).toBe(60000);
    expect(env.notificationWorkerBatchSize).toBe(20);
  });

  test.each([
    ['NOTIFICATION_WORKER_INTERVAL_MS', '0'],
    ['NOTIFICATION_WORKER_INTERVAL_MS', '1.5'],
    ['NOTIFICATION_WORKER_BATCH_SIZE', '-1'],
  ])('rejects invalid positive worker setting %s=%s', (name, value) => {
    process.env[name] = value;

    expect(() => require('../src/config/env')).toThrow(
      `Invalid positive integer environment value for ${name}`
    );
  });
});
