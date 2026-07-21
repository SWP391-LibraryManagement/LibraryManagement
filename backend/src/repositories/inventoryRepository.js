const { sql, getPool } = require('../config/db');
const AppException = require('../CustomException/AppException');

const copySelect = `
  SELECT
    bc.CopyId,
    bc.BookId,
    bc.Barcode,
    bc.Status AS CopyStatus,
    bc.Location,
    bc.Version AS CopyVersion,
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

function encodeVersion(value) {
  if (Buffer.isBuffer(value)) return value.toString('base64');
  return value === undefined || value === null ? null : String(value);
}

function mapCopy(row) {
  if (!row) return null;
  return {
    copyId: row.CopyId,
    bookId: row.BookId,
    barcode: row.Barcode,
    status: row.CopyStatus,
    location: row.Location,
    version: encodeVersion(row.CopyVersion),
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
  if (!row) return null;
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

async function requestFor(transaction) {
  return transaction ? new sql.Request(transaction) : (await getPool()).request();
}

async function withTransaction(callback) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (_rollbackError) {
      // Preserve the original mutation error.
    }
    throw error;
  }
}

async function findBookById(bookId, transaction) {
  const request = await requestFor(transaction);
  const result = await request
    .input('BookId', sql.Int, bookId)
    .query(`
      SELECT b.BookId, b.Title, b.ISBN, b.PublishYear, b.Status AS BookStatus,
             a.AuthorName, c.CategoryName, p.PublisherName
      FROM Books b
      LEFT JOIN Authors a ON b.AuthorId = a.AuthorId
      LEFT JOIN Categories c ON b.CategoryId = c.CategoryId
      LEFT JOIN Publishers p ON b.PublisherId = p.PublisherId
      WHERE b.BookId = @BookId
    `);
  return mapBook(result.recordset[0]);
}

async function findCopyById(copyId, transaction) {
  const request = await requestFor(transaction);
  const result = await request
    .input('CopyId', sql.Int, copyId)
    .query(`${copySelect} WHERE bc.CopyId = @CopyId`);
  return mapCopy(result.recordset[0]);
}

async function findCopyByBarcode(barcode, transaction) {
  const request = await requestFor(transaction);
  const result = await request
    .input('Barcode', sql.NVarChar(100), barcode)
    .query(`${copySelect} WHERE bc.Barcode = @Barcode`);
  return mapCopy(result.recordset[0]);
}

function addFilterInputs(request, filters = {}) {
  const clauses = ['1 = 1'];
  if (filters.q) {
    request.input('Search', sql.NVarChar(202), `%${filters.q}%`);
    clauses.push(`(
      b.Title LIKE @Search
      OR b.ISBN LIKE @Search
      OR a.AuthorName LIKE @Search
      OR c.CategoryName LIKE @Search
      OR bc.Barcode LIKE @Search
      OR bc.Location LIKE @Search
      OR CONVERT(NVARCHAR(20), bc.CopyId) LIKE @Search
      OR CONVERT(NVARCHAR(20), bc.BookId) LIKE @Search
    )`);
  }
  if (filters.bookId) {
    request.input('BookId', sql.Int, filters.bookId);
    clauses.push('bc.BookId = @BookId');
  }
  if (filters.status) {
    request.input('Status', sql.NVarChar(20), filters.status);
    clauses.push('bc.Status = @Status');
  }
  if (filters.barcode) {
    request.input('Barcode', sql.NVarChar(100), `%${filters.barcode}%`);
    clauses.push('bc.Barcode LIKE @Barcode');
  }
  if (filters.location) {
    request.input('Location', sql.NVarChar(100), `%${filters.location}%`);
    clauses.push('bc.Location LIKE @Location');
  }
  return clauses.join(' AND ');
}

async function listInventory(filters = {}) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const request = await requestFor();
  const whereClause = addFilterInputs(request, filters);
  request.input('Offset', sql.Int, (page - 1) * limit).input('Limit', sql.Int, limit);
  const result = await request.query(`
    ${copySelect}
    WHERE ${whereClause}
    ORDER BY b.Title ASC, bc.CopyId ASC
    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
    SELECT COUNT_BIG(*) AS Total
    FROM BookCopies bc
    INNER JOIN Books b ON bc.BookId = b.BookId
    LEFT JOIN Authors a ON b.AuthorId = a.AuthorId
    LEFT JOIN Categories c ON b.CategoryId = c.CategoryId
    WHERE ${whereClause};
  `);
  return {
    copies: result.recordsets[0].map(mapCopy),
    pagination: { page, limit, total: Number(result.recordsets[1]?.[0]?.Total || 0) },
  };
}

async function countInventoryByStatus(filters = {}) {
  const request = await requestFor();
  const whereClause = addFilterInputs(request, filters);
  const result = await request.query(`
    SELECT bc.Status, COUNT_BIG(*) AS Total
    FROM BookCopies bc
    INNER JOIN Books b ON bc.BookId = b.BookId
    LEFT JOIN Authors a ON b.AuthorId = a.AuthorId
    LEFT JOIN Categories c ON b.CategoryId = c.CategoryId
    WHERE ${whereClause}
    GROUP BY bc.Status
  `);
  return result.recordset.reduce((counts, row) => {
    counts[row.Status] = Number(row.Total || 0);
    return counts;
  }, {});
}

async function createCopy({ bookId, barcode, status, location }, transaction) {
  const parentResult = await (await requestFor(transaction))
    .input('BookId', sql.Int, bookId)
    .query(`
      SELECT BookId, Status
      FROM Books WITH (UPDLOCK, HOLDLOCK)
      WHERE BookId = @BookId
    `);
  const parent = parentResult.recordset[0];
  if (!parent) throw new AppException(404, 'BOOK_NOT_FOUND', 'Book was not found.');
  if (status === 'AVAILABLE' && parent.Status !== 'ACTIVE') {
    throw new AppException(409, 'INACTIVE_PARENT_BOOK', 'A copy cannot be made available under an inactive book.');
  }

  const request = await requestFor(transaction);
  const result = await request
    .input('BookId', sql.Int, bookId)
    .input('Barcode', sql.NVarChar(100), barcode)
    .input('Status', sql.NVarChar(20), status)
    .input('Location', sql.NVarChar(100), location)
    .query(`
      INSERT INTO BookCopies (BookId, Barcode, Status, Location)
      OUTPUT INSERTED.CopyId
      VALUES (@BookId, @Barcode, @Status, @Location)
    `);
  return findCopyById(result.recordset[0].CopyId, transaction);
}

async function lockCopyForMutation(copyId, expectedVersion, transaction) {
  const request = await requestFor(transaction);
  const result = await request
    .input('CopyId', sql.Int, copyId)
    .input('ExpectedVersion', sql.NVarChar(512), expectedVersion)
    .query(`
      SELECT TOP 1 bc.CopyId, bc.BookId, bc.Barcode, bc.Status AS CopyStatus,
                   bc.Location, bc.Version AS RowVersion, b.Status AS BookStatus
      FROM BookCopies bc WITH (UPDLOCK, HOLDLOCK)
      INNER JOIN Books b WITH (UPDLOCK, HOLDLOCK) ON b.BookId = bc.BookId
      WHERE bc.CopyId = @CopyId;
      SELECT TOP 1 BorrowDetailId
      FROM BorrowDetails WITH (UPDLOCK, HOLDLOCK)
      WHERE CopyId = @CopyId AND Status IN ('BORROWED', 'OVERDUE');
      SELECT TOP 1 ReservationId
      FROM Reservations WITH (UPDLOCK, HOLDLOCK)
      WHERE CopyId = @CopyId AND Status = 'ACTIVE';
    `);
  const row = result.recordsets[0]?.[0];
  if (!row) throw new AppException(404, 'COPY_NOT_FOUND', 'Book copy was not found.');
  if (encodeVersion(row.RowVersion) !== expectedVersion) {
    throw new AppException(409, 'STALE_COPY_STATE', 'Copy version is missing or stale. Reload before retrying.');
  }
  return { row, borrow: result.recordsets[1]?.[0], reservation: result.recordsets[2]?.[0] };
}

async function updateCopy(copyId, patch = {}, expectedVersion, transaction) {
  const locked = await lockCopyForMutation(copyId, expectedVersion, transaction);
  const request = await requestFor(transaction);
  await request
    .input('CopyId', sql.Int, copyId)
    .input('Barcode', sql.NVarChar(100), patch.barcode ?? locked.row.Barcode)
    .input('Location', sql.NVarChar(100), patch.location ?? locked.row.Location)
    .query(`
      UPDATE BookCopies
      SET Barcode = @Barcode, Location = @Location, UpdatedAt = GETDATE()
      WHERE CopyId = @CopyId
    `);
  return findCopyById(copyId, transaction);
}

async function updateCopyStatus(copyId, status, expectedVersion, transaction) {
  const locked = await lockCopyForMutation(copyId, expectedVersion, transaction);
  if (locked.row.CopyStatus === 'BORROWED' || locked.borrow) {
    throw new AppException(409, 'ACTIVE_BORROW_CONFLICT', 'Borrowed copies must be handled through the return flow.');
  }
  if (locked.row.CopyStatus === 'RESERVED' || locked.reservation) {
    throw new AppException(409, 'RESERVATION_STATE_CONFLICT', 'Reserved copies must be handled through the reservation flow.');
  }
  if (status === 'AVAILABLE' && locked.row.BookStatus !== 'ACTIVE') {
    throw new AppException(409, 'INACTIVE_PARENT_BOOK', 'A copy cannot be made available under an inactive book.');
  }
  const request = await requestFor(transaction);
  await request
    .input('CopyId', sql.Int, copyId)
    .input('Status', sql.NVarChar(20), status)
    .query(`
      UPDATE BookCopies
      SET Status = @Status, UpdatedAt = GETDATE()
      WHERE CopyId = @CopyId
    `);
  return findCopyById(copyId, transaction);
}

async function hasActiveBorrow(copyId, transaction) {
  const request = await requestFor(transaction);
  const result = await request
    .input('CopyId', sql.Int, copyId)
    .query(`
      SELECT TOP 1 BorrowDetailId
      FROM BorrowDetails
      WHERE CopyId = @CopyId AND Status IN ('BORROWED', 'OVERDUE')
    `);
  return result.recordset.length > 0;
}

async function hasActiveReservation(copyId, transaction) {
  const request = await requestFor(transaction);
  const result = await request
    .input('CopyId', sql.Int, copyId)
    .query(`
      SELECT TOP 1 ReservationId
      FROM Reservations
      WHERE CopyId = @CopyId AND Status = 'ACTIVE'
    `);
  return result.recordset.length > 0;
}

module.exports = {
  findBookById,
  findCopyById,
  findCopyByBarcode,
  listInventory,
  countInventoryByStatus,
  withTransaction,
  createCopy,
  updateCopy,
  updateCopyStatus,
  hasActiveBorrow,
  hasActiveReservation,
};
