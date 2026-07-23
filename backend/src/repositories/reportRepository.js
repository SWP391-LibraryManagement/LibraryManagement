const { sql, getPool } = require('../config/db');

const BORROW_DETAIL_STATUSES = new Set(['REQUESTED', 'BORROWED', 'RETURNED', 'LOST', 'DAMAGED', 'OVERDUE']);
const COPY_STATUSES = new Set(['AVAILABLE', 'BORROWED', 'RESERVED', 'DAMAGED', 'LOST', 'INACTIVE']);
const USER_STATUSES = new Set(['ACTIVE', 'INACTIVE', 'LOCKED']);
const MEMBERSHIP_STATUSES = new Set(['PENDING', 'APPROVED', 'REJECTED', 'INACTIVE']);
const ROLE_STATUSES = new Set(['ADMIN', 'LIBRARIAN', 'MEMBER', 'GUEST']);

function toDateKey(value) {
  if (value == null) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function toLibraryDateKey(value = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function normalizeStatus(value, allowedStatuses) {
  if (value == null) return null;
  const normalized = String(value).toUpperCase();
  return allowedStatuses.has(normalized) ? normalized : 'UNKNOWN';
}

function pagination(filters = {}) {
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  return { page, limit, offset: (page - 1) * limit };
}

// @spec FR-FE12-010
function buildReport(metrics, rows, filters = {}, totalRows = rows.length) {
  const { page, limit } = pagination(filters);
  return {
    metrics,
    rows,
    page,
    limit,
    totalRows,
  };
}

function getResultset(result, index, pageIndex) {
  if (Array.isArray(result.recordsets)) {
    return result.recordsets[index] || [];
  }

  return index === pageIndex ? result.recordset || [] : [];
}

function toCountMap(rows, keyName, countName, allowedStatuses) {
  const counts = {};

  for (const row of rows) {
    const key = allowedStatuses
      ? normalizeStatus(row[keyName], allowedStatuses)
      : toDateKey(row[keyName]);
    if (key) {
      counts[key] = (counts[key] || 0) + Number(row[countName] || 0);
    }
  }

  return counts;
}

function toExclusiveNextDay(value) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

async function getBorrowRows(filters = {}, businessDate = toLibraryDateKey()) {
  const pool = await getPool();
  const request = pool.request();
  const where = ['1=1'];
  const { offset, limit } = pagination(filters);
  request.input('Offset', sql.Int, offset);
  request.input('Limit', sql.Int, limit);
  request.input('BusinessDate', sql.Date, new Date(`${businessDate}T00:00:00.000Z`));

  if (filters.q) {
    request.input('Search', sql.NVarChar(202), `%${filters.q}%`);
    where.push("(b.Title LIKE @Search OR bc.Barcode LIKE @Search OR u.Username LIKE @Search OR u.Email LIKE @Search OR CONVERT(NVARCHAR(20), br.UserId) LIKE @Search)");
  }

  if (filters.fromDate) {
    request.input('FromDate', sql.DateTime, new Date(filters.fromDate));
    where.push('bd.BorrowDate >= @FromDate');
  }

  if (filters.toDate) {
    request.input('ToDateExclusive', sql.DateTime, toExclusiveNextDay(filters.toDate));
    where.push('bd.BorrowDate < @ToDateExclusive');
  }

  if (filters.status === 'OVERDUE') {
    where.push("bd.Status = 'BORROWED'");
    where.push('bd.DueDate < @BusinessDate');
  } else if (filters.status) {
    request.input('Status', sql.NVarChar(20), filters.status);
    where.push('(br.Status = @Status OR bd.Status = @Status)');
  }

  if (filters.bookId) {
    request.input('BookId', sql.Int, filters.bookId);
    where.push('bc.BookId = @BookId');
  }

  if (filters.userId) {
    request.input('UserId', sql.Int, filters.userId);
    where.push('br.UserId = @UserId');
  }

  const result = await request.query(`
    SELECT
      br.RequestId,
      br.UserId,
      br.RequestDate,
      br.Status AS RequestStatus,
      bd.BorrowDetailId,
      bd.CopyId,
      bd.BorrowDate,
      bd.DueDate,
      bd.ReturnDate,
      bd.Status AS DetailStatus,
      bc.BookId,
      bc.Barcode,
      bc.Status AS CopyStatus,
      b.Title,
      u.Username,
      u.Email
    INTO #BorrowReportRows
    FROM BorrowRequests br
    LEFT JOIN BorrowDetails bd ON br.RequestId = bd.RequestId
    LEFT JOIN BookCopies bc ON bd.CopyId = bc.CopyId
    LEFT JOIN Books b ON bc.BookId = b.BookId
    LEFT JOIN Users u ON br.UserId = u.UserId
    WHERE ${where.join(' AND ')};

    SELECT
      SUM(CASE WHEN DetailStatus = 'BORROWED' THEN 1 ELSE 0 END) AS ActiveLoans,
      SUM(CASE
        WHEN DetailStatus = 'OVERDUE'
          OR (DetailStatus = 'BORROWED' AND DueDate < @BusinessDate)
        THEN 1 ELSE 0
      END) AS OverdueLoans,
      COUNT(*) AS TotalRows
    FROM #BorrowReportRows
    WHERE BorrowDetailId IS NOT NULL;

    SELECT
      CONVERT(DATE, BorrowDate) AS PeriodDate,
      COUNT(*) AS BorrowCount
    FROM #BorrowReportRows
    WHERE BorrowDetailId IS NOT NULL
      AND DetailStatus IN ('BORROWED', 'RETURNED', 'LOST', 'DAMAGED', 'OVERDUE')
      AND BorrowDate IS NOT NULL
    GROUP BY CONVERT(DATE, BorrowDate)
    ORDER BY PeriodDate ASC;

    SELECT TOP 10
      BookId,
      MAX(Title) AS Title,
      COUNT(*) AS BorrowCount
    FROM #BorrowReportRows
    WHERE BorrowDetailId IS NOT NULL
      AND DetailStatus IN ('BORROWED', 'RETURNED', 'LOST', 'DAMAGED', 'OVERDUE')
      AND BookId IS NOT NULL
    GROUP BY BookId
    ORDER BY BorrowCount DESC, MAX(Title) ASC, BookId ASC;

    SELECT *
    FROM #BorrowReportRows
    WHERE BorrowDetailId IS NOT NULL
    ORDER BY BorrowDate DESC, BorrowDetailId DESC
    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
  `);

  return {
    summary: getResultset(result, 0, 3)[0] || {},
    borrowPeriods: getResultset(result, 1, 3),
    topBooks: getResultset(result, 2, 3),
    pageRows: getResultset(result, 3, 3),
  };
}

async function getInventoryRows(filters = {}) {
  const pool = await getPool();
  const request = pool.request();
  const where = ['1=1'];
  const { offset, limit } = pagination(filters);
  request.input('Offset', sql.Int, offset);
  request.input('Limit', sql.Int, limit);

  if (filters.q) {
    request.input('Search', sql.NVarChar(202), `%${filters.q}%`);
    where.push('(b.Title LIKE @Search OR bc.Barcode LIKE @Search OR bc.Location LIKE @Search OR CONVERT(NVARCHAR(20), b.BookId) LIKE @Search)');
  }

  if (filters.categoryId) {
    request.input('CategoryId', sql.Int, filters.categoryId);
    where.push('b.CategoryId = @CategoryId');
  }

  if (filters.bookId) {
    request.input('BookId', sql.Int, filters.bookId);
    where.push('b.BookId = @BookId');
  }

  if (filters.status) {
    request.input('CopyStatus', sql.NVarChar(20), filters.status);
    where.push('bc.Status = @CopyStatus');
  }

  if (filters.location) {
    request.input('Location', sql.NVarChar(100), filters.location);
    where.push('bc.Location = @Location');
  }

  const result = await request.query(`
    SELECT
      b.BookId,
      b.Title,
      b.CategoryId,
      c.CategoryName,
      bc.CopyId,
      bc.Barcode,
      bc.Status AS CopyStatus,
      bc.Location,
      (
        SELECT COUNT(*)
        FROM BookCopies availabilityCopy
        WHERE availabilityCopy.BookId = b.BookId
          AND availabilityCopy.Status = 'AVAILABLE'
      ) AS EffectiveAvailability
    INTO #InventoryReportRows
    FROM Books b
    LEFT JOIN Categories c ON b.CategoryId = c.CategoryId
    LEFT JOIN BookCopies bc ON b.BookId = bc.BookId
    WHERE ${where.join(' AND ')};

    SELECT
      COUNT(DISTINCT BookId) AS TotalBooks,
      COUNT(CopyId) AS TotalCopies,
      COUNT(CopyId) AS TotalRows
    FROM #InventoryReportRows;

    SELECT
      CopyStatus,
      COUNT(*) AS CopyCount
    FROM #InventoryReportRows
    WHERE CopyId IS NOT NULL
    GROUP BY CopyStatus
    ORDER BY CopyStatus ASC;

    SELECT
      BookId,
      MAX(Title) AS Title,
      MAX(EffectiveAvailability) AS EffectiveAvailability
    FROM #InventoryReportRows
    GROUP BY BookId
    HAVING MAX(EffectiveAvailability) <= 2
    ORDER BY MAX(Title) ASC, BookId ASC;

    SELECT *
    FROM #InventoryReportRows
    WHERE CopyId IS NOT NULL
    ORDER BY Title ASC, BookId ASC, CopyId ASC
    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
  `);

  return {
    summary: getResultset(result, 0, 3)[0] || {},
    copiesByStatus: getResultset(result, 1, 3),
    lowStockBooks: getResultset(result, 2, 3),
    pageRows: getResultset(result, 3, 3),
  };
}

async function getUserRows(filters = {}) {
  const pool = await getPool();
  const request = pool.request();
  const where = ['1=1'];
  const approvalPeriodConditions = ['m.ApprovedAt IS NOT NULL'];
  const { offset, limit } = pagination(filters);
  request.input('Offset', sql.Int, offset);
  request.input('Limit', sql.Int, limit);

  if (filters.q) {
    request.input('Search', sql.NVarChar(202), `%${filters.q}%`);
    where.push(`(
      CONVERT(NVARCHAR(20), u.UserId) LIKE @Search
      OR u.Status LIKE @Search
      OR m.Status LIKE @Search
      OR EXISTS (
        SELECT 1
        FROM UserRoles searchUr
        INNER JOIN Roles searchRole ON searchUr.RoleId = searchRole.RoleId
        WHERE searchUr.UserId = u.UserId AND searchRole.RoleName LIKE @Search
      )
    )`);
  }

  if (filters.roleId) {
    request.input('RoleId', sql.Int, filters.roleId);
    where.push('ur.RoleId = @RoleId');
  }

  if (filters.status) {
    request.input('Status', sql.NVarChar(20), filters.status);
    where.push('u.Status = @Status');
  }

  if (filters.membershipStatus) {
    request.input('MembershipStatus', sql.NVarChar(20), filters.membershipStatus);
    where.push('m.Status = @MembershipStatus');
  }

  if (filters.fromDate) {
    request.input('FromDate', sql.DateTime, new Date(filters.fromDate));
    approvalPeriodConditions.push('m.ApprovedAt >= @FromDate');
  }

  if (filters.toDate) {
    request.input('ToDateExclusive', sql.DateTime, toExclusiveNextDay(filters.toDate));
    approvalPeriodConditions.push('m.ApprovedAt < @ToDateExclusive');
  }

  const result = await request.query(`
    SELECT
      u.UserId,
      u.Status AS UserStatus,
      u.CreatedAt,
      ur.RoleId,
      r.RoleName,
      m.Status AS MemberStatus,
      m.ApprovedAt AS MemberApprovedAt,
      CASE WHEN ${approvalPeriodConditions.join(' AND ')} THEN 1 ELSE 0 END AS IsInApprovalPeriod
    INTO #UserReportRows
    FROM Users u
    LEFT JOIN UserRoles ur ON u.UserId = ur.UserId
    LEFT JOIN Roles r ON ur.RoleId = r.RoleId
    LEFT JOIN Members m ON u.UserId = m.UserId
    WHERE ${where.join(' AND ')};

    SELECT COUNT(DISTINCT UserId) AS TotalMembers
    FROM #UserReportRows
    WHERE RoleName = 'MEMBER';

    SELECT COUNT(DISTINCT UserId) AS TotalRows
    FROM #UserReportRows;

    SELECT
      UserStatus,
      COUNT(DISTINCT UserId) AS UserCount
    FROM #UserReportRows
    GROUP BY UserStatus
    ORDER BY UserStatus ASC;

    SELECT
      RoleName,
      COUNT(DISTINCT UserId) AS UserCount
    FROM #UserReportRows
    WHERE RoleName IS NOT NULL
    GROUP BY RoleName
    ORDER BY RoleName ASC;

    SELECT
      MemberStatus,
      COUNT(DISTINCT UserId) AS UserCount
    FROM #UserReportRows
    WHERE MemberStatus IS NOT NULL
    GROUP BY MemberStatus
    ORDER BY MemberStatus ASC;

    SELECT
      CONVERT(DATE, MemberApprovedAt) AS PeriodDate,
      COUNT(DISTINCT UserId) AS MemberCount
    FROM #UserReportRows
    WHERE IsInApprovalPeriod = 1
      AND MemberApprovedAt IS NOT NULL
    GROUP BY CONVERT(DATE, MemberApprovedAt)
    ORDER BY PeriodDate ASC;

    ;WITH PagedUsers AS (
      SELECT UserId
      FROM #UserReportRows
      GROUP BY UserId
      ORDER BY UserId ASC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
    )
    SELECT userRows.*
    FROM PagedUsers
    INNER JOIN #UserReportRows userRows ON userRows.UserId = PagedUsers.UserId
    ORDER BY userRows.UserId ASC, userRows.RoleId ASC;
  `);

  return {
    summary: {
      totalMembers: Number(getResultset(result, 0, 6)[0]?.TotalMembers || 0),
      totalRows: Number(getResultset(result, 1, 6)[0]?.TotalRows || 0),
    },
    usersByStatus: getResultset(result, 2, 6),
    usersByRole: getResultset(result, 3, 6),
    membershipByStatus: getResultset(result, 4, 6),
    newMembersByPeriod: getResultset(result, 5, 6),
    pageRows: getResultset(result, 6, 6),
  };
}

async function getBorrowingReport(filters = {}) {
  const today = toLibraryDateKey();
  const snapshot = await getBorrowRows(filters, today);
  const detailedRows = [...snapshot.pageRows]
    .sort(
      (left, right) =>
        new Date(right.BorrowDate || 0).getTime() - new Date(left.BorrowDate || 0).getTime() ||
        right.BorrowDetailId - left.BorrowDetailId
    )
    .map((row) => {
      const rawStatus = normalizeStatus(row.DetailStatus, BORROW_DETAIL_STATUSES);
      const status =
        rawStatus === 'BORROWED' && row.DueDate && toDateKey(row.DueDate) < today
          ? 'OVERDUE'
          : rawStatus;
      return {
        borrowDetailId: row.BorrowDetailId,
        requestId: row.RequestId,
        userId: row.UserId,
        bookId: row.BookId,
        copyId: row.CopyId,
        status,
        borrowDate: toDateKey(row.BorrowDate),
        dueDate: toDateKey(row.DueDate),
        returnDate: toDateKey(row.ReturnDate),
      };
    });

  return buildReport(
    {
      activeLoans: Number(snapshot.summary.ActiveLoans || 0),
      overdueLoans: Number(snapshot.summary.OverdueLoans || 0),
      borrowCountByPeriod: toCountMap(
        snapshot.borrowPeriods,
        'PeriodDate',
        'BorrowCount'
      ),
      topBorrowedBooks: snapshot.topBooks.map((row) => ({
        bookId: row.BookId,
        title: row.Title || null,
        borrowCount: Number(row.BorrowCount || 0),
      })),
    },
    detailedRows,
    filters,
    Number(snapshot.summary.TotalRows ?? snapshot.pageRows.length)
  );
}

async function getInventoryReport(filters = {}) {
  const snapshot = await getInventoryRows(filters);
  const detailedRows = snapshot.pageRows
    .map((row) => ({
      bookId: row.BookId,
      title: row.Title || null,
      copyId: row.CopyId,
      barcode: row.Barcode || null,
      location: row.Location || null,
      status: normalizeStatus(row.CopyStatus, COPY_STATUSES),
      effectiveAvailability: Number(row.EffectiveAvailability || 0),
    }))
    .sort(
      (left, right) =>
        String(left.title || '').localeCompare(String(right.title || '')) ||
        left.bookId - right.bookId ||
        left.copyId - right.copyId
    );

  return buildReport(
    {
      totalBooks: Number(snapshot.summary.TotalBooks || 0),
      totalCopies: Number(snapshot.summary.TotalCopies || 0),
      copiesByStatus: toCountMap(
        snapshot.copiesByStatus,
        'CopyStatus',
        'CopyCount',
        COPY_STATUSES
      ),
      lowStockBooks: snapshot.lowStockBooks.map((row) => ({
        bookId: row.BookId,
        title: row.Title || null,
        effectiveAvailability: Number(row.EffectiveAvailability || 0),
      })),
    },
    detailedRows,
    filters,
    Number(snapshot.summary.TotalRows ?? snapshot.pageRows.length)
  );
}

async function getUserStatistics(filters = {}) {
  const snapshot = await getUserRows(filters);
  const pagedUsersById = new Map();
  for (const row of snapshot.pageRows) {
    if (!pagedUsersById.has(row.UserId)) {
      pagedUsersById.set(row.UserId, {
        userId: row.UserId,
        status: normalizeStatus(row.UserStatus, USER_STATUSES),
        roles: new Set(),
        memberStatus: normalizeStatus(row.MemberStatus, MEMBERSHIP_STATUSES),
        createdAt: row.CreatedAt,
        memberApprovedAt: row.MemberApprovedAt,
      });
    }
    if (row.RoleName) {
      pagedUsersById.get(row.UserId).roles.add(normalizeStatus(row.RoleName, ROLE_STATUSES));
    }
  }

  const detailedRows = Array.from(pagedUsersById.values())
    .map((user) => ({
      userId: user.userId,
      status: user.status,
      roles: Array.from(user.roles).sort(),
      membershipStatus: user.memberStatus,
      createdAt: user.createdAt || null,
      approvedAt: user.memberApprovedAt || null,
    }))
    .sort((left, right) => left.userId - right.userId);

  return buildReport(
    {
      totalMembers: snapshot.summary.totalMembers,
      usersByStatus: toCountMap(
        snapshot.usersByStatus,
        'UserStatus',
        'UserCount',
        USER_STATUSES
      ),
      usersByRole: toCountMap(
        snapshot.usersByRole,
        'RoleName',
        'UserCount',
        ROLE_STATUSES
      ),
      membershipByStatus: toCountMap(
        snapshot.membershipByStatus,
        'MemberStatus',
        'UserCount',
        MEMBERSHIP_STATUSES
      ),
      newMembersByPeriod: toCountMap(
        snapshot.newMembersByPeriod,
        'PeriodDate',
        'MemberCount'
      ),
    },
    detailedRows,
    filters,
    snapshot.summary.totalRows || snapshot.pageRows.length
  );
}

module.exports = {
  getBorrowingReport,
  getInventoryReport,
  getUserStatistics,
};
