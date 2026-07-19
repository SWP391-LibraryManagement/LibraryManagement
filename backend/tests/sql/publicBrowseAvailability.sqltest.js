const dotenv = require('dotenv');
const { readFileSync } = require('fs');
const path = require('path');

if (process.env.FE01_SQL_TEST_ENV_FILE) {
  dotenv.config({ path: process.env.FE01_SQL_TEST_ENV_FILE, quiet: true });
} else {
  dotenv.config({ quiet: true });
}

const repositorySource = readFileSync(
  path.join(__dirname, '..', '..', 'src', 'repositories', 'bookRepository.js'),
  'utf8'
);

// @spec BR-FE01-011, BR-FE01-012, BR-FE01-013, FR-FE01-011, AC-FE01-011
test('public SQL projection filters active books and derives current availability', () => {
  expect(repositorySource).toMatch(/publicOnly\s*\?\s*\["b\.Status = 'ACTIVE'"\]/i);
  expect(repositorySource).toMatch(/bc\.Status\s*=\s*'AVAILABLE'/i);
  expect(repositorySource).toMatch(/THEN\s+'AVAILABLE'[\s\S]{0,160}ELSE\s+'UNAVAILABLE'/i);
  expect(repositorySource).toMatch(/ORDER BY\s+\$\{sortColumn\}\s+\$\{order\},\s*b\.BookId ASC/i);
});

const hasSqlRuntime =
  Boolean(process.env.DB_SERVER && process.env.DB_NAME) &&
  process.env.FE01_SQL_TEST_ALLOW_MUTATION === 'true';
const runtimeDescribe = hasSqlRuntime ? describe : describe.skip;

runtimeDescribe('FE01 live SQL availability evidence', () => {
  const { sql, getPool, resetPoolForTests } = require('../../src/config/db');
  const bookRepository = require('../../src/repositories/bookRepository');
  let pool;
  let categoryId;
  let bookId;
  let copyId;
  const key = `fe01-${Date.now()}-${process.pid}`;

  beforeAll(async () => {
    pool = await getPool();
  });

  afterAll(async () => {
    try {
      if (pool && copyId) {
        await pool.request().input('CopyId', sql.Int, copyId)
          .query('DELETE FROM BookCopies WHERE CopyId = @CopyId');
      }
      if (pool && bookId) {
        await pool.request().input('BookId', sql.Int, bookId)
          .query('DELETE FROM Books WHERE BookId = @BookId');
      }
      if (pool && categoryId) {
        await pool.request().input('CategoryId', sql.Int, categoryId)
          .query('DELETE FROM Categories WHERE CategoryId = @CategoryId');
      }
    } finally {
      if (pool) await pool.close();
      resetPoolForTests();
    }
  });

  test('a later public read reflects the latest committed BookCopies status', async () => {
    const categoryResult = await pool.request()
      .input('CategoryName', sql.NVarChar(100), `${key}-category`)
      .query('INSERT INTO Categories (CategoryName) OUTPUT INSERTED.CategoryId VALUES (@CategoryName)');
    categoryId = categoryResult.recordset[0].CategoryId;

    const bookResult = await pool.request()
      .input('Title', sql.NVarChar(255), `${key}-book`)
      .input('CategoryId', sql.Int, categoryId)
      .query(`
        INSERT INTO Books (Title, CategoryId, Status)
        OUTPUT INSERTED.BookId
        VALUES (@Title, @CategoryId, 'ACTIVE')
      `);
    bookId = bookResult.recordset[0].BookId;

    const copyResult = await pool.request()
      .input('BookId', sql.Int, bookId)
      .input('Barcode', sql.NVarChar(100), `${key}-copy`)
      .query(`
        INSERT INTO BookCopies (BookId, Barcode, Status)
        OUTPUT INSERTED.CopyId
        VALUES (@BookId, @Barcode, 'BORROWED')
      `);
    copyId = copyResult.recordset[0].CopyId;

    const filters = {
      q: `${key}-book`,
      page: 1,
      limit: 20,
      sort: 'title',
      order: 'asc',
    };
    const unavailable = await bookRepository.getHomeBooks(filters);
    expect(unavailable.rows).toEqual([
      expect.objectContaining({ id: bookId, availabilityStatus: 'UNAVAILABLE' }),
    ]);

    await pool.request().input('CopyId', sql.Int, copyId)
      .query("UPDATE BookCopies SET Status = 'AVAILABLE' WHERE CopyId = @CopyId");

    const available = await bookRepository.getHomeBooks(filters);
    expect(available.rows).toEqual([
      expect.objectContaining({ id: bookId, availabilityStatus: 'AVAILABLE' }),
    ]);
  });
});
