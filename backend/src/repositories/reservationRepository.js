const { sql, getPool } = require('../config/db');

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
    bc.BookId,
    bc.Barcode,
    bc.Status AS CopyStatus,
    bc.Location,
    b.Title
  FROM Reservations r
  INNER JOIN Users u ON r.UserId = u.UserId
  INNER JOIN BookCopies bc ON r.CopyId = bc.CopyId
  INNER JOIN Books b ON bc.BookId = b.BookId
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
    location: row.Location,
    title: row.Title,
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
      email: row.Email,
      status: row.UserStatus,
    },
    copy: mapCopy(row),
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
        m.ApprovedAt
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
        AND Status = 'ACTIVE'
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
        AND r.Status = 'ACTIVE'
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

async function createReservation({ userId, copyId }) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const queueResult = await new sql.Request(transaction)
      .input('CopyId', sql.Int, copyId)
      .query(`
        SELECT COUNT(*) AS QueueCount
        FROM Reservations WITH (UPDLOCK, HOLDLOCK)
        WHERE CopyId = @CopyId
          AND Status = 'ACTIVE'
      `);

    const queuePosition = (queueResult.recordset[0]?.QueueCount || 0) + 1;

    const insertResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .input('CopyId', sql.Int, copyId)
      .input('QueuePosition', sql.Int, queuePosition)
      .query(`
        INSERT INTO Reservations (UserId, CopyId, QueuePosition, Status)
        OUTPUT INSERTED.ReservationId
        VALUES (@UserId, @CopyId, @QueuePosition, 'ACTIVE')
      `);

    await transaction.commit();
    return findReservationById(insertResult.recordset[0].ReservationId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function listReservations({ userId, bookId, memberId, status } = {}) {
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
  const result = await request.query(`
    ${reservationSelect}
    ${whereClause}
    ORDER BY r.ReservedAt DESC, r.ReservationId DESC
  `);

  return result.recordset.map(mapReservation);
}

async function cancelReservation(reservationId) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const reservationResult = await new sql.Request(transaction)
      .input('ReservationId', sql.Int, reservationId)
      .query(`
        SELECT TOP 1 CopyId, NotifiedAt
        FROM Reservations WITH (UPDLOCK, HOLDLOCK)
        WHERE ReservationId = @ReservationId
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
      `);

    if (reservation.NotifiedAt) {
      await new sql.Request(transaction)
        .input('CopyId', sql.Int, reservation.CopyId)
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

async function findNextActiveReservationForCopy(copyId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('CopyId', sql.Int, copyId)
    .query(`
      ${reservationSelect}
      LEFT JOIN Members m ON r.UserId = m.UserId
      WHERE r.CopyId = @CopyId
        AND r.Status = 'ACTIVE'
        AND bc.Status = 'AVAILABLE'
        AND u.Status = 'ACTIVE'
        AND m.Status = 'APPROVED'
      ORDER BY r.ReservedAt ASC, r.ReservationId ASC
    `);

  return mapReservation(result.recordset[0]);
}

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

async function expireOverdueHolds(now) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const expiredResult = await new sql.Request(transaction)
      .input('Now', sql.DateTime, now)
      .query(`
        UPDATE Reservations
        SET Status = 'EXPIRED',
            UpdatedAt = GETDATE()
        OUTPUT INSERTED.ReservationId, INSERTED.CopyId
        WHERE Status = 'NOTIFIED'
          AND ExpiresAt IS NOT NULL
          AND ExpiresAt < @Now
      `);

    const expired = expiredResult.recordset.map((row) => ({
      reservationId: row.ReservationId,
      copyId: row.CopyId,
    }));

    for (const item of expired) {
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
  createReservation,
  listReservations,
  cancelReservation,
  findNextActiveReservationForCopy,
  holdReservation,
  expireOverdueHolds,
};
