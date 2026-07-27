const fs = require('fs');
const path = require('path');

const migrationPath = path.join(
  __dirname,
  '..',
  '..',
  'database',
  'migrations',
  '2026-07-22-library-metadata-compatibility.sql'
);

test('library metadata migration is transactional and idempotently adds deployed schema columns', () => {
  expect(fs.existsSync(migrationPath)).toBe(true);
  const source = fs.readFileSync(migrationPath, 'utf8');

  expect(source).toMatch(/SET XACT_ABORT ON/i);
  expect(source).toMatch(/BEGIN TRANSACTION/i);
  expect(source).toMatch(/COMMIT TRANSACTION/i);
  expect(source).toMatch(/ROLLBACK TRANSACTION/i);

  for (const table of ['Authors', 'Publishers', 'Categories']) {
    expect(source).toMatch(new RegExp(`COL_LENGTH\\(N'dbo\\.${table}', N'Status'\\) IS NULL`, 'i'));
    expect(source).toMatch(new RegExp(`COL_LENGTH\\(N'dbo\\.${table}', N'CreatedAt'\\) IS NULL`, 'i'));
    expect(source).toMatch(new RegExp(`ALTER TABLE dbo\\.${table} ADD Status`, 'i'));
    expect(source).toMatch(new RegExp(`ALTER TABLE dbo\\.${table} ADD CreatedAt`, 'i'));
  }

  expect(source).toMatch(
    /EXEC\s+sys\.sp_executesql\s+N'[\s\S]*FROM dbo\.Authors WHERE Status[\s\S]*FROM dbo\.Publishers WHERE Status[\s\S]*FROM dbo\.Categories WHERE Status/i
  );
});
