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

test('FE11 role mutations send numeric role IDs through the canonical contract', async () => {
  const source = await readFile(apiPath, 'utf8');

  assert.match(
    source,
    /export async function assignManagedUserRole\(userId, roleId\)[\s\S]*?url: `\/users\/\$\{userId\}\/roles`[\s\S]*?data: \{ roleId \}/,
  );
  assert.match(
    source,
    /export async function revokeManagedUserRole\(userId, roleId\)[\s\S]*?url: `\/users\/\$\{userId\}\/roles\/\$\{roleId\}`/,
  );
  assert.doesNotMatch(
    source,
    /export async function (?:assign|revoke)ManagedUserRole\(userId, roleName\)/,
  );
  assert.doesNotMatch(source, /data: \{ roleName \}/);
});

test('FE11 user-management API no longer owns Audit Logs', async () => {
  const source = await readFile(apiPath, 'utf8');
  assert.doesNotMatch(source, /export async function fetchAuditLogs/);
  assert.doesNotMatch(source, /\/users\/audit-logs/);
});

test('FE11 deactivation sends the loaded effective version and maps pending activation', async () => {
  const source = await readFile(apiPath, 'utf8');

  assert.match(
    source,
    /export async function deactivateManagedUser\(userId, expectedUpdatedAt\)/,
  );
  assert.match(
    source,
    /data: \{ status: 'INACTIVE', expectedUpdatedAt \}/,
  );
  assert.match(source, /ACCOUNT_PENDING_ACTIVATION:/);
});

test('FE11 user-management errors keep safe Vietnamese fallbacks and wrapped causes', async () => {
  const source = await readFile(apiPath, 'utf8');

  for (const message of [
    'Yêu cầu thất bại. Vui lòng thử lại.',
    'Vui lòng đăng nhập bằng tài khoản quản trị viên để thực hiện thao tác này.',
    'Tài khoản của bạn không có quyền quản trị viên cho thao tác này.',
    'Không thể tải danh sách người dùng.',
    'Không thể tải chi tiết người dùng.',
    'Không thể tải danh sách vai trò.',
    'Không thể tạo người dùng.',
    'Không thể cập nhật người dùng.',
    'Không thể vô hiệu hóa người dùng.',
    'Không thể gán vai trò.',
    'Không thể gỡ vai trò.',
  ]) {
    assert.match(source, new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.doesNotMatch(source, /return error\.response\?\.data\?\.error\?\.message/);
  assert.match(source, /throw new Error\(getErrorMessage\([^]*?\{ cause: error \}\)/);
});
