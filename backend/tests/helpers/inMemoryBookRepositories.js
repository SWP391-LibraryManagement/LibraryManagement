function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Programming', status: 'ACTIVE' },
  { id: 2, name: 'History', status: 'ACTIVE' },
  { id: 3, name: 'Archived', status: 'INACTIVE' },
];

const DEFAULT_AUTHORS = [
  { id: 1, name: 'Robert C. Martin', status: 'ACTIVE' },
  { id: 2, name: 'Yuval Noah Harari', status: 'ACTIVE' },
  { id: 3, name: 'Inactive Author', status: 'INACTIVE' },
];

const DEFAULT_PUBLISHERS = [
  { id: 1, name: 'Prentice Hall', status: 'ACTIVE' },
  { id: 2, name: 'Harper', status: 'ACTIVE' },
  { id: 3, name: 'Inactive Publisher', status: 'INACTIVE' },
];

const DEFAULT_BOOKS = [
  {
    id: 1,
    title: 'Clean Code',
    isbn: '9780132350884',
    categoryId: 1,
    authorId: 1,
    publisherId: 1,
    year: 2008,
    pages: 464,
    rating: 4.7,
    description: 'A handbook of agile software craftsmanship.',
    cover: '/covers/clean-code.jpg',
    status: 'ACTIVE',
    version: 'book-v1',
    internalNotes: 'staff-only acquisition note',
  },
  {
    id: 2,
    title: 'Sapiens',
    isbn: '9780062316097',
    categoryId: 2,
    authorId: 2,
    publisherId: 2,
    year: 2015,
    pages: 498,
    rating: 4.5,
    description: 'A brief history of humankind.',
    cover: '/covers/sapiens.jpg',
    status: 'ACTIVE',
    version: 'book-v2',
  },
  {
    id: 3,
    title: 'Inactive Catalog Record',
    isbn: '9780000000003',
    categoryId: 1,
    authorId: 1,
    publisherId: null,
    year: 2001,
    pages: 120,
    rating: 3.5,
    description: 'Hidden from public catalog.',
    cover: '/covers/inactive.jpg',
    status: 'INACTIVE',
    version: 'book-v3',
  },
];

const DEFAULT_COPIES = [
  { copyId: 1, bookId: 1, barcode: 'BOOK-1-A', status: 'AVAILABLE' },
  { copyId: 2, bookId: 1, barcode: 'BOOK-1-D', status: 'DAMAGED' },
  { copyId: 3, bookId: 2, barcode: 'BOOK-2-B', status: 'BORROWED' },
  { copyId: 4, bookId: 2, barcode: 'BOOK-2-R', status: 'RESERVED' },
  { copyId: 5, bookId: 3, barcode: 'BOOK-3-A', status: 'AVAILABLE' },
];

function makeInMemoryBookDependencies(authDependencies, initialState = {}) {
  const categories = clone(initialState.categories || DEFAULT_CATEGORIES);
  const authors = clone(initialState.authors || DEFAULT_AUTHORS);
  const publishers = clone(initialState.publishers || DEFAULT_PUBLISHERS);
  const books = clone(initialState.books || DEFAULT_BOOKS);
  const copies = clone(initialState.copies || DEFAULT_COPIES);
  const borrowDetails = clone(
    initialState.borrowDetails || [{ borrowDetailId: 1, copyId: 3, status: 'BORROWED' }]
  );
  const reservations = clone(
    initialState.reservations || [{ reservationId: 1, copyId: 4, status: 'ACTIVE' }]
  );
  let nextBookId = Math.max(0, ...books.map((book) => book.id)) + 1;
  let nextVersion = books.length + 1;

  const control = {
    failAudit: false,
    homeCalls: [],
    managementCalls: [],
  };

  function metadataName(collection, id) {
    return collection.find((item) => item.id === id)?.name || null;
  }

  function mapBook(book) {
    if (!book) return null;
    const relatedCopies = copies.filter((copy) => copy.bookId === book.id);
    const availableCopies = relatedCopies.filter((copy) => copy.status === 'AVAILABLE').length;
    const lockedCopies = relatedCopies.filter((copy) => ['BORROWED', 'RESERVED'].includes(copy.status)).length;
    const availabilityStatus = book.status === 'ACTIVE' && availableCopies > 0
      ? 'AVAILABLE'
      : 'UNAVAILABLE';

    return clone({
      ...book,
      category: metadataName(categories, book.categoryId),
      author: metadataName(authors, book.authorId),
      publisher: metadataName(publishers, book.publisherId),
      totalCopies: relatedCopies.length,
      availableCopies,
      lockedCopies,
      available: availabilityStatus === 'AVAILABLE',
      availabilityStatus,
    });
  }

  function filterBooks(source, filters = {}) {
    const q = String(filters.q || '').toLowerCase();
    return source.filter((book) => {
      if (q) {
        const searchable = [
          book.title,
          book.isbn,
          metadataName(authors, book.authorId),
          metadataName(categories, book.categoryId),
          metadataName(publishers, book.publisherId),
        ].join(' ').toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      if (filters.status && book.status !== filters.status) return false;
      if (filters.categoryId && book.categoryId !== Number(filters.categoryId)) return false;
      if (filters.authorId && book.authorId !== Number(filters.authorId)) return false;
      if (filters.publisherId && book.publisherId !== Number(filters.publisherId)) return false;
      if (filters.category && metadataName(categories, book.categoryId) !== filters.category) return false;
      return true;
    });
  }

  function sortBooks(source, filters = {}) {
    const sort = filters.sort || 'title';
    const direction = filters.order === 'desc' ? -1 : 1;
    const field = sort === 'publishYear' ? 'year' : sort === 'createdAt' ? 'createdAt' : 'title';
    return [...source].sort((left, right) => {
      const leftValue = left[field] ?? '';
      const rightValue = right[field] ?? '';
      const comparison = typeof leftValue === 'string'
        ? leftValue.localeCompare(String(rightValue))
        : Number(leftValue) - Number(rightValue);
      return comparison * direction || left.id - right.id;
    });
  }

  function advanceVersion(book) {
    book.version = `book-v${nextVersion}`;
    nextVersion += 1;
  }

  function stateSnapshot() {
    return clone({
      books,
      copies,
      borrowDetails,
      reservations,
      auditLogs: authDependencies.state.auditLogs,
      nextBookId,
      nextVersion,
    });
  }

  function restore(snapshot) {
    books.splice(0, books.length, ...snapshot.books);
    copies.splice(0, copies.length, ...snapshot.copies);
    borrowDetails.splice(0, borrowDetails.length, ...snapshot.borrowDetails);
    reservations.splice(0, reservations.length, ...snapshot.reservations);
    authDependencies.state.auditLogs.splice(
      0,
      authDependencies.state.auditLogs.length,
      ...snapshot.auditLogs
    );
    nextBookId = snapshot.nextBookId;
    nextVersion = snapshot.nextVersion;
  }

  function paginate(source, filters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    return {
      rows: source.slice((page - 1) * limit, page * limit).map(mapBook),
      total: source.length,
    };
  }

  const bookRepository = {
    async getHomeBooks(filters = {}) {
      control.homeCalls.push(clone(filters));
      const filtered = sortBooks(
        filterBooks(books.filter((book) => book.status === 'ACTIVE'), filters),
        filters
      );
      return paginate(filtered, filters);
    },
    async getCategories() {
      return categories
        .filter((category) => category.status === 'ACTIVE')
        .map((category) => ({
          id: category.id,
          name: category.name,
          count: books.filter(
            (book) => book.status === 'ACTIVE' && book.categoryId === category.id
          ).length,
        }));
    },
    async getMetadata() {
      const active = (items) => items
        .filter((item) => item.status === 'ACTIVE')
        .map(({ id, name }) => ({ id, name }));
      return {
        categories: active(categories),
        authors: active(authors),
        publishers: active(publishers),
      };
    },
    async getManagementBooks(filters = {}) {
      control.managementCalls.push(clone(filters));
      const filtered = sortBooks(filterBooks(books, filters), filters);
      return paginate(filtered, filters);
    },
    async getBookById(bookId) {
      return mapBook(books.find((book) => book.id === Number(bookId)));
    },
    async isbnExists(isbn, excludedBookId = null) {
      if (!isbn) return false;
      return books.some(
        (book) => book.isbn === isbn && book.id !== Number(excludedBookId)
      );
    },
    async referenceExists(tableName, _idColumn, id) {
      const collections = { Categories: categories, Authors: authors, Publishers: publishers };
      return Boolean(
        collections[tableName]?.some(
          (item) => item.id === Number(id) && item.status === 'ACTIVE'
        )
      );
    },
    async createBook(payload, { onBeforeCommit } = {}) {
      const before = stateSnapshot();
      try {
        const book = {
          id: nextBookId,
          version: `book-v${nextVersion}`,
          ...clone(payload),
          status: 'ACTIVE',
          year: payload.publishYear,
          cover: payload.coverUrl,
        };
        nextBookId += 1;
        nextVersion += 1;
        books.push(book);
        const result = mapBook(book);
        if (typeof onBeforeCommit === 'function') await onBeforeCommit({ book: result });
        return result;
      } catch (error) {
        restore(before);
        throw error;
      }
    },
    async updateBook(bookId, payload, expectedVersion, { onBeforeCommit } = {}) {
      const before = stateSnapshot();
      try {
        const book = books.find((item) => item.id === Number(bookId));
        if (!book) return null;
        if (book.version !== expectedVersion) return { outcome: 'STALE' };
        Object.assign(book, clone(payload), {
          status: book.status,
          year: payload.publishYear,
          cover: payload.coverUrl,
        });
        advanceVersion(book);
        const result = mapBook(book);
        if (typeof onBeforeCommit === 'function') await onBeforeCommit({ book: result });
        return result;
      } catch (error) {
        restore(before);
        throw error;
      }
    },
    async changeBookStatus(bookId, targetStatus, expectedVersion, { onBeforeCommit } = {}) {
      const before = stateSnapshot();
      try {
        const book = books.find((item) => item.id === Number(bookId));
        if (!book) return null;
        if (book.version !== expectedVersion) return { outcome: 'STALE' };
        if (book.status === targetStatus) return { outcome: 'INVALID_TRANSITION' };
        book.status = targetStatus;
        advanceVersion(book);
        const result = mapBook(book);
        if (typeof onBeforeCommit === 'function') await onBeforeCommit({ book: result });
        return result;
      } catch (error) {
        restore(before);
        throw error;
      }
    },
  };

  const auditLogRepository = {
    async create(entry) {
      if (control.failAudit) {
        throw new Error('Injected book audit failure');
      }
      return authDependencies.auditLogRepository.create(entry);
    },
  };

  function snapshot() {
    const current = stateSnapshot();
    delete current.nextBookId;
    delete current.nextVersion;
    return current;
  }

  return {
    bookRepository,
    auditLogRepository,
    control,
    snapshot,
    state: { books, copies, borrowDetails, reservations },
  };
}

module.exports = {
  makeInMemoryBookDependencies,
};
