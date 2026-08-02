const crypto = require('crypto');

const EXACT_DATABASE = 'LibraryManagement_FE11_PRB_20260802';
const TEST_TRIGGER = 'TR_FE11_PRB_AuditFail';

function requireDisposableTarget() {
  if (!process.env.DB_SERVER || !process.env.DB_NAME) {
    throw new Error('FE11 SQL evidence requires DB_SERVER and DB_NAME.');
  }
  if (process.env.DB_NAME !== EXACT_DATABASE) {
    throw new Error(`FE11 SQL evidence requires the exact database ${EXACT_DATABASE}.`);
  }
  if (/staging|prod|production/i.test(process.env.DB_NAME)) {
    throw new Error('FE11 SQL evidence refuses staging or production database names.');
  }
  if (process.env.FE11_SQL_TEST_ALLOW_MUTATION !== 'true') {
    throw new Error('FE11 SQL evidence requires FE11_SQL_TEST_ALLOW_MUTATION=true.');
  }
}

requireDisposableTarget();

const { sql, getPool, resetPoolForTests } = require('../../src/config/db');
const accountSetupRepository = require('../../src/repositories/accountSetupRepository');
const userLifecycleRepository = require('../../src/repositories/userLifecycleRepository');
const userRoleRepository = require('../../src/repositories/userRoleRepository');

jest.setTimeout(60000);

const FIXED_NOW = new Date('2026-08-02T08:00:00.000Z');
let pool;
let activeSeed;
let sequence = 0;
const completedSeeds = [];

function createSeed(label) {
  sequence += 1;
  return {
    key: `fe11prb-${Date.now()}-${process.pid}-${sequence}-${label}`.toLowerCase(),
    userIds: [],
    requestIds: [],
    detailIds: [],
  };
}

async function roleId(roleName) {
  const result = await pool.request()
    .input('RoleName', sql.NVarChar(50), roleName)
    .query('SELECT TOP 1 RoleId FROM Roles WHERE UPPER(RoleName) = UPPER(@RoleName)');
  if (!result.recordset.length) throw new Error(`FE11 SQL evidence requires role ${roleName}.`);
  return result.recordset[0].RoleId;
}

async function insertUser(seed, suffix, {
  roleName = 'MEMBER',
  status = 'ACTIVE',
  deactivatedAt = null,
} = {}) {
  const username = `${seed.key}-${suffix}`.slice(0, 50);
  const email = `${seed.key}-${suffix}@example.test`.slice(0, 255);
  const result = await pool.request()
    .input('Username', sql.NVarChar(50), username)
    .input('Email', sql.NVarChar(255), email)
    .input('PasswordHash', sql.NVarChar(255), crypto.randomBytes(32).toString('hex'))
    .input('Status', sql.NVarChar(20), status)
    .input('DeactivatedAt', sql.DateTime, deactivatedAt)
    .input('Now', sql.DateTime, FIXED_NOW)
    .query(`
      INSERT INTO Users
        (Username, Email, PasswordHash, Status, EmailVerifiedAt, CreatedAt, UpdatedAt, DeactivatedAt)
      OUTPUT INSERTED.UserId, INSERTED.Email, INSERTED.Status, INSERTED.UpdatedAt
      VALUES
        (@Username, @Email, @PasswordHash, @Status, @Now, @Now, @Now, @DeactivatedAt)
    `);
  const user = {
    userId: result.recordset[0].UserId,
    email: result.recordset[0].Email,
    status: result.recordset[0].Status,
    updatedAt: result.recordset[0].UpdatedAt,
  };
  seed.userIds.push(user.userId);

  await pool.request()
    .input('UserId', sql.Int, user.userId)
    .input('FullName', sql.NVarChar(100), `${labelFor(suffix)} FE11 PR B`)
    .input('Now', sql.DateTime, FIXED_NOW)
    .query(`
      INSERT INTO UserProfiles (UserId, FullName, CreatedAt)
      VALUES (@UserId, @FullName, @Now)
    `);

  if (roleName) {
    await pool.request()
      .input('UserId', sql.Int, user.userId)
      .input('RoleId', sql.Int, await roleId(roleName))
      .input('Now', sql.DateTime, FIXED_NOW)
      .query(`
        INSERT INTO UserRoles (UserId, RoleId, CreatedAt)
        VALUES (@UserId, @RoleId, @Now)
      `);
  }
  return user;
}

function labelFor(value) {
  return String(value).replace(/[^a-z0-9]+/gi, ' ').trim().slice(0, 70) || 'User';
}

async function insertRefreshToken(seed, userId, suffix) {
  const result = await pool.request()
    .input('UserId', sql.Int, userId)
    .input('TokenHash', sql.NVarChar(255), crypto.createHash('sha256').update(`${seed.key}-${suffix}`).digest('hex'))
    .input('ExpiresAt', sql.DateTime, new Date('2026-08-03T08:00:00.000Z'))
    .input('Now', sql.DateTime, FIXED_NOW)
    .query(`
      INSERT INTO AuthTokens (UserId, TokenType, TokenHash, ExpiresAt, CreatedAt)
      OUTPUT INSERTED.TokenId
      VALUES (@UserId, 'REFRESH', @TokenHash, @ExpiresAt, @Now)
    `);
  return result.recordset[0].TokenId;
}

async function insertBorrowing(seed, userId, detailStatus = 'BORROWED') {
  const copyResult = await pool.request().query('SELECT TOP 1 CopyId FROM BookCopies ORDER BY CopyId');
  if (!copyResult.recordset.length) throw new Error('FE11 SQL evidence requires one seeded BookCopies row.');
  const requestResult = await pool.request()
    .input('UserId', sql.Int, userId)
    .input('Now', sql.DateTime, FIXED_NOW)
    .query(`
      INSERT INTO BorrowRequests (UserId, RequestDate, Status, CreatedBy, CreatedAt)
      OUTPUT INSERTED.RequestId
      VALUES (@UserId, @Now, 'APPROVED', @UserId, @Now)
    `);
  const requestId = requestResult.recordset[0].RequestId;
  seed.requestIds.push(requestId);
  const detailResult = await pool.request()
    .input('RequestId', sql.Int, requestId)
    .input('CopyId', sql.Int, copyResult.recordset[0].CopyId)
    .input('Status', sql.NVarChar(20), detailStatus)
    .input('Now', sql.DateTime, FIXED_NOW)
    .query(`
      INSERT INTO BorrowDetails (RequestId, CopyId, Status, CreatedAt)
      OUTPUT INSERTED.BorrowDetailId
      VALUES (@RequestId, @CopyId, @Status, @Now)
    `);
  seed.detailIds.push(detailResult.recordset[0].BorrowDetailId);
}

async function countUserState(userId) {
  const result = await pool.request()
    .input('UserId', sql.Int, userId)
    .query(`
      SELECT
        (SELECT COUNT(*) FROM UserProfiles WHERE UserId = @UserId) AS Profiles,
        (SELECT COUNT(*) FROM UserRoles WHERE UserId = @UserId) AS Roles,
        (SELECT COUNT(*) FROM AuthTokens WHERE UserId = @UserId) AS Tokens,
        (SELECT COUNT(*) FROM AuditLogs WHERE UserId = @UserId OR TargetId = @UserId) AS Audits
    `);
  return result.recordset[0];
}

async function readLifecycle(userId) {
  const result = await pool.request()
    .input('UserId', sql.Int, userId)
    .query(`
      SELECT
        u.Status,
        u.DeactivatedAt,
        (SELECT COUNT(*) FROM AuthTokens t
          WHERE t.UserId = u.UserId AND t.TokenType = 'REFRESH'
            AND t.UsedAt IS NULL AND t.RevokedAt IS NULL) AS ActiveRefreshTokens,
        (SELECT COUNT(*) FROM AuditLogs a
          WHERE a.TargetId = u.UserId AND a.Action = 'USER_DEACTIVATE') AS DeactivationAudits
      FROM Users u
      WHERE u.UserId = @UserId
    `);
  return result.recordset[0];
}

async function readRoleState(userId) {
  const result = await pool.request()
    .input('UserId', sql.Int, userId)
    .query(`
      SELECT
        (SELECT COUNT(*) FROM UserRoles WHERE UserId = @UserId) AS MappingCount,
        (SELECT TOP 1 UPPER(r.RoleName)
          FROM UserRoles ur INNER JOIN Roles r ON r.RoleId = ur.RoleId
          WHERE ur.UserId = @UserId) AS RoleName,
        (SELECT COUNT(*) FROM AuthTokens t
          WHERE t.UserId = @UserId AND t.TokenType = 'REFRESH'
            AND t.UsedAt IS NULL AND t.RevokedAt IS NULL) AS ActiveRefreshTokens,
        (SELECT COUNT(*) FROM AuditLogs a
          WHERE a.TargetId = @UserId AND a.Action = 'USER_ROLE_REPLACE') AS RoleAudits
    `);
  return result.recordset[0];
}

async function dropTestTrigger() {
  if (!pool) return;
  await pool.request().query(`DROP TRIGGER IF EXISTS dbo.${TEST_TRIGGER}`);
  const result = await pool.request()
    .input('TriggerName', sql.NVarChar(128), TEST_TRIGGER)
    .query('SELECT COUNT(*) AS TriggerCount FROM sys.triggers WHERE name = @TriggerName');
  expect(result.recordset[0].TriggerCount).toBe(0);
}

async function installAuditFailureTrigger() {
  await dropTestTrigger();
  await pool.request().query(`
    CREATE TRIGGER dbo.${TEST_TRIGGER}
    ON dbo.AuditLogs
    AFTER INSERT
    AS
    BEGIN
      SET NOCOUNT ON;
      IF EXISTS (SELECT 1 FROM inserted WHERE UserAgent = 'fe11-prb-force-audit-failure')
        THROW 51011, 'FE11 PR B forced audit failure.', 1;
    END
  `);
}

async function cleanupSeed(seed) {
  await dropTestTrigger();

  for (const detailId of seed.detailIds) {
    await pool.request().input('BorrowDetailId', sql.Int, detailId)
      .query('DELETE FROM BorrowDetails WHERE BorrowDetailId = @BorrowDetailId');
  }
  for (const requestId of seed.requestIds) {
    await pool.request().input('RequestId', sql.Int, requestId)
      .query('DELETE FROM BorrowRequests WHERE RequestId = @RequestId');
  }
  for (const userId of seed.userIds) {
    const request = () => pool.request().input('UserId', sql.Int, userId);
    await request().query('DELETE FROM AuditLogs WHERE UserId = @UserId OR TargetId = @UserId');
    await request().query('DELETE FROM AuthTokens WHERE UserId = @UserId');
    await request().query('DELETE FROM MembershipApplications WHERE UserId = @UserId OR ReviewedBy = @UserId');
    await request().query('DELETE FROM Members WHERE UserId = @UserId OR ApprovedBy = @UserId');
    await request().query('DELETE FROM UserProfiles WHERE UserId = @UserId');
    await request().query('DELETE FROM UserRoles WHERE UserId = @UserId');
  }
  for (const userId of [...seed.userIds].reverse()) {
    await pool.request().input('UserId', sql.Int, userId)
      .query('DELETE FROM Users WHERE UserId = @UserId');
  }
}

async function expectSeedCleaned(seed) {
  const result = await pool.request()
    .input('EmailPrefix', sql.NVarChar(255), `${seed.key}%`)
    .query(`
      SELECT
        (SELECT COUNT(*) FROM Users WHERE Email LIKE @EmailPrefix) AS Users,
        (SELECT COUNT(*) FROM AuditLogs WHERE UserAgent = 'fe11-prb-force-audit-failure') AS TriggerAudits
    `);
  expect(result.recordset[0]).toEqual({ Users: 0, TriggerAudits: 0 });
}

function createAccountInput(seed, adminUserId, overrides = {}) {
  const suffix = overrides.suffix || 'created';
  return {
    username: `${seed.key}-${suffix}`.slice(0, 50),
    email: `${seed.key}-${suffix}@example.test`.slice(0, 255),
    passwordHash: crypto.randomBytes(32).toString('hex'),
    phone: null,
    fullName: 'FE11 PR B SQL User',
    address: null,
    department: null,
    specialization: null,
    roleName: 'MEMBER',
    tokenHash: crypto.createHash('sha256').update(`${seed.key}-${suffix}-setup`).digest('hex'),
    expiresAt: new Date('2026-08-03T08:00:00.000Z'),
    adminUserId,
    ip: '127.0.0.1',
    userAgent: 'fe11-prb-sql',
    now: FIXED_NOW,
    ...overrides,
  };
}

beforeAll(async () => {
  pool = await getPool();
  const identity = await pool.request().query('SELECT DB_NAME() AS DatabaseName');
  expect(identity.recordset[0].DatabaseName).toBe(EXACT_DATABASE);
  await dropTestTrigger();
});

afterEach(async () => {
  if (!activeSeed || !pool) return;
  await cleanupSeed(activeSeed);
  await expectSeedCleaned(activeSeed);
  completedSeeds.push(activeSeed);
  activeSeed = null;
});

afterAll(async () => {
  try {
    if (pool && activeSeed) {
      await cleanupSeed(activeSeed);
      await expectSeedCleaned(activeSeed);
      completedSeeds.push(activeSeed);
      activeSeed = null;
    }
    if (pool) {
      await dropTestTrigger();
      for (const seed of completedSeeds) await expectSeedCleaned(seed);
    }
  } finally {
    if (pool) await pool.close();
    resetPoolForTests();
  }
});

// @spec AC-FE11-005, AC-FE11-013, AC-FE11-014
test('inactive Admin and active non-Admin actors are rejected before Core mutation', async () => {
  activeSeed = createSeed('actors');
  const target = await insertUser(activeSeed, 'target');
  const librarianRoleId = await roleId('LIBRARIAN');

  for (const actorOptions of [
    { suffix: 'inactive-admin', roleName: 'ADMIN', status: 'INACTIVE' },
    { suffix: 'active-member', roleName: 'MEMBER', status: 'ACTIVE' },
  ]) {
    const actor = await insertUser(activeSeed, actorOptions.suffix, actorOptions);
    const before = await countUserState(target.userId);
    await expect(accountSetupRepository.createPendingAccount(
      createAccountInput(activeSeed, actor.userId, { suffix: `attempt-${actorOptions.suffix}` })
    )).resolves.toEqual({ outcome: 'ADMIN_REQUIRED' });
    await expect(userLifecycleRepository.deactivateManagedUser({
      adminUserId: actor.userId,
      userId: target.userId,
      expectedUpdatedAt: target.updatedAt,
      userAgent: 'fe11-prb-sql',
      now: FIXED_NOW,
    })).resolves.toEqual({ outcome: 'ADMIN_REQUIRED' });
    await expect(userRoleRepository.replaceUserRole({
      adminUserId: actor.userId,
      userId: target.userId,
      roleId: librarianRoleId,
      userAgent: 'fe11-prb-sql',
      now: FIXED_NOW,
    })).resolves.toEqual({ outcome: 'ADMIN_REQUIRED' });
    expect(await countUserState(target.userId)).toEqual(before);
  }
});

// @spec AC-FE11-005
test('duplicate normalized email creates no partial account, credential, or audit state', async () => {
  activeSeed = createSeed('duplicate');
  const admin = await insertUser(activeSeed, 'admin', { roleName: 'ADMIN' });
  const existing = await insertUser(activeSeed, 'existing');
  const before = await countUserState(existing.userId);
  const input = createAccountInput(activeSeed, admin.userId, {
    suffix: 'duplicate-attempt',
    email: existing.email.toUpperCase(),
  });

  await expect(accountSetupRepository.createPendingAccount(input))
    .resolves.toEqual({ outcome: 'EMAIL_ALREADY_EXISTS' });
  expect(await countUserState(existing.userId)).toEqual(before);
  const attempt = await pool.request().input('Username', sql.NVarChar(50), input.username)
    .query('SELECT COUNT(*) AS UserCount FROM Users WHERE Username = @Username');
  expect(attempt.recordset[0].UserCount).toBe(0);
});

// @spec AC-FE11-007, AC-FE11-009, AC-FE11-010, AC-FE11-012, AC-FE11-023
test('stale, self, pending-activation, and active-loan deactivation guards perform no mutation', async () => {
  activeSeed = createSeed('guards');
  const admin = await insertUser(activeSeed, 'admin', { roleName: 'ADMIN' });
  const stale = await insertUser(activeSeed, 'stale');
  const pending = await insertUser(activeSeed, 'pending', { status: 'INACTIVE', deactivatedAt: null });
  const borrowed = await insertUser(activeSeed, 'borrowed');
  await insertBorrowing(activeSeed, borrowed.userId);
  for (const user of [stale, pending, borrowed]) await insertRefreshToken(activeSeed, user.userId, `${user.userId}`);

  const cases = [
    [stale, new Date('2026-08-01T08:00:00.000Z'), 'STALE_USER_STATE'],
    [admin, admin.updatedAt, 'CANNOT_DEACTIVATE_SELF'],
    [pending, pending.updatedAt, 'ACCOUNT_PENDING_ACTIVATION'],
    [borrowed, borrowed.updatedAt, 'ACTIVE_BORROWINGS_EXIST'],
  ];
  for (const [target, expectedUpdatedAt, outcome] of cases) {
    const before = await readLifecycle(target.userId);
    const result = await userLifecycleRepository.deactivateManagedUser({
      adminUserId: admin.userId,
      userId: target.userId,
      expectedUpdatedAt,
      userAgent: 'fe11-prb-sql',
      now: FIXED_NOW,
    });
    expect(result.outcome).toBe(outcome);
    expect(await readLifecycle(target.userId)).toEqual(before);
  }
});

// @spec AC-FE11-007, AC-FE11-009, AC-FE11-012
test.each(['ACTIVE', 'LOCKED'])('successful %s deactivation revokes refresh credentials and audits once', async (status) => {
  activeSeed = createSeed(`deactivate-${status}`);
  const admin = await insertUser(activeSeed, 'admin', { roleName: 'ADMIN' });
  const target = await insertUser(activeSeed, 'target', { status });
  await insertRefreshToken(activeSeed, target.userId, status);

  await expect(userLifecycleRepository.deactivateManagedUser({
    adminUserId: admin.userId,
    userId: target.userId,
    expectedUpdatedAt: target.updatedAt,
    ipAddress: '127.0.0.1',
    userAgent: 'fe11-prb-sql',
    now: FIXED_NOW,
  })).resolves.toEqual({ outcome: 'DEACTIVATED', previousStatus: status });
  const state = await readLifecycle(target.userId);
  expect(state.Status).toBe('INACTIVE');
  expect(state.DeactivatedAt).toEqual(FIXED_NOW);
  expect(state.ActiveRefreshTokens).toBe(0);
  expect(state.DeactivationAudits).toBe(1);
});

// @spec FR-FE11-025, AC-FE11-013
test('same-role replacement is a no-op for mapping, credentials, and audit', async () => {
  activeSeed = createSeed('same-role');
  const admin = await insertUser(activeSeed, 'admin', { roleName: 'ADMIN' });
  const target = await insertUser(activeSeed, 'target', { roleName: 'MEMBER' });
  await insertRefreshToken(activeSeed, target.userId, 'same-role');
  const memberRoleId = await roleId('MEMBER');
  const before = await readRoleState(target.userId);

  await expect(userRoleRepository.replaceUserRole({
    adminUserId: admin.userId,
    userId: target.userId,
    roleId: memberRoleId,
    userAgent: 'fe11-prb-sql',
    now: FIXED_NOW,
  })).resolves.toEqual({ outcome: 'UNCHANGED', role: { roleId: memberRoleId, roleName: 'MEMBER' } });
  expect(await readRoleState(target.userId)).toEqual(before);
});

// @spec FR-FE11-026, FR-FE11-027, AC-FE11-013
test('valid replacement leaves one role, revokes refresh credentials, and audits once', async () => {
  activeSeed = createSeed('replace');
  const admin = await insertUser(activeSeed, 'admin', { roleName: 'ADMIN' });
  const target = await insertUser(activeSeed, 'target', { roleName: 'MEMBER' });
  await insertRefreshToken(activeSeed, target.userId, 'replace');
  const librarianRoleId = await roleId('LIBRARIAN');

  await expect(userRoleRepository.replaceUserRole({
    adminUserId: admin.userId,
    userId: target.userId,
    roleId: librarianRoleId,
    ipAddress: '127.0.0.1',
    userAgent: 'fe11-prb-sql',
    now: FIXED_NOW,
  })).resolves.toEqual({
    outcome: 'REPLACED',
    role: { roleId: librarianRoleId, roleName: 'LIBRARIAN' },
  });
  expect(await readRoleState(target.userId)).toEqual({
    MappingCount: 1,
    RoleName: 'LIBRARIAN',
    ActiveRefreshTokens: 0,
    RoleAudits: 1,
  });
});

// @spec FR-FE11-027
test('UX_UserRoles_UserId rejects a second direct mapping for one user', async () => {
  activeSeed = createSeed('unique-index');
  const target = await insertUser(activeSeed, 'target', { roleName: 'MEMBER' });
  const librarianRoleId = await roleId('LIBRARIAN');
  let conflict;
  try {
    await pool.request()
      .input('UserId', sql.Int, target.userId)
      .input('RoleId', sql.Int, librarianRoleId)
      .query('INSERT INTO UserRoles (UserId, RoleId) VALUES (@UserId, @RoleId)');
  } catch (error) {
    conflict = error;
  }
  expect([2601, 2627]).toContain(conflict?.number);
  expect(String(conflict?.message)).toMatch(/UX_UserRoles_UserId/i);
  expect((await readRoleState(target.userId)).MappingCount).toBe(1);
});

// @spec AC-FE11-007, AC-FE11-013, NFR-FE11-TXN-001
test('forced audit failure rolls back lifecycle, role, and refresh-token changes', async () => {
  activeSeed = createSeed('rollback');
  const admin = await insertUser(activeSeed, 'admin', { roleName: 'ADMIN' });
  const lifecycleTarget = await insertUser(activeSeed, 'lifecycle', { roleName: 'MEMBER' });
  const roleTarget = await insertUser(activeSeed, 'role', { roleName: 'MEMBER' });
  await insertRefreshToken(activeSeed, lifecycleTarget.userId, 'lifecycle');
  await insertRefreshToken(activeSeed, roleTarget.userId, 'role');
  const lifecycleBefore = await readLifecycle(lifecycleTarget.userId);
  const roleBefore = await readRoleState(roleTarget.userId);
  await installAuditFailureTrigger();

  await expect(userLifecycleRepository.deactivateManagedUser({
    adminUserId: admin.userId,
    userId: lifecycleTarget.userId,
    expectedUpdatedAt: lifecycleTarget.updatedAt,
    userAgent: 'fe11-prb-force-audit-failure',
    now: FIXED_NOW,
  })).rejects.toThrow();
  expect(await readLifecycle(lifecycleTarget.userId)).toEqual(lifecycleBefore);

  await expect(userRoleRepository.replaceUserRole({
    adminUserId: admin.userId,
    userId: roleTarget.userId,
    roleId: await roleId('LIBRARIAN'),
    userAgent: 'fe11-prb-force-audit-failure',
    now: FIXED_NOW,
  })).rejects.toThrow();
  expect(await readRoleState(roleTarget.userId)).toEqual(roleBefore);
});
