const { getPool, sql } = require('../config/db');

function escapeLikePattern(value) {
  return String(value || '').replace(/[\\%_[\]]/g, (match) => `\\${match}`);
}

function bindSearch(request, query) {
  if (!query) return '';
  request.input('search', sql.NVarChar(120), escapeLikePattern(query));
  return " LIKE '%' + @search + '%' ESCAPE '\\'";
}

async function getDashboard() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT
      (SELECT COUNT(*) FROM Books WHERE Status = 'ACTIVE') AS totalBooks,
      (SELECT COUNT(*) FROM Members WHERE Status = 'APPROVED') AS totalMembers,
      (SELECT COUNT(*) FROM Authors) AS totalAuthors,
      (SELECT COUNT(*) FROM BorrowDetails WHERE Status = 'BORROWED') AS totalBorrowed,
      (SELECT COUNT(*) FROM BorrowDetails WHERE Status = 'BORROWED' AND DueDate < CAST(GETDATE() AS DATE)) AS overdueBorrowed;
  `);

  const [mostBorrowed, overdue, returnedToday] = await Promise.all([
    pool.request().query(`
      SELECT TOP 10
        b.BookId AS id,
        b.Title AS label,
        COUNT(bd.BorrowDetailId) AS value
      FROM Books b
      LEFT JOIN BookCopies bc ON b.BookId = bc.BookId
      LEFT JOIN BorrowDetails bd ON bc.CopyId = bd.CopyId
      GROUP BY b.BookId, b.Title
      ORDER BY value DESC, b.Title ASC;
    `),
    pool.request().query(`
      SELECT TOP 10
        b.BookId AS id,
        b.Title AS label,
        COUNT(bd.BorrowDetailId) AS value
      FROM BorrowDetails bd
      INNER JOIN BookCopies bc ON bd.CopyId = bc.CopyId
      INNER JOIN Books b ON bc.BookId = b.BookId
      WHERE bd.Status = 'BORROWED' AND bd.DueDate < CAST(GETDATE() AS DATE)
      GROUP BY b.BookId, b.Title
      ORDER BY value DESC, b.Title ASC;
    `),
    pool.request().query(`
      SELECT TOP 10
        b.BookId AS id,
        b.Title AS label,
        COUNT(bd.BorrowDetailId) AS value
      FROM BorrowDetails bd
      INNER JOIN BookCopies bc ON bd.CopyId = bc.CopyId
      INNER JOIN Books b ON bc.BookId = b.BookId
      WHERE bd.ReturnDate = CAST(GETDATE() AS DATE)
      GROUP BY b.BookId, b.Title
      ORDER BY value DESC, b.Title ASC;
    `),
  ]);
  const fallbackBooks = await pool.request().query(`
    SELECT TOP 10 BookId AS id, Title AS label, 0 AS value
    FROM Books
    WHERE Status = 'ACTIVE'
    ORDER BY BookId ASC;
  `);
  const fillSeries = (rows) => {
    if (rows.length >= 3) return rows;
    const seen = new Set(rows.map((row) => row.id));
    return [
      ...rows,
      ...fallbackBooks.recordset.filter((row) => !seen.has(row.id)).slice(0, 10 - rows.length),
    ];
  };

  return {
    summary: result.recordset[0] || {},
    charts: {
      mostBorrowed: fillSeries(mostBorrowed.recordset),
      overdue: fillSeries(overdue.recordset),
      returnedToday: fillSeries(returnedToday.recordset),
    },
  };
}

async function listBooks(filters = {}) {
  const pool = await getPool();
  const request = pool.request();
  const where = ['1 = 1'];

  if (filters.q) {
    bindSearch(request, filters.q);
    where.push(`(
      b.Title LIKE '%' + @search + '%' ESCAPE '\\'
      OR b.ISBN LIKE '%' + @search + '%' ESCAPE '\\'
      OR a.AuthorName LIKE '%' + @search + '%' ESCAPE '\\'
      OR c.CategoryName LIKE '%' + @search + '%' ESCAPE '\\'
      OR p.PublisherName LIKE '%' + @search + '%' ESCAPE '\\'
    )`);
  }

  if (filters.status) {
    request.input('status', sql.NVarChar(20), filters.status);
    where.push('b.Status = @status');
  }

  const result = await request.query(`
    SELECT
      b.BookId AS id,
      b.Title AS title,
      b.ISBN AS isbn,
      c.CategoryName AS category,
      a.AuthorName AS author,
      p.PublisherName AS publisher,
      b.PublishYear AS publishYear,
      b.Pages AS pages,
      b.Status AS status,
      COUNT(bc.CopyId) AS totalCopies,
      SUM(CASE WHEN bc.Status = 'AVAILABLE' THEN 1 ELSE 0 END) AS availableCopies
    FROM Books b
    LEFT JOIN Authors a ON b.AuthorId = a.AuthorId
    LEFT JOIN Categories c ON b.CategoryId = c.CategoryId
    LEFT JOIN Publishers p ON b.PublisherId = p.PublisherId
    LEFT JOIN BookCopies bc ON b.BookId = bc.BookId
    WHERE ${where.join(' AND ')}
    GROUP BY b.BookId, b.Title, b.ISBN, c.CategoryName, a.AuthorName, p.PublisherName, b.PublishYear, b.Pages, b.Status
    ORDER BY b.BookId ASC;
  `);

  return result.recordset;
}

const resourceMap = {
  authors: { table: 'Authors', id: 'AuthorId', name: 'AuthorName', alias: 'author' },
  publishers: { table: 'Publishers', id: 'PublisherId', name: 'PublisherName', alias: 'publisher' },
  categories: { table: 'Categories', id: 'CategoryId', name: 'CategoryName', alias: 'category' },
};

function getResourceConfig(resource) {
  return resourceMap[String(resource || '').toLowerCase()] || null;
}

async function listResource(resource, filters = {}) {
  const config = getResourceConfig(resource);
  const pool = await getPool();
  const request = pool.request();
  const where = ['1 = 1'];

  if (filters.q) {
    bindSearch(request, filters.q);
    where.push(`${config.name} LIKE '%' + @search + '%' ESCAPE '\\'`);
  }

  const result = await request.query(`
    SELECT
      ${config.id} AS id,
      ${config.name} AS name,
      Status AS status,
      CreatedAt AS createdAt
    FROM ${config.table}
    WHERE ${where.join(' AND ')}
    ORDER BY ${config.id} ASC;
  `);

  return result.recordset;
}

async function createResource(resource, name) {
  const config = getResourceConfig(resource);
  const pool = await getPool();
  const result = await pool.request()
    .input('name', sql.NVarChar(100), name)
    .query(`
      INSERT INTO ${config.table} (${config.name})
      OUTPUT INSERTED.${config.id} AS id, INSERTED.${config.name} AS name,
             INSERTED.Status AS status, INSERTED.CreatedAt AS createdAt
      VALUES (@name);
    `);

  return result.recordset[0];
}

async function updateResource(resource, id, name) {
  const config = getResourceConfig(resource);
  const pool = await getPool();
  await pool.request()
    .input('id', sql.Int, id)
    .input('name', sql.NVarChar(100), name)
    .query(`
      UPDATE ${config.table}
      SET ${config.name} = @name
      WHERE ${config.id} = @id;
    `);

  return { id, name };
}

async function deactivateResource(resource, id) {
  const config = getResourceConfig(resource);
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      UPDATE ${config.table}
      SET Status = 'INACTIVE'
      WHERE ${config.id} = @id AND Status = 'ACTIVE';
      SELECT @@ROWCOUNT AS affectedRows;
    `);

  return result.recordset[0]?.affectedRows || 0;
}

async function listBorrowings(filters = {}) {
  const pool = await getPool();
  const request = pool.request();
  const where = ['1 = 1'];

  if (filters.q) {
    bindSearch(request, filters.q);
    where.push(`(
      b.Title LIKE '%' + @search + '%' ESCAPE '\\'
      OR u.Email LIKE '%' + @search + '%' ESCAPE '\\'
      OR up.FullName LIKE '%' + @search + '%' ESCAPE '\\'
      OR bc.Barcode LIKE '%' + @search + '%' ESCAPE '\\'
    )`);
  }

  if (filters.status) {
    if (filters.status === 'OVERDUE') {
      where.push("bd.Status = 'BORROWED' AND bd.DueDate < CAST(GETDATE() AS DATE)");
    } else {
      request.input('status', sql.NVarChar(20), filters.status);
      where.push('bd.Status = @status');
    }
  }

  const result = await request.query(`
    SELECT
      bd.BorrowDetailId AS id,
      br.RequestId AS requestId,
      u.UserId AS userId,
      COALESCE(up.FullName, u.Email) AS memberName,
      u.Email AS email,
      b.Title AS bookTitle,
      bc.CopyId AS copyId,
      bc.Barcode AS barcode,
      bd.BorrowDate AS borrowDate,
      bd.DueDate AS dueDate,
      bd.ReturnDate AS returnDate,
      CASE
        WHEN bd.Status = 'BORROWED' AND bd.DueDate < CAST(GETDATE() AS DATE) THEN 'OVERDUE'
        ELSE bd.Status
      END AS status,
      bd.RenewalCount AS renewalCount
    FROM BorrowDetails bd
    INNER JOIN BorrowRequests br ON bd.RequestId = br.RequestId
    INNER JOIN Users u ON br.UserId = u.UserId
    LEFT JOIN UserProfiles up ON u.UserId = up.UserId
    INNER JOIN BookCopies bc ON bd.CopyId = bc.CopyId
    INNER JOIN Books b ON bc.BookId = b.BookId
    WHERE ${where.join(' AND ')}
    ORDER BY bd.BorrowDetailId ASC;
  `);

  return result.recordset;
}

async function listRequests(filters = {}) {
  const pool = await getPool();
  const request = pool.request();
  const where = ['1 = 1'];

  if (filters.q) {
    request.input('Search', sql.NVarChar(202), `%${escapeLikePattern(filters.q)}%`);
    where.push(`(
      b.Title LIKE @Search ESCAPE '\\'
      OR u.Email LIKE @Search ESCAPE '\\'
      OR up.FullName LIKE @Search ESCAPE '\\'
    )`);
  }

  if (filters.status) {
    request.input('Status', sql.NVarChar(20), filters.status);
    where.push('br.Status = @Status');
  }

  if (filters.from) {
    request.input('From', sql.Date, filters.from);
    where.push('br.RequestDate >= @From');
  }

  if (filters.to) {
    const toExclusive = new Date(`${filters.to}T00:00:00.000Z`);
    toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);
    request.input('ToExclusive', sql.Date, toExclusive);
    where.push('br.RequestDate < @ToExclusive');
  }

  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 20);
  request
    .input('Offset', sql.Int, (page - 1) * limit)
    .input('Limit', sql.Int, limit);

  const result = await request.query(`
    SELECT DISTINCT br.RequestId
    INTO #FilteredRequests
    FROM BorrowRequests br
    INNER JOIN Users u ON br.UserId = u.UserId
    LEFT JOIN UserProfiles up ON u.UserId = up.UserId
    LEFT JOIN BorrowDetails bd ON br.RequestId = bd.RequestId
    LEFT JOIN BookCopies bc ON bd.CopyId = bc.CopyId
    LEFT JOIN Books b ON bc.BookId = b.BookId
    WHERE ${where.join(' AND ')};

    SELECT COUNT(*) AS total FROM #FilteredRequests;

    WITH PagedRequests AS (
      SELECT
        br.RequestId,
        br.RequestDate,
        br.Status,
        u.UserId,
        COALESCE(up.FullName, u.Email) AS FullName,
        u.Email,
        u.Phone AS PhoneNumber
      FROM BorrowRequests br
      INNER JOIN #FilteredRequests filtered ON filtered.RequestId = br.RequestId
      INNER JOIN Users u ON br.UserId = u.UserId
      LEFT JOIN UserProfiles up ON u.UserId = up.UserId
      ORDER BY br.RequestDate DESC, br.RequestId DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
    )
    SELECT
      pr.RequestId,
      pr.RequestDate,
      pr.Status AS RequestStatus,
      pr.UserId,
      pr.FullName,
      pr.Email,
      pr.PhoneNumber,
      bd.BorrowDetailId,
      b.Title,
      c.CategoryName
    FROM PagedRequests pr
    LEFT JOIN BorrowDetails bd ON pr.RequestId = bd.RequestId
    LEFT JOIN BookCopies bc ON bd.CopyId = bc.CopyId
    LEFT JOIN Books b ON bc.BookId = b.BookId
    LEFT JOIN Categories c ON b.CategoryId = c.CategoryId
    ORDER BY pr.RequestDate DESC, pr.RequestId DESC, bd.BorrowDetailId ASC;
  `);

  const rowsByRequestId = new Map();
  for (const row of result.recordsets?.[1] || []) {
    if (!rowsByRequestId.has(row.RequestId)) {
      rowsByRequestId.set(row.RequestId, {
        requestId: row.RequestId,
        requestDate: row.RequestDate,
        status: row.RequestStatus,
        memberUserId: row.UserId,
        memberName: row.FullName,
        memberEmail: row.Email,
        memberPhoneNumber: row.PhoneNumber || null,
        itemCount: 0,
        bookTitles: [],
        categories: [],
      });
    }
    const requestRow = rowsByRequestId.get(row.RequestId);
    if (row.BorrowDetailId) requestRow.itemCount += 1;
    if (row.Title !== null && row.Title !== undefined) requestRow.bookTitles.push(row.Title);
    if (
      row.CategoryName !== null
      && row.CategoryName !== undefined
      && !requestRow.categories.includes(row.CategoryName)
    ) {
      requestRow.categories.push(row.CategoryName);
    }
  }

  return {
    rows: [...rowsByRequestId.values()],
    total: Number(result.recordsets?.[0]?.[0]?.total || 0),
  };
}

module.exports = {
  getDashboard,
  listBooks,
  getResourceConfig,
  listResource,
  createResource,
  updateResource,
  deactivateResource,
  listBorrowings,
  listRequests,
};
