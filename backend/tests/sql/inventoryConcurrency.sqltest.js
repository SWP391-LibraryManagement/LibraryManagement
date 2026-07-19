const { readFileSync } = require('fs');
const path = require('path');
const dotenv = require('dotenv');

if (process.env.FE06_SQL_TEST_ENV_FILE) {
  dotenv.config({ path: process.env.FE06_SQL_TEST_ENV_FILE, quiet: true });
} else {
  dotenv.config({ quiet: true });
}

const repositoryPath = path.join(__dirname, '..', '..', 'src', 'repositories', 'inventoryRepository.js');
const servicePath = path.join(__dirname, '..', '..', 'src', 'services', 'inventoryService.js');
const modelPath = path.join(__dirname, '..', '..', 'src', 'models', 'BookCopy.js');
const schemaPath = path.join(__dirname, '..', '..', '..', 'database', 'Librarymanagement.sql');
const migrationPath = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'database',
  'migrations',
  '2026-07-19-fe06-bookcopy-rowversion.sql'
);

const repositorySource = readFileSync(repositoryPath, 'utf8');
const serviceSource = readFileSync(servicePath, 'utf8');
const modelSource = readFileSync(modelPath, 'utf8');
const schemaSource = readFileSync(schemaPath, 'utf8');
const migrationSource = readFileSync(migrationPath, 'utf8');

function bookCopiesTableSource() {
  const match = schemaSource.match(/CREATE TABLE BookCopies\s*\(([\s\S]*?)\n\);/i);
  expect(match).not.toBeNull();
  return match[1];
}

// @spec BR-FE06-010, BR-FE06-016, FR-FE06-018, NFR-FE06-TXN-002
test('BookCopies schema exposes SQL rowversion for opaque If-Match concurrency', () => {
  expect(bookCopiesTableSource()).toMatch(/\bVersion\s+(?:ROWVERSION|TIMESTAMP)\b/i);
  expect(bookCopiesTableSource()).not.toMatch(/\bRowVersion\s+(?:ROWVERSION|TIMESTAMP)\b/i);
  expect(modelSource).toMatch(/name:\s*'Version'[\s\S]*type:\s*'ROWVERSION'/i);
  expect(repositorySource).toMatch(/\bbc\.Version\s+AS\s+CopyVersion\b/i);
  expect(migrationSource).toMatch(/COL_LENGTH\('BookCopies',\s*'Version'\)\s+IS\s+NULL/i);
  expect(repositorySource).toMatch(/\bversion\b/i);
});

// @spec BR-FE06-007, BR-FE06-008, NFR-FE06-TXN-002
test('inventory mutation locks BookCopies then BorrowDetails then Reservations', () => {
  const copyLockIndex = repositorySource.search(
    /FROM\s+BookCopies(?:\s+\w+)?\s+WITH\s*\(UPDLOCK,\s*HOLDLOCK\)/i
  );
  const borrowLockIndex = repositorySource.search(
    /FROM\s+BorrowDetails(?:\s+\w+)?\s+WITH\s*\(UPDLOCK,\s*HOLDLOCK\)/i
  );
  const reservationLockIndex = repositorySource.search(
    /FROM\s+Reservations(?:\s+\w+)?\s+WITH\s*\(UPDLOCK,\s*HOLDLOCK\)/i
  );

  expect(copyLockIndex).toBeGreaterThanOrEqual(0);
  expect(borrowLockIndex).toBeGreaterThan(copyLockIndex);
  expect(reservationLockIndex).toBeGreaterThan(borrowLockIndex);
});

// @spec BR-FE06-007, BR-FE06-008, BR-FE06-015, FR-FE06-007, FR-FE06-022
test('locked mutation state enforces workflow conflicts and active parent before update', () => {
  expect(repositorySource).toMatch(
    /INNER JOIN Books b WITH \(UPDLOCK, HOLDLOCK\) ON b\.BookId = bc\.BookId/i
  );
  expect(repositorySource).toMatch(/locked\.borrow[\s\S]{0,250}ACTIVE_BORROW_CONFLICT/i);
  expect(repositorySource).toMatch(/locked\.reservation[\s\S]{0,250}RESERVATION_STATE_CONFLICT/i);
  expect(repositorySource).toMatch(/locked\.row\.BookStatus[\s\S]{0,250}INACTIVE_PARENT_BOOK/i);
  expect(repositorySource).toMatch(
    /FROM Books WITH \(UPDLOCK, HOLDLOCK\)[\s\S]{0,500}INACTIVE_PARENT_BOOK/i
  );
});

// @spec BR-FE06-016, FR-FE06-018, AC-FE06-012, NFR-FE06-TXN-002
test('stale version comparison happens inside the mutation transaction before any update', () => {
  expect(repositorySource).toMatch(/new sql\.Transaction|sql\.Transaction\s*\(/);
  expect(repositorySource).toMatch(/\.begin\s*\(/);
  expect(repositorySource).toMatch(/\.commit\s*\(/);
  expect(repositorySource).toMatch(/\.rollback\s*\(/);
  expect(repositorySource).toMatch(/(?:RowVersion|Version)[\s\S]{0,200}(?:IfMatch|ExpectedVersion|@Version)/i);

  const versionCheckIndex = repositorySource.search(/(?:RowVersion|Version)[\s\S]{0,200}(?:IfMatch|ExpectedVersion|@Version)/i);
  const updateIndex = repositorySource.search(/UPDATE\s+BookCopies/i);
  expect(versionCheckIndex).toBeGreaterThanOrEqual(0);
  expect(updateIndex).toBeGreaterThan(versionCheckIndex);
});

// @spec BR-FE06-012, FR-FE06-019, AC-FE06-006, NFR-FE06-TXN-001
test('copy mutation and audit share one transaction with rollback on audit failure', () => {
  const mutationSource = `${repositorySource}\n${serviceSource}`;
  expect(mutationSource).toMatch(/auditLogRepository\.create/);
  expect(mutationSource).toMatch(/auditLogRepository\.create\([\s\S]{0,500}transaction/i);
  expect(repositorySource).toMatch(/catch\s*\([^)]+\)[\s\S]{0,500}rollback\s*\(/i);
});

// @spec BR-FE06-010, FR-FE06-017
test('FE06 repository has no physical BookCopies delete path', () => {
  expect(repositorySource).not.toMatch(/DELETE\s+FROM\s+BookCopies/i);
  expect(repositorySource).toMatch(/UPDATE\s+BookCopies/i);
  expect(serviceSource).toMatch(/INACTIVE/);
});

const hasSqlRuntime =
  Boolean(process.env.DB_SERVER && process.env.DB_NAME) &&
  process.env.FE06_SQL_TEST_ALLOW_MUTATION === 'true';
const runtimeDescribe = hasSqlRuntime ? describe : describe.skip;

// Runtime SQL evidence is deliberately opt-in because it mutates a disposable SQL database.
runtimeDescribe('FE06 live SQL transactional rechecks', () => {
  const { getPool, resetPoolForTests } = require('../../src/config/db');
  const { sql } = require('../../src/config/db');
  const inventoryRepository = require('../../src/repositories/inventoryRepository');
  const { createInventoryService } = require('../../src/services/inventoryService');
  let pool;
  let seedNumber = 0;
  let activeSeed;

  jest.setTimeout(30000);

  function makeKey() {
    seedNumber += 1;
    return `fe06sql${Date.now()}${process.pid}${seedNumber}`;
  }

  async function createSeed() {
    const key = makeKey();
    const userResult = await pool.request()
      .input('Username', sql.NVarChar(50), key.slice(0, 50))
      .input('Email', sql.NVarChar(255), `${key}@example.test`)
      .input('PasswordHash', sql.NVarChar(255), 'fe06-sql-test-password-hash')
      .query(`
        INSERT INTO Users (Username, Email, PasswordHash, Status, EmailVerifiedAt)
        OUTPUT INSERTED.UserId
        VALUES (@Username, @Email, @PasswordHash, 'ACTIVE', GETDATE())
      `);
    const userId = userResult.recordset[0].UserId;
    const bookResult = await pool.request()
      .input('Title', sql.NVarChar(255), `${key}-book`)
      .input('CreatedBy', sql.Int, userId)
      .query(`
        INSERT INTO Books (Title, Status, CreatedBy)
        OUTPUT INSERTED.BookId
        VALUES (@Title, 'ACTIVE', @CreatedBy)
      `);
    const bookId = bookResult.recordset[0].BookId;
    const copyResult = await pool.request()
      .input('BookId', sql.Int, bookId)
      .input('Barcode', sql.NVarChar(100), `${key}-copy`.slice(0, 100))
      .query(`
        INSERT INTO BookCopies (BookId, Barcode, Status, Location)
        OUTPUT INSERTED.CopyId
        VALUES (@BookId, @Barcode, 'AVAILABLE', 'FE06 SQL shelf')
      `);
    const copyId = copyResult.recordset[0].CopyId;
    const requestResult = await pool.request()
      .input('UserId', sql.Int, userId)
      .query(`
        INSERT INTO BorrowRequests (UserId, Status, CreatedBy)
        OUTPUT INSERTED.RequestId
        VALUES (@UserId, 'PENDING', @UserId)
      `);

    activeSeed = {
      key,
      userId,
      bookId,
      copyId,
      requestId: requestResult.recordset[0].RequestId,
    };
    return activeSeed;
  }

  async function cleanup() {
    if (!pool || !activeSeed) return;
    const seed = activeSeed;
    await pool.request().input('CopyId', sql.Int, seed.copyId)
      .query("DELETE FROM AuditLogs WHERE TargetType = 'BOOK_COPY' AND TargetId = @CopyId");
    await pool.request().input('CopyId', sql.Int, seed.copyId)
      .query('DELETE FROM Reservations WHERE CopyId = @CopyId');
    await pool.request().input('RequestId', sql.Int, seed.requestId)
      .query('DELETE FROM BorrowDetails WHERE RequestId = @RequestId');
    await pool.request().input('RequestId', sql.Int, seed.requestId)
      .query('DELETE FROM BorrowRequests WHERE RequestId = @RequestId');
    await pool.request().input('CopyId', sql.Int, seed.copyId)
      .query('DELETE FROM BookCopies WHERE CopyId = @CopyId');
    await pool.request().input('BookId', sql.Int, seed.bookId)
      .query('DELETE FROM Books WHERE BookId = @BookId');
    await pool.request().input('UserId', sql.Int, seed.userId)
      .query('DELETE FROM Users WHERE UserId = @UserId');
    activeSeed = null;
  }

  function makeService(methodName, beforeMutation) {
    const repository = {
      ...inventoryRepository,
      [methodName]: async (...args) => {
        await beforeMutation(activeSeed);
        return inventoryRepository[methodName](...args);
      },
    };
    return createInventoryService({
      inventoryRepository: repository,
      auditLogRepository: { create: async () => undefined },
    });
  }

  function actor(seed) {
    return { userId: seed.userId, roles: ['LIBRARIAN'] };
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

  test('configured SQL Server exposes a BookCopies rowversion column', async () => {
    const result = await pool.request().query(`
      SELECT c.name AS ColumnName, t.name AS TypeName
      FROM sys.columns c
      INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
      WHERE c.object_id = OBJECT_ID('BookCopies')
        AND t.name IN ('timestamp', 'rowversion')
    `);

    expect(result.recordset).toHaveLength(1);
  });

  test('live SQL rejects a borrow inserted after the service precheck', async () => {
    const seed = await createSeed();
    const current = await inventoryRepository.findCopyById(seed.copyId);
    const service = makeService('updateCopyStatus', async (raceSeed) => {
      await pool.request()
        .input('RequestId', sql.Int, raceSeed.requestId)
        .input('CopyId', sql.Int, raceSeed.copyId)
        .query(`
          INSERT INTO BorrowDetails (RequestId, CopyId, Status)
          VALUES (@RequestId, @CopyId, 'BORROWED')
        `);
    });

    await expect(service.updateCopyStatus(
      seed.copyId,
      { status: 'DAMAGED', reason: 'Race check' },
      actor(seed),
      {},
      current.version
    )).rejects.toMatchObject({ statusCode: 409, code: 'ACTIVE_BORROW_CONFLICT' });

    expect((await inventoryRepository.findCopyById(seed.copyId)).status).toBe('AVAILABLE');
  });

  test('live SQL rejects a reservation inserted after the service precheck', async () => {
    const seed = await createSeed();
    const current = await inventoryRepository.findCopyById(seed.copyId);
    const service = makeService('updateCopyStatus', async (raceSeed) => {
      await pool.request()
        .input('UserId', sql.Int, raceSeed.userId)
        .input('CopyId', sql.Int, raceSeed.copyId)
        .query(`
          INSERT INTO Reservations (UserId, CopyId, Status)
          VALUES (@UserId, @CopyId, 'ACTIVE')
        `);
    });

    await expect(service.updateCopyStatus(
      seed.copyId,
      { status: 'DAMAGED', reason: 'Race check' },
      actor(seed),
      {},
      current.version
    )).rejects.toMatchObject({ statusCode: 409, code: 'RESERVATION_STATE_CONFLICT' });

    expect((await inventoryRepository.findCopyById(seed.copyId)).status).toBe('AVAILABLE');
  });

  test('live SQL rejects parent deactivation after precheck for status and create mutations', async () => {
    const seed = await createSeed();
    await pool.request().input('CopyId', sql.Int, seed.copyId)
      .query("UPDATE BookCopies SET Status = 'DAMAGED' WHERE CopyId = @CopyId");
    const current = await inventoryRepository.findCopyById(seed.copyId);
    const statusService = makeService('updateCopyStatus', async (raceSeed) => {
      await pool.request().input('BookId', sql.Int, raceSeed.bookId)
        .query("UPDATE Books SET Status = 'INACTIVE' WHERE BookId = @BookId");
    });

    await expect(statusService.updateCopyStatus(
      seed.copyId,
      { status: 'AVAILABLE', reason: 'Repair completed' },
      actor(seed),
      {},
      current.version
    )).rejects.toMatchObject({ statusCode: 409, code: 'INACTIVE_PARENT_BOOK' });
    expect((await inventoryRepository.findCopyById(seed.copyId)).status).toBe('DAMAGED');

    await pool.request().input('BookId', sql.Int, seed.bookId)
      .query("UPDATE Books SET Status = 'ACTIVE' WHERE BookId = @BookId");
    const createService = makeService('createCopy', async (raceSeed) => {
      await pool.request().input('BookId', sql.Int, raceSeed.bookId)
        .query("UPDATE Books SET Status = 'INACTIVE' WHERE BookId = @BookId");
    });

    await expect(createService.createCopy(
      seed.bookId,
      { barcode: `${seed.key}-raced-create`.slice(0, 100) },
      actor(seed),
      {}
    )).rejects.toMatchObject({ statusCode: 409, code: 'INACTIVE_PARENT_BOOK' });
    const racedCopy = await inventoryRepository.findCopyByBarcode(`${seed.key}-raced-create`.slice(0, 100));
    expect(racedCopy).toBeNull();
  });
});
