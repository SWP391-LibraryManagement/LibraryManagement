jest.mock('../src/config/db', () => ({
  sql: {
    Int: 'Int',
    NVarChar: (size) => `NVarChar(${size})`,
    Request: jest.fn(),
  },
  getPool: jest.fn(),
}));

const { getPool } = require('../src/config/db');
const bookRepository = require('../src/repositories/bookRepository');

function capturePublicQuery(recordset = []) {
  const capture = { inputs: {}, query: '' };
  getPool.mockResolvedValue({
    request() {
      return {
        input(name, _type, value) {
          capture.inputs[name] = value;
          return this;
        },
        async query(query) {
          capture.query = query;
          return { recordset };
        },
      };
    },
  });
  return capture;
}

beforeEach(() => {
  getPool.mockReset();
});

// @spec BR-FE01-003, BR-FE01-006, FR-FE01-002, FR-FE01-008, AC-FE01-002
test('public q search is parameterized and matches only title or author name', async () => {
  const capture = capturePublicQuery([]);

  await bookRepository.getHomeBooks({
    q: 'C%_lean',
    page: 1,
    limit: 20,
    sort: 'title',
    order: 'asc',
  });

  expect(capture.inputs.Search).toBe('%C\\%\\_lean%');
  expect(capture.query).toContain("b.Status = 'ACTIVE'");
  expect(capture.query).toContain("b.Title LIKE @Search ESCAPE '\\'");
  expect(capture.query).toContain("COALESCE(a.AuthorName, '') LIKE @Search ESCAPE '\\'");
  expect(capture.query).not.toContain("COALESCE(b.ISBN, '') LIKE @Search");
  expect(capture.query).not.toContain("COALESCE(c.CategoryName, '') LIKE @Search");
  expect(capture.query).not.toContain("COALESCE(p.PublisherName, '') LIKE @Search");
});

// @spec BR-FE01-005, BR-FE01-008, BR-FE01-011, FR-FE01-003, FR-FE01-009
test('public filters, pagination, and stable ordering stay in SQL', async () => {
  const capture = capturePublicQuery([]);

  await bookRepository.getHomeBooks({
    q: '',
    categoryId: 2,
    authorId: 3,
    publisherId: 4,
    page: 3,
    limit: 10,
    sort: 'title',
    order: 'asc',
  });

  expect(capture.inputs).toMatchObject({
    CategoryId: 2,
    AuthorId: 3,
    PublisherId: 4,
    Offset: 20,
    Limit: 10,
  });
  expect(capture.inputs).not.toHaveProperty('Search');
  expect(capture.query).toContain('b.CategoryId = @CategoryId');
  expect(capture.query).toContain('b.AuthorId = @AuthorId');
  expect(capture.query).toContain('b.PublisherId = @PublisherId');
  expect(capture.query).toContain('ORDER BY b.Title ASC, b.BookId ASC');
  expect(capture.query).toContain('OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY');
});

// @spec BR-FE01-012, BR-FE01-013, FR-FE01-011, AC-FE01-011
test('public availability is derived read-only from active available copies', async () => {
  const capture = capturePublicQuery([]);

  await bookRepository.getHomeBooks({
    q: '',
    page: 1,
    limit: 20,
    sort: 'title',
    order: 'asc',
  });

  expect(capture.query).toMatch(/b\.Status\s*=\s*'ACTIVE'/i);
  expect(capture.query).toMatch(/bc\.Status\s*=\s*'AVAILABLE'/i);
  expect(capture.query).toMatch(/THEN\s+'AVAILABLE'[\s\S]{0,160}ELSE\s+'UNAVAILABLE'/i);
  expect(capture.query).not.toMatch(/(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+(?:Books|BookCopies)/i);
});
