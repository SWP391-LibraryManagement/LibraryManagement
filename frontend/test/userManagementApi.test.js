import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const apiPath = new URL('../src/api/userManagementApi.js', import.meta.url);

test('FE11 user and role list requests use the authorized request flow', async () => {
  const source = await readFile(apiPath, 'utf8');

  assert.match(
    source,
    /export async function fetchUsers[\s\S]*?authorizedRequest\(\{[\s\S]*?url: '\/users'/,
  );
  assert.match(
    source,
    /export async function fetchRoles[\s\S]*?authorizedRequest\(\{[\s\S]*?url: '\/users\/roles'/,
  );
  assert.doesNotMatch(source, /api\.get\('\/users(?:'|\/roles')/);
});
