const { sql, getPool } = require('../config/db');

const fineFrom = `
  FROM Fines f
  INNER JOIN Users u ON f.UserId = u.UserId
  LEFT JOIN UserProfiles up ON f.UserId = up.UserId
  INNER JOIN BorrowDetails bd ON f.BorrowDetailId = bd.BorrowDetailId
  INNER JOIN BookCopies bc ON bd.CopyId = bc.CopyId
  INNER JOIN Books b ON bc.BookId = b.BookId
`;

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
    u.Email,
    up.FullName,
    b.Title AS BookTitle,
    bc.Barcode
  ${fineFrom}
`;

function mapFine(row) {
  if (!row) return null;

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
    bookTitle: row.BookTitle,
    barcode: row.Barcode,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
    member: {
      userId: row.UserId,
      username: row.Username,
      email: row.Email,
      fullName: row.FullName,
    },
  };
}

async function createRequest(transaction) {
  return transaction ? new sql.Request(transaction) : (await getPool()).request();
}

async function withTransaction(work) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const result = await work(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function inOptionalTransaction(transaction, work) {
  if (transaction) return work(transaction);
  return withTransaction(work);
}

async function getBorrowDetailForFine(borrowDetailId, transaction) {
  const request = await createRequest(transaction);
  const result = await request.input('BorrowDetailId', sql.Int, borrowDetailId).query(`
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
  if (!row) return null;

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

async function findActiveFineByBorrowDetail(borrowDetailId, reason, transaction) {
  const request = await createRequest(transaction);
  const result = await request
    .input('BorrowDetailId', sql.Int, borrowDetailId)
    .input('Reason', sql.NVarChar(255), reason)
    .query(`
      ${fineSelect}
      WHERE f.BorrowDetailId = @BorrowDetailId
        AND f.Reason = @Reason
        AND f.Status = 'UNPAID'
      ORDER BY f.FineId DESC
    `);
  return mapFine(result.recordset[0]);
}

async function findLatestFineByBorrowDetail(borrowDetailId, reason, transaction) {
  const request = await createRequest(transaction);
  const result = await request
    .input('BorrowDetailId', sql.Int, borrowDetailId)
    .input('Reason', sql.NVarChar(255), reason)
    .query(`
      ${fineSelect}
      WHERE f.BorrowDetailId = @BorrowDetailId
        AND f.Reason = @Reason
      ORDER BY CASE WHEN f.Status = 'UNPAID' THEN 0 ELSE 1 END, f.FineId DESC
    `);
  return mapFine(result.recordset[0]);
}

async function findFineById(fineId, transaction) {
  const request = await createRequest(transaction);
  const result = await request.input('FineId', sql.Int, fineId).query(`
    ${fineSelect}
    WHERE f.FineId = @FineId
  `);
  return mapFine(result.recordset[0]);
}

function escapeLikePattern(value) {
  return String(value).replace(/[\\%_\[]/g, (character) => `\\${character}`);
}

async function listFines({ q, userId, status, page = 1, limit = 20 } = {}) {
  const request = await createRequest();
  const where = [];

  if (q) {
    request.input('Search', sql.NVarChar(202), `%${escapeLikePattern(q)}%`);
    where.push(`(
      CONVERT(NVARCHAR(20), f.FineId) LIKE @Search ESCAPE '\\'
      OR LOWER(f.Reason) LIKE LOWER(@Search) ESCAPE '\\'
      OR LOWER(COALESCE(b.Title, '')) LIKE LOWER(@Search) ESCAPE '\\'
      OR LOWER(COALESCE(bc.Barcode, '')) LIKE LOWER(@Search) ESCAPE '\\'
      OR LOWER(COALESCE(u.Username, '')) LIKE LOWER(@Search) ESCAPE '\\'
      OR LOWER(COALESCE(u.Email, '')) LIKE LOWER(@Search) ESCAPE '\\'
      OR LOWER(COALESCE(up.FullName, '')) LIKE LOWER(@Search) ESCAPE '\\'
    )`);
  }
  if (userId) {
    request.input('UserId', sql.Int, userId);
    where.push('f.UserId = @UserId');
  }
  if (status) {
    request.input('Status', sql.NVarChar(20), status);
    where.push('f.Status = @Status');
  }

  const offset = (page - 1) * limit;
  request.input('Offset', sql.Int, offset).input('Limit', sql.Int, limit);
  const whereClause = where.length ? `WHERE ${where.join('\n        AND ')}` : '';
  const result = await request.query(`
    ${fineSelect}
    ${whereClause}
    ORDER BY f.FineId ASC
    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;

    SELECT COUNT_BIG(*) AS Total
    ${fineFrom}
    ${whereClause};
  `);

  return {
    rows: result.recordsets[0].map(mapFine),
    total: Number(result.recordsets[1]?.[0]?.Total || 0),
  };
}

async function createFine(
  { userId, borrowDetailId, overdueDays, ratePerDay, amount, reason, createdBy, calculatedAt },
  transaction
) {
  return inOptionalTransaction(transaction, async (activeTransaction) => {
    const existingResult = await new sql.Request(activeTransaction)
      .input('BorrowDetailId', sql.Int, borrowDetailId)
      .input('Reason', sql.NVarChar(255), reason)
      .query(`
        SELECT TOP 1 FineId, Status, OverdueDays, RatePerDay, Amount
        FROM Fines WITH (UPDLOCK, HOLDLOCK)
        WHERE BorrowDetailId = @BorrowDetailId
          AND Reason = @Reason
        ORDER BY CASE WHEN Status = 'UNPAID' THEN 0 ELSE 1 END, FineId DESC
      `);
    const existing = existingResult.recordset[0];

    if (existing) {
      if (existing.Status !== 'UNPAID') {
        return { created: false, changed: false, fineId: existing.FineId };
      }

      const changed =
        existing.OverdueDays !== overdueDays ||
        Number(existing.RatePerDay) !== Number(ratePerDay) ||
        Number(existing.Amount) !== Number(amount);

      if (changed) {
        await new sql.Request(activeTransaction)
          .input('FineId', sql.Int, existing.FineId)
          .input('OverdueDays', sql.Int, overdueDays)
          .input('RatePerDay', sql.Decimal(10, 2), ratePerDay)
          .input('Amount', sql.Decimal(10, 2), amount)
          .input('CalculatedAt', sql.DateTime, calculatedAt)
          .query(`
            UPDATE Fines
            SET OverdueDays = @OverdueDays,
                RatePerDay = @RatePerDay,
                Amount = @Amount,
                CalculatedAt = @CalculatedAt,
                UpdatedAt = GETDATE()
            WHERE FineId = @FineId
              AND Status = 'UNPAID'
          `);
      }

      return { created: false, changed, fineId: existing.FineId };
    }

    const insertResult = await new sql.Request(activeTransaction)
      .input('UserId', sql.Int, userId)
      .input('BorrowDetailId', sql.Int, borrowDetailId)
      .input('OverdueDays', sql.Int, overdueDays)
      .input('RatePerDay', sql.Decimal(10, 2), ratePerDay)
      .input('Amount', sql.Decimal(10, 2), amount)
      .input('Reason', sql.NVarChar(255), reason)
      .input('CreatedBy', sql.Int, createdBy)
      .input('CalculatedAt', sql.DateTime, calculatedAt)
      .query(`
        INSERT INTO Fines (
          UserId, BorrowDetailId, OverdueDays, RatePerDay, Amount, PaidAmount,
          Reason, Status, CalculatedAt, CreatedBy
        )
        OUTPUT INSERTED.FineId
        VALUES (
          @UserId, @BorrowDetailId, @OverdueDays, @RatePerDay, @Amount, 0,
          @Reason, 'UNPAID', @CalculatedAt, @CreatedBy
        )
      `);

    return { created: true, changed: true, fineId: insertResult.recordset[0].FineId };
  });
}

async function recordCollection({ fineId, paymentMethod, collectedBy, paidAt }, transaction) {
  return inOptionalTransaction(transaction, async (activeTransaction) => {
    const locked = await new sql.Request(activeTransaction)
      .input('FineId', sql.Int, fineId)
      .query(`
        SELECT TOP 1 FineId
        FROM Fines WITH (UPDLOCK, HOLDLOCK)
        WHERE FineId = @FineId
          AND Status = 'UNPAID'
      `);
    if (!locked.recordset.length) return null;

    const updated = await new sql.Request(activeTransaction)
      .input('FineId', sql.Int, fineId)
      .input('PaymentMethod', sql.NVarChar(50), paymentMethod)
      .input('CollectedBy', sql.Int, collectedBy)
      .input('PaidAt', sql.DateTime, paidAt)
      .query(`
        UPDATE Fines
        SET PaidAmount = Amount,
            PaymentMethod = @PaymentMethod,
            CollectedBy = @CollectedBy,
            Status = 'PAID',
            PaidAt = @PaidAt,
            UpdatedAt = GETDATE()
        OUTPUT INSERTED.FineId
        WHERE FineId = @FineId
          AND Status = 'UNPAID'
      `);
    if (!updated.recordset.length) return null;
    return findFineById(fineId, activeTransaction);
  });
}

async function markPaid({ fineId, collectedBy, paidAt, paymentMethod }, transaction) {
  return inOptionalTransaction(transaction, async (activeTransaction) => {
    const locked = await new sql.Request(activeTransaction)
      .input('FineId', sql.Int, fineId)
      .query(`
        SELECT TOP 1 FineId
        FROM Fines WITH (UPDLOCK, HOLDLOCK)
        WHERE FineId = @FineId
          AND Status = 'UNPAID'
      `);
    if (!locked.recordset.length) return null;

    const updated = await new sql.Request(activeTransaction)
      .input('FineId', sql.Int, fineId)
      .input('CollectedBy', sql.Int, collectedBy)
      .input('PaidAt', sql.DateTime, paidAt)
      .input('PaymentMethod', sql.NVarChar(50), paymentMethod)
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
    if (!updated.recordset.length) return null;
    return findFineById(fineId, activeTransaction);
  });
}

async function resolveFine({ fineId, status }, transaction) {
  return inOptionalTransaction(transaction, async (activeTransaction) => {
    const locked = await new sql.Request(activeTransaction)
      .input('FineId', sql.Int, fineId)
      .query(`
        SELECT TOP 1 FineId
        FROM Fines WITH (UPDLOCK, HOLDLOCK)
        WHERE FineId = @FineId
          AND Status = 'UNPAID'
      `);
    if (!locked.recordset.length) return null;

    const updated = await new sql.Request(activeTransaction)
      .input('FineId', sql.Int, fineId)
      .input('Status', sql.NVarChar(20), status)
      .query(`
        UPDATE Fines
        SET Status = @Status,
            PaidAmount = 0,
            PaidAt = NULL,
            CollectedBy = NULL,
            PaymentMethod = NULL,
            UpdatedAt = GETDATE()
        OUTPUT INSERTED.FineId
        WHERE FineId = @FineId
          AND Status = 'UNPAID'
      `);
    if (!updated.recordset.length) return null;
    return findFineById(fineId, activeTransaction);
  });
}

module.exports = {
  withTransaction,
  getBorrowDetailForFine,
  findActiveFineByBorrowDetail,
  findLatestFineByBorrowDetail,
  findFineById,
  listFines,
  createFine,
  recordCollection,
  markPaid,
  resolveFine,
};
