import test from 'node:test';
import assert from 'node:assert/strict';

import { getHomeBookAction } from '../src/utils/homeBookActions.js';

test('homepage routes available and unavailable books into member-owned workflows', () => {
  assert.deepEqual(
    getHomeBookAction({ book: { id: 12, available: true }, isLoggedIn: true, roles: ['MEMBER'] }),
    { label: 'Mượn sách này', path: '/borrowing/new?bookId=12', kind: 'borrow' },
  );
  assert.deepEqual(
    getHomeBookAction({ book: { id: 12, available: false }, isLoggedIn: true, roles: ['MEMBER'] }),
    { label: 'Đặt chỗ sách này', path: '/reservations/mine?bookId=12', kind: 'reserve' },
  );
});

test('homepage prevents guests and staff from using member-only actions', () => {
  assert.equal(
    getHomeBookAction({ book: { id: 4, available: true }, isLoggedIn: false }).path,
    '/login',
  );
  assert.deepEqual(
    getHomeBookAction({ book: { id: 4, available: false }, isLoggedIn: true, roles: ['LIBRARIAN'] }),
    { label: 'Kiểm tra bản sao', path: '/librarian/inventory?bookId=4', kind: 'manage' },
  );
  assert.deepEqual(
    getHomeBookAction({ book: { id: 4, available: true }, isLoggedIn: true, roles: ['ADMIN'] }),
    { label: 'Mở quản lý sách', path: '/librarian/books?bookId=4', kind: 'manage' },
  );
});
