jest.mock('../src/repositories/adminRepository', () => ({
  listRequests: jest.fn(),
}));
jest.mock('../src/repositories/borrowingRepository', () => ({
  findBorrowRequestById: jest.fn(),
}));

const adminRepository = require('../src/repositories/adminRepository');
const borrowingRepository = require('../src/repositories/borrowingRepository');
const adminService = require('../src/services/adminService');

beforeEach(() => {
  adminRepository.listRequests.mockReset();
  borrowingRepository.findBorrowRequestById.mockReset();
});

// @spec BR-FE11-019, BR-FE11-026, FR-FE11-034, AC-FE11-019
test('request list returns only the canonical safe envelope and DTO', async () => {
  adminRepository.listRequests.mockResolvedValue({
    rows: [{
      requestId: 25,
      requestDate: new Date('2026-07-19T08:00:00.000Z'),
      status: 'PENDING',
      memberUserId: 10,
      memberName: 'Member Name',
      memberEmail: 'member@example.test',
      memberPhoneNumber: '0900000000',
      itemCount: 2,
      bookTitles: ['Book A', 'Book B'],
      categories: ['Category A'],
      passwordHash: 'must-not-leak',
    }],
    total: 1,
  });

  const result = await adminService.listRequests({});

  expect(adminRepository.listRequests).toHaveBeenCalledWith({
    page: 1,
    limit: 20,
    q: undefined,
    status: undefined,
    from: undefined,
    to: undefined,
  });
  expect(result).toEqual({
    data: [{
      requestId: 25,
      requestDate: new Date('2026-07-19T08:00:00.000Z'),
      status: 'PENDING',
      member: {
        userId: 10,
        fullName: 'Member Name',
        email: 'member@example.test',
        phoneNumber: '0900000000',
      },
      itemCount: 2,
      bookTitles: ['Book A', 'Book B'],
      categories: ['Category A'],
    }],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  });
  expect(JSON.stringify(result)).not.toContain('passwordHash');
});

test('request list keeps the canonical zero-page result', async () => {
  adminRepository.listRequests.mockResolvedValue({ rows: [], total: 0 });

  await expect(adminService.listRequests({ page: 3, limit: 10 })).resolves.toEqual({
    data: [],
    pagination: { page: 3, limit: 10, total: 0, totalPages: 0 },
  });
});

// @spec BR-FE11-019, BR-FE11-026, FR-FE11-034, AC-FE11-019
test('request detail projects the explicit safe FE07 read DTO', async () => {
  borrowingRepository.findBorrowRequestById.mockResolvedValue({
    requestId: 25,
    requestDate: new Date('2026-07-19T08:00:00.000Z'),
    status: 'PENDING',
    createdAt: new Date('2026-07-19T08:00:00.000Z'),
    updatedAt: null,
    approvedAt: null,
    rejectedAt: null,
    processedAt: null,
    createdBy: 99,
    member: {
      userId: 10,
      memberId: 7,
      fullName: 'Member Name',
      email: 'member@example.test',
      phone: '0900000000',
      status: 'ACTIVE',
      passwordHash: 'must-not-leak',
    },
    details: [{
      borrowDetailId: 80,
      status: 'REQUESTED',
      copy: {
        copyId: 44,
        barcode: 'BC-0044',
        title: 'Book A',
        author: 'Author A',
        location: 'Shelf A',
        internalNote: 'must-not-leak',
      },
    }],
    auditMetadata: 'must-not-leak',
  });

  const result = await adminService.getRequestDetail(25);

  expect(result).toEqual({
    requestId: 25,
    requestDate: new Date('2026-07-19T08:00:00.000Z'),
    status: 'PENDING',
    createdAt: new Date('2026-07-19T08:00:00.000Z'),
    updatedAt: null,
    member: {
      userId: 10,
      memberId: 7,
      fullName: 'Member Name',
      email: 'member@example.test',
      phoneNumber: '0900000000',
      status: 'ACTIVE',
    },
    items: [{
      borrowDetailId: 80,
      copyId: 44,
      barcode: 'BC-0044',
      title: 'Book A',
      author: 'Author A',
      location: 'Shelf A',
      status: 'REQUESTED',
    }],
    lifecycle: { approvedAt: null, rejectedAt: null, processedAt: null },
  });
  expect(JSON.stringify(result)).not.toContain('must-not-leak');
});

test('missing request detail returns the canonical FE07 not-found error', async () => {
  borrowingRepository.findBorrowRequestById.mockResolvedValue(null);

  await expect(adminService.getRequestDetail(999)).rejects.toMatchObject({
    statusCode: 404,
    code: 'BORROW_REQUEST_NOT_FOUND',
  });
});
