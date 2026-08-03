# Kế hoạch triển khai bản địa hóa giao diện người dùng tiếng Việt

> **Đối với nhân viên đại lý:** SUB-SKILL BẮT BUỘC: Sử dụng siêu năng lực:phát triển theo định hướng phụ (được khuyến nghị) hoặc siêu năng lực:thực hiện các kế hoạch để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Chuyển đổi tất cả bản sao giao diện do giao diện người dùng tạo sang tiếng Việt và áp
dụng hệ thống kiểu chữ `Be Vietnam Pro` + `Noto Serif` an toàn cho tiếng Việt mà không thay đổi
logic nghiệp vụ hoặc hợp đồng API.

**Kiến trúc:** Thêm một danh mục bản sao nhỏ bằng tiếng Việt và các trình trợ giúp nhãn chỉ dành cho
bản trình bày, sau đó di chuyển từng bề mặt giao diện người dùng để sử dụng các nhãn đã dịch trong
khi vẫn giữ lại mã vai trò/trạng thái thô để lọc và đưa ra quyết định về quy trình làm việc. Bình
thường hóa các dự phòng API ở ranh giới giao diện người dùng để các lỗi máy chủ không xác định vẫn
an toàn và tiếng Việt. Kiểu chữ được kiểm soát thông qua các biến CSS được chia sẻ và Phông chữ
Google với các dự phòng có khả năng Unicode.

**bộ công nghệ công nghệ:** React 19, Vite 8, Bootstrap 5, MUI, Trình chạy kiểm thử nút, thuộc tính
tùy chỉnh CSS, các mô-đun Axios API hiện có.

## Kết thúc triển khai hiện tại - 2026-07-20

PR #58 được hợp nhất thành `cce59d0`. CI `29712597463` cơ sở ứng dụng và quy trình môi trường tiền
sản xuất `29712612188` vượt qua các kiểm thử bản địa hóa giao diện người dùng, tìm lỗi mã nguồn, bản
dựng, trình duyệt E2E và kiểm tra giai đoạn kiểm thử nhanh sáu bước. Bằng chứng L1-L4 có thẩm quyền là
`.sdd/reviews/vietnamese-ui-localization-validation-2026-07-20.md`.

Quá trình đối chiếu quản trị sau này sẽ sửa chữa năm bề mặt nhãn còn sót lại chỉ để trình bày và
tăng cường hồi quy giá trị thô. Phần tiếp theo đáp ứng của nó bổ sung thêm menu di động HomePage,
CTA, hợp đồng bố cục chân trang và thẻ lợi ích; bằng chứng giao diện người dùng địa phương mới là
173/173. Bản đối chiếu đã xuất bản đã được phê duyệt H2, trong khi bản điều chỉnh đáp ứng vẫn tuân
theo H3 trước khi hợp nhất.

Các hộp nhiệm vụ RED-GREEN chi tiết bên dưới được giữ lại làm kế hoạch thực hiện lịch sử. Danh sách
kiểm tra cuối cùng là ảnh chụp nhanh chấp nhận hiện tại; việc đánh giá trình duyệt đáp ứng chuyên
dụng của con người vẫn đang chờ xử lý rõ ràng.

## Ràng buộc toàn cầu

- Ngôn ngữ sản phẩm được cố định bằng tiếng Việt; không thêm trình chuyển đổi ngôn ngữ hoặc khung i18n.
- Giữ nguyên `Email`, `OTP` và `Barcode` trong bản sao hướng tới người dùng.
- Giữ mã định danh nguồn, đường dẫn API, trường tải trọng, giá trị giá trị liệt kê và tên kiểm tra bằng tiếng Anh.
- Không dịch tên sách, tên tác giả, địa chỉ email, giá trị mã vạch hoặc nội dung do người dùng nhập.
- Giữ nguyên các giá trị thô như `AVAILABLE`, `BORROWED`, `PENDING` và mã thông báo trạng thái xem FE07/FE08 nội bộ hiện có cho logic nghiệp vụ.
- Không thay đổi lược đồ cơ sở dữ liệu, hợp đồng API, quyền, ngữ nghĩa xác thực hoặc quy tắc nghiệp vụ của thư viện.
- Sử dụng `Be Vietnam Pro` cho các điều khiển/nội dung văn bản và `Noto Serif` cho các tiêu đề, với các dự phòng có khả năng Unicode.
- Các thông báo máy chủ không xác định hoặc không an toàn phải được giải quyết bằng tiếng Việt theo ngữ cảnh thay vì tiếng Anh kỹ thuật thô.
- Theo dõi RED-GREEN-REFACTOR để biết mọi thay đổi trong quá trình sản xuất và duy trì cam kết trong phạm vi một nhiệm vụ.

---

## Cấu trúc tệp

- Tạo `frontend/src/i18n/vi.js`: dùng chung hằng copy tiếng Việt.
- Tạo `frontend/src/utils/uiLabels.js`: trình trợ giúp thuần túy về vai trò, trạng thái và nhãn hiển thị boolean.
- Tạo `frontend/test/vietnameseUi.test.js`: các kiểm thử đơn vị/nguồn tập trung được bổ sung dần dần theo Nhiệm vụ 1-6.
- Sửa đổi `frontend/src/api/apiErrorMessages.js`: hành vi dự phòng API tiếng Việt an toàn.
- Sửa đổi `frontend/src/api/authApi.js`, `frontend/src/api/profileApi.js`, `frontend/src/api/userManagementApi.js` và `frontend/src/api/adminApi.js`: bản sao dự phòng tiếng Việt dành riêng cho mô-đun.
- Sửa đổi `frontend/index.html`, `frontend/src/index.css` và các kiểu hình ảnh hiện có: siêu dữ liệu ngôn ngữ chung và mã thông báo phông chữ.
- Sửa đổi các trang/thành phần hiện có tại chỗ: chỉ văn bản hướng tới người dùng, ngoại trừ
Theo dõi vỏ phản hồi H3 đã được phê duyệt để truy cập điều hướng HomePage và bố cục màn hình hẹp;
không cơ cấu lại quyền sở hữu chức năng.
- Sửa đổi các tệp `.sdd/specs/feat-*/CHANGELOG.md` bị ảnh hưởng: ghi lại thay đổi trình bày nhiều chức năng.

---

### Nhiệm vụ 1: Thêm bản gốc tiếng Việt và nhãn hiển thị

**Tệp:**
- Tạo: `frontend/src/i18n/vi.js`
- Tạo: `frontend/src/utils/uiLabels.js`
- Tạo: `frontend/test/vietnameseUi.test.js`
- Kiểm tra: `frontend/test/reservationFrontend.test.js`

**Giao diện:**
- Tiêu thụ: chuỗi vai trò/trạng thái thô đã được API và mô hình chế độ xem hiện có trả về.
- Sản xuất: `VI_COPY`, `getRoleLabel(value)`, `getStatusLabel(value)` và `getBooleanLabel(value)` cho các tác vụ sau này.
- Giữ nguyên: các giá trị trả về và so sánh nội bộ của `statusToUi()` và `isActiveReservationQueueStatus()`.

- [ ] **Bước 1: Viết các kiểm thử trợ giúp nhãn không thành công**

Tạo `frontend/test/vietnameseUi.test.js`:

```js
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
```

- [ ] **Bước 2: Chạy kiểm thử mới và xác minh RED**

Chạy từ kho lưu trữ gốc:

```powershell
node --test frontend/test/vietnameseUi.test.js
```

Dự kiến: THẤT BẠI với `ERR_MODULE_NOT_FOUND` dành cho `frontend/src/i18n/vi.js` hoặc
`frontend/src/utils/uiLabels.js`.

- [ ] **Bước 3: Triển khai sao chép danh mục**

Tạo `frontend/src/i18n/vi.js`:

```js
export const VI_COPY = Object.freeze({
  common: Object.freeze({
    home: 'Trang chủ',
    library: 'Thư viện',
    dashboard: 'Tổng quan',
    close: 'Đóng',
    cancel: 'Hủy',
    save: 'Lưu',
    edit: 'Chỉnh sửa',
    create: 'Tạo mới',
    update: 'Cập nhật',
    search: 'Tìm kiếm',
    refresh: 'Làm mới',
    previousPage: 'Trang trước',
    nextPage: 'Trang sau',
    yes: 'Có',
    no: 'Không',
    unknownRole: 'Vai trò chưa xác định',
    unknownStatus: 'Trạng thái chưa xác định',
  }),
  fields: Object.freeze({
    email: 'Email',
    otp: 'OTP',
    barcode: 'Barcode',
  }),
  roles: Object.freeze({
    ADMIN: 'Quản trị viên',
    LIBRARIAN: 'Thủ thư',
    MEMBER: 'Thành viên',
    GUEST: 'Khách',
  }),
  statuses: Object.freeze({
    ALL: 'Tất cả',
    ACTIVE: 'Đang hoạt động',
    INACTIVE: 'Ngừng hoạt động',
    LOCKED: 'Đã khóa',
    AVAILABLE: 'Có sẵn',
    UNAVAILABLE: 'Không có sẵn',
    RESERVED: 'Đã đặt chỗ',
    WAITING: 'Đang chờ',
    READY_TO_PICK_UP: 'Sẵn sàng nhận',
    NOTIFIED: 'Sẵn sàng nhận',
    PENDING: 'Chờ xử lý',
    REQUESTED: 'Đã gửi yêu cầu',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Đã từ chối',
    BORROWED: 'Đang mượn',
    OVERDUE: 'Quá hạn',
    RETURNED: 'Đã trả',
    COMPLETED: 'Hoàn thành',
    FULFILLED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
    EXPIRED: 'Hết hạn',
    DAMAGED: 'Hư hỏng',
    LOST: 'Thất lạc',
    PAID: 'Đã thanh toán',
    UNPAID: 'Chưa thanh toán',
    WAIVED: 'Đã miễn',
  }),
});
```

- [ ] **Bước 4: Triển khai trình trợ giúp nhãn hiển thị thuần túy**

Tạo `frontend/src/utils/uiLabels.js`:

```js
import { VI_COPY } from '../i18n/vi.js';

function normalizeDisplayKey(value) {
  return String(value || '')
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toUpperCase();
}

export function getRoleLabel(value) {
  return VI_COPY.roles[normalizeDisplayKey(value)] || VI_COPY.common.unknownRole;
}

export function getStatusLabel(value) {
  return VI_COPY.statuses[normalizeDisplayKey(value)] || VI_COPY.common.unknownStatus;
}

export function getBooleanLabel(value) {
  return value ? VI_COPY.common.yes : VI_COPY.common.no;
}
```

- [ ] **Bước 5: Chạy kiểm thử hồi quy nhãn và FE08 và xác minh GREEN**

```powershell
node --test frontend/test/vietnameseUi.test.js frontend/test/reservationFrontend.test.js
```

Dự kiến: tất cả các kiểm thử ĐẠT; Các kiểm thử FE08 hiện tại vẫn chứng minh rằng mã thông báo
`Waiting`/`Ready to pick up` nội bộ không thay đổi.

- [ ] **Bước 6: Cam kết nhiệm vụ 1**

```powershell
git add frontend/src/i18n/vi.js frontend/src/utils/uiLabels.js frontend/test/vietnameseUi.test.js
git commit -m "feat: add Vietnamese UI label helpers"
```

---

### Nhiệm vụ 2: Áp dụng Mã thông báo siêu dữ liệu tài liệu tiếng Việt và kiểu chữ

**Tệp:**
- Sửa đổi: `frontend/index.html`
- Sửa đổi: `frontend/src/index.css`
- Sửa đổi: `frontend/src/styles/app-shell.css`
- Sửa đổi: `frontend/src/styles/UserProfile.css`
- Sửa đổi: `frontend/src/page/HomePage.jsx`
- Sửa đổi: `frontend/src/page/BookManagement.jsx`
- Sửa đổi: `frontend/src/page/UserManagement.jsx`
- Sửa đổi: `frontend/src/component/layout/LogoutConfirmModal.jsx`
- Kiểm tra: `frontend/test/vietnameseUi.test.js`

**Giao diện:**
- Tiêu thụ: Biến CSS `--sans` và `--heading` từ `frontend/src/index.css`.
- Tạo ra: kiểu chữ `Be Vietnam Pro` và `Noto Serif` được chia sẻ được sử dụng bởi tất cả các chỉnh sửa trang sau này.

- [ ] **Bước 1: Thêm các kiểm thử nguồn phông chữ/siêu dữ liệu không thành công**

Nối vào `frontend/test/vietnameseUi.test.js`:

```js
import { readFile } from 'node:fs/promises';

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
  assert.doesNotMatch(source, /Playfair Display|Lato, sans-serif|Inter, system-ui|DM Serif Display|Times New Roman/);
});
```

- [ ] **Bước 2: Chạy kiểm tra phông chữ và xác minh RED**

```powershell
node --test frontend/test/vietnameseUi.test.js
```

Dự kiến: THẤT BẠI trên `lang="en"`, tiêu đề cũ, mã thông báo CSS cũ và họ phông chữ được mã hóa cứng.

- [ ] **Bước 3: Cập nhật siêu dữ liệu tài liệu và tải phông chữ**

Thay thế nội dung đầu `frontend/index.html` có liên quan bằng:

```html
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&amp;family=Noto+Serif:wght@500;600;700&amp;display=swap"
      rel="stylesheet"
    />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Quản lý thư viện</title>
  </head>
```

- [ ] **Bước 4: Thay thế mã thông báo phông chữ chung và đảm bảo các điều khiển kế thừa chúng**

Trong `frontend/src/index.css`, sử dụng:

```css
:root {
  --sans: 'Be Vietnam Pro', 'Segoe UI', system-ui, sans-serif;
  --heading: 'Noto Serif', Georgia, serif;
  --mono: ui-monospace, Consolas, monospace;
}

button,
input,
select,
textarea {
  font: inherit;
}
```

Trong `frontend/src/styles/app-shell.css`, sử dụng:

```css
:root {
  --lib-heading: var(--heading);
}

.app-shell {
  font-family: var(--sans);
}
```

- [ ] **Bước 5: Chuẩn hóa khai báo phông chữ cấp trang**

Áp dụng những thay thế chính xác này mà không thay đổi kích thước, trọng lượng hoặc bố cục:

```text
'Playfair Display, serif' -> 'var(--heading)'
'Lato, sans-serif' -> 'var(--sans)'
'Inter', 'Segoe UI', system-ui, sans-serif -> var(--sans)
'DM Serif Display', Georgia, serif -> var(--heading)
Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif -> var(--sans)
Georgia, 'Times New Roman', serif -> var(--heading)
'Times New Roman', 'Noto Serif', serif -> var(--heading)
```

Đối với kiểu nội tuyến JSX, kết quả phải sử dụng các biến CSS làm chuỗi:

```jsx
style={{ fontFamily: 'var(--heading)' }}
style={{ fontFamily: 'var(--sans)' }}
```

- [ ] **Bước 6: Chạy kiểm thử tập trung và xây dựng giao diện người dùng**

```powershell
node --test frontend/test/vietnameseUi.test.js
npm --prefix frontend run build
```

Dự kiến: cả hai lệnh đều thoát `0`; Vite hoàn thành việc xây dựng sản xuất.

- [ ] **Bước 7: Cam kết nhiệm vụ 2**

```powershell
git add frontend/index.html frontend/src/index.css frontend/src/styles/app-shell.css frontend/src/styles/UserProfile.css frontend/src/page/HomePage.jsx frontend/src/page/BookManagement.jsx frontend/src/page/UserManagement.jsx frontend/src/component/layout/LogoutConfirmModal.jsx frontend/test/vietnameseUi.test.js
git commit -m "feat: apply Vietnamese-safe typography"
```

---

### Nhiệm vụ 3: Bản địa hóa các bề mặt vỏ, xác thực và hồ sơ chung

**Tệp:**
- Sửa đổi: `frontend/src/utils/appNavigation.js`
- Sửa đổi: `frontend/src/component/layout/AppLayout.jsx`
- Sửa đổi: `frontend/src/component/layout/Header.jsx`
- Sửa đổi: `frontend/src/component/shared/Feedback.jsx`
- Sửa đổi: `frontend/src/component/forgotpassword/BackgroundPanel.jsx`
- Sửa đổi: `frontend/src/page/HomePage.jsx`
- Kiểm tra: `frontend/test/vietnameseUi.test.js`
- Kiểm tra: `frontend/test/appShellFrontend.test.js`
- Kiểm tra: `frontend/test/authUxFrontend.test.js`

**Giao diện:**
- Tiêu thụ: `VI_COPY`, `getRoleLabel()` từ Nhiệm vụ 1.
- Tạo ra: một lớp bao tiếng Việt và bản sao hộp thoại/khả năng truy cập được chia sẻ được sử dụng lại bởi tất cả các trang được bảo vệ.

- [ ] **Bước 1: Thêm các kiểm thử bề mặt dùng chung không thành công**

Nối vào `frontend/test/vietnameseUi.test.js`:

```js
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
```

Cập nhật kiểm thử lớp bao ứng dụng hiện có để mô tả/kết xuất `Home` để nó mong đợi nhãn hiển thị `Thư
viện` trong khi vẫn giữ nguyên khóa tuyến `library-home` và đường dẫn `/homepage`.

- [ ] **Bước 2: Chạy kiểm thử giao diện người dùng được chia sẻ và xác minh RED**

```powershell
node --test frontend/test/vietnameseUi.test.js frontend/test/appShellFrontend.test.js frontend/test/authUxFrontend.test.js
```

Dự kiến: THẤT BẠI đối với các xác nhận `Home`, `Close` và `Welcome Back`.

- [ ] **Bước 3: Bản địa hóa điều hướng lớp bao mà không thay đổi tuyến**

Trong `frontend/src/utils/appNavigation.js`:

```js
const HOME_ITEM = { key: 'home', label: 'Tổng quan', path: '/home' };
const LIBRARY_HOME_ITEM = { key: 'library-home', label: 'Thư viện', path: '/homepage' };
```

Trong `frontend/src/component/layout/AppLayout.jsx`, giữ lại các phím định tuyến và hành vi điều
hướng, nhưng hiển thị:

```jsx
aria-label="Thư viện"
<span>Thư viện</span>
```

- [ ] **Bước 4: Sử dụng lại nhãn vai trò được chia sẻ**

Thay thế các chức năng nhãn vai trò trùng lặp trong `Header.jsx` và `HomePage.jsx` bằng:

```js
import { getRoleLabel } from '../../utils/uiLabels'; // Header.jsx
import { getRoleLabel } from '../utils/uiLabels'; // HomePage.jsx
```

Chỉ sử dụng `getRoleLabel(storedRoles[0])` sau khi duy trì thứ tự ưu tiên hiện có. Ưu tiên chính xác
vẫn là `ADMIN`, sau đó là `LIBRARIAN`, sau đó là `MEMBER`; triển khai một trang web cuộc gọi nhỏ
như:

```js
const primaryRole = ['ADMIN', 'LIBRARIAN', 'MEMBER'].find((role) => storedRoles.includes(role));
const roleLabel = getRoleLabel(primaryRole);
```

- [ ] **Bước 5: Bản địa hóa bản sao đóng và khôi phục được chia sẻ**

Sử dụng các chuỗi hiển thị chính xác này:

```jsx
aria-label="Đóng"
<h2>Chào mừng trở lại</h2>
<p>Đặt lại mật khẩu để tiếp tục sử dụng tài nguyên thư viện</p>
```

- [ ] **Bước 6: Chạy kiểm thử giao diện người dùng được chia sẻ và xác minh GREEN**

```powershell
node --test frontend/test/vietnameseUi.test.js frontend/test/appShellFrontend.test.js frontend/test/authUxFrontend.test.js
```

Dự kiến: tất cả các kiểm thử ĐẠT.

- [ ] **Bước 7: Giao nhiệm vụ 3**

```powershell
git add frontend/src/utils/appNavigation.js frontend/src/component/layout/AppLayout.jsx frontend/src/component/layout/Header.jsx frontend/src/component/shared/Feedback.jsx frontend/src/component/forgotpassword/BackgroundPanel.jsx frontend/src/page/HomePage.jsx frontend/test/vietnameseUi.test.js frontend/test/appShellFrontend.test.js
git commit -m "feat: localize shared frontend shell"
```

---

### Nhiệm vụ 4: Bản địa hóa quy trình duyệt công khai và quy trình làm việc của thành viên

**Tệp:**
- Sửa đổi: `frontend/src/page/HomePage.jsx`
- Sửa đổi: `frontend/src/utils/libraryFeatureViewModels.js`
- Sửa đổi: `frontend/src/page/borrowing/BorrowingHistoryPage.jsx`
- Sửa đổi: `frontend/src/page/borrowing/MemberBorrowingDetailsPage.jsx`
- Sửa đổi: `frontend/src/page/reservation/MyReservationsPage.jsx`
- Kiểm tra: `frontend/test/vietnameseUi.test.js`
- Kiểm tra: `frontend/test/borrowingFrontend.test.js`
- Kiểm tra: `frontend/test/reservationFrontend.test.js`
- Kiểm tra: `frontend/test/publicBrowseFrontend.test.js`

**Giao diện:**
- Tiêu thụ: `getStatusLabel()` và `getRoleLabel()` từ Nhiệm vụ 1.
- Sản xuất: Chú thích tiếng Việt public/member, huy hiệu trạng thái, nhãn phân trang và nhãn thực thể dự phòng.
- Bảo tồn: Mã thông báo ngữ nghĩa nội bộ bằng tiếng Anh được `canRenew` sử dụng, quy tắc hủy đặt chỗ, lọc hàng đợi và các lớp trạng thái CSS.

- [ ] **Bước 1: Thêm các kiểm thử nguồn public/member không thành công**

Nối vào `frontend/test/vietnameseUi.test.js`:

```js
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
```

- [ ] **Bước 2: Chạy kiểm thử public/member và xác minh RED**

```powershell
node --test frontend/test/vietnameseUi.test.js frontend/test/borrowingFrontend.test.js frontend/test/reservationFrontend.test.js frontend/test/publicBrowseFrontend.test.js
```

Dự kiến: THẤT BẠI trên các khối danh mục tiếng Anh, chú thích, nhãn phân trang, hiển thị trạng thái
và các dự phòng `Copy`/`Member`.

- [ ] **Bước 3: Bản địa hóa các nhãn công khai được tạo**

Trong `HomePage.jsx`, giữ nguyên giá trị danh mục và nội dung cơ sở dữ liệu nhưng sử dụng chip trình
bày tiếng Việt:

```js
const CATEGORY_ICONS = {
  Programming: 'Mã',
  Database: 'CSDL',
  AI: 'AI',
  Novel: 'Tiểu thuyết',
};

const getCategoryIcon = (category) => CATEGORY_ICONS[category] || 'Sách';
```

- [ ] **Bước 4: Bản địa hóa các dự phòng của thực thể được tạo**

Trong `libraryFeatureViewModels.js`, chỉ thay thế bản sao dự phòng được tạo:

```js
item.copy?.title || `Bản sao #${item.copyId}`
request.member?.email || `Thành viên #${request.userId}`
reservation.copy?.title || `Bản sao #${reservation.copyId}`
reservation.member?.email || `Thành viên #${reservation.userId}`
```

Không dịch các tiêu đề `DEMO_BORROW_CATALOG`/authors vì đó là dữ liệu danh mục.

- [ ] **Bước 5: Render nhãn tiếng Việt mà không thay đổi so sánh trạng thái bên trong**

Nhập `getStatusLabel` vào các trang quy trình làm việc của ba thành viên và hiển thị các huy hiệu con đã dịch:

```jsx
<Badge status={row.status}>{getStatusLabel(row.status)}</Badge>
<Badge status={item.status}>{getStatusLabel(item.status)}</Badge>
```

Giữ logic như các biểu thức này tương đương chính xác về mặt ngữ nghĩa:

```js
row.status === 'Borrowed'
row.status === 'Overdue'
item.status === 'Ready to pick up'
['Expired', 'Cancelled'].includes(item.status)
```

- [ ] **Bước 6: Bản địa hóa chú thích và nhãn khả năng phân trang**

Sử dụng các giá trị chính xác sau:

```jsx
caption="Lịch sử mượn sách"
caption="Danh sách đặt chỗ của tôi"
aria-label="Trang trước"
aria-label="Trang sau"
```

- [ ] **Bước 7: Chạy kiểm thử public/member và xác minh GREEN**

```powershell
node --test frontend/test/vietnameseUi.test.js frontend/test/borrowingFrontend.test.js frontend/test/reservationFrontend.test.js frontend/test/publicBrowseFrontend.test.js
```

Dự kiến: tất cả các kiểm thử ĐẠT; Các kiểm thử trạng thái nội bộ của FE08 vẫn mong đợi `Waiting` và
`Ready to pick up`.

- [ ] **Bước 8: Giao nhiệm vụ 4**

```powershell
git add frontend/src/page/HomePage.jsx frontend/src/utils/libraryFeatureViewModels.js frontend/src/page/borrowing/BorrowingHistoryPage.jsx frontend/src/page/borrowing/MemberBorrowingDetailsPage.jsx frontend/src/page/reservation/MyReservationsPage.jsx frontend/test/vietnameseUi.test.js
git commit -m "feat: localize public and member workflows"
```

---

### Nhiệm vụ 5: Bản địa hóa các hoạt động, kiểm kê, khoản phạt và báo cáo của thủ thư

**Tệp:**
- Sửa đổi: `frontend/src/page/BookManagement.jsx`
- Sửa đổi: `frontend/src/component/inventory/BookCopies.jsx`
- Sửa đổi: `frontend/src/component/inventory/InventoryManagement.jsx`
- Sửa đổi: `frontend/src/page/borrowing/ProcessReturnsPage.jsx`
- Sửa đổi: `frontend/src/page/FineManagement.jsx`
- Sửa đổi: `frontend/src/page/report/BorrowingReportPage.jsx`
- Sửa đổi: `frontend/src/page/report/InventoryReportPage.jsx`
- Sửa đổi: `frontend/src/page/report/UserStatisticsPage.jsx`
- Kiểm tra: `frontend/test/vietnameseUi.test.js`
- Kiểm tra: `frontend/test/bookManagementFrontend.test.js`
- Kiểm tra: `frontend/test/inventoryOperationalFrontend.test.js`
- Kiểm tra: `frontend/test/fineOperationalFrontend.test.js`
- Kiểm tra: `frontend/test/reportOperationalFrontend.test.js`

**Giao diện:**
- Tiêu thụ: `getStatusLabel()`, `getRoleLabel()`, `getBooleanLabel()` từ Nhiệm vụ 1.
- Tạo ra: xác thực hoạt động bằng tiếng Việt, chú thích bảng, tiêu đề, nhãn trạng thái và dự phòng được tạo.
- Bảo toàn: đạo cụ trạng thái thô được chuyển tới `Badge` cho âm CSS và tất cả tải trọng thao tác ghi.

- [ ] **Bước 1: Thêm các kiểm thử nguồn thủ thư/report bị lỗi**

Nối vào `frontend/test/vietnameseUi.test.js`:

```js
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
```

- [ ] **Bước 2: Chạy kiểm tra thủ thư/report và xác minh RED**

```powershell
node --test frontend/test/vietnameseUi.test.js frontend/test/bookManagementFrontend.test.js frontend/test/inventoryOperationalFrontend.test.js frontend/test/fineOperationalFrontend.test.js frontend/test/reportOperationalFrontend.test.js
```

Dự kiến: THẤT BẠI đối với các thông báo xác thực bằng tiếng Anh, chú thích, tiêu đề và nhãn báo cáo đã biết.

- [ ] **Bước 3: Dịch bản sao hành động và xác thực Quản lý sách**

Áp dụng ánh xạ chính xác này trong `BookManagement.jsx`:

```text
Book title is required. -> Tên sách là bắt buộc.
Book title must be 255 characters or fewer. -> Tên sách không được vượt quá 255 ký tự.
ISBN must be 20 characters or fewer. -> ISBN không được vượt quá 20 ký tự.
ISBN already exists. -> ISBN đã tồn tại.
Category is required. -> Thể loại là bắt buộc.
Author is required. -> Tác giả là bắt buộc.
Publish year must not be greater than ${currentYear}. -> Năm xuất bản không được lớn hơn ${currentYear}.
Pages must be from 1 to 10000. -> Số trang phải từ 1 đến 10000.
Rating must be between 0 and 5 with at most one decimal place. -> Điểm đánh giá phải từ 0 đến 5 và có tối đa một chữ số thập phân.
Cover URL must start with http(s) or /. -> URL ảnh bìa phải bắt đầu bằng http(s) hoặc /.
Description must be 2000 characters or fewer. -> Mô tả không được vượt quá 2000 ký tự.
Please enter a search keyword. -> Vui lòng nhập từ khóa tìm kiếm.
Search keyword must be 200 characters or fewer. -> Từ khóa tìm kiếm không được vượt quá 200 ký tự.
Please select a book first. -> Vui lòng chọn một cuốn sách trước.
Please fix the highlighted Add Book fields before submitting. -> Vui lòng sửa các trường được đánh dấu trước khi thêm sách.
ISBN already exists. Please use a unique ISBN or leave it blank. -> ISBN đã tồn tại. Vui lòng dùng ISBN khác hoặc để trống.
Please select a book to update. -> Vui lòng chọn sách cần cập nhật.
Please select a book before changing status. -> Vui lòng chọn sách trước khi đổi trạng thái.
Please confirm the status change before submitting. -> Vui lòng xác nhận thay đổi trạng thái trước khi gửi.
Select a book -> Chọn một cuốn sách
No description. -> Chưa có mô tả.
Add Book -> Thêm sách
Save Changes -> Lưu thay đổi
Update Book Information -> Cập nhật thông tin sách
Status -> Trạng thái
```

- [ ] **Bước 4: Bản địa hóa chú thích khoảng không quảng cáo và các dự phòng được tạo**

sử dụng:

```jsx
caption="Danh sách bản sao"
caption="Danh sách bản sao trong kho"
```

Thay thế `Book #${copy.bookId}` được tạo bằng `Sách #${copy.bookId}`. Giữ `Barcode` không thay đổi.

- [ ] **Bước 5: Bản địa hóa kết xuất trạng thái trả sách/khoản phạt**

Giữ đạo cụ trạng thái để tạo kiểu và cung cấp cho trẻ em Việt Nam:

```jsx
<Badge status="Overdue">Quá hạn</Badge>
<Badge status="Available">Đúng hạn</Badge>
<Badge status={fine.status}>{getStatusLabel(fine.status)}</Badge>
```

Thay thế `User #${fine.userId}` bằng `Người dùng #${fine.userId}`.

- [ ] **Bước 6: Bản địa hóa chú thích, tiêu đề, vai trò và trạng thái của báo cáo**

Sử dụng các chú thích và tiêu đề chính xác sau:

```jsx
caption="Chi tiết báo cáo mượn trả"
caption="Danh sách sách sắp hết"
caption="Chi tiết báo cáo tồn kho"
caption="Tổng hợp thống kê người dùng"
caption="Chi tiết thống kê người dùng"
headers={['Mã người dùng', 'Trạng thái', 'Vai trò', 'Hội viên', 'Ngày tạo', 'Ngày duyệt']}
```

Hiển thị các giá trị vai trò và trạng thái thông qua người trợ giúp:

```jsx
<Badge status={row.status}>{getStatusLabel(row.status)}</Badge>
{row.roles?.map(getRoleLabel).join(', ') || '-'}
{row.membershipStatus ? <Badge status={row.membershipStatus}>{getStatusLabel(row.membershipStatus)}</Badge> : '-'}
```

Sử dụng `Từ ngày` và `Đến ngày` để có nhãn ngày báo cáo hiển thị. Chỉ giữ các khóa nguồn dữ liệu kỹ
thuật như `membershipByStatus` nếu chúng là mã định danh chẩn đoán bắt buộc; nếu không thì thay thế
nhãn nguồn hiển thị bằng `Theo trạng thái hội viên`.

- [ ] **Bước 7: Chạy kiểm tra thủ thư/report và xác minh GREEN**

```powershell
node --test frontend/test/vietnameseUi.test.js frontend/test/bookManagementFrontend.test.js frontend/test/inventoryOperationalFrontend.test.js frontend/test/fineOperationalFrontend.test.js frontend/test/reportOperationalFrontend.test.js
```

Dự kiến: tất cả các kiểm thử ĐẠT.

- [ ] **Bước 8: Giao nhiệm vụ 5**

```powershell
git add frontend/src/page/BookManagement.jsx frontend/src/component/inventory/BookCopies.jsx frontend/src/component/inventory/InventoryManagement.jsx frontend/src/page/borrowing/ProcessReturnsPage.jsx frontend/src/page/FineManagement.jsx frontend/src/page/report/BorrowingReportPage.jsx frontend/src/page/report/InventoryReportPage.jsx frontend/src/page/report/UserStatisticsPage.jsx frontend/test/vietnameseUi.test.js
git commit -m "feat: localize librarian operations and reports"
```

---

### Nhiệm vụ 6: Bản địa hóa Bảng điều khiển dành cho quản trị viên và Dự phòng lỗi API an toàn

**Tệp:**
- Sửa đổi: `frontend/src/api/apiErrorMessages.js`
- Sửa đổi: `frontend/src/api/authApi.js`
- Sửa đổi: `frontend/src/api/profileApi.js`
- Sửa đổi: `frontend/src/api/userManagementApi.js`
- Sửa đổi: `frontend/src/api/adminApi.js`
- Sửa đổi: `frontend/src/page/UserManagement.jsx`
- Kiểm tra: `frontend/test/apiErrorMessages.test.js`
- Kiểm tra: `frontend/test/userManagementApi.test.js`
- Kiểm tra: `frontend/test/userManagementFrontend.test.js`
- Kiểm tra: `frontend/test/vietnameseUi.test.js`

**Giao diện:**
- Sử dụng: vai trò/trạng thái/người trợ giúp nhãn boolean từ Nhiệm vụ 1.
- Tạo: Bản sao quản trị tiếng Việt và thông báo lỗi tiếng Việt theo ngữ cảnh cho mọi mô-đun API giao diện người dùng.
- Bảo tồn: mã lỗi trong hành vi `error.cause`, HTTP, làm mới mã thông báo, thứ tự thao tác ghi vai trò và mã định danh kiểm tra thô.

- [ ] **Bước 1: Thay đổi kiểm thử API để yêu cầu dự phòng an toàn cho người Việt**

Cập nhật kỳ vọng của `frontend/test/apiErrorMessages.test.js`:

```js
assert.equal(
  getBorrowingErrorMessage({ response: { status: 422, data: { error: { details: [{ message: 'copyIds must be an array.' }] } } } }, 'Không thể gửi yêu cầu mượn.'),
  'Không thể gửi yêu cầu mượn.',
);
assert.equal(
  getBorrowingErrorMessage({ response: { status: 500, data: { error: { message: 'Backend error' } } } }, 'Không thể tải dữ liệu mượn sách.'),
  'Không thể tải dữ liệu mượn sách.',
);
assert.equal(
  getLibraryFeatureErrorMessage({ response: { status: 404, data: { error: { code: 'COPY_NOT_FOUND', message: 'Book copy was not found.' } } } }),
  'Không thể tải dữ liệu từ backend.',
);
assert.equal(
  getReportErrorMessage({ response: { status: 500, data: { error: { message: 'Backend error' } } } }, 'Không thể tải báo cáo.'),
  'Không thể tải báo cáo.',
);
assert.equal(
  getReservationErrorMessage({ response: { status: 409, data: { error: { code: 'UNKNOWN_RESERVATION_ERROR', message: 'Backend reservation message.' } } } }, 'Không thể xử lý đặt chỗ.'),
  'Không thể xử lý đặt chỗ.',
);
```

Cập nhật các phần cố định thông báo FE07/FE08 đã biết để sử dụng `thành viên`, `thủ thư hoặc quản
trị viên` và `đơn hội viên` thay vì `Member`, `admin` hoặc `Membership` hiển thị.

Thêm các xác nhận nguồn vào `vietnameseUi.test.js` để dự phòng `adminApi` có dấu và không có `Could
not`, `Please login`, `Request failed` và `Admin login required` trong chuỗi trang API/giao diện
người dùng.

- [ ] **Bước 2: Chạy kiểm thử API/admin và xác minh RED**

```powershell
node --test frontend/test/apiErrorMessages.test.js frontend/test/userManagementApi.test.js frontend/test/userManagementFrontend.test.js frontend/test/vietnameseUi.test.js
```

Dự kiến: THẤT BẠI vì bản sao tiếng Anh máy chủ thô và bản quản trị tiếng Anh vẫn được trả về/kết xuất.

- [ ] **Bước 3: Tạo chức năng cho trình phân giải API sử dụng các phương án dự phòng theo ngữ cảnh an toàn**

Trong `apiErrorMessages.js`, giữ lại các nhánh mạng, 401, 403 và mã đã biết. Thay thế thông báo
thô/trả về chi tiết cuối cùng bằng dự phòng được cung cấp:

```js
return fallback;
```

Áp dụng điều này cho những người giải quyết chung, mượn, đặt chỗ, đặt chỗ, kiểm kê, tư cách thành
viên và báo cáo. Không để lộ `error.response.data.error.message` hoặc `details[].message` trừ khi
bản đồ mã địa phương tiếng Việt sở hữu rõ ràng thông báo đó.

- [ ] **Bước 4: Bản địa hóa các dự phòng xác thực, hồ sơ, quản lý người dùng và quản trị viên API**

Sử dụng các dự phòng theo ngữ cảnh và trả về chúng thay vì các tin nhắn máy chủ thô. Các chuỗi hiển
thị bắt buộc bao gồm:

```text
Request failed. Please try again. -> Yêu cầu thất bại. Vui lòng thử lại.
Please login with an Admin account before doing this action. -> Vui lòng đăng nhập bằng tài khoản quản trị viên để thực hiện thao tác này.
Your account does not have Admin permission for this action. -> Tài khoản của bạn không có quyền quản trị viên cho thao tác này.
Could not load users. -> Không thể tải danh sách người dùng.
Could not load user details. -> Không thể tải chi tiết người dùng.
Could not load roles. -> Không thể tải danh sách vai trò.
Could not create user. -> Không thể tạo người dùng.
Could not update user. -> Không thể cập nhật người dùng.
Could not deactivate user. -> Không thể vô hiệu hóa người dùng.
Could not assign role. -> Không thể gán vai trò.
Could not revoke role. -> Không thể gỡ vai trò.
Could not load profile. -> Không thể tải hồ sơ cá nhân.
Could not update profile. -> Không thể cập nhật hồ sơ cá nhân.
Could not upload avatar. -> Không thể tải ảnh đại diện lên.
```

Đối với `authApi.js`, `profileApi.js` và `userManagementApi.js`, hãy bảo toàn mạng/401/403 và các
nhánh mã đã biết, sau đó kết thúc trình phân giải bằng dự phòng do người gọi sở hữu:

```js
return fallback;
```

Không trả sách `apiError.message` hoặc ghép `details[].message`; lỗi Axios ban đầu vẫn có sẵn thông
qua `Error.cause` để xử lý theo chương trình.

Thay thế các dự phòng `adminApi.js` không có dấu bằng:

```js
'Không thể tải tổng quan quản trị.'
'Không thể tải kho sách.'
'Không thể tải dữ liệu thư viện.'
'Không thể thêm dữ liệu.'
'Không thể cập nhật dữ liệu.'
'Không thể vô hiệu hóa dữ liệu.'
'Không thể tải dữ liệu mượn trả.'
'Không thể tải danh sách yêu cầu.'
'Không thể tải chi tiết yêu cầu.'
'Không thể tải ma trận phân quyền.'
'Không thể tải nhật ký hoạt động.'
```

- [ ] **Bước 5: Bản địa hóa vai trò, trạng thái, ngày tháng, hành động và phản hồi của quản trị viên**

Trong `UserManagement.jsx`:

```js
import { getBooleanLabel, getRoleLabel, getStatusLabel } from '../utils/uiLabels';
```

Thay thế bản đồ nhãn tiếng Anh địa phương bằng lệnh gọi trợ giúp và định dạng ngày bằng:

```js
return new Date(value).toLocaleDateString('vi-VN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});
```

Áp dụng ánh xạ bản sao hiển thị chính xác này:

```text
Every user must keep at least one role. -> Mỗi người dùng phải giữ ít nhất một vai trò.
Close -> Đóng
Update -> Cập nhật
Create -> Tạo mới
Dashboard -> Tổng quan
You need to login with an Admin account to create, update, or manage users. -> Bạn cần đăng nhập bằng tài khoản quản trị viên để tạo, cập nhật hoặc quản lý người dùng.
Library data saved. -> Dữ liệu thư viện đã được lưu.
Payment confirmed and fine marked as paid. -> Đã xác nhận thanh toán và đánh dấu khoản phạt là đã thanh toán.
Payment refused. Fine is returned to unpaid follow-up. -> Đã từ chối thanh toán; khoản phạt được chuyển về trạng thái chưa thanh toán.
Admin login required. -> Cần đăng nhập bằng tài khoản quản trị viên.
Search library data... -> Tìm dữ liệu thư viện...
Fine -> Tiền phạt
Member -> Thành viên
Book -> Sách
Amount -> Số tiền
Collected by -> Người thu
Method -> Phương thức
Actions -> Thao tác
Borrow detail # -> Chi tiết mượn #
Status Report -> Báo cáo trạng thái
Role Distribution -> Phân bố vai trò
Close details -> Đóng chi tiết
No name -> Chưa có tên
Active borrowings -> Lượt mượn đang hoạt động
Unpaid fines -> Tiền phạt chưa thanh toán
Actor ID -> Mã tác nhân
Yes -> Có
Edit -> Chỉnh sửa
```

Giữ nguyên các mã hành động kiểm tra như `AUTH_LOGIN_SUCCESS` vì chúng là mã định danh kỹ thuật.

- [ ] **Bước 6: Chạy kiểm thử API/admin và xác minh GREEN**

```powershell
node --test frontend/test/apiErrorMessages.test.js frontend/test/userManagementApi.test.js frontend/test/userManagementFrontend.test.js frontend/test/vietnameseUi.test.js
```

Dự kiến: tất cả các kiểm thử ĐẠT.

- [ ] **Bước 7: Giao nhiệm vụ 6**

```powershell
git add frontend/src/api/apiErrorMessages.js frontend/src/api/authApi.js frontend/src/api/profileApi.js frontend/src/api/userManagementApi.js frontend/src/api/adminApi.js frontend/src/page/UserManagement.jsx frontend/test/apiErrorMessages.test.js frontend/test/userManagementApi.test.js frontend/test/userManagementFrontend.test.js frontend/test/vietnameseUi.test.js
git commit -m "feat: localize admin and API feedback"
```

---

### Nhiệm vụ 7: Thêm kiểm tra bản địa hóa, cập nhật khả năng truy vết và chạy xác minh đầy đủ

**Tệp:**
- Sửa đổi: `frontend/test/vietnameseUi.test.js`
- Sửa đổi: `.sdd/specs/feat-public-browse/CHANGELOG.md`
- Sửa đổi: `.sdd/specs/feat-auth/CHANGELOG.md`
- Sửa đổi: `.sdd/specs/feat-user-profile/CHANGELOG.md`
- Sửa đổi: `.sdd/specs/feat-membership-management/CHANGELOG.md`
- Sửa đổi: `.sdd/specs/feat-book-management/CHANGELOG.md`
- Sửa đổi: `.sdd/specs/feat-inventory-book-copy/CHANGELOG.md`
- Sửa đổi: `.sdd/specs/feat-borrowing-management/CHANGELOG.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/CHANGELOG.md`
- Sửa đổi: `.sdd/specs/feat-fine-management/CHANGELOG.md`
- Sửa đổi: `.sdd/specs/feat-notification-management/CHANGELOG.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- Sửa đổi: `.sdd/specs/feat-reporting-statistics/CHANGELOG.md`
- Kiểm tra: tất cả `frontend/test/*.test.js`

**Giao diện:**
- Tiêu thụ: tất cả các trang và trợ giúp đã bản địa hóa từ Nhiệm vụ 1-6.
- Tạo ra: một biện pháp bảo vệ hồi quy chống lại việc giới thiệu lại các chuỗi giao diện tiếng Anh đã được kiểm tra và các bản ghi truy vết cho các chức năng bị ảnh hưởng.

- [ ] **Bước 1: Thêm kiểm thử kiểm tra cuối cùng không thành công trước lần vượt qua lần dọn dẹp cuối cùng**

Nối cấu trúc này vào `frontend/test/vietnameseUi.test.js`:

```js
const forbiddenCopyByFile = new Map([
  ['../src/component/forgotpassword/BackgroundPanel.jsx', [/Welcome Back/, /Reset your password/]],
  ['../src/component/layout/AppLayout.jsx', [/aria-label="Home"/, />Home</]],
  ['../src/component/shared/Feedback.jsx', [/aria-label="Close"/]],
  ['../src/page/BookManagement.jsx', [/Book title is required/, /Add Book/, /Save Changes/, /Select a book/, /No description/]],
  ['../src/page/borrowing/BorrowingHistoryPage.jsx', [/Borrowing history table/, /Previous page/, /Next page/]],
  ['../src/page/reservation/MyReservationsPage.jsx', [/My reservations table/]],
  ['../src/component/inventory/BookCopies.jsx', [/Book copies table/]],
  ['../src/component/inventory/InventoryManagement.jsx', [/Inventory copies table/]],
  ['../src/page/report/BorrowingReportPage.jsx', [/Borrowing report detail rows/, /From date/, /To date/]],
  ['../src/page/report/InventoryReportPage.jsx', [/Low inventory books table/, /Inventory report detail rows/, /Book ID/]],
  ['../src/page/report/UserStatisticsPage.jsx', [/User statistics summary table/, /User statistics detail rows/, /User ID/, /Membership/]],
  ['../src/page/UserManagement.jsx', [/Every user must keep at least one role/, /Status Report/, /Role Distribution/, /Close details/, /No name/, /Active borrowings/, /Unpaid fines/, /Search library data/]],
  ['../src/api/userManagementApi.js', [/Request failed\. Please try again/, /Could not /, /Please login with an Admin account/]],
  ['../src/api/profileApi.js', [/Could not load profile/, /Could not update profile/, /Could not upload avatar/]],
]);

test('audited frontend surfaces do not contain known English interface copy', async () => {
  for (const [file, patterns] of forbiddenCopyByFile) {
    const source = await readFile(new URL(file, import.meta.url), 'utf8');
    for (const pattern of patterns) {
      assert.doesNotMatch(source, pattern, `${file}: ${pattern}`);
    }
  }
});
```

Chạy nó trước khi dọn dẹp để xác nhận mọi cụm từ được kiểm tra còn lại gây ra RED.

- [ ] **Bước 2: Chạy kiểm thử kiểm tra và xóa mọi sự cố xảy ra với người dùng được báo cáo**

```powershell
node --test frontend/test/vietnameseUi.test.js
```

Dự kiến trước khi dọn dẹp: THẤT BẠI nếu vẫn còn bất kỳ cụm từ giao diện đã biết nào. Chỉ thay thế
bản sao hiển thị; không đổi tên các thành phần, biến, nội dung nhập, trường API, hằng số giá trị liệt kê thô
hoặc mã kiểm tra kỹ thuật.

- [ ] **Bước 3: Cập nhật nhật ký thay đổi chức năng**

Thêm mục nhập ngày chính xác này vào nhật ký thay đổi FE01-FE09, FE11 và FE12:

```markdown
## 2026-07-20 - Bản địa hóa giao diện tiếng Việt và kiểu chữ

- Đã bản địa hóa nhãn, trạng thái, tên hỗ trợ tiếp cận và phản hồi lỗi an toàn do giao diện tạo cho chức năng này.
- Bảo toàn hợp đồng API, giá trị liệt kê thô, quyền, quy tắc nghiệp vụ và dữ liệu danh mục/hồ sơ do người dùng sở hữu.
- Áp dụng hợp đồng kiểu chữ dùng chung: `Be Vietnam Pro` cho nội dung và `Noto Serif` cho tiêu đề, kèm phông dự phòng hỗ trợ Unicode.
```

Thêm mục FE10 chính xác này:

```markdown
## 2026-07-20 - Bản địa hóa giao diện tiếng Việt và kiểu chữ

- Đã bản địa hóa nhãn giao diện dùng chung, tên hỗ trợ tiếp cận và phản hồi lỗi an toàn trên các bề mặt liên quan đến thông báo.
- Bảo toàn dữ liệu mẫu thông báo, hành vi gửi, hợp đồng API, giá trị liệt kê thô, quyền và quy tắc nghiệp vụ.
- Áp dụng hợp đồng kiểu chữ dùng chung: `Be Vietnam Pro` cho nội dung và `Noto Serif` cho tiêu đề, kèm phông dự phòng hỗ trợ Unicode.
```

- [ ] **Bước 4: Chạy bộ kiểm thử giao diện người dùng hoàn chỉnh**

```powershell
npm --prefix frontend test
```

Dự kiến: thoát `0`, tất cả các kiểm thử giao diện người dùng ĐẠT, không có lỗi nào.

- [ ] **Bước 5: Chạy công cụ tìm lỗi mã nguồn và bản dựng sản xuất**

```powershell
npm --prefix frontend run lint
npm --prefix frontend run build
```

Dự kiến: cả hai lệnh đều thoát `0`; ESLint báo cáo không có lỗi và Vite tạo ra `frontend/dist`.

- [ ] **Bước 6: Chạy kiểm tra cấp kho lưu trữ**

```powershell
npm run trace:enforce
git diff --check
```

Dự kiến: vượt qua quá trình thực thi truy vết và `git diff --check` không in ra lỗi khoảng trắng.

- [ ] **Bước 7: Thực hiện xác minh trình duyệt đáp ứng**

Bắt đầu giao diện người dùng:

```powershell
npm --prefix frontend run dev -- --host 127.0.0.1
```

Xác minh ở độ rộng 1440px và 390px:

```text
/login       - tiêu đề, trường nhập, điều khiển mật khẩu và dấu tiếng Việt hiển thị chính xác.
/homepage    - điều hướng công khai, tìm kiếm, thẻ sách, bảng chi tiết và chân trang không chứa nội dung tiếng Anh được tạo tự động.
/home        - shared shell navigation shows “Thư viện” and “Tổng quan”; menus remain reachable.
/admin/users - tiêu đề quản trị, bộ lọc, bảng, hộp thoại, trạng thái và thông báo lỗi đều bằng tiếng Việt.
```

Dự kiến: không thiếu hộp glyph, dấu kết hợp tách rời, chồng chéo văn bản, hành động chính bị cắt bớt
hoặc tràn trang ngang. `Email`, `OTP` và `Barcode` không thay đổi; tựa sách/authors vẫn là dữ liệu
nguồn.

Bằng chứng tập trung tự động: Đánh giá Playwright 1/1 ở 1440px và 390px đã vượt qua đăng nhập,
menu/chân trang/CTA trên thiết bị di động công cộng và kiểm tra mượn được bảo vệ; hình ảnh dưới
`output/playwright/h3-visual/`. Quá trình chạy được ghi lại `GET /api/books` `INTERNAL_ERROR`, vì
vậy nội dung chi tiết/thẻ sách công khai vẫn cần sự chấp nhận của con người hoặc môi trường.

- [ ] **Bước 8: Xem xét sự khác biệt cuối cùng so với thiết kế**

```powershell
git status --short
git diff --stat
git diff -- frontend docs/superpowers/specs/2026-07-20-vietnamese-ui-localization-design.md .sdd/specs
```

Dự kiến: chỉ có nội địa hóa, kiểu chữ, bản trình bày phản hồi, kiểm tra và các tệp quản trị/thay đổi
liên quan được thay đổi; không có phần máy chủ, cơ sở dữ liệu, hợp đồng API hoặc tệp quyền nào được
sửa đổi.

- [ ] **Bước 9: Giao nhiệm vụ 7**

```powershell
git add frontend/test/vietnameseUi.test.js .sdd/specs/feat-public-browse/CHANGELOG.md .sdd/specs/feat-auth/CHANGELOG.md .sdd/specs/feat-user-profile/CHANGELOG.md .sdd/specs/feat-membership-management/CHANGELOG.md .sdd/specs/feat-book-management/CHANGELOG.md .sdd/specs/feat-inventory-book-copy/CHANGELOG.md .sdd/specs/feat-borrowing-management/CHANGELOG.md .sdd/specs/feat-reservation-management/CHANGELOG.md .sdd/specs/feat-fine-management/CHANGELOG.md .sdd/specs/feat-notification-management/CHANGELOG.md .sdd/specs/feat-user-role-management/CHANGELOG.md .sdd/specs/feat-reporting-statistics/CHANGELOG.md
git commit -m "docs: record Vietnamese UI localization"
```

---

## Danh sách kiểm tra xác minh cuối cùng

- [x] Tất cả văn bản giao diện do giao diện người dùng tạo ra đều là tiếng Việt ngoại trừ các thuật ngữ kỹ thuật và mã định danh kỹ thuật đã được phê duyệt.
- [x] Tiêu đề sách, tên tác giả, địa chỉ email, giá trị mã vạch và nội dung do người dùng nhập không thay đổi.
- [x] Các giá trị vai trò/trạng thái/API thô không thay đổi về mặt logic và yêu cầu.
- [x] Lỗi API đã biết là tiếng Việt và các lỗi không xác định sử dụng dự phòng tiếng Việt.
- [x] `lang="vi"`, tiêu đề trang, `Be Vietnam Pro` và `Noto Serif` được nối dây chính xác.
- [ ] Kiểm tra trên máy tính để bàn và thiết bị di động cho thấy kết xuất hình tượng tiếng Việt chính xác và không bị tràn.
- [x] `npm --prefix frontend test`, kiểm tra mã, bản dựng, khả năng truy vết và `git diff --check` đều đạt.
