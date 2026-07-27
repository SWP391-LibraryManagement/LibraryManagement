const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../..');
const workflow = fs.readFileSync(
  path.join(root, '.github/workflows/deploy-staging.yml'),
  'utf8'
);
const guide = fs.readFileSync(
  path.join(root, 'docs/deployment/azure-staging-guide.md'),
  'utf8'
);

test('staging deployment is manual-only and packages the reviewed startup migration', () => {
  assert.match(workflow, /on:\s+workflow_dispatch:/);
  assert.doesNotMatch(workflow, /\b(workflow_run|push|schedule):/);
  assert.doesNotMatch(workflow, /apply_library_metadata_migration/);
  assert.doesNotMatch(workflow, /migrateLibraryMetadata|migration-runtime|invoke-appservice/);
  assert.match(
    workflow,
    /Copy-Item database\/migrations\/2026-07-22-library-metadata-compatibility\.sql deploy\/backend\/database\/migrations\//
  );
});

test('manual staging deployment still requires the fail-closed smoke check', () => {
  assert.match(workflow, /name: Verify staging endpoints[\s\S]*?run: npm run smoke:staging/);
});

test('operator guide matches the manual-only workflow and canonical schema size', () => {
  assert.match(guide, /## Manual Deployment With Startup Reconciliation/);
  assert.doesNotMatch(guide, /runs automatically for every push to `main`/);
  assert.match(guide, /table count `21`/);
});
