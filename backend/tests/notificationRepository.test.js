const fs = require('fs');
const path = require('path');

const repositorySource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'repositories', 'notificationRepository.js'),
  'utf8'
);

test('pending worker claims one row with update, read-past, and hold locks', () => {
  expect(repositorySource).toMatch(/async function claimNextPending/);
  expect(repositorySource).toMatch(
    /FROM Notifications WITH \(UPDLOCK, READPAST, HOLDLOCK, ROWLOCK\)/i
  );
  expect(repositorySource).toMatch(/WHERE Status = 'PENDING'/i);
  expect(repositorySource).toMatch(/ORDER BY CreatedAt ASC, NotificationId ASC/i);
});

test('claimed completion guards the pending state and uses the claim transaction', () => {
  expect(repositorySource).toMatch(/async function markClaimSent/);
  expect(repositorySource).toMatch(/async function markClaimFailed/);
  expect(repositorySource).toMatch(
    /WHERE NotificationId = @NotificationId\s+AND Status = 'PENDING'/i
  );
  expect(repositorySource).toMatch(/new sql\.Request\(claim\.transaction\)/);
});
