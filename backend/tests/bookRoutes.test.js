process.env.BCRYPT_COST = '4';
process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');
process.env.AUTH_EXPOSE_TEST_TOKENS = 'true';

const request = require('supertest');
const { makeInMemoryAuthDependencies } = require('./helpers/inMemoryAuthRepositories');
const { makeInMemoryBookDependencies } = require('./helpers/inMemoryBookRepositories');

function makeTestApp(initialState = {}) {
  jest.resetModules();
  const authDependencies = makeInMemoryAuthDependencies();
  const bookDependencies = makeInMemoryBookDependencies(authDependencies, initialState);
  const bookCoverStorage = {
    saveBookCoverFile: jest.fn(async () => '/uploads/book-covers/test-cover.png'),
    deleteBookCoverFile: jest.fn(async (coverUrl) => /^\/uploads\/book-covers\//.test(coverUrl)),
  };

  jest.doMock('../src/repositories/bookRepository', () => bookDependencies.bookRepository);
  jest.doMock('../src/repositories/auditLogRepository', () => bookDependencies.auditLogRepository);
  jest.doMock('../src/utils/bookCoverStorage', () => bookCoverStorage);
  jest.doMock('../src/services/authService', () => {
    const actual = jest.requireActual('../src/services/authService');
    return {
      ...actual,
      defaultAuthService: actual.createAuthService(authDependencies),
    };
  });

  const { createApp } = require('../src/app');
  const { defaultAuthService } = require('../src/services/authService');
  const app = createApp({ authService: defaultAuthService });

  return { app, authDependencies, bookDependencies, bookCoverStorage };
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
    .send({ token: authDependencies.state.generatedOtps.at(-1) })
    .expect(200);
  authDependencies.state.rolesByUserId.set(userId, [role]);

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  expect(loginResponse.status).toBe(200);

  return { userId, accessToken: loginResponse.body.accessToken };
}

function authHeader(accessToken) {
  return `Bearer ${accessToken}`;
}

async function makeStaffSetup(role = 'LIBRARIAN', initialState = {}) {
  const setup = makeTestApp(initialState);
  const staff = await createVerifiedUser({
    app: setup.app,
    authDependencies: setup.authDependencies,
    email: `books.${role.toLowerCase()}.${Date.now()}@example.test`,
    role,
  });
  return { ...setup, staff };
}

function listItems(body) {
  if (Array.isArray(body.items)) return body.items;
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.data?.items)) return body.data.items;
  return [];
}

function pageMeta(body) {
  return body.pagination || body.data?.pagination || {
    page: body.page ?? body.data?.page,
    limit: body.limit ?? body.data?.limit,
    total: body.totalItems ?? body.data?.totalItems,
    totalPages: body.totalPages ?? body.data?.totalPages,
  };
}

function responseBook(body) {
  return body.book || body.data?.book || body.data;
}

function expectStateUnchanged(bookDependencies, before) {
  expect(bookDependencies.snapshot()).toEqual(before);
}

const VALID_BOOK = {
  title: 'Domain-Driven Design',
  isbn: '9780321125217',
  categoryId: 1,
  authorId: 1,
  publisherId: 1,
  publishYear: 2003,
  pages: 560,
  rating: 4.8,
  description: 'Strategic and tactical design patterns.',
  coverUrl: '/covers/ddd.jpg',
};

describe('FE05 book management v0.5.1 RED contract', () => {
  // @spec BR-FE05-021, FR-FE05-030, AC-FE05-021, NFR-FE05-SEC-001
  test('active book metadata choices are available only to Librarian and Admin', async () => {
    const { app, authDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      email: 'books.metadata.member@example.test',
    });
    const librarian = await createVerifiedUser({
      app,
      authDependencies,
      email: 'books.metadata.librarian@example.test',
      role: 'LIBRARIAN',
    });
    const admin = await createVerifiedUser({
      app,
      authDependencies,
      email: 'books.metadata.admin@example.test',
      role: 'ADMIN',
    });

    await request(app).get('/api/books/metadata').expect(401);
    await request(app)
      .get('/api/books/metadata')
      .set('Authorization', authHeader(member.accessToken))
      .expect(403);

    for (const staff of [librarian, admin]) {
      const response = await request(app)
        .get('/api/books/metadata')
        .set('Authorization', authHeader(staff.accessToken))
        .expect(200);

      expect(response.body.data).toEqual({
        categories: [
          { id: 1, name: 'Programming' },
          { id: 2, name: 'History' },
        ],
        authors: [
          { id: 1, name: 'Robert C. Martin' },
          { id: 2, name: 'Yuval Noah Harari' },
        ],
        publishers: [
          { id: 1, name: 'Prentice Hall' },
          { id: 2, name: 'Harper' },
        ],
      });
    }
  });

  // @spec BR-FE05-019, FR-FE05-027, AC-FE05-018
  test('librarian creates a book from multipart metadata and a validated cover image', async () => {
    const { app, staff, bookCoverStorage } = await makeStaffSetup();
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

    const response = await request(app)
      .post('/api/books')
      .set('Authorization', authHeader(staff.accessToken))
      .field('metadata', JSON.stringify({ ...VALID_BOOK, isbn: '9780000000199', coverUrl: '' }))
      .attach('cover', png, { filename: 'cover.png', contentType: 'image/png' });

    expect(response.status).toBe(201);
    expect(responseBook(response.body).cover).toBe('/uploads/book-covers/test-cover.png');
    expect(bookCoverStorage.saveBookCoverFile).toHaveBeenCalledWith(expect.objectContaining({
      originalName: 'cover.png',
      mimeType: 'image/png',
      buffer: expect.any(Buffer),
    }));
  });

  // @spec BR-FE05-019, FR-FE05-028, AC-FE05-019
  test('invalid cover content is rejected before storage or book mutation', async () => {
    const { app, staff, bookDependencies, bookCoverStorage } = await makeStaffSetup();
    const before = bookDependencies.snapshot();

    const response = await request(app)
      .post('/api/books')
      .set('Authorization', authHeader(staff.accessToken))
      .field('metadata', JSON.stringify({ ...VALID_BOOK, isbn: '9780000000205', coverUrl: '' }))
      .attach('cover', Buffer.from('not a png'), { filename: 'cover.png', contentType: 'image/png' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_BOOK_FIELD');
    expect(bookCoverStorage.saveBookCoverFile).not.toHaveBeenCalled();
    expectStateUnchanged(bookDependencies, before);
  });

  test('cover larger than 2 MB is rejected before storage or book mutation', async () => {
    const { app, staff, bookDependencies, bookCoverStorage } = await makeStaffSetup();
    const before = bookDependencies.snapshot();
    const oversizedPng = Buffer.alloc(2 * 1024 * 1024 + 1);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(oversizedPng);

    const response = await request(app)
      .post('/api/books')
      .set('Authorization', authHeader(staff.accessToken))
      .field('metadata', JSON.stringify({ ...VALID_BOOK, isbn: '9780000000212', coverUrl: '' }))
      .attach('cover', oversizedPng, { filename: 'large.png', contentType: 'image/png' });

    expect(response.status).toBe(400);
    expect(bookCoverStorage.saveBookCoverFile).not.toHaveBeenCalled();
    expectStateUnchanged(bookDependencies, before);
  });

  // @spec BR-FE05-020, FR-FE05-027, AC-FE05-018
  test('successful multipart update commits the new cover before deleting the previous managed file', async () => {
    const { app, staff, bookDependencies, bookCoverStorage } = await makeStaffSetup();
    bookDependencies.state.books[0].cover = '/uploads/book-covers/old-cover.png';
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

    const response = await request(app)
      .put('/api/books/1')
      .set('Authorization', authHeader(staff.accessToken))
      .set('If-Match', 'book-v1')
      .field('metadata', JSON.stringify({
        ...VALID_BOOK,
        title: 'Clean Code with New Cover',
        isbn: '9780132350884',
        coverUrl: '/uploads/book-covers/old-cover.png',
      }))
      .attach('cover', png, { filename: 'replacement.png', contentType: 'image/png' });

    expect(response.status).toBe(200);
    expect(responseBook(response.body).cover).toBe('/uploads/book-covers/test-cover.png');
    expect(bookCoverStorage.deleteBookCoverFile).toHaveBeenCalledWith('/uploads/book-covers/old-cover.png');
  });

  // @spec AC-FE05-001, AC-FE05-002, BR-FE05-001, FR-FE05-001, FR-FE05-002
  test('guest and member searches return only matching ACTIVE books', async () => {
    const { app, authDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      email: 'books.member@example.test',
    });

    const guestResponse = await request(app).get('/api/books?q=Clean');
    const memberResponse = await request(app)
      .get('/api/books?q=Sapiens')
      .set('Authorization', authHeader(member.accessToken));

    expect(guestResponse.status).toBe(200);
    expect(listItems(guestResponse.body).map((book) => book.title)).toEqual(['Clean Code']);
    expect(Object.keys(listItems(guestResponse.body)[0])).toEqual([
      'bookId',
      'title',
      'isbn',
      'categoryName',
      'authorName',
      'publisherName',
      'publishYear',
      'description',
      'coverUrl',
      'availabilityStatus',
    ]);
    expect(memberResponse.status).toBe(200);
    expect(listItems(memberResponse.body).map((book) => book.title)).toEqual(['Sapiens']);
    expect(JSON.stringify([guestResponse.body, memberResponse.body])).not.toContain('Inactive Catalog Record');
    expect(JSON.stringify([guestResponse.body, memberResponse.body])).not.toContain('availableCopies');
    expect(JSON.stringify([guestResponse.body, memberResponse.body])).not.toContain('totalCopies');
  });

  // @spec AC-FE05-001, AC-FE05-004, AC-FE05-015, BR-FE05-017, FR-FE05-009, FR-FE05-010
  test('public search applies approved filters, stable sorting, and pagination semantics', async () => {
    const { app } = makeTestApp();
    const response = await request(app)
      .get('/api/books?categoryId=1&authorId=1&publisherId=1&page=1&limit=1');

    expect(response.status).toBe(200);
    expect(listItems(response.body)).toHaveLength(1);
    expect(listItems(response.body)[0]).toMatchObject({ title: 'Clean Code' });
    expect(pageMeta(response.body)).toMatchObject({ page: 1, limit: 1, totalPages: 1 });
  });

  // @spec AC-FE05-003, AC-FE05-011, BR-FE05-009, BR-FE05-013, FR-FE05-003, FR-FE05-020
  test('public detail is safe, derived, and hides INACTIVE books while staff can view them', async () => {
    const { app, staff } = await makeStaffSetup();

    const publicActive = await request(app).get('/api/books/1');
    expect(publicActive.status).toBe(200);
    expect(responseBook(publicActive.body)).toMatchObject({
      bookId: 1,
      title: 'Clean Code',
      availabilityStatus: 'AVAILABLE',
    });
    expect(Object.keys(responseBook(publicActive.body))).toEqual([
      'bookId',
      'title',
      'isbn',
      'categoryName',
      'authorName',
      'publisherName',
      'publishYear',
      'description',
      'coverUrl',
      'availabilityStatus',
    ]);
    const serialized = JSON.stringify(publicActive.body);
    expect(serialized).not.toContain('book-v1');
    expect(serialized).not.toContain('staff-only acquisition note');

    await request(app).get('/api/books/3').expect(404);

    const staffInactive = await request(app)
      .get('/api/books/3')
      .set('Authorization', authHeader(staff.accessToken));
    expect(staffInactive.status).toBe(200);
    expect(responseBook(staffInactive.body)).toMatchObject({
      id: 3,
      status: 'INACTIVE',
      availabilityStatus: 'UNAVAILABLE',
      version: 'book-v3',
    });
  });

  // @spec BR-FE01-004, BR-FE01-014, FR-FE01-004, FR-FE01-005, AC-FE01-013
  test('public reads preserve missing optional metadata as null', async () => {
    const { app } = makeTestApp({
      categories: [],
      authors: [],
      publishers: [],
      copies: [],
      books: [{
        id: 41,
        title: 'Sparse Public Book',
        isbn: '',
        categoryId: null,
        authorId: null,
        publisherId: null,
        year: null,
        pages: null,
        rating: null,
        description: '',
        cover: '',
        status: 'ACTIVE',
        version: 'book-v41',
      }],
    });

    const listResponse = await request(app).get('/api/books').expect(200);
    const detailResponse = await request(app).get('/api/books/41').expect(200);
    const expected = {
      bookId: 41,
      title: 'Sparse Public Book',
      isbn: null,
      categoryName: null,
      authorName: null,
      publisherName: null,
      publishYear: null,
      description: null,
      coverUrl: null,
      availabilityStatus: 'UNAVAILABLE',
    };

    expect(listItems(listResponse.body)).toEqual([expected]);
    expect(responseBook(detailResponse.body)).toEqual(expected);
  });

  // @spec AC-FE05-004, AC-FE05-009, BR-FE05-002, BR-FE05-003, BR-FE05-004, FR-FE05-004, FR-FE05-015
  test('approved admin list is protected and includes ACTIVE plus INACTIVE management records', async () => {
    const { app, authDependencies, staff } = await makeStaffSetup();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      email: 'books.list.member@example.test',
    });

    await request(app).get('/api/admin/books').expect(401);
    await request(app)
      .get('/api/admin/books')
      .set('Authorization', authHeader(member.accessToken))
      .expect(403);

    const response = await request(app)
      .get('/api/admin/books?page=1&limit=20&sort=title&order=asc')
      .set('Authorization', authHeader(staff.accessToken));
    expect(response.status).toBe(200);
    expect(listItems(response.body).map((book) => book.status).sort()).toEqual([
      'ACTIVE',
      'ACTIVE',
      'INACTIVE',
    ]);
    expect(pageMeta(response.body)).toMatchObject({ page: 1, limit: 20 });
  });

  // @spec AC-FE05-009, BR-FE05-002 through BR-FE05-004, FR-FE05-015
  test('guest and member cannot create, update, deactivate, or reactivate books', async () => {
    const { app, authDependencies } = makeTestApp();
    const member = await createVerifiedUser({
      app,
      authDependencies,
      email: 'books.write.member@example.test',
    });
    const memberAuth = authHeader(member.accessToken);

    await request(app).post('/api/books').send(VALID_BOOK).expect(401);
    await request(app)
      .post('/api/books')
      .set('Authorization', memberAuth)
      .send(VALID_BOOK)
      .expect(403);
    await request(app)
      .put('/api/books/1')
      .set('Authorization', memberAuth)
      .set('If-Match', 'book-v1')
      .send({ ...VALID_BOOK, isbn: '9780132350884' })
      .expect(403);
    await request(app)
      .patch('/api/books/1/deactivate')
      .set('Authorization', memberAuth)
      .set('If-Match', 'book-v1')
      .send({ reason: 'Forbidden' })
      .expect(403);
    await request(app)
      .patch('/api/books/3/reactivate')
      .set('Authorization', memberAuth)
      .set('If-Match', 'book-v3')
      .send({ reason: 'Forbidden' })
      .expect(403);
  });

  // @spec AC-FE05-015, BR-FE05-017, FR-FE05-017, FR-FE05-024
  test('invalid supplied public and staff query values are rejected before repository access', async () => {
    const { app, staff, bookDependencies } = await makeStaffSetup();
    const invalidPublic = [
      `q=${'q'.repeat(201)}`,
      'page=0',
      'page=1.5',
      'limit=0',
      'limit=101',
      'sort=isbn',
      'order=sideways',
    ];

    for (const query of invalidPublic) {
      await request(app).get(`/api/books?${query}`).expect(400);
    }
    expect(bookDependencies.control.homeCalls).toHaveLength(0);

    const invalidStaff = await request(app)
      .get('/api/admin/books?status=DELETED')
      .set('Authorization', authHeader(staff.accessToken));
    expect(invalidStaff.status).toBe(400);
    expect(bookDependencies.control.managementCalls).toHaveLength(0);
  });

  // @spec AC-FE05-005, AC-FE05-010, BR-FE05-002, BR-FE05-010, BR-FE05-014, FR-FE05-006
  test('valid create starts ACTIVE, returns a version, and commits its audit', async () => {
    const { app, staff, authDependencies } = await makeStaffSetup();
    const response = await request(app)
      .post('/api/books')
      .set('Authorization', authHeader(staff.accessToken))
      .send(VALID_BOOK);

    expect(response.status).toBe(201);
    expect(responseBook(response.body)).toMatchObject({
      title: VALID_BOOK.title,
      status: 'ACTIVE',
      version: expect.any(String),
    });
    expect(authDependencies.state.auditLogs.at(-1)).toMatchObject({
      action: 'BOOK_CREATE',
      targetType: 'BOOK',
    });
  });

  // @spec BR-FE05-005, EC-FE05-004, AC-FE05-005
  test('ISBN remains optional and multiple blank ISBN values are allowed', async () => {
    const { app, staff } = await makeStaffSetup();

    for (const title of ['Book Without ISBN One', 'Book Without ISBN Two']) {
      await request(app)
        .post('/api/books')
        .set('Authorization', authHeader(staff.accessToken))
        .send({ ...VALID_BOOK, title, isbn: '' })
        .expect(201);
    }
  });

  // @spec BR-FE05-014, FR-FE05-006
  test('client input cannot create an INACTIVE book', async () => {
    const { app, staff, bookDependencies } = await makeStaffSetup();

    await request(app)
      .post('/api/books')
      .set('Authorization', authHeader(staff.accessToken))
      .send({ ...VALID_BOOK, isbn: '9780000000099', status: 'INACTIVE' });

    expect(bookDependencies.state.books).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ isbn: '9780000000099', status: 'INACTIVE' }),
      ])
    );
  });

  // @spec AC-FE05-006, AC-FE05-017, BR-FE05-005 through BR-FE05-007, FR-FE05-011 through FR-FE05-013, FR-FE05-016, FR-FE05-026
  test.each([
    ['missing title', { ...VALID_BOOK, title: '   ' }, 400],
    ['overlength title', { ...VALID_BOOK, title: 'T'.repeat(256) }, 400],
    ['overlength ISBN', { ...VALID_BOOK, isbn: 'I'.repeat(21) }, 400],
    ['duplicate ISBN', { ...VALID_BOOK, isbn: '9780132350884' }, 400],
    ['missing category', { ...VALID_BOOK, categoryId: 999 }, 400],
    ['inactive category', { ...VALID_BOOK, categoryId: 3 }, 400],
    ['missing author', { ...VALID_BOOK, authorId: 999 }, 400],
    ['inactive author', { ...VALID_BOOK, authorId: 3 }, 400],
    ['missing publisher', { ...VALID_BOOK, publisherId: 999 }, 400],
    ['inactive publisher', { ...VALID_BOOK, publisherId: 3 }, 400],
    ['future year', { ...VALID_BOOK, publishYear: new Date().getFullYear() + 1 }, 400],
    ['zero pages', { ...VALID_BOOK, pages: 0 }, 400],
    ['too many pages', { ...VALID_BOOK, pages: 10001 }, 400],
    ['rating below range', { ...VALID_BOOK, rating: -0.1 }, 400],
    ['rating above range', { ...VALID_BOOK, rating: 5.1 }, 400],
    ['rating precision', { ...VALID_BOOK, rating: 4.55 }, 400],
    ['unsafe cover URL', { ...VALID_BOOK, coverUrl: 'javascript:alert(1)' }, 400],
  ])('create rejects %s without changing any state', async (_label, payload, status) => {
    const { app, staff, bookDependencies } = await makeStaffSetup();
    const before = bookDependencies.snapshot();

    await request(app)
      .post('/api/books')
      .set('Authorization', authHeader(staff.accessToken))
      .send(payload)
      .expect(status);

    expectStateUnchanged(bookDependencies, before);
  });

  // @spec AC-FE05-007, AC-FE05-010, BR-FE05-003, BR-FE05-016, FR-FE05-007
  test('valid metadata update requires current If-Match, advances version, and audits', async () => {
    const { app, staff, authDependencies } = await makeStaffSetup();
    const response = await request(app)
      .put('/api/books/1')
      .set('Authorization', authHeader(staff.accessToken))
      .set('If-Match', 'book-v1')
      .send({ ...VALID_BOOK, title: 'Clean Code Second Edition', isbn: '9780132350884' });

    expect(response.status).toBe(200);
    expect(responseBook(response.body)).toMatchObject({
      id: 1,
      title: 'Clean Code Second Edition',
      status: 'ACTIVE',
    });
    expect(responseBook(response.body).version).not.toBe('book-v1');
    expect(authDependencies.state.auditLogs.at(-1)).toMatchObject({ action: 'BOOK_UPDATE' });
  });

  // @spec AC-FE05-006, FR-FE05-011
  test('duplicate ISBN update is rejected without mutation', async () => {
    const { app, staff, bookDependencies } = await makeStaffSetup();
    const before = bookDependencies.snapshot();

    await request(app)
      .put('/api/books/1')
      .set('Authorization', authHeader(staff.accessToken))
      .set('If-Match', 'book-v1')
      .send({ ...VALID_BOOK, isbn: '9780062316097' })
      .expect(400);

    expectStateUnchanged(bookDependencies, before);
  });

  // @spec AC-FE05-012, BR-FE05-012, BR-FE05-015, FR-FE05-021
  test('metadata update and legacy availability route cannot mutate status or copies', async () => {
    const { app, staff, bookDependencies } = await makeStaffSetup();
    const before = bookDependencies.snapshot();

    await request(app)
      .put('/api/books/1')
      .set('Authorization', authHeader(staff.accessToken))
      .set('If-Match', 'book-v1')
      .send({ ...VALID_BOOK, isbn: '9780132350884', status: 'INACTIVE' })
      .expect(400);

    await request(app)
      .patch('/api/books/1/availability')
      .set('Authorization', authHeader(staff.accessToken))
      .send({ copyStatus: 'BORROWED' })
      .expect(404);

    expectStateUnchanged(bookDependencies, before);
  });

  // @spec AC-FE05-014, BR-FE05-016, FR-FE05-023
  test.each([
    ['PUT', '/api/books/1', { ...VALID_BOOK, isbn: '9780132350884' }],
    ['PATCH', '/api/books/1/deactivate', { reason: 'Catalog retirement' }],
    ['PATCH', '/api/books/3/reactivate', { reason: 'Catalog restored' }],
  ])('%s %s rejects missing and stale If-Match without mutation', async (method, endpoint, body) => {
    for (const version of [undefined, 'stale-book-version']) {
      const { app, staff, bookDependencies } = await makeStaffSetup();
      const before = bookDependencies.snapshot();
      let operation = request(app)
        [method.toLowerCase()](endpoint)
        .set('Authorization', authHeader(staff.accessToken));
      if (version) operation = operation.set('If-Match', version);
      const response = await operation.send(body);

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('STALE_BOOK_STATE');
      expectStateUnchanged(bookDependencies, before);
    }
  });

  // @spec BR-FE05-020, FR-FE05-028, AC-FE05-019
  test('stale multipart update removes the uncommitted cover and preserves the current book', async () => {
    const { app, staff, bookDependencies, bookCoverStorage } = await makeStaffSetup();
    const before = bookDependencies.snapshot();
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

    const response = await request(app)
      .put('/api/books/1')
      .set('Authorization', authHeader(staff.accessToken))
      .set('If-Match', 'stale-book-version')
      .field('metadata', JSON.stringify({ ...VALID_BOOK, isbn: '9780132350884', coverUrl: '' }))
      .attach('cover', png, { filename: 'replacement.png', contentType: 'image/png' });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('STALE_BOOK_STATE');
    expect(bookCoverStorage.saveBookCoverFile).toHaveBeenCalledTimes(1);
    expect(bookCoverStorage.deleteBookCoverFile).toHaveBeenCalledWith('/uploads/book-covers/test-cover.png');
    expectStateUnchanged(bookDependencies, before);
  });

  // @spec AC-FE05-008, AC-FE05-010, BR-FE05-008 through BR-FE05-010, BR-FE05-015, FR-FE05-008, FR-FE05-019
  test('deactivation changes only Books.Status and commits the reason audit', async () => {
    const { app, staff, authDependencies, bookDependencies } = await makeStaffSetup();
    const before = bookDependencies.snapshot();

    const response = await request(app)
      .patch('/api/books/1/deactivate')
      .set('Authorization', authHeader(staff.accessToken))
      .set('If-Match', 'book-v1')
      .send({ reason: '  Superseded edition  ' });

    expect(response.status).toBe(200);
    expect(responseBook(response.body)).toMatchObject({ id: 1, status: 'INACTIVE' });
    expect(bookDependencies.state.copies).toEqual(before.copies);
    expect(bookDependencies.state.borrowDetails).toEqual(before.borrowDetails);
    expect(bookDependencies.state.reservations).toEqual(before.reservations);
    expect(authDependencies.state.auditLogs.at(-1)).toMatchObject({
      action: 'BOOK_DEACTIVATE',
      metadata: expect.objectContaining({ reason: 'Superseded edition' }),
    });

    await request(app).get('/api/books/1').expect(404);
  });

  // @spec AC-FE05-013, AC-FE05-010, BR-FE05-014, BR-FE05-015, FR-FE05-022
  test('reactivation changes only Books.Status and recomputes derived availability', async () => {
    const { app, staff, authDependencies, bookDependencies } = await makeStaffSetup();
    const before = bookDependencies.snapshot();

    const response = await request(app)
      .patch('/api/books/3/reactivate')
      .set('Authorization', authHeader(staff.accessToken))
      .set('If-Match', 'book-v3')
      .send({ reason: 'Catalog restored' });

    expect(response.status).toBe(200);
    expect(responseBook(response.body)).toMatchObject({
      id: 3,
      status: 'ACTIVE',
      availabilityStatus: 'AVAILABLE',
    });
    expect(bookDependencies.state.copies).toEqual(before.copies);
    expect(bookDependencies.state.borrowDetails).toEqual(before.borrowDetails);
    expect(bookDependencies.state.reservations).toEqual(before.reservations);
    expect(authDependencies.state.auditLogs.at(-1)).toMatchObject({ action: 'BOOK_REACTIVATE' });
  });

  // @spec AC-FE05-016, BR-FE05-018, FR-FE05-025
  test.each([
    ['missing', undefined, 400],
    ['blank', '   ', 400],
    ['overlength', 'R'.repeat(501), 400],
    ['maximum length', 'R'.repeat(500), 200],
  ])('deactivation handles %s reason deterministically', async (_label, reason, expectedStatus) => {
    const { app, staff, bookDependencies } = await makeStaffSetup();
    const before = bookDependencies.snapshot();
    const body = {};
    if (reason !== undefined) body.reason = reason;

    const response = await request(app)
      .patch('/api/books/1/deactivate')
      .set('Authorization', authHeader(staff.accessToken))
      .set('If-Match', 'book-v1')
      .send(body);
    expect(response.status).toBe(expectedStatus);
    if (expectedStatus !== 200) expectStateUnchanged(bookDependencies, before);
  });

  // @spec BR-FE05-014, FR-FE05-022
  test('invalid duplicate deactivate/reactivate transitions preserve all state', async () => {
    const { app, staff, bookDependencies } = await makeStaffSetup();
    const before = bookDependencies.snapshot();

    await request(app)
      .patch('/api/books/3/deactivate')
      .set('Authorization', authHeader(staff.accessToken))
      .set('If-Match', 'book-v3')
      .send({ reason: 'Already inactive' })
      .expect(409);
    await request(app)
      .patch('/api/books/1/reactivate')
      .set('Authorization', authHeader(staff.accessToken))
      .set('If-Match', 'book-v1')
      .send({ reason: 'Already active' })
      .expect(409);

    expectStateUnchanged(bookDependencies, before);
  });

  // @spec AC-FE05-010, FR-FE05-018, NFR-FE05-TXN-001
  test('audit failure rolls back book, copy, workflow, and audit state together', async () => {
    const { app, staff, bookDependencies } = await makeStaffSetup();
    const before = bookDependencies.snapshot();
    bookDependencies.control.failAudit = true;

    const response = await request(app)
      .put('/api/books/1')
      .set('Authorization', authHeader(staff.accessToken))
      .set('If-Match', 'book-v1')
      .send({ ...VALID_BOOK, title: 'Mutation must roll back', isbn: '9780132350884' });

    expect(response.status).toBe(500);
    expectStateUnchanged(bookDependencies, before);
  });
});
