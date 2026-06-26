function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

// In-memory doubles for the FE09 server-side fine repository + audit log, mirroring the SQL behaviour
// (duplicate prevention, PAID-iff-fully-collected, terminal-state guards) without a database.
function makeInMemoryFineDependencies(initialState = {}) {
  let nextFineId = 9000;
  const borrowDetails = clone(initialState.borrowDetails || []);
  const fines = clone(initialState.fines || []);
  const auditLogs = [];

  function getDetail(borrowDetailId) {
    return borrowDetails.find((detail) => detail.borrowDetailId === Number(borrowDetailId)) || null;
  }

  const fineRepository = {
    async getBorrowDetailForFine(borrowDetailId) {
      return clone(getDetail(borrowDetailId));
    },

    async findActiveFineByBorrowDetail(borrowDetailId, reason) {
      return clone(
        fines.find(
          (fine) =>
            fine.borrowDetailId === Number(borrowDetailId) &&
            fine.reason === reason &&
            fine.status === 'UNPAID'
        ) || null
      );
    },

    async findFineById(fineId) {
      return clone(fines.find((fine) => fine.fineId === Number(fineId)) || null);
    },

    async listFines({ userId, status } = {}) {
      return fines
        .filter((fine) => {
          if (userId && fine.userId !== Number(userId)) {
            return false;
          }
          if (status && fine.status !== status) {
            return false;
          }
          return true;
        })
        .sort((left, right) => right.fineId - left.fineId)
        .map(clone);
    },

    async createFine({ userId, borrowDetailId, overdueDays, ratePerDay, amount, reason, createdBy, calculatedAt }) {
      const duplicate = fines.find(
        (fine) =>
          fine.borrowDetailId === Number(borrowDetailId) &&
          fine.reason === reason &&
          fine.status === 'UNPAID'
      );

      if (duplicate) {
        return { created: false, fineId: duplicate.fineId };
      }

      nextFineId += 1;
      const fine = {
        fineId: nextFineId,
        userId: Number(userId),
        borrowDetailId: Number(borrowDetailId),
        overdueDays,
        ratePerDay,
        amount,
        paidAmount: 0,
        reason,
        status: 'UNPAID',
        calculatedAt,
        paidAt: null,
        createdBy: createdBy ?? null,
        collectedBy: null,
        paymentMethod: null,
        createdAt: calculatedAt,
        updatedAt: null,
        member: { userId: Number(userId), username: null, email: null },
      };
      fines.push(fine);
      return { created: true, fineId: fine.fineId };
    },

    async recordCollection({ fineId, collectedAmount, paymentMethod, collectedBy, paidAt }) {
      const fine = fines.find((item) => item.fineId === Number(fineId) && item.status === 'UNPAID');
      if (!fine) {
        return null;
      }

      const fullyCollected = Number(collectedAmount) >= Number(fine.amount);
      fine.paidAmount = Number(collectedAmount);
      fine.paymentMethod = paymentMethod || null;
      fine.collectedBy = collectedBy ?? null;
      fine.status = fullyCollected ? 'PAID' : 'UNPAID';
      fine.paidAt = fullyCollected ? paidAt : null;
      fine.updatedAt = new Date();
      return clone(fine);
    },

    async markPaid({ fineId, collectedBy, paidAt, paymentMethod }) {
      const fine = fines.find((item) => item.fineId === Number(fineId) && item.status === 'UNPAID');
      if (!fine) {
        return null;
      }

      fine.status = 'PAID';
      fine.paidAmount = fine.amount;
      fine.paidAt = paidAt;
      fine.collectedBy = collectedBy ?? null;
      fine.paymentMethod = paymentMethod || null;
      fine.updatedAt = new Date();
      return clone(fine);
    },

    async resolveFine({ fineId, status }) {
      const fine = fines.find((item) => item.fineId === Number(fineId) && item.status === 'UNPAID');
      if (!fine) {
        return null;
      }

      fine.status = status;
      fine.updatedAt = new Date();
      return clone(fine);
    },
  };

  const auditLogRepository = {
    async create(entry) {
      auditLogs.push(entry);
      return entry;
    },
  };

  return {
    fineRepository,
    auditLogRepository,
    state: { borrowDetails, fines, auditLogs },
  };
}

module.exports = {
  makeInMemoryFineDependencies,
};
