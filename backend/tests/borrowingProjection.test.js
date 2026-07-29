const sampleRow = {
  RequestId: 56,
  UserId: 7,
  RequestDate: '2026-07-27',
  RequestStatus: 'APPROVED',
  CreatedBy: 7,
  ApprovedBy: 3,
  ApprovedAt: '2026-07-27T08:00:00.000Z',
  RejectedAt: null,
  ProcessedAt: '2026-07-27T08:00:00.000Z',
  RequestCreatedAt: '2026-07-27T07:00:00.000Z',
  RequestUpdatedAt: '2026-07-27T08:00:00.000Z',
  Username: 'member.demo',
  FullName: 'Demo Member',
  Email: 'member@example.com',
  Phone: '0900000000',
  MemberId: 17,
  UserStatus: 'ACTIVE',
  HasMemberRole: 1,
  BorrowDetailId: 91,
  CopyId: 24,
  BorrowDate: '2026-07-27T00:00:00.000Z',
  DueDate: '2026-08-10T00:00:00.000Z',
  ReturnDate: null,
  RenewalCount: 0,
  DetailStatus: 'BORROWED',
  DetailCreatedAt: '2026-07-27T08:00:00.000Z',
  DetailUpdatedAt: '2026-07-27T08:00:00.000Z',
  BookId: 11,
  Barcode: 'COPY-024',
  CopyStatus: 'BORROWED',
  BookStatus: 'ACTIVE',
  Location: 'A-01',
  Title: 'Clean Architecture',
  AuthorName: 'Robert C. Martin',
};

describe('borrowingProjection', () => {
  test('maps borrowability without leaking database column names', () => {
    const { mapBorrowability } = require('../src/utils/borrowingProjection');

    expect(
      mapBorrowability({
        ...sampleRow,
        ActiveReservationId: 40,
        NotifiedReservationId: 41,
        NotifiedReservationUserId: 9,
      })
    ).toEqual({
      copyId: 24,
      bookId: 11,
      barcode: 'COPY-024',
      status: 'BORROWED',
      bookStatus: 'ACTIVE',
      location: 'A-01',
      title: 'Clean Architecture',
      author: 'Robert C. Martin',
      hasActiveReservation: true,
      notifiedReservationId: 41,
      notifiedReservationUserId: 9,
    });
  });

  test('groups request rows and maps nested details', () => {
    const { mapBorrowRequests } = require('../src/utils/borrowingProjection');

    expect(mapBorrowRequests([sampleRow, { ...sampleRow, BorrowDetailId: null, CopyId: null }])).toEqual([
      expect.objectContaining({
        requestId: 56,
        userId: 7,
        status: 'APPROVED',
        member: expect.objectContaining({
          userId: 7,
          memberId: 17,
          hasMemberRole: true,
        }),
        details: [
          expect.objectContaining({
            borrowDetailId: 91,
            borrowDate: '2026-07-27',
            dueDate: '2026-08-10',
            returnDate: null,
            status: 'BORROWED',
          }),
        ],
      }),
    ]);
  });

  test('converts the inclusive upper bound to the next UTC day', () => {
    const { toExclusiveNextDay } = require('../src/utils/borrowingProjection');

    expect(toExclusiveNextDay('2026-07-31T23:30:00-05:00').toISOString()).toBe(
      '2026-08-02T04:30:00.000Z'
    );
  });
});
