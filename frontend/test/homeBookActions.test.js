import test from 'node:test';
import assert from 'node:assert/strict';

import { getHomeBookAction } from '../src/utils/homeBookActions.js';

test('homepage routes available and unavailable books into member-owned workflows', () => {
  assert.deepEqual(
    getHomeBookAction({ book: { bookId: 12, availabilityStatus: 'AVAILABLE' }, isLoggedIn: true, roles: ['MEMBER'] }),
    { label: 'Mượn sách này', path: '/borrowing/new?bookId=12', kind: 'borrow' },
  );
  assert.deepEqual(
    getHomeBookAction({ book: { bookId: 12, availabilityStatus: 'UNAVAILABLE' }, isLoggedIn: true, roles: ['MEMBER'] }),
    { label: 'Đặt chỗ sách này', path: '/reservations/mine?bookId=12', kind: 'reserve' },
  );
});

test('homepage prevents guests and staff from using member-only actions', () => {
  assert.equal(
    getHomeBookAction({ book: { bookId: 4, availabilityStatus: 'AVAILABLE' }, isLoggedIn: false }).path,
    '/login',
  );
  assert.deepEqual(
    getHomeBookAction({ book: { bookId: 4, availabilityStatus: 'UNAVAILABLE' }, isLoggedIn: true, roles: ['LIBRARIAN'] }),
    { label: 'Kiểm tra bản sao', path: '/librarian/inventory?bookId=4', kind: 'manage' },
  );
  assert.deepEqual(
    getHomeBookAction({ book: { bookId: 4, availabilityStatus: 'AVAILABLE' }, isLoggedIn: true, roles: ['ADMIN'] }),
    { label: 'Mở quản lý sách', path: '/librarian/books?bookId=4', kind: 'manage' },
  );
});

test('homepage keeps staff precedence for FE11 multi-role accounts', () => {
  assert.deepEqual(
    getHomeBookAction({
      book: { bookId: 9, availabilityStatus: 'AVAILABLE' },
      isLoggedIn: true,
      roles: ['MEMBER', 'LIBRARIAN'],
    }),
    { label: 'Mở quản lý sách', path: '/librarian/books?bookId=9', kind: 'manage' },
  );
  assert.deepEqual(
    getHomeBookAction({
      book: { bookId: 9, availabilityStatus: 'UNAVAILABLE' },
      isLoggedIn: true,
      roles: ['MEMBER', 'ADMIN'],
    }),
    { label: 'Kiểm tra bản sao', path: '/librarian/inventory?bookId=9', kind: 'manage' },
  );
});
