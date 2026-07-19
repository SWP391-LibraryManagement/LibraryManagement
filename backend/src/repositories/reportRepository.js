const { sql, getPool } = require('../config/db');

const ACTUAL_LOAN_DETAIL_STATUSES = new Set(['BORROWED', 'RETURNED', 'LOST', 'DAMAGED', 'OVERDUE']);
const BORROW_DETAIL_STATUSES = new Set(['REQUESTED', 'BORROWED', 'RETURNED', 'LOST', 'DAMAGED', 'OVERDUE']);
const COPY_STATUSES = new Set(['AVAILABLE', 'BORROWED', 'RESERVED', 'DAMAGED', 'LOST', 'INACTIVE']);
const USER_STATUSES = new Set(['ACTIVE', 'INACTIVE', 'LOCKED']);
const MEMBERSHIP_STATUSES = new Set(['PENDING', 'APPROVED', 'REJECTED', 'INACTIVE']);
const ROLE_STATUSES = new Set(['ADMIN', 'LIBRARIAN', 'MEMBER', 'GUEST']);

function groupCount(items, keySelector) {
  const result = {};

  for (const item of items) {
    const key = keySelector(item) || 'UNKNOWN';
    result[key] = (result[key] || 0) + 1;
  }

  return result;
}

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
function buildReport(metrics, rows, filters = {}) {
  const { page, limit, offset } = pagination(filters);
  return {
    metrics,
    rows: rows.slice(offset, offset + limit),
    page,
    limit,
    totalRows: rows.length,
  };
}

function toExclusiveNextDay(value) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

function isWithinDateRange(value, filters = {}) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  if (filters.fromDate && date < new Date(filters.fromDate)) {
    return false;
  }

  if (filters.toDate && date >= toExclusiveNextDay(filters.toDate)) {
    return false;
  }

  return true;
}

async function getBorrowRows(filters = {}, businessDate = toLibraryDateKey()) {
  const pool = await getPool();
  const request = pool.request();
  const where = ['1=1'];

  if (filters.fromDate) {
    request.input('FromDate', sql.DateTime, new Date(filters.fromDate));
    where.push('bd.BorrowDate >= @FromDate');
  }

  if (filters.toDate) {
    request.input('ToDateExclusive', sql.DateTime, toExclusiveNextDay(filters.toDate));
    where.push('bd.BorrowDate < @ToDateExclusive');
  }

  if (filters.status === 'OVERDUE') {
    request.input('BusinessDate', sql.Date, new Date(`${businessDate}T00:00:00.000Z`));
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
    FROM BorrowRequests br
    LEFT JOIN BorrowDetails bd ON br.RequestId = bd.RequestId
    LEFT JOIN BookCopies bc ON bd.CopyId = bc.CopyId
    LEFT JOIN Books b ON bc.BookId = b.BookId
    LEFT JOIN Users u ON br.UserId = u.UserId
    WHERE ${where.join(' AND ')}
    ORDER BY bd.BorrowDate DESC, bd.BorrowDetailId DESC
  `);

  return result.recordset;
}

async function getInventoryRows(filters = {}) {
  const pool = await getPool();
  const request = pool.request();
  const where = ['1=1'];

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
    FROM Books b
    LEFT JOIN Categories c ON b.CategoryId = c.CategoryId
    LEFT JOIN BookCopies bc ON b.BookId = bc.BookId
    WHERE ${where.join(' AND ')}
    ORDER BY b.Title ASC, b.BookId ASC, bc.CopyId ASC
  `);

  return result.recordset;
}

async function getUserRows(filters = {}) {
  const pool = await getPool();
  const request = pool.request();
  const where = ['1=1'];
  const approvalPeriodConditions = ['m.ApprovedAt IS NOT NULL'];

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
    FROM Users u
    LEFT JOIN UserRoles ur ON u.UserId = ur.UserId
    LEFT JOIN Roles r ON ur.RoleId = r.RoleId
    LEFT JOIN Members m ON u.UserId = m.UserId
    WHERE ${where.join(' AND ')}
    ORDER BY u.CreatedAt DESC, u.UserId DESC
  `);

  return result.recordset;
}

async function getBorrowingReport(filters = {}) {
  const today = toLibraryDateKey();
  const rows = await getBorrowRows(filters, today);
  const detailRows = rows.filter((row) => row.BorrowDetailId);

  const borrowCountByPeriod = {};
  const topBorrowedBooks = {};

  for (const row of detailRows) {
    const detailStatus = normalizeStatus(row.DetailStatus, BORROW_DETAIL_STATUSES);
    if (!ACTUAL_LOAN_DETAIL_STATUSES.has(detailStatus)) {
      continue;
    }

    const periodKey = toDateKey(row.BorrowDate);

    if (periodKey) {
      borrowCountByPeriod[periodKey] = (borrowCountByPeriod[periodKey] || 0) + 1;
    }

    if (row.BookId) {
      topBorrowedBooks[row.BookId] = topBorrowedBooks[row.BookId] || {
        bookId: row.BookId,
        title: row.Title || null,
        borrowCount: 0,
      };
      topBorrowedBooks[row.BookId].borrowCount += 1;
    }
  }

  const activeLoans = detailRows.filter(
    (row) => normalizeStatus(row.DetailStatus, BORROW_DETAIL_STATUSES) === 'BORROWED'
  ).length;
  const overdueLoans = detailRows.filter(
    (row) => {
      const status = normalizeStatus(row.DetailStatus, BORROW_DETAIL_STATUSES);
      return status === 'OVERDUE' || (status === 'BORROWED' && row.DueDate && toDateKey(row.DueDate) < today);
    }
  ).length;

  const detailedRows = [...detailRows]
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
      activeLoans,
      overdueLoans,
      borrowCountByPeriod,
      topBorrowedBooks: Object.values(topBorrowedBooks)
        .sort(
          (left, right) =>
            right.borrowCount - left.borrowCount ||
            String(left.title || '').localeCompare(String(right.title || '')) ||
            left.bookId - right.bookId
        )
        .slice(0, 10),
    },
    detailedRows,
    filters
  );
}

async function getInventoryReport(filters = {}) {
  const rows = await getInventoryRows(filters);
  const hasCopyFilters = Boolean(filters.status || filters.location);
  const matchesCopyFilters = (row) => Boolean(
    row.CopyId
    && (!filters.status || row.CopyStatus === filters.status)
    && (!filters.location || row.Location === filters.location)
  );
  const matchedBookIds = hasCopyFilters
    ? new Set(rows.filter(matchesCopyFilters).map((row) => row.BookId))
    : new Set(rows.map((row) => row.BookId));
  const scopedRows = rows.filter((row) => matchedBookIds.has(row.BookId));
  const booksById = new Map();
  const copies = scopedRows.filter(matchesCopyFilters);

  for (const row of scopedRows) {
    if (!booksById.has(row.BookId)) {
      booksById.set(row.BookId, {
        bookId: row.BookId,
        title: row.Title || null,
        categoryId: row.CategoryId,
        categoryName: row.CategoryName || null,
        effectiveAvailability: row.EffectiveAvailability == null
          ? null
          : Number(row.EffectiveAvailability),
        copies: [],
      });
    }

    if (row.CopyId) {
      booksById.get(row.BookId).copies.push({
        copyId: row.CopyId,
        status: row.CopyStatus,
        location: row.Location || null,
      });
    }
  }

  const books = Array.from(booksById.values());
  const availabilityByBookId = new Map(
    books.map((book) => [
      book.bookId,
      book.effectiveAvailability == null
        ? book.copies.filter((copy) => normalizeStatus(copy.status, COPY_STATUSES) === 'AVAILABLE').length
        : book.effectiveAvailability,
    ])
  );
  const detailedRows = copies
    .map((row) => ({
      bookId: row.BookId,
      title: row.Title || null,
      copyId: row.CopyId,
      barcode: row.Barcode || null,
      location: row.Location || null,
      status: normalizeStatus(row.CopyStatus, COPY_STATUSES),
      effectiveAvailability: availabilityByBookId.get(row.BookId) || 0,
    }))
    .sort(
      (left, right) =>
        String(left.title || '').localeCompare(String(right.title || '')) ||
        left.bookId - right.bookId ||
        left.copyId - right.copyId
    );

  return buildReport(
    {
      totalBooks: booksById.size,
      totalCopies: copies.length,
      copiesByStatus: groupCount(copies, (row) => normalizeStatus(row.CopyStatus, COPY_STATUSES)),
      lowStockBooks: books
        .map((book) => ({
          bookId: book.bookId,
          title: book.title,
          effectiveAvailability: availabilityByBookId.get(book.bookId) || 0,
        }))
        .filter((book) => book.effectiveAvailability <= 2),
    },
    detailedRows,
    filters
  );
}

async function getUserStatistics(filters = {}) {
  const rows = await getUserRows(filters);
  const usersById = new Map();

  for (const row of rows) {
    if (!usersById.has(row.UserId)) {
      usersById.set(row.UserId, {
        userId: row.UserId,
        status: normalizeStatus(row.UserStatus, USER_STATUSES),
        createdAt: row.CreatedAt,
        memberApprovedAt: row.MemberApprovedAt,
        isInApprovalPeriod: row.IsInApprovalPeriod == null
          ? isWithinDateRange(row.MemberApprovedAt, filters)
          : Boolean(row.IsInApprovalPeriod),
        roles: new Set(),
        memberStatus: normalizeStatus(row.MemberStatus, MEMBERSHIP_STATUSES),
      });
    }

    if (row.RoleName) {
      usersById.get(row.UserId).roles.add(normalizeStatus(row.RoleName, ROLE_STATUSES));
    }
  }

  const users = Array.from(usersById.values());
  const usersByStatus = groupCount(users, (user) => user.status);
  const membershipByStatus = groupCount(
    users.filter((user) => user.memberStatus),
    (user) => user.memberStatus
  );
  const usersByRole = {};

  for (const user of users) {
    for (const role of user.roles) {
      usersByRole[role] = (usersByRole[role] || 0) + 1;
    }
  }

  const newMembersByPeriod = {};
  for (const user of users.filter(
    (item) => item.memberStatus === 'APPROVED' && item.isInApprovalPeriod
  )) {
    const periodKey = toDateKey(user.memberApprovedAt);

    if (periodKey) {
      newMembersByPeriod[periodKey] = (newMembersByPeriod[periodKey] || 0) + 1;
    }
  }

  const detailedRows = users
    .map((user) => ({
      userId: user.userId,
      status: user.status,
      roles: Array.from(user.roles).sort(),
      membershipStatus: user.memberStatus,
      createdAt: user.createdAt || null,
      approvedAt: user.memberApprovedAt || null,
    }))
    .sort(
      (left, right) =>
        new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime() ||
        right.userId - left.userId
    );

  return buildReport(
    {
      totalMembers: users.filter((user) => user.roles.has('MEMBER')).length,
      usersByStatus,
      usersByRole,
      membershipByStatus,
      newMembersByPeriod,
    },
    detailedRows,
    filters
  );
}

module.exports = {
  getBorrowingReport,
  getInventoryReport,
  getUserStatistics,
};
