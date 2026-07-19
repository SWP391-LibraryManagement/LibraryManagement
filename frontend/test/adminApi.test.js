import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const apiPath = new URL('../src/api/adminApi.js', import.meta.url);

test('FE11 Audit Logs use the canonical Admin endpoint and authorized wrapper', async () => {
  const source = await readFile(apiPath, 'utf8');
  assert.match(
    source,
    /auditLogs\(params = \{\}\)[\s\S]*?authorizedRequest\([\s\S]*?url: '\/admin\/audit-logs'[\s\S]*?params/,
  );
  assert.doesNotMatch(source, /\/users\/audit-logs/);
});

test('FE11 Permissions use the canonical Admin endpoint and authorized wrapper', async () => {
  const source = await readFile(apiPath, 'utf8');
  assert.match(
    source,
    /permissions\(\)[\s\S]*?authorizedRequest\([\s\S]*?url: '\/admin\/permissions'/,
  );
});

// @spec AC-FE05-012, FR-FE05-021, FR-FE05-025
test('FE11 Admin Console does not expose a duplicate FE05 book mutation adapter', async () => {
  const source = await readFile(apiPath, 'utf8');
  assert.doesNotMatch(source, /createBook\(|updateBook\(|deactivateBook\(/);
});
