const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../..');
const workflow = fs.readFileSync(
  path.join(root, '.github/workflows/deploy-staging.yml'),
  'utf8'
);
const repairWorkflow = fs.readFileSync(
  path.join(root, '.github/workflows/repair-staging-metadata.yml'),
  'utf8'
);
const operatorScript = fs.readFileSync(
  path.join(root, 'scripts/invoke-appservice-library-metadata-migration.ps1'),
  'utf8'
);

test('packages only the reviewed metadata migration with its bounded runner', () => {
  assert.match(
    workflow,
    /Copy-Item backend\/scripts\/migrateLibraryMetadata\.js deploy\/backend\/scripts\//
  );
  assert.match(
    workflow,
    /Copy-Item database\/migrations\/2026-07-22-library-metadata-compatibility\.sql deploy\/backend\/database\/migrations\//
  );
});

test('applies the migration only after an explicit manual workflow choice', () => {
  assert.match(workflow, /workflow_dispatch:\s+inputs:/);
  assert.match(workflow, /apply_library_metadata_migration:[\s\S]*?default: false[\s\S]*?type: boolean/);
  assert.match(
    workflow,
    /if: github\.event_name == 'workflow_dispatch' && inputs\.apply_library_metadata_migration/
  );
  assert.match(workflow, /run: \.\/scripts\/invoke-appservice-library-metadata-migration\.ps1/);
});

test('runs the bounded command in the deployed Linux App Service directory without logging credentials', () => {
  assert.match(operatorScript, /command = 'node scripts\/migrateLibraryMetadata\.js'/);
  assert.match(operatorScript, /dir = '\/home\/site\/wwwroot'/);
  assert.match(operatorScript, /\/api\/command/);
  assert.match(operatorScript, /Protect-CommandDiagnostic/);
  assert.match(operatorScript, /\[REDACTED\]/);
  assert.doesNotMatch(operatorScript, /Write-(Host|Output).*credential/i);
});

test('provides a discoverable manual-only repair workflow that verifies staging afterward', () => {
  assert.match(repairWorkflow, /^name: Repair staging metadata schema/m);
  assert.match(repairWorkflow, /on:\s+workflow_dispatch:/);
  assert.doesNotMatch(repairWorkflow, /\b(workflow_run|push|schedule):/);
  assert.match(repairWorkflow, /run: \.\/scripts\/invoke-appservice-library-metadata-migration\.ps1/);
  assert.match(repairWorkflow, /run: npm run smoke:staging/);
});
