jest.mock('../src/config/db', () => ({
  sql: {
    DateTime: 'DateTime',
    Date: 'Date',
    Int: 'Int',
    NVarChar: (size) => `NVarChar(${size})`,
    Transaction: class Transaction {
      static instances = [];

      constructor(pool) {
        this.pool = pool;
        this.commitCount = 0;
        this.rollbackCount = 0;
        Transaction.instances.push(this);
      }

      async begin() {}

      async commit() {
        this.commitCount += 1;
      }

      async rollback() {
        this.rollbackCount += 1;
      }
    },
    Request: class Request {
      constructor(transaction) {
        this.transaction = transaction;
      }

      input() {
        return this;
      }

      async query(query) {
        return this.transaction.pool.transactionQuery(query);
      }
    },
  },
  getPool: jest.fn(),
}));

const { sql, getPool } = require('../src/config/db');
const borrowingRepository = require('../src/repositories/borrowingRepository');
const fs = require('fs');
const path = require('path');

const repositorySource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'repositories', 'borrowingRepository.js'),
  'utf8'
);

function useRecordset(recordset = []) {
  const capture = { inputs: {}, query: '' };

  getPool.mockResolvedValue({
    request() {
      return {
        input(name, _type, value) {
          capture.inputs[name] = value;
          return this;
        },
        async query(query) {
          capture.query = query;
          return { recordset };
        },
      };
    },
  });

  return capture;
}

beforeEach(() => {
  getPool.mockReset();
  sql.Transaction.instances = [];
});

function usePostCommitReadbackFailure(operation) {
  const readbackError = new Error(`${operation} readback failed`);
  const pool = {
    request() {
      return {
        input() {
          return this;
        },
        async query() {
          throw readbackError;
        },
      };
    },
    async transactionQuery(query) {
      if (operation === 'create' && query.includes('INSERT INTO BorrowRequests')) {
        return { recordset: [{ RequestId: 41 }] };
      }

      if (operation === 'approve') {
        if (query.includes('SELECT br.RequestId, br.UserId, bd.CopyId')) {
          return { recordset: [{ RequestId: 41, UserId: 9, CopyId: 7 }] };
        }
        if (query.includes('FROM BorrowRequests WITH (UPDLOCK, HOLDLOCK)')) {
          return { recordset: [{ RequestId: 41, UserId: 9 }] };
        }
        if (query.includes('MemberStatus')) {
          return {
            recordset: [{
              MemberId: 1,
              UserStatus: 'ACTIVE',
              MemberStatus: 'APPROVED',
              HasMemberRole: 1,
            }],
          };
        }
        if (query.includes('SELECT bd.CopyId')) {
          return { recordset: [{ CopyId: 7 }] };
        }
        if (query.includes('SELECT bc.CopyId, bc.Status')) {
          return { recordset: [{ CopyId: 7, Status: 'AVAILABLE', BookStatus: 'ACTIVE' }] };
        }
        if (query.includes('COUNT(*) AS ActiveCount')) {
          return { recordset: [{ ActiveCount: 0 }] };
        }
      }

      if (operation === 'return') {
        if (query.includes('SELECT RequestId, CopyId')) {
          return { recordset: [{ RequestId: 41, CopyId: 7 }] };
        }
        if (query.includes('SELECT CopyId, Status')) {
          return { recordset: [{ CopyId: 7, Status: 'BORROWED' }] };
        }
        if (query.includes('SELECT BorrowDetailId, RequestId, CopyId, Status')) {
          return {
            recordset: [{
              BorrowDetailId: 4,
              RequestId: 41,
              CopyId: 7,
              Status: 'BORROWED',
            }],
          };
        }
        if (query.includes('SELECT BorrowDetailId, Status')) {
          return { recordset: [{ BorrowDetailId: 4, Status: 'BORROWED' }] };
        }
        if (query.includes('OUTPUT INSERTED.RequestId, INSERTED.CopyId')) {
          return { recordset: [{ RequestId: 41, CopyId: 7 }] };
        }
        if (query.includes('UPDATE BookCopies')) {
          return { recordset: [], rowsAffected: [1] };
        }
      }

      return { recordset: [] };
    },
  };

  getPool.mockResolvedValue(pool);
  return readbackError;
}

test('borrow request and detail SQL toDate filters use an exclusive next-day boundary', async () => {
  const requestCapture = useRecordset();
  await borrowingRepository.listBorrowRequests({ toDate: '2026-06-11' });

  expect(requestCapture.query).toContain('br.RequestDate < @ToDateExclusive');
  expect(requestCapture.inputs.ToDateExclusive.toISOString()).toBe('2026-06-12T00:00:00.000Z');

  const detailCapture = useRecordset();
  await borrowingRepository.listBorrowDetails({ toDate: '2026-06-11' });

  expect(detailCapture.query).toContain('COALESCE(bd.BorrowDate, br.RequestDate) < @ToDateExclusive');
  expect(detailCapture.inputs.ToDateExclusive.toISOString()).toBe('2026-06-12T00:00:00.000Z');
});

test.each([
  [
    'create',
    () => borrowingRepository.createBorrowRequest({ userId: 9, copyIds: [7] }),
  ],
  [
    'approve',
    () =>
      borrowingRepository.approveBorrowRequest({
        requestId: 41,
        approvedBy: 2,
        approvalDate: new Date('2026-07-13T00:00:00.000Z'),
        dueDate: new Date('2026-07-27T00:00:00.000Z'),
      }),
  ],
  [
    'return',
    () =>
      borrowingRepository.returnBorrowDetail({
        borrowDetailId: 4,
        detailStatus: 'RETURNED',
        copyStatus: 'AVAILABLE',
        returnDate: new Date('2026-07-13T00:00:00.000Z'),
      }),
  ],
])('%s preserves a post-commit readback error without a rollback', async (operation, invoke) => {
  const readbackError = usePostCommitReadbackFailure(operation);

  await expect(invoke()).rejects.toBe(readbackError);

  const transaction = sql.Transaction.instances.at(-1);
  expect(transaction.commitCount).toBe(1);
  expect(transaction.rollbackCount).toBe(0);
});

test('approval revalidates MEMBER role and derives the daily tier inside the transaction', () => {
  const start = repositorySource.indexOf('async function approveBorrowRequest');
  const end = repositorySource.indexOf('async function rejectBorrowRequest', start);
  const source = repositorySource.slice(start, end);

  expect(source).toContain("r.RoleName = 'MEMBER'");
  expect(source).toContain("member.MemberStatus === 'APPROVED'");
  expect(source).toContain("outcome: 'MEMBER_ROLE_REQUIRED'");
});

test('approval locks member scope, copies, request details, then reservations', () => {
  const start = repositorySource.indexOf('async function approveBorrowRequest');
  const end = repositorySource.indexOf('async function rejectBorrowRequest', start);
  const source = repositorySource.slice(start, end);
  const memberLockIndex = source.indexOf('sp_getapplock');
  const copyLockIndex = source.indexOf('FROM BookCopies bc WITH (UPDLOCK, HOLDLOCK)');
  const requestLockIndex = source.indexOf('FROM BorrowRequests WITH (UPDLOCK, HOLDLOCK)');
  const detailLockIndex = source.indexOf('FROM BorrowDetails bd WITH (UPDLOCK, HOLDLOCK)');
  const reservationLockIndex = source.indexOf('FROM Reservations WITH (UPDLOCK, HOLDLOCK)');

  expect(memberLockIndex).toBeGreaterThanOrEqual(0);
  expect(copyLockIndex).toBeGreaterThan(memberLockIndex);
  expect(requestLockIndex).toBeGreaterThan(copyLockIndex);
  expect(detailLockIndex).toBeGreaterThan(requestLockIndex);
  expect(reservationLockIndex).toBeGreaterThan(detailLockIndex);
});

test('return locks BookCopies, BorrowDetails, and Reservations before mutation', () => {
  const start = repositorySource.indexOf('async function returnBorrowDetail');
  const end = repositorySource.indexOf('async function renewBorrowDetail', start);
  const source = repositorySource.slice(start, end);
  const copyLockIndex = source.indexOf('FROM BookCopies WITH (UPDLOCK, HOLDLOCK)');
  const detailLockIndex = source.indexOf('FROM BorrowDetails WITH (UPDLOCK, HOLDLOCK)');
  const reservationLockIndex = source.indexOf('FROM Reservations WITH (UPDLOCK, HOLDLOCK)');
  const mutationIndex = source.indexOf('UPDATE BorrowDetails');

  expect(copyLockIndex).toBeGreaterThanOrEqual(0);
  expect(detailLockIndex).toBeGreaterThan(copyLockIndex);
  expect(reservationLockIndex).toBeGreaterThan(detailLockIndex);
  expect(mutationIndex).toBeGreaterThan(reservationLockIndex);
});
