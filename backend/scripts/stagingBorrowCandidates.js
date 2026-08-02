const path = require('node:path');

require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
  quiet: true,
});

const defaultDb = require('../src/config/db');
const {
  businessDateUtcBounds,
  formatBusinessDate,
} = require('../src/utils/libraryBusinessTime');

// @spec BR-FE07-039, FR-FE07-046
const FIXTURES = Object.freeze([
  Object.freeze({
    title: 'Staging Borrow Demo 1',
    isbn: 'STAGING-BORROW-DEMO1',
    barcode: 'STG-BORROW-DEMO-001',
    location: 'STAGING-DEMO',
  }),
  Object.freeze({
    title: 'Staging Borrow Demo 2',
    isbn: 'STAGING-BORROW-DEMO2',
    barcode: 'STG-BORROW-DEMO-002',
    location: 'STAGING-DEMO',
  }),
]);

const ISBN_PREFIX = 'STAGING-BORROW-DEMO%';
const BARCODE_PREFIX = 'STG-BORROW-DEMO-%';
const LOCATION = 'STAGING-DEMO';
const MARKER = 'STAGING_BORROW_DEMO';

const STATUS_SQL = `
SELECT
  b.BookId,
  b.ISBN,
  b.Status AS BookStatus,
  bc.CopyId,
  bc.Barcode,
  bc.Status AS CopyStatus,
  (
    SELECT COUNT(*)
    FROM BorrowDetails bd
    INNER JOIN BorrowRequests br ON br.RequestId = bd.RequestId
    WHERE bd.CopyId = bc.CopyId
      AND (
        (br.Status = 'PENDING' AND bd.Status = 'REQUESTED')
        OR bd.Status = 'BORROWED'
      )
  ) AS OpenBorrowClaims,
  (
    SELECT COUNT(*)
    FROM Reservations r
    WHERE r.CopyId = bc.CopyId
      AND r.Status IN ('ACTIVE', 'NOTIFIED')
  ) AS OpenReservations
FROM Books b
LEFT JOIN BookCopies bc ON bc.BookId = b.BookId
WHERE b.ISBN LIKE @IsbnPrefix
   OR bc.Barcode LIKE @BarcodePrefix
   OR bc.Location = @Location
ORDER BY b.ISBN, bc.Barcode;
`;

const RESET_SQL = `
SET XACT_ABORT ON;

DECLARE @ActorUserId INT;
DECLARE @MemberUserId INT;
DECLARE @Fixture1BookId INT;
DECLARE @Fixture2BookId INT;
DECLARE @Fixture1CopyId INT;
DECLARE @Fixture2CopyId INT;

DECLARE @Transitions TABLE (
  Action NVARCHAR(255) NOT NULL,
  TargetType NVARCHAR(100) NOT NULL,
  TargetId INT NULL,
  FixtureIsbn NVARCHAR(20) NULL,
  FromStatus NVARCHAR(20) NULL,
  ToStatus NVARCHAR(20) NULL
);

DECLARE @TitleTransitions TABLE (
  Action NVARCHAR(255) NOT NULL,
  TargetType NVARCHAR(100) NOT NULL,
  TargetId INT NOT NULL,
  FixtureIsbn NVARCHAR(20) NOT NULL,
  FromTitle NVARCHAR(255) NOT NULL,
  ToTitle NVARCHAR(255) NOT NULL
);

SELECT TOP (1) @ActorUserId = u.UserId
FROM Users u WITH (UPDLOCK, HOLDLOCK)
INNER JOIN UserRoles ur WITH (UPDLOCK, HOLDLOCK) ON ur.UserId = u.UserId
INNER JOIN Roles r WITH (HOLDLOCK) ON r.RoleId = ur.RoleId
WHERE u.Status = 'ACTIVE'
  AND r.RoleName = 'ADMIN'
ORDER BY u.UserId;

IF @ActorUserId IS NULL
  THROW 51001, 'No active Admin audit actor exists.', 1;

SELECT @MemberUserId = u.UserId
FROM Users u WITH (UPDLOCK, HOLDLOCK)
INNER JOIN Members m WITH (UPDLOCK, HOLDLOCK) ON m.UserId = u.UserId
WHERE LOWER(u.Email) = LOWER(@MemberEmail)
  AND u.Status = 'ACTIVE'
  AND m.Status = 'APPROVED'
  AND (
    SELECT COUNT(*)
    FROM UserRoles memberRoles WITH (UPDLOCK, HOLDLOCK)
    WHERE memberRoles.UserId = u.UserId
  ) = 1
  AND EXISTS (
    SELECT 1
    FROM UserRoles memberRole WITH (UPDLOCK, HOLDLOCK)
    INNER JOIN Roles roleName WITH (HOLDLOCK) ON roleName.RoleId = memberRole.RoleId
    WHERE memberRole.UserId = u.UserId
      AND roleName.RoleName = 'MEMBER'
  );

IF @MemberUserId IS NULL
  THROW 51002, 'The configured staging Member is missing or ineligible.', 1;

/* Lock every marker-owned row before deciding whether the fixture is safe. */
SELECT b.BookId
FROM Books b WITH (UPDLOCK, HOLDLOCK)
WHERE b.ISBN LIKE @IsbnPrefix;

SELECT bc.CopyId
FROM BookCopies bc WITH (UPDLOCK, HOLDLOCK)
INNER JOIN Books b WITH (HOLDLOCK) ON b.BookId = bc.BookId
WHERE bc.Barcode LIKE @BarcodePrefix
   OR bc.Location = @Location
   OR b.ISBN LIKE @IsbnPrefix;

SELECT br.RequestId
FROM BorrowRequests br WITH (UPDLOCK, HOLDLOCK)
INNER JOIN BorrowDetails bd WITH (UPDLOCK, HOLDLOCK) ON bd.RequestId = br.RequestId
INNER JOIN BookCopies bc WITH (HOLDLOCK) ON bc.CopyId = bd.CopyId
INNER JOIN Books b WITH (HOLDLOCK) ON b.BookId = bc.BookId
WHERE b.ISBN IN (@Fixture1Isbn, @Fixture2Isbn)
   OR bc.Barcode IN (@Fixture1Barcode, @Fixture2Barcode);

SELECT r.ReservationId
FROM Reservations r WITH (UPDLOCK, HOLDLOCK)
INNER JOIN BookCopies bc WITH (HOLDLOCK) ON bc.CopyId = r.CopyId
INNER JOIN Books b WITH (HOLDLOCK) ON b.BookId = bc.BookId
WHERE b.ISBN IN (@Fixture1Isbn, @Fixture2Isbn)
   OR bc.Barcode IN (@Fixture1Barcode, @Fixture2Barcode);

IF EXISTS (
  SELECT 1
  FROM Books b
  WHERE b.ISBN LIKE @IsbnPrefix
    AND b.ISBN NOT IN (@Fixture1Isbn, @Fixture2Isbn)
) OR EXISTS (
  SELECT 1
  FROM BookCopies bc
  LEFT JOIN Books b ON b.BookId = bc.BookId
  WHERE (bc.Barcode LIKE @BarcodePrefix OR bc.Location = @Location OR b.ISBN LIKE @IsbnPrefix)
    AND NOT (
      (b.ISBN = @Fixture1Isbn AND bc.Barcode = @Fixture1Barcode AND bc.Location = @Location)
      OR (b.ISBN = @Fixture2Isbn AND bc.Barcode = @Fixture2Barcode AND bc.Location = @Location)
    )
)
  THROW 51006, 'Tagged workflow state is unexpected.', 1;

/* Only unrelated member blockers refuse reset; tagged workflows are normalized below. */
IF EXISTS (
  SELECT 1
  FROM Fines f WITH (UPDLOCK, HOLDLOCK)
  WHERE f.UserId = @MemberUserId
    AND f.Status = 'UNPAID'
    AND f.Amount > 0
) OR EXISTS (
  SELECT 1
  FROM BorrowRequests br WITH (HOLDLOCK)
  INNER JOIN BorrowDetails bd WITH (UPDLOCK, HOLDLOCK) ON bd.RequestId = br.RequestId
  INNER JOIN BookCopies bc WITH (HOLDLOCK) ON bc.CopyId = bd.CopyId
  INNER JOIN Books b WITH (HOLDLOCK) ON b.BookId = bc.BookId
  WHERE br.UserId = @MemberUserId
    AND bd.Status = 'BORROWED'
    AND bd.DueDate < @BusinessDate
    AND b.ISBN NOT IN (@Fixture1Isbn, @Fixture2Isbn)
) OR 5 <= (
  SELECT COUNT(*)
  FROM BorrowRequests br WITH (HOLDLOCK)
  INNER JOIN BorrowDetails bd WITH (UPDLOCK, HOLDLOCK) ON bd.RequestId = br.RequestId
  INNER JOIN BookCopies bc WITH (HOLDLOCK) ON bc.CopyId = bd.CopyId
  INNER JOIN Books b WITH (HOLDLOCK) ON b.BookId = bc.BookId
  WHERE br.UserId = @MemberUserId
    AND bd.Status = 'BORROWED'
    AND b.ISBN NOT IN (@Fixture1Isbn, @Fixture2Isbn)
) OR 5 <= (
  SELECT COUNT(*)
  FROM BorrowRequests br WITH (UPDLOCK, HOLDLOCK)
  INNER JOIN BorrowDetails bd WITH (UPDLOCK, HOLDLOCK) ON bd.RequestId = br.RequestId
  INNER JOIN BookCopies bc WITH (HOLDLOCK) ON bc.CopyId = bd.CopyId
  INNER JOIN Books b WITH (HOLDLOCK) ON b.BookId = bc.BookId
  WHERE br.UserId = @MemberUserId
    AND br.RequestDate >= @BusinessDayStartUtc
    AND br.RequestDate < @BusinessDayEndUtc
    AND br.Status <> 'REJECTED'
    AND b.ISBN NOT IN (@Fixture1Isbn, @Fixture2Isbn)
)
  THROW 51003, 'The configured staging Member has an unrelated borrowing blocker.', 1;

IF EXISTS (
  SELECT 1
  FROM BorrowRequests br
  INNER JOIN BorrowDetails bd ON bd.RequestId = br.RequestId
  INNER JOIN BookCopies bc ON bc.CopyId = bd.CopyId
  INNER JOIN Books b ON b.BookId = bc.BookId
  GROUP BY br.RequestId
  HAVING SUM(CASE WHEN b.ISBN IN (@Fixture1Isbn, @Fixture2Isbn) THEN 1 ELSE 0 END) > 0
     AND COUNT(*) <> SUM(CASE WHEN b.ISBN IN (@Fixture1Isbn, @Fixture2Isbn) THEN 1 ELSE 0 END)
)
  THROW 51004, 'A borrow request mixes tagged and untagged copies.', 1;

IF EXISTS (
  SELECT 1
  FROM BookCopies bc
  INNER JOIN Books b ON b.BookId = bc.BookId
  WHERE b.ISBN IN (@Fixture1Isbn, @Fixture2Isbn)
    AND bc.Status IN ('DAMAGED', 'LOST')
) OR EXISTS (
  SELECT 1
  FROM BorrowDetails bd
  INNER JOIN BookCopies bc ON bc.CopyId = bd.CopyId
  INNER JOIN Books b ON b.BookId = bc.BookId
  WHERE b.ISBN IN (@Fixture1Isbn, @Fixture2Isbn)
    AND bd.Status IN ('DAMAGED', 'LOST')
)
  THROW 51005, 'A tagged copy is DAMAGED or LOST.', 1;

IF EXISTS (
  SELECT 1
  FROM BorrowDetails bd
  INNER JOIN BorrowRequests br ON br.RequestId = bd.RequestId
  INNER JOIN BookCopies bc ON bc.CopyId = bd.CopyId
  INNER JOIN Books b ON b.BookId = bc.BookId
  WHERE b.ISBN IN (@Fixture1Isbn, @Fixture2Isbn)
    AND (
      (br.Status = 'PENDING' AND bd.Status <> 'REQUESTED')
      OR (bd.Status = 'BORROWED' AND br.Status <> 'APPROVED')
      OR (br.Status = 'APPROVED' AND bd.Status = 'REQUESTED')
      OR (bd.Status = 'BORROWED' AND bc.Status <> 'BORROWED')
      OR (br.Status NOT IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'))
    )
) OR EXISTS (
  SELECT 1
  FROM BookCopies bc
  INNER JOIN Books b ON b.BookId = bc.BookId
  WHERE b.ISBN IN (@Fixture1Isbn, @Fixture2Isbn)
    AND bc.Status = 'BORROWED'
    AND NOT EXISTS (
      SELECT 1 FROM BorrowDetails bd
      WHERE bd.CopyId = bc.CopyId AND bd.Status = 'BORROWED'
    )
) OR EXISTS (
  SELECT 1
  FROM BookCopies bc
  INNER JOIN Books b ON b.BookId = bc.BookId
  WHERE b.ISBN IN (@Fixture1Isbn, @Fixture2Isbn)
    AND bc.Status = 'RESERVED'
    AND NOT EXISTS (
      SELECT 1 FROM Reservations r
      WHERE r.CopyId = bc.CopyId AND r.Status IN ('ACTIVE', 'NOTIFIED')
    )
)
  THROW 51006, 'Tagged workflow state is unexpected.', 1;

IF NOT EXISTS (SELECT 1 FROM Books WHERE ISBN = @Fixture1Isbn)
BEGIN
  INSERT INTO Books (Title, ISBN, Status, CreatedBy, CreatedAt)
  VALUES (@Fixture1Title, @Fixture1Isbn, 'ACTIVE', @ActorUserId, GETDATE());
  SET @Fixture1BookId = SCOPE_IDENTITY();
  INSERT INTO @Transitions VALUES
    ('STAGING_FIXTURE_BOOK_CREATE', 'BOOK', @Fixture1BookId, @Fixture1Isbn, NULL, 'ACTIVE');
END
ELSE
  SELECT @Fixture1BookId = BookId FROM Books WHERE ISBN = @Fixture1Isbn;

IF NOT EXISTS (SELECT 1 FROM Books WHERE ISBN = @Fixture2Isbn)
BEGIN
  INSERT INTO Books (Title, ISBN, Status, CreatedBy, CreatedAt)
  VALUES (@Fixture2Title, @Fixture2Isbn, 'ACTIVE', @ActorUserId, GETDATE());
  SET @Fixture2BookId = SCOPE_IDENTITY();
  INSERT INTO @Transitions VALUES
    ('STAGING_FIXTURE_BOOK_CREATE', 'BOOK', @Fixture2BookId, @Fixture2Isbn, NULL, 'ACTIVE');
END
ELSE
  SELECT @Fixture2BookId = BookId FROM Books WHERE ISBN = @Fixture2Isbn;

INSERT INTO @TitleTransitions
SELECT 'STAGING_FIXTURE_BOOK_TITLE_RESTORE', 'BOOK', b.BookId, b.ISBN, b.Title,
       CASE WHEN b.ISBN = @Fixture1Isbn THEN @Fixture1Title ELSE @Fixture2Title END
FROM Books b
WHERE b.BookId IN (@Fixture1BookId, @Fixture2BookId)
  AND CONVERT(VARBINARY(510), b.Title) <> CONVERT(
    VARBINARY(510),
    CASE WHEN b.ISBN = @Fixture1Isbn THEN @Fixture1Title ELSE @Fixture2Title END
  );

UPDATE Books
SET Title = CASE WHEN ISBN = @Fixture1Isbn THEN @Fixture1Title ELSE @Fixture2Title END,
    UpdatedBy = @ActorUserId,
    UpdatedAt = GETDATE()
WHERE BookId IN (@Fixture1BookId, @Fixture2BookId)
  AND CONVERT(VARBINARY(510), Title) <> CONVERT(
    VARBINARY(510),
    CASE WHEN ISBN = @Fixture1Isbn THEN @Fixture1Title ELSE @Fixture2Title END
  );

IF NOT EXISTS (SELECT 1 FROM BookCopies WHERE Barcode = @Fixture1Barcode)
BEGIN
  INSERT INTO BookCopies (BookId, Barcode, Status, Location, CreatedAt)
  VALUES (@Fixture1BookId, @Fixture1Barcode, 'AVAILABLE', @Location, GETDATE());
  SET @Fixture1CopyId = SCOPE_IDENTITY();
  INSERT INTO @Transitions VALUES
    ('STAGING_FIXTURE_COPY_CREATE', 'BOOK_COPY', @Fixture1CopyId, @Fixture1Isbn, NULL, 'AVAILABLE');
END
ELSE
  SELECT @Fixture1CopyId = CopyId FROM BookCopies WHERE Barcode = @Fixture1Barcode;

IF NOT EXISTS (SELECT 1 FROM BookCopies WHERE Barcode = @Fixture2Barcode)
BEGIN
  INSERT INTO BookCopies (BookId, Barcode, Status, Location, CreatedAt)
  VALUES (@Fixture2BookId, @Fixture2Barcode, 'AVAILABLE', @Location, GETDATE());
  SET @Fixture2CopyId = SCOPE_IDENTITY();
  INSERT INTO @Transitions VALUES
    ('STAGING_FIXTURE_COPY_CREATE', 'BOOK_COPY', @Fixture2CopyId, @Fixture2Isbn, NULL, 'AVAILABLE');
END
ELSE
  SELECT @Fixture2CopyId = CopyId FROM BookCopies WHERE Barcode = @Fixture2Barcode;

INSERT INTO @Transitions
SELECT 'STAGING_BORROW_REQUEST_REJECT', 'BORROW_REQUEST', br.RequestId,
       MIN(b.ISBN), br.Status, 'REJECTED'
FROM BorrowRequests br
INNER JOIN BorrowDetails bd ON bd.RequestId = br.RequestId
INNER JOIN BookCopies bc ON bc.CopyId = bd.CopyId
INNER JOIN Books b ON b.BookId = bc.BookId
WHERE b.ISBN IN (@Fixture1Isbn, @Fixture2Isbn)
  AND br.Status = 'PENDING'
GROUP BY br.RequestId, br.Status;

UPDATE BorrowRequests
SET Status = 'REJECTED', RejectedAt = GETDATE(), ProcessedAt = GETDATE(),
    ApprovedBy = @ActorUserId, UpdatedAt = GETDATE()
WHERE RequestId IN (
  SELECT br.RequestId
  FROM BorrowRequests br
  INNER JOIN BorrowDetails bd ON bd.RequestId = br.RequestId
  INNER JOIN BookCopies bc ON bc.CopyId = bd.CopyId
  INNER JOIN Books b ON b.BookId = bc.BookId
  WHERE b.ISBN IN (@Fixture1Isbn, @Fixture2Isbn)
)
  AND Status = 'PENDING';

INSERT INTO @Transitions
SELECT 'STAGING_BORROW_DETAIL_RETURN', 'BORROW_DETAIL', bd.BorrowDetailId,
       b.ISBN, bd.Status, 'RETURNED'
FROM BorrowDetails bd
INNER JOIN BookCopies bc ON bc.CopyId = bd.CopyId
INNER JOIN Books b ON b.BookId = bc.BookId
WHERE b.ISBN IN (@Fixture1Isbn, @Fixture2Isbn)
  AND bd.Status = 'BORROWED';

UPDATE BorrowDetails
SET Status = 'RETURNED', ReturnDate = @BusinessDate, UpdatedAt = GETDATE()
WHERE BorrowDetailId IN (
  SELECT bd.BorrowDetailId
  FROM BorrowDetails bd
  INNER JOIN BookCopies bc ON bc.CopyId = bd.CopyId
  INNER JOIN Books b ON b.BookId = bc.BookId
  WHERE b.ISBN IN (@Fixture1Isbn, @Fixture2Isbn)
)
  AND Status = 'BORROWED';

INSERT INTO @Transitions
SELECT 'STAGING_BORROW_REQUEST_COMPLETE', 'BORROW_REQUEST', br.RequestId,
       MIN(b.ISBN), br.Status, 'COMPLETED'
FROM BorrowRequests br
INNER JOIN BorrowDetails bd ON bd.RequestId = br.RequestId
INNER JOIN BookCopies bc ON bc.CopyId = bd.CopyId
INNER JOIN Books b ON b.BookId = bc.BookId
WHERE b.ISBN IN (@Fixture1Isbn, @Fixture2Isbn)
  AND br.Status = 'APPROVED'
  AND NOT EXISTS (
    SELECT 1 FROM BorrowDetails openDetail
    WHERE openDetail.RequestId = br.RequestId AND openDetail.Status = 'BORROWED'
  )
GROUP BY br.RequestId, br.Status;

UPDATE BorrowRequests
SET Status = 'COMPLETED', ProcessedAt = GETDATE(), UpdatedAt = GETDATE()
WHERE RequestId IN (
  SELECT br.RequestId
  FROM BorrowRequests br
  INNER JOIN BorrowDetails bd ON bd.RequestId = br.RequestId
  INNER JOIN BookCopies bc ON bc.CopyId = bd.CopyId
  INNER JOIN Books b ON b.BookId = bc.BookId
  WHERE b.ISBN IN (@Fixture1Isbn, @Fixture2Isbn)
)
  AND Status = 'APPROVED'
  AND NOT EXISTS (
    SELECT 1 FROM BorrowDetails openDetail
    WHERE openDetail.RequestId = BorrowRequests.RequestId AND openDetail.Status = 'BORROWED'
  );

INSERT INTO @Transitions
SELECT 'STAGING_RESERVATION_CANCEL', 'RESERVATION', r.ReservationId,
       b.ISBN, r.Status, 'CANCELLED'
FROM Reservations r
INNER JOIN BookCopies bc ON bc.CopyId = r.CopyId
INNER JOIN Books b ON b.BookId = bc.BookId
WHERE b.ISBN IN (@Fixture1Isbn, @Fixture2Isbn)
  AND r.Status IN ('ACTIVE', 'NOTIFIED');

UPDATE Reservations
SET Status = 'CANCELLED', CancelledAt = GETDATE(), UpdatedAt = GETDATE()
WHERE ReservationId IN (
  SELECT r.ReservationId
  FROM Reservations r
  INNER JOIN BookCopies bc ON bc.CopyId = r.CopyId
  INNER JOIN Books b ON b.BookId = bc.BookId
  WHERE b.ISBN IN (@Fixture1Isbn, @Fixture2Isbn)
)
  AND Status IN ('ACTIVE', 'NOTIFIED');

IF EXISTS (
  SELECT 1
  FROM BorrowDetails bd
  INNER JOIN BorrowRequests br ON br.RequestId = bd.RequestId
  WHERE bd.CopyId IN (@Fixture1CopyId, @Fixture2CopyId)
    AND ((br.Status = 'PENDING' AND bd.Status = 'REQUESTED') OR bd.Status = 'BORROWED')
) OR EXISTS (
  SELECT 1 FROM Reservations r
  WHERE r.CopyId IN (@Fixture1CopyId, @Fixture2CopyId)
    AND r.Status IN ('ACTIVE', 'NOTIFIED')
)
  THROW 51006, 'Tagged workflow state is unexpected.', 1;

INSERT INTO @Transitions
SELECT 'STAGING_FIXTURE_BOOK_REACTIVATE', 'BOOK', b.BookId, b.ISBN, b.Status, 'ACTIVE'
FROM Books b
WHERE b.BookId IN (@Fixture1BookId, @Fixture2BookId)
  AND b.Status = 'INACTIVE';

UPDATE Books
SET Status = 'ACTIVE', UpdatedBy = @ActorUserId, UpdatedAt = GETDATE()
WHERE BookId IN (@Fixture1BookId, @Fixture2BookId)
  AND Status = 'INACTIVE';

INSERT INTO @Transitions
SELECT 'STAGING_FIXTURE_COPY_AVAILABLE', 'BOOK_COPY', bc.CopyId, b.ISBN,
       bc.Status, 'AVAILABLE'
FROM BookCopies bc
INNER JOIN Books b ON b.BookId = bc.BookId
WHERE bc.CopyId IN (@Fixture1CopyId, @Fixture2CopyId)
  AND bc.Status IN ('BORROWED', 'RESERVED', 'INACTIVE');

UPDATE BookCopies
SET Status = 'AVAILABLE', Location = @Location, UpdatedAt = GETDATE()
WHERE CopyId IN (@Fixture1CopyId, @Fixture2CopyId)
  AND Status IN ('BORROWED', 'RESERVED', 'INACTIVE');

INSERT INTO AuditLogs (UserId, Action, TargetType, TargetId, Metadata)
SELECT @ActorUserId, transition.Action, transition.TargetType, transition.TargetId,
       (
         SELECT @Marker AS marker,
                'reset' AS mode,
                transition.FixtureIsbn AS fixtureIsbn,
                transition.FromStatus AS fromStatus,
                transition.ToStatus AS toStatus
         FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
       )
FROM @Transitions transition;

INSERT INTO AuditLogs (UserId, Action, TargetType, TargetId, Metadata)
SELECT @ActorUserId, transition.Action, transition.TargetType, transition.TargetId,
       (
         SELECT @Marker AS marker,
                'reset' AS mode,
                transition.FixtureIsbn AS fixtureIsbn,
                'Title' AS field,
                transition.FromTitle AS fromValue,
                transition.ToTitle AS toValue
         FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
       )
FROM @TitleTransitions transition;

INSERT INTO AuditLogs (UserId, Action, TargetType, TargetId, Metadata)
VALUES (
  @ActorUserId,
  'STAGING_BORROW_DEMO_RESET',
  'STAGING_FIXTURE',
  NULL,
  (
    SELECT @Marker AS marker,
           'reset' AS mode,
           @BusinessDate AS businessDate,
           (
             (SELECT COUNT(*) FROM @Transitions)
             + (SELECT COUNT(*) FROM @TitleTransitions)
           ) AS transitionCount
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
  )
);

SELECT
  2 AS FixtureCount,
  (
    (SELECT COUNT(*) FROM @Transitions)
    + (SELECT COUNT(*) FROM @TitleTransitions)
  ) AS TransitionCount,
  @BusinessDate AS BusinessDate;
`;

function assertStagingDatabase(env = process.env) {
  if (env.DB_NAME !== 'LibraryManagementStaging') {
    throw new Error('DB_NAME must be LibraryManagementStaging');
  }
}

function assertResetAllowed(env = process.env) {
  assertStagingDatabase(env);
  if (env.STAGING_DEMO_ALLOW_MUTATION !== 'true') {
    throw new Error('STAGING_DEMO_ALLOW_MUTATION must be true');
  }
}

function getMemberEmail(env) {
  const email = String(env.STAGING_DEMO_MEMBER_EMAIL || '').trim();
  if (!email || email.length > 255 || !email.includes('@')) {
    throw new Error('STAGING_DEMO_MEMBER_EMAIL must be a valid configured email');
  }
  return email;
}

function getBusinessDate(now = new Date()) {
  return formatBusinessDate(now);
}

async function inspectFixtures({ pool, sql }) {
  const result = await pool
    .request()
    .input('IsbnPrefix', sql.NVarChar(20), ISBN_PREFIX)
    .input('BarcodePrefix', sql.NVarChar(100), BARCODE_PREFIX)
    .input('Location', sql.NVarChar(100), LOCATION)
    .query(STATUS_SQL);

  return result.recordset.map((row) => ({
    bookId: row.BookId,
    isbn: row.ISBN,
    bookStatus: row.BookStatus,
    copyId: row.CopyId,
    barcode: row.Barcode,
    copyStatus: row.CopyStatus,
    openBorrowClaims: Number(row.OpenBorrowClaims || 0),
    openReservations: Number(row.OpenReservations || 0),
  }));
}

async function resetFixtures({ pool, sql, env = process.env, now = new Date() }) {
  assertResetAllowed(env);
  const memberEmail = getMemberEmail(env);
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const {
      start: businessDayStartUtc,
      end: businessDayEndUtc,
    } = businessDateUtcBounds(now);
    const request = new sql.Request(transaction)
      .input('MemberEmail', sql.NVarChar(255), memberEmail)
      .input('BusinessDate', sql.Date, getBusinessDate(now))
      .input('BusinessDayStartUtc', sql.DateTime, businessDayStartUtc)
      .input('BusinessDayEndUtc', sql.DateTime, businessDayEndUtc)
      .input('Fixture1Title', sql.NVarChar(255), FIXTURES[0].title)
      .input('Fixture1Isbn', sql.NVarChar(20), FIXTURES[0].isbn)
      .input('Fixture1Barcode', sql.NVarChar(100), FIXTURES[0].barcode)
      .input('Fixture2Title', sql.NVarChar(255), FIXTURES[1].title)
      .input('Fixture2Isbn', sql.NVarChar(20), FIXTURES[1].isbn)
      .input('Fixture2Barcode', sql.NVarChar(100), FIXTURES[1].barcode)
      .input('IsbnPrefix', sql.NVarChar(20), ISBN_PREFIX)
      .input('BarcodePrefix', sql.NVarChar(100), BARCODE_PREFIX)
      .input('Location', sql.NVarChar(100), LOCATION)
      .input('Marker', sql.NVarChar(100), MARKER);
    const result = await request.query(RESET_SQL);
    await transaction.commit();
    return result.recordset[0] || null;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function run({
  argv = process.argv.slice(2),
  env = process.env,
  db = defaultDb,
  logger = console,
  now = new Date(),
} = {}) {
  const mode = String(argv[0] || 'status').toLowerCase();
  if (!['status', 'reset'].includes(mode)) {
    throw new Error('Mode must be status or reset');
  }

  if (mode === 'reset') {
    assertResetAllowed(env);
    getMemberEmail(env);
  } else {
    assertStagingDatabase(env);
  }

  const pool = await db.getPool();
  try {
    if (mode === 'status') {
      const state = await inspectFixtures({ pool, sql: db.sql });
      logger.log('Staging borrow fixture status:', JSON.stringify(state));
      return state;
    }

    const summary = await resetFixtures({ pool, sql: db.sql, env, now });
    logger.log('Staging borrow fixtures reset:', JSON.stringify(summary));
    return summary;
  } finally {
    if (pool && typeof pool.close === 'function') {
      await pool.close();
    }
  }
}

if (require.main === module) {
  run().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  FIXTURES,
  RESET_SQL,
  STATUS_SQL,
  assertResetAllowed,
  assertStagingDatabase,
  getBusinessDate,
  inspectFixtures,
  resetFixtures,
  run,
};
