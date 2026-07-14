function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function toDateOnly(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : null;
}

function toExclusiveNextDay(value) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + 1);
  return date;
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
  const memberApprovedAt = new Map();

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
      borrowDate: toDateOnly(detail.borrowDate),
      dueDate: toDateOnly(detail.dueDate),
      returnDate: toDateOnly(detail.returnDate),
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

  function snapshotMutationState() {
    return {
      nextRequestId,
      nextDetailId,
      copies: copies.map((copy) => ({ ...copy })),
      borrowRequests: borrowRequests.map((request) => ({ ...request })),
      borrowDetails: borrowDetails.map((detail) => ({ ...detail })),
      reservations: reservations.map((reservation) => ({ ...reservation })),
      auditLogs: authState.auditLogs.map((entry) => ({ ...entry })),
    };
  }

  function restoreMutationState(snapshot) {
    nextRequestId = snapshot.nextRequestId;
    nextDetailId = snapshot.nextDetailId;
    copies.splice(0, copies.length, ...snapshot.copies);
    borrowRequests.splice(0, borrowRequests.length, ...snapshot.borrowRequests);
    borrowDetails.splice(0, borrowDetails.length, ...snapshot.borrowDetails);
    reservations.splice(0, reservations.length, ...snapshot.reservations);
    authState.auditLogs.splice(0, authState.auditLogs.length, ...snapshot.auditLogs);
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
        approvedAt: memberApprovedAt.get(Number(userId)) || null,
      });
    },

    async findBorrowabilityByCopyIds(copyIds, userId) {
      return copyIds
        .map((copyId) => {
          const copy = mapCopy(getCopy(copyId));

          if (!copy) {
            return null;
          }

          const activeReservation = reservations
            .filter(
              (reservation) =>
                reservation.copyId === Number(copyId) && reservation.status === 'ACTIVE'
            )
            .sort(
              (left, right) =>
                new Date(left.reservedAt) - new Date(right.reservedAt) ||
                left.reservationId - right.reservationId
            )[0];
          const notifiedReservation = reservations
            .filter(
              (reservation) =>
                reservation.copyId === Number(copyId) && reservation.status === 'NOTIFIED'
            )
            .sort(
              (left, right) =>
                new Date(left.notifiedAt) - new Date(right.notifiedAt) ||
                left.reservationId - right.reservationId
            )[0];

          return {
            ...copy,
            hasActiveReservation: Boolean(activeReservation),
            notifiedReservationId: notifiedReservation?.reservationId || null,
            notifiedReservationUserId: notifiedReservation?.userId || null,
          };
        })
        .filter(Boolean);
    },

    async countActiveBorrowedCopies(userId) {
      return borrowDetails.filter(
        (detail) => detail.userId === Number(userId) && detail.status === 'BORROWED'
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

    async createBorrowRequest({ userId, copyIds, auditLogRepository, auditEntry }) {
      const snapshot = snapshotMutationState();

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

      if (auditLogRepository && auditEntry) {
        try {
          await auditLogRepository.create({
            ...auditEntry,
            targetId: auditEntry.targetId ?? borrowRequest.requestId,
          });
        } catch (error) {
          restoreMutationState(snapshot);
          throw error;
        }
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

          const requestDate = new Date(request.requestDate);

          if (filters.fromDate && requestDate < new Date(filters.fromDate)) {
            return false;
          }

          if (filters.toDate && requestDate >= toExclusiveNextDay(filters.toDate)) {
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

          if (filters.status === 'OVERDUE') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (
              detail.status !== 'BORROWED' ||
              !detail.dueDate ||
              new Date(detail.dueDate) >= today
            ) {
              return false;
            }
          } else if (filters.status && detail.status !== filters.status) {
            return false;
          }

          const borrowRequest = borrowRequests.find(
            (request) => request.requestId === detail.requestId
          );
          const requestDate = new Date(borrowRequest.requestDate);

          if (filters.fromDate && requestDate < new Date(filters.fromDate)) {
            return false;
          }

          if (filters.toDate && requestDate >= toExclusiveNextDay(filters.toDate)) {
            return false;
          }

          return true;
        })
        .sort((left, right) => right.borrowDetailId - left.borrowDetailId)
        .map(mapDetail);
    },

    async approveBorrowRequest({
      requestId,
      approvedBy,
      approvalDate,
      dueDate,
      auditLogRepository,
      auditEntry,
    }) {
      const snapshot = snapshotMutationState();

      const request = borrowRequests.find(
        (item) => item.requestId === Number(requestId) && item.status === 'PENDING'
      );

      if (!request) {
        return { outcome: 'REQUEST_NOT_APPROVABLE' };
      }

      const member = getUser(request.userId);
      if (!member || !memberStatuses.has(request.userId)) {
        return { outcome: 'REQUEST_NOT_APPROVABLE' };
      }

      if (member.status !== 'ACTIVE') {
        return { outcome: 'MEMBER_ACCOUNT_INACTIVE' };
      }

      if (memberStatuses.get(request.userId) !== 'APPROVED') {
        return { outcome: 'MEMBERSHIP_NOT_APPROVED' };
      }

      if (await this.hasBlockingFine(request.userId)) {
        return { outcome: 'UNPAID_FINE_BLOCKS_BORROWING' };
      }

      if (await this.hasOverdueActiveLoans(request.userId, approvalDate)) {
        return { outcome: 'OVERDUE_LOAN_BLOCKS_BORROWING' };
      }

      const requestedDetails = borrowDetails.filter(
        (detail) => detail.requestId === request.requestId && detail.status === 'REQUESTED'
      );

      if (!requestedDetails.length) {
        return { outcome: 'REQUEST_NOT_APPROVABLE' };
      }

      if (requestedDetails.some((detail) => getCopy(detail.copyId)?.status !== 'AVAILABLE')) {
        return { outcome: 'COPY_NOT_AVAILABLE' };
      }

      const activeCount = borrowDetails.filter(
        (detail) => detail.userId === request.userId && detail.status === 'BORROWED'
      ).length;

      if (activeCount + requestedDetails.length > 5) {
        return { outcome: 'BORROW_LIMIT_EXCEEDED' };
      }

      request.status = 'APPROVED';
      request.approvedBy = Number(approvedBy);
      request.approvedAt = approvalDate;
      request.processedAt = approvalDate;
      request.updatedAt = new Date();

      for (const detail of requestedDetails) {
        detail.status = 'BORROWED';
        detail.borrowDate = approvalDate;
        detail.dueDate = dueDate;
        detail.updatedAt = new Date();
        getCopy(detail.copyId).status = 'BORROWED';
      }

      if (auditLogRepository && auditEntry) {
        try {
          await auditLogRepository.create(auditEntry);
        } catch (error) {
          restoreMutationState(snapshot);
          throw error;
        }
      }

      return { outcome: 'APPROVED', borrowRequest: mapRequest(request) };
    },

    async rejectBorrowRequest({ requestId, rejectedBy, auditLogRepository, auditEntry }) {
      const snapshot = snapshotMutationState();
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

      if (auditLogRepository && auditEntry) {
        try {
          await auditLogRepository.create(auditEntry);
        } catch (error) {
          restoreMutationState(snapshot);
          throw error;
        }
      }

      return mapRequest(request);
    },

    async returnBorrowDetail({
      borrowDetailId,
      detailStatus,
      copyStatus,
      returnDate,
      auditLogRepository,
      auditEntry,
    }) {
      const snapshot = snapshotMutationState();

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

      if (auditLogRepository && auditEntry) {
        try {
          await auditLogRepository.create(auditEntry);
        } catch (error) {
          restoreMutationState(snapshot);
          throw error;
        }
      }

      return mapDetail(detail);
    },

    async renewBorrowDetail({ borrowDetailId, newDueDate, auditLogRepository, auditEntry }) {
      const snapshot = snapshotMutationState();
      const detail = borrowDetails.find(
        (item) =>
          item.borrowDetailId === Number(borrowDetailId) &&
          item.status === 'BORROWED' &&
          item.renewalCount < 1
      );

      if (!detail) {
        return null;
      }

      detail.dueDate = newDueDate;
      detail.renewalCount += 1;
      detail.updatedAt = new Date();

      if (auditLogRepository && auditEntry) {
        try {
          await auditLogRepository.create(auditEntry);
        } catch (error) {
          restoreMutationState(snapshot);
          throw error;
        }
      }

      return mapDetail(detail);
    },
  };

  return {
    borrowingRepository,
    approveMember(userId, approvedAt = new Date()) {
      const normalizedUserId = Number(userId);
      memberStatuses.set(normalizedUserId, 'APPROVED');
      memberApprovedAt.set(normalizedUserId, new Date(approvedAt));
    },
    setMemberStatus(userId, status) {
      const normalizedUserId = Number(userId);
      memberStatuses.set(normalizedUserId, status);
      if (status !== 'APPROVED') {
        memberApprovedAt.delete(normalizedUserId);
      }
    },
    state: {
      books,
      copies,
      borrowRequests,
      borrowDetails,
      fines,
      reservations,
      memberStatuses,
      memberApprovedAt,
    },
  };
}

module.exports = {
  makeInMemoryBorrowingDependencies,
};
