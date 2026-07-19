import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPermissionModuleCoverage,
  buildPermissionRoleSummary,
  roleAllowsPermission,
} from '../src/utils/adminPermissions.js';

const roles = [
  { roleName: 'ADMIN', label: 'Admin' },
  { roleName: 'LIBRARIAN', label: 'Librarian' },
  { roleName: 'MEMBER', label: 'Member' },
];
const permissions = [
  { permissionKey: 'USER_VIEW', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
  { permissionKey: 'CATALOG_MANAGE', moduleKey: 'LIBRARY', moduleLabel: 'Library', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
  { permissionKey: 'BORROW_REQUEST_CREATE', moduleKey: 'BORROW_RETURN', moduleLabel: 'Borrow/Return', allowedRoles: ['MEMBER'] },
];

test('role summary joins FE12 counts by roleName with numeric zero defaults', () => {
  assert.deepEqual(buildPermissionRoleSummary(roles, {
    ADMIN: '2',
    LIBRARIAN: 4,
    MEMBER: 'invalid',
  }), [
    { roleName: 'ADMIN', label: 'Admin', count: 2 },
    { roleName: 'LIBRARIAN', label: 'Librarian', count: 4 },
    { roleName: 'MEMBER', label: 'Member', count: 0 },
  ]);
});

test('module coverage is derived from allowedRoles in first-seen module order', () => {
  assert.deepEqual(buildPermissionModuleCoverage(roles, permissions), [
    { moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', counts: { ADMIN: 1, LIBRARIAN: 0, MEMBER: 0 } },
    { moduleKey: 'LIBRARY', moduleLabel: 'Library', counts: { ADMIN: 1, LIBRARIAN: 1, MEMBER: 0 } },
    { moduleKey: 'BORROW_RETURN', moduleLabel: 'Borrow/Return', counts: { ADMIN: 0, LIBRARIAN: 0, MEMBER: 1 } },
  ]);
});

test('matrix cells read only the server allowedRoles array', () => {
  assert.equal(roleAllowsPermission(permissions[1], 'ADMIN'), true);
  assert.equal(roleAllowsPermission(permissions[1], 'LIBRARIAN'), true);
  assert.equal(roleAllowsPermission(permissions[1], 'MEMBER'), false);
});
