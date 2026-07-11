process.env.BCRYPT_COST = '4';
process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');
process.env.AUTH_EXPOSE_TEST_TOKENS = 'true';

const request = require('supertest');
const { createApp } = require('../src/app');
const { createAuthService } = require('../src/services/authService');
const { createInventoryService } = require('../src/services/inventoryService');
const { makeInMemoryAuthDependencies } = require('./helpers/inMemoryAuthRepositories');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeInMemoryInventoryDependencies() {
  let nextCopyId = 4;
  const books = [
    { bookId: 1, title: 'Clean Code', isbn: '9780132350884', authorName: 'Robert C. Martin', categoryName: 'Programming' },
    { bookId: 2, title: 'Sapiens', isbn: '9780062316097', authorName: 'Yuval Noah Harari', categoryName: 'History' },
  ];
  const copies = [
    { copyId: 1, bookId: 1, barcode: 'BC-001', status: 'AVAILABLE', location: 'A1' },
    { copyId: 2, bookId: 1, barcode: 'BC-002', status: 'BORROWED', location: 'A2' },
    { copyId: 3, bookId: 2, barcode: 'BC-003', status: 'RESERVED', location: 'B1' },
  ];
  const borrowDetails = [{ borrowDetailId: 1, copyId: 2, status: 'BORROWED' }];
  const reservations = [{ reservationId: 1, copyId: 3, status: 'ACTIVE' }];

  function mapBook(book) {
    if (!book) return null;
    return clone({
      bookId: book.bookId,
      title: book.title,
      isbn: book.isbn,
      authorName: book.authorName,
      categoryName: book.categoryName,
    });
  }

  function mapCopy(copy) {
    if (!copy) return null;
    return clone({
      ...copy,
      book: mapBook(books.find((book) => book.bookId === copy.bookId)),
    });
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
      const filtered = copies.filter((copy) => {
        if (filters.bookId && copy.bookId !== Number(filters.bookId)) return false;
        if (filters.status && copy.status !== filters.status) return false;
        if (filters.barcode && !copy.barcode.includes(filters.barcode)) return false;
        if (filters.location && !String(copy.location || '').includes(filters.location)) return false;
        return true;
      });
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      return {
        copies: filtered.slice((page - 1) * limit, page * limit).map(mapCopy),
        pagination: { page, limit, total: filtered.length },
      };
    },
    async createCopy(input) {
      const copy = { copyId: nextCopyId, ...input };
      nextCopyId += 1;
      copies.push(copy);
      return mapCopy(copy);
    },
    async updateCopy(copyId, patch) {
      const copy = copies.find((item) => item.copyId === Number(copyId));
      Object.assign(copy, patch);
      return mapCopy(copy);
    },
    async updateCopyStatus(copyId, status) {
      const copy = copies.find((item) => item.copyId === Number(copyId));
      copy.status = status;
      return mapCopy(copy);
    },
    async hasActiveBorrow(copyId) {
      return borrowDetails.some((detail) => detail.copyId === Number(copyId) && ['BORROWED', 'OVERDUE'].includes(detail.status));
    },
    async hasActiveReservation(copyId) {
      return reservations.some((reservation) => reservation.copyId === Number(copyId) && reservation.status === 'ACTIVE');
    },
  };

  return {
    inventoryRepository,
    state: { books, copies, borrowDetails, reservations },
  };
}

function makeTestApp() {
  const authDependencies = makeInMemoryAuthDependencies();
  const inventoryDependencies = makeInMemoryInventoryDependencies();
  const authService = createAuthService(authDependencies);
  const inventoryService = createInventoryService({
    inventoryRepository: inventoryDependencies.inventoryRepository,
    auditLogRepository: authDependencies.auditLogRepository,
  });
  const app = createApp({ authService, inventoryService });

  return { app, authDependencies, inventoryDependencies };
}

async function createVerifiedUser({ app, authDependencies, email, role = 'MEMBER' }) {
  const password = 'Password1!';
  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({
      email,
      password,
      confirmPassword: password,
      fullName: email.split('@')[0],
    });

  expect(registerResponse.status).toBe(201);

  const userId = registerResponse.body.userId;

  await request(app)
    .post('/api/auth/verify-email')
    .send({ token: registerResponse.body.debugVerificationToken })
    .expect(200);

  authDependencies.state.rolesByUserId.set(userId, [role]);

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  expect(loginResponse.status).toBe(200);

  return {
    userId,
    accessToken: loginResponse.body.accessToken,
  };
}

function authHeader(accessToken) {
  return `Bearer ${accessToken}`;
}

describe('FE06 inventory book copy management', () => {
  test('inventory routes require staff access', async () => {
    const { app, authDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      email: 'inventory.member@example.test',
    });

    await request(app).get('/api/inventory').expect(401);

    const forbidden = await request(app)
      .get('/api/inventory')
      .set('Authorization', authHeader(member.accessToken));

    expect(forbidden.status).toBe(403);
  });

  test('librarian can list inventory, look up barcode, and create a copy', async () => {
    const { app, authDependencies } = makeTestApp();
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      email: 'inventory.librarian@example.test',
      role: 'LIBRARIAN',
    });

    const listResponse = await request(app)
      .get('/api/inventory?status=AVAILABLE')
      .set('Authorization', authHeader(librarian.accessToken));

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.copies).toHaveLength(1);
    expect(listResponse.body.copies[0]).toMatchObject({ barcode: 'BC-001', status: 'AVAILABLE' });

    const lookupResponse = await request(app)
      .get('/api/book-copies/barcode/BC-001')
      .set('Authorization', authHeader(librarian.accessToken));

    expect(lookupResponse.status).toBe(200);
    expect(lookupResponse.body.copy.book.title).toBe('Clean Code');

    const createResponse = await request(app)
      .post('/api/books/1/copies')
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ barcode: 'BC-004', location: 'A3' });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.copy).toMatchObject({ bookId: 1, barcode: 'BC-004', status: 'AVAILABLE' });
    expect(authDependencies.state.auditLogs).toEqual(
      expect.arrayContaining([expect.objectContaining({ action: 'BOOK_COPY_CREATE' })])
    );
  });

  test('duplicate barcode and unsupported manual status are rejected', async () => {
    const { app, authDependencies } = makeTestApp();
    const admin = await createVerifiedUser({
      app,
      authDependencies,
      email: 'inventory.admin@example.test',
      role: 'ADMIN',
    });

    const duplicateResponse = await request(app)
      .post('/api/books/1/copies')
      .set('Authorization', authHeader(admin.accessToken))
      .send({ barcode: 'BC-001' });

    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body.error.code).toBe('DUPLICATE_BARCODE');

    const invalidStatusResponse = await request(app)
      .patch('/api/book-copies/1/status')
      .set('Authorization', authHeader(admin.accessToken))
      .send({ status: 'BORROWED' });

    expect(invalidStatusResponse.status).toBe(400);
    expect(invalidStatusResponse.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('manual status changes cannot override active borrowing or reservation state', async () => {
    const { app, authDependencies } = makeTestApp();
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      email: 'inventory.conflict@example.test',
      role: 'LIBRARIAN',
    });

    const borrowedResponse = await request(app)
      .patch('/api/book-copies/2/status')
      .set('Authorization', authHeader(librarian.accessToken))
      .send({ status: 'AVAILABLE' });

    expect(borrowedResponse.status).toBe(409);
    expect(borrowedResponse.body.error.code).toBe('ACTIVE_BORROW_CONFLICT');

    const reservedResponse = await request(app)
      .delete('/api/book-copies/3')
      .set('Authorization', authHeader(librarian.accessToken));

    expect(reservedResponse.status).toBe(409);
    expect(reservedResponse.body.error.code).toBe('ACTIVE_RESERVATION_CONFLICT');
  });
});
