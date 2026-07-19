const dotenv = require('dotenv');

if (process.env.FE07_SQL_TEST_ENV_FILE) {
  dotenv.config({ path: process.env.FE07_SQL_TEST_ENV_FILE, quiet: true });
} else {
  dotenv.config({ quiet: true });
}

if (process.env.FE07_SQL_TEST_ALLOW_MUTATION !== 'true') {
  throw new Error('FE07 SQL test requires FE07_SQL_TEST_ALLOW_MUTATION=true before inserting test data.');
}

const { sql, getPool, resetPoolForTests } = require('../../src/config/db');
const borrowingRepository = require('../../src/repositories/borrowingRepository');
const reservationRepository = require('../../src/repositories/reservationRepository');
const auditLogRepository = require('../../src/repositories/auditLogRepository');

jest.setTimeout(30000);

let pool;
let seedNumber = 0;

function makeSeedKey() {
  seedNumber += 1;
  return `fe07sql${Date.now()}${process.pid}${seedNumber}`;
}

async function insertUser(seed, suffix) {
  const result = await pool
    .request()
    .input('Username', sql.NVarChar(50), `${seed.key}${suffix}`.slice(0, 50))
    .input('Email', sql.NVarChar(100), `${seed.key}.${suffix}@example.test`.slice(0, 100))
    .input('PasswordHash', sql.NVarChar(255), 'sql-test-password-hash')
    .query(`
      INSERT INTO Users (Username, Email, PasswordHash, Status, EmailVerifiedAt)
      OUTPUT INSERTED.UserId
      VALUES (@Username, @Email, @PasswordHash, 'ACTIVE', GETDATE())
    `);

  const userId = result.recordset[0].UserId;
  seed.userIds.push(userId);
  return userId;
}

async function insertMember(userId, approvedBy) {
  await pool
    .request()
    .input('UserId', sql.Int, userId)
    .input('ApprovedBy', sql.Int, approvedBy)
    .query(`
      INSERT INTO Members (UserId, Status, ApprovedAt, ApprovedBy)
      VALUES (@UserId, 'APPROVED', GETDATE(), @ApprovedBy)
    `);
}

async function findExistingBookId() {
  const result = await pool.request().query('SELECT TOP 1 BookId FROM Books ORDER BY BookId ASC');

  if (!result.recordset.length) {
    throw new Error('FE07 SQL test requires at least one existing Book row.');
  }

  return result.recordset[0].BookId;
}

async function insertCopies(seed, bookId, count) {
  const copyIds = [];

  for (let index = 0; index < count; index += 1) {
    const result = await pool
      .request()
      .input('BookId', sql.Int, bookId)
      .input('Barcode', sql.NVarChar(100), `${seed.key}-copy-${index}`)
      .input('Location', sql.NVarChar(100), 'FE07 SQL test')
      .query(`
        INSERT INTO BookCopies (BookId, Barcode, Status, Location)
        OUTPUT INSERTED.CopyId
        VALUES (@BookId, @Barcode, 'AVAILABLE', @Location)
    `);

    const copyId = result.recordset[0].CopyId;
    seed.copyIds.push(copyId);
    copyIds.push(copyId);
  }

  return copyIds;
}

async function insertBorrowRequest(seed, { userId, createdBy, status = 'PENDING' }) {
  const result = await pool
    .request()
    .input('UserId', sql.Int, userId)
    .input('CreatedBy', sql.Int, createdBy)
    .input('Status', sql.NVarChar(20), status)
    .input('ApprovedBy', sql.Int, status === 'APPROVED' ? createdBy : null)
    .query(`
      INSERT INTO BorrowRequests (UserId, Status, CreatedBy, ApprovedBy, ApprovedAt, ProcessedAt)
      OUTPUT INSERTED.RequestId
      VALUES (
        @UserId,
        @Status,
        @CreatedBy,
        @ApprovedBy,
        CASE WHEN @Status = 'APPROVED' THEN GETDATE() ELSE NULL END,
        CASE WHEN @Status = 'APPROVED' THEN GETDATE() ELSE NULL END
      )
    `);

  const requestId = result.recordset[0].RequestId;
  seed.requestIds.push(requestId);
  return requestId;
}

async function insertBorrowDetail(seed, { requestId, copyId, status, dueDate = null }) {
  const result = await pool
    .request()
    .input('RequestId', sql.Int, requestId)
    .input('CopyId', sql.Int, copyId)
    .input('Status', sql.NVarChar(20), status)
    .input('DueDate', sql.Date, dueDate)
    .query(`
      INSERT INTO BorrowDetails (RequestId, CopyId, BorrowDate, DueDate, RenewalCount, Status)
      OUTPUT INSERTED.BorrowDetailId
      VALUES (
        @RequestId,
        @CopyId,
        CASE WHEN @Status = 'BORROWED' THEN CAST(GETDATE() AS DATE) ELSE NULL END,
        CASE WHEN @Status = 'BORROWED' THEN COALESCE(@DueDate, DATEADD(DAY, 14, CAST(GETDATE() AS DATE))) ELSE NULL END,
        0,
        @Status
      )
    `);

  const borrowDetailId = result.recordset[0].BorrowDetailId;
  seed.borrowDetailIds.push(borrowDetailId);
  return borrowDetailId;
}

async function insertReservation(
  seed,
  { userId, copyId, status, reservedAt, notifiedAt = null, expiresAt = null }
) {
  const result = await pool
    .request()
    .input('UserId', sql.Int, userId)
    .input('CopyId', sql.Int, copyId)
    .input('Status', sql.NVarChar(20), status)
    .input('ReservedAt', sql.DateTime, reservedAt)
    .input('NotifiedAt', sql.DateTime, notifiedAt)
    .input('ExpiresAt', sql.DateTime, expiresAt)
    .query(`
      INSERT INTO Reservations (UserId, CopyId, ReservedAt, NotifiedAt, ExpiresAt, Status)
      OUTPUT INSERTED.ReservationId
      VALUES (@UserId, @CopyId, @ReservedAt, @NotifiedAt, @ExpiresAt, @Status)
    `);
  const reservationId = result.recordset[0].ReservationId;
  seed.reservationIds.push(reservationId);
  return reservationId;
}

async function insertUnpaidFine(userId, borrowDetailId) {
  await pool
    .request()
    .input('UserId', sql.Int, userId)
    .input('BorrowDetailId', sql.Int, borrowDetailId)
    .query(`
      INSERT INTO Fines (UserId, BorrowDetailId, Amount, Reason, Status)
      VALUES (@UserId, @BorrowDetailId, 1, 'FE07 SQL eligibility test', 'UNPAID')
    `);
}

async function setCopyStatus(copyId, status) {
  await pool
    .request()
    .input('CopyId', sql.Int, copyId)
    .input('Status', sql.NVarChar(20), status)
    .query('UPDATE BookCopies SET Status = @Status WHERE CopyId = @CopyId');
}

function createSeed() {
  return {
    key: makeSeedKey(),
    userIds: [],
    copyIds: [],
    requestIds: [],
    borrowDetailIds: [],
    reservationIds: [],
  };
}

async function cleanSeed(seed) {
  for (const reservationId of seed.reservationIds) {
    await pool
      .request()
      .input('ReservationId', sql.Int, reservationId)
      .query(`
        DELETE FROM AuditLogs
        WHERE TargetType = 'RESERVATION'
          AND TargetId = @ReservationId
      `);
  }

  for (const requestId of seed.requestIds) {
    await pool
      .request()
      .input('RequestId', sql.Int, requestId)
      .query(`
        DELETE FROM AuditLogs
        WHERE Action = 'BORROW_REQUEST_APPROVE'
          AND TargetId = @RequestId
      `);
  }

  for (const borrowDetailId of seed.borrowDetailIds) {
    await pool
      .request()
      .input('BorrowDetailId', sql.Int, borrowDetailId)
      .query(`
        DELETE FROM AuditLogs
        WHERE Action = 'BORROW_DETAIL_RETURN'
          AND TargetId = @BorrowDetailId
      `);
  }

  for (const userId of seed.userIds) {
    await pool.request().input('UserId', sql.Int, userId).query('DELETE FROM Fines WHERE UserId = @UserId');
  }

  for (const requestId of seed.requestIds) {
    await pool
      .request()
      .input('RequestId', sql.Int, requestId)
      .query('DELETE FROM BorrowDetails WHERE RequestId = @RequestId');
  }

  for (const requestId of seed.requestIds) {
    await pool
      .request()
      .input('RequestId', sql.Int, requestId)
      .query('DELETE FROM BorrowRequests WHERE RequestId = @RequestId');
  }

  for (const reservationId of seed.reservationIds) {
    await pool
      .request()
      .input('ReservationId', sql.Int, reservationId)
      .query('DELETE FROM Reservations WHERE ReservationId = @ReservationId');
  }

  for (const copyId of seed.copyIds) {
    await pool.request().input('CopyId', sql.Int, copyId).query('DELETE FROM BookCopies WHERE CopyId = @CopyId');
  }

  for (const userId of seed.userIds) {
    await pool.request().input('UserId', sql.Int, userId).query('DELETE FROM Members WHERE UserId = @UserId');
  }

  for (const userId of seed.userIds) {
    await pool.request().input('UserId', sql.Int, userId).query('DELETE FROM Users WHERE UserId = @UserId');
  }
}

async function approve(requestId, actorUserId) {
  return borrowingRepository.approveBorrowRequest({
    requestId,
    approvedBy: actorUserId,
    approvalDate: new Date('2026-07-13T00:00:00.000Z'),
    dueDate: new Date('2026-07-27T00:00:00.000Z'),
    auditLogRepository,
    auditEntry: {
      userId: actorUserId,
      action: 'BORROW_REQUEST_APPROVE',
      targetType: 'BORROWING',
      targetId: requestId,
      metadata: { source: 'FE07_SQL_TEST' },
      ipAddress: null,
      userAgent: 'fe07-sql-test',
    },
  });
}

async function returnDetail(borrowDetailId, actorUserId, returnDate) {
  return borrowingRepository.returnBorrowDetail({
    borrowDetailId,
    detailStatus: 'RETURNED',
    copyStatus: 'AVAILABLE',
    returnDate,
    auditLogRepository,
    auditEntry: {
      userId: actorUserId,
      action: 'BORROW_DETAIL_RETURN',
      targetType: 'BORROW_DETAIL',
      targetId: borrowDetailId,
      metadata: { source: 'FE07_SQL_TEST' },
      ipAddress: null,
      userAgent: 'fe07-sql-test',
    },
  });
}

function installTwoPartyMemberLockBarrier() {
  const originalQuery = sql.Request.prototype.query;
  const arrivalResources = [];
  let arrivalCount = 0;
  let released = false;
  let restored = false;
  let releaseBarrier;
  let barrierError;
  const barrier = new Promise((resolve) => {
    releaseBarrier = resolve;
  });

  function release(error) {
    if (released) {
      return;
    }

    released = true;
    barrierError = error;
    clearTimeout(timeout);
    releaseBarrier();
  }

  const timeout = setTimeout(
    () => release(new Error('FE07 SQL approval barrier expected two member-lock arrivals.')),
    5000
  );

  sql.Request.prototype.query = async function queryWithMemberLockBarrier(queryText, ...args) {
    const isMemberLock =
      typeof queryText === 'string' &&
      queryText.includes('sp_getapplock') &&
      this.parameters.MemberLockResource;

    if (!isMemberLock) {
      return originalQuery.call(this, queryText, ...args);
    }

    arrivalCount += 1;
    arrivalResources.push(this.parameters.MemberLockResource.value);
    if (arrivalCount === 2) {
      release();
    }

    await barrier;
    if (barrierError) {
      throw barrierError;
    }

    return originalQuery.call(this, queryText, ...args);
  };

  return {
    getArrivalCount: () => arrivalCount,
    getArrivalResources: () => [...arrivalResources],
    restore: () => {
      if (restored) {
        return;
      }

      restored = true;
      clearTimeout(timeout);
      if (!released) {
        release(new Error('FE07 SQL approval barrier aborted before two member-lock arrivals.'));
      }
      sql.Request.prototype.query = originalQuery;
    },
  };
}

beforeAll(async () => {
  try {
    pool = await getPool();
  } catch (_error) {
    throw new Error(
      'FE07 SQL test requires reachable SQL Server configuration from environment variables or FE07_SQL_TEST_ENV_FILE.'
    );
  }
});

afterAll(async () => {
  if (pool) {
    await pool.close();
  }

  resetPoolForTests();
});

test('active reservation queue blocks ordinary SQL approval before queue hold succeeds', async () => {
  const seed = createSeed();

  try {
    const borrowerUserId = await insertUser(seed, 'queue-borrower');
    const queueOwnerUserId = await insertUser(seed, 'queue-owner');
    const actorUserId = await insertUser(seed, 'queue-actor');
    await insertMember(borrowerUserId, actorUserId);
    const bookId = await findExistingBookId();
    const [copyId] = await insertCopies(seed, bookId, 1);
    const requestId = await insertBorrowRequest(seed, {
      userId: borrowerUserId,
      createdBy: borrowerUserId,
    });
    await insertBorrowDetail(seed, { requestId, copyId, status: 'REQUESTED' });
    const reservationId = await insertReservation(seed, {
      userId: queueOwnerUserId,
      copyId,
      status: 'ACTIVE',
      reservedAt: new Date('2026-07-12T00:00:00.000Z'),
    });

    await expect(approve(requestId, actorUserId)).resolves.toEqual({
      outcome: 'RESERVATION_QUEUE_PRIORITY',
    });
    const held = await reservationRepository.holdReservation({
      reservationId,
      copyId,
      notifiedAt: new Date('2026-07-13T00:00:00.000Z'),
      expiresAt: new Date('2026-07-15T00:00:00.000Z'),
    });

    expect(held).toMatchObject({ reservationId, status: 'NOTIFIED' });
    const requestRow = await pool
      .request()
      .input('RequestId', sql.Int, requestId)
      .query('SELECT Status FROM BorrowRequests WHERE RequestId = @RequestId');
    expect(requestRow.recordset[0].Status).toBe('PENDING');
    const copyRow = await pool
      .request()
      .input('CopyId', sql.Int, copyId)
      .query('SELECT Status FROM BookCopies WHERE CopyId = @CopyId');
    expect(copyRow.recordset[0].Status).toBe('RESERVED');
  } finally {
    await cleanSeed(seed);
  }
});

test('held owner SQL approval fulfills the reservation atomically', async () => {
  const seed = createSeed();

  try {
    const borrowerUserId = await insertUser(seed, 'held-owner');
    const actorUserId = await insertUser(seed, 'held-actor');
    await insertMember(borrowerUserId, actorUserId);
    const bookId = await findExistingBookId();
    const [copyId] = await insertCopies(seed, bookId, 1);
    await setCopyStatus(copyId, 'RESERVED');
    const reservationId = await insertReservation(seed, {
      userId: borrowerUserId,
      copyId,
      status: 'NOTIFIED',
      reservedAt: new Date('2026-07-12T00:00:00.000Z'),
      notifiedAt: new Date('2026-07-13T00:00:00.000Z'),
      expiresAt: new Date('2026-07-15T00:00:00.000Z'),
    });
    const requestId = await insertBorrowRequest(seed, {
      userId: borrowerUserId,
      createdBy: borrowerUserId,
    });
    await insertBorrowDetail(seed, { requestId, copyId, status: 'REQUESTED' });

    const result = await approve(requestId, actorUserId);

    expect(result.outcome).toBe('APPROVED');
    expect(result.fulfilledReservationIds).toEqual([reservationId]);
    const state = await pool
      .request()
      .input('RequestId', sql.Int, requestId)
      .input('CopyId', sql.Int, copyId)
      .input('ReservationId', sql.Int, reservationId)
      .query(`
        SELECT
          (SELECT Status FROM BorrowRequests WHERE RequestId = @RequestId) AS RequestStatus,
          (SELECT Status FROM BookCopies WHERE CopyId = @CopyId) AS CopyStatus,
          (SELECT Status FROM Reservations WHERE ReservationId = @ReservationId) AS ReservationStatus
      `);
    expect(state.recordset[0]).toMatchObject({
      RequestStatus: 'APPROVED',
      CopyStatus: 'BORROWED',
      ReservationStatus: 'FULFILLED',
    });
  } finally {
    await cleanSeed(seed);
  }
});

test('two SQL approvals for one held copy allow exactly one success', async () => {
  const seed = createSeed();

  try {
    const borrowerUserId = await insertUser(seed, 'held-race-owner');
    const actorUserId = await insertUser(seed, 'held-race-actor');
    await insertMember(borrowerUserId, actorUserId);
    const bookId = await findExistingBookId();
    const [copyId] = await insertCopies(seed, bookId, 1);
    await setCopyStatus(copyId, 'RESERVED');
    const reservationId = await insertReservation(seed, {
      userId: borrowerUserId,
      copyId,
      status: 'NOTIFIED',
      reservedAt: new Date('2026-07-12T00:00:00.000Z'),
      notifiedAt: new Date('2026-07-13T00:00:00.000Z'),
      expiresAt: new Date('2026-07-15T00:00:00.000Z'),
    });
    const requestIds = [];

    for (let index = 0; index < 2; index += 1) {
      const requestId = await insertBorrowRequest(seed, {
        userId: borrowerUserId,
        createdBy: borrowerUserId,
      });
      await insertBorrowDetail(seed, { requestId, copyId, status: 'REQUESTED' });
      requestIds.push(requestId);
    }

    const results = await Promise.all(requestIds.map((requestId) => approve(requestId, actorUserId)));

    expect(results.filter(({ outcome }) => outcome === 'APPROVED')).toHaveLength(1);
    expect(results.filter(({ outcome }) => outcome !== 'APPROVED')).toHaveLength(1);
    const requestRows = await pool
      .request()
      .input('FirstRequestId', sql.Int, requestIds[0])
      .input('SecondRequestId', sql.Int, requestIds[1])
      .query(`
        SELECT Status
        FROM BorrowRequests
        WHERE RequestId IN (@FirstRequestId, @SecondRequestId)
        ORDER BY RequestId ASC
      `);
    expect(requestRows.recordset.map(({ Status }) => Status).sort()).toEqual([
      'APPROVED',
      'PENDING',
    ]);
    const finalState = await pool
      .request()
      .input('CopyId', sql.Int, copyId)
      .input('ReservationId', sql.Int, reservationId)
      .query(`
        SELECT
          (SELECT Status FROM BookCopies WHERE CopyId = @CopyId) AS CopyStatus,
          (SELECT Status FROM Reservations WHERE ReservationId = @ReservationId) AS ReservationStatus,
          (SELECT COUNT(*) FROM BorrowDetails WHERE CopyId = @CopyId AND Status = 'BORROWED') AS BorrowedCount
      `);
    expect(finalState.recordset[0]).toMatchObject({
      CopyStatus: 'BORROWED',
      ReservationStatus: 'FULFILLED',
      BorrowedCount: 1,
    });
  } finally {
    await cleanSeed(seed);
  }
});

test.each(['cancel', 'expire'])(
  '%s release versus SQL approval serializes without bypassing the remaining queue',
  async (releaseAction) => {
    const seed = createSeed();

    try {
      const borrowerUserId = await insertUser(seed, `${releaseAction}-owner`);
      const nextUserId = await insertUser(seed, `${releaseAction}-next`);
      const actorUserId = await insertUser(seed, `${releaseAction}-actor`);
      await insertMember(borrowerUserId, actorUserId);
      const bookId = await findExistingBookId();
      const [copyId] = await insertCopies(seed, bookId, 1);
      await setCopyStatus(copyId, 'RESERVED');
      const heldReservationId = await insertReservation(seed, {
        userId: borrowerUserId,
        copyId,
        status: 'NOTIFIED',
        reservedAt: new Date('2026-07-11T00:00:00.000Z'),
        notifiedAt: new Date('2026-07-12T00:00:00.000Z'),
        expiresAt: new Date('2026-07-12T12:00:00.000Z'),
      });
      const nextReservationId = await insertReservation(seed, {
        userId: nextUserId,
        copyId,
        status: 'ACTIVE',
        reservedAt: new Date('2026-07-12T01:00:00.000Z'),
      });
      const requestId = await insertBorrowRequest(seed, {
        userId: borrowerUserId,
        createdBy: borrowerUserId,
      });
      await insertBorrowDetail(seed, { requestId, copyId, status: 'REQUESTED' });
      const release =
        releaseAction === 'cancel'
          ? reservationRepository.cancelReservation(heldReservationId)
          : reservationRepository.expireOverdueHolds(new Date('2026-07-13T00:00:00.000Z'));

      const settlements = await Promise.allSettled([approve(requestId, actorUserId), release]);

      expect(settlements.map(({ status }) => status)).toEqual(['fulfilled', 'fulfilled']);
      const approvalResult = settlements[0].value;
      const state = await pool
        .request()
        .input('RequestId', sql.Int, requestId)
        .input('CopyId', sql.Int, copyId)
        .input('HeldReservationId', sql.Int, heldReservationId)
        .input('NextReservationId', sql.Int, nextReservationId)
        .query(`
          SELECT
            (SELECT Status FROM BorrowRequests WHERE RequestId = @RequestId) AS RequestStatus,
            (SELECT Status FROM BookCopies WHERE CopyId = @CopyId) AS CopyStatus,
            (SELECT Status FROM Reservations WHERE ReservationId = @HeldReservationId) AS HeldStatus,
            (SELECT Status FROM Reservations WHERE ReservationId = @NextReservationId) AS NextStatus
        `);
      const finalState = state.recordset[0];

      expect(finalState.NextStatus).toBe('ACTIVE');
      if (approvalResult.outcome === 'APPROVED') {
        expect(finalState).toMatchObject({
          RequestStatus: 'APPROVED',
          CopyStatus: 'BORROWED',
          HeldStatus: 'FULFILLED',
        });
      } else {
        expect(approvalResult.outcome).toBe('RESERVATION_QUEUE_PRIORITY');
        expect(finalState).toMatchObject({
          RequestStatus: 'PENDING',
          CopyStatus: 'AVAILABLE',
          HeldStatus: releaseAction === 'cancel' ? 'CANCELLED' : 'EXPIRED',
        });
      }
    } finally {
      await cleanSeed(seed);
    }
  }
);

test('SQL reservation audit failure rolls back borrowing and fulfillment state', async () => {
  const seed = createSeed();

  try {
    const borrowerUserId = await insertUser(seed, 'reservation-audit-owner');
    const actorUserId = await insertUser(seed, 'reservation-audit-actor');
    await insertMember(borrowerUserId, actorUserId);
    const bookId = await findExistingBookId();
    const [copyId] = await insertCopies(seed, bookId, 1);
    await setCopyStatus(copyId, 'RESERVED');
    const reservationId = await insertReservation(seed, {
      userId: borrowerUserId,
      copyId,
      status: 'NOTIFIED',
      reservedAt: new Date('2026-07-12T00:00:00.000Z'),
      notifiedAt: new Date('2026-07-13T00:00:00.000Z'),
      expiresAt: new Date('2026-07-15T00:00:00.000Z'),
    });
    const requestId = await insertBorrowRequest(seed, {
      userId: borrowerUserId,
      createdBy: borrowerUserId,
    });
    const borrowDetailId = await insertBorrowDetail(seed, {
      requestId,
      copyId,
      status: 'REQUESTED',
    });
    const reservationAuditFailingRepository = {
      create: jest.fn(async (entry) => {
        await auditLogRepository.create(entry);
        if (entry.action === 'RESERVATION_FULFILL') {
          throw new Error('SQL reservation audit failure');
        }
      }),
    };

    await expect(
      borrowingRepository.approveBorrowRequest({
        requestId,
        approvedBy: actorUserId,
        approvalDate: new Date('2026-07-13T00:00:00.000Z'),
        dueDate: new Date('2026-07-27T00:00:00.000Z'),
        auditLogRepository: reservationAuditFailingRepository,
        auditEntry: {
          userId: actorUserId,
          action: 'BORROW_REQUEST_APPROVE',
          targetType: 'BORROWING',
          targetId: requestId,
          metadata: { source: 'FE07_SQL_RESERVATION_AUDIT_ROLLBACK' },
          ipAddress: null,
          userAgent: 'fe07-sql-reservation-audit-rollback',
        },
      })
    ).rejects.toThrow('SQL reservation audit failure');

    expect(reservationAuditFailingRepository.create).toHaveBeenCalledTimes(2);
    const state = await pool
      .request()
      .input('RequestId', sql.Int, requestId)
      .input('BorrowDetailId', sql.Int, borrowDetailId)
      .input('CopyId', sql.Int, copyId)
      .input('ReservationId', sql.Int, reservationId)
      .query(`
        SELECT
          (SELECT Status FROM BorrowRequests WHERE RequestId = @RequestId) AS RequestStatus,
          (SELECT Status FROM BorrowDetails WHERE BorrowDetailId = @BorrowDetailId) AS DetailStatus,
          (SELECT Status FROM BookCopies WHERE CopyId = @CopyId) AS CopyStatus,
          (SELECT Status FROM Reservations WHERE ReservationId = @ReservationId) AS ReservationStatus,
          (SELECT COUNT(*) FROM AuditLogs WHERE
             (Action = 'BORROW_REQUEST_APPROVE' AND TargetId = @RequestId)
             OR (Action = 'RESERVATION_FULFILL' AND TargetId = @ReservationId)) AS AuditCount
      `);
    expect(state.recordset[0]).toMatchObject({
      RequestStatus: 'PENDING',
      DetailStatus: 'REQUESTED',
      CopyStatus: 'RESERVED',
      ReservationStatus: 'NOTIFIED',
      AuditCount: 0,
    });
  } finally {
    await cleanSeed(seed);
  }
});

test('approval does not approve a pending request whose member row is missing', async () => {
  const seed = createSeed();

  try {
    const borrowerUserId = await insertUser(seed, 'borrower');
    const actorUserId = await insertUser(seed, 'actor');
    const bookId = await findExistingBookId();
    const [copyId] = await insertCopies(seed, bookId, 1);
    const requestId = await insertBorrowRequest(seed, {
      userId: borrowerUserId,
      createdBy: borrowerUserId,
    });
    await insertBorrowDetail(seed, { requestId, copyId, status: 'REQUESTED' });

    const result = await approve(requestId, actorUserId);

    expect(result).toEqual({ outcome: 'REQUEST_NOT_APPROVABLE' });
    const requestRow = await pool
      .request()
      .input('RequestId', sql.Int, requestId)
      .query('SELECT Status FROM BorrowRequests WHERE RequestId = @RequestId');
    expect(requestRow.recordset[0].Status).toBe('PENDING');
  } finally {
    await cleanSeed(seed);
  }
});

test('approval does not approve a pending request with zero requested details', async () => {
  const seed = createSeed();

  try {
    const borrowerUserId = await insertUser(seed, 'borrower');
    const actorUserId = await insertUser(seed, 'actor');
    await insertMember(borrowerUserId, actorUserId);
    const requestId = await insertBorrowRequest(seed, {
      userId: borrowerUserId,
      createdBy: borrowerUserId,
    });

    const result = await approve(requestId, actorUserId);

    expect(result).toEqual({ outcome: 'REQUEST_NOT_APPROVABLE' });
    const requestRow = await pool
      .request()
      .input('RequestId', sql.Int, requestId)
      .query('SELECT Status FROM BorrowRequests WHERE RequestId = @RequestId');
    expect(requestRow.recordset[0].Status).toBe('PENDING');
  } finally {
    await cleanSeed(seed);
  }
});

test('concurrent SQL approvals for different copies stop at five active borrowed copies', async () => {
  const seed = createSeed();

  try {
    const borrowerUserId = await insertUser(seed, 'borrower');
    const actorUserId = await insertUser(seed, 'actor');
    await insertMember(borrowerUserId, actorUserId);
    const bookId = await findExistingBookId();
    const copyIds = await insertCopies(seed, bookId, 6);

    for (const copyId of copyIds.slice(0, 4)) {
      const activeRequestId = await insertBorrowRequest(seed, {
        userId: borrowerUserId,
        createdBy: borrowerUserId,
        status: 'APPROVED',
      });
      await insertBorrowDetail(seed, { requestId: activeRequestId, copyId, status: 'BORROWED' });
      await setCopyStatus(copyId, 'BORROWED');
    }

    const firstRequestId = await insertBorrowRequest(seed, {
      userId: borrowerUserId,
      createdBy: borrowerUserId,
    });
    await insertBorrowDetail(seed, {
      requestId: firstRequestId,
      copyId: copyIds[4],
      status: 'REQUESTED',
    });
    const secondRequestId = await insertBorrowRequest(seed, {
      userId: borrowerUserId,
      createdBy: borrowerUserId,
    });
    await insertBorrowDetail(seed, {
      requestId: secondRequestId,
      copyId: copyIds[5],
      status: 'REQUESTED',
    });

    const memberLockBarrier = installTwoPartyMemberLockBarrier();
    let results;
    let settledApprovalResults;
    const approvalPromises = [approve(firstRequestId, actorUserId), approve(secondRequestId, actorUserId)];
    try {
      results = await Promise.all(approvalPromises);
    } finally {
      memberLockBarrier.restore();
      memberLockBarrier.restore();
      settledApprovalResults = await Promise.allSettled(approvalPromises);
    }

    expect(memberLockBarrier.getArrivalCount()).toBe(2);
    expect(memberLockBarrier.getArrivalResources()).toEqual([
      `FE07-BORROW-MEMBER-${borrowerUserId}`,
      `FE07-BORROW-MEMBER-${borrowerUserId}`,
    ]);
    expect(settledApprovalResults.map((result) => result.status)).toEqual(['fulfilled', 'fulfilled']);

    expect(results.map((result) => result.outcome).sort()).toEqual([
      'APPROVED',
      'BORROW_LIMIT_EXCEEDED',
    ]);
    const losingRequestId =
      results[0].outcome === 'BORROW_LIMIT_EXCEEDED' ? firstRequestId : secondRequestId;
    const losingCopyId =
      results[0].outcome === 'BORROW_LIMIT_EXCEEDED' ? copyIds[4] : copyIds[5];
    const activeCount = await pool
      .request()
      .input('UserId', sql.Int, borrowerUserId)
      .query(`
        SELECT COUNT(*) AS ActiveCount
        FROM BorrowRequests br
        INNER JOIN BorrowDetails bd ON br.RequestId = bd.RequestId
        WHERE br.UserId = @UserId
          AND bd.Status = 'BORROWED'
      `);
    expect(activeCount.recordset[0].ActiveCount).toBe(5);

    const requestStates = await pool
      .request()
      .input('FirstRequestId', sql.Int, firstRequestId)
      .input('SecondRequestId', sql.Int, secondRequestId)
      .query(`
        SELECT RequestId, Status
        FROM BorrowRequests
        WHERE RequestId IN (@FirstRequestId, @SecondRequestId)
    `);
    expect(requestStates.recordset.map((row) => row.Status).sort()).toEqual(['APPROVED', 'PENDING']);
    expect(
      requestStates.recordset.find((row) => row.RequestId === losingRequestId).Status
    ).toBe('PENDING');

    const copyStates = await pool
      .request()
      .input('FirstCopyId', sql.Int, copyIds[4])
      .input('SecondCopyId', sql.Int, copyIds[5])
      .query(`
        SELECT CopyId, Status
        FROM BookCopies
        WHERE CopyId IN (@FirstCopyId, @SecondCopyId)
    `);
    expect(copyStates.recordset.map((row) => row.Status).sort()).toEqual(['AVAILABLE', 'BORROWED']);
    expect(copyStates.recordset.find((row) => row.CopyId === losingCopyId).Status).toBe('AVAILABLE');

    const auditCount = await pool
      .request()
      .input('FirstRequestId', sql.Int, firstRequestId)
      .input('SecondRequestId', sql.Int, secondRequestId)
      .query(`
        SELECT COUNT(*) AS AuditCount
        FROM AuditLogs
        WHERE Action = 'BORROW_REQUEST_APPROVE'
          AND TargetId IN (@FirstRequestId, @SecondRequestId)
      `);
    expect(auditCount.recordset[0].AuditCount).toBe(1);
  } finally {
    await cleanSeed(seed);
  }
});

test('concurrent SQL renewals update one borrowed detail only once', async () => {
  const seed = createSeed();

  try {
    const borrowerUserId = await insertUser(seed, 'renew-borrower');
    const actorUserId = await insertUser(seed, 'renew-actor');
    const bookId = await findExistingBookId();
    const [copyId] = await insertCopies(seed, bookId, 1);
    const requestId = await insertBorrowRequest(seed, {
      userId: borrowerUserId,
      createdBy: actorUserId,
      status: 'APPROVED',
    });
    const borrowDetailId = await insertBorrowDetail(seed, {
      requestId,
      copyId,
      status: 'BORROWED',
    });
    await setCopyStatus(copyId, 'BORROWED');

    const originalDetail = await borrowingRepository.findBorrowDetailById(borrowDetailId);
    const expectedDueDate = new Date(originalDetail.dueDate);
    expectedDueDate.setDate(expectedDueDate.getDate() + 14);
    const renewalResults = await Promise.all([
      borrowingRepository.renewBorrowDetail({
        borrowDetailId,
        newDueDate: expectedDueDate,
      }),
      borrowingRepository.renewBorrowDetail({
        borrowDetailId,
        newDueDate: expectedDueDate,
      }),
    ]);

    expect(renewalResults.filter(Boolean)).toHaveLength(1);
    expect(renewalResults.filter((result) => result === null)).toHaveLength(1);
    const finalDetail = await borrowingRepository.findBorrowDetailById(borrowDetailId);
    expect(finalDetail.renewalCount).toBe(1);
    expect(new Date(finalDetail.dueDate).toISOString()).toBe(expectedDueDate.toISOString());
  } finally {
    await cleanSeed(seed);
  }
});

test('concurrent SQL returns update one borrowed detail and write one audit', async () => {
  const seed = createSeed();

  try {
    const borrowerUserId = await insertUser(seed, 'return-borrower');
    const actorUserId = await insertUser(seed, 'return-actor');
    const bookId = await findExistingBookId();
    const [copyId] = await insertCopies(seed, bookId, 1);
    const requestId = await insertBorrowRequest(seed, {
      userId: borrowerUserId,
      createdBy: actorUserId,
      status: 'APPROVED',
    });
    const borrowDetailId = await insertBorrowDetail(seed, {
      requestId,
      copyId,
      status: 'BORROWED',
    });
    await setCopyStatus(copyId, 'BORROWED');

    const returnDate = new Date('2026-07-13T00:00:00.000Z');
    const returnResults = await Promise.all([
      returnDetail(borrowDetailId, actorUserId, returnDate),
      returnDetail(borrowDetailId, actorUserId, returnDate),
    ]);

    expect(returnResults.filter(Boolean)).toHaveLength(1);
    expect(returnResults.filter((result) => result === null)).toHaveLength(1);
    expect(returnResults.find(Boolean)).toMatchObject({ borrowDetailId, status: 'RETURNED' });

    const detailRow = await pool
      .request()
      .input('BorrowDetailId', sql.Int, borrowDetailId)
      .query('SELECT Status, ReturnDate FROM BorrowDetails WHERE BorrowDetailId = @BorrowDetailId');
    expect(detailRow.recordset[0].Status).toBe('RETURNED');
    expect(new Date(detailRow.recordset[0].ReturnDate).toISOString()).toBe(returnDate.toISOString());

    const copyRow = await pool
      .request()
      .input('CopyId', sql.Int, copyId)
      .query('SELECT Status FROM BookCopies WHERE CopyId = @CopyId');
    expect(copyRow.recordset[0].Status).toBe('AVAILABLE');

    const requestRow = await pool
      .request()
      .input('RequestId', sql.Int, requestId)
      .query('SELECT Status FROM BorrowRequests WHERE RequestId = @RequestId');
    expect(requestRow.recordset[0].Status).toBe('COMPLETED');

    const auditCount = await pool
      .request()
      .input('BorrowDetailId', sql.Int, borrowDetailId)
      .query(`
        SELECT COUNT(*) AS AuditCount
        FROM AuditLogs
        WHERE Action = 'BORROW_DETAIL_RETURN'
          AND TargetId = @BorrowDetailId
      `);
    expect(auditCount.recordset[0].AuditCount).toBe(1);
  } finally {
    await cleanSeed(seed);
  }
});

// FR-FE07-022, NFR-FE07-TXN-001: a failure from the injected audit repository occurs inside
// the real SQL transaction and leaves no request, detail, copy, or audit mutation behind.
test('SQL create audit failure rolls back request, detail, copy, and audit rows', async () => {
  const seed = createSeed();

  try {
    const borrowerUserId = await insertUser(seed, 'create-audit-borrower');
    const bookId = await findExistingBookId();
    const [copyId] = await insertCopies(seed, bookId, 1);
    const failingAuditLogRepository = {
      create: jest.fn(async () => {
        throw new Error('SQL create audit failure');
      }),
    };

    await expect(
      borrowingRepository.createBorrowRequest({
        userId: borrowerUserId,
        copyIds: [copyId],
        auditLogRepository: failingAuditLogRepository,
        auditEntry: {
          userId: borrowerUserId,
          action: 'BORROW_REQUEST_CREATE',
          targetType: 'BORROWING',
          metadata: { source: 'FE07_SQL_AUDIT_ROLLBACK' },
          ipAddress: null,
          userAgent: 'fe07-sql-audit-rollback',
        },
      })
    ).rejects.toThrow('SQL create audit failure');

    expect(failingAuditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ transaction: expect.any(Object) })
    );
    const requestCount = await pool
      .request()
      .input('UserId', sql.Int, borrowerUserId)
      .query('SELECT COUNT(*) AS Count FROM BorrowRequests WHERE UserId = @UserId');
    expect(requestCount.recordset[0].Count).toBe(0);
    const detailCount = await pool
      .request()
      .input('CopyId', sql.Int, copyId)
      .query('SELECT COUNT(*) AS Count FROM BorrowDetails WHERE CopyId = @CopyId');
    expect(detailCount.recordset[0].Count).toBe(0);
    const copyRow = await pool
      .request()
      .input('CopyId', sql.Int, copyId)
      .query('SELECT Status FROM BookCopies WHERE CopyId = @CopyId');
    expect(copyRow.recordset[0].Status).toBe('AVAILABLE');
    const auditCount = await pool
      .request()
      .input('UserId', sql.Int, borrowerUserId)
      .query("SELECT COUNT(*) AS Count FROM AuditLogs WHERE UserId = @UserId AND Action = 'BORROW_REQUEST_CREATE'");
    expect(auditCount.recordset[0].Count).toBe(0);
  } finally {
    await cleanSeed(seed);
  }
});

// FR-FE07-022, NFR-FE07-TXN-001: audit failure rolls an approval back to PENDING/REQUESTED.
test('SQL approval audit failure rolls back request, detail due date, copy, and audit rows', async () => {
  const seed = createSeed();

  try {
    const borrowerUserId = await insertUser(seed, 'approve-audit-borrower');
    const actorUserId = await insertUser(seed, 'approve-audit-actor');
    await insertMember(borrowerUserId, actorUserId);
    const bookId = await findExistingBookId();
    const [copyId] = await insertCopies(seed, bookId, 1);
    const requestId = await insertBorrowRequest(seed, {
      userId: borrowerUserId,
      createdBy: borrowerUserId,
    });
    const borrowDetailId = await insertBorrowDetail(seed, { requestId, copyId, status: 'REQUESTED' });
    const failingAuditLogRepository = {
      create: jest.fn(async () => {
        throw new Error('SQL approval audit failure');
      }),
    };

    await expect(
      borrowingRepository.approveBorrowRequest({
        requestId,
        approvedBy: actorUserId,
        approvalDate: new Date('2026-07-13T00:00:00.000Z'),
        dueDate: new Date('2026-07-27T00:00:00.000Z'),
        auditLogRepository: failingAuditLogRepository,
        auditEntry: {
          userId: actorUserId,
          action: 'BORROW_REQUEST_APPROVE',
          targetType: 'BORROWING',
          targetId: requestId,
          metadata: { source: 'FE07_SQL_AUDIT_ROLLBACK' },
          ipAddress: null,
          userAgent: 'fe07-sql-audit-rollback',
        },
      })
    ).rejects.toThrow('SQL approval audit failure');

    expect(failingAuditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ transaction: expect.any(Object) })
    );
    const requestRow = await pool
      .request()
      .input('RequestId', sql.Int, requestId)
      .query('SELECT Status, ApprovedAt, ProcessedAt FROM BorrowRequests WHERE RequestId = @RequestId');
    expect(requestRow.recordset[0]).toMatchObject({ Status: 'PENDING', ApprovedAt: null, ProcessedAt: null });
    const detailRow = await pool
      .request()
      .input('BorrowDetailId', sql.Int, borrowDetailId)
      .query('SELECT Status, BorrowDate, DueDate FROM BorrowDetails WHERE BorrowDetailId = @BorrowDetailId');
    expect(detailRow.recordset[0]).toMatchObject({ Status: 'REQUESTED', BorrowDate: null, DueDate: null });
    const copyRow = await pool
      .request()
      .input('CopyId', sql.Int, copyId)
      .query('SELECT Status FROM BookCopies WHERE CopyId = @CopyId');
    expect(copyRow.recordset[0].Status).toBe('AVAILABLE');
    const auditCount = await pool
      .request()
      .input('RequestId', sql.Int, requestId)
      .query("SELECT COUNT(*) AS Count FROM AuditLogs WHERE Action = 'BORROW_REQUEST_APPROVE' AND TargetId = @RequestId");
    expect(auditCount.recordset[0].Count).toBe(0);
  } finally {
    await cleanSeed(seed);
  }
});

// FR-FE07-022, NFR-FE07-TXN-002: audit failure restores the active loan and its copy.
test('SQL return audit failure rolls back request, detail return date, copy, and audit rows', async () => {
  const seed = createSeed();

  try {
    const borrowerUserId = await insertUser(seed, 'return-audit-borrower');
    const actorUserId = await insertUser(seed, 'return-audit-actor');
    const bookId = await findExistingBookId();
    const [copyId] = await insertCopies(seed, bookId, 1);
    const requestId = await insertBorrowRequest(seed, {
      userId: borrowerUserId,
      createdBy: actorUserId,
      status: 'APPROVED',
    });
    const borrowDetailId = await insertBorrowDetail(seed, { requestId, copyId, status: 'BORROWED' });
    await setCopyStatus(copyId, 'BORROWED');
    const failingAuditLogRepository = {
      create: jest.fn(async () => {
        throw new Error('SQL return audit failure');
      }),
    };

    await expect(
      borrowingRepository.returnBorrowDetail({
        borrowDetailId,
        detailStatus: 'RETURNED',
        copyStatus: 'AVAILABLE',
        returnDate: new Date('2026-07-13T00:00:00.000Z'),
        auditLogRepository: failingAuditLogRepository,
        auditEntry: {
          userId: actorUserId,
          action: 'BORROW_DETAIL_RETURN',
          targetType: 'BORROW_DETAIL',
          targetId: borrowDetailId,
          metadata: { source: 'FE07_SQL_AUDIT_ROLLBACK' },
          ipAddress: null,
          userAgent: 'fe07-sql-audit-rollback',
        },
      })
    ).rejects.toThrow('SQL return audit failure');

    expect(failingAuditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ transaction: expect.any(Object) })
    );
    const requestRow = await pool
      .request()
      .input('RequestId', sql.Int, requestId)
      .query('SELECT Status FROM BorrowRequests WHERE RequestId = @RequestId');
    expect(requestRow.recordset[0].Status).toBe('APPROVED');
    const detailRow = await pool
      .request()
      .input('BorrowDetailId', sql.Int, borrowDetailId)
      .query('SELECT Status, ReturnDate FROM BorrowDetails WHERE BorrowDetailId = @BorrowDetailId');
    expect(detailRow.recordset[0]).toMatchObject({ Status: 'BORROWED', ReturnDate: null });
    const copyRow = await pool
      .request()
      .input('CopyId', sql.Int, copyId)
      .query('SELECT Status FROM BookCopies WHERE CopyId = @CopyId');
    expect(copyRow.recordset[0].Status).toBe('BORROWED');
    const auditCount = await pool
      .request()
      .input('BorrowDetailId', sql.Int, borrowDetailId)
      .query("SELECT COUNT(*) AS Count FROM AuditLogs WHERE Action = 'BORROW_DETAIL_RETURN' AND TargetId = @BorrowDetailId");
    expect(auditCount.recordset[0].Count).toBe(0);
  } finally {
    await cleanSeed(seed);
  }
});

test.each([
  ['inactive account', 'MEMBER_ACCOUNT_INACTIVE'],
  ['non-approved membership', 'MEMBERSHIP_NOT_APPROVED'],
  ['unpaid positive fine', 'UNPAID_FINE_BLOCKS_BORROWING'],
  ['overdue active loan', 'OVERDUE_LOAN_BLOCKS_BORROWING'],
])('SQL approval revalidates %s inside the transaction', async (blocker, expectedOutcome) => {
  const seed = createSeed();

  try {
    const borrowerUserId = await insertUser(seed, `b-${expectedOutcome}`);
    const actorUserId = await insertUser(seed, `a-${expectedOutcome}`);
    await insertMember(borrowerUserId, actorUserId);
    const bookId = await findExistingBookId();
    const copyIds = await insertCopies(seed, bookId, blocker === 'overdue active loan' ? 2 : 1);
    const requestId = await insertBorrowRequest(seed, { userId: borrowerUserId, createdBy: borrowerUserId });
    const requestedDetailId = await insertBorrowDetail(seed, {
      requestId,
      copyId: copyIds[0],
      status: 'REQUESTED',
    });

    if (blocker === 'inactive account') {
      await pool
        .request()
        .input('UserId', sql.Int, borrowerUserId)
        .query("UPDATE Users SET Status = 'INACTIVE' WHERE UserId = @UserId");
    } else if (blocker === 'non-approved membership') {
      await pool
        .request()
        .input('UserId', sql.Int, borrowerUserId)
        .query("UPDATE Members SET Status = 'REJECTED' WHERE UserId = @UserId");
    } else if (blocker === 'unpaid positive fine') {
      await insertUnpaidFine(borrowerUserId, requestedDetailId);
    } else {
      const activeRequestId = await insertBorrowRequest(seed, {
        userId: borrowerUserId,
        createdBy: actorUserId,
        status: 'APPROVED',
      });
      await insertBorrowDetail(seed, {
        requestId: activeRequestId,
        copyId: copyIds[1],
        status: 'BORROWED',
        dueDate: new Date('2026-07-12T00:00:00.000Z'),
      });
      await setCopyStatus(copyIds[1], 'BORROWED');
    }

    await expect(approve(requestId, actorUserId)).resolves.toEqual({ outcome: expectedOutcome });
    const requestRow = await pool
      .request()
      .input('RequestId', sql.Int, requestId)
      .query('SELECT Status FROM BorrowRequests WHERE RequestId = @RequestId');
    expect(requestRow.recordset[0].Status).toBe('PENDING');
    const copyRow = await pool
      .request()
      .input('CopyId', sql.Int, copyIds[0])
      .query('SELECT Status FROM BookCopies WHERE CopyId = @CopyId');
    expect(copyRow.recordset[0].Status).toBe('AVAILABLE');
  } finally {
    await cleanSeed(seed);
  }
});

test('SQL reject audit failure rolls back the request status and audit row', async () => {
  const seed = createSeed();

  try {
    const borrowerUserId = await insertUser(seed, 'reject-audit-borrower');
    const actorUserId = await insertUser(seed, 'reject-audit-actor');
    const requestId = await insertBorrowRequest(seed, { userId: borrowerUserId, createdBy: borrowerUserId });
    const failingAuditLogRepository = { create: jest.fn(async () => { throw new Error('SQL reject audit failure'); }) };

    await expect(
      borrowingRepository.rejectBorrowRequest({
        requestId,
        rejectedBy: actorUserId,
        auditLogRepository: failingAuditLogRepository,
        auditEntry: { userId: actorUserId, action: 'BORROW_REQUEST_REJECT', targetType: 'BORROWING', targetId: requestId },
      })
    ).rejects.toThrow('SQL reject audit failure');
    const requestRow = await pool.request().input('RequestId', sql.Int, requestId)
      .query('SELECT Status FROM BorrowRequests WHERE RequestId = @RequestId');
    expect(requestRow.recordset[0].Status).toBe('PENDING');
  } finally {
    await cleanSeed(seed);
  }
});

test('SQL renewal audit failure rolls back due date, renewal count, and audit row', async () => {
  const seed = createSeed();

  try {
    const borrowerUserId = await insertUser(seed, 'renew-audit-borrower');
    const actorUserId = await insertUser(seed, 'renew-audit-actor');
    const bookId = await findExistingBookId();
    const [copyId] = await insertCopies(seed, bookId, 1);
    const requestId = await insertBorrowRequest(seed, { userId: borrowerUserId, createdBy: actorUserId, status: 'APPROVED' });
    const borrowDetailId = await insertBorrowDetail(seed, { requestId, copyId, status: 'BORROWED' });
    await setCopyStatus(copyId, 'BORROWED');
    const before = await borrowingRepository.findBorrowDetailById(borrowDetailId);
    const failingAuditLogRepository = { create: jest.fn(async () => { throw new Error('SQL renew audit failure'); }) };

    await expect(
      borrowingRepository.renewBorrowDetail({
        borrowDetailId,
        newDueDate: new Date('2026-07-27T00:00:00.000Z'),
        auditLogRepository: failingAuditLogRepository,
        auditEntry: { userId: actorUserId, action: 'BORROW_DETAIL_RENEW', targetType: 'BORROW_DETAIL', targetId: borrowDetailId },
      })
    ).rejects.toThrow('SQL renew audit failure');
    const after = await borrowingRepository.findBorrowDetailById(borrowDetailId);
    expect(after.renewalCount).toBe(0);
    expect(new Date(after.dueDate).toISOString()).toBe(new Date(before.dueDate).toISOString());
  } finally {
    await cleanSeed(seed);
  }
});
