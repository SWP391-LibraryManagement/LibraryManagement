const fs = require('node:fs');
const path = require('node:path');

const SOURCE_PATH = path.resolve(__dirname, '../database/Librarymanagement.sql');
const OUTPUT_PATH = path.resolve(__dirname, '../tmp/azure/LibraryManagementStaging.sql');
const REQUIRED_TABLES = ['Roles', 'Users', 'BorrowRequests', 'Fines', 'Notifications', 'AuditLogs'];

function transformSchema(source) {
  const batches = String(source)
    .split(/^\s*GO\s*;?\s*$/gim)
    .map((batch) => batch.trim())
    .filter(Boolean)
    .filter((batch) => !/^CREATE\s+DATABASE\b/i.test(batch))
    .filter((batch) => !/^USE\s+/i.test(batch));

  const result = `${batches.join('\nGO\n\n')}\nGO\n`;

  if (/CREATE\s+DATABASE/i.test(result) || /^\s*USE\s+/im.test(result)) {
    throw new Error('Azure schema must not create or switch databases.');
  }

  for (const table of REQUIRED_TABLES) {
    if (!new RegExp(`CREATE\\s+TABLE\\s+${table}\\b`, 'i').test(result)) {
      throw new Error(`Azure schema is missing required table ${table}.`);
    }
  }

  return result;
}

function prepareAzureSchema({ sourcePath = SOURCE_PATH, outputPath = OUTPUT_PATH } = {}) {
  const source = fs.readFileSync(sourcePath, 'utf8');
  const result = transformSchema(source);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, result, 'utf8');
  return outputPath;
}

if (require.main === module) {
  const outputPath = prepareAzureSchema();
  console.log(`Azure-compatible schema written to ${outputPath}`);
}

module.exports = {
  prepareAzureSchema,
  transformSchema,
};
