const { sql, getPool } = require('../config/db');

const copySelect = `
  SELECT
    bc.CopyId,
    bc.BookId,
    bc.Barcode,
    bc.Status AS CopyStatus,
    bc.Location,
    bc.CreatedAt AS CopyCreatedAt,
    bc.UpdatedAt AS CopyUpdatedAt,
    b.Title,
    b.ISBN,
    b.PublishYear,
    b.Status AS BookStatus,
    a.AuthorName,
    c.CategoryName,
    p.PublisherName
  FROM BookCopies bc
  INNER JOIN Books b ON bc.BookId = b.BookId
  LEFT JOIN Authors a ON b.AuthorId = a.AuthorId
  LEFT JOIN Categories c ON b.CategoryId = c.CategoryId
  LEFT JOIN Publishers p ON b.PublisherId = p.PublisherId
`;

function mapCopy(row) {
  if (!row) {
    return null;
  }

  return {
    copyId: row.CopyId,
    bookId: row.BookId,
    barcode: row.Barcode,
    status: row.CopyStatus,
    location: row.Location,
    createdAt: row.CopyCreatedAt,
    updatedAt: row.CopyUpdatedAt,
    book: {
      bookId: row.BookId,
      title: row.Title,
      isbn: row.ISBN,
      publishYear: row.PublishYear,
      status: row.BookStatus,
      authorName: row.AuthorName,
      categoryName: row.CategoryName,
      publisherName: row.PublisherName,
    },
  };
}

function mapBook(row) {
  if (!row) {
    return null;
  }

  return {
    bookId: row.BookId,
    title: row.Title,
    isbn: row.ISBN,
    publishYear: row.PublishYear,
    status: row.BookStatus || row.Status,
    authorName: row.AuthorName,
    categoryName: row.CategoryName,
    publisherName: row.PublisherName,
  };
}

async function findBookById(bookId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('BookId', sql.Int, bookId)
    .query(`
      SELECT
        b.BookId,
        b.Title,
        b.ISBN,
        b.PublishYear,
        b.Status AS BookStatus,
        a.AuthorName,
        c.CategoryName,
        p.PublisherName
      FROM Books b
      LEFT JOIN Authors a ON b.AuthorId = a.AuthorId
      LEFT JOIN Categories c ON b.CategoryId = c.CategoryId
      LEFT JOIN Publishers p ON b.PublisherId = p.PublisherId
      WHERE b.BookId = @BookId
    `);

  return mapBook(result.recordset[0]);
}

async function findCopyById(copyId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('CopyId', sql.Int, copyId)
    .query(`
      ${copySelect}
      WHERE bc.CopyId = @CopyId
    `);

  return mapCopy(result.recordset[0]);
}

async function findCopyByBarcode(barcode) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('Barcode', sql.NVarChar(100), barcode)
    .query(`
      ${copySelect}
      WHERE bc.Barcode = @Barcode
    `);

  return mapCopy(result.recordset[0]);
}

async function listInventory(filters = {}) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;
  const pool = await getPool();
  const request = pool.request();
  const where = ['1=1'];

  if (filters.bookId) {
    request.input('BookId', sql.Int, filters.bookId);
    where.push('bc.BookId = @BookId');
  }

  if (filters.status) {
    request.input('Status', sql.NVarChar(20), filters.status);
    where.push('bc.Status = @Status');
  }

  if (filters.barcode) {
    request.input('Barcode', sql.NVarChar(100), `%${filters.barcode}%`);
    where.push('bc.Barcode LIKE @Barcode');
  }

  if (filters.location) {
    request.input('Location', sql.NVarChar(100), `%${filters.location}%`);
    where.push('bc.Location LIKE @Location');
  }

  request.input('Offset', sql.Int, offset);
  request.input('Limit', sql.Int, limit);

  const whereClause = where.join(' AND ');
  const [rowsResult, totalResult] = await Promise.all([
    request.query(`
      ${copySelect}
      WHERE ${whereClause}
      ORDER BY b.Title ASC, bc.CopyId ASC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
    `),
    pool.request()
      .input('BookId', sql.Int, filters.bookId || null)
      .input('Status', sql.NVarChar(20), filters.status || null)
      .input('Barcode', sql.NVarChar(100), filters.barcode ? `%${filters.barcode}%` : null)
      .input('Location', sql.NVarChar(100), filters.location ? `%${filters.location}%` : null)
      .query(`
        SELECT COUNT(*) AS Total
        FROM BookCopies bc
        WHERE (@BookId IS NULL OR bc.BookId = @BookId)
          AND (@Status IS NULL OR bc.Status = @Status)
          AND (@Barcode IS NULL OR bc.Barcode LIKE @Barcode)
          AND (@Location IS NULL OR bc.Location LIKE @Location)
      `),
  ]);

  return {
    copies: rowsResult.recordset.map(mapCopy),
    pagination: {
      page,
      limit,
      total: totalResult.recordset[0]?.Total || 0,
    },
  };
}

async function createCopy({ bookId, barcode, status, location }) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('BookId', sql.Int, bookId)
    .input('Barcode', sql.NVarChar(100), barcode)
    .input('Status', sql.NVarChar(20), status)
    .input('Location', sql.NVarChar(100), location)
    .query(`
      INSERT INTO BookCopies (BookId, Barcode, Status, Location)
      OUTPUT INSERTED.CopyId
      VALUES (@BookId, @Barcode, @Status, @Location)
    `);

  return findCopyById(result.recordset[0].CopyId);
}

async function updateCopy(copyId, patch = {}) {
  const current = await findCopyById(copyId);

  if (!current) {
    return null;
  }

  const pool = await getPool();
  await pool
    .request()
    .input('CopyId', sql.Int, copyId)
    .input('Barcode', sql.NVarChar(100), patch.barcode ?? current.barcode)
    .input('Status', sql.NVarChar(20), patch.status ?? current.status)
    .input('Location', sql.NVarChar(100), patch.location ?? current.location)
    .query(`
      UPDATE BookCopies
      SET Barcode = @Barcode,
          Status = @Status,
          Location = @Location,
          UpdatedAt = GETDATE()
      WHERE CopyId = @CopyId
    `);

  return findCopyById(copyId);
}

async function updateCopyStatus(copyId, status) {
  const pool = await getPool();
  await pool
    .request()
    .input('CopyId', sql.Int, copyId)
    .input('Status', sql.NVarChar(20), status)
    .query(`
      UPDATE BookCopies
      SET Status = @Status,
          UpdatedAt = GETDATE()
      WHERE CopyId = @CopyId
    `);

  return findCopyById(copyId);
}

async function hasActiveBorrow(copyId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('CopyId', sql.Int, copyId)
    .query(`
      SELECT TOP 1 BorrowDetailId
      FROM BorrowDetails
      WHERE CopyId = @CopyId
        AND Status IN ('BORROWED', 'OVERDUE')
    `);

  return result.recordset.length > 0;
}

async function hasActiveReservation(copyId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('CopyId', sql.Int, copyId)
    .query(`
      SELECT TOP 1 ReservationId
      FROM Reservations
      WHERE CopyId = @CopyId
        AND Status = 'ACTIVE'
    `);

  return result.recordset.length > 0;
}

module.exports = {
  findBookById,
  findCopyById,
  findCopyByBarcode,
  listInventory,
  createCopy,
  updateCopy,
  updateCopyStatus,
  hasActiveBorrow,
  hasActiveReservation,
};
