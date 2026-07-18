const { createBorrowingService } = require('../src/services/borrowingService');

describe('FE05 parent-book status integration with FE07 borrowing', () => {
  test('an inactive book cannot receive a new borrow request even when its copy is available', async () => {
    const repository = {
      getMemberEligibility: jest.fn(async () => ({ userStatus: 'ACTIVE', memberStatus: 'APPROVED' })),
      hasBlockingFine: jest.fn(async () => false),
      hasOverdueActiveLoans: jest.fn(async () => false),
      countActiveBorrowedCopies: jest.fn(async () => 0),
      findBorrowabilityByCopyIds: jest.fn(async () => [{
        copyId: 10,
        status: 'AVAILABLE',
        bookStatus: 'INACTIVE',
        hasActiveReservation: false,
      }]),
      createBorrowRequest: jest.fn(),
    };
    const service = createBorrowingService({
      borrowingRepository: repository,
      auditLogRepository: { create: jest.fn() },
      notificationService: { createSourceNotificationRequester: jest.fn(() => ({ createNotificationRequest: jest.fn() })) },
      clock: () => new Date('2026-07-18T00:00:00.000Z'),
    });

    await expect(service.createBorrowRequest(
      { copyIds: [10] },
      { userId: 5, roles: ['MEMBER'] },
      {}
    )).rejects.toMatchObject({ statusCode: 409, code: 'BOOK_INACTIVE' });
    expect(repository.createBorrowRequest).not.toHaveBeenCalled();
  });
});
