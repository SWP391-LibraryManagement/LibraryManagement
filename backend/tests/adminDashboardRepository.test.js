const mockQuery = jest.fn();
const mockInput = jest.fn(() => ({ input: mockInput, query: mockQuery }));
const mockRequest = jest.fn(() => ({ input: mockInput, query: mockQuery }));

jest.mock('../src/config/db', () => ({
  getPool: jest.fn(async () => ({ request: mockRequest })),
  sql: {},
}));

const adminRepository = require('../src/repositories/adminRepository');

describe('admin dashboard cross-feature summary', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockInput.mockClear();
    mockRequest.mockClear();
  });

  test('uses the canonical single-role mapping and workflow-owned pending states', async () => {
    const summary = {
      totalBooks: 9,
      totalMembers: 7,
      totalAuthors: 15,
      activeUsers: 14,
      activeMembers: 7,
      activeLibrarians: 4,
      activeAdmins: 3,
      pendingMemberships: 2,
      pendingRequests: 5,
      totalBorrowed: 1,
      overdueBorrowed: 0,
    };
    mockQuery
      .mockResolvedValueOnce({ recordset: [summary] })
      .mockResolvedValueOnce({ recordset: [] })
      .mockResolvedValueOnce({ recordset: [] })
      .mockResolvedValueOnce({ recordset: [] })
      .mockResolvedValueOnce({ recordset: [] });

    const result = await adminRepository.getDashboard('2026-07-27');

    expect(result.summary).toEqual(summary);
    const statement = mockQuery.mock.calls[0][0];
    expect(statement).toContain('INNER JOIN UserRoles ur ON ur.UserId = u.UserId');
    expect(statement).toContain('INNER JOIN Roles r ON r.RoleId = ur.RoleId');
    expect(statement).toContain("u.Status = 'ACTIVE'");
    expect(statement).toContain("r.RoleName = 'MEMBER'");
    expect(statement).toContain("r.RoleName = 'LIBRARIAN'");
    expect(statement).toContain("r.RoleName = 'ADMIN'");
    expect(statement).toContain("FROM MembershipApplications WHERE Status = 'PENDING'");
    expect(statement).toContain("FROM BorrowRequests WHERE Status = 'PENDING'");
    expect(mockInput).toHaveBeenCalledWith(
      'BusinessDate',
      undefined,
      new Date('2026-07-27T00:00:00.000Z')
    );

    const chartStatements = mockQuery.mock.calls.slice(1).map(([sqlText]) => sqlText).join('\n');
    expect(chartStatements).toContain('WHERE bd.BorrowDate IS NOT NULL');
    expect(chartStatements).toContain('WHERE bd.ReturnDate = @BusinessDate');
  });
});
