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
    u.Phone,
    u.Status AS UserStatus,
    up.FullName,
    m.MemberId,
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
    b.Title,
    a.AuthorName
  FROM BorrowRequests br
  INNER JOIN Users u ON br.UserId = u.UserId
  LEFT JOIN UserProfiles up ON u.UserId = up.UserId
  LEFT JOIN Members m ON u.UserId = m.UserId
  LEFT JOIN BorrowDetails bd ON br.RequestId = bd.RequestId
  LEFT JOIN BookCopies bc ON bd.CopyId = bc.CopyId
  LEFT JOIN Books b ON bc.BookId = b.BookId
  LEFT JOIN Authors a ON b.AuthorId = a.AuthorId
`;

const borrowDetailSelect = `
  SELECT
    br.RequestId,
    br.UserId,
    br.RequestDate,
    br.Status AS RequestStatus,
    u.Username,
    u.Email,
    u.Phone,
    u.Status AS UserStatus,
    up.FullName,
    m.MemberId,
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
    b.Title,
    a.AuthorName
  FROM BorrowDetails bd
  INNER JOIN BorrowRequests br ON bd.RequestId = br.RequestId
  INNER JOIN Users u ON br.UserId = u.UserId
  LEFT JOIN UserProfiles up ON u.UserId = up.UserId
  LEFT JOIN Members m ON u.UserId = m.UserId
  INNER JOIN BookCopies bc ON bd.CopyId = bc.CopyId
  INNER JOIN Books b ON bc.BookId = b.BookId
  LEFT JOIN Authors a ON b.AuthorId = a.AuthorId
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
    bookStatus: row.BookStatus,
    location: row.Location,
    title: row.Title,
    author: row.AuthorName,
  };
}

function mapBorrowability(row) {
  const copy = mapCopy(row);

  if (!copy) {
    return null;
  }

  return {
    ...copy,
    hasActiveReservation: Boolean(row.ActiveReservationId),
    notifiedReservationId: row.NotifiedReservationId || null,
    notifiedReservationUserId: row.NotifiedReservationUserId || null,
  };
}

function mapMember(row) {
  return {
    userId: row.UserId,
    username: row.Username,
    fullName: row.FullName,
    email: row.Email,
    phone: row.Phone,
    memberId: row.MemberId,
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

// @spec FR-FE07-029
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
    requestStatus: row.RequestStatus,
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

async function listBorrowCandidates({ bookId = null, q = '', userId }) {
  const request = (await getPool()).request().input('UserId', sql.Int, userId);
  const where = ["b.Status = 'ACTIVE'"];

  if (bookId) {
    request.input('BookId', sql.Int, bookId);
    where.push('b.BookId = @BookId');
  }
  if (q) {
    request.input('Search', sql.NVarChar(202), `%${q.replace(/[\\%_\[]/g, '\\$&')}%`);
    where.push("(b.Title LIKE @Search ESCAPE '\\' OR COALESCE(a.AuthorName, '') LIKE @Search ESCAPE '\\')");
  }

  const result = await request.query(`
    SELECT
      b.BookId,
      b.Title,
      a.AuthorName,
      c.CategoryName,
      bc.CopyId,
      bc.Barcode,
      bc.Location
    FROM Books b
    LEFT JOIN Authors a ON b.AuthorId = a.AuthorId
    LEFT JOIN Categories c ON b.CategoryId = c.CategoryId
    INNER JOIN BookCopies bc ON b.BookId = bc.BookId
    OUTER APPLY (
      SELECT TOP 1 r.ReservationId, r.UserId, r.Status
      FROM Reservations r
      WHERE r.CopyId = bc.CopyId AND r.Status IN ('ACTIVE', 'NOTIFIED')
      ORDER BY CASE WHEN r.Status = 'NOTIFIED' THEN 0 ELSE 1 END, r.ReservationId
    ) claim
    WHERE ${where.join(' AND ')}
      AND (
        (bc.Status = 'AVAILABLE' AND claim.ReservationId IS NULL)
        OR (bc.Status = 'RESERVED' AND claim.Status = 'NOTIFIED' AND claim.UserId = @UserId)
      )
    ORDER BY b.Title, b.BookId, bc.CopyId;
  `);

  const books = new Map();
  for (const row of result.recordset) {
    if (!books.has(row.BookId)) {
      books.set(row.BookId, {
        bookId: row.BookId,
        title: row.Title,
        author: row.AuthorName || 'Không rõ tác giả',
        category: row.CategoryName || 'Chưa phân loại',
        copies: [],
      });
    }
    books.get(row.BookId).copies.push({
      copyId: row.CopyId,
      barcode: row.Barcode,
      location: row.Location || 'Chưa cập nhật',
    });
  }
  return [...books.values()];
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

async function findBorrowabilityByCopyIds(copyIds, userId) {
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
      b.Status AS BookStatus,
      b.Title,
      activeQueue.ReservationId AS ActiveReservationId,
      notifiedHold.ReservationId AS NotifiedReservationId,
      notifiedHold.UserId AS NotifiedReservationUserId
    FROM BookCopies bc
    INNER JOIN Books b ON bc.BookId = b.BookId
    OUTER APPLY (
      SELECT TOP 1 r.ReservationId
      FROM Reservations r
      WHERE r.CopyId = bc.CopyId
        AND r.Status = 'ACTIVE'
      ORDER BY r.ReservedAt ASC, r.ReservationId ASC
    ) activeQueue
    OUTER APPLY (
      SELECT TOP 1 r.ReservationId, r.UserId
      FROM Reservations r
      WHERE r.CopyId = bc.CopyId
        AND r.Status = 'NOTIFIED'
      ORDER BY r.NotifiedAt ASC, r.ReservationId ASC
    ) notifiedHold
    WHERE bc.CopyId IN (${inputs.join(', ')})
  `);

  return result.recordset.map(mapBorrowability);
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

async function countRequestedCopiesOnDate(userId, businessDayStartUtc, businessDayEndUtc) {
  const pool = await getPool();
  const result = await pool.request()
    .input('UserId', sql.Int, userId)
    .input('BusinessDayStartUtc', sql.DateTime, businessDayStartUtc)
    .input('BusinessDayEndUtc', sql.DateTime, businessDayEndUtc)
    .query(`
      SELECT COUNT(*) AS DailyCount
      FROM BorrowRequests br
      INNER JOIN BorrowDetails bd ON br.RequestId = bd.RequestId
      WHERE br.UserId = @UserId
        AND br.RequestDate >= @BusinessDayStartUtc
        AND br.RequestDate < @BusinessDayEndUtc
        AND br.Status <> 'REJECTED'
    `);
  return result.recordset[0]?.DailyCount || 0;
}

async function countBorrowedCopiesOnDate(userId, businessDayStartUtc, businessDayEndUtc) {
  const pool = await getPool();
  const result = await pool.request()
    .input('UserId', sql.Int, userId)
    .input('BusinessDayStartUtc', sql.DateTime, businessDayStartUtc)
    .input('BusinessDayEndUtc', sql.DateTime, businessDayEndUtc)
    .query(`
      SELECT COUNT(*) AS DailyCount
      FROM BorrowRequests br
      INNER JOIN BorrowDetails bd ON br.RequestId = bd.RequestId
      WHERE br.UserId = @UserId
        AND br.ApprovedAt >= @BusinessDayStartUtc
        AND br.ApprovedAt < @BusinessDayEndUtc
    `);
  return result.recordset[0]?.DailyCount || 0;
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

// @spec BR-FE07-005A, BR-FE07-024, FR-FE07-014A, FR-FE07-022, FR-FE07-023
// Eligibility, limits, copy state, reservation priority, inserts, and audit share one transaction.
async function createBorrowRequest({
  userId,
  copyIds,
  requestDate,
  businessDate,
  businessDayStartUtc,
  businessDayEndUtc,
  auditLogRepository,
  auditEntry,
}) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  const requestedCopyIds = [...copyIds].map(Number).sort((left, right) => left - right);

  await transaction.begin();
  let requestId;

  try {
    const memberLockResult = await new sql.Request(transaction)
      .input('MemberLockResource', sql.NVarChar(255), `FE07-BORROW-MEMBER-${userId}`)
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
      throw new Error('Unable to acquire the borrowing member lock.');
    }

    const memberResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .query(`
        SELECT
          u.Status AS UserStatus,
          m.Status AS MemberStatus,
          MAX(CASE WHEN r.RoleName = 'MEMBER' THEN 1 ELSE 0 END) AS HasMemberRole
        FROM Users u WITH (UPDLOCK, HOLDLOCK)
        LEFT JOIN UserRoles ur WITH (UPDLOCK, HOLDLOCK) ON ur.UserId = u.UserId
        LEFT JOIN Roles r WITH (HOLDLOCK) ON r.RoleId = ur.RoleId
        LEFT JOIN Members m WITH (UPDLOCK, HOLDLOCK) ON m.UserId = u.UserId
        WHERE u.UserId = @UserId
        GROUP BY u.Status, m.Status;
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

    const dailyLimit = member.MemberStatus === 'APPROVED' ? 5 : 3;
    const lockedCopies = new Map();

    for (const copyId of requestedCopyIds) {
      const copyResult = await new sql.Request(transaction)
        .input('CopyId', sql.Int, copyId)
        .query(`
          SELECT bc.CopyId, bc.Status AS CopyStatus, b.Status AS BookStatus
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

      lockedCopies.set(copyId, copy);
    }

    const fineResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .query(`
        SELECT TOP 1 FineId
        FROM Fines WITH (UPDLOCK, HOLDLOCK)
        WHERE UserId = @UserId
          AND Status = 'UNPAID'
          AND Amount > 0;
      `);

    if (fineResult.recordset.length) {
      await transaction.rollback();
      return { outcome: 'UNPAID_FINE_BLOCKS_BORROWING' };
    }

    const overdueResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .input('BusinessDate', sql.Date, businessDate)
      .query(`
        SELECT TOP 1 bd.BorrowDetailId
        FROM BorrowRequests br WITH (HOLDLOCK)
        INNER JOIN BorrowDetails bd WITH (UPDLOCK, HOLDLOCK) ON bd.RequestId = br.RequestId
        WHERE br.UserId = @UserId
          AND bd.Status = 'BORROWED'
          AND bd.DueDate < @BusinessDate;
      `);

    if (overdueResult.recordset.length) {
      await transaction.rollback();
      return { outcome: 'OVERDUE_LOAN_BLOCKS_BORROWING' };
    }

    const activeCountResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .query(`
        SELECT COUNT(*) AS ActiveCount
        FROM BorrowRequests br WITH (HOLDLOCK)
        INNER JOIN BorrowDetails bd WITH (UPDLOCK, HOLDLOCK) ON bd.RequestId = br.RequestId
        WHERE br.UserId = @UserId
          AND bd.Status = 'BORROWED';
      `);

    if (Number(activeCountResult.recordset[0]?.ActiveCount || 0) + requestedCopyIds.length > 5) {
      await transaction.rollback();
      return { outcome: 'BORROW_LIMIT_EXCEEDED' };
    }

    const dailyCountResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .input('BusinessDayStartUtc', sql.DateTime, businessDayStartUtc)
      .input('BusinessDayEndUtc', sql.DateTime, businessDayEndUtc)
      .query(`
        SELECT COUNT(*) AS DailyCount
        FROM BorrowRequests br WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN BorrowDetails bd WITH (UPDLOCK, HOLDLOCK) ON bd.RequestId = br.RequestId
        WHERE br.UserId = @UserId
          AND br.RequestDate >= @BusinessDayStartUtc
          AND br.RequestDate < @BusinessDayEndUtc
          AND br.Status <> 'REJECTED';
      `);

    if (Number(dailyCountResult.recordset[0]?.DailyCount || 0) + requestedCopyIds.length > dailyLimit) {
      await transaction.rollback();
      return { outcome: 'BORROW_DAILY_LIMIT_EXCEEDED', dailyLimit };
    }

    for (const copyId of requestedCopyIds) {
      const reservationResult = await new sql.Request(transaction)
        .input('CopyId', sql.Int, copyId)
        .query(`
          SELECT ReservationId, UserId, Status
          FROM Reservations WITH (UPDLOCK, HOLDLOCK)
          WHERE CopyId = @CopyId
            AND Status IN ('ACTIVE', 'NOTIFIED')
          ORDER BY CASE WHEN Status = 'NOTIFIED' THEN 0 ELSE 1 END,
                   ReservedAt ASC,
                   ReservationId ASC;
        `);
      const copy = lockedCopies.get(copyId);
      const activeReservation = reservationResult.recordset.find(
        (reservation) => reservation.Status === 'ACTIVE'
      );
      const notifiedReservation = reservationResult.recordset.find(
        (reservation) => reservation.Status === 'NOTIFIED'
      );

      if (copy.CopyStatus === 'AVAILABLE' && activeReservation) {
        await transaction.rollback();
        return { outcome: 'RESERVATION_QUEUE_PRIORITY' };
      }

      if (copy.CopyStatus === 'AVAILABLE' && !notifiedReservation) {
        continue;
      }

      if (
        copy.CopyStatus === 'RESERVED'
        && notifiedReservation
        && Number(notifiedReservation.UserId) === Number(userId)
      ) {
        continue;
      }

      if (copy.CopyStatus === 'RESERVED' && !notifiedReservation) {
        await transaction.rollback();
        return { outcome: 'RESERVATION_STATE_CONFLICT' };
      }

      await transaction.rollback();
      return { outcome: 'COPY_NOT_AVAILABLE' };
    }

    const requestResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .input('RequestDate', sql.DateTime, requestDate)
      .query(`
        INSERT INTO BorrowRequests (UserId, RequestDate, Status, CreatedBy)
        OUTPUT INSERTED.RequestId
        VALUES (@UserId, @RequestDate, 'PENDING', @UserId)
      `);

    requestId = requestResult.recordset[0].RequestId;

    for (const copyId of requestedCopyIds) {
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

  return {
    outcome: 'CREATED',
    borrowRequest: await findBorrowRequestById(requestId),
  };
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

async function listBorrowDetails({ userId, status, fromDate, toDate, page = 1, limit = 20, today } = {}) {
  const pool = await getPool();
  const request = pool.request();
  const where = [];

  if (userId) {
    request.input('UserId', sql.Int, userId);
    where.push('br.UserId = @UserId');
  }

  if (status === 'OVERDUE') {
    where.push("bd.Status = 'BORROWED'");
    request.input('Today', sql.Date, today || new Date());
    where.push('bd.DueDate < @Today');
  } else if (status) {
    request.input('Status', sql.NVarChar(20), status);
    where.push('bd.Status = @Status');
  }

  if (fromDate) {
    request.input('FromDate', sql.DateTime, new Date(fromDate));
    where.push('COALESCE(bd.BorrowDate, br.RequestDate) >= @FromDate');
  }

  if (toDate) {
    request.input('ToDateExclusive', sql.DateTime, toExclusiveNextDay(toDate));
    where.push('COALESCE(bd.BorrowDate, br.RequestDate) < @ToDateExclusive');
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const offset = (Number(page) - 1) * Number(limit);
  request.input('Offset', sql.Int, offset);
  request.input('Limit', sql.Int, Number(limit));
  const countResult = await request.query(`
    SELECT COUNT(*) AS Total
    FROM BorrowDetails bd
    INNER JOIN BorrowRequests br ON bd.RequestId = br.RequestId
    ${whereClause}
  `);
  const result = await request.query(`
    ${borrowDetailSelect}
    ${whereClause}
    ORDER BY CASE WHEN bd.BorrowDate IS NULL THEN 1 ELSE 0 END,
             bd.BorrowDate DESC,
             bd.BorrowDetailId DESC
    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
  `);

  return { rows: result.recordset.map(mapBorrowDetail), total: countResult.recordset[0]?.Total || 0 };
}

// @spec BR-FE07-005, BR-FE07-025, FR-FE07-019, FR-FE07-022, FR-FE07-025
// @spec FR-FE08-023, FR-FE08-025, FR-FE08-026, FR-FE08-028
// serializes borrowing and matching reservation fulfillment (NFR-FE07-TXN-001).
async function approveBorrowRequest({
  requestId,
  approvedBy,
  approvalDate,
  borrowDate,
  dueDate,
  businessDayStartUtc,
  businessDayEndUtc,
  auditLogRepository,
  auditEntry,
}) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();
  let fulfilledReservationIds = [];

  try {
    // Resolve only stable lock keys first. Every decision is repeated after the
    // canonical member -> copies -> request/details -> reservations locks.
    const lockKeyResult = await new sql.Request(transaction)
      .input('RequestId', sql.Int, requestId)
      .query(`
        SELECT br.RequestId, br.UserId, bd.CopyId
        FROM BorrowRequests br
        INNER JOIN BorrowDetails bd ON bd.RequestId = br.RequestId
        WHERE br.RequestId = @RequestId
          AND br.Status = 'PENDING'
          AND bd.Status = 'REQUESTED'
      `);

    if (!lockKeyResult.recordset.length) {
      await transaction.rollback();
      return { outcome: 'REQUEST_NOT_APPROVABLE' };
    }

    const memberUserId = lockKeyResult.recordset[0].UserId;
    const requestedCopyIds = lockKeyResult.recordset
      .map((detail) => detail.CopyId)
      .sort((left, right) => left - right);

    await new sql.Request(transaction)
      .input('MemberLockResource', sql.NVarChar(255), `FE07-BORROW-MEMBER-${memberUserId}`)
      .query(`
        DECLARE @LockResult int;
        EXEC @LockResult = sp_getapplock
          @Resource = @MemberLockResource,
          @LockMode = 'Exclusive',
          @LockOwner = 'Transaction',
          @LockTimeout = 10000;
        IF @LockResult < 0 THROW 51001, 'Unable to acquire borrowing member lock.', 1;
      `);

    const memberResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, memberUserId)
      .query(`
        SELECT
          u.Status AS UserStatus,
          m.MemberId,
          m.Status AS MemberStatus,
          MAX(CASE WHEN r.RoleName = 'MEMBER' THEN 1 ELSE 0 END) AS HasMemberRole
        FROM Users u WITH (UPDLOCK, HOLDLOCK)
        LEFT JOIN UserRoles ur WITH (UPDLOCK, HOLDLOCK) ON ur.UserId = u.UserId
        LEFT JOIN Roles r WITH (HOLDLOCK) ON r.RoleId = ur.RoleId
        LEFT JOIN Members m WITH (UPDLOCK, HOLDLOCK) ON m.UserId = u.UserId
        WHERE u.UserId = @UserId
        GROUP BY u.Status, m.MemberId, m.Status
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

    const dailyLimit = member.MemberStatus === 'APPROVED' ? 5 : 3;

    const lockedCopies = new Map();

    for (const copyId of requestedCopyIds) {
      const copyResult = await new sql.Request(transaction)
        .input('CopyId', sql.Int, copyId)
        .query(`
          SELECT bc.CopyId, bc.Status, b.Status AS BookStatus
          FROM BookCopies bc WITH (UPDLOCK, HOLDLOCK)
          INNER JOIN Books b WITH (UPDLOCK, HOLDLOCK) ON b.BookId = bc.BookId
          WHERE bc.CopyId = @CopyId
        `);

      if (!copyResult.recordset.length) {
        await transaction.rollback();
        return { outcome: 'COPY_NOT_AVAILABLE' };
      }

      lockedCopies.set(copyId, copyResult.recordset[0]);
    }

    const requestResult = await new sql.Request(transaction)
      .input('RequestId', sql.Int, requestId)
      .query(`
        SELECT RequestId, UserId
        FROM BorrowRequests WITH (UPDLOCK, HOLDLOCK)
        WHERE RequestId = @RequestId
          AND Status = 'PENDING'
      `);

    if (
      !requestResult.recordset.length
      || Number(requestResult.recordset[0].UserId) !== Number(memberUserId)
    ) {
      await transaction.rollback();
      return { outcome: 'REQUEST_NOT_APPROVABLE' };
    }

    const requestedDetailsResult = await new sql.Request(transaction)
      .input('RequestId', sql.Int, requestId)
      .query(`
        SELECT bd.CopyId
        FROM BorrowDetails bd WITH (UPDLOCK, HOLDLOCK)
        WHERE bd.RequestId = @RequestId
          AND bd.Status = 'REQUESTED'
      `);

    const lockedRequestedCopyIds = requestedDetailsResult.recordset
      .map((detail) => detail.CopyId)
      .sort((left, right) => left - right);
    if (
      lockedRequestedCopyIds.length !== requestedCopyIds.length
      || lockedRequestedCopyIds.some((copyId, index) => copyId !== requestedCopyIds[index])
    ) {
      await transaction.rollback();
      return { outcome: 'REQUEST_NOT_APPROVABLE' };
    }

    for (const copyId of requestedCopyIds) {
      const copy = lockedCopies.get(copyId);
      if (copy.BookStatus === 'INACTIVE') {
        await transaction.rollback();
        return { outcome: 'BOOK_INACTIVE' };
      }
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
      .input('BorrowDate', sql.Date, borrowDate)
      .query(`
        SELECT TOP 1 bd.BorrowDetailId
        FROM BorrowRequests br WITH (HOLDLOCK)
        INNER JOIN BorrowDetails bd WITH (UPDLOCK, HOLDLOCK) ON br.RequestId = bd.RequestId
        WHERE br.UserId = @UserId
          AND bd.Status = 'BORROWED'
          AND bd.DueDate < @BorrowDate
      `);

    if (overdueResult.recordset.length) {
      await transaction.rollback();
      return { outcome: 'OVERDUE_LOAN_BLOCKS_BORROWING' };
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

    const dailyCountResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, memberUserId)
      .input('BusinessDayStartUtc', sql.DateTime, businessDayStartUtc)
      .input('BusinessDayEndUtc', sql.DateTime, businessDayEndUtc)
      .query(`
        SELECT COUNT(*) AS DailyCount
        FROM BorrowRequests br WITH (HOLDLOCK)
        INNER JOIN BorrowDetails bd WITH (UPDLOCK, HOLDLOCK) ON br.RequestId = bd.RequestId
        WHERE br.UserId = @UserId
        AND br.ApprovedAt >= @BusinessDayStartUtc
        AND br.ApprovedAt < @BusinessDayEndUtc
      `);

    if (Number(dailyCountResult.recordset[0]?.DailyCount || 0) + requestedCount > dailyLimit) {
      await transaction.rollback();
      return { outcome: 'BORROW_DAILY_LIMIT_EXCEEDED', dailyLimit };
    }

    const fulfilledReservations = [];

    for (const copyId of requestedCopyIds) {
      const reservationResult = await new sql.Request(transaction)
        .input('CopyId', sql.Int, copyId)
        .query(`
          SELECT ReservationId, UserId, Status
          FROM Reservations WITH (UPDLOCK, HOLDLOCK)
          WHERE CopyId = @CopyId
            AND Status IN ('ACTIVE', 'NOTIFIED')
          ORDER BY CASE WHEN Status = 'NOTIFIED' THEN 0 ELSE 1 END,
                   ReservedAt ASC,
                   ReservationId ASC
        `);
      const copy = lockedCopies.get(copyId);
      const activeReservation = reservationResult.recordset.find(
        (reservation) => reservation.Status === 'ACTIVE'
      );
      const notifiedReservation = reservationResult.recordset.find(
        (reservation) => reservation.Status === 'NOTIFIED'
      );

      if (copy.Status === 'AVAILABLE' && activeReservation) {
        await transaction.rollback();
        return { outcome: 'RESERVATION_QUEUE_PRIORITY' };
      }

      if (copy.Status === 'AVAILABLE' && !notifiedReservation) {
        continue;
      }

      if (
        copy.Status === 'RESERVED'
        && notifiedReservation
        && Number(notifiedReservation.UserId) === Number(memberUserId)
      ) {
        fulfilledReservations.push({
          reservationId: notifiedReservation.ReservationId,
          copyId,
        });
        continue;
      }

      if (copy.Status === 'RESERVED' && !notifiedReservation) {
        await transaction.rollback();
        return { outcome: 'RESERVATION_STATE_CONFLICT' };
      }

      await transaction.rollback();
      return { outcome: 'COPY_NOT_AVAILABLE' };
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
      .input('BorrowDate', sql.Date, borrowDate)
      .input('DueDate', sql.Date, dueDate)
      .query(`
        UPDATE BorrowDetails
        SET BorrowDate = @BorrowDate,
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

    for (const { reservationId, copyId } of fulfilledReservations) {
      const fulfillmentResult = await new sql.Request(transaction)
        .input('ReservationId', sql.Int, reservationId)
        .input('MemberUserId', sql.Int, memberUserId)
        .input('CopyId', sql.Int, copyId)
        .query(`
          UPDATE Reservations
          SET Status = 'FULFILLED',
              UpdatedAt = GETDATE()
          WHERE ReservationId = @ReservationId
            AND UserId = @MemberUserId
            AND CopyId = @CopyId
            AND Status = 'NOTIFIED'
        `);

      if (fulfillmentResult.rowsAffected?.[0] !== 1) {
        await transaction.rollback();
        return { outcome: 'RESERVATION_STATE_CONFLICT' };
      }
    }

    fulfilledReservationIds = fulfilledReservations.map(({ reservationId }) => reservationId);

    if (auditLogRepository && auditEntry) {
      await auditLogRepository.create({ ...auditEntry, transaction });
      for (const { reservationId, copyId } of fulfilledReservations) {
        await auditLogRepository.create({
          ...auditEntry,
          action: 'RESERVATION_FULFILL',
          targetType: 'RESERVATION',
          targetId: reservationId,
          metadata: { requestId, copyId, memberUserId },
          transaction,
        });
      }
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  return {
    outcome: 'APPROVED',
    borrowRequest: await findBorrowRequestById(requestId),
    fulfilledReservationIds,
  };
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
    const lockKeyResult = await new sql.Request(transaction)
      .input('BorrowDetailId', sql.Int, borrowDetailId)
      .query(`
        SELECT RequestId, CopyId
        FROM BorrowDetails
        WHERE BorrowDetailId = @BorrowDetailId;
      `);

    const lockKey = lockKeyResult.recordset[0];
    if (!lockKey) {
      await transaction.rollback();
      return null;
    }

    const requestLockResult = await new sql.Request(transaction)
      .input(
        'RequestLockResource',
        sql.NVarChar(255),
        `FE07-RETURN-REQUEST-${lockKey.RequestId}`
      )
      .query(`
        DECLARE @RequestLockResult INT;
        EXEC @RequestLockResult = sp_getapplock
          @Resource = @RequestLockResource,
          @LockMode = 'Exclusive',
          @LockOwner = 'Transaction',
          @LockTimeout = 10000;
        SELECT @RequestLockResult AS LockResult;
      `);

    if (Number(requestLockResult.recordset[0]?.LockResult) < 0) {
      throw new Error('Unable to acquire the borrowing return request lock.');
    }

    const copyResult = await new sql.Request(transaction)
      .input('CopyId', sql.Int, lockKey.CopyId)
      .query(`
        SELECT CopyId, Status
        FROM BookCopies WITH (UPDLOCK, HOLDLOCK)
        WHERE CopyId = @CopyId;
      `);

    if (!copyResult.recordset.length || copyResult.recordset[0].Status !== 'BORROWED') {
      await transaction.rollback();
      return { outcome: 'BORROW_STATE_CONFLICT' };
    }

    const lockedDetailResult = await new sql.Request(transaction)
      .input('BorrowDetailId', sql.Int, borrowDetailId)
      .query(`
        SELECT BorrowDetailId, RequestId, CopyId, Status
        FROM BorrowDetails WITH (UPDLOCK, HOLDLOCK)
        WHERE BorrowDetailId = @BorrowDetailId;
      `);

    const lockedDetail = lockedDetailResult.recordset[0];
    if (
      !lockedDetail
      || lockedDetail.Status !== 'BORROWED'
      || Number(lockedDetail.RequestId) !== Number(lockKey.RequestId)
      || Number(lockedDetail.CopyId) !== Number(lockKey.CopyId)
    ) {
      await transaction.rollback();
      return null;
    }

    const requestDetailsResult = await new sql.Request(transaction)
      .input('RequestId', sql.Int, lockedDetail.RequestId)
      .query(`
        SELECT BorrowDetailId, Status
        FROM BorrowDetails WITH (UPDLOCK, HOLDLOCK)
        WHERE RequestId = @RequestId;
      `);

    await new sql.Request(transaction)
      .input('CopyId', sql.Int, lockedDetail.CopyId)
      .query(`
        SELECT ReservationId
        FROM Reservations WITH (UPDLOCK, HOLDLOCK)
        WHERE CopyId = @CopyId
          AND Status IN ('ACTIVE', 'NOTIFIED');
      `);

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

    const copyUpdateResult = await new sql.Request(transaction)
      .input('CopyId', sql.Int, detail.CopyId)
      .input('CopyStatus', sql.NVarChar(20), copyStatus)
      .query(`
        UPDATE BookCopies
        SET Status = @CopyStatus,
            UpdatedAt = GETDATE()
        WHERE CopyId = @CopyId
          AND Status = 'BORROWED'
      `);

    if (copyUpdateResult.rowsAffected && copyUpdateResult.rowsAffected[0] !== 1) {
      await transaction.rollback();
      return { outcome: 'BORROW_STATE_CONFLICT' };
    }

    const remainingCount = requestDetailsResult.recordset.filter((item) => (
      Number(item.BorrowDetailId) !== Number(borrowDetailId)
      && !['RETURNED', 'LOST', 'DAMAGED'].includes(item.Status)
    )).length;
    if (remainingCount === 0) {
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

// @spec FR-FE07-015, FR-FE07-016, FR-FE07-020, FR-FE07-021, FR-FE08-024
// Renewal eligibility and every blocker are authoritative only inside this transaction.
async function renewBorrowDetail({
  borrowDetailId,
  userId,
  today,
  newDueDate,
  auditLogRepository,
  auditEntry,
}) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const lockKeyResult = await new sql.Request(transaction)
      .input('BorrowDetailId', sql.Int, borrowDetailId)
      .query(`
        SELECT bd.RequestId, bd.CopyId, br.UserId
        FROM BorrowDetails bd
        INNER JOIN BorrowRequests br ON br.RequestId = bd.RequestId
        WHERE bd.BorrowDetailId = @BorrowDetailId;
      `);

    const lockKey = lockKeyResult.recordset[0];
    if (!lockKey || Number(lockKey.UserId) !== Number(userId)) {
      await transaction.rollback();
      return { outcome: 'BORROW_DETAIL_NOT_BORROWED' };
    }

    const memberLockResult = await new sql.Request(transaction)
      .input('MemberLockResource', sql.NVarChar(255), `FE07-BORROW-MEMBER-${userId}`)
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
      throw new Error('Unable to acquire the borrowing member lock.');
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
      .input('CopyId', sql.Int, lockKey.CopyId)
      .query(`
        SELECT CopyId, Status
        FROM BookCopies WITH (UPDLOCK, HOLDLOCK)
        WHERE CopyId = @CopyId;
      `);

    if (!copyResult.recordset.length) {
      await transaction.rollback();
      return { outcome: 'BORROW_DETAIL_NOT_BORROWED' };
    }

    const detailResult = await new sql.Request(transaction)
      .input('BorrowDetailId', sql.Int, borrowDetailId)
      .query(`
        SELECT
          bd.BorrowDetailId,
          bd.RequestId,
          bd.CopyId,
          bd.Status,
          bd.DueDate,
          bd.RenewalCount,
          br.UserId
        FROM BorrowDetails bd WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN BorrowRequests br WITH (HOLDLOCK) ON br.RequestId = bd.RequestId
        WHERE bd.BorrowDetailId = @BorrowDetailId;
      `);

    const detail = detailResult.recordset[0];
    if (
      !detail
      || Number(detail.UserId) !== Number(userId)
      || Number(detail.RequestId) !== Number(lockKey.RequestId)
      || Number(detail.CopyId) !== Number(lockKey.CopyId)
      || detail.Status !== 'BORROWED'
    ) {
      await transaction.rollback();
      return { outcome: 'BORROW_DETAIL_NOT_BORROWED' };
    }

    if (Number(detail.RenewalCount || 0) >= 1) {
      await transaction.rollback();
      return { outcome: 'RENEWAL_LIMIT_REACHED' };
    }

    if (new Date(detail.DueDate).getTime() < new Date(today).getTime()) {
      await transaction.rollback();
      return { outcome: 'BORROW_DETAIL_OVERDUE' };
    }

    const fineResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .query(`
        SELECT TOP 1 FineId
        FROM Fines WITH (UPDLOCK, HOLDLOCK)
        WHERE UserId = @UserId
          AND Status = 'UNPAID'
          AND Amount > 0;
      `);

    if (fineResult.recordset.length) {
      await transaction.rollback();
      return { outcome: 'UNPAID_FINE_BLOCKS_BORROWING' };
    }

    const overdueResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .input('Today', sql.Date, today)
      .query(`
        SELECT TOP 1 bd.BorrowDetailId
        FROM BorrowRequests br WITH (HOLDLOCK)
        INNER JOIN BorrowDetails bd WITH (UPDLOCK, HOLDLOCK) ON bd.RequestId = br.RequestId
        WHERE br.UserId = @UserId
          AND bd.Status = 'BORROWED'
          AND bd.DueDate < @Today;
      `);

    if (overdueResult.recordset.length) {
      await transaction.rollback();
      return { outcome: 'OVERDUE_LOAN_BLOCKS_BORROWING' };
    }

    const reservationResult = await new sql.Request(transaction)
      .input('CopyId', sql.Int, lockKey.CopyId)
      .input('UserId', sql.Int, userId)
      .query(`
        SELECT TOP 1 ReservationId
        FROM Reservations WITH (UPDLOCK, HOLDLOCK)
        WHERE CopyId = @CopyId
          AND UserId <> @UserId
          AND Status IN ('ACTIVE', 'NOTIFIED')
        ORDER BY CASE WHEN Status = 'NOTIFIED' THEN 0 ELSE 1 END,
                 ReservedAt ASC,
                 ReservationId ASC;
      `);

    if (reservationResult.recordset.length) {
      await transaction.rollback();
      return { outcome: 'RESERVATION_BLOCKS_RENEWAL' };
    }

    const updateResult = await new sql.Request(transaction)
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
          AND RenewalCount < 1;
      `);

    if (!updateResult.recordset.length) {
      await transaction.rollback();
      return { outcome: 'RENEWAL_LIMIT_REACHED' };
    }

    if (auditLogRepository && auditEntry) {
      await auditLogRepository.create({ ...auditEntry, transaction });
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  return {
    outcome: 'RENEWED',
    borrowDetail: await findBorrowDetailById(borrowDetailId),
  };
}

module.exports = {
  listBorrowCandidates,
  getMemberEligibility,
  findBorrowabilityByCopyIds,
  countActiveBorrowedCopies,
  countRequestedCopiesOnDate,
  countBorrowedCopiesOnDate,
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
