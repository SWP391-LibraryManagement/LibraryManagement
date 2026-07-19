jest.mock('../src/config/db', () => ({
  sql: {
    Date: 'Date',
    Int: 'Int',
    NVarChar: (size) => `NVarChar(${size})`,
  },
  getPool: jest.fn(),
}));

const { getPool } = require('../src/config/db');
const adminRepository = require('../src/repositories/adminRepository');

function useRecordsets(recordsets) {
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
          return { recordsets };
        },
      };
    },
  });
  return capture;
}

beforeEach(() => getPool.mockReset());

// @spec BR-FE11-019, FR-FE11-034, AC-FE11-019
test('request repository applies one parameterized filter scope and stable header pagination', async () => {
  const capture = useRecordsets([[{ total: 0 }], []]);

  await adminRepository.listRequests({
    page: 2,
    limit: 10,
    q: 'A%_title',
    status: 'PENDING',
    from: '2026-07-01',
    to: '2026-07-19',
  });

  expect(capture.inputs).toMatchObject({
    Search: '%A\\%\\_title%',
    Status: 'PENDING',
    From: '2026-07-01',
    ToExclusive: expect.any(Date),
    Offset: 10,
    Limit: 10,
  });
  expect(capture.inputs.ToExclusive.toISOString()).toBe('2026-07-20T00:00:00.000Z');
  expect(capture.query).toContain('SELECT DISTINCT br.RequestId');
  expect(capture.query).toContain('INTO #FilteredRequests');
  expect(capture.query).toContain('SELECT COUNT(*) AS total FROM #FilteredRequests');
  expect(capture.query).toContain('ORDER BY br.RequestDate DESC, br.RequestId DESC');
  expect(capture.query).toContain('OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY');
  expect(capture.query).toContain('ORDER BY pr.RequestDate DESC, pr.RequestId DESC, bd.BorrowDetailId ASC');
  expect(capture.query).not.toContain('STRING_AGG');
});

test('request repository groups detail titles and first-occurrence categories without comma splitting', async () => {
  useRecordsets([
    [{ total: 1 }],
    [
      {
        RequestId: 25,
        RequestDate: new Date('2026-07-19T08:00:00.000Z'),
        RequestStatus: 'PENDING',
        UserId: 10,
        FullName: 'Member Name',
        Email: 'member@example.test',
        PhoneNumber: '0900000000',
        BorrowDetailId: 80,
        Title: 'Book, Volume One',
        CategoryName: 'Reference, General',
      },
      {
        RequestId: 25,
        RequestDate: new Date('2026-07-19T08:00:00.000Z'),
        RequestStatus: 'PENDING',
        UserId: 10,
        FullName: 'Member Name',
        Email: 'member@example.test',
        PhoneNumber: '0900000000',
        BorrowDetailId: 81,
        Title: 'Book B',
        CategoryName: 'Reference, General',
      },
    ],
  ]);

  const result = await adminRepository.listRequests({ page: 1, limit: 20 });

  expect(result).toEqual({
    rows: [{
      requestId: 25,
      requestDate: new Date('2026-07-19T08:00:00.000Z'),
      status: 'PENDING',
      memberUserId: 10,
      memberName: 'Member Name',
      memberEmail: 'member@example.test',
      memberPhoneNumber: '0900000000',
      itemCount: 2,
      bookTitles: ['Book, Volume One', 'Book B'],
      categories: ['Reference, General'],
    }],
    total: 1,
  });
});
