import assert from 'node:assert/strict';
import test from 'node:test';

import { ADMIN_NAVIGATION } from '../src/page/admin/adminNavigation.js';
import { selectOperationalChartRows } from '../src/page/admin/dashboard/adminDashboardViewModel.js';
import { getPermissionDecision } from '../src/page/admin/permissions/permissionPresentation.js';
import { formatAuditAction, formatAuditDetailKey } from '../src/page/admin/audit/adminAuditPresentation.js';

test('Admin navigation keeps the approved eight entries in order', () => {
  assert.deepEqual(ADMIN_NAVIGATION.map(({ id, label }) => [id, label]), [
    ['home', 'Trang chủ'], ['dashboard', 'Tổng quan'], ['library', 'Thư viện'],
    ['circulation', 'Quản lý mượn trả'], ['requests', 'Quản lý yêu cầu'],
    ['users', 'Quản lý người dùng'], ['permissions', 'Phân quyền'],
    ['audit', 'Nhật ký hoạt động'],
  ]);
});

test('Dashboard keeps only five positive chart rows', () => {
  assert.deepEqual(selectOperationalChartRows([
    { label: 'A', value: 0 }, { label: 'B', value: 6 }, { label: 'C', value: 5 },
    { label: 'D', value: 4 }, { label: 'E', value: 3 }, { label: 'F', value: 2 },
    { label: 'G', value: 1 },
  ]), [
    { label: 'B', value: 6 }, { label: 'C', value: 5 }, { label: 'D', value: 4 },
    { label: 'E', value: 3 }, { label: 'F', value: 2 },
  ]);
  assert.deepEqual(selectOperationalChartRows([{ label: 'A', value: 0 }]), []);
});

test('Permission decisions distinguish allowed and denied values', () => {
  assert.deepEqual(getPermissionDecision(true), { label: 'Có', symbol: '✓', tone: 'allowed' });
  assert.deepEqual(getPermissionDecision(false), { label: 'Không', symbol: '—', tone: 'denied' });
});

test('Audit presentation localizes known values and preserves unknown safe values', () => {
  assert.deepEqual(formatAuditAction('AUTH_LOGIN_SUCCESS'), {
    label: 'Đăng nhập thành công', raw: 'AUTH_LOGIN_SUCCESS', known: true,
  });
  assert.deepEqual(formatAuditAction('CUSTOM_SAFE_EVENT'), {
    label: 'CUSTOM_SAFE_EVENT', raw: 'CUSTOM_SAFE_EVENT', known: false,
  });
  assert.equal(formatAuditDetailKey('roleName'), 'Vai trò');
  assert.equal(formatAuditDetailKey('customKey'), 'customKey');
});
