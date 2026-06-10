const { sql, getPool } = require('../config/db');

function groupCount(items, keySelector) {
  const result = {};

  for (const item of items) {
    const key = keySelector(item) || 'UNKNOWN';
    result[key] = (result[key] || 0) + 1;
  }

  return result;
}

function toDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

async function getBorrowRows(filters = {}) {
  const pool = await getPool();
  const request = pool.request();
  const where = ['1=1'];

  if (filters.fromDate) {
    request.input('FromDate', sql.DateTime, new Date(filters.fromDate));
    where.push('br.RequestDate >= @FromDate');
  }

  if (filters.toDate) {
    request.input('ToDate', sql.DateTime, new Date(filters.toDate));
    where.push('br.RequestDate <= @ToDate');
  }

  if (filters.status) {
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
    ORDER BY br.RequestDate DESC, br.RequestId DESC, bd.BorrowDetailId ASC
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
    request.input('Status', sql.NVarChar(20), filters.status);
    where.push('bc.Status = @Status');
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
      bc.Status AS CopyStatus,
      bc.Location
    FROM Books b
    LEFT JOIN Categories c ON b.CategoryId = c.CategoryId
    LEFT JOIN BookCopies bc ON b.BookId = bc.BookId
    WHERE ${where.join(' AND ')}
    ORDER BY b.BookId, bc.CopyId
  `);

  return result.recordset;
}

async function getUserRows(filters = {}) {
  const pool = await getPool();
  const request = pool.request();
  const where = ['1=1'];

  if (filters.roleId) {
    request.input('RoleId', sql.Int, filters.roleId);
    where.push('ur.RoleId = @RoleId');
  }

  if (filters.status) {
    request.input('Status', sql.NVarChar(20), filters.status);
    where.push('u.Status = @Status');
  }

  if (filters.fromDate) {
    request.input('FromDate', sql.DateTime, new Date(filters.fromDate));
    where.push('u.CreatedAt >= @FromDate');
  }

  if (filters.toDate) {
    request.input('ToDate', sql.DateTime, new Date(filters.toDate));
    where.push('u.CreatedAt <= @ToDate');
  }

  if (filters.membershipStatus) {
    request.input('MembershipStatus', sql.NVarChar(20), filters.membershipStatus);
    where.push('m.Status = @MembershipStatus');
  }

  const result = await request.query(`
    SELECT
      u.UserId,
      u.Status AS UserStatus,
      u.CreatedAt,
      ur.RoleId,
      r.RoleName,
      m.Status AS MemberStatus
    FROM Users u
    LEFT JOIN UserRoles ur ON u.UserId = ur.UserId
    LEFT JOIN Roles r ON ur.RoleId = r.RoleId
    LEFT JOIN Members m ON u.UserId = m.UserId
    WHERE ${where.join(' AND ')}
    ORDER BY u.UserId
  `);

  return result.recordset;
}

async function getBorrowingReport(filters = {}) {
  const rows = await getBorrowRows(filters);
  const detailRows = rows.filter((row) => row.BorrowDetailId);
  const requestRows = rows.filter((row) => row.RequestId);
  const now = new Date();

  const borrowCountByPeriod = {};
  const topBorrowedBooks = {};

  for (const row of detailRows) {
    const periodKey = toDateKey(row.BorrowDate || row.RequestDate);

    if (periodKey) {
      borrowCountByPeriod[periodKey] = (borrowCountByPeriod[periodKey] || 0) + 1;
    }

    if (row.BookId) {
      topBorrowedBooks[row.BookId] = topBorrowedBooks[row.BookId] || {
        bookId: row.BookId,
        title: row.Title || null,
        borrowCount: 0,
      };
      if (row.DetailStatus === 'BORROWED' || row.DetailStatus === 'RETURNED' || row.DetailStatus === 'OVERDUE') {
        topBorrowedBooks[row.BookId].borrowCount += 1;
      }
    }
  }

  const detailCountByStatus = groupCount(detailRows, (row) => row.DetailStatus);
  const requestCountByStatus = groupCount(requestRows, (row) => row.RequestStatus);

  const activeLoans = detailRows.filter((row) => row.DetailStatus === 'BORROWED').length;
  const overdueLoans = detailRows.filter(
    (row) =>
      row.DetailStatus === 'OVERDUE' ||
      (row.DetailStatus === 'BORROWED' && row.DueDate && new Date(row.DueDate) < now)
  ).length;

  return {
    totals: {
      requests: new Set(requestRows.map((row) => row.RequestId)).size,
      details: detailRows.length,
      activeLoans,
      overdueLoans,
    },
    requestStatusCounts: requestCountByStatus,
    detailStatusCounts: detailCountByStatus,
    borrowCountByPeriod,
    topBorrowedBooks: Object.values(topBorrowedBooks)
      .sort((left, right) => right.borrowCount - left.borrowCount)
      .slice(0, 5),
  };
}

async function getInventoryReport(filters = {}) {
  const rows = await getInventoryRows(filters);
  const booksById = new Map();
  const copies = rows.filter((row) => row.CopyId);

  for (const row of rows) {
    if (!booksById.has(row.BookId)) {
      booksById.set(row.BookId, {
        bookId: row.BookId,
        title: row.Title || null,
        categoryId: row.CategoryId,
        categoryName: row.CategoryName || null,
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

  const copyStatusCounts = groupCount(copies, (row) => row.CopyStatus);
  const categoryCounts = groupCount(rows, (row) => row.CategoryName);
  const lowAvailabilityBooks = Array.from(booksById.values()).filter((book) => {
    const availableCount = book.copies.filter((copy) => copy.status === 'AVAILABLE').length;
    return book.copies.length > 0 && availableCount <= 0;
  });

  return {
    totals: {
      books: booksById.size,
      copies: copies.length,
    },
    copyStatusCounts,
    categoryCounts,
    lowAvailabilityBooks,
  };
}

async function getUserStatistics(filters = {}) {
  const rows = await getUserRows(filters);
  const usersById = new Map();

  for (const row of rows) {
    if (!usersById.has(row.UserId)) {
      usersById.set(row.UserId, {
        userId: row.UserId,
        status: row.UserStatus,
        createdAt: row.CreatedAt,
        roles: new Set(),
        memberStatus: row.MemberStatus || null,
      });
    }

    if (row.RoleName) {
      usersById.get(row.UserId).roles.add(row.RoleName);
    }
  }

  const users = Array.from(usersById.values());
  const usersByStatus = groupCount(users, (user) => user.status);
  const membersByStatus = groupCount(users.filter((user) => user.memberStatus), (user) => user.memberStatus);
  const usersByRole = {};

  for (const user of users) {
    for (const role of user.roles) {
      usersByRole[role] = (usersByRole[role] || 0) + 1;
    }
  }

  const newMembersByPeriod = {};
  for (const user of users.filter((item) => item.memberStatus === 'APPROVED')) {
    const periodKey = toDateKey(user.createdAt);

    if (periodKey) {
      newMembersByPeriod[periodKey] = (newMembersByPeriod[periodKey] || 0) + 1;
    }
  }

  return {
    totals: {
      users: users.length,
      members: users.filter((user) => user.memberStatus === 'APPROVED').length,
    },
    usersByStatus,
    usersByRole,
    membersByStatus,
    newMembersByPeriod,
  };
}

module.exports = {
  getBorrowingReport,
  getInventoryReport,
  getUserStatistics,
};
