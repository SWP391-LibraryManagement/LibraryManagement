const fs = require('fs/promises');
const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
  quiet: true,
});

const { getPool } = require('../src/config/db');
const {
  checkCatalogMetadataSchema,
} = require('../src/services/schemaReadinessService');

const migrationPath = path.resolve(
  __dirname,
  '../../database/migrations/2026-07-22-library-metadata-compatibility.sql'
);

async function migrateLibraryMetadata({
  getPoolImpl = getPool,
  readFileImpl = fs.readFile,
  checkSchemaImpl = checkCatalogMetadataSchema,
} = {}) {
  const source = await readFileImpl(migrationPath, 'utf8');
  const pool = await getPoolImpl();

  try {
    await pool.request().query(source);

    const ready = await checkSchemaImpl();
    if (!ready) {
      throw new Error('Library metadata schema verification failed after migration.');
    }
  } finally {
    if (typeof pool.close === 'function') {
      await pool.close();
    }
  }
}

if (require.main === module) {
  migrateLibraryMetadata()
    .then(() => {
      console.log('Library metadata migration applied and verified.');
    })
    .catch((error) => {
      console.error(`Library metadata migration failed: ${error.message}`);
      process.exitCode = 1;
    });
}

module.exports = {
  migrateLibraryMetadata,
  migrationPath,
};
