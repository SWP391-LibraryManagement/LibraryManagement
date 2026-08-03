'use strict';

require('dotenv').config({ quiet: true });

const { sql, getPool } = require('../src/config/db');

const RUN_ID_PATTERN = /^lms-acceptance-20260802-[0-9a-f]{8}$/;

const DISCOVERY_SQL = `
IF DB_NAME() <> 'LibraryManagementStaging'
  THROW 51000, 'Acceptance cleanup is restricted to LibraryManagementStaging.', 1;

;WITH CandidateCopies AS (
  SELECT
    SUBSTRING(bc.Barcode, 5, 64) AS RunId,
    b.BookId,
    bc.CopyId,
    b.ISBN AS StoredIsbn
  FROM Books b
  JOIN BookCopies bc ON bc.BookId = b.BookId
  WHERE bc.Barcode LIKE 'ACC-lms-acceptance-20260802-%'
    AND b.Title = CONCAT('Acceptance Book ', SUBSTRING(bc.Barcode, 5, 64))
),
CandidateRuns AS (
  SELECT
    candidate.RunId,
    RIGHT(candidate.RunId, 8) AS Suffix,
    COUNT(DISTINCT candidate.BookId) AS BookCount,
    COUNT(DISTINCT candidate.CopyId) AS CopyCount,
    MAX(candidate.StoredIsbn) AS StoredIsbn
  FROM CandidateCopies candidate
  WHERE @RunId IS NULL OR candidate.RunId = @RunId
  GROUP BY candidate.RunId
)
SELECT
  candidate.RunId,
  (
    SELECT COUNT(*)
    FROM Users u
    WHERE (u.Username = CONCAT('acc_member_a_', candidate.Suffix)
        AND u.Email = CONCAT('member-a.', candidate.Suffix, '@lms.invalid'))
       OR (u.Username = CONCAT('acc_member_b_', candidate.Suffix)
        AND u.Email = CONCAT('member-b.', candidate.Suffix, '@lms.invalid'))
       OR (u.Username = CONCAT('acc_librarian_', candidate.Suffix)
        AND u.Email = CONCAT('librarian.', candidate.Suffix, '@lms.invalid'))
       OR (u.Username = CONCAT('acc_admin_', candidate.Suffix)
        AND u.Email = CONCAT('admin.', candidate.Suffix, '@lms.invalid'))
  ) AS UserCount,
  candidate.BookCount,
  candidate.CopyCount,
  candidate.StoredIsbn
FROM CandidateRuns candidate
ORDER BY candidate.RunId;
`;

const CLEANUP_SQL = `
IF DB_NAME() <> 'LibraryManagementStaging'
  THROW 51000, 'Acceptance cleanup is restricted to LibraryManagementStaging.', 1;

DECLARE @Suffix NVARCHAR(8) = RIGHT(@RunId, 8);
DECLARE @FixtureUsers TABLE (UserId INT PRIMARY KEY);
DECLARE @FixtureBooks TABLE (BookId INT PRIMARY KEY);
DECLARE @FixtureCopies TABLE (CopyId INT PRIMARY KEY);
DECLARE @FixtureRequests TABLE (RequestId INT PRIMARY KEY);
DECLARE @FixtureDetails TABLE (BorrowDetailId INT PRIMARY KEY);
DECLARE @FixtureReservations TABLE (ReservationId INT PRIMARY KEY);
DECLARE @FixtureFines TABLE (FineId INT PRIMARY KEY);
DECLARE @FixtureNotifications TABLE (NotificationId INT PRIMARY KEY);
DECLARE @FixtureApplications TABLE (ApplicationId INT PRIMARY KEY);
DECLARE @FixtureMembers TABLE (MemberId INT PRIMARY KEY);

INSERT INTO @FixtureUsers (UserId)
SELECT u.UserId
FROM Users u
WHERE (u.Username = CONCAT('acc_member_a_', @Suffix)
    AND u.Email = CONCAT('member-a.', @Suffix, '@lms.invalid'))
   OR (u.Username = CONCAT('acc_member_b_', @Suffix)
    AND u.Email = CONCAT('member-b.', @Suffix, '@lms.invalid'))
   OR (u.Username = CONCAT('acc_librarian_', @Suffix)
    AND u.Email = CONCAT('librarian.', @Suffix, '@lms.invalid'))
   OR (u.Username = CONCAT('acc_admin_', @Suffix)
    AND u.Email = CONCAT('admin.', @Suffix, '@lms.invalid'));

INSERT INTO @FixtureBooks (BookId)
SELECT b.BookId
FROM Books b
JOIN BookCopies bc ON bc.BookId = b.BookId
WHERE b.Title = @Title
  AND bc.Barcode = @Barcode;

INSERT INTO @FixtureCopies (CopyId)
SELECT bc.CopyId
FROM BookCopies bc
WHERE bc.Barcode = @Barcode
  AND bc.BookId IN (SELECT BookId FROM @FixtureBooks);

IF (SELECT COUNT(*) FROM @FixtureUsers) <> 4
   OR (SELECT COUNT(*) FROM @FixtureBooks) <> 1
   OR (SELECT COUNT(*) FROM @FixtureCopies) <> 1
  THROW 51001, 'Acceptance fixture identity is incomplete; refusing cleanup.', 1;

INSERT INTO @FixtureRequests (RequestId)
SELECT DISTINCT br.RequestId
FROM BorrowRequests br
LEFT JOIN BorrowDetails bd ON bd.RequestId = br.RequestId
WHERE br.UserId IN (SELECT UserId FROM @FixtureUsers)
   OR bd.CopyId IN (SELECT CopyId FROM @FixtureCopies);

INSERT INTO @FixtureDetails (BorrowDetailId)
SELECT bd.BorrowDetailId
FROM BorrowDetails bd
WHERE bd.RequestId IN (SELECT RequestId FROM @FixtureRequests)
   OR bd.CopyId IN (SELECT CopyId FROM @FixtureCopies);

INSERT INTO @FixtureReservations (ReservationId)
SELECT r.ReservationId
FROM Reservations r
WHERE r.UserId IN (SELECT UserId FROM @FixtureUsers)
   OR r.CopyId IN (SELECT CopyId FROM @FixtureCopies);

INSERT INTO @FixtureFines (FineId)
SELECT f.FineId
FROM Fines f
WHERE f.UserId IN (SELECT UserId FROM @FixtureUsers)
   OR f.BorrowDetailId IN (SELECT BorrowDetailId FROM @FixtureDetails);

INSERT INTO @FixtureNotifications (NotificationId)
SELECT n.NotificationId
FROM Notifications n
WHERE n.UserId IN (SELECT UserId FROM @FixtureUsers);

INSERT INTO @FixtureApplications (ApplicationId)
SELECT application.ApplicationId
FROM MembershipApplications application
WHERE application.UserId IN (SELECT UserId FROM @FixtureUsers);

INSERT INTO @FixtureMembers (MemberId)
SELECT member.MemberId
FROM Members member
WHERE member.UserId IN (SELECT UserId FROM @FixtureUsers);

DELETE FROM NotificationAttempts
WHERE NotificationId IN (SELECT NotificationId FROM @FixtureNotifications);

DELETE FROM Notifications
WHERE NotificationId IN (SELECT NotificationId FROM @FixtureNotifications);

DELETE FROM Fines
WHERE FineId IN (SELECT FineId FROM @FixtureFines);

DELETE FROM Reservations
WHERE ReservationId IN (SELECT ReservationId FROM @FixtureReservations);

DELETE FROM BorrowDetails
WHERE BorrowDetailId IN (SELECT BorrowDetailId FROM @FixtureDetails);

DELETE FROM BorrowRequests
WHERE RequestId IN (SELECT RequestId FROM @FixtureRequests);

DELETE FROM MembershipApplications
WHERE ApplicationId IN (SELECT ApplicationId FROM @FixtureApplications);

DELETE FROM Members
WHERE MemberId IN (SELECT MemberId FROM @FixtureMembers);

DELETE FROM AuthTokens
WHERE UserId IN (SELECT UserId FROM @FixtureUsers);

DELETE FROM LoginFailureAttempts
WHERE UserId IN (SELECT UserId FROM @FixtureUsers);

DELETE FROM AuditLogs
WHERE UserId IN (SELECT UserId FROM @FixtureUsers)
   OR (TargetType IN ('USER', 'USER_PROFILE') AND TargetId IN (SELECT UserId FROM @FixtureUsers))
   OR (TargetType = 'MEMBERSHIP_APPLICATION' AND TargetId IN (SELECT ApplicationId FROM @FixtureApplications))
   OR (TargetType = 'BOOK' AND TargetId IN (SELECT BookId FROM @FixtureBooks))
   OR (TargetType = 'BOOK_COPY' AND TargetId IN (SELECT CopyId FROM @FixtureCopies))
   OR (TargetType = 'BORROWING' AND TargetId IN (SELECT RequestId FROM @FixtureRequests))
   OR (TargetType = 'BORROW_DETAIL' AND TargetId IN (SELECT BorrowDetailId FROM @FixtureDetails))
   OR (TargetType = 'RESERVATION' AND TargetId IN (SELECT ReservationId FROM @FixtureReservations))
   OR (TargetType = 'FINE' AND TargetId IN (SELECT FineId FROM @FixtureFines))
   OR (TargetType = 'NOTIFICATION' AND TargetId IN (SELECT NotificationId FROM @FixtureNotifications));

DELETE FROM BookCopies
WHERE CopyId IN (SELECT CopyId FROM @FixtureCopies);

DELETE FROM Books
WHERE BookId IN (SELECT BookId FROM @FixtureBooks);

DELETE FROM UserProfiles
WHERE UserId IN (SELECT UserId FROM @FixtureUsers);

DELETE FROM UserRoles
WHERE UserId IN (SELECT UserId FROM @FixtureUsers);

DELETE FROM Users
WHERE UserId IN (SELECT UserId FROM @FixtureUsers);

IF EXISTS (
  SELECT 1
  FROM Users u
  WHERE (u.Username = CONCAT('acc_member_a_', @Suffix)
      AND u.Email = CONCAT('member-a.', @Suffix, '@lms.invalid'))
     OR (u.Username = CONCAT('acc_member_b_', @Suffix)
      AND u.Email = CONCAT('member-b.', @Suffix, '@lms.invalid'))
     OR (u.Username = CONCAT('acc_librarian_', @Suffix)
      AND u.Email = CONCAT('librarian.', @Suffix, '@lms.invalid'))
     OR (u.Username = CONCAT('acc_admin_', @Suffix)
      AND u.Email = CONCAT('admin.', @Suffix, '@lms.invalid'))
)
   OR EXISTS (SELECT 1 FROM Books WHERE Title = @Title)
   OR EXISTS (SELECT 1 FROM BookCopies WHERE Barcode = @Barcode)
  THROW 51002, 'Acceptance fixture residue remains after cleanup.', 1;

SELECT @RunId AS RunId, 'DELETED' AS Status;
`;

function validateRunId(runId) {
  return RUN_ID_PATTERN.test(String(runId || ''));
}

function buildSyntheticIsbn(runId) {
  if (!validateRunId(runId)) throw new Error('Invalid acceptance run ID.');
  return `ACC-${runId.slice(-8)}`;
}

function parseArguments(argv = []) {
  let execute = false;
  let runId = null;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--execute') {
      if (execute) throw new Error('Duplicate --execute argument.');
      execute = true;
      continue;
    }
    if (argument === '--run-id') {
      if (runId) throw new Error('Duplicate --run-id argument.');
      const value = argv[index + 1];
      if (!value) throw new Error('--run-id requires a value.');
      if (!validateRunId(value)) throw new Error('Invalid acceptance run ID.');
      runId = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }

  return { execute, runId };
}

function normalizeCandidate(row) {
  const runId = String(row.RunId || '');
  if (!validateRunId(runId)) throw new Error(`Invalid discovered acceptance run ID: ${runId || '(empty)'}.`);
  return {
    runId,
    userCount: Number(row.UserCount || 0),
    bookCount: Number(row.BookCount || 0),
    copyCount: Number(row.CopyCount || 0),
    storedIsbn: row.StoredIsbn || null,
    expectedIsbn: buildSyntheticIsbn(runId),
  };
}

function validateCandidate(candidate) {
  if (candidate.userCount !== 4 || candidate.bookCount !== 1 || candidate.copyCount !== 1) {
    throw new Error(
      `Fixture identity is incomplete for ${candidate.runId}: users=${candidate.userCount}, books=${candidate.bookCount}, copies=${candidate.copyCount}.`
    );
  }
  if (candidate.storedIsbn && candidate.storedIsbn !== candidate.expectedIsbn) {
    throw new Error(`Fixture ISBN is unexpected for ${candidate.runId}.`);
  }
}

async function discoverFixtures(pool, runId = null) {
  const result = await pool.request()
    .input('RunId', sql.NVarChar(64), runId)
    .query(DISCOVERY_SQL);
  return (result.recordset || []).map(normalizeCandidate);
}

async function deleteFixtureRun(pool, runId) {
  if (!validateRunId(runId)) throw new Error('Invalid acceptance run ID.');

  const transaction = new sql.Transaction(pool);
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    const result = await new sql.Request(transaction)
      .input('RunId', sql.NVarChar(64), runId)
      .input('Title', sql.NVarChar(255), `Acceptance Book ${runId}`)
      .input('Barcode', sql.NVarChar(100), `ACC-${runId}`)
      .query(CLEANUP_SQL);
    await transaction.commit();
    return {
      runId,
      status: result.recordset?.[0]?.Status || 'DELETED',
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function runCleanup({ pool, argv = [] }) {
  const options = parseArguments(argv);
  const candidates = await discoverFixtures(pool, options.runId);

  if (options.runId && candidates.length === 0) {
    throw new Error(`No acceptance fixture found for ${options.runId}.`);
  }
  if (!options.execute) return { mode: 'dry-run', candidates };

  candidates.forEach(validateCandidate);
  const deleted = [];
  for (const candidate of candidates) {
    deleted.push(await deleteFixtureRun(pool, candidate.runId));
  }
  return { mode: 'execute', deleted };
}

async function main() {
  const pool = await getPool();
  try {
    const result = await runCleanup({ pool, argv: process.argv.slice(2) });
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } finally {
    await pool.close();
  }
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  CLEANUP_SQL,
  DISCOVERY_SQL,
  buildSyntheticIsbn,
  deleteFixtureRun,
  discoverFixtures,
  parseArguments,
  runCleanup,
  validateCandidate,
  validateRunId,
};
