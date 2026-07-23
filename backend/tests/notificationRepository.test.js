const fs = require('fs');
const path = require('path');
const {
  makeInMemoryNotificationDependencies,
} = require('./helpers/inMemoryNotificationRepositories');

const repositorySource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'repositories', 'notificationRepository.js'),
  'utf8'
);

test('pending worker atomically commits one row into PROCESSING before provider I/O', () => {
  expect(repositorySource).toMatch(/async function claimNextPending/);
  expect(repositorySource).toMatch(
    /FROM Notifications WITH \(UPDLOCK, READPAST, HOLDLOCK, ROWLOCK\)/i
  );
  expect(repositorySource).toMatch(/WHERE Status = 'PENDING'/i);
  expect(repositorySource).toMatch(/ORDER BY CreatedAt ASC, NotificationId ASC/i);
  expect(repositorySource).toMatch(/SET Status = 'PROCESSING'/i);
  const claimStart = repositorySource.indexOf('async function claimNextPending');
  const claimEnd = repositorySource.indexOf('async function markClaimSent', claimStart);
  const claimSource = repositorySource.slice(claimStart, claimEnd);
  expect(claimSource).toMatch(/transaction\.commit/);
  expect(claimSource).not.toMatch(/return \{ notification, transaction \}/);
});

test('claimed completion opens a new transaction and guards the PROCESSING state', () => {
  expect(repositorySource).toMatch(/async function markClaimSent/);
  expect(repositorySource).toMatch(/async function markClaimFailed/);
  expect(repositorySource).toMatch(
    /WHERE NotificationId = @NotificationId\s+AND Status = 'PROCESSING'/i
  );
  expect(repositorySource).not.toMatch(/new sql\.Request\(claim\.transaction\)/);
  expect(repositorySource).toMatch(/new sql\.Transaction\(pool\)/);
});

test('synchronous sensitive terminal transitions also guard PROCESSING', () => {
  for (const functionName of ['markSent', 'markFailed']) {
    const start = repositorySource.indexOf(`async function ${functionName}`);
    const next = functionName === 'markSent' ? 'async function markFailed' : 'module.exports';
    const end = repositorySource.indexOf(next, start);
    const source = repositorySource.slice(start, end);
    expect(source).toMatch(/AND Status = 'PROCESSING'/i);
  }
});

test('in-memory terminal transitions reject the same stale PROCESSING state as SQL', async () => {
  const dependencies = makeInMemoryNotificationDependencies();
  dependencies.state.notifications.push({
    notificationId: 41,
    status: 'SENT',
  });

  await expect(
    dependencies.notificationRepository.markClaimSent({
      claim: { notificationId: 41 },
      providerMessageId: 'provider-41',
    })
  ).rejects.toThrow('Claimed notification is no longer processing.');
  await expect(
    dependencies.notificationRepository.markClaimFailed({
      claim: { notificationId: 41 },
      safeErrorMessage: 'Provider unavailable.',
    })
  ).rejects.toThrow('Claimed notification is no longer processing.');
  await expect(
    dependencies.notificationRepository.markSent({
      notificationId: 41,
      providerMessageId: 'provider-41',
    })
  ).rejects.toThrow('Notification is no longer processing.');
  await expect(
    dependencies.notificationRepository.markFailed({
      notificationId: 41,
      safeErrorMessage: 'Provider unavailable.',
    })
  ).rejects.toThrow('Notification is no longer processing.');
});

test('canonical FE10 schema, model, migration, and API include PROCESSING safely', () => {
  const root = path.join(__dirname, '..', '..');
  const baseline = fs.readFileSync(path.join(root, 'database', 'Librarymanagement.sql'), 'utf8');
  const model = fs.readFileSync(path.join(__dirname, '..', 'src', 'models', 'Notification.js'), 'utf8');
  const migration = fs.readFileSync(
    path.join(root, 'database', 'migrations', '2026-07-23-fe10-processing-status.sql'),
    'utf8'
  );
  const openapi = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'docs', 'openapi.yaml'),
    'utf8'
  );

  expect(baseline).toMatch(/CK_Notifications_Status[\s\S]*'PROCESSING'/);
  expect(model).toMatch(/allowedValues:[^\r\n]*'PROCESSING'/);
  expect(openapi).toMatch(/enum: \[PENDING, PROCESSING, SENT, DELIVERED, FAILED/);
  expect(migration).toMatch(/SET XACT_ABORT ON/i);
  expect(migration).toMatch(/OBJECT_ID\('dbo\.Notifications', 'U'\)/i);
  expect(migration).toMatch(/definition LIKE '%PROCESSING%'/i);
  expect(migration).toMatch(/BEGIN TRANSACTION/i);
  expect(migration).toMatch(/COMMIT TRANSACTION/i);
  expect(migration).toMatch(/ROLLBACK TRANSACTION/i);
  expect(migration).toMatch(/THROW/i);
  expect(migration).not.toMatch(/\b(?:INSERT|UPDATE|DELETE)\s+(?:INTO\s+|FROM\s+)?dbo\.Notifications/i);
});
