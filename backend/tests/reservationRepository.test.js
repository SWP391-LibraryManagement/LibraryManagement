const fs = require('fs');
const path = require('path');

const repositorySource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'repositories', 'reservationRepository.js'),
  'utf8'
);

test('reservation create revalidates role, copy, duplicate, and open limit in one transaction', () => {
  const createStart = repositorySource.indexOf('async function createReservation');
  const createEnd = repositorySource.indexOf('async function listReservations', createStart);
  const source = repositorySource.slice(createStart, createEnd);

  expect(source).toContain('sp_getapplock');
  expect(source).toContain("r.RoleName = 'MEMBER'");
  expect(source).toContain("Status IN ('ACTIVE', 'NOTIFIED')");
  expect(source).toContain('DUPLICATE_ACTIVE_RESERVATION');
  expect(source).toContain('ACTIVE_RESERVATION_LIMIT');
  expect(source).toContain('INSERT INTO Reservations');
});

test('reservation create follows member lock then BookCopies then Reservations', () => {
  const createStart = repositorySource.indexOf('async function createReservation');
  const createEnd = repositorySource.indexOf('async function listReservations', createStart);
  const source = repositorySource.slice(createStart, createEnd);
  const memberLockIndex = source.indexOf('sp_getapplock');
  const copyLockIndex = source.indexOf('FROM BookCopies bc WITH (UPDLOCK, HOLDLOCK)');
  const reservationLockIndex = source.indexOf('FROM Reservations WITH (UPDLOCK, HOLDLOCK)');

  expect(memberLockIndex).toBeGreaterThanOrEqual(0);
  expect(copyLockIndex).toBeGreaterThan(memberLockIndex);
  expect(reservationLockIndex).toBeGreaterThan(copyLockIndex);
});

test('queue lookup requires the current MEMBER role as well as an active account', () => {
  const lookupStart = repositorySource.indexOf('async function findNextActiveReservationForCopy');
  const lookupEnd = repositorySource.indexOf('async function holdReservation', lookupStart);
  const source = repositorySource.slice(lookupStart, lookupEnd);

  expect(source).toContain("role.RoleName = 'MEMBER'");
  expect(source).toContain('FROM UserRoles');
  expect(source).toContain('INNER JOIN Roles');
});

test('queue hold revalidates current account and MEMBER role inside the transaction', () => {
  const holdStart = repositorySource.indexOf('async function holdReservation');
  const holdEnd = repositorySource.indexOf('async function expireOverdueHolds', holdStart);
  const source = repositorySource.slice(holdStart, holdEnd);
  const memberLockIndex = source.indexOf('sp_getapplock');
  const memberRowsIndex = source.indexOf('FROM Users u WITH (UPDLOCK, HOLDLOCK)');
  const copyLockIndex = source.indexOf('FROM BookCopies WITH (UPDLOCK, HOLDLOCK)');
  const reservationLockIndex = source.indexOf('FROM Reservations r WITH (UPDLOCK, HOLDLOCK)');

  expect(source).toContain('FE08-RESERVATION-MEMBER-');
  expect(memberLockIndex).toBeGreaterThanOrEqual(0);
  expect(memberRowsIndex).toBeGreaterThan(memberLockIndex);
  expect(copyLockIndex).toBeGreaterThan(memberRowsIndex);
  expect(reservationLockIndex).toBeGreaterThan(copyLockIndex);
  expect(source).toContain("eligibilityRole.RoleName = 'MEMBER'");
  expect(source).toContain("u.Status = 'ACTIVE'");
  expect(source).toContain("outcome: 'MEMBER_INELIGIBLE'");
});

test('reservation reads derive queue position from the current ACTIVE FIFO rows', () => {
  const selectStart = repositorySource.indexOf('const reservationSelect');
  const selectEnd = repositorySource.indexOf('function mapCopy', selectStart);
  const source = repositorySource.slice(selectStart, selectEnd);

  expect(source).not.toContain('r.QueuePosition,');
  expect(source).toContain("queueReservation.Status = 'ACTIVE'");
  expect(source).toContain('queueReservation.ReservedAt < r.ReservedAt');
  expect(source).toContain('queueReservation.ReservationId <= r.ReservationId');
});

test.each([
  ['createReservation', 'listReservations'],
  ['cancelReservation', 'findNextActiveReservationForCopy'],
  ['holdReservation', 'expireOverdueHolds'],
  ['expireOverdueHolds', 'module.exports'],
])('%s writes its lifecycle audit before committing the mutation transaction', (functionName, nextName) => {
  const start = repositorySource.indexOf(`async function ${functionName}`);
  const end = repositorySource.indexOf(nextName === 'module.exports' ? nextName : `async function ${nextName}`, start);
  const source = repositorySource.slice(start, end);
  const auditIndex = source.indexOf('auditLogRepository.create');
  const commitIndex = source.indexOf('transaction.commit');

  expect(source).toContain('auditLogRepository');
  expect(source).toContain('auditEntry');
  expect(auditIndex).toBeGreaterThanOrEqual(0);
  expect(commitIndex).toBeGreaterThan(auditIndex);
  expect(source.slice(auditIndex, commitIndex)).toContain('transaction');
});
