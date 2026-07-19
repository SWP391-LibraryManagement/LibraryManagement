function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const DEFAULT_BOOKS = [
  {
    bookId: 1,
    title: 'Clean Code',
    isbn: '9780132350884',
    status: 'ACTIVE',
    authorName: 'Robert C. Martin',
    categoryName: 'Programming',
  },
  {
    bookId: 2,
    title: 'Sapiens',
    isbn: '9780062316097',
    status: 'ACTIVE',
    authorName: 'Yuval Noah Harari',
    categoryName: 'History',
  },
  {
    bookId: 3,
    title: 'Inactive Reference',
    isbn: '9780000000003',
    status: 'INACTIVE',
    authorName: 'Archive Author',
    categoryName: 'Reference',
  },
];

const DEFAULT_COPIES = [
  {
    copyId: 1,
    bookId: 1,
    barcode: 'BC-001',
    status: 'AVAILABLE',
    location: 'A1',
    version: 'copy-v1',
    borrowerEmail: 'private.member@example.test',
    fineAmount: 5000,
    auditMetadata: 'protected-audit-metadata',
  },
  {
    copyId: 2,
    bookId: 1,
    barcode: 'BC-002',
    status: 'BORROWED',
    location: 'A2',
    version: 'copy-v2',
  },
  {
    copyId: 3,
    bookId: 2,
    barcode: 'BC-003',
    status: 'RESERVED',
    location: 'B1',
    version: 'copy-v3',
    reservationUserId: 99,
  },
  {
    copyId: 4,
    bookId: 3,
    barcode: 'BC-004',
    status: 'DAMAGED',
    location: 'C1',
    version: 'copy-v4',
  },
  {
    copyId: 5,
    bookId: 1,
    barcode: 'BC-005',
    status: 'INACTIVE',
    location: 'A5',
    version: 'copy-v5',
  },
];

function makeInMemoryInventoryDependencies(authDependencies, initialState = {}) {
  const books = clone(initialState.books || DEFAULT_BOOKS);
  const copies = clone(initialState.copies || DEFAULT_COPIES);
  const borrowDetails = clone(
    initialState.borrowDetails || [{ borrowDetailId: 1, copyId: 2, status: 'BORROWED' }]
  );
  const reservations = clone(
    initialState.reservations || [{ reservationId: 1, copyId: 3, status: 'ACTIVE' }]
  );
  let nextCopyId = Math.max(0, ...copies.map((copy) => copy.copyId)) + 1;
  let nextVersion = copies.length + 1;

  const control = {
    failAudit: false,
    listCalls: [],
  };

  function mapBook(book) {
    if (!book) return null;
    return clone(book);
  }

  function mapCopy(copy) {
    if (!copy) return null;
    return clone({
      ...copy,
      book: mapBook(books.find((book) => book.bookId === copy.bookId)),
    });
  }

  function advanceVersion(copy) {
    copy.version = `copy-v${nextVersion}`;
    nextVersion += 1;
  }

  const inventoryRepository = {
    async findBookById(bookId) {
      return mapBook(books.find((book) => book.bookId === Number(bookId)));
    },
    async findCopyById(copyId) {
      return mapCopy(copies.find((copy) => copy.copyId === Number(copyId)));
    },
    async findCopyByBarcode(barcode) {
      return mapCopy(copies.find((copy) => copy.barcode === barcode));
    },
    async listInventory(filters = {}) {
      control.listCalls.push(clone(filters));
      const filtered = copies
        .filter((copy) => {
          if (filters.bookId && copy.bookId !== Number(filters.bookId)) return false;
          if (filters.status && copy.status !== filters.status) return false;
          if (filters.barcode && !copy.barcode.includes(filters.barcode)) return false;
          if (filters.location && !String(copy.location || '').includes(filters.location)) return false;
          return true;
        })
        .sort((left, right) => {
          const leftTitle = books.find((book) => book.bookId === left.bookId)?.title || '';
          const rightTitle = books.find((book) => book.bookId === right.bookId)?.title || '';
          return leftTitle.localeCompare(rightTitle) || left.copyId - right.copyId;
        });
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      return {
        copies: filtered.slice((page - 1) * limit, page * limit).map(mapCopy),
        pagination: { page, limit, total: filtered.length },
      };
    },
    async countInventoryByStatus(filters = {}) {
      return copies
        .filter((copy) => {
          if (filters.bookId && copy.bookId !== Number(filters.bookId)) return false;
          if (filters.barcode && !copy.barcode.includes(filters.barcode)) return false;
          if (filters.location && !String(copy.location || '').includes(filters.location)) return false;
          return true;
        })
        .reduce((counts, copy) => {
          counts[copy.status] = (counts[copy.status] || 0) + 1;
          return counts;
        }, {});
    },
    async createCopy(input) {
      const copy = { copyId: nextCopyId, version: `copy-v${nextVersion}`, ...clone(input) };
      nextCopyId += 1;
      nextVersion += 1;
      copies.push(copy);
      return mapCopy(copy);
    },
    async updateCopy(copyId, patch) {
      const copy = copies.find((item) => item.copyId === Number(copyId));
      if (!copy) return null;
      Object.assign(copy, clone(patch));
      advanceVersion(copy);
      return mapCopy(copy);
    },
    async restoreCopy(copyId, snapshot) {
      const index = copies.findIndex((item) => item.copyId === Number(copyId));
      const restored = clone(snapshot);
      delete restored.book;
      if (index >= 0) copies[index] = restored;
      return mapCopy(copies[index]);
    },
    async removeCopy(copyId) {
      const index = copies.findIndex((item) => item.copyId === Number(copyId));
      if (index >= 0) copies.splice(index, 1);
    },
    async updateCopyStatus(copyId, status) {
      const copy = copies.find((item) => item.copyId === Number(copyId));
      if (!copy) return null;
      copy.status = status;
      advanceVersion(copy);
      return mapCopy(copy);
    },
    async hasActiveBorrow(copyId) {
      return borrowDetails.some(
        (detail) => detail.copyId === Number(copyId) && ['BORROWED', 'OVERDUE'].includes(detail.status)
      );
    },
    async hasActiveReservation(copyId) {
      return reservations.some(
        (reservation) => reservation.copyId === Number(copyId) && reservation.status === 'ACTIVE'
      );
    },
  };

  const auditLogRepository = {
    async create(entry) {
      if (control.failAudit) {
        throw new Error('Injected inventory audit failure');
      }
      return authDependencies.auditLogRepository.create(entry);
    },
  };

  function snapshot() {
    return clone({
      books,
      copies,
      borrowDetails,
      reservations,
      auditLogs: authDependencies.state.auditLogs,
    });
  }

  return {
    inventoryRepository,
    auditLogRepository,
    control,
    snapshot,
    state: { books, copies, borrowDetails, reservations },
  };
}

module.exports = {
  makeInMemoryInventoryDependencies,
};
