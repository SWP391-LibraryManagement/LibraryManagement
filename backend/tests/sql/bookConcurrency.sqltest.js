const { readFileSync } = require('fs');
const path = require('path');
const dotenv = require('dotenv');

if (process.env.FE05_SQL_TEST_ENV_FILE) {
  dotenv.config({ path: process.env.FE05_SQL_TEST_ENV_FILE, quiet: true });
} else {
  dotenv.config({ quiet: true });
}

const hasSqlRuntime =
  Boolean(process.env.DB_SERVER && process.env.DB_NAME) &&
  process.env.FE05_SQL_TEST_ALLOW_MUTATION === 'true';

const schemaSource = readFileSync(
  path.join(__dirname, '..', '..', '..', 'database', 'Librarymanagement.sql'),
  'utf8'
);
const migrationSource = readFileSync(
  path.join(
    __dirname,
    '..',
    '..',
    '..',
    'database',
    'migrations',
    '2026-07-19-fe05-book-rowversion.sql'
  ),
  'utf8'
);
const modelSource = readFileSync(
  path.join(__dirname, '..', '..', 'src', 'models', 'Book.js'),
  'utf8'
);
const repositorySource = readFileSync(
  path.join(__dirname, '..', '..', 'src', 'repositories', 'bookRepository.js'),
  'utf8'
);

// @spec BR-FE05-016, FR-FE05-023
test('Books schema, migration, and model expose the canonical rowversion contract', () => {
  expect(schemaSource).toMatch(/CREATE TABLE Books[\s\S]*\bRowVersion\s+ROWVERSION\s+NOT NULL/i);
  expect(migrationSource).toMatch(/COL_LENGTH\(N'dbo\.Books',\s*N'RowVersion'\)[\s\S]*ADD RowVersion ROWVERSION NOT NULL/i);
  expect(modelSource).toMatch(/name:\s*'RowVersion'[\s\S]*type:\s*'ROWVERSION'/i);
});

// @spec BR-FE05-005, FR-FE05-011
test('Books ISBN width and filtered uniqueness stay synchronized', () => {
  expect(schemaSource).toMatch(/ISBN\s+NVARCHAR\(20\)\s+NULL/i);
  expect(schemaSource).toMatch(/CREATE UNIQUE INDEX UX_Books_ISBN_NotNull[\s\S]*WHERE ISBN IS NOT NULL/i);
  expect(migrationSource).toMatch(/DROP INDEX\s+UX_Books_ISBN_NotNull\s+ON\s+dbo\.Books/i);
  expect(migrationSource).toMatch(/ALTER TABLE dbo\.Books ALTER COLUMN ISBN NVARCHAR\(20\) NULL/i);
  expect(migrationSource).toMatch(/CREATE UNIQUE INDEX\s+UX_Books_ISBN_NotNull[\s\S]*WHERE ISBN IS NOT NULL/i);
});

// @spec FR-FE05-018, FR-FE05-023, NFR-FE05-TXN-001
test('book mutations lock and compare rowversion inside the transaction before commit', () => {
  expect(repositorySource).toMatch(/FROM Books b WITH \(UPDLOCK, HOLDLOCK\)/i);
  expect(repositorySource).toMatch(/Buffer\.isBuffer\(value\)[\s\S]*toString\('hex'\)\.toUpperCase\(\)/);
  expect(repositorySource).toMatch(/normalizeVersion\(row\.Version\) !== normalizeVersion\(expectedVersion\)/);
  expect(repositorySource).toMatch(/await transaction\.begin\(\)[\s\S]*onBeforeCommit[\s\S]*await transaction\.commit\(\)[\s\S]*await transaction\.rollback\(\)/i);
});

// @spec BR-FE05-012, BR-FE05-015, FR-FE05-021
test('FE05 repository has no BookCopies mutation path', () => {
  expect(repositorySource).not.toMatch(/(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+BookCopies/i);
});

const runtimeDescribe = hasSqlRuntime ? describe : describe.skip;

runtimeDescribe('FE05 mutable SQL concurrency evidence', () => {
  const { sql, getPool, resetPoolForTests } = require('../../src/config/db');
  const bookRepository = require('../../src/repositories/bookRepository');
  const auditLogRepository = require('../../src/repositories/auditLogRepository');

  jest.setTimeout(30000);

  let pool;
  let seedNumber = 0;
  let activeSeed;

  function makeKey() {
    seedNumber += 1;
    return `fe05sql${Date.now()}${process.pid}${seedNumber}`;
  }

  function versionHex(value) {
    return Buffer.isBuffer(value) ? value.toString('hex').toUpperCase() : value;
  }

  async function createSeed() {
    const key = makeKey();
    const category = await pool.request()
      .input('Name', sql.NVarChar(100), `${key}-category`.slice(0, 100))
      .query('INSERT INTO Categories (CategoryName, Status) OUTPUT INSERTED.CategoryId VALUES (@Name, \'ACTIVE\')');
    const author = await pool.request()
      .input('Name', sql.NVarChar(150), `${key}-author`.slice(0, 150))
      .query('INSERT INTO Authors (AuthorName, Status) OUTPUT INSERTED.AuthorId VALUES (@Name, \'ACTIVE\')');
    const publisher = await pool.request()
      .input('Name', sql.NVarChar(150), `${key}-publisher`.slice(0, 150))
      .query('INSERT INTO Publishers (PublisherName, Status) OUTPUT INSERTED.PublisherId VALUES (@Name, \'ACTIVE\')');
    const user = await pool.request()
      .input('Username', sql.NVarChar(50), key.slice(0, 50))
      .input('Email', sql.NVarChar(255), `${key}@example.test`)
      .input('PasswordHash', sql.NVarChar(255), 'sql-test-password-hash')
      .query(`
        INSERT INTO Users (Username, Email, PasswordHash, Status, EmailVerifiedAt)
        OUTPUT INSERTED.UserId
        VALUES (@Username, @Email, @PasswordHash, 'ACTIVE', GETDATE())
      `);

    const categoryId = category.recordset[0].CategoryId;
    const authorId = author.recordset[0].AuthorId;
    const publisherId = publisher.recordset[0].PublisherId;
    const userId = user.recordset[0].UserId;
    const isbn = `${Date.now()}${seedNumber}`.slice(0, 20);
    const book = await pool.request()
      .input('Title', sql.NVarChar(255), `${key} original`)
      .input('ISBN', sql.NVarChar(20), isbn)
      .input('CategoryId', sql.Int, categoryId)
      .input('AuthorId', sql.Int, authorId)
      .input('PublisherId', sql.Int, publisherId)
      .input('CreatedBy', sql.Int, userId)
      .query(`
        INSERT INTO Books
          (Title, ISBN, CategoryId, AuthorId, PublisherId, PublishYear, Rating, Pages, Status, CreatedBy)
        OUTPUT INSERTED.BookId
        VALUES
          (@Title, @ISBN, @CategoryId, @AuthorId, @PublisherId, 2026, 4.5, 320, 'ACTIVE', @CreatedBy)
      `);
    const bookId = book.recordset[0].BookId;
    const copy = await pool.request()
      .input('BookId', sql.Int, bookId)
      .input('Barcode', sql.NVarChar(100), `${key}-copy`.slice(0, 100))
      .query(`
        INSERT INTO BookCopies (BookId, Barcode, Status, Location)
        OUTPUT INSERTED.CopyId
        VALUES (@BookId, @Barcode, 'AVAILABLE', 'FE05 SQL shelf')
      `);
    const copyId = copy.recordset[0].CopyId;
    const borrowRequest = await pool.request()
      .input('UserId', sql.Int, userId)
      .query(`
        INSERT INTO BorrowRequests (UserId, Status, CreatedBy)
        OUTPUT INSERTED.RequestId
        VALUES (@UserId, 'PENDING', @UserId)
      `);
    const requestId = borrowRequest.recordset[0].RequestId;
    const borrowDetail = await pool.request()
      .input('RequestId', sql.Int, requestId)
      .input('CopyId', sql.Int, copyId)
      .query(`
        INSERT INTO BorrowDetails (RequestId, CopyId, Status)
        OUTPUT INSERTED.BorrowDetailId
        VALUES (@RequestId, @CopyId, 'REQUESTED')
      `);
    const reservation = await pool.request()
      .input('UserId', sql.Int, userId)
      .input('CopyId', sql.Int, copyId)
      .query(`
        INSERT INTO Reservations (UserId, CopyId, QueuePosition, Status)
        OUTPUT INSERTED.ReservationId
        VALUES (@UserId, @CopyId, 1, 'ACTIVE')
      `);

    activeSeed = {
      userId,
      categoryId,
      authorId,
      publisherId,
      bookId,
      copyId,
      requestId,
      borrowDetailId: borrowDetail.recordset[0].BorrowDetailId,
      reservationId: reservation.recordset[0].ReservationId,
      payload: {
        title: `${key} updated`,
        isbn,
        categoryId,
        authorId,
        publisherId,
        publishYear: 2026,
        description: 'FE05 SQL update',
        coverUrl: null,
        rating: 4.6,
        pages: 321,
      },
    };
    return activeSeed;
  }

  async function readState(seed) {
    const result = await pool.request()
      .input('BookId', sql.Int, seed.bookId)
      .input('CopyId', sql.Int, seed.copyId)
      .input('RequestId', sql.Int, seed.requestId)
      .input('BorrowDetailId', sql.Int, seed.borrowDetailId)
      .input('ReservationId', sql.Int, seed.reservationId)
      .query(`
        SELECT Title, Status, RowVersion AS Version
        FROM Books WHERE BookId = @BookId;
        SELECT Status FROM BookCopies WHERE CopyId = @CopyId;
        SELECT Status FROM BorrowRequests WHERE RequestId = @RequestId;
        SELECT Status FROM BorrowDetails WHERE BorrowDetailId = @BorrowDetailId;
        SELECT Status FROM Reservations WHERE ReservationId = @ReservationId;
        SELECT COUNT(*) AS Total FROM AuditLogs WHERE TargetType = 'BOOK' AND TargetId = @BookId;
      `);
    return {
      book: {
        ...result.recordsets[0][0],
        Version: versionHex(result.recordsets[0][0]?.Version),
      },
      copyStatus: result.recordsets[1][0]?.Status,
      requestStatus: result.recordsets[2][0]?.Status,
      detailStatus: result.recordsets[3][0]?.Status,
      reservationStatus: result.recordsets[4][0]?.Status,
      auditTotal: result.recordsets[5][0]?.Total || 0,
    };
  }

  async function writeAudit({ transaction, seed, action }) {
    await auditLogRepository.create({
      userId: seed.userId,
      action,
      targetType: 'BOOK',
      targetId: seed.bookId,
      metadata: { source: 'FE05_SQL_TEST' },
      transaction,
    });
  }

  async function cleanup() {
    if (!activeSeed || !pool) return;
    const seed = activeSeed;
    await pool.request().input('BookId', sql.Int, seed.bookId)
      .query("DELETE FROM AuditLogs WHERE TargetType = 'BOOK' AND TargetId = @BookId");
    await pool.request().input('ReservationId', sql.Int, seed.reservationId)
      .query('DELETE FROM Reservations WHERE ReservationId = @ReservationId');
    await pool.request().input('BorrowDetailId', sql.Int, seed.borrowDetailId)
      .query('DELETE FROM BorrowDetails WHERE BorrowDetailId = @BorrowDetailId');
    await pool.request().input('RequestId', sql.Int, seed.requestId)
      .query('DELETE FROM BorrowRequests WHERE RequestId = @RequestId');
    await pool.request().input('CopyId', sql.Int, seed.copyId)
      .query('DELETE FROM BookCopies WHERE CopyId = @CopyId');
    await pool.request().input('BookId', sql.Int, seed.bookId)
      .query('DELETE FROM Books WHERE BookId = @BookId');
    await pool.request().input('UserId', sql.Int, seed.userId)
      .query('DELETE FROM Users WHERE UserId = @UserId');
    await pool.request().input('CategoryId', sql.Int, seed.categoryId)
      .query('DELETE FROM Categories WHERE CategoryId = @CategoryId');
    await pool.request().input('AuthorId', sql.Int, seed.authorId)
      .query('DELETE FROM Authors WHERE AuthorId = @AuthorId');
    await pool.request().input('PublisherId', sql.Int, seed.publisherId)
      .query('DELETE FROM Publishers WHERE PublisherId = @PublisherId');
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

  // @spec AC-FE05-014, FR-FE05-018, FR-FE05-023
  test('SQL rowversion advances once and rejects a stale competing metadata update', async () => {
    const seed = await createSeed();
    const original = await bookRepository.getBookById(seed.bookId);
    const updated = await bookRepository.updateBook(
      seed.bookId,
      seed.payload,
      original.version,
      {
        actorUserId: seed.userId,
        onBeforeCommit: ({ transaction }) => writeAudit({ transaction, seed, action: 'BOOK_UPDATE' }),
      }
    );
    const stale = await bookRepository.updateBook(
      seed.bookId,
      { ...seed.payload, title: 'stale update must not commit' },
      original.version,
      { actorUserId: seed.userId }
    );
    const state = await readState(seed);

    expect(updated.version).not.toBe(original.version);
    expect(stale).toEqual({ outcome: 'STALE' });
    expect(state.book.Title).toBe(seed.payload.title);
    expect(state.book.Version).toBe(updated.version);
    expect(state.auditTotal).toBe(1);
  });

  // @spec AC-FE05-010, FR-FE05-018, NFR-FE05-TXN-001
  test('SQL metadata and audit writes roll back together after an injected failure', async () => {
    const seed = await createSeed();
    const original = await bookRepository.getBookById(seed.bookId);
    const before = await readState(seed);

    await expect(bookRepository.updateBook(
      seed.bookId,
      seed.payload,
      original.version,
      {
        actorUserId: seed.userId,
        onBeforeCommit: async ({ transaction }) => {
          await writeAudit({ transaction, seed, action: 'BOOK_UPDATE' });
          throw new Error('Injected FE05 audit boundary failure');
        },
      }
    )).rejects.toThrow('Injected FE05 audit boundary failure');

    expect(await readState(seed)).toEqual(before);
  });

  // @spec AC-FE05-008, AC-FE05-013, BR-FE05-015, FR-FE05-022
  test('SQL status transitions preserve copy and workflow state and roll back atomically', async () => {
    const seed = await createSeed();
    const original = await bookRepository.getBookById(seed.bookId);
    const deactivated = await bookRepository.changeBookStatus(
      seed.bookId,
      'INACTIVE',
      original.version,
      {
        actorUserId: seed.userId,
        onBeforeCommit: ({ transaction }) => writeAudit({ transaction, seed, action: 'BOOK_DEACTIVATE' }),
      }
    );
    const afterDeactivate = await readState(seed);

    expect(afterDeactivate.book.Status).toBe('INACTIVE');
    expect(afterDeactivate.copyStatus).toBe('AVAILABLE');
    expect(afterDeactivate.requestStatus).toBe('PENDING');
    expect(afterDeactivate.detailStatus).toBe('REQUESTED');
    expect(afterDeactivate.reservationStatus).toBe('ACTIVE');
    expect(afterDeactivate.auditTotal).toBe(1);

    await expect(bookRepository.changeBookStatus(
      seed.bookId,
      'ACTIVE',
      deactivated.version,
      {
        actorUserId: seed.userId,
        onBeforeCommit: async ({ transaction }) => {
          await writeAudit({ transaction, seed, action: 'BOOK_REACTIVATE' });
          throw new Error('Injected FE05 reactivation audit failure');
        },
      }
    )).rejects.toThrow('Injected FE05 reactivation audit failure');

    expect(await readState(seed)).toEqual(afterDeactivate);
  });
});
