const { sql, getPool } = require('../config/db');

const borrowRequestSelect = `
  SELECT
    br.RequestId,
    br.UserId,
    br.RequestDate,
    br.Status AS RequestStatus,
    br.CreatedBy,
    br.ApprovedBy,
    br.ApprovedAt,
    br.RejectedAt,
    br.ProcessedAt,
    br.CreatedAt AS RequestCreatedAt,
    br.UpdatedAt AS RequestUpdatedAt,
    u.Username,
    u.Email,
    u.Status AS UserStatus,
    bd.BorrowDetailId,
    bd.CopyId,
    bd.BorrowDate,
    bd.DueDate,
    bd.ReturnDate,
    bd.RenewalCount,
    bd.Status AS DetailStatus,
    bd.CreatedAt AS DetailCreatedAt,
    bd.UpdatedAt AS DetailUpdatedAt,
    bc.BookId,
    bc.Barcode,
    bc.Status AS CopyStatus,
    bc.Location,
    b.Title
  FROM BorrowRequests br
  INNER JOIN Users u ON br.UserId = u.UserId
  LEFT JOIN BorrowDetails bd ON br.RequestId = bd.RequestId
  LEFT JOIN BookCopies bc ON bd.CopyId = bc.CopyId
  LEFT JOIN Books b ON bc.BookId = b.BookId
`;

const borrowDetailSelect = `
  SELECT
    br.RequestId,
    br.UserId,
    br.RequestDate,
    br.Status AS RequestStatus,
    u.Username,
    u.Email,
    u.Status AS UserStatus,
    bd.BorrowDetailId,
    bd.CopyId,
    bd.BorrowDate,
    bd.DueDate,
    bd.ReturnDate,
    bd.RenewalCount,
    bd.Status AS DetailStatus,
    bd.CreatedAt AS DetailCreatedAt,
    bd.UpdatedAt AS DetailUpdatedAt,
    bc.BookId,
    bc.Barcode,
    bc.Status AS CopyStatus,
    bc.Location,
    b.Title
  FROM BorrowDetails bd
  INNER JOIN BorrowRequests br ON bd.RequestId = br.RequestId
  INNER JOIN Users u ON br.UserId = u.UserId
  INNER JOIN BookCopies bc ON bd.CopyId = bc.CopyId
  INNER JOIN Books b ON bc.BookId = b.BookId
`;

function mapCopy(row) {
  if (!row || !row.CopyId) {
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

function mapMember(row) {
  return {
    userId: row.UserId,
    username: row.Username,
    email: row.Email,
    status: row.UserStatus,
  };
}

function mapBorrowDetail(row) {
  if (!row || !row.BorrowDetailId) {
    return null;
  }

  return {
    borrowDetailId: row.BorrowDetailId,
    requestId: row.RequestId,
    userId: row.UserId,
    copyId: row.CopyId,
    borrowDate: row.BorrowDate,
    dueDate: row.DueDate,
    returnDate: row.ReturnDate,
    renewalCount: row.RenewalCount,
    status: row.DetailStatus,
    createdAt: row.DetailCreatedAt,
    updatedAt: row.DetailUpdatedAt,
    member: mapMember(row),
    copy: mapCopy(row),
  };
}

function mapBorrowRequests(rows) {
  const requestsById = new Map();

  for (const row of rows) {
    if (!requestsById.has(row.RequestId)) {
      requestsById.set(row.RequestId, {
        requestId: row.RequestId,
        userId: row.UserId,
        requestDate: row.RequestDate,
        status: row.RequestStatus,
        createdBy: row.CreatedBy,
        approvedBy: row.ApprovedBy,
        approvedAt: row.ApprovedAt,
        rejectedAt: row.RejectedAt,
        processedAt: row.ProcessedAt,
        createdAt: row.RequestCreatedAt,
        updatedAt: row.RequestUpdatedAt,
        member: mapMember(row),
        details: [],
      });
    }

    const detail = mapBorrowDetail(row);

    if (detail) {
      requestsById.get(row.RequestId).details.push(detail);
    }
  }

  return Array.from(requestsById.values());
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

async function findCopiesByIds(copyIds) {
  if (!copyIds.length) {
    return [];
  }

  const pool = await getPool();
  const request = pool.request();
  const inputs = copyIds.map((copyId, index) => {
    const inputName = `CopyId${index}`;
    request.input(inputName, sql.Int, copyId);
    return `@${inputName}`;
  });

  const result = await request.query(`
    SELECT
      bc.CopyId,
      bc.BookId,
      bc.Barcode,
      bc.Status AS CopyStatus,
      bc.Location,
      b.Title
    FROM BookCopies bc
    INNER JOIN Books b ON bc.BookId = b.BookId
    WHERE bc.CopyId IN (${inputs.join(', ')})
  `);

  return result.recordset.map(mapCopy);
}

async function countActiveBorrowedCopies(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('UserId', sql.Int, userId)
    .query(`
      SELECT COUNT(*) AS ActiveCount
      FROM BorrowRequests br
      INNER JOIN BorrowDetails bd ON br.RequestId = bd.RequestId
      WHERE br.UserId = @UserId
        AND bd.Status IN ('BORROWED', 'OVERDUE')
    `);

  return result.recordset[0]?.ActiveCount || 0;
}

async function hasBlockingFine(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('UserId', sql.Int, userId)
    .query(`
      SELECT TOP 1 FineId
      FROM Fines
      WHERE UserId = @UserId
        AND Status = 'UNPAID'
        AND Amount > 0
    `);

  return result.recordset.length > 0;
}

async function hasOverdueActiveLoans(userId, today) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('UserId', sql.Int, userId)
    .input('Today', sql.Date, today)
    .query(`
      SELECT TOP 1 bd.BorrowDetailId
      FROM BorrowRequests br
      INNER JOIN BorrowDetails bd ON br.RequestId = bd.RequestId
      WHERE br.UserId = @UserId
        AND bd.Status = 'BORROWED'
        AND bd.DueDate < @Today
    `);

  return result.recordset.length > 0;
}

async function hasReservationConflict(copyId, userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('CopyId', sql.Int, copyId)
    .input('UserId', sql.Int, userId)
    .query(`
      SELECT TOP 1 ReservationId
      FROM Reservations
      WHERE CopyId = @CopyId
        AND UserId <> @UserId
        AND Status = 'ACTIVE'
    `);

  return result.recordset.length > 0;
}

async function findBorrowRequestById(requestId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('RequestId', sql.Int, requestId)
    .query(`
      ${borrowRequestSelect}
      WHERE br.RequestId = @RequestId
      ORDER BY bd.BorrowDetailId ASC
    `);

  return mapBorrowRequests(result.recordset)[0] || null;
}

async function findBorrowDetailById(borrowDetailId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('BorrowDetailId', sql.Int, borrowDetailId)
    .query(`
      ${borrowDetailSelect}
      WHERE bd.BorrowDetailId = @BorrowDetailId
    `);

  return mapBorrowDetail(result.recordset[0]);
}

async function createBorrowRequest({ userId, copyIds }) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const requestResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .query(`
        INSERT INTO BorrowRequests (UserId, Status, CreatedBy)
        OUTPUT INSERTED.RequestId
        VALUES (@UserId, 'PENDING', @UserId)
      `);

    const requestId = requestResult.recordset[0].RequestId;

    for (const copyId of copyIds) {
      await new sql.Request(transaction)
        .input('RequestId', sql.Int, requestId)
        .input('CopyId', sql.Int, copyId)
        .query(`
          INSERT INTO BorrowDetails (RequestId, CopyId, DueDate, Status)
          VALUES (@RequestId, @CopyId, NULL, 'REQUESTED')
        `);
    }

    await transaction.commit();
    return findBorrowRequestById(requestId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function listBorrowRequests({ userId, memberId, status, fromDate, toDate } = {}) {
  const pool = await getPool();
  const request = pool.request();
  const where = [];

  if (userId) {
    request.input('UserId', sql.Int, userId);
    where.push('br.UserId = @UserId');
  }

  if (memberId) {
    request.input('MemberId', sql.Int, memberId);
    where.push('br.UserId = @MemberId');
  }

  if (status) {
    request.input('Status', sql.NVarChar(20), status);
    where.push('br.Status = @Status');
  }

  if (fromDate) {
    request.input('FromDate', sql.DateTime, new Date(fromDate));
    where.push('br.RequestDate >= @FromDate');
  }

  if (toDate) {
    request.input('ToDate', sql.DateTime, new Date(toDate));
    where.push('br.RequestDate <= @ToDate');
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const result = await request.query(`
    ${borrowRequestSelect}
    ${whereClause}
    ORDER BY br.RequestDate DESC, br.RequestId DESC, bd.BorrowDetailId ASC
  `);

  return mapBorrowRequests(result.recordset);
}

async function listBorrowDetails({ userId, status, fromDate, toDate } = {}) {
  const pool = await getPool();
  const request = pool.request();
  const where = [];

  if (userId) {
    request.input('UserId', sql.Int, userId);
    where.push('br.UserId = @UserId');
  }

  if (status) {
    request.input('Status', sql.NVarChar(20), status);
    where.push('bd.Status = @Status');
  }

  if (fromDate) {
    request.input('FromDate', sql.DateTime, new Date(fromDate));
    where.push('br.RequestDate >= @FromDate');
  }

  if (toDate) {
    request.input('ToDate', sql.DateTime, new Date(toDate));
    where.push('br.RequestDate <= @ToDate');
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const result = await request.query(`
    ${borrowDetailSelect}
    ${whereClause}
    ORDER BY br.RequestDate DESC, bd.BorrowDetailId ASC
  `);

  return result.recordset.map(mapBorrowDetail);
}

async function approveBorrowRequest({ requestId, approvedBy, approvalDate, dueDate }) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const unavailableResult = await new sql.Request(transaction)
      .input('RequestId', sql.Int, requestId)
      .query(`
        SELECT TOP 1 bc.CopyId
        FROM BorrowDetails bd WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN BookCopies bc WITH (UPDLOCK, HOLDLOCK) ON bd.CopyId = bc.CopyId
        WHERE bd.RequestId = @RequestId
          AND bd.Status = 'REQUESTED'
          AND bc.Status <> 'AVAILABLE'
      `);

    if (unavailableResult.recordset.length) {
      await transaction.rollback();
      return null;
    }

    const requestResult = await new sql.Request(transaction)
      .input('RequestId', sql.Int, requestId)
      .input('ApprovedBy', sql.Int, approvedBy)
      .input('ApprovalDate', sql.DateTime, approvalDate)
      .query(`
        UPDATE BorrowRequests
        SET Status = 'APPROVED',
            ApprovedBy = @ApprovedBy,
            ApprovedAt = @ApprovalDate,
            ProcessedAt = @ApprovalDate,
            UpdatedAt = GETDATE()
        OUTPUT INSERTED.RequestId
        WHERE RequestId = @RequestId
          AND Status = 'PENDING'
      `);

    if (!requestResult.recordset.length) {
      await transaction.rollback();
      return null;
    }

    await new sql.Request(transaction)
      .input('RequestId', sql.Int, requestId)
      .input('ApprovalDate', sql.DateTime, approvalDate)
      .input('DueDate', sql.Date, dueDate)
      .query(`
        UPDATE BorrowDetails
        SET BorrowDate = @ApprovalDate,
            DueDate = @DueDate,
            Status = 'BORROWED',
            UpdatedAt = GETDATE()
        WHERE RequestId = @RequestId
          AND Status = 'REQUESTED'
      `);

    await new sql.Request(transaction)
      .input('RequestId', sql.Int, requestId)
      .query(`
        UPDATE bc
        SET Status = 'BORROWED',
            UpdatedAt = GETDATE()
        FROM BookCopies bc
        INNER JOIN BorrowDetails bd ON bc.CopyId = bd.CopyId
        WHERE bd.RequestId = @RequestId
      `);

    await transaction.commit();
    return findBorrowRequestById(requestId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function rejectBorrowRequest({ requestId, rejectedBy }) {
  const pool = await getPool();
  await pool
    .request()
    .input('RequestId', sql.Int, requestId)
    .input('RejectedBy', sql.Int, rejectedBy)
    .query(`
      UPDATE BorrowRequests
      SET Status = 'REJECTED',
          RejectedAt = GETDATE(),
          ProcessedAt = GETDATE(),
          ApprovedBy = @RejectedBy,
          UpdatedAt = GETDATE()
      WHERE RequestId = @RequestId
        AND Status = 'PENDING'
    `);

  return findBorrowRequestById(requestId);
}

async function returnBorrowDetail({ borrowDetailId, detailStatus, copyStatus, returnDate }) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const detailResult = await new sql.Request(transaction)
      .input('BorrowDetailId', sql.Int, borrowDetailId)
      .input('DetailStatus', sql.NVarChar(20), detailStatus)
      .input('ReturnDate', sql.Date, returnDate)
      .query(`
        UPDATE BorrowDetails
        SET Status = @DetailStatus,
            ReturnDate = @ReturnDate,
            UpdatedAt = GETDATE()
        OUTPUT INSERTED.RequestId, INSERTED.CopyId
        WHERE BorrowDetailId = @BorrowDetailId
          AND Status = 'BORROWED'
      `);

    const detail = detailResult.recordset[0];

    if (!detail) {
      await transaction.rollback();
      return null;
    }

    await new sql.Request(transaction)
      .input('CopyId', sql.Int, detail.CopyId)
      .input('CopyStatus', sql.NVarChar(20), copyStatus)
      .query(`
        UPDATE BookCopies
        SET Status = @CopyStatus,
            UpdatedAt = GETDATE()
        WHERE CopyId = @CopyId
      `);

    const remainingResult = await new sql.Request(transaction)
      .input('RequestId', sql.Int, detail.RequestId)
      .query(`
        SELECT COUNT(*) AS RemainingCount
        FROM BorrowDetails
        WHERE RequestId = @RequestId
          AND Status NOT IN ('RETURNED', 'LOST', 'DAMAGED')
      `);

    if ((remainingResult.recordset[0]?.RemainingCount || 0) === 0) {
      await new sql.Request(transaction)
        .input('RequestId', sql.Int, detail.RequestId)
        .query(`
          UPDATE BorrowRequests
          SET Status = 'COMPLETED',
              UpdatedAt = GETDATE()
          WHERE RequestId = @RequestId
        `);
    }

    await transaction.commit();
    return findBorrowDetailById(borrowDetailId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function renewBorrowDetail({ borrowDetailId, newDueDate }) {
  const pool = await getPool();
  await pool
    .request()
    .input('BorrowDetailId', sql.Int, borrowDetailId)
    .input('NewDueDate', sql.Date, newDueDate)
    .query(`
      UPDATE BorrowDetails
      SET DueDate = @NewDueDate,
          RenewalCount = RenewalCount + 1,
          UpdatedAt = GETDATE()
      WHERE BorrowDetailId = @BorrowDetailId
        AND Status = 'BORROWED'
    `);

  return findBorrowDetailById(borrowDetailId);
}

module.exports = {
  getMemberEligibility,
  findCopiesByIds,
  countActiveBorrowedCopies,
  hasBlockingFine,
  hasOverdueActiveLoans,
  hasReservationConflict,
  findBorrowRequestById,
  findBorrowDetailById,
  createBorrowRequest,
  listBorrowRequests,
  listBorrowDetails,
  approveBorrowRequest,
  rejectBorrowRequest,
  returnBorrowDetail,
  renewBorrowDetail,
};
