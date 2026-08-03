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
    /Copy-Item database\/migrations\/2026-07-22-library-metadata-compatibility\.sql[^\r\n]*deploy\/backend\/database\/migrations\//
  );
  assert.match(
    workflow,
    /Copy-Item [^\r\n]*database\/migrations\/add_change_password_otp_token_type\.sql[^\r\n]*deploy\/backend\/database\/migrations\//
  );
  assert.match(
    workflow,
    /Copy-Item [^\r\n]*database\/migrations\/2026-07-29-fe10-borrowing-result-templates\.sql[^\r\n]*deploy\/backend\/database\/migrations\//
  );
  assert.match(
    workflow,
    /Copy-Item [^\r\n]*database\/migrations\/2026-08-03-fe10-unicode-repair\.sql[^\r\n]*deploy\/backend\/database\/migrations\//
  );
  assert.match(
    workflow,
    /Copy-Item backend\/scripts\/stagingBorrowCandidates\.js deploy\/backend\/scripts\//
  );
  assert.match(
    workflow,
    /deploy-backend:[\s\S]*?uses:\s*actions\/setup-node@v7[\s\S]*?node-version:\s*22[\s\S]*?name: Prepare backend deployment package/
  );
  assert.match(
    workflow,
    /name: Install backend production dependencies[\s\S]*?working-directory:\s*deploy\/backend[\s\S]*?npm ci --omit=dev/
  );
  assert.doesNotMatch(workflow, /run:\s*.*staging:borrow-candidates/);
});

test('automatic and manual staging deployment require the fail-closed smoke check', () => {
  assert.match(workflow, /name: Verify staging endpoints[\s\S]*?run: npm run smoke:staging/);
});

test('FE10 staging deploy is ordered behind exact-head migration proof for automatic and manual runs', () => {
  assert.match(workflow, /fe10_inbox_migration_confirmed:/);
  assert.match(workflow, /fe10_inbox_migration_confirmed:[\s\S]*?required:\s*true[\s\S]*?type:\s*boolean/);
  assert.match(workflow, /preflight:[\s\S]*?github\.event\.workflow_run\.conclusion == 'success'/);
  assert.match(workflow, /preflight:[\s\S]*?environment:\s*[\s\S]*?name:\s*staging/);
  assert.match(workflow, /preflight:[\s\S]*?ref:\s*\$\{\{ github\.event\.workflow_run\.head_sha \|\| github\.sha \}\}/);
  assert.match(workflow, /FE10_INBOX_MIGRATION_SHA256/);
  assert.match(workflow, /\$migrationPath[\s\S]*?2026-07-27-fe10-personal-inbox-read-state\.sql/);
  assert.match(workflow, /MANUAL_CONFIRMATION[\s\S]*?fe10_inbox_migration_confirmed/);
  assert.match(workflow, /fe10_borrowing_result_templates_confirmed:/);
  assert.match(workflow, /FE10_BORROWING_RESULT_TEMPLATES_SHA256/);
  assert.match(
    workflow,
    /\$resultMigrationPath[\s\S]*?2026-07-29-fe10-borrowing-result-templates\.sql/
  );
  assert.match(
    workflow,
    /RESULT_MANUAL_CONFIRMATION[\s\S]*?fe10_borrowing_result_templates_confirmed/
  );
  assert.match(workflow, /fe10_unicode_repair_confirmed:/);
  assert.match(workflow, /FE10_UNICODE_REPAIR_SHA256/);
  assert.match(
    workflow,
    /\$unicodeRepairMigrationPath[\s\S]*?2026-08-03-fe10-unicode-repair\.sql/
  );
  assert.match(
    workflow,
    /UNICODE_REPAIR_MANUAL_CONFIRMATION[\s\S]*?fe10_unicode_repair_confirmed/
  );
  assert.match(workflow, /deploy-backend:[\s\S]*?needs:\s*preflight/);
  assert.match(workflow, /deploy-frontend:[\s\S]*?needs:\s*deploy-backend/);
  assert.match(workflow, /smoke-test:[\s\S]*?needs:\s*\[deploy-backend, deploy-frontend\]/);
});

test('FE10 migration proof is stable across exact LF and CRLF byte renderings only', () => {
  assert.match(workflow, /\$migrationText[\s\S]*?ReadAllText/);
  assert.match(workflow, /\$lfText[\s\S]*?Replace\("`r`n",\s*"`n"\)/);
  assert.match(workflow, /\$crlfText[\s\S]*?Replace\("`n",\s*"`r`n"\)/);
  assert.match(workflow, /\$lfHash[\s\S]*?SHA256[\s\S]*?HashData/);
  assert.match(workflow, /\$crlfHash[\s\S]*?SHA256[\s\S]*?HashData/);
  assert.match(workflow, /\$expectedHash -notin @\(\$lfHash,\s*\$crlfHash\)/);
  assert.match(guide, /LF and CRLF byte renderings/i);
  assert.match(guide, /hash of the bytes actually applied/i);
});

test('operator guide matches migration-gated CI deployment and canonical schema size', () => {
  assert.match(guide, /## CI-Gated Continuous Deployment/);
  assert.match(guide, /successful `main` CI run/);
  assert.match(guide, /FE10_INBOX_MIGRATION_SHA256/);
  assert.match(guide, /exact migration file hash/i);
  assert.match(guide, /table count `21`/);
  assert.match(guide, /SCM_DO_BUILD_DURING_DEPLOYMENT=false/);
  assert.doesNotMatch(guide, /SCM_DO_BUILD_DURING_DEPLOYMENT=true/);

  const operatorMigrationList = guide.match(/```text\s+([\s\S]*?)```/)?.[1] || '';
  assert.doesNotMatch(
    operatorMigrationList,
    /2026-07-22-library-metadata-compatibility\.sql/
  );
});

test('operator guide keeps FE10 SQL operator-owned, repeatable, and ahead of backend/frontend deploy', () => {
  assert.match(guide, /2026-07-27-fe10-personal-inbox-read-state\.sql/);
  assert.match(guide, /2026-07-29-fe10-borrowing-result-templates\.sql/);
  assert.match(guide, /2026-08-03-fe10-unicode-repair\.sql/);
  assert.match(guide, /sqlcmd\b[\s\S]*?-b/);
  assert.match(guide, /apply[^\n]*twice|execute[^\n]*twice|run[^\n]*twice/i);
  assert.match(guide, /temporary[^\n]*firewall rule/i);
  assert.match(guide, /fe10_inbox_migration_confirmed/);
  assert.match(guide, /FE10_INBOX_MIGRATION_SHA256/);
  assert.match(guide, /FE10_BORROWING_RESULT_TEMPLATES_SHA256/);
  assert.match(guide, /FE10_UNICODE_REPAIR_SHA256/);
  const sqlcmdLines = guide
    .split(/\r?\n/)
    .filter((line) => /^\s*sqlcmd\b/.test(line));
  assert.ok(sqlcmdLines.length >= 2);
  for (const line of sqlcmdLines) {
    assert.match(line, /-b\b/);
    assert.match(line, /-f\s+65001\b/);
  }
  assert.match(guide, /Latin1_General_100_BIN2/);
  assert.match(guide, /backend[\s\S]*frontend[\s\S]*browser/i);
});
