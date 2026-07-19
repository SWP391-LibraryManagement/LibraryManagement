const dotenv = require('dotenv');
const { readFileSync } = require('fs');
const path = require('path');

if (process.env.FE09_SQL_TEST_ENV_FILE) {
  dotenv.config({ path: process.env.FE09_SQL_TEST_ENV_FILE, quiet: true });
} else {
  dotenv.config({ quiet: true });
}

const hasSqlRuntime =
  Boolean(process.env.DB_SERVER && process.env.DB_NAME) &&
  process.env.FE09_SQL_TEST_ALLOW_MUTATION === 'true';

const fineRepositorySource = readFileSync(
  path.join(__dirname, '..', '..', 'src', 'repositories', 'fineRepository.js'),
  'utf8'
);
const fineServiceSource = readFileSync(
  path.join(__dirname, '..', '..', 'src', 'services', 'fineManagementService.js'),
  'utf8'
);

const { sql, getPool, resetPoolForTests } = require('../../src/config/db');
const fineRepository = require('../../src/repositories/fineRepository');
const borrowingRepository = require('../../src/repositories/borrowingRepository');
const { createFineManagementService } = require('../../src/services/fineManagementService');

jest.setTimeout(30000);

let pool;
let seedNumber = 0;
let activeSeed;

function createSeed() {
  seedNumber += 1;
  return {
    key: `fe09sql${Date.now()}${process.pid}${seedNumber}`,
    userIds: [],
    categoryIds: [],
    bookIds: [],
    copyIds: [],
    requestIds: [],
    borrowDetailIds: [],
    fineIds: [],
  };
}

async function insertUser(seed, suffix) {
  const result = await pool
    .request()
    .input('Username', sql.NVarChar(50), `${seed.key}-${suffix}`.slice(0, 50))
    .input('Email', sql.NVarChar(100), `${seed.key}.${suffix}@example.test`.slice(0, 100))
    .input('PasswordHash', sql.NVarChar(255), 'fe09-sql-test-password-hash')
    .query(`
      INSERT INTO Users (Username, Email, PasswordHash, Status, EmailVerifiedAt)
      OUTPUT INSERTED.UserId
      VALUES (@Username, @Email, @PasswordHash, 'ACTIVE', GETDATE())
    `);

  const userId = result.recordset[0].UserId;
  seed.userIds.push(userId);
  return userId;
}

async function insertBorrowDetail(seed, { memberId, staffId, suffix, dueDate, returnDate }) {
  const categoryResult = await pool
    .request()
    .input('CategoryName', sql.NVarChar(100), `${seed.key}-${suffix}-category`.slice(0, 100))
    .query('INSERT INTO Categories (CategoryName) OUTPUT INSERTED.CategoryId VALUES (@CategoryName)');
  const categoryId = categoryResult.recordset[0].CategoryId;
  seed.categoryIds.push(categoryId);

  const bookResult = await pool
    .request()
    .input('Title', sql.NVarChar(255), `${seed.key}-${suffix}-book`)
    .input('CategoryId', sql.Int, categoryId)
    .input('CreatedBy', sql.Int, staffId)
    .query(`
      INSERT INTO Books (Title, CategoryId, Status, CreatedBy)
      OUTPUT INSERTED.BookId
      VALUES (@Title, @CategoryId, 'ACTIVE', @CreatedBy)
    `);
  const bookId = bookResult.recordset[0].BookId;
  seed.bookIds.push(bookId);

  const copyResult = await pool
    .request()
    .input('BookId', sql.Int, bookId)
    .input('Barcode', sql.NVarChar(100), `${seed.key}-${suffix}-copy`.slice(0, 100))
    .query(`
      INSERT INTO BookCopies (BookId, Barcode, Status)
      OUTPUT INSERTED.CopyId
      VALUES (@BookId, @Barcode, 'AVAILABLE')
    `);
  const copyId = copyResult.recordset[0].CopyId;
  seed.copyIds.push(copyId);

  const requestResult = await pool
    .request()
    .input('UserId', sql.Int, memberId)
    .input('CreatedBy', sql.Int, staffId)
    .query(`
      INSERT INTO BorrowRequests (UserId, Status, CreatedBy, ApprovedBy, ApprovedAt)
      OUTPUT INSERTED.RequestId
      VALUES (@UserId, 'APPROVED', @CreatedBy, @CreatedBy, GETDATE())
    `);
  const requestId = requestResult.recordset[0].RequestId;
  seed.requestIds.push(requestId);

  const detailResult = await pool
    .request()
    .input('RequestId', sql.Int, requestId)
    .input('CopyId', sql.Int, copyId)
    .input('DueDate', sql.Date, new Date(`${dueDate}T00:00:00.000Z`))
    .input('ReturnDate', sql.Date, new Date(`${returnDate}T00:00:00.000Z`))
    .query(`
      INSERT INTO BorrowDetails (RequestId, CopyId, DueDate, ReturnDate, Status)
      OUTPUT INSERTED.BorrowDetailId
      VALUES (@RequestId, @CopyId, @DueDate, @ReturnDate, 'RETURNED')
    `);
  const borrowDetailId = detailResult.recordset[0].BorrowDetailId;
  seed.borrowDetailIds.push(borrowDetailId);
  return borrowDetailId;
}

async function insertFine(seed, { userId, borrowDetailId, staffId, status = 'UNPAID' }) {
  const paid = status === 'PAID';
  const result = await pool
    .request()
    .input('UserId', sql.Int, userId)
    .input('BorrowDetailId', sql.Int, borrowDetailId)
    .input('CreatedBy', sql.Int, staffId)
    .input('CollectedBy', sql.Int, paid ? staffId : null)
    .input('Status', sql.NVarChar(20), status)
    .input('PaidAt', sql.DateTime, paid ? new Date('2026-06-10T00:00:00.000Z') : null)
    .input('PaymentMethod', sql.NVarChar(50), paid ? 'CASH' : null)
    .query(`
      INSERT INTO Fines (
        UserId, BorrowDetailId, OverdueDays, RatePerDay, Amount, PaidAmount, Reason,
        Status, CalculatedAt, PaidAt, CreatedBy, CollectedBy, PaymentMethod
      )
      OUTPUT INSERTED.FineId
      VALUES (
        @UserId, @BorrowDetailId, 7, 5000, 35000,
        CASE WHEN @Status = 'PAID' THEN 35000 ELSE 0 END,
        'OVERDUE', @Status, GETDATE(), @PaidAt, @CreatedBy, @CollectedBy, @PaymentMethod
      )
    `);

  const fineId = result.recordset[0].FineId;
  seed.fineIds.push(fineId);
  return fineId;
}

async function captureFineIds(seed) {
  for (const borrowDetailId of seed.borrowDetailIds) {
    const result = await pool
      .request()
      .input('BorrowDetailId', sql.Int, borrowDetailId)
      .query('SELECT FineId FROM Fines WHERE BorrowDetailId = @BorrowDetailId');
    for (const row of result.recordset) {
      if (!seed.fineIds.includes(row.FineId)) seed.fineIds.push(row.FineId);
    }
  }
}

async function cleanSeed(seed) {
  await captureFineIds(seed);

  for (const fineId of seed.fineIds) {
    await pool
      .request()
      .input('FineId', sql.Int, fineId)
      .query("DELETE FROM AuditLogs WHERE TargetType = 'FINE' AND TargetId = @FineId");
  }
  for (const userId of seed.userIds) {
    await pool.request().input('UserId', sql.Int, userId).query('DELETE FROM AuditLogs WHERE UserId = @UserId');
  }
  for (const borrowDetailId of seed.borrowDetailIds) {
    await pool
      .request()
      .input('BorrowDetailId', sql.Int, borrowDetailId)
      .query('DELETE FROM Fines WHERE BorrowDetailId = @BorrowDetailId');
    await pool
      .request()
      .input('BorrowDetailId', sql.Int, borrowDetailId)
      .query('DELETE FROM BorrowDetails WHERE BorrowDetailId = @BorrowDetailId');
  }
  for (const requestId of seed.requestIds) {
    await pool.request().input('RequestId', sql.Int, requestId).query('DELETE FROM BorrowRequests WHERE RequestId = @RequestId');
  }
  for (const copyId of seed.copyIds) {
    await pool.request().input('CopyId', sql.Int, copyId).query('DELETE FROM BookCopies WHERE CopyId = @CopyId');
  }
  for (const bookId of seed.bookIds) {
    await pool.request().input('BookId', sql.Int, bookId).query('DELETE FROM Books WHERE BookId = @BookId');
  }
  for (const categoryId of seed.categoryIds) {
    await pool.request().input('CategoryId', sql.Int, categoryId).query('DELETE FROM Categories WHERE CategoryId = @CategoryId');
  }
  for (const userId of seed.userIds) {
    await pool.request().input('UserId', sql.Int, userId).query('DELETE FROM Users WHERE UserId = @UserId');
  }
}

function makeBarrier(expectedArrivals, label) {
  let arrivals = 0;
  let release;
  let reject;
  const barrier = new Promise((resolve, rejectPromise) => {
    release = resolve;
    reject = rejectPromise;
  });
  const timeout = setTimeout(() => reject(new Error(`${label} timed out.`)), 5000);

  return async function wait() {
    arrivals += 1;
    if (arrivals === expectedArrivals) {
      clearTimeout(timeout);
      release();
    }
    await barrier;
  };
}

function installCreateBarrier() {
  const originalQuery = sql.Request.prototype.query;
  const wait = makeBarrier(2, 'FE09 concurrent create barrier');

  sql.Request.prototype.query = async function queryWithBarrier(queryText, ...args) {
    if (
      typeof queryText === 'string' &&
      queryText.includes('FROM Fines WITH (UPDLOCK, HOLDLOCK)') &&
      queryText.includes('BorrowDetailId = @BorrowDetailId')
    ) {
      await wait();
    }
    return originalQuery.call(this, queryText, ...args);
  };

  return () => {
    sql.Request.prototype.query = originalQuery;
  };
}

// @spec AC-FE09-005 NFR-FE09-TXN-001
test('fine calculation locks duplicate detection before inserting an active fine', () => {
  const lockIndex = fineRepositorySource.indexOf('FROM Fines WITH (UPDLOCK, HOLDLOCK)');
  const insertIndex = fineRepositorySource.indexOf('INSERT INTO Fines');

  expect(lockIndex).toBeGreaterThanOrEqual(0);
  expect(insertIndex).toBeGreaterThan(lockIndex);
  expect(fineRepositorySource).toMatch(/new sql\.Transaction|sql\.Transaction\s*\(/);
  expect(fineRepositorySource).toMatch(/\.rollback\s*\(/);
});

// @spec AC-FE09-006 AC-FE09-012 BR-FE09-016 BR-FE09-017
test('collection owns the full amount and has no partial-payment repository input', () => {
  expect(fineRepositorySource).not.toMatch(/recordCollection\s*\(\s*\{[^}]*collectedAmount/i);
  expect(fineServiceSource).not.toMatch(/input\.collectedAmount|INVALID_COLLECTED_AMOUNT/);
  expect(fineRepositorySource).toMatch(/SET\s+PaidAmount\s*=\s*Amount/i);
  expect(fineRepositorySource).toMatch(/Status\s*=\s*'PAID'/i);
});

// @spec AC-FE09-005 AC-FE09-006 AC-FE09-013 NFR-FE09-TXN-001 NFR-FE09-TXN-002
test('fine mutation and audit share one SQL transaction with rollback', () => {
  const mutationSource = `${fineRepositorySource}\n${fineServiceSource}`;
  expect(mutationSource).toMatch(/auditLogRepository\.create\([\s\S]{0,500}transaction/i);
  expect(fineRepositorySource).toMatch(/catch\s*\([^)]+\)[\s\S]{0,500}rollback\s*\(/i);
});

async function getFinesForBorrowDetail(borrowDetailId) {
  const result = await pool
    .request()
    .input('BorrowDetailId', sql.Int, borrowDetailId)
    .query(`
      SELECT FineId, Status, Amount, PaidAmount, PaidAt, CollectedBy, PaymentMethod
      FROM Fines
      WHERE BorrowDetailId = @BorrowDetailId
      ORDER BY FineId ASC
    `);
  return result.recordset;
}

const runtimeDescribe = hasSqlRuntime ? describe : describe.skip;

runtimeDescribe('FE09 mutable SQL concurrency evidence', () => {
beforeAll(async () => {
  try {
    pool = await getPool();
  } catch (_error) {
    throw new Error('FE09 SQL test requires reachable SQL Server configuration from FE09_SQL_TEST_ENV_FILE.');
  }
});

afterEach(async () => {
  if (!activeSeed || !pool) return;
  await cleanSeed(activeSeed);
  activeSeed = null;
});

afterAll(async () => {
  try {
    if (pool && activeSeed) await cleanSeed(activeSeed);
  } finally {
    if (pool) await pool.close();
    resetPoolForTests();
  }
});

// @spec AC-FE09-005 NFR-FE09-TXN-001
test('concurrent SQL calculation creates at most one active overdue fine', async () => {
  activeSeed = createSeed();
  const staffId = await insertUser(activeSeed, 'calculate-staff');
  const memberId = await insertUser(activeSeed, 'calculate-member');
  const borrowDetailId = await insertBorrowDetail(activeSeed, {
    memberId,
    staffId,
    suffix: 'calculate',
    dueDate: '2026-06-01',
    returnDate: '2026-06-08',
  });
  const restore = installCreateBarrier();

  let results;
  try {
    results = await Promise.allSettled([
      fineRepository.createFine({
        userId: memberId,
        borrowDetailId,
        overdueDays: 7,
        ratePerDay: 5000,
        amount: 35000,
        reason: 'OVERDUE',
        createdBy: staffId,
        calculatedAt: new Date(),
      }),
      fineRepository.createFine({
        userId: memberId,
        borrowDetailId,
        overdueDays: 7,
        ratePerDay: 5000,
        amount: 35000,
        reason: 'OVERDUE',
        createdBy: staffId,
        calculatedAt: new Date(),
      }),
    ]);
  } finally {
    restore();
  }

  const created = results.filter(
    (result) => result.status === 'fulfilled' && result.value?.created === true
  );
  const state = await getFinesForBorrowDetail(borrowDetailId);
  expect(created).toHaveLength(1);
  expect(state.filter((fine) => fine.Status === 'UNPAID')).toHaveLength(1);
});

// @spec AC-FE09-006 AC-FE09-012 NFR-FE09-TXN-002
test('concurrent SQL collection permits one full payment transition', async () => {
  activeSeed = createSeed();
  const staffId = await insertUser(activeSeed, 'collection-staff');
  const memberId = await insertUser(activeSeed, 'collection-member');
  const borrowDetailId = await insertBorrowDetail(activeSeed, {
    memberId,
    staffId,
    suffix: 'collection',
    dueDate: '2026-06-01',
    returnDate: '2026-06-08',
  });
  const fineId = await insertFine(activeSeed, { userId: memberId, borrowDetailId, staffId });

  const results = await Promise.all([
    fineRepository.recordCollection({
      fineId,
      paymentMethod: 'CASH',
      collectedBy: staffId,
      paidAt: new Date(),
    }),
    fineRepository.recordCollection({
      fineId,
      paymentMethod: 'TRANSFER',
      collectedBy: staffId,
      paidAt: new Date(),
    }),
  ]);

  expect(results.filter(Boolean)).toHaveLength(1);
  const state = await getFinesForBorrowDetail(borrowDetailId);
  expect(state).toHaveLength(1);
  expect(state[0].Status).toBe('PAID');
  expect(Number(state[0].PaidAmount)).toBe(Number(state[0].Amount));
});

// @spec AC-FE09-005 NFR-FE09-TXN-001
test('SQL calculation rolls back when the audit write fails', async () => {
  activeSeed = createSeed();
  const staffId = await insertUser(activeSeed, 'calculation-rollback-staff');
  const memberId = await insertUser(activeSeed, 'calculation-rollback-member');
  const borrowDetailId = await insertBorrowDetail(activeSeed, {
    memberId,
    staffId,
    suffix: 'calculation-rollback',
    dueDate: '2026-06-01',
    returnDate: '2026-06-08',
  });
  const service = createFineManagementService({
    fineRepository,
    auditLogRepository: {
      async create() {
        throw new Error('injected FE09 calculation audit failure');
      },
    },
    clock: () => new Date('2026-06-15T00:00:00.000Z'),
  });

  await expect(
    service.calculateFine(
      { borrowDetailId },
      { userId: staffId, roles: ['LIBRARIAN'] },
      { ip: '127.0.0.1', userAgent: 'fe09-sql-test' }
    )
  ).rejects.toThrow('injected FE09 calculation audit failure');

  expect(await getFinesForBorrowDetail(borrowDetailId)).toHaveLength(0);
});

// @spec AC-FE09-006 AC-FE09-012 NFR-FE09-TXN-002
test('SQL collection rolls back payment metadata when the audit write fails', async () => {
  activeSeed = createSeed();
  const staffId = await insertUser(activeSeed, 'collection-rollback-staff');
  const memberId = await insertUser(activeSeed, 'collection-rollback-member');
  const borrowDetailId = await insertBorrowDetail(activeSeed, {
    memberId,
    staffId,
    suffix: 'collection-rollback',
    dueDate: '2026-06-01',
    returnDate: '2026-06-08',
  });
  const fineId = await insertFine(activeSeed, { userId: memberId, borrowDetailId, staffId });
  const service = createFineManagementService({
    fineRepository,
    auditLogRepository: {
      async create() {
        throw new Error('injected FE09 collection audit failure');
      },
    },
    clock: () => new Date('2026-06-15T00:00:00.000Z'),
  });

  await expect(
    service.recordCollection(
      fineId,
      { paymentMethod: 'CASH' },
      { userId: staffId, roles: ['LIBRARIAN'] },
      { ip: '127.0.0.1', userAgent: 'fe09-sql-test' }
    )
  ).rejects.toThrow('injected FE09 collection audit failure');

  const state = await getFinesForBorrowDetail(borrowDetailId);
  expect(state[0]).toEqual(
    expect.objectContaining({
      Status: 'UNPAID',
      PaidAmount: 0,
      PaidAt: null,
      CollectedBy: null,
      PaymentMethod: null,
    })
  );
});

// @spec AC-FE09-005
test('SQL recalculation returns terminal history without creating a new fine', async () => {
  activeSeed = createSeed();
  const staffId = await insertUser(activeSeed, 'terminal-staff');
  const memberId = await insertUser(activeSeed, 'terminal-member');
  const borrowDetailId = await insertBorrowDetail(activeSeed, {
    memberId,
    staffId,
    suffix: 'terminal',
    dueDate: '2026-06-01',
    returnDate: '2026-06-08',
  });
  const fineId = await insertFine(activeSeed, {
    userId: memberId,
    borrowDetailId,
    staffId,
    status: 'PAID',
  });
  const service = createFineManagementService({
    fineRepository,
    auditLogRepository: { async create() {} },
    clock: () => new Date('2026-06-15T00:00:00.000Z'),
  });

  const result = await service.calculateFine(
    { borrowDetailId },
    { userId: staffId, roles: ['LIBRARIAN'] }
  );
  const state = await getFinesForBorrowDetail(borrowDetailId);

  expect(result).toEqual(expect.objectContaining({ created: false }));
  expect(result.fine).toEqual(expect.objectContaining({ fineId, status: 'PAID' }));
  expect(state).toHaveLength(1);
});

// @spec AC-FE09-009 AC-FE09-010
test('SQL borrowing eligibility is blocked only by positive UNPAID fines', async () => {
  activeSeed = createSeed();
  const staffId = await insertUser(activeSeed, 'eligibility-staff');
  const memberId = await insertUser(activeSeed, 'eligibility-member');
  const borrowDetailId = await insertBorrowDetail(activeSeed, {
    memberId,
    staffId,
    suffix: 'eligibility',
    dueDate: '2026-06-01',
    returnDate: '2026-06-08',
  });
  const fineId = await insertFine(activeSeed, { userId: memberId, borrowDetailId, staffId });

  expect(await borrowingRepository.hasBlockingFine(memberId)).toBe(true);

  await pool
    .request()
    .input('FineId', sql.Int, fineId)
    .query(`
      UPDATE Fines
      SET Status = 'PAID', PaidAmount = Amount, PaidAt = GETDATE(), CollectedBy = CreatedBy,
          PaymentMethod = 'CASH'
      WHERE FineId = @FineId
    `);
  expect(await borrowingRepository.hasBlockingFine(memberId)).toBe(false);
});
});
