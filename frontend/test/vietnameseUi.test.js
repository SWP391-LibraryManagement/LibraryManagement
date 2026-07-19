import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
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

test('document metadata declares Vietnamese and loads the approved font pair', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /<html lang="vi">/);
  assert.match(html, /<title>Quản lý thư viện<\/title>/);
  assert.match(html, /family=Be\+Vietnam\+Pro/);
  assert.match(html, /family=Noto\+Serif/);
});

test('shared styles expose Vietnamese-safe body and heading tokens', async () => {
  const indexCss = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');
  const shellCss = await readFile(new URL('../src/styles/app-shell.css', import.meta.url), 'utf8');
  assert.match(indexCss, /--sans:\s*'Be Vietnam Pro'/);
  assert.match(indexCss, /--heading:\s*'Noto Serif'/);
  assert.match(indexCss, /button,\s*input,\s*select,\s*textarea[\s\S]*font:\s*inherit/);
  assert.match(shellCss, /--lib-heading:\s*var\(--heading\)/);
  assert.match(shellCss, /font-family:\s*var\(--sans\)/);
});

test('major surfaces no longer hardcode superseded UI fonts', async () => {
  const files = [
    '../src/page/HomePage.jsx',
    '../src/page/BookManagement.jsx',
    '../src/page/UserManagement.jsx',
    '../src/styles/UserProfile.css',
    '../src/component/layout/LogoutConfirmModal.jsx',
  ];
  const source = (await Promise.all(files.map((file) => readFile(new URL(file, import.meta.url), 'utf8')))).join('\n');
  assert.doesNotMatch(source, /Playfair Display|Lato, sans-serif|Inter, system-ui|DM Serif Display|Times New Roman|system-ui, 'Segoe UI', Roboto, Arial, sans-serif/);
});

test('shared shell and recovery surfaces use Vietnamese copy', async () => {
  const navigation = await readFile(new URL('../src/utils/appNavigation.js', import.meta.url), 'utf8');
  const layout = await readFile(new URL('../src/component/layout/AppLayout.jsx', import.meta.url), 'utf8');
  const feedback = await readFile(new URL('../src/component/shared/Feedback.jsx', import.meta.url), 'utf8');
  const recovery = await readFile(new URL('../src/component/forgotpassword/BackgroundPanel.jsx', import.meta.url), 'utf8');

  assert.match(navigation, /label: 'Thư viện'/);
  assert.doesNotMatch(navigation, /label: 'Home'/);
  assert.match(layout, /aria-label="Thư viện"/);
  assert.doesNotMatch(layout, />Home</);
  assert.match(feedback, /aria-label="Đóng"/);
  assert.match(recovery, /Chào mừng trở lại/);
  assert.match(recovery, /Đặt lại mật khẩu để tiếp tục sử dụng tài nguyên thư viện/);
});
