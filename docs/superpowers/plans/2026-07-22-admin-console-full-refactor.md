# Bảng điều khiển dành cho quản trị viên Kế hoạch triển khai công cụ tái cấu trúc giao diện người dùng đầy đủ

> **Đối với nhân viên đại lý:** SUB-SKILL BẮT BUỘC: Sử dụng siêu năng lực:phát triển theo định hướng phụ (được khuyến nghị) hoặc siêu năng lực:thực hiện các kế hoạch để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Thay thế khối nguyên khối 3.000 dòng của Bảng điều khiển dành cho quản trị viên FE11
bằng giao diện người dùng một tuyến đáp ứng, có thể truy cập và mô-đun và triển khai kết quả đã được
xác minh vào Giai đoạn Azure mà không thay đổi hợp đồng kinh doanh hoặc máy chủ.

**Kiến trúc:** Giữ `/admin/users` làm tuyến Bảng điều khiển dành cho quản trị viên duy nhất và giữ
`frontend/src/page/UserManagement.jsx` làm mục nhập tương thích. Xây dựng `AdminConsolePage` từ một
lớp vỏ dùng chung, các bản trình bày gốc nhỏ và các mô-đun Bảng điều khiển, Thư viện, Lưu hành, Yêu
cầu, Người dùng, Quyền và Kiểm tra được sở hữu độc lập. Bảo tồn bộ điều hợp API hiện có và DTO an
toàn; chỉ trích xuất phần trình bày và trạng thái phần.

**bộ công nghệ công nghệ:** React 19, Bộ định tuyến React, Lucide React, Bootstrap hiện có/mã thông
báo CSS được chia sẻ, trình chạy kiểm thử nút, ESLint, Vite, Playwright, Express/Jest bộ hồi quy,
GitHub Actions, Azure Static Web Apps/App Service.

## Ràng buộc toàn cầu

- Mục quản trị công khai URL vẫn giữ nguyên chính xác là `/admin/users`.
- Phần Quản trị mặc định vẫn là Quản lý người dùng.
- Điều hướng vẫn chính xác là Trang chủ, Trang tổng quan, Thư viện, Quản lý lượt mượn, Quản lý yêu cầu, Tất cả người dùng, Quyền và Nhật ký kiểm tra theo thứ tự đã được phê duyệt.
- Không có điểm cuối máy chủ, tải trọng yêu cầu, phản hồi DTO, quy tắc ủy quyền, kết quả kinh doanh hoặc thay đổi lược đồ cơ sở dữ liệu.
- Ủy quyền máy chủ vẫn có thẩm quyền; không có quyết định bỏ qua phát triển hoặc quyết định cấp phép chỉ dành cho khách hàng.
- FE07 tiếp tục sở hữu thao tác ghi yêu cầu mượn sách; Trạng thái đầu cuối yêu cầu FE11 vẫn ở chế độ chỉ đọc.
- FE11 sở hữu ma trận quyền; FE12 sở hữu số lượng vai trò và dữ liệu báo cáo.
- Kiểm tra các giá trị thô vẫn mang tính chuẩn mực và chỉ phần trình bày của chúng được bản địa hóa.
- FE04 Tư cách thành viên và FE09 Chức năng tốt bên ngoài Bảng điều khiển dành cho quản trị viên vẫn được giữ nguyên.
- Không có phần phụ thuộc thời gian chạy mới nào được giới thiệu.
- Mọi thay đổi hành vi đều tuân theo RED-GREEN-REFACTOR và duy trì các kiểm thử hiện có.
- Sự chấp nhận trực quan của con người vẫn tách biệt với bằng chứng giao diện thích ứng tự động.

---

## Bản đồ tệp

### Tập tin sản xuất mới

- `frontend/src/page/admin/AdminConsolePage.jsx` — bảo vệ truy cập cấp tuyến, phần hoạt động, đăng xuất, thành phần phần.
- `frontend/src/page/admin/adminAccess.js` — phân tích cú pháp nhận dạng được lưu trữ thuần túy.
- `frontend/src/page/admin/adminNavigation.js` — định nghĩa điều hướng tám mục tiêu chuẩn.
- `frontend/src/page/admin/components/AdminShell.jsx` — thanh bên của máy tính để bàn và bảng điều hướng trên thiết bị di động.
- `frontend/src/page/admin/components/AdminPageHeader.jsx` — tiêu đề phần, làm mới, hành động chính.
- `frontend/src/page/admin/components/AdminFilterBar.jsx` — bố cục bộ lọc đáp ứng được gắn nhãn.
- `frontend/src/page/admin/components/AdminDateField.jsx` - nhãn liên tục xung quanh đầu vào ngày gốc.
- `frontend/src/page/admin/components/AdminActionButton.jsx` — biểu tượng cộng với nhãn hành động hiển thị.
- `frontend/src/page/admin/components/AdminEmptyState.jsx` — bản trình bày đang tải/lỗi/trống/đã lọc-trống.
- `frontend/src/page/admin/components/AdminPagination.jsx` - điều khiển phân trang giới hạn.
- `frontend/src/page/admin/dashboard/AdminDashboardSection.jsx` — quyền sở hữu và hiển thị dữ liệu bảng điều khiển.
- `frontend/src/page/admin/dashboard/adminDashboardViewModel.js` — chuyển đổi tích cực trong biểu đồ top 5.
- `frontend/src/page/admin/users/AdminUsersSection.jsx` - danh sách, số liệu thống kê, bộ lọc, chi tiết, vòng đời và giao diện người dùng vai trò.
- `frontend/src/page/admin/users/UserEditorModal.jsx` — tạo/chỉnh sửa biểu mẫu.
- `frontend/src/page/admin/users/UserRoleModal.jsx` — giao diện người dùng khác biệt về vai trò có thẩm quyền.
- `frontend/src/page/admin/users/UserDetailDrawer.jsx` — chi tiết an toàn bản trình bày DTO.
- `frontend/src/page/admin/users/userPresentation.js` — người trợ giúp về vai trò chính, ngày tháng, xác thực và lập kế hoạch vai trò.
- `frontend/src/page/admin/requests/AdminRequestsSection.jsx` — danh sách/chi tiết/xuất yêu cầu chuẩn và ủy quyền thao tác ghi FE07.
- `frontend/src/page/admin/permissions/AdminPermissionsSection.jsx` - Ma trận FE11 cộng với số lượng FE12.
- `frontend/src/page/admin/permissions/permissionPresentation.js` - nhãn được bản địa hóa và các đối tượng quyết định cho phép/từ chối.
- `frontend/src/page/admin/audit/AdminAuditSection.jsx` — bộ lọc kiểm tra chuẩn và hàng an toàn.
- `frontend/src/page/admin/audit/adminAuditPresentation.js` — nhãn hành động/chi tiết được bản địa hóa trên các giá trị thô.
- `frontend/src/page/admin/library/AdminLibrarySection.jsx` — quyền sở hữu đọc/trình bày thư viện đã được phê duyệt.
- `frontend/src/page/admin/circulation/AdminCirculationSection.jsx` — trình bày và hành động lưu hành đã được phê duyệt.
- `frontend/src/page/admin/admin-console.css` — Mã thông báo quản trị, máy tính để bàn, thiết bị di động, tiêu điểm và quy tắc giảm chuyển động.

### Các xét nghiệm mới hoặc thay thế

- `frontend/test/adminConsolePresentation.test.js`
- `frontend/test/adminConsoleStructure.test.js`
- `tests/e2e/fe11-admin-request-management.spec.js`

### Các tập tin quản trị và tương thích đã sửa đổi

- `.sdd/specs/feat-user-role-management/PLAN.md`
- `.sdd/specs/feat-user-role-management/TASKS.md`
- `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- `frontend/src/page/UserManagement.jsx`
- `frontend/test/userManagementFrontend.test.js`
- `frontend/test/userManagementApi.test.js`
- `frontend/test/adminRequestManagementFrontend.test.js`
- `frontend/test/appShellFrontend.test.js`
- `frontend/test/vietnameseUi.test.js`
- `.sdd/reviews/admin-console-full-refactor-validation-2026-07-22.md`

---

### Nhiệm vụ 1: Kích hoạt Bản ghi tái cấu trúc UX FE11 bị ràng buộc

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-user-role-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/CHANGELOG.md`

**Giao diện:**
- Tiêu thụ: thiết kế `docs/superpowers/specs/2026-07-22-admin-console-full-refactor-design.md` đã được phê duyệt.
- Tạo ra: ID nhiệm vụ `FE11-UXR01` đến `FE11-UXR07` được sử dụng bởi các nhận xét triển khai và bằng chứng xác thực.

- [ ] **Bước 1: Thêm phần kế hoạch đã được phê duyệt**

Nối lát cắt giới hạn chính xác này vào `PLAN.md`:

```markdown
## 18. Lát cắt tái cấu trúc toàn bộ giao diện bảng quản trị

Quyết định: ĐƯỢC PHÊ DUYỆT BỞI HUMAN - 22/07/2026.

Công cụ tái cấu trúc chỉ có lớp bao này bảo tồn `/admin/users`, tất cả FE11/FE07/FE12 API và các hợp đồng sở hữu, ủy quyền máy chủ, DTO an toàn và trạng thái cơ sở dữ liệu. Nó chia Bảng điều khiển dành cho quản trị viên thành một lớp vỏ được bảo vệ, các nguyên mẫu trình bày được chia sẻ và các mô-đun Bảng điều khiển, Thư viện, Lưu hành, Yêu cầu, Người dùng, Quyền và Kiểm tra độc lập.

Trình tự triển khai: quản trị -> trình bày thuần túy RED/GREEN -> lớp bao chia sẻ -> Bảng điều khiển -> Người dùng -> Yêu cầu -> Quyền -> Kiểm tra -> Thư viện/Lưu thông -> xóa kế thừa -> xác thực đầy đủ và chấp nhận Giai đoạn Azure.
```

- [ ] **Bước 2: Thêm nhóm nhiệm vụ**

Thêm vào `TASKS.md` với mọi mục ban đầu không được chọn:

```markdown
## Nhiệm vụ tái cấu trúc toàn bộ giao diện bảng quản trị

- [ ] **FE11-UXR01 - Thêm các hợp đồng trình bày điều hướng, bảng điều khiển, quyền và kiểm tra thuần túy.**
- [ ] **FE11-UXR02 - Xây dựng trình quản trị đáp ứng nhanh và các nguyên mẫu trình bày được chia sẻ.**
- [ ] **FE11-UXR03 - Di chuyển bảng điều khiển và quản lý người dùng với tính tương đương trên máy tính để bàn/thiết bị di động.**
- [ ] **FE11-UXR04 - Di chuyển yêu cầu, quyền và kiểm tra mà không thay đổi quyền sở hữu API.**
- [ ] **FE11-UXR05 - Di chuyển Thư viện/Truyền thông và xóa mã quản trị thanh toán/thành viên không thể truy cập được.**
- [ ] **FE11-UXR06 - Cắt qua `/admin/users` và vượt qua xác thực tập trung/hoàn toàn tự động.**
- [ ] **FE11-UXR07 - Đạt được xác thực trên máy tính để bàn/thiết bị di động Azure Chấp nhận theo giai đoạn và xuất bản bằng chứng xác thực.**
```

- [ ] **Bước 3: Ghi lại thay đổi đã được phê duyệt**

Thêm vào `CHANGELOG.md`:

```markdown
## 2026-07-22 - Đã phê duyệt tái cấu trúc toàn bộ giao diện bảng quản trị

- Đã phê duyệt công cụ tái cấu trúc mô-đun chỉ dành cho lớp bao theo `FE11-UXR01..UXR07`.
- Bảo toàn tất cả phần máy chủ, API, ủy quyền, cơ sở dữ liệu, thao tác ghi FE07, quyền/kiểm tra FE11 và hợp đồng báo cáo FE12.
- Thêm thẻ người dùng phản hồi, biểu đồ tập trung vào quyết định, hành động được gắn nhãn, bản trình bày kiểm tra bản địa hóa, quyết định cấp phép riêng biệt, nhãn bộ lọc liên tục và trạng thái tải/lỗi/trống rõ ràng.
- Chỉ xóa mã thanh toán/thành viên Bảng điều khiển dành cho quản trị viên không thể truy cập được; Chức năng FE04 và FE09 chuẩn vẫn không thay đổi.
```

- [ ] **Bước 4: Xác minh việc quản trị vẫn có hiệu lực**

Chạy: `npm.cmd run trace:enforce`

Dự kiến: thoát khỏi `0`, tất cả khả năng truy vết chức năng vẫn ở trên ngưỡng thực thi và không có
yêu cầu FE11 nào trở thành `NOT STARTED`.

- [ ] **Bước 5: Cam kết kích hoạt quản trị**

```powershell
git add .sdd/specs/feat-user-role-management/PLAN.md .sdd/specs/feat-user-role-management/TASKS.md .sdd/specs/feat-user-role-management/CHANGELOG.md
git commit -m "docs: activate admin console frontend refactor"
```

---

### Nhiệm vụ 2: Thêm hợp đồng trình bày thuần túy

**Tệp:**
- Tạo: `frontend/test/adminConsolePresentation.test.js`
- Tạo: `frontend/src/page/admin/adminNavigation.js`
- Tạo: `frontend/src/page/admin/dashboard/adminDashboardViewModel.js`
- Tạo: `frontend/src/page/admin/permissions/permissionPresentation.js`
- Tạo: `frontend/src/page/admin/audit/adminAuditPresentation.js`

**Giao diện:**
- Sản xuất: `ADMIN_NAVIGATION`, `selectOperationalChartRows(rows, limit)`, `getPermissionDecision(allowed)`, `formatAuditAction(action)`, `formatAuditDetailKey(key)`.
- Tiêu thụ: các giá trị vai trò thô, quyền, kiểm tra và biểu đồ chuẩn mà không làm thay đổi chúng.

- [ ] **Bước 1: Viết các kiểm thử hợp đồng thuần túy thất bại**

```js
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
```

- [ ] **Bước 2: Chạy RED và xác nhận lỗi dự kiến**

Chạy từ `frontend`: `node --test test/adminConsolePresentation.test.js`

Dự kiến: THẤT BẠI với `ERR_MODULE_NOT_FOUND` dành cho `src/page/admin/adminNavigation.js`.

- [ ] **Bước 3: Triển khai các mô-đun thuần túy tối thiểu**

```js
// adminNavigation.js
import { BookCopy, ClipboardList, Home, LayoutDashboard, Library, Shield, Users } from 'lucide-react';

export const ADMIN_NAVIGATION = Object.freeze([
  { id: 'home', icon: Home, label: 'Trang chủ', path: '/home' },
  { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
  { id: 'library', icon: Library, label: 'Thư viện' },
  { id: 'circulation', icon: BookCopy, label: 'Quản lý mượn trả' },
  { id: 'requests', icon: ClipboardList, label: 'Quản lý yêu cầu' },
  { id: 'users', icon: Users, label: 'Quản lý người dùng' },
  { id: 'permissions', icon: Shield, label: 'Phân quyền' },
  { id: 'audit', icon: ClipboardList, label: 'Nhật ký hoạt động' },
]);
```

```js
// adminDashboardViewModel.js
export function selectOperationalChartRows(rows = [], limit = 5) {
  return rows
    .map((row) => ({ ...row, value: Number(row?.value) || 0 }))
    .filter((row) => row.value > 0)
    .slice(0, limit);
}
```

```js
// permissionPresentation.js
export function getPermissionDecision(allowed) {
  return allowed
    ? { label: 'Có', symbol: '✓', tone: 'allowed' }
    : { label: 'Không', symbol: '—', tone: 'denied' };
}
```

```js
// adminAuditPresentation.js
const ACTION_LABELS = Object.freeze({
  AUTH_LOGIN_ATTEMPT: 'Thử đăng nhập',
  AUTH_LOGIN_SUCCESS: 'Đăng nhập thành công',
  AUTH_LOGOUT: 'Đăng xuất',
  USER_CREATE: 'Tạo người dùng',
  USER_UPDATE: 'Cập nhật người dùng',
  USER_DEACTIVATE: 'Vô hiệu hóa người dùng',
  USER_ROLE_ASSIGN: 'Gán vai trò',
  USER_ROLE_REVOKE: 'Thu hồi vai trò',
  REPORT_USERS_VIEW: 'Xem báo cáo người dùng',
});

const DETAIL_LABELS = Object.freeze({
  roleName: 'Vai trò', reportType: 'Loại báo cáo', status: 'Trạng thái',
  reason: 'Lý do', changedFields: 'Trường đã thay đổi',
});

export function formatAuditAction(action) {
  const raw = String(action || '').trim();
  return { label: ACTION_LABELS[raw] || raw || 'Chưa xác định', raw, known: Boolean(ACTION_LABELS[raw]) };
}

export function formatAuditDetailKey(key) {
  return DETAIL_LABELS[key] || key;
}
```

- [ ] **Bước 4: Chạy GREEN**

Chạy từ `frontend`: `node --test test/adminConsolePresentation.test.js`

Dự kiến: ĐẠT, 4 lần kiểm tra, 0 trượt.

- [ ] **Bước 5: Cam kết hợp đồng thuần túy**

```powershell
git add frontend/test/adminConsolePresentation.test.js frontend/src/page/admin/adminNavigation.js frontend/src/page/admin/dashboard/adminDashboardViewModel.js frontend/src/page/admin/permissions/permissionPresentation.js frontend/src/page/admin/audit/adminAuditPresentation.js
git commit -m "test: define admin console presentation contracts"
```

---

### Nhiệm vụ 3: Xây dựng các nguyên tắc và kiểu dáng quản trị được chia sẻ

**Tệp:**
- Tạo: `frontend/test/adminConsoleStructure.test.js`
- Tạo: `frontend/src/page/admin/components/AdminPageHeader.jsx`
- Tạo: `frontend/src/page/admin/components/AdminFilterBar.jsx`
- Tạo: `frontend/src/page/admin/components/AdminDateField.jsx`
- Tạo: `frontend/src/page/admin/components/AdminActionButton.jsx`
- Tạo: `frontend/src/page/admin/components/AdminEmptyState.jsx`
- Tạo: `frontend/src/page/admin/components/AdminPagination.jsx`
- Tạo: `frontend/src/page/admin/admin-console.css`

**Giao diện:**
- Sản xuất: các thành phần chỉ dành cho bản trình bày mà không cần nhập API.
- Tiêu thụ: nhãn, giá trị, lệnh gọi lại, biểu tượng và phần tử con từ các mô-đun phần.

- [ ] **Bước 1: Viết kiểm thử ranh giới nguồn RED**

Quá trình kiểm tra sẽ đọc từng tệp mới và xác nhận rằng các thành phần được chia sẻ không nhập
`api/`, các trường ngày có nhãn hiển thị, các nút hành động hiển thị văn bản hiển thị, CSS bao gồm
các hợp đồng tiêu điểm/giảm chuyển động/thẻ di động và các nút trang giới hạn phân trang cho một cửa
sổ năm trang.

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../src/page/admin/', import.meta.url);

test('Admin shared components are presentation only', async () => {
  for (const file of ['AdminPageHeader.jsx', 'AdminFilterBar.jsx', 'AdminDateField.jsx', 'AdminActionButton.jsx', 'AdminEmptyState.jsx', 'AdminPagination.jsx']) {
    const source = await readFile(new URL(`components/${file}`, root), 'utf8');
    assert.doesNotMatch(source, /api\//);
  }
});

test('Admin date and action controls expose visible labels', async () => {
  const date = await readFile(new URL('components/AdminDateField.jsx', root), 'utf8');
  const action = await readFile(new URL('components/AdminActionButton.jsx', root), 'utf8');
  assert.match(date, /<span>\{label\}<\/span>/);
  assert.match(date, /type="date"/);
  assert.match(action, /<span>\{label\}<\/span>/);
});

test('Admin CSS defines mobile cards, focus and reduced motion', async () => {
  const css = await readFile(new URL('admin-console.css', root), 'utf8');
  assert.match(css, /\.admin-user-cards/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /@media \(max-width: 900px\)/);
});
```

- [ ] **Bước 2: Chạy RED**

Chạy từ `frontend`: `node --test test/adminConsoleStructure.test.js`

Dự kiến: THẤT BẠI vì `components/AdminPageHeader.jsx` không tồn tại.

- [ ] **Bước 3: Triển khai các nguyên mẫu được chia sẻ**

Sử dụng các chữ ký công khai chính xác sau:

```jsx
export function AdminPageHeader({ eyebrow, title, refreshing = false, onRefresh, primaryAction })
export function AdminFilterBar({ children, actions, className = '' })
export function AdminDateField({ id, label, value, onChange, min, max })
export function AdminActionButton({ icon: Icon, label, tone = 'neutral', disabled = false, title, onClick })
export function AdminEmptyState({ icon: Icon, title, description, action })
export function AdminPagination({ page, totalItems, pageSize = 8, onPageChange })
```

`AdminDateField` phải hiển thị `<label htmlFor={id}><span>{label}</span><input id={id} type="date"
value={value} onChange={onChange} min={min} max={max} /></label>`. `AdminActionButton` phải hiển thị
`<Icon aria-hidden="true" />` và `<span>{label}</span>`. `AdminPagination` phải tính toán cửa sổ
trang ở giữa có tối đa năm số trang và luôn hiển thị các điều khiển Trước/Tiếp theo.

- [ ] **Bước 4: Thêm kem nền**

Bắt đầu `admin-console.css` với các mã thông báo được phê duyệt và các hợp đồng truy cập bắt buộc:

```css
.admin-console {
  --admin-ink: #2a2118;
  --admin-paper: #fffdf8;
  --admin-canvas: #faf6ef;
  --admin-brass: #a87532;
  --admin-brass-dark: #7b5528;
  --admin-success: #18794e;
  --admin-danger: #b42318;
  --admin-muted: #6b6153;
  --admin-line: #e7ddca;
  min-height: 100vh;
  background: var(--admin-canvas);
  color: var(--admin-ink);
  font-family: var(--sans);
}

.admin-console :where(button, input, select, textarea):focus-visible {
  outline: 3px solid color-mix(in srgb, var(--admin-brass) 35%, transparent);
  outline-offset: 2px;
}

.admin-user-cards { display: none; }

@media (max-width: 900px) {
  .admin-user-table { display: none; }
  .admin-user-cards { display: grid; gap: 12px; }
  .admin-filter-grid { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .admin-console *, .admin-console *::before, .admin-console *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

- [ ] **Bước 5: Chạy GREEN và tìm kiếm các tệp mới**

Chạy từ `frontend`:

```powershell
node --test test/adminConsoleStructure.test.js
npm.cmd run lint
```

Dự kiến: cả hai lệnh đều thoát `0`.

- [ ] **Bước 6: Cam kết bài thuyết trình được chia sẻ**

```powershell
git add frontend/test/adminConsoleStructure.test.js frontend/src/page/admin/components frontend/src/page/admin/admin-console.css
git commit -m "feat: add admin console presentation primitives"
```

---

### Nhiệm vụ 4: Xây dựng lớp bao phản hồi được bảo vệ

**Tệp:**
- Tạo: `frontend/src/page/admin/adminAccess.js`
- Tạo: `frontend/src/page/admin/components/AdminShell.jsx`
- Tạo: `frontend/src/page/admin/AdminConsolePage.jsx`
- Sửa đổi: `frontend/test/adminConsoleStructure.test.js`

**Giao diện:**
- `readStoredAdminAccess()` trả về `{ authenticated, isAdmin, user }`.
- `AdminShell` tiêu thụ `activeSection`, `currentUser`, `onSectionChange`, `onHome`, `onLogout` và `children`.
- `AdminConsolePage` sở hữu `activeSection = 'users'` và không hiển thị phần được bảo vệ trước khi truy cập thành công.

- [ ] **Bước 1: Thêm các kiểm thử lớp bao không thành công**

Xác nhận rằng lớp bao nhập `ADMIN_NAVIGATION`, sử dụng `aria-current`, hiển thị
`aria-expanded`/`aria-controls` trên nút `Menu`, xử lý Escape và `AdminConsolePage` thực hiện
`<Navigate to="/login" replace />` và `<Navigate to="/home" replace />` trước khi hiển thị phần.

- [ ] **Bước 2: Chạy RED**

Chạy từ `frontend`: `node --test test/adminConsoleStructure.test.js`

Dự kiến: THẤT BẠI vì `AdminShell.jsx`, `adminAccess.js` và `AdminConsolePage.jsx` không có mặt.

- [ ] **Bước 3: Di chuyển trình phân tích cú pháp truy cập hiện có mà không thay đổi ngữ nghĩa**

Di chuyển `readStoredAdminAccess` từ `UserManagement.jsx` hiện tại sang `adminAccess.js`, giữ nguyên
các khóa lưu trữ và chuẩn hóa vai trò của nó rồi xuất nó.

- [ ] **Bước 4: Triển khai `AdminShell`**

lớp bao phải lấy mọi điều khiển điều hướng từ `ADMIN_NAVIGATION`, ánh xạ `home` đến `onHome`, ánh xạ
các mục khác tới `onSectionChange(id)`, đóng bảng điều khiển di động sau khi điều hướng, đóng Escape
và chuyển tiêu điểm về trình kích hoạt Menu. Nó không được nhập API chức năng.

- [ ] **Bước 5: Thực hiện hợp đồng sáng tác cấp tuyến**

`AdminConsolePage` bắt đầu bằng:

```jsx
const access = readStoredAdminAccess();
const [activeSection, setActiveSection] = useState('users');

if (!access.authenticated) return <Navigate to="/login" replace />;
if (!access.isAdmin) return <Navigate to="/home" replace />;
```

Đối với tác vụ này, nó có thể hiển thị một trình giữ chỗ phần rõ ràng bên trong `AdminShell`; nó
không được nối dây từ `UserManagement.jsx` cho đến Nhiệm vụ 11.

- [ ] **Bước 6: Chạy GREEN, kiểm tra giao diện người dùng đầy đủ và xây dựng**

Chạy từ `frontend`:

```powershell
node --test test/adminConsoleStructure.test.js
npm.cmd test
npm.cmd run build
```

Dự kiến: tất cả các lệnh thoát `0`; tuyến đường trực tiếp vẫn được hỗ trợ bởi mục nhập cũ tại điểm
kiểm tra này.

- [ ] **Bước 7: Cam kết lớp bao**

```powershell
git add frontend/src/page/admin/adminAccess.js frontend/src/page/admin/components/AdminShell.jsx frontend/src/page/admin/AdminConsolePage.jsx frontend/test/adminConsoleStructure.test.js
git commit -m "feat: add guarded responsive admin shell"
```

---

### Nhiệm vụ 5: Di chuyển bảng điều khiển với các biểu đồ tập trung vào quyết định

**Tệp:**
- Tạo: `frontend/src/page/admin/dashboard/AdminDashboardSection.jsx`
- Sửa đổi: `frontend/test/adminConsoleStructure.test.js`
- Sửa đổi: `frontend/src/page/admin/AdminConsolePage.jsx`

**Giao diện:**
- `AdminDashboardSection()` sở hữu trạng thái tải/lỗi/thành công cuối cùng của `adminApi.dashboard()`.
- Nó tiêu thụ `selectOperationalChartRows` trước khi hiển thị mọi biểu đồ.
- Nó hiển thị `AdminPageHeader`, thẻ tóm tắt đã được phê duyệt, `AdminLineChart` và `AdminEmptyState`.

- [ ] **Bước 1: Thêm các kiểm thử cấu trúc bảng điều khiển RED**

Khẳng định rằng phần mới gọi `adminApi.dashboard()`, bảo vệ các phản hồi cũ bằng
`createLatestRequestGuard`, chuyển cả ba tập dữ liệu qua `selectOperationalChartRows` và hiển thị
`Dữ liệu sẽ xuất hiện khi có giao dịch phù hợp.` cho một tập dữ liệu đã chuyển đổi trống.

- [ ] **Bước 2: Chạy RED**

Chạy từ `frontend`: `node --test test/adminConsolePresentation.test.js test/adminConsoleStructure.test.js`

Dự kiến: THẤT BẠI vì `AdminDashboardSection.jsx` vắng mặt.

- [ ] **Bước 3: Di chuyển và siết chặt việc thực hiện biểu đồ**

Di chuyển bản trình bày `formatChartLabel` và `AdminLineChart` hiện có vào
`AdminDashboardSection.jsx`. Phần này phải chuyển đổi từng tập dữ liệu trước:

```js
const mostBorrowed = selectOperationalChartRows(data?.charts?.mostBorrowed);
const overdue = selectOperationalChartRows(data?.charts?.overdue);
const returnedToday = selectOperationalChartRows(data?.charts?.returnedToday);
```

`AdminLineChart` phải coi `rows.length === 0` là nhánh trống duy nhất của nó vì các hàng toàn 0 đã bị xóa.

- [ ] **Bước 4: Giữ nguyên hành vi làm mới**

Sử dụng một `createLatestRequestGuard()` được lưu trữ trong `useRef`, giữ `data` thành công cuối
cùng sau một lỗi sau đó, hiển thị `Đang cập nhật...` trong khi làm mới và hiển thị hành động thử lại
nội tuyến sau khi thất bại.

- [ ] **Bước 5: Nối dây bảng điều khiển vào `AdminConsolePage`**

Chỉ hiển thị `<AdminDashboardSection />` khi `activeSection === 'dashboard'`.

- [ ] **Bước 6: Chạy GREEN và xây dựng**

Chạy từ `frontend`:

```powershell
node --test test/adminConsolePresentation.test.js test/adminConsoleStructure.test.js
npm.cmd run lint
npm.cmd run build
```

Dự kiến: thoát `0` cho mọi lệnh.

- [ ] **Bước 7: Bảng điều khiển cam kết**

```powershell
git add frontend/src/page/admin/dashboard frontend/src/page/admin/AdminConsolePage.jsx frontend/test/adminConsoleStructure.test.js
git commit -m "feat: refactor admin dashboard presentation"
```

---

### Nhiệm vụ 6: Di chuyển quản lý người dùng và thẻ di động

**Tệp:**
- Tạo: `frontend/src/page/admin/users/AdminUsersSection.jsx`
- Tạo: `frontend/src/page/admin/users/UserEditorModal.jsx`
- Tạo: `frontend/src/page/admin/users/UserRoleModal.jsx`
- Tạo: `frontend/src/page/admin/users/UserDetailDrawer.jsx`
- Tạo: `frontend/src/page/admin/users/userPresentation.js`
- Sửa đổi: `frontend/test/userManagementFrontend.test.js`
- Sửa đổi: `frontend/test/userManagementApi.test.js`
- Sửa đổi: `frontend/test/adminConsoleStructure.test.js`
- Sửa đổi: `frontend/src/page/admin/AdminConsolePage.jsx`
- Sửa đổi: `frontend/src/page/admin/admin-console.css`

**Giao diện:**
- `AdminUsersSection({ onToast })` sở hữu danh sách người dùng/thống kê/vai trò/chi tiết/trạng thái thao tác ghi.
- `userPresentation.js` xuất `validateUserForm`, `normalizeEditableRoleCatalog`, `buildRoleMutationPlan`, `getPrimaryRole` và `formatAdminDate`.
- Máy tính để bàn và thẻ di động sử dụng cùng một mảng `users` và các lệnh gọi lại hành động giống nhau.

- [ ] **Bước 1: Chuyển hướng các kiểm thử hợp đồng nguồn hiện có sang chủ sở hữu mới và thêm các xác nhận trên thiết bị di động RED**

Cập nhật kiểm tra để trình trợ giúp biểu mẫu/vai trò được đọc hoặc nhập từ
`users/userPresentation.js`, hành vi API được xác nhận trong `AdminUsersSection.jsx` và kiểm tra cấu
trúc yêu cầu cả `.admin-user-table` và `.admin-user-cards`. Thêm xác nhận rằng văn bản hành động
hiển thị chứa `Chỉnh sửa`, `Phân quyền` và `Vô hiệu hóa`.

- [ ] **Bước 2: Chạy RED**

Chạy từ `frontend`:

```powershell
node --test test/userManagementFrontend.test.js test/userManagementApi.test.js test/adminConsoleStructure.test.js
```

Dự kiến: THẤT BẠI vì tệp mô-đun người dùng mới không tồn tại.

- [ ] **Bước 3: Di chuyển người trợ giúp người dùng thuần túy**

Di chuyển các triển khai hiện tại của `validateUserForm`, `normalizeEditableRoleCatalog`,
`buildRoleMutationPlan`, `getPrimaryRole` và `formatDate` vào `userPresentation.js`. Chỉ đổi tên
`formatDate` thành `formatAdminDate` để tránh việc nhập không rõ ràng. Giữ nguyên giới hạn xác thực
và thứ tự thay đổi vai trò một cách chính xác.

- [ ] **Bước 4: Di chuyển các phương thức và ngăn kéo mà không thay đổi hành vi kinh doanh**

Di chuyển `UserModal` sang `UserEditorModal`, `RoleModal` sang `UserRoleModal` và chi tiết người
dùng hiện tại JSX vào `UserDetailDrawer`. Giữ nguyên tải trọng của phiên bản hiệu quả, trường thủ
thư, hành vi ghi chú thiết lập, xác thực danh mục, đối chiếu chính xác và tóm tắt chi tiết an toàn.

- [ ] **Bước 5: Triển khai hiển thị trên máy tính để bàn và thiết bị di động từ một nguồn dữ liệu**

Vùng chứa máy tính để bàn phải sử dụng hợp đồng bảng tám cột đã được phê duyệt:

```jsx
<div className="admin-user-table" aria-label="Danh sách người dùng dạng bảng">
  <table aria-label="Danh sách người dùng">
    <thead><tr>
      <th>Người dùng</th><th>Username</th><th>Số điện thoại</th><th>Vai trò</th>
      <th>Trạng thái</th><th>Ngày tạo</th><th>Lần đăng nhập</th><th>Thao tác</th>
    </tr></thead>
    <tbody>{users.map((user) => <UserTableRow key={user.userId} user={user} />)}</tbody>
  </table>
</div>
```

Vùng chứa di động phải ánh xạ cùng một `users`:

```jsx
<div className="admin-user-cards" aria-label="Danh sách người dùng dạng thẻ">
  {users.map((user) => (
    <article key={user.userId} className="admin-user-card">
      <button type="button" className="admin-user-card-summary" onClick={() => openUserDetail(user.userId)}>
        <strong>{user.fullName || 'Chưa cập nhật tên'}</strong>
        <span>{user.email}</span>
        <StatusBadge status={user.status} />
      </button>
      <dl>
        <div><dt>Vai trò</dt><dd><div className="admin-badge-row">{(user.roles || []).map((role) => <RoleBadge key={role} role={role} />)}</div></dd></div>
        <div><dt>Lần đăng nhập</dt><dd>{formatAdminDate(user.lastLoginAt)}</dd></div>
      </dl>
      <div className="admin-user-card-actions">
        <AdminActionButton icon={Edit2} label="Chỉnh sửa" onClick={() => openEditModal(user)} />
        <AdminActionButton icon={Shield} label="Phân quyền" onClick={() => openRoleModal(user)} />
        <AdminActionButton icon={PowerOff} label="Vô hiệu hóa" tone="danger" disabled={!['ACTIVE', 'LOCKED'].includes(user.status)} title="Tài khoản này đã ngừng hoạt động." onClick={() => deactivateUser(user)} />
      </div>
    </article>
  ))}
</div>
```

Mọi hành động đều sử dụng `AdminActionButton` với các nhãn hiển thị. Việc hủy kích hoạt bị vô hiệu
hóa sử dụng tiêu đề `Tài khoản này đã ngừng hoạt động.`.

- [ ] **Bước 6: Bảo toàn quyền sở hữu dữ liệu và thao tác ghi**

Di chuyển `loadUsers`, `refreshUserDirectory`, `loadUserStatistics`, `loadRoles`, `openUserDetail`,
tạo/chỉnh sửa/hủy kích hoạt và logic lưu vai trò vào `AdminUsersSection`. Giữ nguyên các lỗi độc
lập, bảo vệ cũ, trường DTO an toàn, dấu thời gian lạc quan, lưu vai trò không hoạt động, phân công
trước khi thu hồi và đối chiếu sau lỗi một phần.

- [ ] **Bước 7: Người sử dụng dây và kiểu dáng**

Kết xuất `<AdminUsersSection onToast={setToast} />` cho `activeSection === 'users'`. Ở độ rộng trên
900px thẻ ẩn; bằng hoặc dưới 900px, ẩn bảng và hiển thị thẻ. Ở 1366px, áp dụng `text-overflow:
ellipsis` được kiểm soát cho các ô email/tên người dùng thay vì `overflow-wrap: mọi nơi`.

- [ ] **Bước 8: Chạy GREEN và các hồi quy bị ảnh hưởng**

Chạy từ `frontend`:

```powershell
node --test test/userManagementFrontend.test.js test/userManagementApi.test.js test/adminConsolePresentation.test.js test/adminConsoleStructure.test.js
npm.cmd run lint
npm.cmd run build
```

Dự kiến: tất cả các lệnh thoát `0`.

- [ ] **Bước 9: Cam kết quản lý người dùng**

```powershell
git add frontend/src/page/admin/users frontend/src/page/admin/AdminConsolePage.jsx frontend/src/page/admin/admin-console.css frontend/test/userManagementFrontend.test.js frontend/test/userManagementApi.test.js frontend/test/adminConsoleStructure.test.js
git commit -m "feat: refactor admin user management experience"
```

---

### Nhiệm vụ 7: Di chuyển quản lý yêu cầu mà không có quyền sở hữu

**Tệp:**
- Tạo: `frontend/src/page/admin/requests/AdminRequestsSection.jsx`
- Sửa đổi: `frontend/test/adminRequestManagementFrontend.test.js`
- Sửa đổi: `frontend/test/adminConsoleStructure.test.js`
- Sửa đổi: `frontend/src/page/admin/AdminConsolePage.jsx`
- Sửa đổi: `frontend/src/page/admin/admin-console.css`

**Giao diện:**
- `AdminRequestsSection({ onToast })` sở hữu các bộ lọc, phân trang máy chủ, chi tiết, xuất DOCX và ủy quyền thao tác ghi FE07.
- Tiêu thụ: `adminApi.requests`, `adminApi.requestDetail`, trình trợ giúp yêu cầu/xuất hiện có, `borrowingApi.approveRequest` và `borrowingApi.rejectRequest` chính xác như luồng kế thừa.

- [ ] **Bước 1: Di chuyển các kiểm thử hợp đồng yêu cầu sang mô-đun mới và thêm các xác nhận ngày được gắn nhãn RED**

Yêu cầu `AdminDateField` cho `request-from` và `request-to`, giữ nguyên `Lọc trạng thái`, kích thước
trang 20, kiểm soát trạng thái đầu cuối, tìm nạp chi tiết chuẩn và xuất DOCX trên tất cả các trang
được lọc.

- [ ] **Bước 2: Chạy RED**

Chạy từ `frontend`: `node --test test/adminRequestManagementFrontend.test.js test/adminConsoleStructure.test.js`

Dự kiến: THẤT BẠI vì `AdminRequestsSection.jsx` vắng mặt.

- [ ] **Bước 3: Di chuyển trạng thái yêu cầu và trình xử lý**

Di chuyển `loadRequests`, `applyRequestFilters`, `openRequestDetail`, `exportRequests`, trạng thái
chi tiết yêu cầu và FE07 phê duyệt/từ chối trình xử lý vào `AdminRequestsSection`. Giữ nguyên trạng
thái thô, tổng số trang/giới hạn của máy chủ, bảo vệ phạm vi ngày không hợp lệ, bộ lọc xuất bị đóng
băng và hành vi `409 BORROW_REQUEST_NOT_PENDING`.

- [ ] **Bước 4: Thay thế thanh công cụ dày đặc**

Sử dụng `AdminFilterBar` với các trường tìm kiếm/trạng thái/ngày trong `.admin-filter-grid` và Áp
dụng/Đặt lại/Xuất trong `.admin-filter-actions`. Chỉ đặt lại kết xuất khi có bất kỳ bộ lọc nào khác
với `{ q: '', status: 'ALL', from: '', to: '' }`.

- [ ] **Bước 5: Gửi yêu cầu và xác minh**

Chạy từ `frontend`:

```powershell
node --test test/adminRequestManagementFrontend.test.js test/adminConsoleStructure.test.js
npm.cmd run lint
npm.cmd run build
```

Dự kiến: tất cả các lệnh thoát `0`.

- [ ] **Bước 6: Cam kết quản lý yêu cầu**

```powershell
git add frontend/src/page/admin/requests frontend/src/page/admin/AdminConsolePage.jsx frontend/src/page/admin/admin-console.css frontend/test/adminRequestManagementFrontend.test.js frontend/test/adminConsoleStructure.test.js
git commit -m "feat: refactor admin request management layout"
```

---

### Nhiệm vụ 8: Di chuyển quyền với các quyết định riêng biệt

**Tệp:**
- Tạo: `frontend/src/page/admin/permissions/AdminPermissionsSection.jsx`
- Sửa đổi: `frontend/test/userManagementFrontend.test.js`
- Sửa đổi: `frontend/src/page/admin/AdminConsolePage.jsx`
- Sửa đổi: `frontend/src/page/admin/admin-console.css`

**Giao diện:**
- `AdminPermissionsSection()` tải độc lập `adminApi.permissions()` và `reportApi.users()`.
- Tiêu thụ: `buildPermissionRoleSummary`, `buildPermissionModuleCoverage`, `roleAllowsPermission` hiện có, nhãn vai trò/mô-đun/quyền được bản địa hóa và `getPermissionDecision`.

- [ ] **Bước 1: Thêm bản sao RED và xác nhận quyết định**

Yêu cầu `Dữ liệu phân quyền`, `Thống kê tài khoản theo vai trò`, phần giải thích đa vai trò và các
lớp `permission-decision allowed` / `permission-decision denied`. Từ chối `Ma trận FE11` và `Thống
kê FE12`.

- [ ] **Bước 2: Chạy RED**

Chạy từ `frontend`: `node --test test/userManagementFrontend.test.js test/adminConsolePresentation.test.js`

Dự kiến: THẤT BẠI vì `AdminPermissionsSection.jsx` vắng mặt.

- [ ] **Bước 3: Di chuyển hành vi tải độc lập**

Di chuyển quyền và trình tải thống kê người dùng vào phần này. Bảo toàn các giá trị thành công cuối
cùng và các điều khiển thử lại độc lập. Không thêm ma trận quyền được mã hóa cứng hoặc lấy số lượng
từ người dùng được phân trang.

- [ ] **Bước 4: Đưa ra quyết định ngữ nghĩa**

Đối với mọi ô vai trò/quyền:

```jsx
const decision = getPermissionDecision(roleAllowsPermission(permission, role.roleName));
return <span className={`permission-decision ${decision.tone}`}><b aria-hidden="true">{decision.symbol}</b>{decision.label}</span>;
```

Sử dụng các tiêu đề bảng cố định và kiểu dáng bị từ chối trung tính; không truyền đạt các quyết định
chỉ bằng màu sắc.

- [ ] **Bước 5: Chuyển khoản, xác minh và cam kết**

Chạy từ `frontend`:

```powershell
node --test test/adminConsolePresentation.test.js test/userManagementFrontend.test.js
npm.cmd run lint
npm.cmd run build
```

Dự kiến: tất cả các lệnh thoát `0`.

```powershell
git add frontend/src/page/admin/permissions frontend/src/page/admin/AdminConsolePage.jsx frontend/src/page/admin/admin-console.css frontend/test/userManagementFrontend.test.js
git commit -m "feat: clarify admin permission decisions"
```

---

### Nhiệm vụ 9: Di chuyển nhật ký kiểm tra bằng bản trình bày được bản địa hóa

**Tệp:**
- Tạo: `frontend/src/page/admin/audit/AdminAuditSection.jsx`
- Sửa đổi: `frontend/test/userManagementFrontend.test.js`
- Sửa đổi: `frontend/src/page/admin/AdminConsolePage.jsx`
- Sửa đổi: `frontend/src/page/admin/admin-console.css`

**Giao diện:**
- `AdminAuditSection()` sở hữu trạng thái `q`, `action`, `actorId`, `from`, `to`, trang và bộ lọc giới hạn chuẩn.
- Tiêu thụ: `formatAuditAction`, `formatAuditDetailKey`, bộ định dạng chi tiết chỉ dành cho DTO an toàn và `adminApi.auditLogs`.

- [ ] **Bước 1: Thêm xác nhận bản trình bày kiểm tra RED**

Giữ các xác nhận chính xác của trình tạo thông số bộ lọc. Yêu cầu các nhãn hiển thị liên tục `Hành
động`, `Mã tác nhân`, `Từ ngày` và `Đến ngày`. Yêu cầu `formatAuditAction(log.action)` và
`formatAuditDetailKey(key)`. Từ chối hiển thị `<span>{log.action}</span>` trực tiếp.

- [ ] **Bước 2: Chạy RED**

Chạy từ `frontend`: `node --test test/userManagementFrontend.test.js test/adminConsolePresentation.test.js`

Dự kiến: THẤT BẠI vì `AdminAuditSection.jsx` vắng mặt.

- [ ] **Bước 3: Di chuyển trạng thái kiểm tra và định dạng DTO an toàn**

Di chuyển `buildAuditLogParams`, lọc mục nhập chi tiết an toàn, chiếu mục tiêu, định dạng giá trị,
trình tải, trạng thái lỗi/thành công cuối cùng độc lập và phân trang vào `AdminAuditSection`. Giữ
nguyên ủy quyền, phân trang, biên tập, giá trị bộ lọc hành động thô và các khóa chi tiết an toàn
không xác định.

- [ ] **Bước 4: Hiển thị nhãn đã bản địa hóa trên giá trị thô**

Kết xuất từng hành động dưới dạng:

```jsx
const action = formatAuditAction(log.action);
<span className="admin-audit-action" title={action.raw}>{action.label}</span>
```

Kết xuất từng chi tiết an toàn `dt` bằng `formatAuditDetailKey(key)` và giữ nguyên định dạng giá trị thô.

- [ ] **Bước 5: Thay thế thanh công cụ kiểm tra và xác minh**

Sử dụng lưới lọc đáp ứng được gắn nhãn. Giữ `Áp dụng` và `Xóa lọc` ở một hàng hành động riêng biệt. Chạy:

```powershell
node --test test/adminConsolePresentation.test.js test/userManagementFrontend.test.js
npm.cmd run lint
npm.cmd run build
```

Dự kiến: tất cả các lệnh thoát `0`.

- [ ] **Bước 6: Cam kết kiểm tra**

```powershell
git add frontend/src/page/admin/audit frontend/src/page/admin/AdminConsolePage.jsx frontend/src/page/admin/admin-console.css frontend/test/userManagementFrontend.test.js
git commit -m "feat: localize admin audit presentation"
```

---

### Nhiệm vụ 10: Di chuyển thư viện và lưu hành, sau đó xóa các đường dẫn ẩn cũ

**Tệp:**
- Tạo: `frontend/src/page/admin/library/AdminLibrarySection.jsx`
- Tạo: `frontend/src/page/admin/circulation/AdminCirculationSection.jsx`
- Sửa đổi: `frontend/src/page/admin/AdminConsolePage.jsx`
- Sửa đổi: `frontend/test/userManagementFrontend.test.js`
- Sửa đổi: `frontend/test/membershipFrontend.test.js`
- Sửa đổi: `frontend/test/fineManagementFrontend.test.js`

**Giao diện:**
- `AdminLibrarySection({ onToast })` duy trì quyền sở hữu sách chỉ đọc FE05 đã được phê duyệt và bản trình bày/hành động siêu dữ liệu hiện có.
- `AdminCirculationSection({ onToast })` duy trì hành vi lưu hành FE07 đã được phê duyệt.
- Không phần nào nhập các thành phần thành viên FE04 cũng như các trình trợ giúp tốt về lưu trữ cục bộ.

- [ ] **Bước 1: Thêm kiểm thử quyền sở hữu RED**

Yêu cầu phần Thư viện mới để tránh các bộ điều hợp thao tác ghi sách FE05 trùng lặp, phần Lưu thông để
sử dụng API mượn hiện có và tất cả các nguồn mô-đun Quản trị viên để loại trừ `getFineRecords`,
`saveFineRecords`, `MembershipApplicationsTable`, `MembershipFilter`, `MembershipReviewModal`,
`activeSection === 'membership'` và `activeSection === 'payments'`.

- [ ] **Bước 2: Chạy RED**

Chạy từ `frontend`:

```powershell
node --test test/userManagementFrontend.test.js test/membershipFrontend.test.js test/fineManagementFrontend.test.js
```

Dự kiến: THẤT BẠI vì không có tệp phần mới và nội dung nhập cũ vẫn tồn tại trong `UserManagement.jsx`.

- [ ] **Bước 3: Di chuyển hành vi Thư viện đã được phê duyệt**

Di chuyển các tab tài nguyên thư viện, trình tải, bảng sách chỉ đọc, bản trình bày siêu dữ liệu,
xuất và mọi trình xử lý hành động siêu dữ liệu đã được phê duyệt vào `AdminLibrarySection`. Giữ
nguyên điều hướng FE05 chuẩn cho các thao tác ghi sách và không giới thiệu `adminApi.createBook`,
`updateBook` hoặc `deactivateBook`.

- [ ] **Bước 4: Di chuyển hành vi Lưu hành đã được phê duyệt**

Di chuyển các bộ lọc lưu thông, liệt kê, gia hạn/trả sách giao diện người dùng, phân trang và các
lệnh gọi API mượn hiện có vào `AdminCirculationSection` mà không thay đổi giá trị yêu cầu/trạng thái
hoặc xác thực.

- [ ] **Bước 5: Chỉ xóa mã cũ của Bảng điều khiển dành cho quản trị viên không thể truy cập**

Xóa các mục nhập thành viên/thanh toán, trạng thái, trình tải, siêu dữ liệu phần, nhánh kết xuất và
trình xử lý đánh giá tốt về bộ nhớ cục bộ khỏi quá trình triển khai Bảng điều khiển dành cho quản
trị viên. Không chỉnh sửa tệp sản xuất thành viên FE04 hoặc tệp sản xuất tốt FE09.

- [ ] **Bước 6: Chuyển khoản, xác minh và cam kết**

Chạy từ `frontend`:

```powershell
node --test test/userManagementFrontend.test.js test/membershipFrontend.test.js test/fineManagementFrontend.test.js test/borrowingFrontend.test.js
npm.cmd run lint
npm.cmd run build
```

Dự kiến: tất cả các lệnh thoát `0`.

```powershell
git add frontend/src/page/admin/library frontend/src/page/admin/circulation frontend/src/page/admin/AdminConsolePage.jsx frontend/test/userManagementFrontend.test.js frontend/test/membershipFrontend.test.js frontend/test/fineManagementFrontend.test.js
git commit -m "refactor: complete admin section migration"
```

---

### Nhiệm vụ 11: Cắt bỏ mục tương thích và E2E đáp ứng

**Tệp:**
- Thay thế: `frontend/src/page/UserManagement.jsx`
- Sửa đổi: `frontend/test/appShellFrontend.test.js`
- Sửa đổi: `frontend/test/appCodeSplitting.test.js`
- Sửa đổi: `frontend/test/vietnameseUi.test.js`
- Sửa đổi: `frontend/test/userManagementFrontend.test.js`
- Sửa đổi: `tests/e2e/fe11-admin-request-management.spec.js`

**Giao diện:**
- `UserManagement.jsx` xuất trang mới mà không thay đổi `App.jsx` hoặc `/admin/users`.
- E2E tiếp tục sử dụng máy chủ kiểm thử hệ thống thực và đăng nhập Quản trị chuẩn.

- [ ] **Bước 1: Thêm khả năng tương thích RED và xác nhận phản hồi**

Yêu cầu mục nhập tương thích phải chính xác:

```jsx
export { default } from './admin/AdminConsolePage';
```

Cập nhật quét nguồn để đọc `page/admin/**/*.jsx` cộng với `admin-console.css`. Trong khối di động
E2E thay thế `internalTableScroll === true` bằng những kỳ vọng sau:

```js
await expect(page.locator('.admin-user-table')).toBeHidden();
await expect(page.locator('.admin-user-cards')).toBeVisible();
await expect(page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).first()).toBeVisible();
expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
```

Ở 1366px khẳng định bảng hiển thị, thẻ bị ẩn và không tồn tại tràn trang.

- [ ] **Bước 2: Chạy RED theo mục cũ**

Chạy từ gốc repo:

```powershell
npm.cmd --prefix frontend test
npx.cmd playwright test tests/e2e/fe11-admin-request-management.spec.js --project=chromium
```

Dự kiến: hợp đồng giao diện người dùng hoặc E2E đáp ứng không thành công vì khối nguyên khối cũ vẫn
là mục nhập tuyến và thiết bị di động vẫn sử dụng chức năng cuộn bảng nội bộ.

- [ ] **Bước 3: Thay thế mục tương thích và cập nhật quét nguồn**

Thay thế `UserManagement.jsx` bằng xuất một dòng ở trên. Cập nhật các kiểm thử mà trước đây chỉ đọc
tệp đó để đọc mô-đun sở hữu mới của chúng hoặc nối cây mô-đun Quản trị để kiểm tra bản địa
hóa/nguồn.

- [ ] **Bước 4: Chạy GREEN tập trung/đầy đủ giao diện người dùng và E2E**

Chạy từ gốc repo:

```powershell
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npx.cmd playwright test tests/e2e/fe11-admin-request-management.spec.js --project=chromium
```

Dự kiến: tất cả các lệnh thoát `0`; E2E chứng minh thẻ di động, bàn máy tính xách tay, hành vi yêu
cầu và không bị tràn trang.

- [ ] **Bước 5: Cam kết cắt bỏ**

```powershell
git add frontend/src/page/UserManagement.jsx frontend/test tests/e2e/fe11-admin-request-management.spec.js
git commit -m "refactor: cut over modular admin console"
```

---

### Nhiệm vụ 12: Xác thực đầy đủ, Bằng chứng, Triển khai và chấp nhận giai đoạn Azure

**Tệp:**
- Tạo: `.sdd/reviews/admin-console-full-refactor-validation-2026-07-22.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/CHANGELOG.md`

**Giao diện:**
- Tiêu thụ: `FE11-UXR01..UXR06` đã hoàn thành, kết quả tự động rõ ràng, ảnh chụp màn hình trình duyệt, chạy quy trình làm việc URL và SHA đã triển khai.
- Tạo ra: Bằng chứng chấp nhận `FE11-UXR07` và ranh giới phát hành trung thực giữa kiểm tra tự động và phê duyệt của con người.

- [ ] **Bước 1: Chạy xác thực hoàn toàn tự động mới**

Chạy từ gốc repo:

```powershell
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd --prefix backend test -- --runInBand
npm.cmd run trace:enforce
npm.cmd run test:deployment
npm.cmd run test:e2e
git diff --check
git status --short
```

Dự kiến: mọi lệnh đều thoát `0`; `git diff --check` không in được gì; `git status --short` chỉ liệt
kê các cập nhật bằng chứng/quản trị dự định trước cam kết của họ.

- [ ] **Bước 2: Thực hiện chấp nhận hình ảnh cục bộ/trình duyệt**

Sử dụng phiên Quản trị viên đã được xác thực, kiểm tra ở 1366x768 và 390x844:

- Trang tổng quan: không có biểu đồ hoàn toàn bằng 0 và không quá năm hàng được vẽ.
- Người sử dụng: bàn laptop có thể đọc được; thẻ di động hiển thị; hành động được dán nhãn; không tràn trang.
- Yêu cầu: ngày được gắn nhãn, bộ lọc phản hồi, hành động đang chờ xử lý/đầu cuối không thay đổi.
- Quyền: không có bản sao FE11/FE12 và các quyết định được phép/từ chối là khác nhau.
- Kiểm tra: nhãn hành động được bản địa hóa, giá trị thô có sẵn thông qua tiêu đề/văn bản phụ, bộ lọc được gắn nhãn.
- Tiêu điểm bàn phím và hành vi giảm chuyển động.

Không đánh dấu sự chấp nhận của con người là hoàn thành cho đến khi người đánh giá xác nhận rõ ràng.

- [ ] **Bước 3: Viết bản ghi xác nhận**

Ghi lại các lệnh chính xác, số lần đạt/không đạt, cam kết SHA, bằng chứng khung nhìn trình duyệt,
các giới hạn đã biết và sự tách biệt giữa bằng chứng tự động và sự phê duyệt của con người. Không
viết `PASS` cho bất kỳ lệnh nào không được chạy trong quá trình thực thi này.

- [ ] **Bước 4: Đóng hồ sơ nhiệm vụ đã hoàn thành**

Đánh dấu `FE11-UXR01..UXR06` hoàn thành sau khi có bằng chứng. Đánh dấu `FE11-UXR07` chỉ hoàn thành
sau khi có hướng dẫn về Giai đoạn được xác thực và phê duyệt trực quan của con người.

- [ ] **Bước 5: Cam kết triển khai/bộ bằng chứng đã được đánh giá**

```powershell
git add .sdd/specs/feat-user-role-management/TASKS.md .sdd/specs/feat-user-role-management/CHANGELOG.md .sdd/reviews/admin-console-full-refactor-validation-2026-07-22.md
git commit -m "docs: validate admin console frontend refactor"
```

- [ ] **Bước 6: Đẩy nhánh và triển khai Azure môi trường tiền sản xuất**

```powershell
git push origin chore/release-closeout-reconciliation
gh workflow run deploy-staging.yml --ref chore/release-closeout-reconciliation
gh run list --workflow deploy-staging.yml --branch chore/release-closeout-reconciliation --limit 1
```

Sử dụng ID chạy được trả về:

```powershell
$runId = gh run list --workflow deploy-staging.yml --branch chore/release-closeout-reconciliation --limit 1 --json databaseId --jq '.[0].databaseId'
gh run watch $runId --exit-status
gh run view $runId --json status,conclusion,headSha,url,jobs
```

Dự kiến: các công việc triển khai máy chủ, triển khai giao diện người dùng và kiểm thử nhanh đều kết
thúc `success`; `headSha` bằng nhánh được đẩy SHA.

- [ ] **Bước 7: Xác minh tài sản và tình trạng đã triển khai**

```powershell
Invoke-RestMethod -Uri 'https://app-library-api-staging-nhat714.azurewebsites.net/health' | ConvertTo-Json -Compress
```

Dự kiến: JSON chứa `"status":"ok"`.

Mở `https://lemon-wave-04db51100.7.azurestaticapps.net/admin/users` trong trình duyệt đã xác thực,
lặp lại danh sách kiểm tra chấp nhận trên máy tính để bàn/thiết bị di động và ghi lại quy trình làm
việc đã triển khai URL và SHA vào bản ghi xác thực.

- [ ] **Bước 8: Kiểm tra sự khác biệt và sơ đồ công việc cuối cùng**

```powershell
git diff --check
git status --short --branch
git log -5 --oneline
```

Dự kiến: không có thay đổi về sản phẩm/bằng chứng chưa được phân loại, các điểm nhánh tại SHA đã
triển khai và có cam kết xác thực được ghi lại.

---

## Danh sách kiểm tra tự đánh giá kế hoạch

- Thiết kế các phần 1-16 liên quan đến ít nhất một nhiệm vụ ở trên.
- Mọi tác vụ mã sản phẩm đều bắt đầu bằng việc kiểm tra lỗi và ghi lại lý do RED dự kiến.
- `ADMIN_NAVIGATION`, `selectOperationalChartRows`, `getPermissionDecision`, `formatAuditAction` và `formatAuditDetailKey` sử dụng tên nhất quán trong các tác vụ.
- `/admin/users`, phần `users` mặc định, quyền sở hữu thao tác ghi FE07, quyền sở hữu quyền/kiểm tra FE11 và quyền sở hữu số liệu thống kê FE12 vẫn không thay đổi.
- Các tệp chuẩn FE04/FE09 đã được kiểm tra hồi quy nhưng không được sửa đổi.
- Không có sự phụ thuộc thời gian chạy, thay đổi máy chủ, thay đổi lược đồ, URL quản trị riêng biệt hoặc hành vi kinh doanh không được phê duyệt nào được đưa vào.
- bằng chứng giao diện thích ứng tự động và phê duyệt trực quan của con người vẫn tách biệt.
