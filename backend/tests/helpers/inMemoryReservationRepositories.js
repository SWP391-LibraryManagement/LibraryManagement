function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeInMemoryReservationDependencies(authState, initialState = {}) {
  let nextReservationId = 1;
  const books = clone(
    initialState.books || [
      { bookId: 1, title: 'Clean Code' },
      { bookId: 2, title: 'Database System' },
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
          reservation.userId === Number(userId) && reservation.status === 'ACTIVE'
      ).length;
    },

    async findActiveReservationByUserAndCopy(userId, copyId) {
      return mapReservation(
        reservations.find(
          (reservation) =>
            reservation.userId === Number(userId) &&
            reservation.copyId === Number(copyId) &&
            reservation.status === 'ACTIVE'
        ) || null
      );
    },

    async findReservationById(reservationId) {
      return mapReservation(
        reservations.find((reservation) => reservation.reservationId === Number(reservationId)) ||
          null
      );
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
            new Date(right.reservedAt).getTime() - new Date(left.reservedAt).getTime() ||
            right.reservationId - left.reservationId
        );

      return filteredReservations.map(mapReservation);
    },

    async cancelReservation(reservationId) {
      const reservation = reservations.find(
        (item) => item.reservationId === Number(reservationId) && item.status === 'ACTIVE'
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

      reservation.notifiedAt = notifiedAt;
      reservation.expiresAt = expiresAt;
      reservation.queuePosition = 1;
      reservation.updatedAt = new Date();
      copy.status = 'RESERVED';
      copy.updatedAt = new Date();

      return mapReservation(reservation);
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
