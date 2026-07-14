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

function toDateOnly(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : null;
}

function toExclusiveNextDay(value) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + 1);
  return date;
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
    borrowDate: toDateOnly(row.BorrowDate),
    dueDate: toDateOnly(row.DueDate),
    returnDate: toDateOnly(row.ReturnDate),
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
        AND bd.Status = 'BORROWED'
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

// @spec FR-FE07-022 — create runs inside a transaction so request + details commit or roll back together (NFR-FE07-TXN-001)
async function createBorrowRequest({ userId, copyIds, auditLogRepository, auditEntry }) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();
  let requestId;

  try {
    const requestResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .query(`
        INSERT INTO BorrowRequests (UserId, Status, CreatedBy)
        OUTPUT INSERTED.RequestId
        VALUES (@UserId, 'PENDING', @UserId)
      `);

    requestId = requestResult.recordset[0].RequestId;

    for (const copyId of copyIds) {
      await new sql.Request(transaction)
        .input('RequestId', sql.Int, requestId)
        .input('CopyId', sql.Int, copyId)
        .query(`
          INSERT INTO BorrowDetails (RequestId, CopyId, DueDate, Status)
          VALUES (@RequestId, @CopyId, NULL, 'REQUESTED')
        `);
    }

    if (auditLogRepository && auditEntry) {
      await auditLogRepository.create({
        ...auditEntry,
        targetId: auditEntry.targetId ?? requestId,
        transaction,
      });
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  return findBorrowRequestById(requestId);
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
    request.input('ToDateExclusive', sql.DateTime, toExclusiveNextDay(toDate));
    where.push('br.RequestDate < @ToDateExclusive');
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

  if (status === 'OVERDUE') {
    where.push("bd.Status = 'BORROWED'");
    where.push('bd.DueDate < CAST(GETDATE() AS DATE)');
  } else if (status) {
    request.input('Status', sql.NVarChar(20), status);
    where.push('bd.Status = @Status');
  }

  if (fromDate) {
    request.input('FromDate', sql.DateTime, new Date(fromDate));
    where.push('br.RequestDate >= @FromDate');
  }

  if (toDate) {
    request.input('ToDateExclusive', sql.DateTime, toExclusiveNextDay(toDate));
    where.push('br.RequestDate < @ToDateExclusive');
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const result = await request.query(`
    ${borrowDetailSelect}
    ${whereClause}
    ORDER BY br.RequestDate DESC, bd.BorrowDetailId ASC
  `);

  return result.recordset.map(mapBorrowDetail);
}

// @spec BR-FE07-005, FR-FE07-019, FR-FE07-022 — approval serializes a member's approvals and
// updates request, details, due dates and copies atomically (NFR-FE07-TXN-001).
async function approveBorrowRequest({
  requestId,
  approvedBy,
  approvalDate,
  dueDate,
  auditLogRepository,
  auditEntry,
}) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    // Lock the request first to get its member, then the member to serialize every approval for them.
    const requestResult = await new sql.Request(transaction)
      .input('RequestId', sql.Int, requestId)
      .query(`
        SELECT RequestId, UserId
        FROM BorrowRequests WITH (UPDLOCK, HOLDLOCK)
        WHERE RequestId = @RequestId
          AND Status = 'PENDING'
      `);

    if (!requestResult.recordset.length) {
      await transaction.rollback();
      return { outcome: 'REQUEST_NOT_APPROVABLE' };
    }

    const memberUserId = requestResult.recordset[0].UserId;
    const memberResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, memberUserId)
      .query(`
        SELECT u.Status AS UserStatus, m.MemberId, m.Status AS MemberStatus
        FROM Users u WITH (UPDLOCK, HOLDLOCK)
        LEFT JOIN Members m WITH (UPDLOCK, HOLDLOCK) ON m.UserId = u.UserId
        WHERE u.UserId = @UserId
      `);

    const member = memberResult.recordset[0];
    if (!member || !member.MemberId) {
      await transaction.rollback();
      return { outcome: 'REQUEST_NOT_APPROVABLE' };
    }

    if (member.UserStatus !== 'ACTIVE') {
      await transaction.rollback();
      return { outcome: 'MEMBER_ACCOUNT_INACTIVE' };
    }

    if (member.MemberStatus !== 'APPROVED') {
      await transaction.rollback();
      return { outcome: 'MEMBERSHIP_NOT_APPROVED' };
    }

    const fineResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, memberUserId)
      .query(`
        SELECT TOP 1 FineId
        FROM Fines WITH (UPDLOCK, HOLDLOCK)
        WHERE UserId = @UserId
          AND Status = 'UNPAID'
          AND Amount > 0
      `);

    if (fineResult.recordset.length) {
      await transaction.rollback();
      return { outcome: 'UNPAID_FINE_BLOCKS_BORROWING' };
    }

    const overdueResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, memberUserId)
      .input('ApprovalDate', sql.Date, approvalDate)
      .query(`
        SELECT TOP 1 bd.BorrowDetailId
        FROM BorrowRequests br WITH (HOLDLOCK)
        INNER JOIN BorrowDetails bd WITH (UPDLOCK, HOLDLOCK) ON br.RequestId = bd.RequestId
        WHERE br.UserId = @UserId
          AND bd.Status = 'BORROWED'
          AND bd.DueDate < @ApprovalDate
      `);

    if (overdueResult.recordset.length) {
      await transaction.rollback();
      return { outcome: 'OVERDUE_LOAN_BLOCKS_BORROWING' };
    }

    const requestedDetailsResult = await new sql.Request(transaction)
      .input('RequestId', sql.Int, requestId)
      .query(`
        SELECT bd.CopyId
        FROM BorrowDetails bd WITH (UPDLOCK, HOLDLOCK)
        WHERE bd.RequestId = @RequestId
          AND bd.Status = 'REQUESTED'
      `);

    if (!requestedDetailsResult.recordset.length) {
      await transaction.rollback();
      return { outcome: 'REQUEST_NOT_APPROVABLE' };
    }

    const requestedCopyIds = requestedDetailsResult.recordset
      .map((detail) => detail.CopyId)
      .sort((left, right) => left - right);

    for (const copyId of requestedCopyIds) {
      const copyResult = await new sql.Request(transaction)
        .input('CopyId', sql.Int, copyId)
        .query(`
          SELECT CopyId, Status
          FROM BookCopies WITH (UPDLOCK, HOLDLOCK)
          WHERE CopyId = @CopyId
        `);

      if (!copyResult.recordset.length || copyResult.recordset[0].Status !== 'AVAILABLE') {
        await transaction.rollback();
        return { outcome: 'COPY_NOT_AVAILABLE' };
      }
    }

    const activeCountResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, memberUserId)
      .query(`
        SELECT COUNT(*) AS ActiveCount
        FROM BorrowRequests br WITH (HOLDLOCK)
        INNER JOIN BorrowDetails bd WITH (UPDLOCK, HOLDLOCK) ON br.RequestId = bd.RequestId
        WHERE br.UserId = @UserId
          AND bd.Status = 'BORROWED'
      `);
    const activeCount = activeCountResult.recordset[0].ActiveCount;
    const requestedCount = requestedCopyIds.length;

    if (activeCount + requestedCount > 5) {
      await transaction.rollback();
      return { outcome: 'BORROW_LIMIT_EXCEEDED' };
    }

    await new sql.Request(transaction)
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
        WHERE RequestId = @RequestId
          AND Status = 'PENDING'
      `);

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
          AND bd.Status = 'BORROWED'
      `);

    if (auditLogRepository && auditEntry) {
      await auditLogRepository.create({ ...auditEntry, transaction });
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  return { outcome: 'APPROVED', borrowRequest: await findBorrowRequestById(requestId) };
}

async function rejectBorrowRequest({ requestId, rejectedBy, auditLogRepository, auditEntry }) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const result = await new sql.Request(transaction)
      .input('RequestId', sql.Int, requestId)
      .input('RejectedBy', sql.Int, rejectedBy)
      .query(`
      UPDATE BorrowRequests
      SET Status = 'REJECTED',
          RejectedAt = GETDATE(),
          ProcessedAt = GETDATE(),
          ApprovedBy = @RejectedBy,
          UpdatedAt = GETDATE()
      OUTPUT INSERTED.RequestId
      WHERE RequestId = @RequestId
        AND Status = 'PENDING'
    `);

    if (!result.recordset.length) {
      await transaction.rollback();
      return null;
    }

    if (auditLogRepository && auditEntry) {
      await auditLogRepository.create({ ...auditEntry, transaction });
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  return findBorrowRequestById(requestId);
}

// @spec FR-FE07-022 — return updates detail, copy status and request completion atomically; partial failure rolls back (NFR-FE07-TXN-002)
async function returnBorrowDetail({
  borrowDetailId,
  detailStatus,
  copyStatus,
  returnDate,
  auditLogRepository,
  auditEntry,
}) {
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

    if (auditLogRepository && auditEntry) {
      await auditLogRepository.create({ ...auditEntry, transaction });
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  return findBorrowDetailById(borrowDetailId);
}

async function renewBorrowDetail({ borrowDetailId, newDueDate, auditLogRepository, auditEntry }) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const result = await new sql.Request(transaction)
      .input('BorrowDetailId', sql.Int, borrowDetailId)
      .input('NewDueDate', sql.Date, newDueDate)
      .query(`
      UPDATE BorrowDetails
      SET DueDate = @NewDueDate,
          RenewalCount = RenewalCount + 1,
          UpdatedAt = GETDATE()
      OUTPUT INSERTED.BorrowDetailId
      WHERE BorrowDetailId = @BorrowDetailId
        AND Status = 'BORROWED'
        AND RenewalCount < 1
      `);

    if (!result.recordset.length) {
      await transaction.rollback();
      return null;
    }

    if (auditLogRepository && auditEntry) {
      await auditLogRepository.create({ ...auditEntry, transaction });
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

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
