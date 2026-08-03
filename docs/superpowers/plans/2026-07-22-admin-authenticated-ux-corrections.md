# Kế hoạch thực hiện chỉnh sửa UX được quản trị viên xác thực

> **Đối với nhân viên đại lý:** SUB-SKILL BẮT BUỘC: Sử dụng siêu năng lực:phát triển theo định hướng phụ (được khuyến nghị) hoặc siêu năng lực:thực hiện các kế hoạch để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Xóa mục thanh bên Quyền dư thừa và điều chỉnh phản hồi Quản lý/Kiểm tra người dùng mà
không thay đổi quản lý vai trò, bộ lọc kiểm tra, API, ủy quyền hoặc biên tập.

**Kiến trúc:** Giữ hợp đồng điều hướng Quản trị viên được chia sẻ làm nguồn thanh bên duy nhất. Tái
sử dụng thẻ người dùng hiện có theo chiều rộng của máy tính xách tay và tách biệt các giá trị Kiểm
tra thô khỏi bản trình bày tiếng Việt trong khi hiển thị các chi tiết an toàn ở dạng tiết lộ gốc.
Các bộ điều hợp máy chủ và API vẫn được giữ nguyên.

**Tech bộ công nghệ:** React 19, Vite 8, CSS đơn giản, trình chạy thử Node.js, chấp nhận trình duyệt
Playwright.

## Ràng buộc toàn cầu

- `/admin/users` vẫn là mục trong Bảng điều khiển dành cho quản trị viên và Quản lý người dùng vẫn là phần mặc định.
- Quản lý vai trò vẫn khả dụng ở mọi hàng/thẻ người dùng đủ điều kiện.
- Kiểm tra tiếp tục gửi các giá trị `q`, `action`, `actorId`, `from`, `to`, `page` và `limit` chuẩn.
- Không có điểm cuối máy chủ, DTO, quy tắc ủy quyền, lược đồ, sự phụ thuộc hoặc quy tắc biên tập.
- Bản sao giao diện người dùng là tiếng Việt trong khi các giá trị API chuẩn không thay đổi.

---

### Nhiệm vụ 1: Khóa điều hướng đã sửa và hợp đồng đáp ứng

**Tệp:**
- Sửa đổi: `frontend/test/userManagementFrontend.test.js`
- Sửa đổi: `frontend/test/adminConsoleStructure.test.js`

**Giao diện:**
- Tiêu thụ: hợp đồng nguồn `ADMIN_NAVIGATION`, `.admin-user-table`, `.admin-user-cards`, `AdminAuditSection`.
- Tạo ra: xác nhận không thành công cho bảy mục điều hướng, điểm dừng thẻ `1440px`, bộ lọc Kiểm tra chuẩn, lựa chọn hành động được ánh xạ và tiết lộ chi tiết an toàn.

- [ ] **Bước 1: Viết các kiểm thử điều hướng không thành công và phản hồi**

```js
assert.deepEqual(entries, [
  ['home', 'Trang chủ'],
  ['dashboard', 'Tổng quan'],
  ['library', 'Thư viện'],
  ['circulation', 'Quản lý mượn trả'],
  ['requests', 'Quản lý yêu cầu'],
  ['users', 'Quản lý người dùng'],
  ['audit', 'Nhật ký hoạt động'],
]);
assert.doesNotMatch(navigation, /id: 'permissions'/);
assert.match(css, /@media \(max-width: 1440px\)[^]*?\.admin-user-table \{ display: none; \}[^]*?\.admin-user-cards \{ display: grid;/);
```

- [ ] **Bước 2: Viết kiểm thử trình bày Kiểm toán không thành công**

```js
assert.match(source, /list="admin-audit-action-options"/);
assert.match(source, /<datalist id="admin-audit-action-options">/);
assert.match(source, /<details className="admin-audit-details-disclosure">/);
assert.match(source, /<summary>Xem chi tiết \(\{details\.length\}\)<\/summary>/);
assert.doesNotMatch(source, /placeholder="AUTH_LOGIN_SUCCESS"/);
```

- [ ] **Bước 3: Chạy bộ tập trung và xác minh RED**

Chạy từ `frontend`: `node --test --test-name-pattern="FE11 modular console|FE11 desktop table|FE11 audit|Admin CSS" test/userManagementFrontend.test.js test/adminConsoleStructure.test.js`

Dự kiến: THẤT BẠI vì điều hướng vẫn chứa Quyền, thẻ chỉ chuyển đổi ở 900px và Kiểm tra không có danh
sách hành động cũng như không tiết lộ.

### Nhiệm vụ 2: Áp dụng các chỉnh sửa phản hồi điều hướng và Quản lý người dùng

**Tệp:**
- Sửa đổi: `frontend/src/page/admin/adminNavigation.js`
- Sửa đổi: `frontend/src/page/admin/admin-console.css`
- Kiểm tra: `frontend/test/userManagementFrontend.test.js`
- Kiểm tra: `frontend/test/adminConsoleStructure.test.js`

**Giao diện:**
- Tiêu thụ: `ADMIN_NAVIGATION` được chia sẻ và đánh dấu bảng/thẻ hiện có.
- Tạo ra: bảy mục điều hướng hiển thị và một điểm ngắt thẻ máy tính xách tay an toàn cho nội dung.

- [ ] **Bước 1: Chỉ xóa mục điều hướng Quyền và nhập biểu tượng không sử dụng**

```js
import {
  BookCopy,
  ClipboardList,
  Home,
  LayoutDashboard,
  Library,
  Users,
} from 'lucide-react';

export const ADMIN_NAVIGATION = Object.freeze([
  { id: 'home', icon: Home, label: 'Trang chủ', path: '/home' },
  { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
  { id: 'library', icon: Library, label: 'Thư viện' },
  { id: 'circulation', icon: BookCopy, label: 'Quản lý mượn trả' },
  { id: 'requests', icon: ClipboardList, label: 'Quản lý yêu cầu' },
  { id: 'users', icon: Users, label: 'Quản lý người dùng' },
  { id: 'audit', icon: ClipboardList, label: 'Nhật ký hoạt động' },
]);
```

- [ ] **Bước 2: Chuyển thư mục người dùng sang thẻ trước khi tràn bảng 1040px**

```css
@media (max-width: 1440px) {
  .admin-user-table { display: none; }
  .admin-user-cards { display: grid; gap: 12px; }
}
```

- [ ] **Bước 3: Chạy các kiểm thử điều hướng/phản hồi tập trung và xác minh GREEN**

Chạy từ `frontend`: `node --test --test-name-pattern="FE11 modular console|FE11 desktop table|Admin CSS" test/userManagementFrontend.test.js test/adminConsoleStructure.test.js`

Dự kiến: ĐẠT.

### Nhiệm vụ 3: Chỉnh sửa bộ lọc Kiểm tra và mật độ chi tiết mà không làm mất hành vi

**Tệp:**
- Sửa đổi: `frontend/src/page/admin/audit/adminAuditPresentation.js`
- Sửa đổi: `frontend/src/page/admin/audit/AdminAuditSection.jsx`
- Sửa đổi: `frontend/src/page/admin/admin-console.css`
- Kiểm tra: `frontend/test/adminConsolePresentation.test.js`
- Kiểm tra: `frontend/test/userManagementFrontend.test.js`

**Giao diện:**
- Tiêu thụ: chuỗi hành động chuẩn và các mục nhập `[key, value]` được đưa vào danh sách cho phép do `getAuditDetailEntries` trả về.
- Tạo ra: `getAuditActionOptions(): Array<{ value: string, label: string }>` và các tiết lộ gốc trên mỗi hàng.

- [ ] **Bước 1: Xuất các tùy chọn hành động được ánh xạ ổn định**

```js
export function getAuditActionOptions() {
  return Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label }));
}
```

- [ ] **Bước 2: Thay thế phần giữ chỗ kỹ thuật bằng các đề xuất được gắn nhãn và giữ nguyên dữ liệu đầu vào thô tùy ý**

```jsx
<input
  list="admin-audit-action-options"
  value={auditFilters.action}
  maxLength={100}
  placeholder="Nhập hoặc chọn hành động"
  onChange={(event) => setAuditFilters((current) => ({ ...current, action: event.target.value }))}
/>
<datalist id="admin-audit-action-options">
  {auditActionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
</datalist>
```

- [ ] **Bước 3: Hiển thị thông tin chi tiết an toàn đằng sau tiết lộ gốc**

```jsx
{showAuditDetails ? (
  <td>{details.length === 0 ? '-' : (
    <details className="admin-audit-details-disclosure">
      <summary>Xem chi tiết ({details.length})</summary>
      <dl className="admin-audit-details">
        {details.map(([key, value]) => <div key={key}><dt>{formatAuditDetailKey(key)}</dt><dd>{formatAuditDetailValue(value)}</dd></div>)}
      </dl>
    </details>
  )}</td>
) : null}
```

- [ ] **Bước 4: Cung cấp cho bộ lọc Kiểm tra bố cục hai hàng đáp ứng và tạo kiểu cho thông tin tiết lộ**

```css
.admin-audit-filter-bar .admin-filter-grid {
  grid-template-columns: minmax(260px, 2fr) repeat(2, minmax(170px, 1fr));
}

.admin-audit-details-disclosure summary {
  color: var(--admin-brass-dark);
  font-weight: 800;
  cursor: pointer;
}
```

- [ ] **Bước 5: Chạy các kiểm thử Kiểm tra tập trung và xác minh GREEN**

Chạy từ `frontend`: `node --test --test-name-pattern="audit" test/adminConsolePresentation.test.js test/userManagementFrontend.test.js`

Dự kiến: ĐẠT với các bộ lọc chuẩn, trình chiếu chi tiết an toàn, trình bày tiếng Việt và không có
hồi quy giữ chỗ kỹ thuật.

### Nhiệm vụ 4: Xác nhận việc chỉnh sửa hoàn chỉnh

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- Tạo: `.sdd/reviews/admin-console-authenticated-ux-correction-validation-2026-07-22.md`

**Giao diện:**
- Tiêu thụ: điều hướng đã hoàn thành, Quản lý người dùng và chỉnh sửa Kiểm tra.
- Tạo ra: Bằng chứng xác thực L1-L4 và ứng cử viên đánh giá con người theo giai đoạn Azure tiếp theo.

- [ ] **Bước 1: Chạy xác thực toàn bộ giao diện người dùng**

Chạy: `npm.cmd --prefix frontend test`

Dự kiến: tất cả các kiểm thử giao diện người dùng đều vượt qua.

Chạy: `npm.cmd --prefix frontend run lint`

Dự kiến: mã thoát 0.

Chạy: `npm.cmd --prefix frontend run build`

Dự kiến: xây dựng sản xuất thành công.

- [ ] **Bước 2: Chạy chấp nhận trình duyệt**

Chạy quy trình công việc Playwright của dự án tại `1280x720`, `1366x768`, `1440x900` và `390x844`;
mở Quản lý và kiểm tra người dùng, xác minh không có tràn trang, xác minh thẻ trước khi tràn bảng,
mở một tiết lộ chi tiết an toàn và xác nhận Quản lý vai trò vẫn hiển thị.

Dự kiến: không có tràn trang ngang; bảy mục thanh bên; Các hành động Quản lý người dùng vẫn hiển
thị; Bộ lọc kiểm toán được bọc sạch sẽ; chi tiết an toàn mở rộng theo yêu cầu.

- [ ] **Bước 3: Ghi lại bằng chứng xác thực**

Viết các lệnh chính xác, số lượt vượt qua, kết quả khung nhìn trình duyệt, ánh xạ đặc tả, ranh giới
máy chủ không thay đổi, yêu cầu đánh giá giai đoạn còn lại và cam kết hiện tại SHA với
`.sdd/reviews/admin-console-authenticated-ux-correction-validation-2026-07-22.md`; thêm kết quả giới
hạn tương tự vào nhật ký thay đổi FE11.

- [ ] **Bước 4: Cam kết chỉnh sửa đã được xác thực**

```bash
git add .sdd/specs/feat-user-role-management docs/superpowers frontend/src/page/admin frontend/test .sdd/reviews/admin-console-authenticated-ux-correction-validation-2026-07-22.md
git commit -m "fix: refine authenticated admin console UX"
```
