const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('FE11 migration is guarded, transactional, and idempotent', () => {
  const migrationPath = path.join(root, 'database/migrations/2026-07-19-fe11-finalization.sql');
  const migrationExists = fs.existsSync(migrationPath);
  expect(migrationExists).toBe(true);
  if (!migrationExists) return;

  const sql = read('database/migrations/2026-07-19-fe11-finalization.sql');

  expect(sql).toMatch(/SET XACT_ABORT ON/i);
  expect(sql).toMatch(/BEGIN TRANSACTION/i);
  expect(sql).toMatch(/OBJECT_ID\('dbo\.Users', 'U'\)/i);
  expect(sql).toMatch(/COL_LENGTH\('dbo\.Users', 'DeactivatedAt'\)/i);
  expect(sql).toMatch(/COL_LENGTH\('dbo\.UserProfiles', 'Department'\)/i);
  expect(sql).toMatch(/COL_LENGTH\('dbo\.UserProfiles', 'Specialization'\)/i);
  expect(sql).toMatch(/Notifications[\s\S]*RecipientEmail/i);
  expect(sql).toMatch(/UX_Users_Email/i);
  expect(sql).toMatch(/Users\.Email contains case-insensitive duplicates/i);
  expect(sql).toMatch(/COMMIT TRANSACTION/i);
  expect(sql).toMatch(/ROLLBACK TRANSACTION/i);
  expect(sql).toMatch(/THROW/i);
  expect(sql).not.toMatch(/INSERT\s+INTO\s+(?:dbo\.)?Users|demo_admin|PasswordHash/i);
});

test('FE11 migration repairs canonical SQL types and nullability, not byte widths alone', () => {
  const sql = read('database/migrations/2026-07-19-fe11-finalization.sql');

  expect(sql).toMatch(/DECLARE @EmailTypeName SYSNAME/i);
  expect(sql).toMatch(/DECLARE @EmailIsNullable BIT/i);
  expect(sql).toMatch(
    /@EmailTypeName <> 'nvarchar'[\s\S]*@EmailMaxLength <> 510[\s\S]*@EmailIsNullable <> 0/i
  );
  expect(sql).toMatch(
    /c\.name = 'Department'[\s\S]{0,180}t\.name <> 'nvarchar'[\s\S]{0,120}c\.max_length <> 200/i
  );
  expect(sql).toMatch(
    /c\.name = 'Specialization'[\s\S]{0,180}t\.name <> 'nvarchar'[\s\S]{0,120}c\.max_length <> 200/i
  );
  expect(sql).toMatch(
    /c\.name = 'RecipientEmail'[\s\S]{0,180}t\.name <> 'nvarchar'[\s\S]{0,120}c\.max_length <> 510[\s\S]{0,80}c\.is_nullable = 1/i
  );
});

test('FE11 migration builds identifier-safe dynamic SQL before execution', () => {
  const sql = read('database/migrations/2026-07-19-fe11-finalization.sql');

  expect(sql).toMatch(/DECLARE @DropEmailIndexSql NVARCHAR\(MAX\)/i);
  expect(sql).toMatch(/SET @DropEmailIndexSql[\s\S]*QUOTENAME\(@EmailIndexName\)/i);
  expect(sql).toMatch(/EXEC sys\.sp_executesql @DropEmailIndexSql/i);
  expect(sql).not.toMatch(/EXEC\(N'[^\r\n]*QUOTENAME\(/i);
});

test('baseline, models, and SQL bindings use canonical FE11 widths', () => {
  const baseline = read('database/Librarymanagement.sql');
  const userModel = read('backend/src/models/User.js');
  const profileModel = read('backend/src/models/UserProfile.js');
  const notificationModel = read('backend/src/models/Notification.js');
  const userRepository = read('backend/src/repositories/userRepository.js');
  const accountSetupRepository = read('backend/src/repositories/accountSetupRepository.js');
  const notificationRepository = read('backend/src/repositories/notificationRepository.js');

  expect(baseline).toMatch(/Email NVARCHAR\(255\) NOT NULL/);
  expect(baseline).toMatch(/DeactivatedAt DATETIME NULL/);
  expect(baseline).toMatch(/Department NVARCHAR\(100\) NULL/);
  expect(baseline).toMatch(/Specialization NVARCHAR\(100\) NULL/);
  expect(baseline).toMatch(/RecipientEmail NVARCHAR\(255\) NOT NULL/);
  expect(baseline).toMatch(/CREATE UNIQUE INDEX UX_Users_Email ON Users\(Email\)/);
  expect(baseline).not.toMatch(/Email NVARCHAR\(255\) UNIQUE NOT NULL/);

  expect(userModel).toMatch(/attribute: 'deactivatedAt'[\s\S]*name: 'DeactivatedAt'/);
  expect(profileModel).toMatch(/attribute: 'department'[\s\S]*NVARCHAR\(100\)/);
  expect(profileModel).toMatch(/attribute: 'specialization'[\s\S]*NVARCHAR\(100\)/);
  expect(notificationModel).toMatch(/RecipientEmail'[\s\S]*NVARCHAR\(255\)/);

  expect(userRepository).not.toMatch(/Email', sql\.NVarChar\(100\)/);
  expect(userRepository).toMatch(/Identifier', sql\.NVarChar\(255\)/);
  expect(accountSetupRepository).toMatch(/Email', sql\.NVarChar\(255\)/);
  expect(notificationRepository).not.toMatch(/RecipientEmail'[\s\S]{0,80}NVarChar\(100\)/);
  expect(notificationRepository).toMatch(/RecipientEmail'[\s\S]{0,80}NVarChar\(255\)/);
});
