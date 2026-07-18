const { getPool, sql } = require('../config/db');

function escapeLikePattern(value) {
  return value.replace(/[\\%_[\]]/g, (match) => `\\${match}`);
}

async function getHomeBooks(filters = {}) {
  const pool = await getPool();
  const request = pool.request();
  const whereConditions = [`b.Status = 'ACTIVE'`];

  if (filters.q) {
    request.input('search', escapeLikePattern(filters.q));
    whereConditions.push(`(
      b.Title LIKE '%' + @search + '%' ESCAPE '\\'
      OR b.ISBN LIKE '%' + @search + '%' ESCAPE '\\'
      OR a.AuthorName LIKE '%' + @search + '%' ESCAPE '\\'
      OR c.CategoryName LIKE '%' + @search + '%' ESCAPE '\\'
      OR p.PublisherName LIKE '%' + @search + '%' ESCAPE '\\'
    )`);
  }

  if (filters.category) {
    request.input('category', filters.category);
    whereConditions.push(`c.CategoryName = @category`);
  }

  const result = await request.query(`
    SELECT
        b.BookId AS id,
        b.Title AS title,
        a.AuthorName AS author,
        c.CategoryName AS category,
        p.PublisherName AS publisher,
        b.PublishYear AS year,
        b.ISBN AS isbn,
        b.Description AS description,
        b.CoverUrl AS cover,
        b.Rating AS rating,
        b.Pages AS pages,

        CASE 
            WHEN SUM(CASE WHEN bc.Status = 'AVAILABLE' THEN 1 ELSE 0 END) > 0 
            THEN CAST(1 AS BIT)
            ELSE CAST(0 AS BIT)
        END AS available,

        COUNT(bc.CopyId) AS totalCopies,
        SUM(CASE WHEN bc.Status = 'AVAILABLE' THEN 1 ELSE 0 END) AS availableCopies

    FROM Books b
    LEFT JOIN Authors a ON b.AuthorId = a.AuthorId
    LEFT JOIN Categories c ON b.CategoryId = c.CategoryId
    LEFT JOIN Publishers p ON b.PublisherId = p.PublisherId
    LEFT JOIN BookCopies bc ON b.BookId = bc.BookId

    WHERE ${whereConditions.join('\n      AND ')}

    GROUP BY
        b.BookId,
        b.Title,
        a.AuthorName,
        c.CategoryName,
        p.PublisherName,
        b.PublishYear,
        b.ISBN,
        b.Description,
        b.CoverUrl,
        b.Rating,
        b.Pages

    ORDER BY b.BookId DESC;
  `);

  return result.recordset;
}

async function getCategories() {
  const pool = await getPool();

  const result = await pool.request().query(`
    SELECT
        c.CategoryId AS id,
        c.CategoryName AS name,
        COUNT(b.BookId) AS count
    FROM Categories c
    LEFT JOIN Books b
        ON c.CategoryId = b.CategoryId
        AND b.Status = 'ACTIVE'
    GROUP BY c.CategoryId, c.CategoryName
    ORDER BY c.CategoryName;
  `);

  return result.recordset;
}

async function getMetadata() {
  const pool = await getPool();
  const [categories, authors, publishers] = await Promise.all([
    pool.request().query(`
      SELECT CategoryId AS id, CategoryName AS name
      FROM Categories
      WHERE Status = 'ACTIVE'
      ORDER BY CategoryName;
    `),
    pool.request().query(`
      SELECT AuthorId AS id, AuthorName AS name
      FROM Authors
      WHERE Status = 'ACTIVE'
      ORDER BY AuthorName;
    `),
    pool.request().query(`
      SELECT PublisherId AS id, PublisherName AS name
      FROM Publishers
      WHERE Status = 'ACTIVE'
      ORDER BY PublisherName;
    `),
  ]);

  return {
    categories: categories.recordset,
    authors: authors.recordset,
    publishers: publishers.recordset,
  };
}

function applyManagementFilters(request, filters = {}) {
  const whereConditions = ['1 = 1'];

  if (filters.q) {
    request.input('search', escapeLikePattern(filters.q));
    whereConditions.push(`(
      b.Title LIKE '%' + @search + '%' ESCAPE '\\'
      OR b.ISBN LIKE '%' + @search + '%' ESCAPE '\\'
      OR a.AuthorName LIKE '%' + @search + '%' ESCAPE '\\'
      OR c.CategoryName LIKE '%' + @search + '%' ESCAPE '\\'
      OR p.PublisherName LIKE '%' + @search + '%' ESCAPE '\\'
    )`);
  }

  if (filters.status) {
    request.input('status', filters.status);
    whereConditions.push('b.Status = @status');
  }

  if (filters.categoryId) {
    request.input('categoryId', sql.Int, filters.categoryId);
    whereConditions.push('b.CategoryId = @categoryId');
  }

  return whereConditions;
}

async function getManagementBooks(filters = {}) {
  const pool = await getPool();
  const request = pool.request();
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;
  const whereConditions = applyManagementFilters(request, filters);

  request.input('offset', sql.Int, offset);
  request.input('limit', sql.Int, limit);

  const result = await request.query(`
    SELECT
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
      COUNT(bc.CopyId) AS totalCopies,
      SUM(CASE WHEN bc.Status = 'AVAILABLE' THEN 1 ELSE 0 END) AS availableCopies,
      COUNT(*) OVER() AS totalRows
    FROM Books b
    LEFT JOIN Authors a ON b.AuthorId = a.AuthorId
    LEFT JOIN Categories c ON b.CategoryId = c.CategoryId
    LEFT JOIN Publishers p ON b.PublisherId = p.PublisherId
    LEFT JOIN BookCopies bc ON b.BookId = bc.BookId
    WHERE ${whereConditions.join('\n      AND ')}
    GROUP BY
      b.BookId, b.Title, b.ISBN, b.CategoryId, c.CategoryName,
      b.AuthorId, a.AuthorName, b.PublisherId, p.PublisherName,
      b.PublishYear, b.Description, b.CoverUrl, b.Rating, b.Pages,
      b.Status, b.CreatedAt, b.UpdatedAt
    ORDER BY b.BookId ASC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
  `);

  return {
    rows: result.recordset,
    total: result.recordset[0]?.totalRows || 0,
  };
}

async function getBookById(bookId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('bookId', sql.Int, bookId)
    .query(`
      SELECT
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
        COUNT(bc.CopyId) AS totalCopies,
        SUM(CASE WHEN bc.Status = 'AVAILABLE' THEN 1 ELSE 0 END) AS availableCopies,
        SUM(CASE WHEN bc.Status IN ('BORROWED', 'RESERVED') THEN 1 ELSE 0 END) AS lockedCopies
      FROM Books b
      LEFT JOIN Authors a ON b.AuthorId = a.AuthorId
      LEFT JOIN Categories c ON b.CategoryId = c.CategoryId
      LEFT JOIN Publishers p ON b.PublisherId = p.PublisherId
      LEFT JOIN BookCopies bc ON b.BookId = bc.BookId
      WHERE b.BookId = @bookId
      GROUP BY
        b.BookId, b.Title, b.ISBN, b.CategoryId, c.CategoryName,
        b.AuthorId, a.AuthorName, b.PublisherId, p.PublisherName,
        b.PublishYear, b.Description, b.CoverUrl, b.Rating, b.Pages,
        b.Status, b.CreatedAt, b.UpdatedAt;
    `);

  return result.recordset[0] || null;
}

async function isbnExists(isbn, excludedBookId = null) {
  if (!isbn) {
    return false;
  }

  const pool = await getPool();
  const request = pool.request().input('isbn', sql.NVarChar(50), isbn);
  const conditions = ['ISBN = @isbn'];

  if (excludedBookId) {
    request.input('bookId', sql.Int, excludedBookId);
    conditions.push('BookId <> @bookId');
  }

  const result = await request.query(`
    SELECT TOP 1 BookId
    FROM Books
    WHERE ${conditions.join(' AND ')};
  `);

  return result.recordset.length > 0;
}

async function referenceExists(tableName, idColumn, id) {
  if (!id) {
    return false;
  }

  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`SELECT TOP 1 ${idColumn} FROM ${tableName} WHERE ${idColumn} = @id AND Status = 'ACTIVE';`);

  return result.recordset.length > 0;
}

async function createBook(payload, actorUserId = null) {
  const pool = await getPool();
  const result = await pool.request()
    .input('title', sql.NVarChar(255), payload.title)
    .input('isbn', sql.NVarChar(50), payload.isbn || null)
    .input('categoryId', sql.Int, payload.categoryId)
    .input('authorId', sql.Int, payload.authorId)
    .input('publisherId', sql.Int, payload.publisherId || null)
    .input('publishYear', sql.Int, payload.publishYear || null)
    .input('description', sql.NVarChar(sql.MAX), payload.description || null)
    .input('coverUrl', sql.NVarChar(255), payload.coverUrl || null)
    .input('rating', sql.Decimal(2, 1), payload.rating)
    .input('pages', sql.Int, payload.pages || null)
    .input('status', sql.NVarChar(20), payload.status || 'ACTIVE')
    .input('createdBy', sql.Int, actorUserId || null)
    .query(`
      INSERT INTO Books
        (Title, ISBN, CategoryId, AuthorId, PublisherId, PublishYear, Description, CoverUrl, Rating, Pages, Status, CreatedBy)
      OUTPUT INSERTED.BookId AS id
      VALUES
        (@title, @isbn, @categoryId, @authorId, @publisherId, @publishYear, @description, @coverUrl, @rating, @pages, @status, @createdBy);
    `);

  return getBookById(result.recordset[0].id);
}

async function updateBook(bookId, payload, actorUserId = null) {
  const pool = await getPool();
  await pool.request()
    .input('bookId', sql.Int, bookId)
    .input('title', sql.NVarChar(255), payload.title)
    .input('isbn', sql.NVarChar(50), payload.isbn || null)
    .input('categoryId', sql.Int, payload.categoryId)
    .input('authorId', sql.Int, payload.authorId)
    .input('publisherId', sql.Int, payload.publisherId || null)
    .input('publishYear', sql.Int, payload.publishYear || null)
    .input('description', sql.NVarChar(sql.MAX), payload.description || null)
    .input('coverUrl', sql.NVarChar(255), payload.coverUrl || null)
    .input('rating', sql.Decimal(2, 1), payload.rating)
    .input('pages', sql.Int, payload.pages || null)
    .input('status', sql.NVarChar(20), payload.status || 'ACTIVE')
    .input('updatedBy', sql.Int, actorUserId || null)
    .query(`
      UPDATE Books
      SET
        Title = @title,
        ISBN = @isbn,
        CategoryId = @categoryId,
        AuthorId = @authorId,
        PublisherId = @publisherId,
        PublishYear = @publishYear,
        Description = @description,
        CoverUrl = @coverUrl,
        Rating = @rating,
        Pages = @pages,
        Status = @status,
        UpdatedBy = @updatedBy,
        UpdatedAt = GETDATE()
      WHERE BookId = @bookId;
    `);

  return getBookById(bookId);
}

async function deactivateBook(bookId, actorUserId = null) {
  const pool = await getPool();
  await pool.request()
    .input('bookId', sql.Int, bookId)
    .input('updatedBy', sql.Int, actorUserId || null)
    .query(`
      UPDATE Books
      SET Status = 'INACTIVE', UpdatedBy = @updatedBy, UpdatedAt = GETDATE()
      WHERE BookId = @bookId;
    `);

  return getBookById(bookId);
}

async function updateBookAvailability(bookId, copyStatus, actorUserId = null) {
  const pool = await getPool();
  const targetStatus = copyStatus === 'AVAILABLE' ? 'AVAILABLE' : 'BORROWED';
  const sourceStatuses = targetStatus === 'AVAILABLE'
    ? ['BORROWED']
    : ['AVAILABLE'];

  const request = pool.request()
    .input('bookId', sql.Int, bookId)
    .input('targetStatus', sql.NVarChar(20), targetStatus)
    .input('updatedBy', sql.Int, actorUserId || null);

  sourceStatuses.forEach((status, index) => {
    request.input(`status${index}`, sql.NVarChar(20), status);
  });

  await request.query(`
    IF @targetStatus = 'AVAILABLE'
       AND NOT EXISTS (SELECT 1 FROM BookCopies WHERE BookId = @bookId)
    BEGIN
      INSERT INTO BookCopies (BookId, Barcode, Status, Location)
      VALUES (
        @bookId,
        CONCAT('AUTO-B', @bookId, '-', REPLACE(CONVERT(NVARCHAR(36), NEWID()), '-', '')),
        'AVAILABLE',
        NULL
      );
    END;

    UPDATE BookCopies
    SET Status = @targetStatus,
        UpdatedAt = GETDATE()
    WHERE BookId = @bookId
      AND Status IN (${sourceStatuses.map((_, index) => `@status${index}`).join(', ')});

    UPDATE Books
    SET Status = 'ACTIVE',
        UpdatedBy = @updatedBy,
        UpdatedAt = GETDATE()
    WHERE BookId = @bookId;
  `);

  return getBookById(bookId);
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
  deactivateBook,
  updateBookAvailability,
};
