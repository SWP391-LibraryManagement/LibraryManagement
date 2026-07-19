function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function makeBarrier(expectedArrivals, label) {
  let arrivals = 0;
  let release;
  let reject;
  const barrier = new Promise((resolve, rejectPromise) => {
    release = resolve;
    reject = rejectPromise;
  });
  const timeout = setTimeout(() => {
    reject(new Error(`${label} expected ${expectedArrivals} concurrent arrivals.`));
  }, 2000);

  return async function waitAtBarrier() {
    arrivals += 1;
    if (arrivals === expectedArrivals) {
      clearTimeout(timeout);
      release();
    }
    await barrier;
  };
}

// In-memory doubles mirror the approved FE09 contract while allowing deterministic race injection.
function makeInMemoryFineDependencies(initialState = {}, options = {}) {
  const borrowDetails = clone(initialState.borrowDetails || []);
  const fines = clone(initialState.fines || []);
  let nextFineId = Math.max(9000, ...fines.map((fine) => Number(fine.fineId) || 0));
  const auditLogs = [];
  const listCalls = [];
  const auditControl = { failureAction: null };
  const waitForCreateChecks = options.synchronizeCreateChecks
    ? makeBarrier(2, 'Fine create barrier')
    : null;
  const waitForCollectionReads = options.synchronizeCollectionReads
    ? makeBarrier(2, 'Fine collection barrier')
    : null;

  function getDetail(borrowDetailId) {
    return borrowDetails.find((detail) => detail.borrowDetailId === Number(borrowDetailId)) || null;
  }

  const fineRepository = {
    async withTransaction(work) {
      const transaction = { kind: 'in-memory-fine-transaction', undo: [] };

      try {
        const result = await work(transaction);
        return result;
      } catch (error) {
        for (const undo of transaction.undo.reverse()) undo();
        throw error;
      }
    },

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

    async findLatestFineByBorrowDetail(borrowDetailId, reason) {
      return clone(
        fines
          .filter(
            (fine) =>
              fine.borrowDetailId === Number(borrowDetailId) && fine.reason === reason
          )
          .sort((left, right) => right.fineId - left.fineId)[0] || null
      );
    },

    async listFines({ q, userId, status, page = 1, limit = 20 } = {}) {
      listCalls.push(clone({ q, userId, status, page, limit }));
      const normalizedQuery = String(q || '').trim().toLowerCase();
      const rows = fines
        .filter((fine) => {
          if (userId && fine.userId !== Number(userId)) {
            return false;
          }
          if (status && fine.status !== status) {
            return false;
          }
          if (
            normalizedQuery &&
            ![
              fine.fineId,
              fine.reason,
              fine.bookTitle,
              fine.barcode,
              fine.member?.username,
              fine.member?.email,
              fine.member?.fullName,
            ].some((value) => String(value || '').toLowerCase().includes(normalizedQuery))
          ) {
            return false;
          }
          return true;
        })
        .sort((left, right) => left.fineId - right.fineId);
      const offset = (page - 1) * limit;

      return {
        rows: rows.slice(offset, offset + limit).map(clone),
        total: rows.length,
      };
    },

    async createFine({ userId, borrowDetailId, overdueDays, ratePerDay, amount, reason, createdBy, calculatedAt }, transaction) {
      if (waitForCreateChecks) {
        await waitForCreateChecks();
      }

      const existing = fines
        .filter(
          (fine) =>
            fine.borrowDetailId === Number(borrowDetailId) && fine.reason === reason
        )
        .sort((left, right) => {
          if (left.status === 'UNPAID' && right.status !== 'UNPAID') return -1;
          if (left.status !== 'UNPAID' && right.status === 'UNPAID') return 1;
          return right.fineId - left.fineId;
        })[0];

      if (existing) {
        if (existing.status !== 'UNPAID') {
          return { created: false, changed: false, fineId: existing.fineId };
        }

        const changed =
          existing.overdueDays !== overdueDays ||
          Number(existing.ratePerDay) !== Number(ratePerDay) ||
          Number(existing.amount) !== Number(amount);

        if (changed) {
          const before = clone(existing);
          existing.overdueDays = overdueDays;
          existing.ratePerDay = ratePerDay;
          existing.amount = amount;
          existing.calculatedAt = calculatedAt;
          existing.updatedAt = calculatedAt;
          transaction?.undo.push(() => Object.assign(existing, before));
        }

        return { created: false, changed, fineId: existing.fineId };
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
      const previousNextFineId = nextFineId - 1;
      transaction?.undo.push(() => {
        const index = fines.indexOf(fine);
        if (index >= 0) fines.splice(index, 1);
        nextFineId = previousNextFineId;
      });
      return { created: true, changed: true, fineId: fine.fineId };
    },

    async recordCollection({ fineId, paymentMethod, collectedBy, paidAt }, transaction) {
      const fine = fines.find((item) => item.fineId === Number(fineId));
      if (waitForCollectionReads) {
        await waitForCollectionReads();
      }

      if (!fine || fine.status !== 'UNPAID') {
        return null;
      }

      const before = clone(fine);
      fine.paidAmount = fine.amount;
      fine.paymentMethod = paymentMethod || null;
      fine.collectedBy = collectedBy ?? null;
      fine.status = 'PAID';
      fine.paidAt = paidAt;
      fine.updatedAt = new Date();
      transaction?.undo.push(() => Object.assign(fine, before));
      return clone(fine);
    },

    async markPaid({ fineId, collectedBy, paidAt, paymentMethod }, transaction) {
      const fine = fines.find((item) => item.fineId === Number(fineId) && item.status === 'UNPAID');
      if (!fine) {
        return null;
      }

      const before = clone(fine);
      fine.status = 'PAID';
      fine.paidAmount = fine.amount;
      fine.paidAt = paidAt;
      fine.collectedBy = collectedBy ?? null;
      fine.paymentMethod = paymentMethod || null;
      fine.updatedAt = new Date();
      transaction?.undo.push(() => Object.assign(fine, before));
      return clone(fine);
    },

    async resolveFine({ fineId, status }, transaction) {
      const fine = fines.find((item) => item.fineId === Number(fineId) && item.status === 'UNPAID');
      if (!fine) {
        return null;
      }

      const before = clone(fine);
      fine.status = status;
      fine.paidAmount = 0;
      fine.paidAt = null;
      fine.collectedBy = null;
      fine.paymentMethod = null;
      fine.updatedAt = new Date();
      transaction?.undo.push(() => Object.assign(fine, before));
      return clone(fine);
    },
  };

  const auditLogRepository = {
    async create(entry) {
      if (auditControl.failureAction === entry.action) {
        throw new Error(`injected ${entry.action} audit failure`);
      }
      const storedEntry = { ...entry };
      delete storedEntry.transaction;
      auditLogs.push(storedEntry);
      entry.transaction?.undo.push(() => {
        const index = auditLogs.indexOf(storedEntry);
        if (index >= 0) auditLogs.splice(index, 1);
      });
      return storedEntry;
    },
  };

  return {
    fineRepository,
    auditLogRepository,
    state: { borrowDetails, fines, auditLogs, listCalls, auditControl },
  };
}

module.exports = {
  makeInMemoryFineDependencies,
};
