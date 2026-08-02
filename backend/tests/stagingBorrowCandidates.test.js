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
      NVarChar: (size) => `NVarChar(${size})`,
    },
    transaction,
    requests,
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
      Fixture1Isbn: 'STAGING-BORROW-DEMO1',
      Fixture2Isbn: 'STAGING-BORROW-DEMO2',
      Marker: 'STAGING_BORROW_DEMO',
    });
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
