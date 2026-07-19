import assert from 'node:assert/strict';
import test from 'node:test';

import { VI_COPY } from '../src/i18n/vi.js';
import { getBooleanLabel, getRoleLabel, getStatusLabel } from '../src/utils/uiLabels.js';

test('shared Vietnamese copy keeps the approved common technical terms', () => {
  assert.equal(VI_COPY.fields.email, 'Email');
  assert.equal(VI_COPY.fields.otp, 'OTP');
  assert.equal(VI_COPY.fields.barcode, 'Barcode');
  assert.equal(VI_COPY.common.close, 'Đóng');
});

test('role labels are Vietnamese presentation values', () => {
  assert.equal(getRoleLabel('ADMIN'), 'Quản trị viên');
  assert.equal(getRoleLabel('LIBRARIAN'), 'Thủ thư');
  assert.equal(getRoleLabel('MEMBER'), 'Thành viên');
  assert.equal(getRoleLabel('GUEST'), 'Khách');
  assert.equal(getRoleLabel('UNKNOWN_ROLE'), 'Vai trò chưa xác định');
});

test('status labels accept raw enums and existing semantic view tokens', () => {
  assert.equal(getStatusLabel('AVAILABLE'), 'Có sẵn');
  assert.equal(getStatusLabel('Borrowed'), 'Đang mượn');
  assert.equal(getStatusLabel('Ready to pick up'), 'Sẵn sàng nhận');
  assert.equal(getStatusLabel('CANCELLED'), 'Đã hủy');
  assert.equal(getStatusLabel('UNKNOWN_STATUS'), 'Trạng thái chưa xác định');
  assert.equal(getStatusLabel(), 'Trạng thái chưa xác định');
});

test('boolean values have Vietnamese display labels', () => {
  assert.equal(getBooleanLabel(true), 'Có');
  assert.equal(getBooleanLabel(false), 'Không');
});
