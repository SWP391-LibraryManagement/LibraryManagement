describe('reportProjection', () => {
  test('builds the existing paginated report envelope', () => {
    const { buildReport, pagination } = require('../src/utils/reportProjection');
    const filters = { page: '3', limit: '15' };

    expect(pagination(filters)).toEqual({ page: 3, limit: 15, offset: 30 });
    expect(buildReport({ total: 42 }, [{ id: 1 }], filters, 42)).toEqual({
      metrics: { total: 42 },
      rows: [{ id: 1 }],
      page: 3,
      limit: 15,
      totalRows: 42,
    });
  });

  test('reads both SQL Server resultset response shapes', () => {
    const { getResultset } = require('../src/utils/reportProjection');

    expect(getResultset({ recordsets: [[{ Total: 2 }], [{ Id: 1 }]] }, 1, 1)).toEqual([
      { Id: 1 },
    ]);
    expect(getResultset({ recordset: [{ Id: 2 }] }, 1, 1)).toEqual([{ Id: 2 }]);
    expect(getResultset({ recordset: [{ Id: 2 }] }, 0, 1)).toEqual([]);
  });

  test('normalizes status and date count maps without changing unknown buckets', () => {
    const { toCountMap } = require('../src/utils/reportProjection');

    expect(
      toCountMap(
        [
          { Status: 'active', Count: 2 },
          { Status: 'unexpected', Count: 3 },
        ],
        'Status',
        'Count',
        new Set(['ACTIVE'])
      )
    ).toEqual({ ACTIVE: 2, UNKNOWN: 3 });
    expect(
      toCountMap(
        [
          { PeriodDate: '2026-07-29T03:00:00.000Z', Count: 2 },
          { PeriodDate: 'invalid', Count: 9 },
        ],
        'PeriodDate',
        'Count'
      )
    ).toEqual({ '2026-07-29': 2 });
  });

  test('converts an inclusive upper bound to the next UTC day', () => {
    const { toExclusiveNextDay } = require('../src/utils/reportProjection');

    expect(toExclusiveNextDay('2026-07-29').toISOString()).toBe('2026-07-30T00:00:00.000Z');
  });
});
