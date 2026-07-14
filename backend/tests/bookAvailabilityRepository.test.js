jest.mock('../src/config/db', () => ({
  sql: {
    Int: 'Int',
    NVarChar: jest.fn((length) => ({ type: 'NVarChar', length })),
  },
  getPool: jest.fn(),
}));

const { getPool } = require('../src/config/db');
const bookRepository = require('../src/repositories/bookRepository');

test('changing an inventory-less book to AVAILABLE creates its first copy', async () => {
  const queries = [];
  const request = {
    input: jest.fn().mockReturnThis(),
    query: jest.fn(async (query) => {
      queries.push(query);
      return { recordset: [] };
    }),
  };
  getPool.mockResolvedValue({ request: () => request });

  await bookRepository.updateBookAvailability(1005, 'AVAILABLE', 1);

  expect(queries[0]).toContain("IF @targetStatus = 'AVAILABLE'");
  expect(queries[0]).toContain('NOT EXISTS (SELECT 1 FROM BookCopies WHERE BookId = @bookId)');
  expect(queries[0]).toContain('INSERT INTO BookCopies');
  expect(queries[0]).toContain("CONCAT('AUTO-B', @bookId");
});
