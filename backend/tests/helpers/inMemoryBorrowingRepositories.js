function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeInMemoryBorrowingDependencies(authState, initialState = {}) {
  let nextRequestId = 1;
  let nextDetailId = 1;
  const books = clone(initialState.books || [{ bookId: 1, title: 'Clean Code' }]);
  const copies = clone(
    initialState.copies || [
      { copyId: 1, bookId: 1, barcode: 'BC1', status: 'AVAILABLE', location: 'A1' },
      { copyId: 2, bookId: 1, barcode: 'BC2', status: 'AVAILABLE', location: 'A1' },
      { copyId: 3, bookId: 1, barcode: 'BC3', status: 'BORROWED', location: 'A2' },
      { copyId: 4, bookId: 1, barcode: 'BC4', status: 'AVAILABLE', location: 'A3' },
      { copyId: 5, bookId: 1, barcode: 'BC5', status: 'AVAILABLE', location: 'A4' },
      { copyId: 6, bookId: 1, barcode: 'BC6', status: 'AVAILABLE', location: 'A5' },
      { copyId: 7, bookId: 1, barcode: 'BC7', status: 'AVAILABLE', location: 'A6' },
    ]
  );
  const borrowRequests = [];
  const borrowDetails = [];
  const fines = [];
  const reservations = clone(initialState.reservations || []);
  const memberStatuses = new Map();

  function getUser(userId) {
    return authState.users.find((user) => user.userId === Number(userId)) || null;
  }

  function getBook(bookId) {
    return books.find((book) => book.bookId === Number(bookId)) || null;
  }

  function getCopy(copyId) {
    return copies.find((copy) => copy.copyId === Number(copyId)) || null;
  }

  function mapCopy(copy) {
    if (!copy) {
      return null;
    }

    const book = getBook(copy.bookId);

    return {
      copyId: copy.copyId,
      bookId: copy.bookId,
      barcode: copy.barcode,
      status: copy.status,
      location: copy.location,
      title: book?.title || null,
    };
  }

  function mapMember(userId) {
    const user = getUser(userId);

    return {
      userId,
      username: user?.username || null,
      email: user?.email || null,
      status: user?.status || null,
    };
  }

  function mapDetail(detail) {
    if (!detail) {
      return null;
    }

    return clone({
      borrowDetailId: detail.borrowDetailId,
      requestId: detail.requestId,
      userId: detail.userId,
      copyId: detail.copyId,
      borrowDate: detail.borrowDate,
      dueDate: detail.dueDate,
      returnDate: detail.returnDate,
      renewalCount: detail.renewalCount,
      status: detail.status,
      createdAt: detail.createdAt,
      updatedAt: detail.updatedAt,
      member: mapMember(detail.userId),
      copy: mapCopy(getCopy(detail.copyId)),
    });
  }

  function mapRequest(request) {
    if (!request) {
      return null;
    }

    return clone({
      requestId: request.requestId,
      userId: request.userId,
      requestDate: request.requestDate,
      status: request.status,
      createdBy: request.createdBy,
      approvedBy: request.approvedBy,
      approvedAt: request.approvedAt,
      rejectedAt: request.rejectedAt,
      processedAt: request.processedAt,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      member: mapMember(request.userId),
      details: borrowDetails
        .filter((detail) => detail.requestId === request.requestId)
        .map(mapDetail),
    });
  }

  const borrowingRepository = {
    async getMemberEligibility(userId) {
      const user = getUser(userId);

      if (!user) {
        return null;
      }

      return clone({
        userId: user.userId,
        userStatus: user.status,
        email: user.email,
        memberStatus: memberStatuses.get(Number(userId)) || null,
        approvedAt: memberStatuses.get(Number(userId)) === 'APPROVED' ? new Date() : null,
      });
    },

    async findCopiesByIds(copyIds) {
      return copyIds.map((copyId) => mapCopy(getCopy(copyId))).filter(Boolean);
    },

    async countActiveBorrowedCopies(userId) {
      return borrowDetails.filter(
        (detail) =>
          detail.userId === Number(userId) &&
          (detail.status === 'BORROWED' || detail.status === 'OVERDUE')
      ).length;
    },

    async hasBlockingFine(userId) {
      return fines.some(
        (fine) => fine.userId === Number(userId) && fine.status === 'UNPAID' && fine.amount > 0
      );
    },

    async hasOverdueActiveLoans(userId, today) {
      const todayTime = new Date(today).setHours(0, 0, 0, 0);

      return borrowDetails.some(
        (detail) =>
          detail.userId === Number(userId) &&
          detail.status === 'BORROWED' &&
          detail.dueDate &&
          new Date(detail.dueDate).setHours(0, 0, 0, 0) < todayTime
      );
    },

    async hasReservationConflict(copyId, userId) {
      return reservations.some(
        (reservation) =>
          reservation.copyId === Number(copyId) &&
          reservation.userId !== Number(userId) &&
          reservation.status === 'ACTIVE'
      );
    },

    async findBorrowRequestById(requestId) {
      return mapRequest(
        borrowRequests.find((request) => request.requestId === Number(requestId)) || null
      );
    },

    async findBorrowDetailById(borrowDetailId) {
      return mapDetail(
        borrowDetails.find((detail) => detail.borrowDetailId === Number(borrowDetailId)) || null
      );
    },

    async createBorrowRequest({ userId, copyIds }) {
      const now = new Date();
      const borrowRequest = {
        requestId: nextRequestId,
        userId: Number(userId),
        requestDate: now,
        status: 'PENDING',
        createdBy: Number(userId),
        approvedBy: null,
        approvedAt: null,
        rejectedAt: null,
        processedAt: null,
        createdAt: now,
        updatedAt: null,
      };

      nextRequestId += 1;
      borrowRequests.push(borrowRequest);

      for (const copyId of copyIds) {
        borrowDetails.push({
          borrowDetailId: nextDetailId,
          requestId: borrowRequest.requestId,
          userId: Number(userId),
          copyId: Number(copyId),
          borrowDate: null,
          dueDate: null,
          returnDate: null,
          renewalCount: 0,
          status: 'REQUESTED',
          createdAt: now,
          updatedAt: null,
        });
        nextDetailId += 1;
      }

      return mapRequest(borrowRequest);
    },

    async listBorrowRequests(filters = {}) {
      return borrowRequests
        .filter((request) => {
          if (filters.userId && request.userId !== Number(filters.userId)) {
            return false;
          }

          if (filters.memberId && request.userId !== Number(filters.memberId)) {
            return false;
          }

          if (filters.status && request.status !== filters.status) {
            return false;
          }

          return true;
        })
        .sort((left, right) => right.requestId - left.requestId)
        .map(mapRequest);
    },

    async listBorrowDetails(filters = {}) {
      return borrowDetails
        .filter((detail) => {
          if (filters.userId && detail.userId !== Number(filters.userId)) {
            return false;
          }

          if (filters.status && detail.status !== filters.status) {
            return false;
          }

          return true;
        })
        .sort((left, right) => right.borrowDetailId - left.borrowDetailId)
        .map(mapDetail);
    },

    async approveBorrowRequest({ requestId, approvedBy, approvalDate, dueDate }) {
      const request = borrowRequests.find(
        (item) => item.requestId === Number(requestId) && item.status === 'PENDING'
      );

      if (!request) {
        return null;
      }

      const details = borrowDetails.filter((detail) => detail.requestId === request.requestId);

      if (details.some((detail) => getCopy(detail.copyId)?.status !== 'AVAILABLE')) {
        return null;
      }

      request.status = 'APPROVED';
      request.approvedBy = Number(approvedBy);
      request.approvedAt = approvalDate;
      request.processedAt = approvalDate;
      request.updatedAt = new Date();

      for (const detail of details) {
        detail.status = 'BORROWED';
        detail.borrowDate = approvalDate;
        detail.dueDate = dueDate;
        detail.updatedAt = new Date();
        getCopy(detail.copyId).status = 'BORROWED';
      }

      return mapRequest(request);
    },

    async rejectBorrowRequest({ requestId, rejectedBy }) {
      const request = borrowRequests.find(
        (item) => item.requestId === Number(requestId) && item.status === 'PENDING'
      );

      if (!request) {
        return null;
      }

      request.status = 'REJECTED';
      request.approvedBy = Number(rejectedBy);
      request.rejectedAt = new Date();
      request.processedAt = new Date();
      request.updatedAt = new Date();

      return mapRequest(request);
    },

    async returnBorrowDetail({ borrowDetailId, detailStatus, copyStatus, returnDate }) {
      const detail = borrowDetails.find(
        (item) => item.borrowDetailId === Number(borrowDetailId) && item.status === 'BORROWED'
      );

      if (!detail) {
        return null;
      }

      detail.status = detailStatus;
      detail.returnDate = returnDate;
      detail.updatedAt = new Date();
      getCopy(detail.copyId).status = copyStatus;

      const requestDetails = borrowDetails.filter((item) => item.requestId === detail.requestId);
      const allTerminal = requestDetails.every((item) =>
        ['RETURNED', 'LOST', 'DAMAGED'].includes(item.status)
      );

      if (allTerminal) {
        const request = borrowRequests.find((item) => item.requestId === detail.requestId);
        request.status = 'COMPLETED';
        request.updatedAt = new Date();
      }

      return mapDetail(detail);
    },

    async renewBorrowDetail({ borrowDetailId, newDueDate }) {
      const detail = borrowDetails.find(
        (item) => item.borrowDetailId === Number(borrowDetailId) && item.status === 'BORROWED'
      );

      if (!detail) {
        return null;
      }

      detail.dueDate = newDueDate;
      detail.renewalCount += 1;
      detail.updatedAt = new Date();

      return mapDetail(detail);
    },
  };

  return {
    borrowingRepository,
    approveMember(userId) {
      memberStatuses.set(Number(userId), 'APPROVED');
    },
    setMemberStatus(userId, status) {
      memberStatuses.set(Number(userId), status);
    },
    state: {
      books,
      copies,
      borrowRequests,
      borrowDetails,
      fines,
      reservations,
      memberStatuses,
    },
  };
}

module.exports = {
  makeInMemoryBorrowingDependencies,
};
