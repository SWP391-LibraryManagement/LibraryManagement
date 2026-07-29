const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const canonicalSchemaPath = path.join(root, 'database', 'Librarymanagement.sql');
const migrationPath = path.join(
  root,
  'database',
  'migrations',
  '2026-07-27-fe10-personal-inbox-read-state.sql'
);
const borrowingResultMigrationPath = path.join(
  root,
  'database',
  'migrations',
  '2026-07-29-fe10-borrowing-result-templates.sql'
);
const modelPath = path.join(__dirname, '..', 'src', 'models', 'Notification.js');

// @spec BR-FE10-016 BR-FE10-019 FR-FE10-013 FR-FE10-014 AC-FE10-013 AC-FE10-014
test('canonical FE10 schema and model expose nullable DATETIME2 read state', () => {
  const schema = fs.readFileSync(canonicalSchemaPath, 'utf8');
  const model = fs.readFileSync(modelPath, 'utf8');

  expect(schema).toMatch(/ReadAt\s+DATETIME2\s+NULL/i);
  expect(model).toMatch(
    /attribute:\s*'readAt',[^\r\n]*name:\s*'ReadAt',[^\r\n]*type:\s*'DATETIME2',[^\r\n]*nullable:\s*true/i
  );
});

// @spec BR-FE10-015 BR-FE10-019 FR-FE10-011 AC-FE10-011
test('personal inbox migration is transactional, repeatable, and backfills only first-run eligible rows', () => {
  const exists = fs.existsSync(migrationPath);
  expect(exists).toBe(true);
  if (!exists) return;

  const migration = fs.readFileSync(migrationPath, 'utf8');
  const addBranch = migration.match(
    /IF\s+COL_LENGTH\('dbo\.Notifications',\s*'ReadAt'\)\s+IS\s+NULL\s*BEGIN([\s\S]*?)END\s*;/i
  );

  expect(migration).toMatch(/SET\s+XACT_ABORT\s+ON/i);
  expect(migration).toMatch(/BEGIN\s+TRANSACTION/i);
  expect(migration).toMatch(/COMMIT\s+TRANSACTION/i);
  expect(migration).toMatch(/ROLLBACK\s+TRANSACTION/i);
  expect(migration).toMatch(/THROW\s*;/i);
  expect(migration).toMatch(
    /ALTER\s+TABLE\s+dbo\.Notifications\s+ADD\s+ReadAt\s+DATETIME2\s+NULL/i
  );
  expect(addBranch).not.toBeNull();
  expect(addBranch?.[1]).toMatch(/SET\s+ReadAt\s*=\s*CAST\(CreatedAt\s+AS\s+DATETIME2\)/i);
  expect(addBranch?.[1]).toMatch(/WHERE\s+UserId\s+IS\s+NOT\s+NULL/i);
  expect(migration.match(/SET\s+ReadAt\s*=/gi)).toHaveLength(1);
});

// @spec BR-FE10-019 AC-FE10-013
test('personal inbox migration defers ReadAt statement compilation until after the additive ALTER', () => {
  const migration = fs.readFileSync(migrationPath, 'utf8');

  expect(migration).toMatch(
    /EXEC\s+sys\.sp_executesql\s+N'[\s\S]*?UPDATE\s+dbo\.Notifications[\s\S]*?SET\s+ReadAt/i
  );
  expect(migration).toMatch(
    /EXEC\s+sys\.sp_executesql\s+N'[\s\S]*?CREATE\s+INDEX\s+IX_Notifications_User_ReadAt_CreatedAt/i
  );
});

// @spec BR-FE10-015 BR-FE10-020 FR-FE10-011 FR-FE10-012 AC-FE10-011 AC-FE10-012
test('personal inbox migration uses the exact eligible type-template allowlist and covering index', () => {
  const exists = fs.existsSync(migrationPath);
  expect(exists).toBe(true);
  if (!exists) return;

  const migration = fs.readFileSync(migrationPath, 'utf8');

  for (const [type, templateKey] of [
    ['GENERAL_SYSTEM', 'MEMBERSHIP_RESULT'],
    ['RESERVATION_AVAILABLE', 'RESERVATION_READY'],
    ['DUE_DATE_REMINDER', 'DUE_DATE_REMINDER'],
    ['OVERDUE_NOTICE', 'OVERDUE_NOTICE'],
    ['FINE_NOTICE', 'FINE_NOTICE'],
  ]) {
    expect(migration).toMatch(
      new RegExp(
        `NotificationType\\s*=\\s*'{1,2}${type}'{1,2}[\\s\\S]{0,120}TemplateKey\\s*=\\s*'{1,2}${templateKey}'{1,2}`,
        'i'
      )
    );
  }

  for (const sensitiveType of [
    'ACCOUNT_VERIFICATION',
    'PASSWORD_RESET',
    'ACCOUNT_SETUP',
    'EMAIL_VERIFY',
  ]) {
    expect(migration).not.toMatch(new RegExp(`NotificationType\\s*=\\s*'${sensitiveType}'`, 'i'));
  }

  expect(migration).toMatch(/IX_Notifications_User_ReadAt_CreatedAt/i);
  expect(migration).toMatch(/ON\s+dbo\.Notifications\s*\(\s*UserId\s*,\s*ReadAt\s*,\s*CreatedAt\s+DESC\s*\)/i);
  for (const includedColumn of [
    'NotificationId',
    'NotificationType',
    'TemplateKey',
    'Title',
    'Body',
  ]) {
    expect(migration).toMatch(
      new RegExp(`INCLUDE\\s*\\([\\s\\S]*\\b${includedColumn}\\b[\\s\\S]*\\)`, 'i')
    );
  }
});

// @spec BR-FE10-021 BR-FE10-022 FR-FE10-017 FR-FE10-019
test('borrowing-result template migration and canonical schema seed all four FE07 templates', () => {
  expect(fs.existsSync(borrowingResultMigrationPath)).toBe(true);
  if (!fs.existsSync(borrowingResultMigrationPath)) return;

  const migration = fs.readFileSync(borrowingResultMigrationPath, 'utf8');
  const schema = fs.readFileSync(canonicalSchemaPath, 'utf8');
  const templates = [
    ['BORROW_REQUEST_APPROVED', '{{requestId}}', '{{dueDate}}'],
    ['BORROW_REQUEST_REJECTED', '{{requestId}}'],
    ['BORROW_RENEWED', '{{borrowDetailId}}', '{{dueDate}}'],
    ['BORROW_RETURNED', '{{borrowDetailId}}', '{{returnStatus}}'],
  ];

  expect(migration).toMatch(/SET\s+XACT_ABORT\s+ON/i);
  expect(migration).toMatch(/BEGIN\s+TRANSACTION/i);
  expect(migration).toMatch(/COMMIT\s+TRANSACTION/i);
  expect(migration).toMatch(/ROLLBACK\s+TRANSACTION/i);
  expect(migration).toMatch(/THROW\s*;/i);
  expect(migration).not.toMatch(/\bDELETE\b/i);

  for (const [templateCode, ...variables] of templates) {
    for (const sqlText of [migration, schema]) {
      expect(sqlText).toMatch(new RegExp(templateCode));
      for (const variable of variables) {
        expect(sqlText).toContain(variable);
      }
    }
    expect(migration).toMatch(
      new RegExp(`IF\\s+EXISTS[\\s\\S]*TemplateCode\\s*=\\s*'${templateCode}'`, 'i')
    );
  }
});
