jest.mock('../src/config/db', () => ({
  sql: {
    Int: 'Int',
    NVarChar: jest.fn((length) => ({ type: 'NVarChar', length })),
  },
  getPool: jest.fn(),
}));

const { getPool } = require('../src/config/db');
const bookRepository = require('../src/repositories/bookRepository');

test('FE05 catalog state transition never mutates or creates BookCopies', async () => {
  const queries = [];
  const request = {
    input: jest.fn().mockReturnThis(),
    query: jest.fn(async (query) => {
      queries.push(query);
      return { recordset: [] };
    }),
  };
  getPool.mockResolvedValue({ request: () => request });

  await bookRepository.setBookStatus(1005, 'INACTIVE', 'Catalog cleanup', 1);

  expect(queries[0]).toContain('UPDATE Books');
  expect(queries[0]).not.toContain('BookCopies');
  expect(bookRepository.updateBookAvailability).toBeUndefined();
});
