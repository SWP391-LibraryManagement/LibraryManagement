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
