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
      (SELECT COUNT(*) FROM BorrowDetails WHERE Status IN ('BORROWED', 'OVERDUE')) AS totalBorrowed,
      (SELECT COUNT(*) FROM BorrowDetails WHERE Status IN ('BORROWED', 'OVERDUE') AND DueDate < CAST(GETDATE() AS DATE)) AS overdueBorrowed;
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
      WHERE bd.Status IN ('BORROWED', 'OVERDUE') AND bd.DueDate < CAST(GETDATE() AS DATE)
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
      'ACTIVE' AS status,
      N'Không lưu trong DB' AS createdAt
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
      OUTPUT INSERTED.${config.id} AS id, INSERTED.${config.name} AS name
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

async function deleteResource(resource, id) {
  const config = getResourceConfig(resource);
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      DELETE FROM ${config.table}
      WHERE ${config.id} = @id;
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
    request.input('status', sql.NVarChar(20), filters.status);
    where.push('bd.Status = @status');
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
      bd.Status AS status,
      bd.RenewalCount AS renewalCount
    FROM BorrowDetails bd
    INNER JOIN BorrowRequests br ON bd.RequestId = br.RequestId
    INNER JOIN Users u ON br.UserId = u.UserId
    LEFT JOIN UserProfiles up ON u.UserId = up.UserId
    INNER JOIN BookCopies bc ON bd.CopyId = bc.CopyId
    INNER JOIN Books b ON bc.BookId = b.BookId
    WHERE ${where.join(' AND ')}
    ORDER BY bd.BorrowDetailId DESC;
  `);

  return result.recordset;
}

async function createBorrowing(payload = {}) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const requestResult = await new sql.Request(transaction)
      .input('userId', sql.Int, payload.userId)
      .query(`
        INSERT INTO BorrowRequests (UserId, Status, ApprovedAt, ProcessedAt)
        OUTPUT INSERTED.RequestId AS requestId
        VALUES (@userId, 'APPROVED', GETDATE(), GETDATE());
      `);
    const requestId = requestResult.recordset[0].requestId;

    const detailResult = await new sql.Request(transaction)
      .input('requestId', sql.Int, requestId)
      .input('copyId', sql.Int, payload.copyId)
      .input('borrowDate', sql.Date, payload.borrowDate || null)
      .input('dueDate', sql.Date, payload.dueDate)
      .input('returnDate', sql.Date, payload.returnDate || null)
      .input('status', sql.NVarChar(20), payload.status)
      .query(`
        INSERT INTO BorrowDetails (RequestId, CopyId, BorrowDate, DueDate, ReturnDate, Status)
        OUTPUT INSERTED.BorrowDetailId AS id
        VALUES (@requestId, @copyId, @borrowDate, @dueDate, @returnDate, @status);
      `);

    if (payload.status === 'BORROWED' || payload.status === 'OVERDUE') {
      await new sql.Request(transaction)
        .input('copyId', sql.Int, payload.copyId)
        .query(`UPDATE BookCopies SET Status = 'BORROWED', UpdatedAt = GETDATE() WHERE CopyId = @copyId;`);
    }

    await transaction.commit();
    return { id: detailResult.recordset[0].id, requestId, ...payload };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function updateBorrowing(id, payload = {}) {
  const pool = await getPool();
  await pool.request()
    .input('id', sql.Int, id)
    .input('borrowDate', sql.Date, payload.borrowDate || null)
    .input('dueDate', sql.Date, payload.dueDate || null)
    .input('returnDate', sql.Date, payload.returnDate || null)
    .input('status', sql.NVarChar(20), payload.status)
    .query(`
      UPDATE BorrowDetails
      SET BorrowDate = @borrowDate,
          DueDate = @dueDate,
          ReturnDate = @returnDate,
          Status = @status,
          UpdatedAt = GETDATE()
      WHERE BorrowDetailId = @id;
    `);

  return { id, ...payload };
}

async function listRequests(filters = {}) {
  const pool = await getPool();
  const request = pool.request();
  const where = ['1 = 1'];

  if (filters.q) {
    bindSearch(request, filters.q);
    where.push(`(
      b.Title LIKE '%' + @search + '%' ESCAPE '\\'
      OR u.Email LIKE '%' + @search + '%' ESCAPE '\\'
      OR up.FullName LIKE '%' + @search + '%' ESCAPE '\\'
    )`);
  }

  if (filters.status) {
    request.input('status', sql.NVarChar(20), filters.status);
    where.push('br.Status = @status');
  }

  if (filters.fromDate) {
    request.input('fromDate', sql.Date, filters.fromDate);
    where.push('CAST(br.RequestDate AS DATE) >= @fromDate');
  }

  if (filters.toDate) {
    request.input('toDate', sql.Date, filters.toDate);
    where.push('CAST(br.RequestDate AS DATE) <= @toDate');
  }

  const result = await request.query(`
    SELECT
      br.RequestId AS id,
      br.RequestDate AS requestDate,
      br.Status AS status,
      u.UserId AS userId,
      COALESCE(up.FullName, u.Email) AS memberName,
      u.Email AS email,
      u.Phone AS phone,
      STRING_AGG(b.Title, ', ') AS bookTitles,
      STRING_AGG(c.CategoryName, ', ') AS categories,
      COUNT(bd.BorrowDetailId) AS itemCount
    FROM BorrowRequests br
    INNER JOIN Users u ON br.UserId = u.UserId
    LEFT JOIN UserProfiles up ON u.UserId = up.UserId
    LEFT JOIN BorrowDetails bd ON br.RequestId = bd.RequestId
    LEFT JOIN BookCopies bc ON bd.CopyId = bc.CopyId
    LEFT JOIN Books b ON bc.BookId = b.BookId
    LEFT JOIN Categories c ON b.CategoryId = c.CategoryId
    WHERE ${where.join(' AND ')}
    GROUP BY br.RequestId, br.RequestDate, br.Status, u.UserId, up.FullName, u.Email, u.Phone
    ORDER BY br.RequestDate DESC;
  `);

  return result.recordset;
}

async function updateRequestStatus(id, status) {
  const pool = await getPool();
  const request = pool.request()
    .input('id', sql.Int, id)
    .input('status', sql.NVarChar(20), status);
  const timestampColumn = status === 'COMPLETED'
    ? 'ProcessedAt'
    : status === 'REJECTED'
      ? 'RejectedAt'
      : status === 'APPROVED'
        ? 'ApprovedAt'
        : null;
  const timestampSql = timestampColumn ? `, ${timestampColumn} = GETDATE()` : '';

  const result = await request.query(`
    UPDATE BorrowRequests
    SET Status = @status,
        UpdatedAt = GETDATE()
        ${timestampSql}
    WHERE RequestId = @id
      AND Status = 'PENDING';

    SELECT @@ROWCOUNT AS affectedRows;
  `);

  return result.recordset[0]?.affectedRows || 0;
}

module.exports = {
  getDashboard,
  listBooks,
  getResourceConfig,
  listResource,
  createResource,
  updateResource,
  deleteResource,
  listBorrowings,
  createBorrowing,
  updateBorrowing,
  listRequests,
  updateRequestStatus,
};
