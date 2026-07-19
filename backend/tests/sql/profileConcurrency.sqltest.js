const { readFileSync } = require('fs');
const path = require('path');
const dotenv = require('dotenv');

if (process.env.FE03_SQL_TEST_ENV_FILE) {
  dotenv.config({ path: process.env.FE03_SQL_TEST_ENV_FILE, quiet: true });
} else {
  dotenv.config({ quiet: true });
}

const hasSqlRuntime =
  Boolean(process.env.DB_SERVER && process.env.DB_NAME) &&
  process.env.FE03_SQL_TEST_ALLOW_MUTATION === 'true';

const schemaSource = readFileSync(
  path.join(__dirname, '..', '..', '..', 'database', 'Librarymanagement.sql'),
  'utf8'
);
const repositorySource = readFileSync(
  path.join(__dirname, '..', '..', 'src', 'repositories', 'profileRepository.js'),
  'utf8'
);

// @spec FR-FE03-001, AC-FE03-012
test('UserProfiles schema and repository enforce one serialized profile per user', () => {
  expect(schemaSource).toMatch(/CREATE TABLE UserProfiles[\s\S]*UserId\s+INT\s+UNIQUE\s+NOT NULL/i);
  expect(repositorySource).toMatch(/UserProfiles WITH \(UPDLOCK, HOLDLOCK\)/i);
  expect(repositorySource).toMatch(/IF NOT EXISTS[\s\S]*INSERT INTO UserProfiles \(UserId\)/i);
});

// @spec BR-FE03-008, BR-FE03-017, FR-FE03-010
test('profile field and avatar updates require audit writes in their SQL transactions', () => {
  expect(repositorySource).toMatch(/Profile updates require an audit entry/);
  expect(repositorySource).toMatch(/Avatar updates require an audit entry/);
  expect(repositorySource.match(/auditLogRepository\.create\(\{ \.\.\.auditEntry, transaction \}\)/g)).toHaveLength(2);
});

// @spec BR-FE03-008, BR-FE03-017
test('profile repository rolls every failed transaction back', () => {
  expect(repositorySource.match(/await transaction\.rollback\(\)/g)?.length).toBeGreaterThanOrEqual(3);
  expect(repositorySource).toMatch(/UPDATE Users[\s\S]*UPDATE UserProfiles[\s\S]*auditLogRepository\.create/s);
});

const runtimeDescribe = hasSqlRuntime ? describe : describe.skip;

runtimeDescribe('FE03 mutable SQL profile evidence', () => {
  const { sql, getPool, resetPoolForTests } = require('../../src/config/db');
  const profileRepository = require('../../src/repositories/profileRepository');
  const auditLogRepository = require('../../src/repositories/auditLogRepository');

  jest.setTimeout(30000);

  let pool;
  let seedNumber = 0;
  let activeSeed;

  async function createUserSeed() {
    seedNumber += 1;
    const key = `fe03sql${Date.now()}${process.pid}${seedNumber}`;
    const result = await pool.request()
      .input('Username', sql.NVarChar(50), key.slice(0, 50))
      .input('Email', sql.NVarChar(255), `${key}@example.test`)
      .input('PasswordHash', sql.NVarChar(255), 'sql-test-password-hash')
      .query(`
        INSERT INTO Users (Username, Email, PasswordHash, Phone, Status, EmailVerifiedAt)
        OUTPUT INSERTED.UserId
        VALUES (@Username, @Email, @PasswordHash, '0900000000', 'ACTIVE', GETDATE())
      `);
    activeSeed = { userId: result.recordset[0].UserId };
    return activeSeed;
  }

  async function initializeProfile(seed) {
    const profile = await profileRepository.createBlankProfile(seed.userId);
    await pool.request()
      .input('UserId', sql.Int, seed.userId)
      .input('FullName', sql.NVarChar(100), 'Original Profile')
      .input('Address', sql.NVarChar(255), 'Original Address')
      .input('AvatarUrl', sql.NVarChar(255), '/uploads/avatars/original.png')
      .query(`
        UPDATE UserProfiles
        SET FullName = @FullName, Address = @Address, AvatarUrl = @AvatarUrl
        WHERE UserId = @UserId
      `);
    return profile;
  }

  async function readState(seed) {
    const result = await pool.request()
      .input('UserId', sql.Int, seed.userId)
      .query(`
        SELECT u.Phone, up.ProfileId, up.FullName, up.Address, up.DateOfBirth, up.AvatarUrl
        FROM Users u
        LEFT JOIN UserProfiles up ON u.UserId = up.UserId
        WHERE u.UserId = @UserId;
        SELECT COUNT(*) AS Total
        FROM AuditLogs
        WHERE TargetType = 'USER_PROFILE' AND TargetId = @UserId;
      `);
    return {
      profile: result.recordsets[0][0],
      auditTotal: result.recordsets[1][0]?.Total || 0,
    };
  }

  function failingAudit(errorMessage) {
    return {
      async create(entry) {
        await auditLogRepository.create(entry);
        throw new Error(errorMessage);
      },
    };
  }

  function auditEntry(seed, fields) {
    return {
      userId: seed.userId,
      action: 'PROFILE_UPDATE',
      targetType: 'USER_PROFILE',
      targetId: seed.userId,
      metadata: { fields },
    };
  }

  async function cleanup() {
    if (!activeSeed || !pool) return;
    const { userId } = activeSeed;
    await pool.request().input('UserId', sql.Int, userId)
      .query("DELETE FROM AuditLogs WHERE TargetType = 'USER_PROFILE' AND TargetId = @UserId");
    await pool.request().input('UserId', sql.Int, userId)
      .query('DELETE FROM UserProfiles WHERE UserId = @UserId');
    await pool.request().input('UserId', sql.Int, userId)
      .query('DELETE FROM Users WHERE UserId = @UserId');
    activeSeed = null;
  }

  beforeAll(async () => {
    pool = await getPool();
  });

  afterEach(cleanup);

  afterAll(async () => {
    await cleanup();
    if (pool) await pool.close();
    resetPoolForTests();
  });

  // @spec FR-FE03-001, AC-FE03-012
  test('concurrent first views create exactly one profile row and return the same profile', async () => {
    const seed = await createUserSeed();
    const [left, right] = await Promise.all([
      profileRepository.createBlankProfile(seed.userId),
      profileRepository.createBlankProfile(seed.userId),
    ]);
    const count = await pool.request()
      .input('UserId', sql.Int, seed.userId)
      .query('SELECT COUNT(*) AS Total FROM UserProfiles WHERE UserId = @UserId');

    expect(count.recordset[0].Total).toBe(1);
    expect(left.profileId).toBe(right.profileId);
    expect(left.userId).toBe(seed.userId);
  });

  // @spec BR-FE03-008, FR-FE03-010, AC-FE03-013
  test('profile field and phone changes roll back when the audit boundary fails', async () => {
    const seed = await createUserSeed();
    await initializeProfile(seed);
    const before = await readState(seed);

    await expect(profileRepository.updateByUserId(
      seed.userId,
      { fullName: 'Must Roll Back', address: 'Changed Address', phone: '0999999999' },
      {
        auditLogRepository: failingAudit('Injected FE03 profile audit failure'),
        auditEntry: auditEntry(seed, ['fullName', 'address', 'phone']),
      }
    )).rejects.toThrow('Injected FE03 profile audit failure');

    expect(await readState(seed)).toEqual(before);
  });

  // @spec BR-FE03-017, FR-FE03-010, AC-FE03-014
  test('avatar URL and audit writes roll back together after a database failure', async () => {
    const seed = await createUserSeed();
    await initializeProfile(seed);
    const before = await readState(seed);

    await expect(profileRepository.updateAvatarByUserId(
      seed.userId,
      '/uploads/avatars/new.png',
      {
        auditLogRepository: failingAudit('Injected FE03 avatar audit failure'),
        auditEntry: auditEntry(seed, ['avatarUrl']),
      }
    )).rejects.toThrow('Injected FE03 avatar audit failure');

    expect(await readState(seed)).toEqual(before);
  });
});
