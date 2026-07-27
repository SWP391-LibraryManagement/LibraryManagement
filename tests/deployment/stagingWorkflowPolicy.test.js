const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../..');
const workflow = fs.readFileSync(
  path.join(root, '.github/workflows/deploy-staging.yml'),
  'utf8'
);

test('staging deployment is manual-only and never mutates the database schema', () => {
  assert.match(workflow, /on:\s+workflow_dispatch:/);
  assert.doesNotMatch(workflow, /\b(workflow_run|push|schedule):/);
  assert.doesNotMatch(workflow, /apply_library_metadata_migration/);
  assert.doesNotMatch(workflow, /migrateLibraryMetadata|migration-runtime|invoke-appservice/);
});

test('manual staging deployment still requires the fail-closed smoke check', () => {
  assert.match(workflow, /name: Verify staging endpoints[\s\S]*?run: npm run smoke:staging/);
});
