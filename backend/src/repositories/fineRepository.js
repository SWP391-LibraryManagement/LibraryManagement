const { sql, getPool } = require('../config/db');

// FE09 Fine Management — server-side persistence.
// Fines are computed from stored borrowing data (never from client input) and every
// state change runs in a transaction so status, paid timestamp and collected amount stay consistent.

const fineSelect = `
  SELECT
    f.FineId,
    f.UserId,
    f.BorrowDetailId,
    f.OverdueDays,
    f.RatePerDay,
    f.Amount,
    f.PaidAmount,
    f.Reason,
    f.Status,
    f.CalculatedAt,
    f.PaidAt,
    f.CreatedBy,
    f.CollectedBy,
    f.PaymentMethod,
    f.CreatedAt,
    f.UpdatedAt,
    u.Username,
    u.Email
  FROM Fines f
  INNER JOIN Users u ON f.UserId = u.UserId
`;

function mapFine(row) {
  if (!row) {
    return null;
  }

  return {
    fineId: row.FineId,
    userId: row.UserId,
    borrowDetailId: row.BorrowDetailId,
    overdueDays: row.OverdueDays,
    ratePerDay: Number(row.RatePerDay),
    amount: Number(row.Amount),
    paidAmount: Number(row.PaidAmount),
    reason: row.Reason,
    status: row.Status,
    calculatedAt: row.CalculatedAt,
    paidAt: row.PaidAt,
    createdBy: row.CreatedBy,
    collectedBy: row.CollectedBy,
    paymentMethod: row.PaymentMethod,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
    member: {
      userId: row.UserId,
      username: row.Username,
      email: row.Email,
    },
  };
}

// Load the borrowing data a fine is computed from. The amount is never trusted from the client;
// it is derived from these stored due/return dates (BR-FE09-007, BR-FE09-008).
async function getBorrowDetailForFine(borrowDetailId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('BorrowDetailId', sql.Int, borrowDetailId)
    .query(`
      SELECT
        bd.BorrowDetailId,
        br.UserId,
        bd.CopyId,
        bd.DueDate,
        bd.ReturnDate,
        bd.Status AS DetailStatus,
        bc.Barcode,
        b.Title,
        u.Email,
        u.Username
      FROM BorrowDetails bd
      INNER JOIN BorrowRequests br ON bd.RequestId = br.RequestId
      INNER JOIN BookCopies bc ON bd.CopyId = bc.CopyId
      INNER JOIN Books b ON bc.BookId = b.BookId
      INNER JOIN Users u ON br.UserId = u.UserId
      WHERE bd.BorrowDetailId = @BorrowDetailId
    `);

  const row = result.recordset[0];

  if (!row) {
    return null;
  }

  return {
    borrowDetailId: row.BorrowDetailId,
    userId: row.UserId,
    copyId: row.CopyId,
    dueDate: row.DueDate,
    returnDate: row.ReturnDate,
    detailStatus: row.DetailStatus,
    barcode: row.Barcode,
    bookTitle: row.Title,
    email: row.Email,
    username: row.Username,
  };
}

async function findActiveFineByBorrowDetail(borrowDetailId, reason) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('BorrowDetailId', sql.Int, borrowDetailId)
    .input('Reason', sql.NVarChar(255), reason)
    .query(`
      ${fineSelect}
      WHERE f.BorrowDetailId = @BorrowDetailId
        AND f.Reason = @Reason
        AND f.Status = 'UNPAID'
    `);

  return mapFine(result.recordset[0]);
}

async function findFineById(fineId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('FineId', sql.Int, fineId)
    .query(`
      ${fineSelect}
      WHERE f.FineId = @FineId
    `);

  return mapFine(result.recordset[0]);
}

async function listFines({ userId, status, limit = 50, offset = 0 } = {}) {
  const pool = await getPool();
  const request = pool.request();
  const where = [];

  if (userId) {
    request.input('UserId', sql.Int, userId);
    where.push('f.UserId = @UserId');
  }

  if (status) {
    request.input('Status', sql.NVarChar(20), status);
    where.push('f.Status = @Status');
  }

  request.input('Limit', sql.Int, limit);
  request.input('Offset', sql.Int, offset);

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const result = await request.query(`
    ${fineSelect}
    ${whereClause}
    ORDER BY f.CreatedAt DESC, f.FineId DESC
    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
  `);

  return result.recordset.map(mapFine);
}

// Create the fine atomically while re-checking that no active fine already exists for the same
// borrow detail + reason, so concurrent calculate requests cannot create duplicates (BR-FE09-009).
async function createFine({ userId, borrowDetailId, overdueDays, ratePerDay, amount, reason, createdBy, calculatedAt }) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const existing = await new sql.Request(transaction)
      .input('BorrowDetailId', sql.Int, borrowDetailId)
      .input('Reason', sql.NVarChar(255), reason)
      .query(`
        SELECT TOP 1 FineId
        FROM Fines WITH (UPDLOCK, HOLDLOCK)
        WHERE BorrowDetailId = @BorrowDetailId
          AND Reason = @Reason
          AND Status = 'UNPAID'
      `);

    if (existing.recordset.length) {
      await transaction.rollback();
      return { created: false, fineId: existing.recordset[0].FineId };
    }

    const insertResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .input('BorrowDetailId', sql.Int, borrowDetailId)
      .input('OverdueDays', sql.Int, overdueDays)
      .input('RatePerDay', sql.Decimal(10, 2), ratePerDay)
      .input('Amount', sql.Decimal(10, 2), amount)
      .input('Reason', sql.NVarChar(255), reason)
      .input('CreatedBy', sql.Int, createdBy)
      .input('CalculatedAt', sql.DateTime, calculatedAt)
      .query(`
        INSERT INTO Fines (UserId, BorrowDetailId, OverdueDays, RatePerDay, Amount, PaidAmount, Reason, Status, CalculatedAt, CreatedBy)
        OUTPUT INSERTED.FineId
        VALUES (@UserId, @BorrowDetailId, @OverdueDays, @RatePerDay, @Amount, 0, @Reason, 'UNPAID', @CalculatedAt, @CreatedBy)
      `);

    await transaction.commit();
    return { created: true, fineId: insertResult.recordset[0].FineId };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// Record a collection against an UNPAID fine. Marks the fine PAID only when the full amount has been
// collected (INV-4, INV-5). Runs in a transaction so amount/status/paid timestamp stay consistent.
async function recordCollection({ fineId, collectedAmount, paymentMethod, collectedBy, paidAt }) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const fineResult = await new sql.Request(transaction)
      .input('FineId', sql.Int, fineId)
      .query(`
        SELECT TOP 1 FineId, Amount
        FROM Fines WITH (UPDLOCK, HOLDLOCK)
        WHERE FineId = @FineId
          AND Status = 'UNPAID'
      `);

    const fine = fineResult.recordset[0];

    if (!fine) {
      await transaction.rollback();
      return null;
    }

    const fullyCollected = Number(collectedAmount) >= Number(fine.Amount);

    await new sql.Request(transaction)
      .input('FineId', sql.Int, fineId)
      .input('CollectedAmount', sql.Decimal(10, 2), collectedAmount)
      .input('PaymentMethod', sql.NVarChar(50), paymentMethod || null)
      .input('CollectedBy', sql.Int, collectedBy)
      .input('PaidAt', sql.DateTime, fullyCollected ? paidAt : null)
      .input('Status', sql.NVarChar(20), fullyCollected ? 'PAID' : 'UNPAID')
      .query(`
        UPDATE Fines
        SET PaidAmount = @CollectedAmount,
            PaymentMethod = @PaymentMethod,
            CollectedBy = @CollectedBy,
            Status = @Status,
            PaidAt = @PaidAt,
            UpdatedAt = GETDATE()
        WHERE FineId = @FineId
          AND Status = 'UNPAID'
      `);

    await transaction.commit();
    return findFineById(fineId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// Mark an UNPAID fine fully paid (no partial payment in Phase 1, Q-FE09-003).
async function markPaid({ fineId, collectedBy, paidAt, paymentMethod }) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const updateResult = await new sql.Request(transaction)
      .input('FineId', sql.Int, fineId)
      .input('CollectedBy', sql.Int, collectedBy)
      .input('PaidAt', sql.DateTime, paidAt)
      .input('PaymentMethod', sql.NVarChar(50), paymentMethod || null)
      .query(`
        UPDATE Fines
        SET Status = 'PAID',
            PaidAmount = Amount,
            PaidAt = @PaidAt,
            CollectedBy = @CollectedBy,
            PaymentMethod = @PaymentMethod,
            UpdatedAt = GETDATE()
        OUTPUT INSERTED.FineId
        WHERE FineId = @FineId
          AND Status = 'UNPAID'
      `);

    if (!updateResult.recordset.length) {
      await transaction.rollback();
      return null;
    }

    await transaction.commit();
    return findFineById(fineId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// Resolve an UNPAID fine without collecting money (admin waive/cancel, Q-FE09-005).
async function resolveFine({ fineId, status }) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('FineId', sql.Int, fineId)
    .input('Status', sql.NVarChar(20), status)
    .query(`
      UPDATE Fines
      SET Status = @Status,
          UpdatedAt = GETDATE()
      OUTPUT INSERTED.FineId
      WHERE FineId = @FineId
        AND Status = 'UNPAID'
    `);

  if (!result.recordset.length) {
    return null;
  }

  return findFineById(fineId);
}

module.exports = {
  getBorrowDetailForFine,
  findActiveFineByBorrowDetail,
  findFineById,
  listFines,
  createFine,
  recordCollection,
  markPaid,
  resolveFine,
};
