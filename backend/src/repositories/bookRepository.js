const { getPool } = require('../config/db');

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

module.exports = {
  getHomeBooks,
  getCategories,
};
