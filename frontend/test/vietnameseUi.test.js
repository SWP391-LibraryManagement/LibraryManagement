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

test('public and member pages translate generated copy while preserving source data', async () => {
  const home = await readFile(new URL('../src/page/HomePage.jsx', import.meta.url), 'utf8');
  const history = await readFile(new URL('../src/page/borrowing/BorrowingHistoryPage.jsx', import.meta.url), 'utf8');
  const mine = await readFile(new URL('../src/page/reservation/MyReservationsPage.jsx', import.meta.url), 'utf8');
  const viewModels = await readFile(new URL('../src/utils/libraryFeatureViewModels.js', import.meta.url), 'utf8');

  assert.doesNotMatch(home, /Programming: 'Code'|Novel: 'Novel'|\|\| 'Book'/);
  assert.match(home, /Programming: 'Mã'|Programming: 'Lập trình'/);
  assert.match(history, /caption="Lịch sử mượn sách"/);
  assert.match(history, /aria-label="Trang trước"/);
  assert.match(history, /aria-label="Trang sau"/);
  assert.match(history, /getStatusLabel\(row\.status\)/);
  assert.match(mine, /caption="Danh sách đặt chỗ của tôi"/);
  assert.match(mine, /getStatusLabel\(item\.status\)/);
  assert.doesNotMatch(viewModels, /`Copy #|`Member #/);
  assert.match(viewModels, /`Bản sao #/);
  assert.match(viewModels, /`Thành viên #/);
});

test('librarian and report surfaces remove known English interface copy', async () => {
  const files = {
    books: await readFile(new URL('../src/page/BookManagement.jsx', import.meta.url), 'utf8'),
    copies: await readFile(new URL('../src/component/inventory/BookCopies.jsx', import.meta.url), 'utf8'),
    inventory: await readFile(new URL('../src/component/inventory/InventoryManagement.jsx', import.meta.url), 'utf8'),
    borrowingReport: await readFile(new URL('../src/page/report/BorrowingReportPage.jsx', import.meta.url), 'utf8'),
    inventoryReport: await readFile(new URL('../src/page/report/InventoryReportPage.jsx', import.meta.url), 'utf8'),
    userReport: await readFile(new URL('../src/page/report/UserStatisticsPage.jsx', import.meta.url), 'utf8'),
  };

  assert.doesNotMatch(files.books, /Book title is required|Add Book|Save Changes|Select a book|No description/);
  assert.match(files.books, /Tên sách là bắt buộc|Thêm sách|Lưu thay đổi|Chọn một cuốn sách|Chưa có mô tả/);
  assert.match(files.copies, /caption="Danh sách bản sao"/);
  assert.match(files.inventory, /caption="Danh sách bản sao trong kho"/);
  assert.match(files.borrowingReport, /caption="Chi tiết báo cáo mượn trả"/);
  assert.match(files.inventoryReport, /caption="Danh sách sách sắp hết"/);
  assert.match(files.userReport, /caption="Tổng hợp thống kê người dùng"/);
  assert.doesNotMatch(files.userReport, /User ID|Membership|User statistics/);
});

test('admin and API surfaces use accented Vietnamese copy with safe fallbacks', async () => {
  const adminApi = await readFile(new URL('../src/api/adminApi.js', import.meta.url), 'utf8');
  const authApi = await readFile(new URL('../src/api/authApi.js', import.meta.url), 'utf8');
  const profileApi = await readFile(new URL('../src/api/profileApi.js', import.meta.url), 'utf8');
  const userManagementApi = await readFile(new URL('../src/api/userManagementApi.js', import.meta.url), 'utf8');
  const userManagement = await readFile(new URL('../src/page/UserManagement.jsx', import.meta.url), 'utf8');
  const apiSources = [authApi, profileApi, userManagementApi].join('\n');
  const userFacingSources = [adminApi, apiSources, userManagement].join('\n');

  for (const message of [
    'Không thể tải tổng quan quản trị.',
    'Không thể tải kho sách.',
    'Không thể tải dữ liệu thư viện.',
    'Không thể thêm dữ liệu.',
    'Không thể cập nhật dữ liệu.',
    'Không thể vô hiệu hóa dữ liệu.',
    'Không thể tải dữ liệu mượn trả.',
    'Không thể tải danh sách yêu cầu.',
    'Không thể tải chi tiết yêu cầu.',
    'Không thể tải ma trận phân quyền.',
    'Không thể tải nhật ký hoạt động.',
  ]) {
    assert.match(adminApi, new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.doesNotMatch(userFacingSources, /Could not|Please login|Request failed|Admin login required/);
  assert.doesNotMatch(apiSources, /return apiError\?\.message|return error\.response\?\.data\?\.error\?\.message/);
  assert.doesNotMatch(apiSources, /details\.map\(\(item\) => item\.message\)/);
});
