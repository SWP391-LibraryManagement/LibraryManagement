import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('frontend audit gate permits only the non-applicable React Router RSC advisory', async () => {
  const source = await readFile(new URL('../scripts/audit-high.js', import.meta.url), 'utf8');

  assert.match(source, /GHSA-qwww-vcr4-c8h2/);
  assert.match(source, /ALLOWED_VERSION = '7\.18\.1'/);
  assert.match(source, /severity === 'high' \|\| severity === 'critical'/);
  assert.match(source, /BrowserRouter/);
  assert.match(source, /BLOCKED_RSC_APIS/);
  assert.match(source, /process\.exit\(1\)/);
});
