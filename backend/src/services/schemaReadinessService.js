const fs = require('node:fs');
const path = require('node:path');
const { getPool } = require('../config/db');

const MIGRATION_FILE = '2026-07-22-library-metadata-compatibility.sql';
const CHANGE_PASSWORD_OTP_MIGRATION_FILE = 'add_change_password_otp_token_type.sql';

function resolveMigrationPath(migrationFile) {
  const candidates = [
    path.resolve(__dirname, '../../database/migrations', migrationFile),
    path.resolve(__dirname, '../../../database/migrations', migrationFile),
  ];
  const migrationPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!migrationPath) {
    throw new Error(`Deployment migration file is missing: ${migrationFile}`);
  }
  return migrationPath;
}

function resolveCatalogMetadataMigrationPath() {
  return resolveMigrationPath(MIGRATION_FILE);
}

function loadCatalogMetadataMigration() {
  return fs.readFileSync(resolveCatalogMetadataMigrationPath(), 'utf8');
}

function loadChangePasswordOtpTokenTypeMigration() {
  return fs.readFileSync(resolveMigrationPath(CHANGE_PASSWORD_OTP_MIGRATION_FILE), 'utf8');
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

// @spec MF-FE02-006, FR-FE02-010
async function checkChangePasswordOtpTokenType() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT CASE WHEN EXISTS (
      SELECT 1
      FROM sys.check_constraints
      WHERE parent_object_id = OBJECT_ID(N'dbo.AuthTokens')
        AND name = N'CK_AuthTokens_TokenType'
        AND definition LIKE N'%CHANGE_PASSWORD_OTP%'
    ) THEN 1 ELSE 0 END AS isReady;
  `);

  return result.recordset?.[0]?.isReady === 1;
}

// @spec MF-FE02-006, FR-FE02-010
async function ensureChangePasswordOtpTokenType({
  migrationSql = loadChangePasswordOtpTokenTypeMigration(),
} = {}) {
  if (await checkChangePasswordOtpTokenType()) {
    return true;
  }

  const pool = await getPool();
  await pool.request().query(migrationSql);

  if (!await checkChangePasswordOtpTokenType()) {
    throw new Error('Change-password OTP token type is not ready after compatibility migration.');
  }
  return true;
}

const defaultSchemaReadinessService = {
  checkCatalogMetadataSchema,
  ensureCatalogMetadataSchema,
  checkChangePasswordOtpTokenType,
  ensureChangePasswordOtpTokenType,
};

module.exports = {
  checkChangePasswordOtpTokenType,
  checkCatalogMetadataSchema,
  ensureChangePasswordOtpTokenType,
  ensureCatalogMetadataSchema,
  loadChangePasswordOtpTokenTypeMigration,
  loadCatalogMetadataMigration,
  resolveCatalogMetadataMigrationPath,
  defaultSchemaReadinessService,
};
