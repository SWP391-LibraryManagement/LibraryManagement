function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeInMemoryReservationDependencies(authState, initialState = {}) {
  let nextReservationId = 1;
  const books = clone(
    initialState.books || [
      { bookId: 1, title: 'Clean Code', authorName: 'Robert C. Martin', status: 'ACTIVE' },
      { bookId: 2, title: 'Database System', authorName: 'Abraham Silberschatz', status: 'ACTIVE' },
    ]
  );
  const copies = clone(
    initialState.copies || [
      { copyId: 1, bookId: 1, barcode: 'BC1', status: 'BORROWED', location: 'A1' },
      { copyId: 2, bookId: 1, barcode: 'BC2', status: 'AVAILABLE', location: 'A1' },
      { copyId: 3, bookId: 1, barcode: 'BC3', status: 'BORROWED', location: 'A2' },
      { copyId: 4, bookId: 2, barcode: 'BC4', status: 'BORROWED', location: 'B1' },
      { copyId: 5, bookId: 2, barcode: 'BC5', status: 'BORROWED', location: 'B2' },
    ]
  );
  const reservations = [];
  const memberStatuses = new Map();

  function getUser(userId) {
    return authState.users.find((user) => user.userId === Number(userId)) || null;
  }

  function getCopy(copyId) {
    return copies.find((copy) => copy.copyId === Number(copyId)) || null;
  }

  function getBook(bookId) {
    return books.find((book) => book.bookId === Number(bookId)) || null;
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

  function mapReservation(reservation) {
    if (!reservation) {
      return null;
    }

    const user = getUser(reservation.userId);
    const copy = getCopy(reservation.copyId);

    return clone({
      reservationId: reservation.reservationId,
      userId: reservation.userId,
      copyId: reservation.copyId,
      reservedAt: reservation.reservedAt,
      queuePosition: reservation.queuePosition,
      expiresAt: reservation.expiresAt,
      notifiedAt: reservation.notifiedAt,
      cancelledAt: reservation.cancelledAt,
      status: reservation.status,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
      member: {
        userId: user?.userId || reservation.userId,
        username: user?.username || null,
        email: user?.email || null,
        status: user?.status || null,
      },
      copy: mapCopy(copy),
    });
  }

  const reservationRepository = {
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

    async findCopyById(copyId) {
      return clone(mapCopy(getCopy(copyId)));
    },

    async countActiveReservationsForUser(userId) {
      return reservations.filter(
        (reservation) =>
          reservation.userId === Number(userId) &&
          (reservation.status === 'ACTIVE' || reservation.status === 'NOTIFIED')
      ).length;
    },

    async findActiveReservationByUserAndCopy(userId, copyId) {
      return mapReservation(
        reservations.find(
          (reservation) =>
            reservation.userId === Number(userId) &&
            reservation.copyId === Number(copyId) &&
            (reservation.status === 'ACTIVE' || reservation.status === 'NOTIFIED')
        ) || null
      );
    },

    async findReservationById(reservationId) {
      return mapReservation(
        reservations.find((reservation) => reservation.reservationId === Number(reservationId)) ||
          null
      );
    },

    async listReservationCandidates({ q = '', page = 1, limit = 20 } = {}) {
      const normalizedQuery = String(q).trim().toLowerCase();
      const rows = copies
        .map((copy) => ({ copy, book: getBook(copy.bookId) }))
        .filter(({ copy, book }) => (
          book?.status === 'ACTIVE'
          && (copy.status === 'BORROWED' || copy.status === 'RESERVED')
        ))
        .filter(({ book }) => (
          !normalizedQuery
          || `${book.title} ${book.authorName || ''}`.toLowerCase().includes(normalizedQuery)
        ))
        .sort((left, right) => (
          left.book.title.localeCompare(right.book.title)
          || left.book.bookId - right.book.bookId
          || left.copy.copyId - right.copy.copyId
        ))
        .map(({ copy, book }) => ({
          copyId: copy.copyId,
          bookId: copy.bookId,
          title: book.title,
          authorName: book.authorName || null,
          copyStatus: copy.status,
          activeReservationCount: reservations.filter(
            (reservation) => reservation.copyId === copy.copyId && reservation.status === 'ACTIVE'
          ).length,
        }));

      const start = (Number(page) - 1) * Number(limit);
      return {
        rows: rows.slice(start, start + Number(limit)),
        total: rows.length,
      };
    },

    async createReservation({ userId, copyId }) {
      const queuePosition =
        reservations.filter(
          (reservation) =>
            reservation.copyId === Number(copyId) && reservation.status === 'ACTIVE'
        ).length + 1;
      const now = new Date();
      const reservation = {
        reservationId: nextReservationId,
        userId: Number(userId),
        copyId: Number(copyId),
        reservedAt: now,
        queuePosition,
        expiresAt: null,
        notifiedAt: null,
        cancelledAt: null,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: null,
      };

      nextReservationId += 1;
      reservations.push(reservation);
      return mapReservation(reservation);
    },

    async listReservations(filters = {}) {
      const filteredReservations = reservations
        .filter((reservation) => {
          const copy = getCopy(reservation.copyId);

          if (filters.userId && reservation.userId !== Number(filters.userId)) {
            return false;
          }

          if (filters.memberId && reservation.userId !== Number(filters.memberId)) {
            return false;
          }

          if (filters.bookId && copy?.bookId !== Number(filters.bookId)) {
            return false;
          }

          if (filters.status && reservation.status !== filters.status) {
            return false;
          }

          return true;
        })
        .sort(
          (left, right) =>
            new Date(left.reservedAt).getTime() - new Date(right.reservedAt).getTime() ||
            left.reservationId - right.reservationId
        );

      const page = Number(filters.page) || 1;
      const limit = Number(filters.limit) || 20;
      const start = (page - 1) * limit;
      return {
        rows: filteredReservations.slice(start, start + limit).map(mapReservation),
        total: filteredReservations.length,
      };
    },

    async cancelReservation(reservationId) {
      const reservation = reservations.find(
        (item) =>
          item.reservationId === Number(reservationId) &&
          (item.status === 'ACTIVE' || item.status === 'NOTIFIED')
      );

      if (!reservation) {
        return null;
      }

      reservation.status = 'CANCELLED';
      reservation.cancelledAt = new Date();
      reservation.updatedAt = new Date();

      if (reservation.notifiedAt) {
        const copy = getCopy(reservation.copyId);

        if (copy?.status === 'RESERVED') {
          copy.status = 'AVAILABLE';
          copy.updatedAt = new Date();
        }
      }

      return mapReservation(reservation);
    },

    async findNextActiveReservationForCopy(copyId) {
      const copy = getCopy(copyId);

      if (!copy || copy.status !== 'AVAILABLE') {
        return null;
      }

      const nextReservation = reservations
        .filter((reservation) => {
          const user = getUser(reservation.userId);

          return (
            reservation.copyId === Number(copyId) &&
            reservation.status === 'ACTIVE' &&
            user?.status === 'ACTIVE' &&
            memberStatuses.get(reservation.userId) === 'APPROVED'
          );
        })
        .sort(
          (left, right) =>
            new Date(left.reservedAt).getTime() - new Date(right.reservedAt).getTime() ||
            left.reservationId - right.reservationId
        )[0];

      return mapReservation(nextReservation || null);
    },

    async holdReservation({ reservationId, copyId, notifiedAt, expiresAt }) {
      const copy = getCopy(copyId);
      const reservation = reservations.find(
        (item) =>
          item.reservationId === Number(reservationId) &&
          item.copyId === Number(copyId) &&
          item.status === 'ACTIVE'
      );

      if (!copy || copy.status !== 'AVAILABLE' || !reservation) {
        return null;
      }

      reservation.status = 'NOTIFIED';
      reservation.notifiedAt = notifiedAt;
      reservation.expiresAt = expiresAt;
      reservation.queuePosition = 1;
      reservation.updatedAt = new Date();
      copy.status = 'RESERVED';
      copy.updatedAt = new Date();

      return mapReservation(reservation);
    },

    async expireOverdueHolds(now) {
      const reference = new Date(now).getTime();
      const expired = [];

      reservations.forEach((reservation) => {
        if (
          reservation.status === 'NOTIFIED' &&
          reservation.expiresAt &&
          new Date(reservation.expiresAt).getTime() < reference
        ) {
          reservation.status = 'EXPIRED';
          reservation.updatedAt = new Date();
          const copy = getCopy(reservation.copyId);
          if (copy && copy.status === 'RESERVED') {
            copy.status = 'AVAILABLE';
            copy.updatedAt = new Date();
          }
          expired.push({ reservationId: reservation.reservationId, copyId: reservation.copyId });
        }
      });

      return expired;
    },
  };

  return {
    reservationRepository,
    approveMember(userId) {
      memberStatuses.set(Number(userId), 'APPROVED');
    },
    setMemberStatus(userId, status) {
      memberStatuses.set(Number(userId), status);
    },
    state: {
      books,
      copies,
      reservations,
      memberStatuses,
    },
  };
}

module.exports = {
  makeInMemoryReservationDependencies,
};
