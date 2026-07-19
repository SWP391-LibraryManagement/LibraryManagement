const dotenv = require('dotenv');
const { existsSync, readFileSync } = require('fs');
const path = require('path');

if (process.env.FE04_SQL_TEST_ENV_FILE) {
  dotenv.config({ path: process.env.FE04_SQL_TEST_ENV_FILE, quiet: true });
} else {
  dotenv.config({ quiet: true });
}

const hasSqlRuntime =
  Boolean(process.env.DB_SERVER && process.env.DB_NAME) &&
  process.env.FE04_SQL_TEST_ALLOW_MUTATION === 'true';

const schemaSource = readFileSync(
  path.join(__dirname, '..', '..', '..', 'database', 'Librarymanagement.sql'),
  'utf8'
);
const membershipRepositorySource = readFileSync(
  path.join(__dirname, '..', '..', 'src', 'repositories', 'membershipRepository.js'),
  'utf8'
);
const membershipServiceSource = readFileSync(
  path.join(__dirname, '..', '..', 'src', 'services', 'membershipService.js'),
  'utf8'
);
const membershipApplicationModelSource = readFileSync(
  path.join(__dirname, '..', '..', 'src', 'models', 'MembershipApplication.js'),
  'utf8'
);
const databaseAdrSource = readFileSync(
  path.join(__dirname, '..', '..', '..', '.sdd', 'rfcs', 'ADR-002-database-design.md'),
  'utf8'
);
const migrationPath = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'database',
  'migrations',
  '2026-07-19-fe04-membership-concurrency.sql'
);

const { sql, getPool, resetPoolForTests } = require('../../src/config/db');
const membershipRepository = require('../../src/repositories/membershipRepository');
const { createMembershipService } = require('../../src/services/membershipService');

jest.setTimeout(30000);

let pool;
let seedNumber = 0;
let activeSeed;

function createSeed() {
  seedNumber += 1;
  return {
    key: `fe04sql${Date.now()}${process.pid}${seedNumber}`,
    userIds: [],
    applicationIds: [],
  };
}

async function insertUser(seed, suffix) {
  const result = await pool
    .request()
    .input('Username', sql.NVarChar(50), `${seed.key}-${suffix}`.slice(0, 50))
    .input('Email', sql.NVarChar(100), `${seed.key}.${suffix}@example.test`.slice(0, 100))
    .input('PasswordHash', sql.NVarChar(255), 'fe04-sql-test-password-hash')
    .query(`
      INSERT INTO Users (Username, Email, PasswordHash, Status, EmailVerifiedAt)
      OUTPUT INSERTED.UserId
      VALUES (@Username, @Email, @PasswordHash, 'ACTIVE', GETDATE())
    `);

  const userId = result.recordset[0].UserId;
  seed.userIds.push(userId);
  return userId;
}

async function captureApplicationIds(seed) {
  for (const userId of seed.userIds) {
    const result = await pool
      .request()
      .input('UserId', sql.Int, userId)
      .query('SELECT ApplicationId FROM MembershipApplications WHERE UserId = @UserId');

    for (const row of result.recordset) {
      if (!seed.applicationIds.includes(row.ApplicationId)) {
        seed.applicationIds.push(row.ApplicationId);
      }
    }
  }
}

async function cleanSeed(seed) {
  await captureApplicationIds(seed);

  for (const applicationId of seed.applicationIds) {
    await pool
      .request()
      .input('ApplicationId', sql.Int, applicationId)
      .query(`
        DELETE FROM AuditLogs
        WHERE TargetType = 'MEMBERSHIP_APPLICATION'
          AND TargetId = @ApplicationId
      `);
  }

  for (const userId of seed.userIds) {
    await pool
      .request()
      .input('UserId', sql.Int, userId)
      .query('DELETE FROM AuditLogs WHERE UserId = @UserId');
    await pool
      .request()
      .input('UserId', sql.Int, userId)
      .query('DELETE FROM MembershipApplications WHERE UserId = @UserId');
    await pool.request().input('UserId', sql.Int, userId).query('DELETE FROM Members WHERE UserId = @UserId');
    await pool.request().input('UserId', sql.Int, userId).query('DELETE FROM UserRoles WHERE UserId = @UserId');
    await pool.request().input('UserId', sql.Int, userId).query('DELETE FROM UserProfiles WHERE UserId = @UserId');
    await pool.request().input('UserId', sql.Int, userId).query('DELETE FROM AuthTokens WHERE UserId = @UserId');
    await pool.request().input('UserId', sql.Int, userId).query('DELETE FROM Users WHERE UserId = @UserId');
  }
}

function makeBarrier(expectedArrivals, label) {
  let arrivals = 0;
  let release;
  let reject;
  const promise = new Promise((resolve, rejectPromise) => {
    release = resolve;
    reject = rejectPromise;
  });
  const timeout = setTimeout(() => {
    reject(new Error(`${label} expected ${expectedArrivals} concurrent arrivals.`));
  }, 5000);

  return async function wait() {
    arrivals += 1;
    if (arrivals === expectedArrivals) {
      clearTimeout(timeout);
      release();
    }
    await promise;
  };
}

function installConcurrentApplyBarrier() {
  const originalQuery = sql.Request.prototype.query;
  const wait = makeBarrier(2, 'FE04 concurrent apply barrier');

  sql.Request.prototype.query = async function queryWithApplyBarrier(queryText, ...args) {
    if (
      typeof queryText === 'string' &&
      queryText.includes('INSERT INTO MembershipApplications') &&
      queryText.includes("VALUES (@UserId, 'PENDING'")
    ) {
      await wait();
    }
    return originalQuery.call(this, queryText, ...args);
  };

  return () => {
    sql.Request.prototype.query = originalQuery;
  };
}

function installConcurrentReviewBarrier() {
  const originalQuery = sql.Request.prototype.query;
  const wait = makeBarrier(2, 'FE04 concurrent review barrier');

  sql.Request.prototype.query = async function queryWithReviewBarrier(queryText, ...args) {
    if (
      typeof queryText === 'string' &&
      queryText.includes('SELECT TOP 1 ApplicationId, UserId, Status') &&
      queryText.includes('FROM MembershipApplications')
    ) {
      await wait();
    }
    return originalQuery.call(this, queryText, ...args);
  };

  return () => {
    sql.Request.prototype.query = originalQuery;
  };
}

async function getState(userId) {
  const result = await pool
    .request()
    .input('UserId', sql.Int, userId)
    .query(`
      SELECT ApplicationId, Status, ApprovedAt, ReviewedBy, ReviewNote
      FROM MembershipApplications
      WHERE UserId = @UserId
      ORDER BY ApplicationId ASC;

      SELECT MemberId, Status, ApprovedAt, ApprovedBy
      FROM Members
      WHERE UserId = @UserId;
    `);

  return {
    applications: result.recordsets[0],
    members: result.recordsets[1],
  };
}

// @spec BR-FE04-003 BR-FE04-015 AC-FE04-002
test('schema enforces at most one pending membership application per user', () => {
  expect(schemaSource).toMatch(
    /CREATE\s+UNIQUE\s+INDEX[\s\S]{0,250}ON\s+MembershipApplications\s*\(\s*UserId\s*\)[\s\S]{0,150}WHERE\s+Status\s*=\s*'PENDING'/i
  );
});

// @spec BR-FE04-003 BR-FE04-015 AC-FE04-002
test('model, ADR, and idempotent migration expose the pending-only uniqueness contract', () => {
  expect(membershipApplicationModelSource).toMatch(
    /indexes[\s\S]{0,300}UX_MembershipApplications_User_Pending[\s\S]{0,300}unique:\s*true[\s\S]{0,300}status:\s*'PENDING'/i
  );
  expect(databaseAdrSource).toContain('2026-07-19-fe04-membership-concurrency.sql');
  expect(existsSync(migrationPath)).toBe(true);

  const migrationSource = readFileSync(migrationPath, 'utf8');
  expect(migrationSource).toMatch(/sys\.indexes[\s\S]{0,500}UX_MembershipApplications_User_Pending/i);
  expect(migrationSource).toMatch(
    /CREATE\s+UNIQUE\s+INDEX\s+UX_MembershipApplications_User_Pending[\s\S]{0,250}WHERE\s+Status\s*=\s*'PENDING'/i
  );
});

// @spec BR-FE04-008 BR-FE04-015 AC-FE04-006
test('membership review locks the pending row and updates only the pending state', () => {
  expect(membershipRepositorySource).toMatch(
    /FROM\s+MembershipApplications\s+WITH\s*\(\s*UPDLOCK\s*,\s*HOLDLOCK\s*\)/i
  );
  expect(membershipRepositorySource).toMatch(
    /UPDATE\s+MembershipApplications[\s\S]{0,500}WHERE\s+ApplicationId\s*=\s*@ApplicationId[\s\S]{0,100}Status\s*=\s*'PENDING'/i
  );
});

// @spec BR-FE04-013 BR-FE04-015 FR-FE04-011 AC-FE04-001 AC-FE04-003 AC-FE04-004
test('membership mutation and audit share one SQL transaction with rollback', () => {
  const mutationSource = `${membershipRepositorySource}\n${membershipServiceSource}`;
  expect(mutationSource).toMatch(/auditLogRepository\.create\([\s\S]{0,500}transaction/i);
  expect(membershipRepositorySource).toMatch(/catch\s*\([^)]+\)[\s\S]{0,500}rollback\s*\(/i);
});

const runtimeDescribe = hasSqlRuntime ? describe : describe.skip;

runtimeDescribe('FE04 mutable SQL concurrency evidence', () => {

beforeAll(async () => {
  try {
    pool = await getPool();
  } catch (_error) {
    throw new Error(
      'FE04 SQL test requires reachable SQL Server configuration from FE04_SQL_TEST_ENV_FILE.'
    );
  }
});

afterEach(async () => {
  if (!activeSeed || !pool) return;
  await cleanSeed(activeSeed);
  activeSeed = null;
});

afterAll(async () => {
  try {
    if (pool && activeSeed) {
      await cleanSeed(activeSeed);
      activeSeed = null;
    }
  } finally {
    if (pool) await pool.close();
    resetPoolForTests();
  }
});

// @spec BR-FE04-003 BR-FE04-015 AC-FE04-002
test('concurrent SQL applications create one pending history row and one canonical member', async () => {
  activeSeed = createSeed();
  const userId = await insertUser(activeSeed, 'applicant');
  const restore = installConcurrentApplyBarrier();

  let results;
  try {
    results = await Promise.allSettled([
      membershipRepository.createApplication(userId),
      membershipRepository.createApplication(userId),
    ]);
  } finally {
    restore();
  }

  const successful = results.filter((result) => result.status === 'fulfilled');
  const state = await getState(userId);
  expect(successful).toHaveLength(1);
  expect(state.applications).toHaveLength(1);
  expect(state.applications[0].Status).toBe('PENDING');
  expect(state.members).toHaveLength(1);
  expect(state.members[0].Status).toBe('PENDING');
});

// @spec BR-FE04-008 BR-FE04-015 AC-FE04-006
test('concurrent SQL final reviews allow only one committed decision', async () => {
  activeSeed = createSeed();
  const applicantId = await insertUser(activeSeed, 'review-applicant');
  const librarianId = await insertUser(activeSeed, 'review-librarian');
  const adminId = await insertUser(activeSeed, 'review-admin');
  const application = await membershipRepository.createApplication(applicantId);
  const restore = installConcurrentReviewBarrier();

  let results;
  try {
    results = await Promise.all([
      membershipRepository.approve(application.applicationId, librarianId),
      membershipRepository.reject(application.applicationId, adminId, 'Concurrent rejection.'),
    ]);
  } finally {
    restore();
  }

  const committed = results.filter((result) => result && !result.invalidStatus);
  const rejected = results.filter((result) => result?.invalidStatus);
  const state = await getState(applicantId);
  expect(committed).toHaveLength(1);
  expect(rejected).toHaveLength(1);
  expect(state.applications).toHaveLength(1);
  expect(['APPROVED', 'REJECTED']).toContain(state.applications[0].Status);
  expect(state.members).toHaveLength(1);
  expect(state.members[0].Status).toBe(state.applications[0].Status);
});

// @spec BR-FE04-009 BR-FE04-010 FR-FE04-004 FR-FE04-005 AC-FE04-003 AC-FE04-004
test('SQL approval shares one timestamp while rejection keeps member approval fields null', async () => {
  activeSeed = createSeed();
  const approvedApplicantId = await insertUser(activeSeed, 'timestamp-approved-applicant');
  const rejectedApplicantId = await insertUser(activeSeed, 'timestamp-rejected-applicant');
  const reviewerId = await insertUser(activeSeed, 'timestamp-reviewer');

  const approvedApplication = await membershipRepository.createApplication(approvedApplicantId);
  await membershipRepository.approve(approvedApplication.applicationId, reviewerId);
  const approvedState = await getState(approvedApplicantId);

  expect(approvedState.applications[0].Status).toBe('APPROVED');
  expect(approvedState.members[0].Status).toBe('APPROVED');
  expect(new Date(approvedState.applications[0].ApprovedAt).getTime()).toBe(
    new Date(approvedState.members[0].ApprovedAt).getTime()
  );
  expect(approvedState.applications[0].ReviewedBy).toBe(reviewerId);
  expect(approvedState.members[0].ApprovedBy).toBe(reviewerId);

  const rejectedApplication = await membershipRepository.createApplication(rejectedApplicantId);
  await membershipRepository.reject(
    rejectedApplication.applicationId,
    reviewerId,
    'SQL rejection reason.'
  );
  const rejectedState = await getState(rejectedApplicantId);

  expect(rejectedState.applications[0]).toEqual(
    expect.objectContaining({
      Status: 'REJECTED',
      ApprovedAt: null,
      ReviewedBy: reviewerId,
      ReviewNote: 'SQL rejection reason.',
    })
  );
  expect(rejectedState.members[0]).toEqual(
    expect.objectContaining({ Status: 'REJECTED', ApprovedAt: null, ApprovedBy: null })
  );
});

// @spec BR-FE04-016 FR-FE04-010 AC-FE04-009
test('SQL reapplication preserves rejected history and resets the canonical member to pending', async () => {
  activeSeed = createSeed();
  const applicantId = await insertUser(activeSeed, 'reapply-applicant');
  const reviewerId = await insertUser(activeSeed, 'reapply-reviewer');
  const firstApplication = await membershipRepository.createApplication(applicantId);
  await membershipRepository.reject(
    firstApplication.applicationId,
    reviewerId,
    'Correct the submitted information.'
  );
  const rejectedState = await getState(applicantId);
  const rejectedSnapshot = {
    applicationId: rejectedState.applications[0].ApplicationId,
    status: rejectedState.applications[0].Status,
    reviewedBy: rejectedState.applications[0].ReviewedBy,
    reviewNote: rejectedState.applications[0].ReviewNote,
  };

  const secondApplication = await membershipRepository.createApplication(applicantId);
  const reappliedState = await getState(applicantId);

  expect(secondApplication.applicationId).not.toBe(rejectedSnapshot.applicationId);
  expect(reappliedState.applications).toHaveLength(2);
  expect(reappliedState.applications[0]).toEqual(
    expect.objectContaining({
      ApplicationId: rejectedSnapshot.applicationId,
      Status: rejectedSnapshot.status,
      ReviewedBy: rejectedSnapshot.reviewedBy,
      ReviewNote: rejectedSnapshot.reviewNote,
    })
  );
  expect(reappliedState.applications[1]).toEqual(
    expect.objectContaining({ Status: 'PENDING', ApprovedAt: null, ReviewedBy: null })
  );
  expect(reappliedState.members).toHaveLength(1);
  expect(reappliedState.members[0]).toEqual(
    expect.objectContaining({ Status: 'PENDING', ApprovedAt: null, ApprovedBy: null })
  );
});

// @spec BR-FE04-015 FR-FE04-011 AC-FE04-001
test('SQL application and canonical member roll back when the audit write fails', async () => {
  activeSeed = createSeed();
  const applicantId = await insertUser(activeSeed, 'apply-rollback');
  const service = createMembershipService({
    membershipRepository,
    auditLogRepository: {
      async create() {
        throw new Error('injected FE04 SQL audit failure');
      },
    },
  });

  await expect(
    service.apply(
      { userId: applicantId, roles: ['MEMBER'] },
      { ip: '127.0.0.1', userAgent: 'fe04-sql-test' }
    )
  ).rejects.toThrow('injected FE04 SQL audit failure');

  const state = await getState(applicantId);
  expect(state.applications).toHaveLength(0);
  expect(state.members).toHaveLength(0);
});

// @spec BR-FE04-013 BR-FE04-015 FR-FE04-011 AC-FE04-003
test('SQL review decision rolls back when the audit write fails', async () => {
  activeSeed = createSeed();
  const applicantId = await insertUser(activeSeed, 'review-rollback-applicant');
  const reviewerId = await insertUser(activeSeed, 'review-rollback-admin');
  const application = await membershipRepository.createApplication(applicantId);
  const service = createMembershipService({
    membershipRepository,
    auditLogRepository: {
      async create() {
        throw new Error('injected FE04 SQL review audit failure');
      },
    },
  });

  await expect(
    service.approve(
      application.applicationId,
      { userId: reviewerId, roles: ['ADMIN'] },
      { ip: '127.0.0.1', userAgent: 'fe04-sql-test' }
    )
  ).rejects.toThrow('injected FE04 SQL review audit failure');

  const state = await getState(applicantId);
  expect(state.applications).toHaveLength(1);
  expect(state.applications[0].Status).toBe('PENDING');
  expect(state.members).toHaveLength(1);
  expect(state.members[0].Status).toBe('PENDING');
});
});
