const { sql, getPool } = require('../config/db');

function escapeLikePattern(value) {
  return String(value).replace(/[\\%_[\]]/g, (match) => `\\${match}`);
}

const reservationSelect = `
  SELECT
    r.ReservationId,
    r.UserId,
    r.CopyId,
    r.ReservedAt,
    r.QueuePosition,
    r.ExpiresAt,
    r.NotifiedAt,
    r.CancelledAt,
    r.Status AS ReservationStatus,
    r.CreatedAt AS ReservationCreatedAt,
    r.UpdatedAt AS ReservationUpdatedAt,
    u.Username,
    u.Email,
    u.Status AS UserStatus,
    up.FullName,
    bc.BookId,
    bc.Barcode,
    bc.Status AS CopyStatus,
    bc.Location,
    b.Title,
    a.AuthorName
  FROM Reservations r
  INNER JOIN Users u ON r.UserId = u.UserId
  LEFT JOIN UserProfiles up ON r.UserId = up.UserId
  INNER JOIN BookCopies bc ON r.CopyId = bc.CopyId
  INNER JOIN Books b ON bc.BookId = b.BookId
  LEFT JOIN Authors a ON b.AuthorId = a.AuthorId
`;

function mapCopy(row) {
  if (!row) {
    return null;
  }

  return {
    copyId: row.CopyId,
    bookId: row.BookId,
    barcode: row.Barcode,
    status: row.CopyStatus,
    bookStatus: row.BookStatus,
    location: row.Location,
    title: row.Title,
    author: row.AuthorName,
  };
}

function mapReservation(row) {
  if (!row) {
    return null;
  }

  return {
    reservationId: row.ReservationId,
    userId: row.UserId,
    copyId: row.CopyId,
    reservedAt: row.ReservedAt,
    queuePosition: row.QueuePosition,
    expiresAt: row.ExpiresAt,
    notifiedAt: row.NotifiedAt,
    cancelledAt: row.CancelledAt,
    status: row.ReservationStatus,
    createdAt: row.ReservationCreatedAt,
    updatedAt: row.ReservationUpdatedAt,
    member: {
      userId: row.UserId,
      username: row.Username,
      fullName: row.FullName,
      email: row.Email,
      status: row.UserStatus,
    },
    copy: mapCopy(row),
  };
}

function mapReservationCandidate(row) {
  if (!row) {
    return null;
  }

  return {
    copyId: row.CopyId,
    bookId: row.BookId,
    title: row.Title,
    authorName: row.AuthorName || null,
    copyStatus: row.CopyStatus,
    activeReservationCount: Number(row.ActiveReservationCount || 0),
    hasActiveReservation: Boolean(row.HasActiveReservation),
  };
}

async function getMemberEligibility(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('UserId', sql.Int, userId)
    .query(`
      SELECT TOP 1
        u.UserId,
        u.Status AS UserStatus,
        u.Email,
        m.Status AS MemberStatus,
        m.ApprovedAt,
        CASE WHEN EXISTS (
          SELECT 1
          FROM UserRoles eligibilityUr
          INNER JOIN Roles eligibilityRole ON eligibilityUr.RoleId = eligibilityRole.RoleId
          WHERE eligibilityUr.UserId = u.UserId
            AND eligibilityRole.RoleName = 'MEMBER'
        ) THEN 1 ELSE 0 END AS HasMemberRole
      FROM Users u
      LEFT JOIN Members m ON u.UserId = m.UserId
      WHERE u.UserId = @UserId
    `);

  const row = result.recordset[0];

  if (!row) {
    return null;
  }

  return {
    userId: row.UserId,
    userStatus: row.UserStatus,
    email: row.Email,
    memberStatus: row.MemberStatus,
    approvedAt: row.ApprovedAt,
    hasMemberRole: Boolean(row.HasMemberRole),
  };
}

async function findCopyById(copyId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('CopyId', sql.Int, copyId)
    .query(`
      SELECT
        bc.CopyId,
        bc.BookId,
        bc.Barcode,
        bc.Status AS CopyStatus,
        bc.Location,
        b.Status AS BookStatus,
        b.Title
      FROM BookCopies bc
      INNER JOIN Books b ON bc.BookId = b.BookId
      WHERE bc.CopyId = @CopyId
    `);

  return mapCopy(result.recordset[0]);
}

async function countActiveReservationsForUser(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('UserId', sql.Int, userId)
    .query(`
      SELECT COUNT(*) AS ActiveCount
      FROM Reservations
      WHERE UserId = @UserId
        AND Status IN ('ACTIVE', 'NOTIFIED')
    `);

  return result.recordset[0]?.ActiveCount || 0;
}

async function findActiveReservationByUserAndCopy(userId, copyId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('UserId', sql.Int, userId)
    .input('CopyId', sql.Int, copyId)
    .query(`
      ${reservationSelect}
      WHERE r.UserId = @UserId
        AND r.CopyId = @CopyId
        AND r.Status IN ('ACTIVE', 'NOTIFIED')
    `);

  return mapReservation(result.recordset[0]);
}

async function findReservationById(reservationId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('ReservationId', sql.Int, reservationId)
    .query(`
      ${reservationSelect}
      WHERE r.ReservationId = @ReservationId
    `);

  return mapReservation(result.recordset[0]);
}

// @spec FR-FE08-029, AC-FE08-015, NFR-FE08-SEC-004, NFR-FE08-PERF-003
async function listReservationCandidates({ q = '', page = 1, limit = 20, userId } = {}) {
  const pool = await getPool();
  const request = pool.request();
  const normalizedQuery = String(q).trim();
  const offset = (Number(page) - 1) * Number(limit);

  request
    .input(
      'Search',
      sql.NVarChar(402),
      normalizedQuery ? `%${escapeLikePattern(normalizedQuery)}%` : null
    )
    .input('Offset', sql.Int, offset)
    .input('Limit', sql.Int, Number(limit))
    .input('UserId', sql.Int, userId);

  const result = await request.query(`
    SELECT
      bc.CopyId,
      bc.BookId,
      b.Title,
      a.AuthorName,
      bc.Status AS CopyStatus,
      (
        SELECT COUNT(*)
        FROM Reservations activeReservation
        WHERE activeReservation.CopyId = bc.CopyId
          AND activeReservation.Status = 'ACTIVE'
      ) AS ActiveReservationCount,
      CASE WHEN EXISTS (
        SELECT 1
        FROM Reservations ownReservation
        WHERE ownReservation.CopyId = bc.CopyId
          AND ownReservation.UserId = @UserId
          AND ownReservation.Status IN ('ACTIVE', 'NOTIFIED')
      ) THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END AS HasActiveReservation,
      COUNT(*) OVER() AS TotalRows
    FROM BookCopies bc
    INNER JOIN Books b ON b.BookId = bc.BookId
    LEFT JOIN Authors a ON a.AuthorId = b.AuthorId
    WHERE b.Status = 'ACTIVE'
      AND bc.Status IN ('BORROWED', 'RESERVED')
      AND (
        @Search IS NULL
        OR b.Title LIKE @Search ESCAPE '\\'
        OR COALESCE(a.AuthorName, '') LIKE @Search ESCAPE '\\'
      )
    ORDER BY b.Title ASC, b.BookId ASC, bc.CopyId ASC
    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
  `);

  return {
    rows: result.recordset.map(mapReservationCandidate),
    total: Number(result.recordset[0]?.TotalRows || 0),
  };
}

// @spec FR-FE08-011, FR-FE08-012, FR-FE08-013, FR-FE08-014, FR-FE08-015
async function createReservation({ userId, copyId }) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  let reservationId;

  await transaction.begin();

  try {
    const memberLockResult = await new sql.Request(transaction)
      .input('MemberLockResource', sql.NVarChar(255), `FE08-RESERVATION-MEMBER-${userId}`)
      .query(`
        DECLARE @MemberLockResult INT;
        EXEC @MemberLockResult = sp_getapplock
          @Resource = @MemberLockResource,
          @LockMode = 'Exclusive',
          @LockOwner = 'Transaction',
          @LockTimeout = 10000;
        SELECT @MemberLockResult AS LockResult;
      `);

    if (Number(memberLockResult.recordset[0]?.LockResult) < 0) {
      throw new Error('Unable to acquire the member reservation lock.');
    }

    const memberResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .query(`
        SELECT
          u.Status AS UserStatus,
          MAX(CASE WHEN r.RoleName = 'MEMBER' THEN 1 ELSE 0 END) AS HasMemberRole
        FROM Users u WITH (UPDLOCK, HOLDLOCK)
        LEFT JOIN UserRoles ur WITH (UPDLOCK, HOLDLOCK) ON ur.UserId = u.UserId
        LEFT JOIN Roles r WITH (HOLDLOCK) ON r.RoleId = ur.RoleId
        WHERE u.UserId = @UserId
        GROUP BY u.Status;
      `);

    const member = memberResult.recordset[0];
    if (!member || Number(member.HasMemberRole) !== 1) {
      await transaction.rollback();
      return { outcome: 'MEMBER_ROLE_REQUIRED' };
    }

    if (member.UserStatus !== 'ACTIVE') {
      await transaction.rollback();
      return { outcome: 'MEMBER_ACCOUNT_INACTIVE' };
    }

    const copyResult = await new sql.Request(transaction)
      .input('CopyId', sql.Int, copyId)
      .query(`
        SELECT
          bc.CopyId,
          bc.Status AS CopyStatus,
          b.Status AS BookStatus
        FROM BookCopies bc WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN Books b WITH (HOLDLOCK) ON b.BookId = bc.BookId
        WHERE bc.CopyId = @CopyId;
      `);

    const copy = copyResult.recordset[0];
    if (!copy) {
      await transaction.rollback();
      return { outcome: 'COPY_NOT_FOUND' };
    }

    if (copy.BookStatus !== 'ACTIVE') {
      await transaction.rollback();
      return { outcome: 'BOOK_INACTIVE' };
    }

    if (copy.CopyStatus === 'AVAILABLE') {
      await transaction.rollback();
      return { outcome: 'COPY_AVAILABLE' };
    }

    if (!['BORROWED', 'RESERVED'].includes(copy.CopyStatus)) {
      await transaction.rollback();
      return { outcome: 'RESERVATION_NOT_ALLOWED' };
    }

    const openReservationsResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .input('CopyId', sql.Int, copyId)
      .query(`
        SELECT UserId, CopyId
        FROM Reservations WITH (UPDLOCK, HOLDLOCK)
        WHERE (UserId = @UserId OR CopyId = @CopyId)
          AND Status IN ('ACTIVE', 'NOTIFIED');
      `);

    const openReservations = openReservationsResult.recordset;
    if (openReservations.some((item) => (
      item.UserId === userId && item.CopyId === copyId
    ))) {
      await transaction.rollback();
      return { outcome: 'DUPLICATE_ACTIVE_RESERVATION' };
    }

    if (openReservations.filter((item) => item.UserId === userId).length >= 3) {
      await transaction.rollback();
      return { outcome: 'ACTIVE_RESERVATION_LIMIT' };
    }

    const queuePosition = openReservations.filter((item) => item.CopyId === copyId).length + 1;

    const insertResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .input('CopyId', sql.Int, copyId)
      .input('QueuePosition', sql.Int, queuePosition)
      .query(`
        INSERT INTO Reservations (UserId, CopyId, QueuePosition, Status)
        OUTPUT INSERTED.ReservationId
        VALUES (@UserId, @CopyId, @QueuePosition, 'ACTIVE')
      `);

    reservationId = insertResult.recordset[0].ReservationId;
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  return {
    outcome: 'CREATED',
    reservation: await findReservationById(reservationId),
  };
}

async function listReservations({ userId, bookId, memberId, status, page = 1, limit = 20 } = {}) {
  const pool = await getPool();
  const request = pool.request();
  const where = [];

  if (userId) {
    request.input('UserId', sql.Int, userId);
    where.push('r.UserId = @UserId');
  }

  if (bookId) {
    request.input('BookId', sql.Int, bookId);
    where.push('bc.BookId = @BookId');
  }

  if (memberId) {
    request.input('MemberId', sql.Int, memberId);
    where.push('r.UserId = @MemberId');
  }

  if (status) {
    request.input('Status', sql.NVarChar(20), status);
    where.push('r.Status = @Status');
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  request.input('Offset', sql.Int, (Number(page) - 1) * Number(limit));
  request.input('Limit', sql.Int, Number(limit));
  const countResult = await request.query(`
    SELECT COUNT(*) AS Total
    FROM Reservations r
    INNER JOIN BookCopies bc ON r.CopyId = bc.CopyId
    ${whereClause}
  `);
  const result = await request.query(`
    ${reservationSelect}
    ${whereClause}
    ORDER BY r.ReservedAt ASC, r.ReservationId ASC
    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
  `);

  return { rows: result.recordset.map(mapReservation), total: countResult.recordset[0]?.Total || 0 };
}

// @spec BR-FE08-003, BR-FE08-015, FR-FE08-028
// Cancellation locks the copy before revalidating the reservation.
async function cancelReservation(reservationId) {
  const pool = await getPool();
  const copyLookup = await pool
    .request()
    .input('ReservationId', sql.Int, reservationId)
    .query(`
      SELECT CopyId
      FROM Reservations
      WHERE ReservationId = @ReservationId
    `);
  const copyId = copyLookup.recordset[0]?.CopyId;

  if (!copyId) {
    return null;
  }

  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const copyResult = await new sql.Request(transaction)
      .input('CopyId', sql.Int, copyId)
      .query(`
        SELECT CopyId, Status
        FROM BookCopies WITH (UPDLOCK, HOLDLOCK)
        WHERE CopyId = @CopyId
      `);

    if (!copyResult.recordset.length) {
      await transaction.rollback();
      return null;
    }

    const reservationResult = await new sql.Request(transaction)
      .input('ReservationId', sql.Int, reservationId)
      .input('CopyId', sql.Int, copyId)
      .query(`
        SELECT TOP 1 CopyId, Status
        FROM Reservations WITH (UPDLOCK, HOLDLOCK)
        WHERE ReservationId = @ReservationId
          AND CopyId = @CopyId
          AND Status IN ('ACTIVE', 'NOTIFIED')
      `);

    const reservation = reservationResult.recordset[0];

    if (!reservation) {
      await transaction.rollback();
      return null;
    }

    await new sql.Request(transaction)
      .input('ReservationId', sql.Int, reservationId)
      .query(`
        UPDATE Reservations
        SET Status = 'CANCELLED',
            CancelledAt = GETDATE(),
            UpdatedAt = GETDATE()
        WHERE ReservationId = @ReservationId
          AND Status IN ('ACTIVE', 'NOTIFIED')
      `);

    if (reservation.Status === 'NOTIFIED') {
      await new sql.Request(transaction)
        .input('CopyId', sql.Int, copyId)
        .query(`
          UPDATE BookCopies
          SET Status = 'AVAILABLE',
              UpdatedAt = GETDATE()
          WHERE CopyId = @CopyId
            AND Status = 'RESERVED'
        `);
    }

    await transaction.commit();
    return findReservationById(reservationId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// @spec FR-FE08-018 — the queue only returns the earliest ACTIVE reservation whose member is still
// active and approved, so an ineligible member is skipped (not held) at processing time (AF-FE08-003).
async function findNextActiveReservationForCopy(copyId, excludedReservationIds = []) {
  const pool = await getPool();
  const request = pool.request().input('CopyId', sql.Int, copyId);
  const exclusions = [...new Set(excludedReservationIds)]
    .map(Number)
    .filter((value) => Number.isInteger(value) && value > 0);
  const exclusionParameters = exclusions.map((reservationId, index) => {
    const parameterName = `ExcludedReservationId${index}`;
    request.input(parameterName, sql.Int, reservationId);
    return `@${parameterName}`;
  });
  const exclusionClause = exclusionParameters.length
    ? `AND r.ReservationId NOT IN (${exclusionParameters.join(', ')})`
    : '';
  const result = await request.query(`
      ${reservationSelect}
      WHERE r.CopyId = @CopyId
        AND r.Status = 'ACTIVE'
        AND bc.Status = 'AVAILABLE'
        AND u.Status = 'ACTIVE'
        AND EXISTS (
          SELECT 1
          FROM UserRoles queueUr
          INNER JOIN Roles role ON queueUr.RoleId = role.RoleId
          WHERE queueUr.UserId = r.UserId
            AND role.RoleName = 'MEMBER'
        )
        ${exclusionClause}
      ORDER BY r.ReservedAt ASC, r.ReservationId ASC
    `);

  return mapReservation(result.recordset[0]);
}

// @spec FR-FE08-022 — the hold runs in a transaction and locks the copy (UPDLOCK/HOLDLOCK), updating
// the reservation to NOTIFIED only WHERE it is still ACTIVE; a concurrent second attempt re-reads the
// state and gets null, so at most one selection succeeds (EC-FE08-010, NFR-FE08-TXN-001, INV-FE08-004).
async function holdReservation({ reservationId, copyId, notifiedAt, expiresAt }) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const copyResult = await new sql.Request(transaction)
      .input('CopyId', sql.Int, copyId)
      .query(`
        SELECT TOP 1 Status
        FROM BookCopies WITH (UPDLOCK, HOLDLOCK)
        WHERE CopyId = @CopyId
      `);

    if (copyResult.recordset[0]?.Status !== 'AVAILABLE') {
      await transaction.rollback();
      return null;
    }

    const eligibilityResult = await new sql.Request(transaction)
      .input('ReservationId', sql.Int, reservationId)
      .input('CopyId', sql.Int, copyId)
      .query(`
        SELECT TOP 1
          r.ReservationId,
          r.UserId,
          CASE WHEN
            u.Status = 'ACTIVE'
            AND EXISTS (
              SELECT 1
              FROM UserRoles eligibilityUr WITH (UPDLOCK, HOLDLOCK)
              INNER JOIN Roles eligibilityRole WITH (HOLDLOCK)
                ON eligibilityUr.RoleId = eligibilityRole.RoleId
              WHERE eligibilityUr.UserId = r.UserId
                AND eligibilityRole.RoleName = 'MEMBER'
            )
          THEN 1 ELSE 0 END AS IsEligible
        FROM Reservations r WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN Users u WITH (UPDLOCK, HOLDLOCK) ON r.UserId = u.UserId
        WHERE r.ReservationId = @ReservationId
          AND r.CopyId = @CopyId
          AND r.Status = 'ACTIVE'
      `);
    const eligibility = eligibilityResult.recordset[0];

    if (!eligibility) {
      await transaction.rollback();
      return null;
    }

    if (!eligibility.IsEligible) {
      await transaction.rollback();
      return {
        outcome: 'MEMBER_INELIGIBLE',
        reservationId,
        copyId,
      };
    }

    const reservationResult = await new sql.Request(transaction)
      .input('ReservationId', sql.Int, reservationId)
      .input('CopyId', sql.Int, copyId)
      .input('NotifiedAt', sql.DateTime, notifiedAt)
      .input('ExpiresAt', sql.DateTime, expiresAt)
      .query(`
        UPDATE Reservations
        SET Status = 'NOTIFIED',
            NotifiedAt = @NotifiedAt,
            ExpiresAt = @ExpiresAt,
            QueuePosition = 1,
            UpdatedAt = GETDATE()
        OUTPUT INSERTED.ReservationId
        WHERE ReservationId = @ReservationId
          AND CopyId = @CopyId
          AND Status = 'ACTIVE'
      `);

    if (!reservationResult.recordset.length) {
      await transaction.rollback();
      return null;
    }

    await new sql.Request(transaction)
      .input('CopyId', sql.Int, copyId)
      .query(`
        UPDATE BookCopies
        SET Status = 'RESERVED',
            UpdatedAt = GETDATE()
        WHERE CopyId = @CopyId
      `);

    await transaction.commit();
    return findReservationById(reservationId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// @spec FR-FE08-019, FR-FE08-028, BR-FE08-015
// Expiration locks sorted copies before reservation rows.
async function expireOverdueHolds(now) {
  const pool = await getPool();
  const candidateResult = await pool
    .request()
    .input('Now', sql.DateTime, now)
    .query(`
      SELECT ReservationId, CopyId
      FROM Reservations
      WHERE Status = 'NOTIFIED'
        AND ExpiresAt IS NOT NULL
        AND ExpiresAt < @Now
      ORDER BY CopyId ASC, ReservationId ASC
    `);
  const candidates = candidateResult.recordset.map((row) => ({
    reservationId: row.ReservationId,
    copyId: row.CopyId,
  }));

  if (!candidates.length) {
    return [];
  }

  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const copyIds = [...new Set(candidates.map(({ copyId }) => copyId))].sort(
      (left, right) => left - right
    );

    for (const copyId of copyIds) {
      await new sql.Request(transaction)
        .input('CopyId', sql.Int, copyId)
        .query(`
          SELECT CopyId, Status
          FROM BookCopies WITH (UPDLOCK, HOLDLOCK)
          WHERE CopyId = @CopyId
        `);
    }

    const expired = [];

    for (const candidate of candidates) {
      const reservationResult = await new sql.Request(transaction)
        .input('ReservationId', sql.Int, candidate.reservationId)
        .input('CopyId', sql.Int, candidate.copyId)
        .input('Now', sql.DateTime, now)
        .query(`
          SELECT ReservationId, CopyId
          FROM Reservations WITH (UPDLOCK, HOLDLOCK)
          WHERE ReservationId = @ReservationId
            AND CopyId = @CopyId
            AND Status = 'NOTIFIED'
            AND ExpiresAt IS NOT NULL
            AND ExpiresAt < @Now
        `);

      if (!reservationResult.recordset.length) {
        continue;
      }

      const expiredResult = await new sql.Request(transaction)
        .input('ReservationId', sql.Int, candidate.reservationId)
        .query(`
          UPDATE Reservations
          SET Status = 'EXPIRED',
              UpdatedAt = GETDATE()
          OUTPUT INSERTED.ReservationId, INSERTED.CopyId
          WHERE ReservationId = @ReservationId
            AND Status = 'NOTIFIED'
        `);

      if (!expiredResult.recordset.length) {
        continue;
      }

      const item = {
        reservationId: expiredResult.recordset[0].ReservationId,
        copyId: expiredResult.recordset[0].CopyId,
      };
      expired.push(item);

      await new sql.Request(transaction)
        .input('CopyId', sql.Int, item.copyId)
        .query(`
          UPDATE BookCopies
          SET Status = 'AVAILABLE',
              UpdatedAt = GETDATE()
          WHERE CopyId = @CopyId
            AND Status = 'RESERVED'
        `);
    }

    await transaction.commit();
    return expired;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = {
  getMemberEligibility,
  findCopyById,
  countActiveReservationsForUser,
  findActiveReservationByUserAndCopy,
  findReservationById,
  listReservationCandidates,
  createReservation,
  listReservations,
  cancelReservation,
  findNextActiveReservationForCopy,
  holdReservation,
  expireOverdueHolds,
};
