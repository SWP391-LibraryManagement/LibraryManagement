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
const ciWorkflow = fs.readFileSync(
  path.join(root, '.github/workflows/ci.yml'),
  'utf8'
);
const operatorScript = fs.readFileSync(
  path.join(root, 'scripts/invoke-appservice-library-metadata-migration.ps1'),
  'utf8'
);
const migrationRuntimePackage = JSON.parse(
  fs.readFileSync(
    path.join(root, 'scripts/library-metadata-migration-runtime/package.json'),
    'utf8'
  )
);
const migrationRuntimeLock = JSON.parse(
  fs.readFileSync(
    path.join(root, 'scripts/library-metadata-migration-runtime/package-lock.json'),
    'utf8'
  )
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
  assert.match(
    workflow,
    /Copy-Item scripts\/library-metadata-migration-runtime\/package\.json,scripts\/library-metadata-migration-runtime\/package-lock\.json deploy\/backend\/migration-runtime\//
  );
  assert.doesNotMatch(
    workflow,
    /Copy-Item backend\/package\.json,backend\/package-lock\.json deploy\/backend\/migration-runtime\//
  );
  assert.match(
    workflow,
    /name: Install migration runtime dependencies[\s\S]*?run: npm ci --omit=dev[\s\S]*?working-directory: deploy\/backend\/migration-runtime/
  );
});

test('locks the isolated migration runtime to the Kudu Node 18 dependency boundary', () => {
  assert.deepEqual(migrationRuntimePackage.engines, {
    node: '>=18.17.0',
  });
  assert.deepEqual(migrationRuntimePackage.dependencies, {
    dotenv: '17.4.2',
    mssql: '11.0.1',
  });
  assert.equal(
    migrationRuntimeLock.packages['node_modules/mssql'].version,
    '11.0.1'
  );
  assert.equal(
    migrationRuntimeLock.packages['node_modules/mssql'].engines.node,
    '>=18'
  );
  const incompatibleEnginePackages = Object.entries(
    migrationRuntimeLock.packages
  )
    .filter(([, packageMetadata]) => {
      const engine = packageMetadata.engines?.node || '';
      return (
        /(?:>=|\^|>|=)\s*(?:19|[2-9]\d)(?:\.|$)/.test(engine)
        || />=\s*18\.(?:1[8-9]|[2-9]\d)/.test(engine)
      );
    })
    .map(([packagePath, packageMetadata]) => ({
      packagePath,
      version: packageMetadata.version,
      engine: packageMetadata.engines.node,
    }));
  assert.deepEqual(incompatibleEnginePackages, []);
  assert.match(
    repairWorkflow,
    /Copy-Item scripts\/library-metadata-migration-runtime\/package\.json,scripts\/library-metadata-migration-runtime\/package-lock\.json deploy\/backend\/migration-runtime\//
  );
  assert.doesNotMatch(
    repairWorkflow,
    /Copy-Item backend\/package\.json,backend\/package-lock\.json deploy\/backend\/migration-runtime\//
  );
  assert.match(
    ciWorkflow,
    /migration-runtime-compatibility:[\s\S]*?node-version: 18\.17\.1[\s\S]*?npm ci --omit=dev --engine-strict[\s\S]*?npm audit --omit=dev[\s\S]*?Kudu Node 18 SQL dependency path loaded/
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
  assert.match(
    operatorScript,
    /command = 'env NODE_PATH=\/home\/site\/wwwroot\/migration-runtime\/node_modules node scripts\/migrateLibraryMetadata\.js'/
  );
  assert.doesNotMatch(operatorScript, /command = 'NODE_PATH=/);
  assert.match(operatorScript, /dir = '\/home\/site\/wwwroot'/);
  assert.match(operatorScript, /\/api\/command/);
  assert.match(operatorScript, /Protect-CommandDiagnostic/);
  assert.match(operatorScript, /\[REDACTED\]/);
  assert.match(
    operatorScript,
    /\$failureMessage = 'The reviewed metadata migration command failed inside App Service '[\s\S]*?throw \$failureMessage/
  );
  assert.doesNotMatch(operatorScript, /Write-(Host|Output).*credential/i);
});

test('provides a discoverable manual-only repair workflow that verifies staging afterward', () => {
  assert.match(repairWorkflow, /^name: Repair staging metadata schema/m);
  assert.match(repairWorkflow, /on:\s+workflow_dispatch:/);
  assert.doesNotMatch(repairWorkflow, /\b(workflow_run|push|schedule):/);
  assert.match(
    repairWorkflow,
    /name: Install migration runtime dependencies[\s\S]*?run: npm ci --omit=dev[\s\S]*?working-directory: deploy\/backend\/migration-runtime/
  );
  assert.match(repairWorkflow, /name: Deploy migration-ready backend package/);
  assert.match(repairWorkflow, /run: \.\/scripts\/invoke-appservice-library-metadata-migration\.ps1/);
  assert.match(repairWorkflow, /run: npm run smoke:staging/);
  assert.ok(
    repairWorkflow.indexOf('name: Deploy migration-ready backend package')
      < repairWorkflow.indexOf('name: Apply reviewed library metadata migration')
  );
});
