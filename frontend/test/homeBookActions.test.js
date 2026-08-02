import test from 'node:test';
import assert from 'node:assert/strict';

import { getHomeBookAction } from '../src/utils/homeBookActions.js';

for (const [circulationAction, expected] of [
  ['BORROW', { label: 'Mượn sách này', path: '/borrowing/new?bookId=12', kind: 'borrow', disabled: false }],
  ['RESERVE', { label: 'Đặt chỗ sách này', path: '/reservations/mine?bookId=12', kind: 'reserve', disabled: false }],
  ['WAIT', { label: 'Đang chờ thư viện xử lý', path: null, kind: 'wait', disabled: true }],
  ['UNAVAILABLE', { label: 'Tạm chưa khả dụng', path: null, kind: 'unavailable', disabled: true }],
]) {
  test(`member maps ${circulationAction} to the truthful continuation`, () => {
    assert.deepEqual(
      getHomeBookAction({
        book: { bookId: 12, circulationAction },
        isLoggedIn: true,
        roles: ['MEMBER'],
      }),
      expected,
    );
  });
}

test('member fails closed when circulation action is missing or unknown', () => {
  const expected = {
    label: 'Tạm chưa khả dụng',
    path: null,
    kind: 'unavailable',
    disabled: true,
  };

  assert.deepEqual(
    getHomeBookAction({ book: { bookId: 12 }, isLoggedIn: true, roles: ['MEMBER'] }),
    expected,
  );
  assert.deepEqual(
    getHomeBookAction({
      book: { bookId: 12, circulationAction: 'UNKNOWN' },
      isLoggedIn: true,
      roles: ['MEMBER'],
    }),
    expected,
  );
});

test('homepage prevents guests and staff from using member-only actions', () => {
  assert.equal(
    getHomeBookAction({ book: { bookId: 4, availabilityStatus: 'AVAILABLE' }, isLoggedIn: false }).path,
    '/login',
  );
  assert.deepEqual(
    getHomeBookAction({ book: { bookId: 4, availabilityStatus: 'UNAVAILABLE' }, isLoggedIn: true, roles: ['LIBRARIAN'] }),
    { label: 'Kiểm tra bản sao', path: '/librarian/inventory?bookId=4', kind: 'manage', disabled: false },
  );
  assert.deepEqual(
    getHomeBookAction({ book: { bookId: 4, availabilityStatus: 'AVAILABLE' }, isLoggedIn: true, roles: ['ADMIN'] }),
    { label: 'Mở quản lý sách', path: '/librarian/books?bookId=4', kind: 'manage', disabled: false },
  );
});

test('homepage keeps staff-safe actions for stale legacy role arrays', () => {
  assert.deepEqual(
    getHomeBookAction({
      book: { bookId: 9, availabilityStatus: 'AVAILABLE' },
      isLoggedIn: true,
      roles: ['MEMBER', 'LIBRARIAN'],
    }),
    { label: 'Mở quản lý sách', path: '/librarian/books?bookId=9', kind: 'manage', disabled: false },
  );
  assert.deepEqual(
    getHomeBookAction({
      book: { bookId: 9, availabilityStatus: 'UNAVAILABLE' },
      isLoggedIn: true,
      roles: ['MEMBER', 'ADMIN'],
    }),
    { label: 'Kiểm tra bản sao', path: '/librarian/inventory?bookId=9', kind: 'manage', disabled: false },
  );
});
