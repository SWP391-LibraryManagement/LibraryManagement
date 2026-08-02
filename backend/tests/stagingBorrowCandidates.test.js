const {
  readFileSync,
} = require('node:fs');
const path = require('node:path');

const scriptPath = path.resolve(__dirname, '../scripts/stagingBorrowCandidates.js');

function loadSubject() {
  jest.resetModules();
  return require(scriptPath);
}

function makeSql({ result = { recordset: [{ FixtureCount: 2 }] }, error = null } = {}) {
  const transaction = {
    begin: jest.fn(async () => {}),
    commit: jest.fn(async () => {}),
    rollback: jest.fn(async () => {}),
  };
  const requests = [];

  class Transaction {
    constructor(pool) {
      transaction.pool = pool;
      return transaction;
    }
  }

  class Request {
    constructor(owner) {
      this.owner = owner;
      this.inputs = {};
      this.input = jest.fn((name, _type, value) => {
        this.inputs[name] = value;
        return this;
      });
      this.query = jest.fn(async (statement) => {
        this.statement = statement;
        if (error) throw error;
        return result;
      });
      requests.push(this);
    }
  }

  return {
      sql: {
        Transaction,
        Request,
        Int: 'Int',
        Date: 'Date',
        DateTime: 'DateTime',
        NVarChar: (size) => `NVarChar(${size})`,
      },
    transaction,
    requests,
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function restore(target, snapshot) {
  for (const key of Object.keys(target)) delete target[key];
  Object.assign(target, clone(snapshot));
}

function makeStatefulSql(state, { failAfterMutation = false } = {}) {
  let snapshot;
  const transaction = {
    begin: jest.fn(async () => { snapshot = clone(state); }),
    commit: jest.fn(async () => {}),
    rollback: jest.fn(async () => restore(state, snapshot)),
  };

  class Transaction {
    constructor() {
      return transaction;
    }
  }

  class Request {
    constructor() {
      this.inputs = {};
    }

    input(name, _type, value) {
      this.inputs[name] = value;
      return this;
    }

    async query(statement) {
      const requiredContracts = [
        /br\.RequestDate >= @BusinessDayStartUtc/,
        /br\.RequestDate < @BusinessDayEndUtc/,
        /COUNT\(\*\) <> SUM\(CASE WHEN b\.ISBN IN \(@Fixture1Isbn, @Fixture2Isbn\)/,
        /Status = 'REJECTED'[\s\S]*Status = 'PENDING'/,
        /Status = 'RETURNED'[\s\S]*ReturnDate = @BusinessDate/,
        /Status = 'CANCELLED'/,
        /STAGING_FIXTURE_BOOK_TITLE_RESTORE/,
        /INSERT INTO AuditLogs/,
      ];
      for (const contract of requiredContracts) {
        if (!contract.test(statement)) throw new Error(`RESET_SQL contract missing: ${contract}`);
      }

      if (!state.adminActive) throw new Error('No active Admin audit actor exists.');
      if (!state.memberEligible) {
        throw new Error('The configured staging Member is missing or ineligible.');
      }
      if (state.memberBlocker) {
        throw new Error('The configured staging Member has an unrelated borrowing blocker.');
      }

      const fixtureIsbns = [this.inputs.Fixture1Isbn, this.inputs.Fixture2Isbn];
      const fixtureBarcodes = [this.inputs.Fixture1Barcode, this.inputs.Fixture2Barcode];
      const fixtureTitles = [this.inputs.Fixture1Title, this.inputs.Fixture2Title];
      const bookById = (bookId) => state.books.find((book) => book.id === bookId);
      const copyById = (copyId) => state.copies.find((copy) => copy.id === copyId);
      const isTaggedCopy = (copyId) => {
        const copy = copyById(copyId);
        return Boolean(copy && fixtureIsbns.includes(bookById(copy.bookId)?.isbn));
      };

      for (const request of state.requests) {
        const details = state.details.filter((detail) => detail.requestId === request.id);
        const taggedCount = details.filter((detail) => isTaggedCopy(detail.copyId)).length;
        if (taggedCount > 0 && taggedCount !== details.length) {
          throw new Error('A borrow request mixes tagged and untagged copies.');
        }
      }
      if (state.copies.some((copy) => (
        isTaggedCopy(copy.id) && ['DAMAGED', 'LOST'].includes(copy.status)
      )) || state.details.some((detail) => (
        isTaggedCopy(detail.copyId) && ['DAMAGED', 'LOST'].includes(detail.status)
      ))) {
        throw new Error('A tagged copy is DAMAGED or LOST.');
      }

      const transitions = [];
      const nextId = (rows) => Math.max(0, ...rows.map((row) => row.id)) + 1;
      for (let index = 0; index < fixtureIsbns.length; index += 1) {
        let book = state.books.find((entry) => entry.isbn === fixtureIsbns[index]);
        if (!book) {
          book = {
            id: nextId(state.books),
            isbn: fixtureIsbns[index],
            title: fixtureTitles[index],
            status: 'ACTIVE',
          };
          state.books.push(book);
          transitions.push({ action: 'STAGING_FIXTURE_BOOK_CREATE', targetId: book.id });
        }
        if (book.title !== fixtureTitles[index]) {
          book.title = fixtureTitles[index];
          transitions.push({
            action: 'STAGING_FIXTURE_BOOK_TITLE_RESTORE',
            targetId: book.id,
          });
        }
        let copy = state.copies.find((entry) => entry.barcode === fixtureBarcodes[index]);
        if (!copy) {
          copy = {
            id: nextId(state.copies),
            bookId: book.id,
            barcode: fixtureBarcodes[index],
            location: this.inputs.Location,
            status: 'AVAILABLE',
          };
          state.copies.push(copy);
          transitions.push({ action: 'STAGING_FIXTURE_COPY_CREATE', targetId: copy.id });
        }
      }

      for (const request of state.requests) {
        const taggedDetails = state.details.filter((detail) => (
          detail.requestId === request.id && isTaggedCopy(detail.copyId)
        ));
        if (taggedDetails.length && request.status === 'PENDING') {
          request.status = 'REJECTED';
          transitions.push({ action: 'STAGING_BORROW_REQUEST_REJECT', targetId: request.id });
        }
        for (const detail of taggedDetails) {
          if (detail.status === 'BORROWED') {
            detail.status = 'RETURNED';
            detail.returnDate = this.inputs.BusinessDate;
            transitions.push({ action: 'STAGING_BORROW_DETAIL_RETURN', targetId: detail.id });
          }
        }
        if (
          taggedDetails.length
          && request.status === 'APPROVED'
          && !state.details.some((detail) => detail.requestId === request.id && detail.status === 'BORROWED')
        ) {
          request.status = 'COMPLETED';
          transitions.push({ action: 'STAGING_BORROW_REQUEST_COMPLETE', targetId: request.id });
        }
      }

      for (const reservation of state.reservations) {
        if (isTaggedCopy(reservation.copyId) && ['ACTIVE', 'NOTIFIED'].includes(reservation.status)) {
          reservation.status = 'CANCELLED';
          transitions.push({ action: 'STAGING_RESERVATION_CANCEL', targetId: reservation.id });
        }
      }
      for (const book of state.books) {
        if (fixtureIsbns.includes(book.isbn) && book.status === 'INACTIVE') {
          book.status = 'ACTIVE';
          transitions.push({ action: 'STAGING_FIXTURE_BOOK_REACTIVATE', targetId: book.id });
        }
      }
      for (const copy of state.copies) {
        if (isTaggedCopy(copy.id) && ['BORROWED', 'RESERVED', 'INACTIVE'].includes(copy.status)) {
          copy.status = 'AVAILABLE';
          copy.location = this.inputs.Location;
          transitions.push({ action: 'STAGING_FIXTURE_COPY_AVAILABLE', targetId: copy.id });
        }
      }

      state.audits.push(...transitions, { action: 'STAGING_BORROW_DEMO_RESET' });
      if (failAfterMutation) throw new Error('Injected failure after mutation');
      return {
        recordset: [{
          FixtureCount: 2,
          TransitionCount: transitions.length,
          BusinessDate: this.inputs.BusinessDate,
        }],
      };
    }
  }

  return {
    sql: {
      Transaction,
      Request,
      Int: 'Int',
      Date: 'Date',
      DateTime: 'DateTime',
      NVarChar: (size) => `NVarChar(${size})`,
    },
    transaction,
  };
}

function resetEnv() {
  return {
    DB_NAME: 'LibraryManagementStaging',
    STAGING_DEMO_ALLOW_MUTATION: 'true',
    STAGING_DEMO_MEMBER_EMAIL: 'demo.member@example.test',
  };
}

describe('staging borrow candidate operator script', () => {
  test('exports the approved stable fixture identities', () => {
    const { FIXTURES } = loadSubject();

    expect(FIXTURES).toEqual([
      {
        title: 'Staging Borrow Demo 1',
        isbn: 'STAGING-BORROW-DEMO1',
        barcode: 'STG-BORROW-DEMO-001',
        location: 'STAGING-DEMO',
      },
      {
        title: 'Staging Borrow Demo 2',
        isbn: 'STAGING-BORROW-DEMO2',
        barcode: 'STG-BORROW-DEMO-002',
        location: 'STAGING-DEMO',
      },
    ]);
  });

  test('guards status by exact staging DB and reset by the explicit mutation flag', () => {
    const { assertStagingDatabase, assertResetAllowed } = loadSubject();

    expect(() => assertStagingDatabase({ DB_NAME: 'LibraryManagement' }))
      .toThrow('DB_NAME must be LibraryManagementStaging');
    expect(() => assertResetAllowed({ DB_NAME: 'LibraryManagementStaging' }))
      .toThrow('STAGING_DEMO_ALLOW_MUTATION must be true');
    expect(() => assertResetAllowed({
      DB_NAME: 'LibraryManagementStaging',
      STAGING_DEMO_ALLOW_MUTATION: 'true',
    })).not.toThrow();
  });

  test('uses the Asia Ho Chi Minh business date at the UTC day boundary', () => {
    const { getBusinessDate } = loadSubject();
    expect(getBusinessDate(new Date('2026-08-03T17:30:00.000Z'))).toBe('2026-08-04');
  });

  test('status binds ownership markers and returns redacted fixture state', async () => {
    const { inspectFixtures } = loadSubject();
    const fake = makeSql({
      result: {
        recordset: [{
          BookId: 10,
          ISBN: 'STAGING-BORROW-DEMO1',
          BookStatus: 'ACTIVE',
          CopyId: 20,
          Barcode: 'STG-BORROW-DEMO-001',
          CopyStatus: 'AVAILABLE',
          OpenBorrowClaims: 0,
          OpenReservations: 0,
        }],
      },
    });
    const pool = { request: () => new fake.sql.Request(pool) };

    const state = await inspectFixtures({ pool, sql: fake.sql });

    expect(fake.requests[0].inputs).toMatchObject({
      IsbnPrefix: 'STAGING-BORROW-DEMO%',
      BarcodePrefix: 'STG-BORROW-DEMO-%',
      Location: 'STAGING-DEMO',
    });
    expect(state).toEqual([{
      bookId: 10,
      isbn: 'STAGING-BORROW-DEMO1',
      bookStatus: 'ACTIVE',
      copyId: 20,
      barcode: 'STG-BORROW-DEMO-001',
      copyStatus: 'AVAILABLE',
      openBorrowClaims: 0,
      openReservations: 0,
    }]);
    expect(JSON.stringify(state)).not.toMatch(/email|password|token|connection/i);
  });

  test('reset commits exactly one transaction after binding every operator value', async () => {
    const { resetFixtures } = loadSubject();
    const fake = makeSql();
    const pool = {};

    await resetFixtures({
      pool,
      sql: fake.sql,
      env: {
        DB_NAME: 'LibraryManagementStaging',
        STAGING_DEMO_ALLOW_MUTATION: 'true',
        STAGING_DEMO_MEMBER_EMAIL: 'demo.member@example.test',
      },
      now: new Date('2026-08-03T17:30:00.000Z'),
    });

    expect(fake.transaction.begin).toHaveBeenCalledTimes(1);
    expect(fake.transaction.commit).toHaveBeenCalledTimes(1);
    expect(fake.transaction.rollback).not.toHaveBeenCalled();
    expect(fake.requests[0].inputs).toMatchObject({
      MemberEmail: 'demo.member@example.test',
      BusinessDate: '2026-08-04',
      BusinessDayStartUtc: new Date('2026-08-03T17:00:00.000Z'),
      BusinessDayEndUtc: new Date('2026-08-04T17:00:00.000Z'),
      Fixture1Isbn: 'STAGING-BORROW-DEMO1',
      Fixture2Isbn: 'STAGING-BORROW-DEMO2',
      Marker: 'STAGING_BORROW_DEMO',
    });
  });

  test('stateful reset creates missing fixtures idempotently and preserves unrelated state', async () => {
    const { resetFixtures } = loadSubject();
    const state = {
      adminActive: true,
      memberEligible: true,
      memberBlocker: false,
      books: [{ id: 90, isbn: 'UNRELATED-ISBN', status: 'ACTIVE' }],
      copies: [{ id: 91, bookId: 90, barcode: 'UNRELATED-COPY', status: 'AVAILABLE' }],
      requests: [],
      details: [],
      reservations: [],
      audits: [],
      unrelatedSentinel: { value: 'unchanged' },
    };
    const fake = makeStatefulSql(state);

    const first = await resetFixtures({ pool: {}, sql: fake.sql, env: resetEnv() });
    const second = await resetFixtures({ pool: {}, sql: fake.sql, env: resetEnv() });

    expect(first.TransitionCount).toBe(4);
    expect(second.TransitionCount).toBe(0);
    expect(state.books.filter((book) => book.isbn.startsWith('STAGING-BORROW-DEMO')))
      .toHaveLength(2);
    expect(state.copies.filter((copy) => copy.barcode.startsWith('STG-BORROW-DEMO-')))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ status: 'AVAILABLE', location: 'STAGING-DEMO' }),
        expect.objectContaining({ status: 'AVAILABLE', location: 'STAGING-DEMO' }),
      ]));
    expect(state.audits.filter((audit) => audit.action === 'STAGING_BORROW_DEMO_RESET'))
      .toHaveLength(2);
    expect(state.unrelatedSentinel).toEqual({ value: 'unchanged' });
    expect(state.books.find((book) => book.id === 90)).toEqual({
      id: 90,
      isbn: 'UNRELATED-ISBN',
      status: 'ACTIVE',
    });
  });

  test('stateful reset restores distinct canonical fixture titles idempotently', async () => {
    const { resetFixtures } = loadSubject();
    const state = {
      adminActive: true,
      memberEligible: true,
      memberBlocker: false,
      books: [
        { id: 1, isbn: 'STAGING-BORROW-DEMO1', title: 'Drifted title', status: 'ACTIVE' },
        { id: 2, isbn: 'STAGING-BORROW-DEMO2', title: 'Drifted title', status: 'ACTIVE' },
      ],
      copies: [
        { id: 10, bookId: 1, barcode: 'STG-BORROW-DEMO-001', status: 'AVAILABLE' },
        { id: 11, bookId: 2, barcode: 'STG-BORROW-DEMO-002', status: 'AVAILABLE' },
      ],
      requests: [],
      details: [],
      reservations: [],
      audits: [],
    };
    const fake = makeStatefulSql(state);

    const first = await resetFixtures({ pool: {}, sql: fake.sql, env: resetEnv() });
    const second = await resetFixtures({ pool: {}, sql: fake.sql, env: resetEnv() });

    expect(first.TransitionCount).toBe(2);
    expect(second.TransitionCount).toBe(0);
    expect(state.books.map((book) => book.title)).toEqual([
      'Staging Borrow Demo 1',
      'Staging Borrow Demo 2',
    ]);
    expect(state.audits.filter((audit) => audit.action === 'STAGING_FIXTURE_BOOK_TITLE_RESTORE'))
      .toHaveLength(2);
  });

  test('stateful reset applies only canonical tagged transitions and audit rows', async () => {
    const { resetFixtures } = loadSubject();
    const state = {
      adminActive: true,
      memberEligible: true,
      memberBlocker: false,
      books: [
        { id: 1, isbn: 'STAGING-BORROW-DEMO1', title: 'Staging Borrow Demo 1', status: 'INACTIVE' },
        { id: 2, isbn: 'STAGING-BORROW-DEMO2', title: 'Staging Borrow Demo 2', status: 'ACTIVE' },
        { id: 3, isbn: 'UNRELATED-ISBN', status: 'ACTIVE' },
      ],
      copies: [
        { id: 10, bookId: 1, barcode: 'STG-BORROW-DEMO-001', status: 'RESERVED' },
        { id: 11, bookId: 2, barcode: 'STG-BORROW-DEMO-002', status: 'BORROWED' },
        { id: 12, bookId: 3, barcode: 'UNRELATED-COPY', status: 'AVAILABLE' },
      ],
      requests: [
        { id: 20, status: 'PENDING' },
        { id: 21, status: 'APPROVED' },
        { id: 22, status: 'PENDING' },
      ],
      details: [
        { id: 30, requestId: 20, copyId: 10, status: 'REQUESTED' },
        { id: 31, requestId: 21, copyId: 11, status: 'BORROWED' },
        { id: 32, requestId: 22, copyId: 12, status: 'REQUESTED' },
      ],
      reservations: [
        { id: 40, copyId: 10, status: 'NOTIFIED' },
        { id: 41, copyId: 12, status: 'ACTIVE' },
      ],
      audits: [],
    };
    const unrelatedBefore = clone({
      book: state.books[2],
      copy: state.copies[2],
      request: state.requests[2],
      detail: state.details[2],
      reservation: state.reservations[1],
    });
    const fake = makeStatefulSql(state);

    await resetFixtures({
      pool: {},
      sql: fake.sql,
      env: resetEnv(),
      now: new Date('2026-08-03T17:30:00.000Z'),
    });

    expect(state.requests[0].status).toBe('REJECTED');
    expect(state.details[0].status).toBe('REQUESTED');
    expect(state.requests[1].status).toBe('COMPLETED');
    expect(state.details[1]).toMatchObject({ status: 'RETURNED', returnDate: '2026-08-04' });
    expect(state.reservations[0].status).toBe('CANCELLED');
    expect(state.books.slice(0, 2).map((book) => book.status)).toEqual(['ACTIVE', 'ACTIVE']);
    expect(state.copies.slice(0, 2).map((copy) => copy.status)).toEqual(['AVAILABLE', 'AVAILABLE']);
    expect(state.audits.map((audit) => audit.action)).toEqual(expect.arrayContaining([
      'STAGING_BORROW_REQUEST_REJECT',
      'STAGING_BORROW_DETAIL_RETURN',
      'STAGING_BORROW_REQUEST_COMPLETE',
      'STAGING_RESERVATION_CANCEL',
      'STAGING_FIXTURE_BOOK_REACTIVATE',
      'STAGING_FIXTURE_COPY_AVAILABLE',
      'STAGING_BORROW_DEMO_RESET',
    ]));
    expect({
      book: state.books[2],
      copy: state.copies[2],
      request: state.requests[2],
      detail: state.details[2],
      reservation: state.reservations[1],
    }).toEqual(unrelatedBefore);
  });

  test('stateful reset rolls back every mutation after an injected SQL failure', async () => {
    const { resetFixtures } = loadSubject();
    const state = {
      adminActive: true,
      memberEligible: true,
      memberBlocker: false,
      books: [],
      copies: [],
      requests: [],
      details: [],
      reservations: [],
      audits: [],
    };
    const before = clone(state);
    const fake = makeStatefulSql(state, { failAfterMutation: true });

    await expect(resetFixtures({ pool: {}, sql: fake.sql, env: resetEnv() }))
      .rejects.toThrow('Injected failure after mutation');

    expect(fake.transaction.commit).not.toHaveBeenCalled();
    expect(fake.transaction.rollback).toHaveBeenCalledTimes(1);
    expect(state).toEqual(before);
  });

  test.each([
    'No active Admin audit actor exists.',
    'The configured staging Member is missing or ineligible.',
    'The configured staging Member has an unrelated borrowing blocker.',
    'A borrow request mixes tagged and untagged copies.',
    'A tagged copy is DAMAGED or LOST.',
    'Tagged workflow state is unexpected.',
  ])('reset rolls back database refusal: %s', async (message) => {
    const { resetFixtures } = loadSubject();
    const fake = makeSql({ error: new Error(message) });

    await expect(resetFixtures({
      pool: {},
      sql: fake.sql,
      env: {
        DB_NAME: 'LibraryManagementStaging',
        STAGING_DEMO_ALLOW_MUTATION: 'true',
        STAGING_DEMO_MEMBER_EMAIL: 'demo.member@example.test',
      },
    })).rejects.toThrow(message);

    expect(fake.transaction.begin).toHaveBeenCalledTimes(1);
    expect(fake.transaction.commit).not.toHaveBeenCalled();
    expect(fake.transaction.rollback).toHaveBeenCalledTimes(1);
  });

  test('reset SQL owns only exact fixtures, preserves history, transitions canonically and audits', () => {
    const {
      RESET_SQL,
    } = loadSubject();

    expect(RESET_SQL).toMatch(/WITH \(UPDLOCK, HOLDLOCK\)/);
    expect(RESET_SQL).toMatch(/br\.RequestDate >= @BusinessDayStartUtc/);
    expect(RESET_SQL).toMatch(/br\.RequestDate < @BusinessDayEndUtc/);
    expect(RESET_SQL).not.toMatch(/CAST\(br\.RequestDate AS DATE\) = @BusinessDate/);
    expect(RESET_SQL).toMatch(/THROW\s+5100\d,\s*'A borrow request mixes tagged and untagged copies\.'/);
    expect(RESET_SQL).toMatch(/Status = 'REJECTED'[\s\S]*WHERE[\s\S]*Status = 'PENDING'/);
    expect(RESET_SQL).toMatch(/Status = 'RETURNED'[\s\S]*ReturnDate = @BusinessDate/);
    expect(RESET_SQL).toMatch(/Status = 'COMPLETED'/);
    expect(RESET_SQL).toMatch(/Status = 'CANCELLED'/);
    expect(RESET_SQL).toMatch(/STAGING_BORROW_DEMO_RESET/);
    expect(RESET_SQL).toMatch(/INSERT INTO AuditLogs/);
    expect(RESET_SQL).toMatch(/NOT EXISTS[\s\S]*@Fixture1Isbn/);
    expect(RESET_SQL).toMatch(
      /LEFT JOIN Books b ON b\.BookId = bc\.BookId[\s\S]*?WHERE \(bc\.Barcode LIKE @BarcodePrefix OR bc\.Location = @Location OR b\.ISBN LIKE @IsbnPrefix\)[\s\S]*?AND NOT/
    );
    expect(RESET_SQL).toMatch(/br\.Status = 'APPROVED' AND bd\.Status = 'REQUESTED'/);
    expect(RESET_SQL).toMatch(/bd\.Status = 'BORROWED' AND bc\.Status <> 'BORROWED'/);
    expect(RESET_SQL).not.toMatch(/DELETE\s+FROM\s+(Books|BookCopies|BorrowRequests|BorrowDetails|Reservations|AuditLogs)/i);
    expect(RESET_SQL).not.toMatch(/UPDATE\s+BorrowDetails[\s\S]{0,180}Status\s*=\s*'REQUESTED'/i);
  });

  test('an exact fixture book with no copy reaches the idempotent copy insert', () => {
    const { RESET_SQL } = loadSubject();
    const unexpectedOwnershipGuard = RESET_SQL.match(
      /IF EXISTS \([\s\S]*?THROW 51006, 'Tagged workflow state is unexpected\.', 1;/
    )?.[0];

    expect(unexpectedOwnershipGuard).toMatch(
      /FROM BookCopies bc\s+LEFT JOIN Books b ON b\.BookId = bc\.BookId/
    );
    expect(unexpectedOwnershipGuard).not.toMatch(/FROM Books b\s+LEFT JOIN BookCopies bc/);
    expect(RESET_SQL).toMatch(
      /IF NOT EXISTS \(SELECT 1 FROM BookCopies WHERE Barcode = @Fixture1Barcode\)[\s\S]*?INSERT INTO BookCopies \(BookId, Barcode, Status, Location, CreatedAt\)[\s\S]*?VALUES \(@Fixture1BookId, @Fixture1Barcode, 'AVAILABLE', @Location, GETDATE\(\)\)/
    );
    expect(RESET_SQL).toMatch(
      /IF NOT EXISTS \(SELECT 1 FROM BookCopies WHERE Barcode = @Fixture2Barcode\)[\s\S]*?INSERT INTO BookCopies \(BookId, Barcode, Status, Location, CreatedAt\)[\s\S]*?VALUES \(@Fixture2BookId, @Fixture2Barcode, 'AVAILABLE', @Location, GETDATE\(\)\)/
    );
  });

  test('run rejects an unknown mode before opening a database pool', async () => {
    const { run } = loadSubject();
    const db = { getPool: jest.fn() };

    await expect(run({ argv: ['destroy'], env: {}, db })).rejects.toThrow(
      'Mode must be status or reset'
    );
    expect(db.getPool).not.toHaveBeenCalled();
  });

  test('script has no import-time execution or sensitive output', () => {
    const source = readFileSync(scriptPath, 'utf8');
    expect(source).toMatch(/if \(require\.main === module\)/);
    expect(source).not.toMatch(/console\.(?:log|table)\([^\n]*(?:MemberEmail|PasswordHash|DB_PASSWORD|JWT_SECRET)/);
    expect(source).not.toMatch(/`[^`]*\$\{[^}]+\}[^`]*`[\s\S]{0,80}\.query\(/);
  });
});
