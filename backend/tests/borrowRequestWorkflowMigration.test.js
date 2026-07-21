const fs = require('fs');
const path = require('path');

const migrationPath = path.join(
  __dirname,
  '..',
  '..',
  'database',
  'migrations',
  '2026-07-22-borrow-request-workflow-columns.sql'
);

test('borrow-request workflow migration supports approve and reject on deployed databases', () => {
  expect(fs.existsSync(migrationPath)).toBe(true);
  const source = fs.readFileSync(migrationPath, 'utf8');

  expect(source).toMatch(/SET XACT_ABORT ON/i);
  expect(source).toMatch(/BEGIN TRANSACTION/i);
  expect(source).toMatch(/COMMIT TRANSACTION/i);
  expect(source).toMatch(/ROLLBACK TRANSACTION/i);
  for (const column of ['ApprovedAt', 'RejectedAt', 'ProcessedAt', 'UpdatedAt']) {
    expect(source).toMatch(new RegExp(`COL_LENGTH\\(N'dbo\\.BorrowRequests', N'${column}'\\) IS NULL`, 'i'));
    expect(source).toMatch(new RegExp(`ALTER TABLE dbo\\.BorrowRequests ADD ${column} DATETIME NULL`, 'i'));
  }
});
