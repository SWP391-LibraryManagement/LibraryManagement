import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const apiPath = new URL('../src/api/userManagementApi.js', import.meta.url);
const queryHelperPath = new URL('../src/utils/userManagementQuery.js', import.meta.url);

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

test('FE11 list params omit UI sentinels and empty search', async () => {
  const source = await readFile(queryHelperPath, 'utf8').catch(() => '');
  const functionMatch = source.match(
    /export function buildManagedUserListParams\([^]*?\n}\r?\n/,
  );

  assert.ok(functionMatch, 'buildManagedUserListParams must be exported');
  const createHelper = new Function(
    `${functionMatch[0].replace('export ', '')}; return buildManagedUserListParams;`,
  );
  const buildManagedUserListParams = createHelper();

  assert.deepEqual(
    buildManagedUserListParams({
      page: 1,
      limit: 20,
      role: 'ALL',
      status: 'ALL',
      search: '   ',
    }),
    { page: 1, limit: 20 },
  );
  assert.deepEqual(
    buildManagedUserListParams({
      page: 2,
      limit: 50,
      role: 'member',
      status: 'active',
      search: '  Alice  ',
    }),
    { page: 2, limit: 50, role: 'MEMBER', status: 'ACTIVE', search: 'Alice' },
  );
});

test('FE11 Admin UI reads phoneNumber instead of response phone', async () => {
  const source = await readFile(new URL('../src/page/UserManagement.jsx', import.meta.url), 'utf8');

  assert.match(source, /phone:\s*user\?\.phoneNumber\s*\|\|\s*''/);
  assert.match(source, /user\.phoneNumber\s*\|\|\s*'-'/);
  assert.match(source, /selectedUser\.phoneNumber\s*\|\|\s*'-'/);
  assert.doesNotMatch(source, /user\?\.phone\s*\|\|/);
});

test('FE11 detail 404 classifier reads the wrapped Axios cause safely', async () => {
  const source = await readFile(queryHelperPath, 'utf8');
  const functionMatch = source.match(
    /export function isManagedUserNotFound\([^]*?\n}\r?\n/,
  );

  assert.ok(functionMatch, 'isManagedUserNotFound must be exported');
  const createHelper = new Function(
    `${functionMatch[0].replace('export ', '')}; return isManagedUserNotFound;`,
  );
  const isManagedUserNotFound = createHelper();

  assert.equal(
    isManagedUserNotFound({ cause: { response: { status: 404 } } }),
    true,
  );
  assert.equal(
    isManagedUserNotFound({
      cause: { response: { status: 400, data: { error: { code: 'USER_NOT_FOUND' } } } },
    }),
    true,
  );
  assert.equal(isManagedUserNotFound(new Error('network failed')), false);
});

test('FE11 detail request uses the authorized request flow', async () => {
  const source = await readFile(apiPath, 'utf8');

  assert.match(
    source,
    /export async function fetchManagedUser\(userId\)[\s\S]*?authorizedRequest\(\{[\s\S]*?url: `\/users\/\$\{userId\}`/,
  );
});
