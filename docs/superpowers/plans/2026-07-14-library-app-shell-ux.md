# Kế hoạch triển khai UX lớp bao của ứng dụng thư viện

> **Đối với nhân viên đại lý:** SUB-SKILL BẮT BUỘC: Sử dụng siêu năng lực:phát triển theo định hướng phụ (được khuyến nghị) hoặc siêu năng lực:thực hiện các kế hoạch để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Cung cấp một vỏ ứng dụng tiếng Việt, nhận biết vai trò với điều hướng bắt nguồn từ
tuyến đường, ngăn kéo di động thực sự, tiêu đề hồ sơ chức năng và bảng điều khiển `/home` nhận biết
vai trò.

**Kiến trúc:** Lưu giữ các quyết định về điều hướng và đối tượng trong các tiện ích thuần túy có thể
được kiểm thử bằng trình chạy kiểm thử tích hợp của Node. `AppLayout` sở hữu lớp vỏ phản hồi và tạo
thành `Header`; trình bao bọc tuyến đường mới chọn ngôi nhà công cộng hiện có hoặc bảng điều khiển
vai trò được bảo vệ mà không thay đổi hợp đồng máy chủ.

**Tech bộ công nghệ:** React 19, React Router 7, lucide-react, MUI Avatar/Thành phần Menu đã được cài đặt,
CSS trong `frontend/src/styles/app-shell.css`, trình chạy thử Node.

## Ràng buộc toàn cầu

- Theo dõi `docs/superpowers/specs/2026-07-14-library-ux-system-design.md`.
- Giữ nguyên các hợp đồng Node.js + Express.js, React + Bootstrap/MUI, SQL Server và REST.
- Không thêm phụ thuộc.
- Không thay đổi ủy quyền máy chủ hoặc quy tắc nghiệp vụ.
- Loại bỏ tìm kiếm tiêu đề toàn cầu không có chức năng; giữ tìm kiếm cục bộ cho các trang sở hữu.
- `/home` là trình duyệt công khai dành cho khách và là bảng điều khiển nhận biết vai trò dành cho người dùng được xác thực.
- Nhãn trang được bảo vệ là tiếng Việt; mã định danh nguồn và tên kiểm thử vẫn là tiếng Anh.
- Giữ mã thông báo, OTP, mật khẩu, cài đặt SMTP và dữ liệu cá nhân ra khỏi nguồn và các kiểm thử.
- Sử dụng TDD cho mỗi thay đổi hành vi và cam kết sau mỗi nhiệm vụ có thể xem xét độc lập.

---

## Cấu trúc tệp

- Tạo `frontend/src/utils/appNavigation.js`: các quyết định thuần túy về vai trò, lộ trình và bảng điều khiển-đối tượng.
- Tạo `frontend/test/appShellFrontend.test.js`: kiểm tra hồi quy cấp hợp đồng và cấp nguồn.
- Sửa đổi `frontend/src/component/layout/AppLayout.jsx`: ngăn đáp ứng, tuyến hoạt động, thành phần tiêu đề được chia sẻ.
- Sửa đổi `frontend/src/component/layout/Header.jsx`: trình kích hoạt menu di động và tiêu đề chỉ dành cho hồ sơ; loại bỏ tìm kiếm toàn cầu.
- Xóa `frontend/src/component/layout/Sidebar.jsx`: triển khai bố cục cũ không được sử dụng.
- Tạo `frontend/src/page/dashboard/HomeRoutePage.jsx`: lựa chọn tuyến đường guest/authenticated.
- Tạo `frontend/src/page/dashboard/RoleDashboardPage.jsx`: bề mặt bảng thông tin thành viên/nhân viên.
- Tạo `frontend/src/page/dashboard/dashboardViewModel.js`: ánh xạ tóm tắt phản hồi API thuần túy.
- Sửa đổi `frontend/src/App.jsx`: định tuyến `/home` qua `HomeRoutePage`.
- Sửa đổi `frontend/src/styles/app-shell.css`: ngăn kéo, phông nền, tiêu đề, bảng điều khiển và hành vi của thiết bị di động.

---

### Nhiệm vụ 1: Hợp đồng điều hướng và bảng điều khiển

**Tệp:**
- Tạo: `frontend/src/utils/appNavigation.js`
- Tạo: `frontend/test/appShellFrontend.test.js`

**Giao diện:**
- Sản xuất: `APP_NAV_GROUPS`, `getVisibleNavigation(roles)`, `getActiveNavigationKey(pathname)`, `getDashboardAudience(roles)`.
- Tiêu thụ: tên vai trò `MEMBER`, `LIBRARIAN` và `ADMIN` đã được lưu trữ trong `authUser.roles`.

- [ ] **Bước 1: Viết các kiểm thử hợp đồng thất bại**

Tạo `frontend/test/appShellFrontend.test.js`:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  getActiveNavigationKey,
  getDashboardAudience,
  getVisibleNavigation,
} from '../src/utils/appNavigation.js';

test('navigation visibility follows stored roles', () => {
  assert.deepEqual(
    getVisibleNavigation(['MEMBER']).map((item) => item.key),
    ['home', 'borrow-request', 'borrowing-history', 'my-reservations'],
  );
  assert.deepEqual(
    getVisibleNavigation(['LIBRARIAN']).map((item) => item.key),
    ['home', 'borrow-requests-admin', 'process-returns', 'reservations-librarian', 'member-details', 'borrowing-report', 'inventory-report', 'user-statistics'],
  );
});

test('active navigation is derived from the current URL', () => {
  assert.equal(getActiveNavigationKey('/home'), 'home');
  assert.equal(getActiveNavigationKey('/borrowing/history'), 'borrowing-history');
  assert.equal(getActiveNavigationKey('/reports/inventory'), 'inventory-report');
  assert.equal(getActiveNavigationKey('/unknown'), null);
});

test('dashboard audience is role aware', () => {
  assert.equal(getDashboardAudience([]), 'guest');
  assert.equal(getDashboardAudience(['MEMBER']), 'member');
  assert.equal(getDashboardAudience(['LIBRARIAN']), 'staff');
  assert.equal(getDashboardAudience(['ADMIN']), 'staff');
});

test('shared header has no decorative global search', async () => {
  const source = await readFile(new URL('../src/component/layout/Header.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /placeholder="Search books, members, loans/);
  assert.doesNotMatch(source, /className="app-search"/);
});
```

- [ ] **Bước 2: Chạy kiểm thử để xác minh RED**

Chạy:

```powershell
cd frontend
npm test -- --test-name-pattern="navigation|dashboard audience|decorative global search"
```

Dự kiến: THẤT BẠI vì `src/utils/appNavigation.js` không tồn tại và tìm kiếm cũ vẫn tồn tại.

- [ ] **Bước 3: Thực hiện hợp đồng điều hướng thuần túy**

Tạo `frontend/src/utils/appNavigation.js`:

```js
export const APP_NAV_GROUPS = [
  {
    label: 'Thành viên',
    roles: ['MEMBER'],
    items: [
      { key: 'borrow-request', label: 'Mượn sách', path: '/borrowing/new' },
      { key: 'borrowing-history', label: 'Lịch sử mượn', path: '/borrowing/history' },
      { key: 'my-reservations', label: 'Đặt chỗ của tôi', path: '/reservations/mine' },
    ],
  },
  {
    label: 'Thủ thư',
    roles: ['LIBRARIAN', 'ADMIN'],
    items: [
      { key: 'borrow-requests-admin', label: 'Yêu cầu mượn', path: '/librarian/borrow-requests' },
      { key: 'process-returns', label: 'Xử lý trả sách', path: '/librarian/returns' },
      { key: 'reservations-librarian', label: 'Quản lý đặt chỗ', path: '/librarian/reservations' },
      { key: 'member-details', label: 'Chi tiết thành viên', path: '/librarian/members' },
    ],
  },
  {
    label: 'Báo cáo',
    roles: ['LIBRARIAN', 'ADMIN'],
    items: [
      { key: 'borrowing-report', label: 'Báo cáo mượn sách', path: '/reports/borrowing' },
      { key: 'inventory-report', label: 'Báo cáo tồn kho', path: '/reports/inventory' },
      { key: 'user-statistics', label: 'Thống kê người dùng', path: '/reports/users' },
    ],
  },
];

const HOME_ITEM = { key: 'home', label: 'Tổng quan', path: '/home' };

export function getVisibleNavigation(roles = []) {
  const items = APP_NAV_GROUPS
    .filter((group) => group.roles.some((role) => roles.includes(role)))
    .flatMap((group) => group.items);
  return [HOME_ITEM, ...items];
}

export function getActiveNavigationKey(pathname) {
  return [HOME_ITEM, ...APP_NAV_GROUPS.flatMap((group) => group.items)]
    .find((item) => item.path === pathname)?.key || null;
}

export function getDashboardAudience(roles = []) {
  if (roles.includes('ADMIN') || roles.includes('LIBRARIAN')) return 'staff';
  if (roles.includes('MEMBER')) return 'member';
  return 'guest';
}
```

- [ ] **Bước 4: Chạy kiểm thử hợp đồng thuần túy**

Chạy:

```powershell
cd frontend
node --test --test-name-pattern="navigation visibility|active navigation|dashboard audience" test/appShellFrontend.test.js
```

Dự kiến: 3 bài thi ĐẠT; kiểm tra tìm kiếm tiêu đề vẫn THẤT BẠI cho đến Nhiệm vụ 2.

- [ ] **Bước 5: Cam kết nhiệm vụ 1**

```powershell
git add frontend/src/utils/appNavigation.js frontend/test/appShellFrontend.test.js
git commit -m "test: define app shell navigation contract"
```

---

### Nhiệm vụ 2: AppLayout và Tiêu đề đáp ứng

**Tệp:**
- Sửa đổi: `frontend/src/component/layout/AppLayout.jsx`
- Sửa đổi: `frontend/src/component/layout/Header.jsx`
- Sửa đổi: `frontend/src/styles/app-shell.css`
- Xóa: `frontend/src/component/layout/Sidebar.jsx`
- Kiểm tra: `frontend/test/appShellFrontend.test.js`

**Giao diện:**
- Tiêu thụ: `APP_NAV_GROUPS`, `getActiveNavigationKey` và các vai trò hiện tại.
- Tạo ra: `Header({ onOpenNavigation, navigationOpen })` và trạng thái phản hồi `app-sidebar-open`.

- [ ] **Bước 1: Mở rộng các kiểm thử hợp đồng nguồn không thành công**

Nối vào `frontend/test/appShellFrontend.test.js`:

```js
test('app layout exposes an accessible mobile navigation drawer', async () => {
  const source = await readFile(new URL('../src/component/layout/AppLayout.jsx', import.meta.url), 'utf8');
  const header = await readFile(new URL('../src/component/layout/Header.jsx', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../src/styles/app-shell.css', import.meta.url), 'utf8');

  assert.match(source, /useLocation\(\)/);
  assert.match(header, /aria-label="Mở điều hướng"/);
  assert.match(header, /aria-expanded=\{navigationOpen\}/);
  assert.match(source, /className=\{`app-sidebar\$\{navigationOpen \? ' app-sidebar-open' : ''\}`\}/);
  assert.match(source, /className="app-sidebar-backdrop"/);
  assert.match(styles, /@media \(max-width: 860px\)[\s\S]*\.app-sidebar-open/);
});

test('app layout composes the shared profile header', async () => {
  const source = await readFile(new URL('../src/component/layout/AppLayout.jsx', import.meta.url), 'utf8');
  assert.match(source, /import Header from '.\/Header';/);
  assert.match(source, /<Header/);
  assert.doesNotMatch(source, /<div className="app-avatar">N<\/div>/);
});
```

- [ ] **Bước 2: Chạy kiểm thử để xác minh RED**

Chạy:

```powershell
cd frontend
node --test test/appShellFrontend.test.js
```

Dự kiến: các kiểm thử ngăn kéo, thành phần tiêu đề và loại bỏ tìm kiếm THẤT BẠI.

- [ ] **Bước 3: Tái cấu trúc `Header` thành cấu hình và điều hướng trên thiết bị di động**

Thay đổi chữ ký công khai thành:

```jsx
export default function Header({ onOpenNavigation, navigationOpen = false }) {
```

Thay thế khối tìm kiếm ở đầu tiêu đề bằng:

```jsx
<button
  type="button"
  className="app-icon-btn app-menu-trigger"
  onClick={onOpenNavigation}
  aria-label="Mở điều hướng"
  aria-controls="app-navigation"
  aria-expanded={navigationOpen}
>
  <Menu size={20} />
</button>
```

Nhập `Menu` từ `lucide-react`, xóa `Search` và giữ nguyên trình kích hoạt hồ sơ hiện có, dự phòng hồ
sơ, cửa sổ bật lên menu và hành vi đăng xuất.

- [ ] **Bước 4: Refactor `AppLayout` để sở hữu trạng thái ngăn kéo**

Sử dụng khung trạng thái và lộ trình này bên trong `AppLayout`:

```jsx
const location = useLocation();
const [navigationOpen, setNavigationOpen] = useState(false);
const menuTriggerRef = useRef(null);
const activeKey = getActiveNavigationKey(location.pathname);

useEffect(() => {
  setNavigationOpen(false);
}, [location.pathname]);

function closeNavigation({ restoreFocus = false } = {}) {
  setNavigationOpen(false);
  if (restoreFocus) window.requestAnimationFrame(() => menuTriggerRef.current?.focus());
}
```

Kết xuất vỏ với:

```jsx
<aside id="app-navigation" className={`app-sidebar${navigationOpen ? ' app-sidebar-open' : ''}`}>
  {/* existing brand and role-filtered nav groups */}
</aside>
{navigationOpen && (
  <button
    type="button"
    className="app-sidebar-backdrop"
    onClick={() => closeNavigation({ restoreFocus: true })}
    aria-label="Đóng điều hướng"
  />
)}
<div className="app-main">
  <Header
    onOpenNavigation={(event) => {
      menuTriggerRef.current = event.currentTarget;
      setNavigationOpen((open) => !open);
    }}
    navigationOpen={navigationOpen}
  />
  {/* existing page header and children */}
</div>
```

Sử dụng `APP_NAV_GROUPS` và `activeKey`; xóa prop `active` làm nguồn trạng thái hoạt động trong khi
tạm thời chấp nhận nó trong chữ ký hàm để tránh phá vỡ những người gọi hiện có. Giữ các thành phần
biểu tượng trong `AppLayout` thông qua bản đồ cục bộ để tiện ích điều hướng thuần túy không nhập các
thành phần React:

```jsx
const NAV_ICONS = {
  home: LayoutDashboard,
  'borrow-request': BookMarked,
  'borrowing-history': History,
  'my-reservations': Bookmark,
  'borrow-requests-admin': ClipboardList,
  'process-returns': PackageCheck,
  'reservations-librarian': CalendarClock,
  'member-details': Users,
  'borrowing-report': BarChart2,
  'inventory-report': Boxes,
  'user-statistics': UserCog,
};
```

- [ ] **Bước 5: Thêm CSS đáp ứng**

Thay thế quy tắc thanh bên thu gọn 860px hiện tại bằng:

```css
.app-menu-trigger { display: none; }
.app-sidebar-backdrop { display: none; }

@media (max-width: 860px) {
  .app-menu-trigger { display: grid; }
  .app-sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 70;
    width: min(300px, 86vw);
    transform: translateX(-102%);
    transition: transform 180ms ease;
    box-shadow: 18px 0 48px rgba(36, 29, 22, 0.18);
  }
  .app-sidebar.app-sidebar-open { transform: translateX(0); }
  .app-sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 60;
    border: 0;
    background: rgba(36, 29, 22, 0.42);
  }
  .app-brand-text, .app-nav-label, .app-nav-item span { display: initial; }
  .app-nav-item { justify-content: flex-start; }
}

@media (prefers-reduced-motion: reduce) {
  .app-sidebar { transition: none; }
}
```

- [ ] **Bước 6: Xóa thành phần cũ không sử dụng**

Chạy:

```powershell
git rm frontend/src/component/layout/Sidebar.jsx
```

Xác nhận trước khi xóa:

```powershell
rg -n "component/layout/Sidebar|layout/Sidebar" frontend/src
```

Dự kiến: không nhập khẩu.

- [ ] **Bước 7: Chạy kiểm thử và tìm lỗi mã nguồn**

Chạy:

```powershell
cd frontend
node --test test/appShellFrontend.test.js
npm run lint
```

Dự kiến: các kiểm thử lớp bao ứng dụng đạt và kiểm tra mã báo cáo không có lỗi.

- [ ] **Bước 8: Cam kết nhiệm vụ 2**

```powershell
git add frontend/src/component/layout/AppLayout.jsx frontend/src/component/layout/Header.jsx frontend/src/styles/app-shell.css frontend/test/appShellFrontend.test.js
git commit -m "feat: add responsive role-aware app shell"
```

---

### Nhiệm vụ 3: Bảng điều khiển `/home` nhận biết vai trò

**Tệp:**
- Tạo: `frontend/src/page/dashboard/HomeRoutePage.jsx`
- Tạo: `frontend/src/page/dashboard/RoleDashboardPage.jsx`
- Tạo: `frontend/src/page/dashboard/dashboardViewModel.js`
- Sửa đổi: `frontend/src/App.jsx`
- Sửa đổi: `frontend/src/styles/app-shell.css`
- Kiểm tra: `frontend/test/appShellFrontend.test.js`

**Giao diện:**
- Tiêu thụ: `getDashboardAudience`, `hasStoredAuth`, `borrowingApi` và `reservationApi`.
- Sản xuất: `HomeRoutePage`, `RoleDashboardPage({ audience, roles })`, `buildMemberSummary` và `buildStaffSummary`.

- [ ] **Bước 1: Viết các kiểm thử ánh xạ trang tổng quan không thành công**

Nối thêm:

```js
import { buildMemberSummary, buildStaffSummary } from '../src/page/dashboard/dashboardViewModel.js';

test('member dashboard summarizes personal activity', () => {
  assert.deepEqual(
    buildMemberSummary(
      { borrowRequests: [{ status: 'APPROVED' }, { status: 'COMPLETED' }] },
      { reservations: [{ status: 'WAITING' }, { status: 'CANCELLED' }] },
    ),
    { activeBorrows: 1, completedBorrows: 1, activeReservations: 1 },
  );
});

test('staff dashboard summarizes operational queues', () => {
  assert.deepEqual(
    buildStaffSummary(
      { borrowRequests: [{ status: 'PENDING' }, { status: 'APPROVED' }] },
      { reservations: [{ status: 'WAITING' }, { status: 'READY' }] },
    ),
    { pendingBorrowRequests: 1, waitingReservations: 1, readyReservations: 1 },
  );
});
```

- [ ] **Bước 2: Chạy kiểm thử để xác minh RED**

Chạy:

```powershell
cd frontend
node --test --test-name-pattern="dashboard summarizes" test/appShellFrontend.test.js
```

Dự kiến: THẤT BẠI vì `dashboardViewModel.js` không tồn tại.

- [ ] **Bước 3: Triển khai ánh xạ tóm tắt thuần tuý**

Tạo `frontend/src/page/dashboard/dashboardViewModel.js`:

```js
export function buildMemberSummary(borrowing = {}, reservations = {}) {
  const borrowRows = borrowing.borrowRequests || [];
  const reservationRows = reservations.reservations || [];
  return {
    activeBorrows: borrowRows.filter((row) => ['APPROVED', 'BORROWED'].includes(row.status)).length,
    completedBorrows: borrowRows.filter((row) => ['COMPLETED', 'RETURNED'].includes(row.status)).length,
    activeReservations: reservationRows.filter((row) => !['CANCELLED', 'EXPIRED', 'COMPLETED'].includes(row.status)).length,
  };
}

export function buildStaffSummary(borrowing = {}, reservations = {}) {
  const borrowRows = borrowing.borrowRequests || [];
  const reservationRows = reservations.reservations || [];
  return {
    pendingBorrowRequests: borrowRows.filter((row) => row.status === 'PENDING').length,
    waitingReservations: reservationRows.filter((row) => row.status === 'WAITING').length,
    readyReservations: reservationRows.filter((row) => row.status === 'READY').length,
  };
}
```

- [ ] **Bước 4: Thực hiện lựa chọn tuyến đường**

Tạo `HomeRoutePage.jsx`:

```jsx
import HomePage from '../HomePage';
import { hasStoredAuth } from '../../api/libraryFeatureApi';
import { getDashboardAudience } from '../../utils/appNavigation';
import RoleDashboardPage from './RoleDashboardPage';

function readStoredUser() {
  try {
    const raw = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function HomeRoutePage() {
  const user = readStoredUser();
  const audience = hasStoredAuth() ? getDashboardAudience(user?.roles || []) : 'guest';
  return audience === 'guest'
    ? <HomePage />
    : <RoleDashboardPage audience={audience} roles={user.roles || []} />;
}
```

Sửa đổi `App.jsx` để nhập `HomeRoutePage` và hiển thị nó cho `/home`; giữ `HomePage` ở chế độ riêng
tư đối với trình bao bọc tuyến đường.

- [ ] **Bước 5: Triển khai `RoleDashboardPage` với các API hiện có**

Thành phần phải:

```jsx
export default function RoleDashboardPage({ audience }) {
  const [summary, setSummary] = useState(null);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const request = audience === 'member'
      ? Promise.all([borrowingApi.listMine(), reservationApi.listMine()])
      : Promise.all([borrowingApi.listAll({ status: 'PENDING' }), reservationApi.listAll()]);

    request
      .then(([borrowing, reservations]) => {
        if (!active) return;
        setSummary(audience === 'member'
          ? buildMemberSummary(borrowing, reservations)
          : buildStaffSummary(borrowing, reservations));
      })
      .catch((error) => active && setNotice(error.message))
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [audience]);

  return (
    <AppLayout title={audience === 'member' ? 'Tổng quan của bạn' : 'Tổng quan vận hành'}>
      {notice && <DataNotice type="error" title="Không thể tải tổng quan">{notice}</DataNotice>}
      {loading ? <LoadingBlock rows={3} /> : <DashboardContent audience={audience} summary={summary} />}
    </AppLayout>
  );
}
```

`DashboardContent` hiển thị ba thẻ KPI và chỉ liên kết đến các tuyến đường được phép hiện có:

- Thành viên: `/borrowing/new`, `/borrowing/history`, `/reservations/mine`.
- Nhân viên: `/librarian/borrow-requests`, `/librarian/returns`, `/reports/borrowing`.

Không thêm các chức năng giữ chỗ hoặc số liệu demo bịa đặt.

- [ ] **Bước 6: Thêm bảng điều khiển CSS**

Thêm `.dashboard-actions`, `.dashboard-action` và hành vi một cột trên thiết bị di động bằng cách sử
dụng các biến `kpi-grid`, `kpi-card` và mã thông báo hiện có. Thẻ phải sử dụng bán kính tối đa 12px
và có kích thước biểu tượng/hành động ổn định.

- [ ] **Bước 7: Chạy kiểm thử mục tiêu và tìm lỗi mã nguồn**

Chạy:

```powershell
cd frontend
node --test test/appShellFrontend.test.js
npm run lint
```

Dự kiến: tất cả các kiểm thử lớp bao ứng dụng đều ĐẠT và tìm lỗi mã nguồn không báo cáo lỗi nào.

- [ ] **Bước 8: Cam kết nhiệm vụ 3**

```powershell
git add frontend/src/page/dashboard frontend/src/App.jsx frontend/src/styles/app-shell.css frontend/test/appShellFrontend.test.js
git commit -m "feat: add role-aware library dashboard"
```

---

### Nhiệm vụ 4: Cổng xác thực App lớp bao

**Tệp:**
- Chỉ sửa đổi nếu việc xác thực cho thấy lỗi trong các tệp đã được liệt kê trong Nhiệm vụ 1-3.

**Giao diện:**
- Tiêu thụ lớp bao và bảng điều khiển đã hoàn thành.
- Tạo ra bằng chứng B6 cho các lớp tự động, đặc tả, cấu trúc và chấp nhận.

- [ ] **Bước 1: Chạy kiểm tra tự động**

```powershell
cd frontend
node --test test/appShellFrontend.test.js
npm run lint
npm run build
```

Dự kiến: tất cả các lệnh thoát `0`; bản dựng tạo ra `frontend/dist`.

- [ ] **Bước 2: Chạy kiểm tra tuân thủ đặc tả**

Xác nhận với `rg`:

```powershell
rg -n "app-search|Search books, members, loans" src/component/layout
rg -n "Mở điều hướng|Đóng điều hướng|aria-expanded" src/component/layout
rg -n "Tổng quan của bạn|Tổng quan vận hành" src/page/dashboard
```

Dự kiến: không có kết quả tìm kiếm chung; ngăn kéo có thể truy cập và cả hai tiêu đề bảng điều khiển
đều có mặt.

- [ ] **Bước 3: Chạy chấp nhận thủ công đáp ứng**

Tại 1440px, 1024px, 768px và 390px hãy xác minh:

- Thanh bên tồn tại liên tục trên máy tính để bàn và ngăn kéo rõ ràng ở 860px trở xuống.
- Ngăn kéo đóng lại sau khi chọn tuyến đường và kích hoạt phông nền.
- Menu hồ sơ vẫn có thể truy cập được.
- Tiêu đề trang và hành động chính không trùng nhau.
- Tài khoản thành viên và nhân viên chỉ nhìn thấy các liên kết điều hướng và bảng điều khiển được phép.

- [ ] **Bước 4: Kiểm tra sự khác biệt cuối cùng**

```powershell
git status --short
git diff --check
git diff --stat origin/main...HEAD
```

Dự kiến: chỉ các tệp gói App lớp bao được thay đổi; không có bí mật, nội dung được tạo hoặc định dạng
không liên quan.

- [ ] **Bước 5: Cam kết các bản sửa lỗi chỉ xác thực nếu được yêu cầu**

```powershell
git add frontend
git commit -m "fix: close app shell UX validation gaps"
```

Bỏ qua cam kết này khi xác thực không yêu cầu sửa mã.

---

## Cổng đánh giá con người

Xem lại lát cắt chống lại:

- `UX-FE-001`, `UX-FE-007`, `UX-FE-008`.
- `NFR-UX-001`, `NFR-UX-002`, `NFR-UX-003`.
- `AC-UX-004`, `AC-UX-006`, `AC-UX-007`, `AC-UX-008`.

Không bắt đầu kế hoạch xác thực UX cho đến khi phần App lớp bao này vượt qua quá trình kiểm tra tự động và
đánh giá của con người.
