const { readFileSync } = require('fs');
const path = require('path');

const repositoryPath = path.join(__dirname, '..', '..', 'src', 'repositories', 'inventoryRepository.js');
const servicePath = path.join(__dirname, '..', '..', 'src', 'services', 'inventoryService.js');
const modelPath = path.join(__dirname, '..', '..', 'src', 'models', 'BookCopy.js');
const schemaPath = path.join(__dirname, '..', '..', '..', 'database', 'Librarymanagement.sql');
const migrationPath = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'database',
  'migrations',
  '2026-07-19-fe06-bookcopy-rowversion.sql'
);

const repositorySource = readFileSync(repositoryPath, 'utf8');
const serviceSource = readFileSync(servicePath, 'utf8');
const modelSource = readFileSync(modelPath, 'utf8');
const schemaSource = readFileSync(schemaPath, 'utf8');
const migrationSource = readFileSync(migrationPath, 'utf8');

function bookCopiesTableSource() {
  const match = schemaSource.match(/CREATE TABLE BookCopies\s*\(([\s\S]*?)\n\);/i);
  expect(match).not.toBeNull();
  return match[1];
}

// @spec BR-FE06-010, BR-FE06-016, FR-FE06-018, NFR-FE06-TXN-002
test('BookCopies schema exposes SQL rowversion for opaque If-Match concurrency', () => {
  expect(bookCopiesTableSource()).toMatch(/\bVersion\s+(?:ROWVERSION|TIMESTAMP)\b/i);
  expect(bookCopiesTableSource()).not.toMatch(/\bRowVersion\s+(?:ROWVERSION|TIMESTAMP)\b/i);
  expect(modelSource).toMatch(/name:\s*'Version'[\s\S]*type:\s*'ROWVERSION'/i);
  expect(repositorySource).toMatch(/\bbc\.Version\s+AS\s+CopyVersion\b/i);
  expect(migrationSource).toMatch(/COL_LENGTH\('BookCopies',\s*'Version'\)\s+IS\s+NULL/i);
  expect(repositorySource).toMatch(/\bversion\b/i);
});

// @spec BR-FE06-007, BR-FE06-008, NFR-FE06-TXN-002
test('inventory mutation locks BookCopies then BorrowDetails then Reservations', () => {
  const copyLockIndex = repositorySource.search(
    /FROM\s+BookCopies(?:\s+\w+)?\s+WITH\s*\(UPDLOCK,\s*HOLDLOCK\)/i
  );
  const borrowLockIndex = repositorySource.search(
    /FROM\s+BorrowDetails(?:\s+\w+)?\s+WITH\s*\(UPDLOCK,\s*HOLDLOCK\)/i
  );
  const reservationLockIndex = repositorySource.search(
    /FROM\s+Reservations(?:\s+\w+)?\s+WITH\s*\(UPDLOCK,\s*HOLDLOCK\)/i
  );

  expect(copyLockIndex).toBeGreaterThanOrEqual(0);
  expect(borrowLockIndex).toBeGreaterThan(copyLockIndex);
  expect(reservationLockIndex).toBeGreaterThan(borrowLockIndex);
});

// @spec BR-FE06-016, FR-FE06-018, AC-FE06-012, NFR-FE06-TXN-002
test('stale version comparison happens inside the mutation transaction before any update', () => {
  expect(repositorySource).toMatch(/new sql\.Transaction|sql\.Transaction\s*\(/);
  expect(repositorySource).toMatch(/\.begin\s*\(/);
  expect(repositorySource).toMatch(/\.commit\s*\(/);
  expect(repositorySource).toMatch(/\.rollback\s*\(/);
  expect(repositorySource).toMatch(/(?:RowVersion|Version)[\s\S]{0,200}(?:IfMatch|ExpectedVersion|@Version)/i);

  const versionCheckIndex = repositorySource.search(/(?:RowVersion|Version)[\s\S]{0,200}(?:IfMatch|ExpectedVersion|@Version)/i);
  const updateIndex = repositorySource.search(/UPDATE\s+BookCopies/i);
  expect(versionCheckIndex).toBeGreaterThanOrEqual(0);
  expect(updateIndex).toBeGreaterThan(versionCheckIndex);
});

// @spec BR-FE06-012, FR-FE06-019, AC-FE06-006, NFR-FE06-TXN-001
test('copy mutation and audit share one transaction with rollback on audit failure', () => {
  const mutationSource = `${repositorySource}\n${serviceSource}`;
  expect(mutationSource).toMatch(/auditLogRepository\.create/);
  expect(mutationSource).toMatch(/auditLogRepository\.create\([\s\S]{0,500}transaction/i);
  expect(repositorySource).toMatch(/catch\s*\([^)]+\)[\s\S]{0,500}rollback\s*\(/i);
});

// @spec BR-FE06-010, FR-FE06-017
test('FE06 repository has no physical BookCopies delete path', () => {
  expect(repositorySource).not.toMatch(/DELETE\s+FROM\s+BookCopies/i);
  expect(repositorySource).toMatch(/UPDATE\s+BookCopies/i);
  expect(serviceSource).toMatch(/INACTIVE/);
});

const hasSqlRuntime =
  Boolean(process.env.DB_SERVER && process.env.DB_NAME) &&
  process.env.FE06_SQL_TEST_ALLOW_MUTATION === 'true';
const runtimeTest = hasSqlRuntime ? test : test.skip;

// Runtime SQL evidence is deliberately opt-in because it reads the mutable shared SQL schema.
runtimeTest('configured SQL Server exposes a BookCopies rowversion column', async () => {
  const { getPool, resetPoolForTests } = require('../../src/config/db');
  let pool;

  try {
    pool = await getPool();
    const result = await pool.request().query(`
      SELECT c.name AS ColumnName, t.name AS TypeName
      FROM sys.columns c
      INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
      WHERE c.object_id = OBJECT_ID('BookCopies')
        AND t.name IN ('timestamp', 'rowversion')
    `);

    expect(result.recordset).toHaveLength(1);
  } finally {
    if (pool) await pool.close();
    resetPoolForTests();
  }
});
