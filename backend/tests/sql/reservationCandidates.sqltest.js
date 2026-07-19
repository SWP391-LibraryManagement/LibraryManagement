const dotenv = require('dotenv');
const { readFileSync } = require('fs');
const path = require('path');

if (process.env.FE08_SQL_TEST_ENV_FILE) {
  dotenv.config({ path: process.env.FE08_SQL_TEST_ENV_FILE, quiet: true });
} else {
  dotenv.config({ quiet: true });
}

const repositorySource = readFileSync(
  path.join(__dirname, '..', '..', 'src', 'repositories', 'reservationRepository.js'),
  'utf8'
);

// @spec FR-FE08-029, AC-FE08-015, NFR-FE08-SEC-004, NFR-FE08-PERF-003
test('candidate repository source locks the safe projection and eligible status boundary', () => {
  expect(repositorySource).toMatch(/bc\.Status IN \('BORROWED', 'RESERVED'\)/i);
  expect(repositorySource).toMatch(/b\.Status = 'ACTIVE'/i);
  expect(repositorySource).toMatch(/activeReservation\.Status = 'ACTIVE'/i);
  expect(repositorySource).toMatch(/ORDER BY b\.Title ASC, b\.BookId ASC, bc\.CopyId ASC/i);
  expect(repositorySource).toMatch(/OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY/i);
  expect(repositorySource).toMatch(/AuthorName/);
  expect(repositorySource).not.toMatch(/SELECT[\s\S]{0,500}bc\.Barcode[\s\S]{0,500}listReservationCandidates/);
});

// @spec BR-FE08-006, FR-FE08-015, Q-FE08-003
test('open reservation SQL counts and duplicate checks include ACTIVE and NOTIFIED', () => {
  expect(repositorySource).toMatch(
    /SELECT COUNT\(\*\) AS ActiveCount[\s\S]*Status IN \('ACTIVE', 'NOTIFIED'\)/i
  );
  expect(repositorySource).toMatch(
    /WHERE r\.UserId = @UserId[\s\S]*r\.CopyId = @CopyId[\s\S]*r\.Status IN \('ACTIVE', 'NOTIFIED'\)/i
  );
});

const hasSqlRuntime = Boolean(process.env.DB_SERVER && process.env.DB_NAME)
  && process.env.FE08_SQL_TEST_ALLOW_MUTATION === 'true';
const runtimeDescribe = hasSqlRuntime ? describe : describe.skip;

runtimeDescribe('FE08 live SQL reservation candidate catalog', () => {
  const { sql, getPool, resetPoolForTests } = require('../../src/config/db');
  const reservationRepository = require('../../src/repositories/reservationRepository');
  let pool;
  const seed = {
    key: `fe08candidate${Date.now()}${process.pid}`,
    userId: null,
    authorId: null,
    bookIds: [],
    copyIds: [],
    reservationIds: [],
  };

  async function insertBook(title, status = 'ACTIVE') {
    const result = await pool.request()
      .input('Title', sql.NVarChar(255), `${seed.key}-${title}`)
      .input('Status', sql.NVarChar(20), status)
      .input('AuthorId', sql.Int, seed.authorId)
      .query(`
        INSERT INTO Books (Title, AuthorId, Status)
        OUTPUT INSERTED.BookId
        VALUES (@Title, @AuthorId, @Status)
      `);
    const bookId = result.recordset[0].BookId;
    seed.bookIds.push(bookId);
    return bookId;
  }

  async function insertCopy(bookId, suffix, status) {
    const result = await pool.request()
      .input('BookId', sql.Int, bookId)
      .input('Barcode', sql.NVarChar(100), `${seed.key}-${suffix}`)
      .input('Status', sql.NVarChar(20), status)
      .query(`
        INSERT INTO BookCopies (BookId, Barcode, Status)
        OUTPUT INSERTED.CopyId
        VALUES (@BookId, @Barcode, @Status)
      `);
    const copyId = result.recordset[0].CopyId;
    seed.copyIds.push(copyId);
    return copyId;
  }

  beforeAll(async () => {
    pool = await getPool();
    const userResult = await pool.request()
      .input('Username', sql.NVarChar(50), `${seed.key}-member`)
      .input('Email', sql.NVarChar(100), `${seed.key}@example.test`)
      .input('PasswordHash', sql.NVarChar(255), 'fe08-sql-candidate-fixture')
      .query(`
        INSERT INTO Users (Username, Email, PasswordHash, Status, EmailVerifiedAt)
        OUTPUT INSERTED.UserId
        VALUES (@Username, @Email, @PasswordHash, 'ACTIVE', GETDATE())
      `);
    seed.userId = userResult.recordset[0].UserId;

    const authorResult = await pool.request()
      .input('AuthorName', sql.NVarChar(100), `${seed.key}-author`)
      .query('INSERT INTO Authors (AuthorName) OUTPUT INSERTED.AuthorId VALUES (@AuthorName)');
    seed.authorId = authorResult.recordset[0].AuthorId;
  });

  afterAll(async () => {
    try {
      if (pool && seed.reservationIds.length) {
        await pool.request()
          .input('UserId', sql.Int, seed.userId)
          .query('DELETE FROM Reservations WHERE UserId = @UserId');
      }
      if (pool && seed.copyIds.length) {
        await pool.request()
          .input('BookIds', sql.VarChar(4000), seed.bookIds.join(','))
          .query(`DELETE FROM BookCopies WHERE BookId IN (
            SELECT TRY_CONVERT(INT, value) FROM STRING_SPLIT(@BookIds, ',')
          )`);
      }
      if (pool && seed.bookIds.length) {
        await pool.request()
          .input('BookIds', sql.VarChar(4000), seed.bookIds.join(','))
          .query(`DELETE FROM Books WHERE BookId IN (
            SELECT TRY_CONVERT(INT, value) FROM STRING_SPLIT(@BookIds, ',')
          )`);
      }
      if (pool && seed.authorId) {
        await pool.request().input('AuthorId', sql.Int, seed.authorId)
          .query('DELETE FROM Authors WHERE AuthorId = @AuthorId');
      }
      if (pool && seed.userId) {
        await pool.request().input('UserId', sql.Int, seed.userId)
          .query('DELETE FROM Users WHERE UserId = @UserId');
      }
    } finally {
      if (pool) await pool.close();
      resetPoolForTests();
    }
  });

  test('SQL projection filters statuses, counts active rows, searches, orders, and paginates', async () => {
    const cleanBookId = await insertBook('Clean');
    const alphaBookId = await insertBook('Alpha');
    const inactiveBookId = await insertBook('Hidden', 'INACTIVE');
    const borrowedCopyId = await insertCopy(cleanBookId, 'borrowed', 'BORROWED');
    const reservedCopyId = await insertCopy(alphaBookId, 'reserved', 'RESERVED');
    const availableCopyId = await insertCopy(alphaBookId, 'available', 'AVAILABLE');
    const inactiveBookCopyId = await insertCopy(inactiveBookId, 'inactive-book', 'BORROWED');
    const damagedCopyId = await insertCopy(cleanBookId, 'damaged', 'DAMAGED');

    const activeReservation = await pool.request()
      .input('UserId', sql.Int, seed.userId)
      .input('CopyId', sql.Int, borrowedCopyId)
      .query(`
        INSERT INTO Reservations (UserId, CopyId, Status)
        OUTPUT INSERTED.ReservationId
        VALUES (@UserId, @CopyId, 'ACTIVE')
      `);
    seed.reservationIds.push(activeReservation.recordset[0].ReservationId);
    const terminalReservation = await pool.request()
      .input('UserId', sql.Int, seed.userId)
      .input('CopyId', sql.Int, borrowedCopyId)
      .query(`
        INSERT INTO Reservations (UserId, CopyId, Status)
        OUTPUT INSERTED.ReservationId
        VALUES (@UserId, @CopyId, 'CANCELLED')
      `);
    seed.reservationIds.push(terminalReservation.recordset[0].ReservationId);

    // Scope the catalog query to this run so canonical baseline rows cannot
    // change the expected ordering or page contents.
    const result = await reservationRepository.listReservationCandidates({
      q: seed.key,
      page: 1,
      limit: 20,
    });
    expect(result.rows.map((row) => row.copyId)).toEqual([reservedCopyId, borrowedCopyId]);
    expect(result.rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ copyId: borrowedCopyId, copyStatus: 'BORROWED', activeReservationCount: 1 }),
      expect.objectContaining({ copyId: reservedCopyId, copyStatus: 'RESERVED', activeReservationCount: 0 }),
    ]));
    expect(result.rows.map((row) => Object.keys(row).sort())).toEqual([
      ['activeReservationCount', 'authorName', 'bookId', 'copyId', 'copyStatus', 'title'],
      ['activeReservationCount', 'authorName', 'bookId', 'copyId', 'copyStatus', 'title'],
    ]);
    expect(result.rows).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ copyId: availableCopyId }),
      expect.objectContaining({ copyId: inactiveBookCopyId }),
      expect.objectContaining({ copyId: damagedCopyId }),
    ]));

    const searched = await reservationRepository.listReservationCandidates({
      q: `${seed.key}-clean`,
      page: 1,
      limit: 1,
    });
    expect(searched.total).toBe(1);
    expect(searched.rows[0].copyId).toBe(borrowedCopyId);
  });

  // @spec BR-FE08-006, FR-FE08-015, Q-FE08-003
  test('SQL duplicate and open-limit lookups include NOTIFIED and exclude terminal rows', async () => {
    const beforeCount = await reservationRepository.countActiveReservationsForUser(seed.userId);
    const openBookId = await insertBook('OpenChecks');
    const notifiedCopyId = await insertCopy(openBookId, 'notified', 'BORROWED');
    const activeCopyId = await insertCopy(openBookId, 'active', 'BORROWED');
    const terminalCopyId = await insertCopy(openBookId, 'terminal', 'BORROWED');

    for (const [copyId, status] of [
      [notifiedCopyId, 'NOTIFIED'],
      [activeCopyId, 'ACTIVE'],
      [terminalCopyId, 'CANCELLED'],
    ]) {
      const result = await pool.request()
        .input('UserId', sql.Int, seed.userId)
        .input('CopyId', sql.Int, copyId)
        .input('Status', sql.NVarChar(20), status)
        .query(`
          INSERT INTO Reservations (UserId, CopyId, Status)
          OUTPUT INSERTED.ReservationId
          VALUES (@UserId, @CopyId, @Status)
        `);
      seed.reservationIds.push(result.recordset[0].ReservationId);
    }

    const afterCount = await reservationRepository.countActiveReservationsForUser(seed.userId);
    const notifiedDuplicate = await reservationRepository.findActiveReservationByUserAndCopy(
      seed.userId,
      notifiedCopyId
    );
    const terminalDuplicate = await reservationRepository.findActiveReservationByUserAndCopy(
      seed.userId,
      terminalCopyId
    );

    expect(afterCount).toBe(beforeCount + 2);
    expect(notifiedDuplicate).toEqual(expect.objectContaining({ status: 'NOTIFIED' }));
    expect(terminalDuplicate).toBeNull();
  });
});
