const { getPool, sql } = require('../config/db');

const SORT_COLUMNS = {
  title: 'b.Title',
  publishYear: 'b.PublishYear',
  createdAt: 'b.CreatedAt',
};

const REFERENCE_TABLES = {
  Categories: 'CategoryId',
  Authors: 'AuthorId',
  Publishers: 'PublisherId',
};

function escapeLikePattern(value) {
  return String(value).replace(/[\\%_[\]]/g, (match) => `\\${match}`);
}

function createRequest(transaction) {
  return transaction ? new sql.Request(transaction) : null;
}

function normalizeVersion(value) {
  return Buffer.isBuffer(value) ? value.toString('hex').toUpperCase() : value;
}

function mapBookRow(row) {
  if (!row) return null;
  return {
    ...row,
    version: normalizeVersion(row.version),
  };
}

function bindFilters(request, filters, { publicOnly = false } = {}) {
  const where = publicOnly ? ["b.Status = 'ACTIVE'"] : ['1 = 1'];

  if (filters.q) {
    request.input('Search', sql.NVarChar(202), `%${escapeLikePattern(filters.q)}%`);
    const searchPredicates = publicOnly
      ? [
        "b.Title LIKE @Search ESCAPE '\\'",
        "COALESCE(a.AuthorName, '') LIKE @Search ESCAPE '\\'",
      ]
      : [
        "b.Title LIKE @Search ESCAPE '\\'",
        "COALESCE(b.ISBN, '') LIKE @Search ESCAPE '\\'",
        "COALESCE(a.AuthorName, '') LIKE @Search ESCAPE '\\'",
        "COALESCE(c.CategoryName, '') LIKE @Search ESCAPE '\\'",
        "COALESCE(p.PublisherName, '') LIKE @Search ESCAPE '\\'",
      ];
    where.push(`(${searchPredicates.join('\n      OR ')})`);
  }
  if (filters.category) {
    request.input('CategoryName', sql.NVarChar(100), filters.category);
    where.push('c.CategoryName = @CategoryName');
  }
  for (const [field, column, parameter] of [
    ['categoryId', 'b.CategoryId', 'CategoryId'],
    ['authorId', 'b.AuthorId', 'AuthorId'],
    ['publisherId', 'b.PublisherId', 'PublisherId'],
  ]) {
    if (filters[field]) {
      request.input(parameter, sql.Int, filters[field]);
      where.push(`${column} = @${parameter}`);
    }
  }
  if (!publicOnly && filters.status) {
    request.input('Status', sql.NVarChar(20), filters.status);
    where.push('b.Status = @Status');
  }
  return where;
}

function listSelect() {
  return `
    b.BookId AS id,
    b.Title AS title,
    b.ISBN AS isbn,
    b.CategoryId AS categoryId,
    c.CategoryName AS category,
    b.AuthorId AS authorId,
    a.AuthorName AS author,
    b.PublisherId AS publisherId,
    p.PublisherName AS publisher,
    b.PublishYear AS year,
    b.Description AS description,
    b.CoverUrl AS cover,
    b.Rating AS rating,
    b.Pages AS pages,
    b.Status AS status,
    b.CreatedAt AS createdAt,
    b.UpdatedAt AS updatedAt,
    b.RowVersion AS version,
    COUNT(bc.CopyId) AS totalCopies,
    SUM(CASE WHEN bc.Status = 'AVAILABLE' THEN 1 ELSE 0 END) AS availableCopies,
    SUM(CASE WHEN bc.Status IN ('BORROWED', 'RESERVED') THEN 1 ELSE 0 END) AS lockedCopies,
    CASE
      WHEN b.Status = 'ACTIVE'
        AND SUM(CASE WHEN bc.Status = 'AVAILABLE' THEN 1 ELSE 0 END) > 0
      THEN 'AVAILABLE'
      ELSE 'UNAVAILABLE'
    END AS availabilityStatus
  `;
}

function groupBySql() {
  return `
    b.BookId, b.Title, b.ISBN, b.CategoryId, c.CategoryName,
    b.AuthorId, a.AuthorName, b.PublisherId, p.PublisherName,
    b.PublishYear, b.Description, b.CoverUrl, b.Rating, b.Pages,
    b.Status, b.CreatedAt, b.UpdatedAt, b.RowVersion
  `;
}

async function listBooks(filters, { publicOnly = false } = {}) {
  const pool = await getPool();
  const request = pool.request();
  const offset = (filters.page - 1) * filters.limit;
  const where = bindFilters(request, filters, { publicOnly });
  const sortColumn = SORT_COLUMNS[filters.sort];
  const order = filters.order === 'desc' ? 'DESC' : 'ASC';

  request.input('Offset', sql.Int, offset).input('Limit', sql.Int, filters.limit);
  const result = await request.query(`
    SELECT
      ${listSelect()},
      COUNT(*) OVER() AS totalRows
    FROM Books b
    LEFT JOIN Categories c ON b.CategoryId = c.CategoryId
    LEFT JOIN Authors a ON b.AuthorId = a.AuthorId
    LEFT JOIN Publishers p ON b.PublisherId = p.PublisherId
    LEFT JOIN BookCopies bc ON b.BookId = bc.BookId
    WHERE ${where.join('\n      AND ')}
    GROUP BY ${groupBySql()}
    ORDER BY ${sortColumn} ${order}, b.BookId ASC
    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
  `);

  return {
    rows: result.recordset.map(mapBookRow),
    total: Number(result.recordset[0]?.totalRows || 0),
  };
}

// @spec FR-FE01-002, FR-FE01-008, FR-FE01-009, FR-FE01-011, FR-FE01-013
function getHomeBooks(filters = {}) {
  return listBooks(filters, { publicOnly: true });
}

function getManagementBooks(filters = {}) {
  return listBooks(filters);
}

async function getCategories() {
  const result = await (await getPool()).request().query(`
    SELECT c.CategoryId AS id, c.CategoryName AS name, COUNT(b.BookId) AS count
    FROM Categories c
    LEFT JOIN Books b ON c.CategoryId = b.CategoryId AND b.Status = 'ACTIVE'
    WHERE c.Status = 'ACTIVE'
    GROUP BY c.CategoryId, c.CategoryName
    ORDER BY c.CategoryName, c.CategoryId;
  `);
  return result.recordset;
}

async function getMetadata() {
  const pool = await getPool();
  const [categories, authors, publishers] = await Promise.all([
    pool.request().query("SELECT CategoryId AS id, CategoryName AS name FROM Categories WHERE Status = 'ACTIVE' ORDER BY CategoryName, CategoryId"),
    pool.request().query("SELECT AuthorId AS id, AuthorName AS name FROM Authors WHERE Status = 'ACTIVE' ORDER BY AuthorName, AuthorId"),
    pool.request().query("SELECT PublisherId AS id, PublisherName AS name FROM Publishers WHERE Status = 'ACTIVE' ORDER BY PublisherName, PublisherId"),
  ]);
  return {
    categories: categories.recordset,
    authors: authors.recordset,
    publishers: publishers.recordset,
  };
}

async function getBookById(bookId, transaction) {
  const request = createRequest(transaction) || (await getPool()).request();
  const result = await request.input('BookId', sql.Int, bookId).query(`
    SELECT ${listSelect()}
    FROM Books b
    LEFT JOIN Categories c ON b.CategoryId = c.CategoryId
    LEFT JOIN Authors a ON b.AuthorId = a.AuthorId
    LEFT JOIN Publishers p ON b.PublisherId = p.PublisherId
    LEFT JOIN BookCopies bc ON b.BookId = bc.BookId
    WHERE b.BookId = @BookId
    GROUP BY ${groupBySql()};
  `);
  return mapBookRow(result.recordset[0]);
}

async function isbnExists(isbn, excludedBookId = null) {
  if (!isbn) return false;
  const request = (await getPool()).request().input('ISBN', sql.NVarChar(20), isbn);
  const where = ['ISBN = @ISBN'];
  if (excludedBookId) {
    request.input('BookId', sql.Int, excludedBookId);
    where.push('BookId <> @BookId');
  }
  const result = await request.query(`SELECT TOP 1 BookId FROM Books WHERE ${where.join(' AND ')}`);
  return result.recordset.length > 0;
}

async function referenceExists(tableName, idColumn, id) {
  if (!id || REFERENCE_TABLES[tableName] !== idColumn) return false;
  const result = await (await getPool())
    .request()
    .input('Id', sql.Int, id)
    .query(`SELECT TOP 1 ${idColumn} FROM ${tableName} WHERE ${idColumn} = @Id AND Status = 'ACTIVE'`);
  return result.recordset.length > 0;
}

async function createBook(payload, { actorUserId, onBeforeCommit } = {}) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const result = await new sql.Request(transaction)
      .input('Title', sql.NVarChar(255), payload.title)
      .input('ISBN', sql.NVarChar(20), payload.isbn || null)
      .input('CategoryId', sql.Int, payload.categoryId)
      .input('AuthorId', sql.Int, payload.authorId)
      .input('PublisherId', sql.Int, payload.publisherId || null)
      .input('PublishYear', sql.Int, payload.publishYear || null)
      .input('Description', sql.NVarChar(sql.MAX), payload.description || null)
      .input('CoverUrl', sql.NVarChar(255), payload.coverUrl || null)
      .input('Rating', sql.Decimal(2, 1), payload.rating)
      .input('Pages', sql.Int, payload.pages || null)
      .input('CreatedBy', sql.Int, actorUserId || null)
      .query(`
        INSERT INTO Books
          (Title, ISBN, CategoryId, AuthorId, PublisherId, PublishYear, Description, CoverUrl, Rating, Pages, Status, CreatedBy)
        OUTPUT INSERTED.BookId
        VALUES
          (@Title, @ISBN, @CategoryId, @AuthorId, @PublisherId, @PublishYear, @Description, @CoverUrl, @Rating, @Pages, 'ACTIVE', @CreatedBy);
      `);
    const book = await getBookById(result.recordset[0].BookId, transaction);
    if (typeof onBeforeCommit === 'function') await onBeforeCommit({ book, transaction });
    await transaction.commit();
    return book;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function lockBook(transaction, bookId, expectedVersion) {
  const current = await new sql.Request(transaction)
    .input('BookId', sql.Int, bookId)
    .query(`
      SELECT b.BookId, b.Status, b.RowVersion AS Version
      FROM Books b WITH (UPDLOCK, HOLDLOCK)
      WHERE b.BookId = @BookId;
    `);
  const row = current.recordset[0];
  if (!row) return null;
  if (normalizeVersion(row.Version) !== normalizeVersion(expectedVersion)) {
    return { outcome: 'STALE' };
  }
  return row;
}

async function updateBook(bookId, payload, expectedVersion, { actorUserId, onBeforeCommit } = {}) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const current = await lockBook(transaction, bookId, expectedVersion);
    if (!current || current.outcome) {
      await transaction.rollback();
      return current;
    }
    await new sql.Request(transaction)
      .input('BookId', sql.Int, bookId)
      .input('Title', sql.NVarChar(255), payload.title)
      .input('ISBN', sql.NVarChar(20), payload.isbn || null)
      .input('CategoryId', sql.Int, payload.categoryId)
      .input('AuthorId', sql.Int, payload.authorId)
      .input('PublisherId', sql.Int, payload.publisherId || null)
      .input('PublishYear', sql.Int, payload.publishYear || null)
      .input('Description', sql.NVarChar(sql.MAX), payload.description || null)
      .input('CoverUrl', sql.NVarChar(255), payload.coverUrl || null)
      .input('Rating', sql.Decimal(2, 1), payload.rating)
      .input('Pages', sql.Int, payload.pages || null)
      .input('UpdatedBy', sql.Int, actorUserId || null)
      .query(`
        UPDATE Books
        SET Title = @Title,
            ISBN = @ISBN,
            CategoryId = @CategoryId,
            AuthorId = @AuthorId,
            PublisherId = @PublisherId,
            PublishYear = @PublishYear,
            Description = @Description,
            CoverUrl = @CoverUrl,
            Rating = @Rating,
            Pages = @Pages,
            UpdatedBy = @UpdatedBy,
            UpdatedAt = GETDATE()
        WHERE BookId = @BookId;
      `);
    const book = await getBookById(bookId, transaction);
    if (typeof onBeforeCommit === 'function') await onBeforeCommit({ book, transaction });
    await transaction.commit();
    return book;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function changeBookStatus(
  bookId,
  targetStatus,
  expectedVersion,
  { actorUserId, onBeforeCommit } = {}
) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const current = await lockBook(transaction, bookId, expectedVersion);
    if (!current || current.outcome) {
      await transaction.rollback();
      return current;
    }
    if (current.Status === targetStatus) {
      await transaction.rollback();
      return { outcome: 'INVALID_TRANSITION' };
    }
    await new sql.Request(transaction)
      .input('BookId', sql.Int, bookId)
      .input('Status', sql.NVarChar(20), targetStatus)
      .input('UpdatedBy', sql.Int, actorUserId || null)
      .query(`
        UPDATE Books
        SET Status = @Status, UpdatedBy = @UpdatedBy, UpdatedAt = GETDATE()
        WHERE BookId = @BookId;
      `);
    const book = await getBookById(bookId, transaction);
    if (typeof onBeforeCommit === 'function') await onBeforeCommit({ book, transaction });
    await transaction.commit();
    return book;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = {
  getHomeBooks,
  getCategories,
  getMetadata,
  getManagementBooks,
  getBookById,
  isbnExists,
  referenceExists,
  createBook,
  updateBook,
  changeBookStatus,
};
