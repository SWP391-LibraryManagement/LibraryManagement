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

test('staging deployment follows successful main CI and packages the reviewed startup migration', () => {
  assert.match(workflow, /workflow_run:\s+workflows: \[CI\]\s+types: \[completed\]\s+branches: \[main\]/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /github\.event\.workflow_run\.conclusion == 'success'/);
  assert.match(workflow, /ref: \$\{\{ github\.event\.workflow_run\.head_sha \|\| github\.sha \}\}/);
  assert.doesNotMatch(workflow, /\b(push|schedule):/);
  assert.doesNotMatch(workflow, /apply_library_metadata_migration/);
  assert.doesNotMatch(workflow, /migrateLibraryMetadata|migration-runtime|invoke-appservice/);
  assert.match(
    workflow,
    /Copy-Item database\/migrations\/2026-07-22-library-metadata-compatibility\.sql deploy\/backend\/database\/migrations\//
  );
});

test('automatic and manual staging deployment require the fail-closed smoke check', () => {
  assert.match(workflow, /name: Verify staging endpoints[\s\S]*?run: npm run smoke:staging/);
});

test('operator guide matches CI-gated continuous deployment and canonical schema size', () => {
  assert.match(guide, /## CI-Gated Continuous Deployment/);
  assert.match(guide, /successful `main` CI run/);
  assert.match(guide, /table count `21`/);

  const operatorMigrationList = guide.match(/```text\s+([\s\S]*?)```/)?.[1] || '';
  assert.doesNotMatch(
    operatorMigrationList,
    /2026-07-22-library-metadata-compatibility\.sql/
  );
});
