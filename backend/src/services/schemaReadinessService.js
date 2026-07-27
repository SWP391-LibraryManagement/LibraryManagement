const fs = require('node:fs');
const path = require('node:path');
const { getPool } = require('../config/db');

const MIGRATION_FILE = '2026-07-22-library-metadata-compatibility.sql';

function resolveCatalogMetadataMigrationPath() {
  const candidates = [
    path.resolve(__dirname, '../../database/migrations', MIGRATION_FILE),
    path.resolve(__dirname, '../../../database/migrations', MIGRATION_FILE),
  ];
  const migrationPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!migrationPath) {
    throw new Error(`Catalog metadata migration file is missing: ${MIGRATION_FILE}`);
  }
  return migrationPath;
}

function loadCatalogMetadataMigration() {
  return fs.readFileSync(resolveCatalogMetadataMigrationPath(), 'utf8');
}

// @spec BR-FE05-022, FR-FE05-031, AC-FE05-022
async function checkCatalogMetadataSchema() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT CASE
      WHEN OBJECT_ID(N'dbo.Authors', N'U') IS NOT NULL
       AND OBJECT_ID(N'dbo.Publishers', N'U') IS NOT NULL
       AND OBJECT_ID(N'dbo.Categories', N'U') IS NOT NULL
       AND COL_LENGTH(N'dbo.Authors', N'Status') IS NOT NULL
       AND COL_LENGTH(N'dbo.Authors', N'CreatedAt') IS NOT NULL
       AND COL_LENGTH(N'dbo.Publishers', N'Status') IS NOT NULL
       AND COL_LENGTH(N'dbo.Publishers', N'CreatedAt') IS NOT NULL
       AND COL_LENGTH(N'dbo.Categories', N'Status') IS NOT NULL
       AND COL_LENGTH(N'dbo.Categories', N'CreatedAt') IS NOT NULL
      THEN 1
      ELSE 0
    END AS isReady;
  `);

  return result.recordset?.[0]?.isReady === 1;
}

// @spec BR-FE05-022, FR-FE05-031, AC-FE05-022
async function ensureCatalogMetadataSchema({
  migrationSql = loadCatalogMetadataMigration(),
} = {}) {
  const pool = await getPool();
  await pool.request().query(migrationSql);

  const ready = await checkCatalogMetadataSchema();
  if (!ready) {
    throw new Error('Catalog metadata schema is not ready after compatibility migration.');
  }
  return true;
}

const defaultSchemaReadinessService = {
  checkCatalogMetadataSchema,
  ensureCatalogMetadataSchema,
};

module.exports = {
  checkCatalogMetadataSchema,
  ensureCatalogMetadataSchema,
  loadCatalogMetadataMigration,
  resolveCatalogMetadataMigrationPath,
  defaultSchemaReadinessService,
};
