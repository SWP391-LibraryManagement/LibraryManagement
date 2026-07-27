const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../..');
const workflowPath = path.join(
  root,
  '.github/workflows/staging-keepalive.yml'
);
const guidePath = path.join(root, 'docs/deployment/azure-staging-guide.md');

const workflow = fs.existsSync(workflowPath)
  ? fs.readFileSync(workflowPath, 'utf8')
  : '';
const guide = fs.readFileSync(guidePath, 'utf8');

test('staging keepalive workflow exists with scheduled and manual triggers', () => {
  assert.ok(
    fs.existsSync(workflowPath),
    '.github/workflows/staging-keepalive.yml must exist'
  );
  assert.match(
    workflow,
    /schedule:\s*\r?\n\s*-\s*cron:\s*['"]3,13,23,33,43,53 \* \* \* \*['"]/
  );
  assert.match(workflow, /workflow_dispatch:/);
});

test('staging keepalive has least privilege and bounded execution', () => {
  assert.match(workflow, /permissions:\s*\r?\n\s*contents:\s*read/);
  assert.match(
    workflow,
    /concurrency:\s*\r?\n\s*group:\s*staging-keepalive\s*\r?\n\s*cancel-in-progress:\s*true/
  );
  assert.match(workflow, /timeout-minutes:\s*3/);
});

test('staging keepalive calls only the public health endpoint and fails closed', () => {
  assert.match(
    workflow,
    /https:\/\/app-library-api-staging-nhat714\.azurewebsites\.net\/health/
  );
  assert.match(workflow, /curl[\s\S]*--fail/);
  assert.match(workflow, /--show-error/);
  assert.match(workflow, /--silent/);
  assert.match(workflow, /--retry\s+2/);
  assert.match(workflow, /--retry-delay\s+5/);
  assert.match(workflow, /--max-time\s+60/);
  assert.doesNotMatch(workflow, /\$\{\{\s*secrets\./);
  assert.doesNotMatch(workflow, /\/api\/notifications|\/api\/auth|[?&]token=/);
});

test('operator guide documents the safe F1 transition and rollback', () => {
  assert.match(guide, /## Free-Tier Staging Keepalive/);
  assert.match(guide, /best-effort/i);
  assert.match(
    guide,
    /manual `Staging keepalive` run succeeds[\s\S]*`alwaysOn=false`[\s\S]*F1/
  );
  assert.match(
    guide,
    /scale the plan back to B1[\s\S]*set `alwaysOn=true`/i
  );
  assert.match(guide, /60 days[\s\S]*gh workflow enable staging-keepalive\.yml/i);
});
