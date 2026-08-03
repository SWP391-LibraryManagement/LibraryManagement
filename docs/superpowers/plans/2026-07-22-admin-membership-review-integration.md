# Kế hoạch thực hiện tích hợp đánh giá thành viên quản trị viên

> **Đối với nhân viên đại lý:** SUB-SKILL BẮT BUỘC: Sử dụng siêu năng lực:phát triển theo định hướng phụ (được khuyến nghị) hoặc siêu năng lực:thực hiện các kế hoạch để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Thêm mô-đun đánh giá thành viên FE04 gốc dành cho quản trị viên vào Bảng điều khiển
dành cho quản trị viên hiện có mà không thay đổi API FE04, lược đồ, chuyển đổi trạng thái, ủy quyền,
kiểm tra hoặc quyền sở hữu phân phối FE10.

**Kiến trúc:** FE11 sở hữu lớp vỏ Quản trị và thêm một điểm tổng hợp phần/điều hướng `membership`.
Mô-đun `admin/membership` tập trung sử dụng `membershipApi` hiện có; trình trợ giúp chuẩn hóa/phản
hồi thuần túy giúp kiểm tra việc xử lý phản hồi trong khi phần máy chủ vẫn có thẩm quyền đối với các
quy tắc xem xét.

**bộ công nghệ công nghệ:** React 19, Vite, Lucide React, Axios, Trình chạy kiểm thử nút, Playwright
Chrome, Express FE04 API, SQL Server kho lưu trữ sản xuất.

## Ràng buộc toàn cầu

- Thứ tự thanh bên chính xác là Trang chủ, Bảng điều khiển, Thư viện, Lưu hành, Yêu cầu, Người dùng, Đánh giá thành viên, Kiểm tra.
- `Duyệt hội viên` nối tiếp `Quản lý người dùng`; Quyền và xác nhận thanh toán/vay đã bị xóa vẫn không có.
- Chỉ sử dụng điểm cuối FE04 chuẩn; không tạo bí danh `/api/admin/membership`.
- Bảo quản `/membership` cho Thành viên/Thủ thư.
- Tìm kiếm tối đa 100 ký tự; lý do từ chối được cắt bớt và 1..500; kích thước trang là 10.
- Chỉ các hàng `PENDING` hiển thị các quyết định; tải lại dữ liệu có thẩm quyền sau mỗi lần thao tác ghi thành công hay thất bại.
- Trạng thái thông báo `FAILED` là cảnh báo gửi sau một quyết định đã cam kết chứ không phải một quyết định thất bại.
- Không cho phép sản xuất máy chủ, API, lược đồ, di chuyển, vai trò hoặc thay đổi trạng thái thành viên; dịch vụ FE04 trong bộ nhớ chỉ dành cho kiểm thử có thể được kết nối với bộ khai thác E2E hiện có.
- Không tràn cấp tài liệu ở 1440x900, 1366x768, 1280x720 hoặc 390x844.
- luồng nhanh H2 ghi đè các cam kết chung chung thường xuyên: giữ nguyên Nhiệm vụ 1-4, xem lại một lần, sau đó cam kết trong Nhiệm vụ 5.

## Bản đồ tệp

| Tập tin | Trách nhiệm |
| --- | --- |
| `frontend/src/page/admin/membership/adminMembershipPresentation.js` | Chuẩn hóa danh sách FE04 thuần túy, quyết định đang chờ xử lý, phản hồi thông báo. |
| `frontend/src/page/admin/membership/AdminMembershipSection.jsx` | Bộ lọc, phân trang, bảng/thẻ, thao tác ghi, tải lại và phản hồi. |
| `frontend/src/page/admin/membership/AdminMembershipReviewModal.jsx` | Chi tiết có thể truy cập, xác nhận phê duyệt, đầu vào từ chối. |
| `frontend/src/page/admin/adminNavigation.js` | Thanh bên có tám mục chính xác. |
| `frontend/src/page/admin/AdminConsolePage.jsx` | Thành phần phần chỉ dành cho quản trị viên. |
| `frontend/src/page/admin/admin-console.css` | Mô-đun đáp ứng và bánh mì nướng cảnh báo. |
| `frontend/test/*.test.js` | Hợp đồng sở hữu thuần túy/nguồn và hồi quy. |
| `backend/tests/helpers/systemIntegrationHarness.js` | Dịch vụ FE04 trong bộ nhớ chỉ kiểm thử để chấp nhận trình duyệt đã xác thực. |
| `tests/e2e/fe04-admin-membership-review.spec.js` | Đã xác thực chấp nhận đánh giá FE04 thực. |

---

### Nhiệm vụ 1: Hợp đồng điều hướng và trình bày thuần túy

**Tệp:**
- Tạo: `frontend/src/page/admin/membership/adminMembershipPresentation.js`
- Sửa đổi: `frontend/src/page/admin/adminNavigation.js`
- Sửa đổi: `frontend/test/adminConsolePresentation.test.js`
- Sửa đổi: `frontend/test/appShellFrontend.test.js`

**Giao diện:**
- Tiêu thụ: `{ applications, page, limit, total, totalPages }`.
- Sản xuất: `ADMIN_MEMBERSHIP_PAGE_SIZE`, `EMPTY_ADMIN_MEMBERSHIP_FILTERS`, `normalizeAdminMembershipList`, `isPendingMembershipApplication`, `getMembershipDecisionFeedback`.

- [ ] **Bước 1: Viết các kiểm thử điều hướng và trợ giúp không thành công**

```js
import {
  getMembershipDecisionFeedback,
  isPendingMembershipApplication,
  normalizeAdminMembershipList,
} from '../src/page/admin/membership/adminMembershipPresentation.js';

test('Admin navigation keeps the approved eight entries in order without Permissions', () => {
  assert.deepEqual(ADMIN_NAVIGATION.map(({ id, label }) => [id, label]), [
    ['home', 'Trang chủ'], ['dashboard', 'Tổng quan'], ['library', 'Thư viện'],
    ['circulation', 'Quản lý mượn trả'], ['requests', 'Quản lý yêu cầu'],
    ['users', 'Quản lý người dùng'], ['membership', 'Duyệt hội viên'],
    ['audit', 'Nhật ký hoạt động'],
  ]);
});

test('Admin membership presentation keeps canonical paging and safe feedback', () => {
  const result = normalizeAdminMembershipList({
    applications: [{ applicationId: 41, status: 'pending', applicant: { email: 'an@example.test' } }],
    page: 2, limit: 10, total: 11, totalPages: 2,
  });
  assert.equal(result.applications[0].status, 'PENDING');
  assert.deepEqual(result.pagination, { page: 2, limit: 10, total: 11, totalPages: 2 });
  assert.equal(isPendingMembershipApplication(result.applications[0]), true);
  assert.deepEqual(getMembershipDecisionFeedback('approve', 'FAILED'), {
    type: 'warning', message: 'Đã duyệt đơn, nhưng thông báo kết quả chưa gửi được.',
  });
});
```

Cập nhật `appShellFrontend.test.js` để yêu cầu `Duyệt hội viên` và thay thế xác nhận phủ định tư
cách thành viên cũ bằng:

```js
assert.match(navigation, /\{ id: 'membership'[^\n]+label: 'Duyệt hội viên'/);
assert.doesNotMatch(navigation, /label: 'Phân quyền'/);
```

- [ ] **Bước 2: Xác minh RED**

Chạy:

```powershell
node --test frontend/test/adminConsolePresentation.test.js frontend/test/appShellFrontend.test.js
```

Dự kiến: THẤT BẠI vì không có tệp trợ giúp và điều hướng vẫn có bảy mục nhập.

- [ ] **Bước 3: Thực hiện các hợp đồng thuần túy tối thiểu**

Tạo trình trợ giúp với các lần xuất chính xác sau:

```js
export const ADMIN_MEMBERSHIP_PAGE_SIZE = 10;
export const EMPTY_ADMIN_MEMBERSHIP_FILTERS = Object.freeze({ q: '', status: 'PENDING' });

export function normalizeAdminMembershipList(response = {}, fallback = {}) {
  const rows = Array.isArray(response) ? response : response.applications || response.items || response.data || [];
  const limit = Number(response.limit || response.pagination?.limit || fallback.limit || ADMIN_MEMBERSHIP_PAGE_SIZE);
  const total = Number(response.total || response.pagination?.total || rows.length || 0);
  return {
    applications: rows.map((row) => ({
      applicationId: Number(row.applicationId || row.id),
      userId: row.userId ?? null,
      status: String(row.status || '').toUpperCase(),
      appliedAt: row.appliedAt || row.createdAt || null,
      approvedAt: row.approvedAt || null,
      rejectionReason: row.rejectionReason || row.reviewNote || null,
      applicant: {
        userId: row.applicant?.userId ?? row.userId ?? null,
        fullName: row.applicant?.fullName || row.fullName || row.name || '',
        username: row.applicant?.username || row.username || row.userName || '',
        email: row.applicant?.email || row.email || '',
        phone: row.applicant?.phone || row.phone || '',
      },
    })),
    pagination: {
      page: Number(response.page || response.pagination?.page || fallback.page || 1),
      limit,
      total,
      totalPages: Number(response.totalPages || response.pagination?.totalPages || Math.max(Math.ceil(total / limit), 1)),
    },
  };
}

export function isPendingMembershipApplication(application) {
  return String(application?.status || '').toUpperCase() === 'PENDING';
}

export function getMembershipDecisionFeedback(action, notificationStatus) {
  const approved = action === 'approve';
  if (notificationStatus === 'FAILED') return {
    type: 'warning',
    message: `${approved ? 'Đã duyệt đơn' : 'Đã từ chối đơn'}, nhưng thông báo kết quả chưa gửi được.`,
  };
  return {
    type: 'success',
    message: approved ? 'Đã duyệt đơn đăng ký hội viên.' : 'Đã từ chối đơn đăng ký hội viên.',
  };
}
```

Nhập `UserCheck` vào `adminNavigation.js` và chèn:

```js
{ id: 'users', icon: Users, label: 'Quản lý người dùng' },
{ id: 'membership', icon: UserCheck, label: 'Duyệt hội viên' },
{ id: 'audit', icon: ClipboardList, label: 'Nhật ký hoạt động' },
```

- [ ] **Bước 4: Xác minh GREEN**

Chạy lệnh Bước 2. Dự kiến: ĐẠT mà không thất bại.

- [ ] **Bước 5: Ghi điểm kiểm tra**

Chạy `git diff --check` và `git status --short`. Dự kiến: chỉ các tệp frontend/test của Nhiệm vụ 1;
không cam kết trước H2.

---

### Nhiệm vụ 2: Thư mục thành viên quản trị viên chỉ đọc

**Tệp:**
- Tạo: `frontend/src/page/admin/membership/AdminMembershipSection.jsx`
- Sửa đổi: `frontend/src/page/admin/AdminConsolePage.jsx`
- Sửa đổi: `frontend/src/page/admin/admin-console.css`
- Sửa đổi: `frontend/test/adminConsoleStructure.test.js`
- Sửa đổi: `frontend/test/membershipFrontend.test.js`
- Sửa đổi: `frontend/test/userManagementFrontend.test.js`

**Giao diện:**
- Tiêu thụ: Người trợ giúp Nhiệm vụ 1 và `membershipApi.listApplications(params)`.
- Tạo ra: `AdminMembershipSection({ onToast })` với các bộ lọc được áp dụng `{ q, status }` và phân trang máy chủ.

- [ ] **Bước 1: Viết kiểm thử quyền sở hữu/thành phần không thành công**

Nối vào `adminConsoleStructure.test.js`:

```js
test('Admin membership section consumes canonical FE04 reads inside the Admin shell', async () => {
  const section = await readFile(new URL('membership/AdminMembershipSection.jsx', root), 'utf8');
  const page = await readFile(new URL('AdminConsolePage.jsx', root), 'utf8');
  assert.match(section, /membershipApi\.listApplications\(/);
  assert.match(section, /q:\s*appliedFilters\.q/);
  assert.match(section, /status:\s*appliedFilters\.status/);
  assert.match(section, /page:\s*membershipPage/);
  assert.match(section, /limit:\s*ADMIN_MEMBERSHIP_PAGE_SIZE/);
  assert.match(section, /admin-membership-table/);
  assert.match(section, /admin-membership-cards/);
  assert.doesNotMatch(section, /adminApi\.|\/api\/admin\/membership/);
  assert.match(page, /activeSection === 'membership'/);
  assert.match(page, /<AdminMembershipSection onToast=\{setToast\}/);
});
```

Thay thế loại trừ lỗi thời trong `membershipFrontend.test.js` bằng:

```js
test('FE04 keeps its workspace and powers embedded Admin review', async () => {
  const page = await readFile(new URL('../src/page/admin/AdminConsolePage.jsx', import.meta.url), 'utf8');
  const section = await readFile(new URL('../src/page/admin/membership/AdminMembershipSection.jsx', import.meta.url), 'utf8');
  assert.match(page, /activeSection === 'membership'/);
  assert.match(section, /membershipApi\.listApplications/);
  assert.doesNotMatch(section, /adminApi\.|\/api\/admin\/membership/);
});
```

Trong `userManagementFrontend.test.js`, chỉ giữ lại FE09/loại trừ thanh toán:

```js
assert.doesNotMatch(adminSource, /getFineRecords|saveFineRecords/);
assert.doesNotMatch(adminSource, /activeSection === ['"]payments['"]/);
```

- [ ] **Bước 2: Xác minh RED**

Chạy:

```powershell
node --test frontend/test/adminConsoleStructure.test.js frontend/test/membershipFrontend.test.js frontend/test/userManagementFrontend.test.js
```

Dự kiến: THẤT BẠI vì phần và thành phần không tồn tại.

- [ ] **Bước 3: Triển khai trạng thái và kết xuất danh sách do máy chủ sở hữu**

Tạo `AdminMembershipSection.jsx` với hợp đồng trạng thái/tải này:

```jsx
import { FilterX, RefreshCw, Search, UserCheck } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { membershipApi } from '../../../api/libraryFeatureApi';
import MembershipStatusBadge from '../../../component/membership/MembershipStatusBadge';
import { createLatestRequestGuard } from '../../../utils/latestRequestGuard';
import { AdminActionButton } from '../components/AdminActionButton';
import { AdminEmptyState } from '../components/AdminEmptyState';
import { AdminFilterBar } from '../components/AdminFilterBar';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminPagination } from '../components/AdminPagination';
import { ADMIN_MEMBERSHIP_PAGE_SIZE, EMPTY_ADMIN_MEMBERSHIP_FILTERS, normalizeAdminMembershipList } from './adminMembershipPresentation';

export function AdminMembershipSection({ onToast }) {
const [applications, setApplications] = useState([]);
const [membershipFilters, setMembershipFilters] = useState({ ...EMPTY_ADMIN_MEMBERSHIP_FILTERS });
const [appliedFilters, setAppliedFilters] = useState({ ...EMPTY_ADMIN_MEMBERSHIP_FILTERS });
const [membershipPage, setMembershipPage] = useState(1);
const [pagination, setPagination] = useState({ page: 1, limit: ADMIN_MEMBERSHIP_PAGE_SIZE, total: 0, totalPages: 1 });
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const requestGuard = useRef(createLatestRequestGuard());
const notify = useCallback((type, message) => onToast?.({ type, message }), [onToast]);

const loadApplications = useCallback(async ({ announce = false } = {}) => {
  const token = requestGuard.current.begin();
  setLoading(true);
  setError('');
  try {
    const result = normalizeAdminMembershipList(await membershipApi.listApplications({
      q: appliedFilters.q || undefined,
      status: appliedFilters.status === 'ALL' ? undefined : appliedFilters.status,
      page: membershipPage,
      limit: ADMIN_MEMBERSHIP_PAGE_SIZE,
    }), { page: membershipPage, limit: ADMIN_MEMBERSHIP_PAGE_SIZE });
    if (!requestGuard.current.isLatest(token)) return;
    setApplications(result.applications);
    setPagination(result.pagination);
    if (announce) notify('success', 'Đã làm mới danh sách đơn hội viên.');
  } catch (loadError) {
    if (!requestGuard.current.isLatest(token)) return;
    setApplications([]);
    setError(loadError.message);
    notify('error', loadError.message);
  } finally {
    if (requestGuard.current.isLatest(token)) setLoading(false);
  }
}, [appliedFilters, membershipPage, notify]);

useEffect(() => {
  const timer = window.setTimeout(loadApplications, 0);
  return () => window.clearTimeout(timer);
}, [loadApplications]);

function applyFilters() {
  const q = membershipFilters.q.trim();
  if (q.length > 100) {
    notify('error', 'Nội dung tìm kiếm không được vượt quá 100 ký tự.');
    return;
  }
  setMembershipPage(1);
  setAppliedFilters({ q, status: membershipFilters.status });
}

function resetFilters() {
  setMembershipFilters({ ...EMPTY_ADMIN_MEMBERSHIP_FILTERS });
  setMembershipPage(1);
  setAppliedFilters({ ...EMPTY_ADMIN_MEMBERSHIP_FILTERS });
}
```

Thêm các chức năng trình bày hoàn chỉnh này phía trên thành phần:

```jsx
function formatMembershipDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function ApplicantIdentity({ application }) {
  const applicant = application.applicant;
  return <div className="admin-membership-applicant"><strong>{applicant.fullName || applicant.username || 'Chưa có tên'}</strong><small>{applicant.username || `User #${applicant.userId || application.userId}`}</small></div>;
}

function renderMembershipRow(application) {
  return <tr key={application.applicationId}><td>#{application.applicationId}</td><td><ApplicantIdentity application={application} /></td><td><strong>{application.applicant.email || '-'}</strong><small>{application.applicant.phone || '-'}</small></td><td>{formatMembershipDate(application.appliedAt)}</td><td><MembershipStatusBadge status={application.status} /></td></tr>;
}

function renderMembershipCard(application) {
  return <article className="admin-membership-card" key={application.applicationId}><header><strong>#{application.applicationId}</strong><MembershipStatusBadge status={application.status} /></header><ApplicantIdentity application={application} /><p>{application.applicant.email || '-'}</p><p>{application.applicant.phone || '-'}</p><small>{formatMembershipDate(application.appliedAt)}</small></article>;
}
```

Hiển thị các hợp đồng giao diện người dùng chính xác này:

```jsx
return <section className="admin-membership admin-membership-directory">
<AdminPageHeader eyebrow="FE04 · Xét duyệt hội viên" title="Duyệt hội viên" refreshing={loading} onRefresh={() => loadApplications({ announce: true })} />
<div className="admin-section-status" aria-live="polite"><span>{loading ? 'Đang đồng bộ dữ liệu FE04.' : 'Danh sách dùng dữ liệu mới nhất từ máy chủ.'}</span>{error ? <strong className="admin-text-error">{error}</strong> : null}</div>
<AdminFilterBar actions={<><AdminActionButton icon={Search} label="Áp dụng" tone="primary" disabled={loading} onClick={applyFilters} /><AdminActionButton icon={FilterX} label="Đặt lại" disabled={loading} onClick={resetFilters} /></>}>
  <label className="admin-field admin-field--search"><span>Tìm đơn hội viên</span><input maxLength={100} value={membershipFilters.q} placeholder="Mã đơn, tên, username hoặc email" onChange={(event) => setMembershipFilters((current) => ({ ...current, q: event.target.value }))} onKeyDown={(event) => { if (event.key === 'Enter') applyFilters(); }} /></label>
  <label className="admin-field"><span>Trạng thái</span><select aria-label="Lọc trạng thái hội viên" value={membershipFilters.status} onChange={(event) => setMembershipFilters((current) => ({ ...current, status: event.target.value }))}><option value="PENDING">Chờ duyệt</option><option value="APPROVED">Đã duyệt</option><option value="REJECTED">Từ chối</option><option value="ALL">Tất cả</option></select></label>
</AdminFilterBar>
<div className="admin-table-scroll admin-membership-table"><table className="admin-data-table" aria-label="Danh sách đơn đăng ký hội viên"><thead><tr><th>Mã đơn</th><th>Người nộp</th><th>Liên hệ</th><th>Ngày nộp</th><th>Trạng thái</th></tr></thead><tbody>{applications.map(renderMembershipRow)}</tbody></table></div>
<div className="admin-membership-cards">{applications.map(renderMembershipCard)}</div>
{!loading && applications.length === 0 ? <AdminEmptyState icon={UserCheck} title="Không có đơn hội viên phù hợp" description="Hãy điều chỉnh bộ lọc hoặc làm mới dữ liệu." /> : null}
{loading && applications.length === 0 ? <AdminEmptyState icon={RefreshCw} title="Đang tải đơn hội viên" description="Dữ liệu đang được đồng bộ từ FE04." /> : null}
<AdminPagination page={membershipPage} totalItems={pagination.total} pageSize={pagination.limit} onPageChange={setMembershipPage} />
</section>;
}
```

Đặt `formatMembershipDate`, `ApplicantIdentity`, `renderMembershipRow` và `renderMembershipCard`
phía trên `AdminMembershipSection` để tệp hoàn chỉnh được biên dịch mà không phụ thuộc vào trạng
thái chuyển tiếp.

Nhập phần trong `AdminConsolePage.jsx` và soạn nó ngay sau người dùng:

```jsx
) : activeSection === 'membership' ? (
  <AdminMembershipSection onToast={setToast} />
) : activeSection === 'dashboard' ? (
```

Thêm mốc cơ sở CSS:

```css
.admin-membership-directory { display: grid; gap: 16px; }
.admin-membership-table { display: block; }
.admin-membership-cards { display: none; }
.admin-membership-applicant { display: grid; min-width: 0; gap: 3px; }
.admin-membership-applicant strong,
.admin-membership-applicant small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.admin-membership-card { display: grid; gap: 8px; padding: 16px; border: 1px solid var(--admin-line); border-radius: 16px; background: var(--admin-paper); }
```

- [ ] **Bước 4: Xác minh GREEN**

Chạy lệnh Bước 2 và `npm.cmd --prefix frontend run build`.

Dự kiến: các kiểm thử tập trung đã vượt qua và Vite báo cáo quá trình xây dựng thành công.

- [ ] **Bước 5: Ghi điểm kiểm tra**

Chạy `git diff --check` và kiểm tra phạm vi. Dự kiến: Chỉ nhiệm vụ 1-2 frontend/tests; không có tập
tin máy chủ.

---

### Nhiệm vụ 3: Phê duyệt, Từ chối, Tải lại Xung đột và Phản hồi FE10

**Tệp:**
- Tạo: `frontend/src/page/admin/membership/AdminMembershipReviewModal.jsx`
- Sửa đổi: `frontend/src/page/admin/membership/AdminMembershipSection.jsx`
- Sửa đổi: `frontend/src/page/admin/admin-console.css`
- Sửa đổi: `frontend/test/adminConsoleStructure.test.js`

**Giao diện:**
- Tiêu thụ: `membershipApi.approve`, `membershipApi.reject`, `isPendingMembershipApplication`, `getMembershipDecisionFeedback`.
- Sản xuất: `AdminMembershipReviewModal({ application, saving, onClose, onApprove, onReject })`.

- [ ] **Bước 1: Viết kiểm thử thao tác ghi/phương thức thất bại**

```js
test('Admin membership decisions preserve FE04 review rules', async () => {
  const section = await readFile(new URL('membership/AdminMembershipSection.jsx', root), 'utf8');
  const modal = await readFile(new URL('membership/AdminMembershipReviewModal.jsx', root), 'utf8');
  assert.match(section, /membershipApi\.approve\(selectedApplication\.applicationId\)/);
  assert.match(section, /membershipApi\.reject\(selectedApplication\.applicationId, cleanReason\)/);
  assert.match(section, /await loadApplications\(\)/);
  assert.match(section, /getMembershipDecisionFeedback/);
  assert.match(modal, /isPendingMembershipApplication/);
  assert.match(modal, /maxLength=\{500\}/);
  assert.match(modal, /role="dialog"/);
  assert.match(modal, /aria-modal="true"/);
  assert.match(modal, /Chỉ có thể xem/);
});
```

- [ ] **Bước 2: Xác minh RED**

Chạy `node --test frontend/test/adminConsoleStructure.test.js`.

Dự kiến: THẤT BẠI vì không có trình xử lý phương thức và thao tác ghi.

- [ ] **Bước 3: Triển khai luồng thao tác ghi phương thức và có thẩm quyền**

Tạo phương thức với ranh giới quyết định hoàn chỉnh này:

```jsx
import { Check, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import MembershipStatusBadge from '../../../component/membership/MembershipStatusBadge';
import { isPendingMembershipApplication } from './adminMembershipPresentation';

export function AdminMembershipReviewModal({ application, saving, onClose, onApprove, onReject }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const closeButtonRef = useRef(null);
  const pending = isPendingMembershipApplication(application);
  useEffect(() => { closeButtonRef.current?.focus(); }, []);

  function submitRejection() {
    const cleanReason = reason.trim();
    if (!cleanReason) { setError('Lý do từ chối là bắt buộc.'); return; }
    if (cleanReason.length > 500) { setError('Lý do từ chối không được vượt quá 500 ký tự.'); return; }
    onReject(cleanReason);
  }

  return (
    <div className="admin-modal-backdrop" onMouseDown={() => { if (!saving) onClose(); }}>
      <div className="admin-modal admin-modal--compact" role="dialog" aria-modal="true" aria-labelledby="admin-membership-review-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="admin-modal__header"><div><p>FE04 · Chi tiết đơn</p><h2 id="admin-membership-review-title">Đơn hội viên #{application.applicationId}</h2></div><button ref={closeButtonRef} type="button" disabled={saving} onClick={onClose} aria-label="Đóng"><X aria-hidden="true" /></button></header>
        <div className="admin-modal__body admin-modal__body--single admin-membership-detail">
          <p><strong>Người nộp</strong><span>{application.applicant.fullName || application.applicant.username || '-'}</span></p>
          <p><strong>Username</strong><span>{application.applicant.username || '-'}</span></p>
          <p><strong>Email</strong><span>{application.applicant.email || '-'}</span></p>
          <p><strong>Số điện thoại</strong><span>{application.applicant.phone || '-'}</span></p>
          <p><strong>Trạng thái</strong><MembershipStatusBadge status={application.status} /></p>
          {pending ? <label className="admin-field"><span>Lý do từ chối</span><textarea value={reason} maxLength={500} onChange={(event) => { setReason(event.target.value); setError(''); }} placeholder="Bắt buộc khi từ chối đơn" /><small>{reason.length}/500 ký tự</small>{error ? <small className="admin-field-error">{error}</small> : null}</label> : <p className="admin-form-note">Đơn đã được xử lý. Chỉ có thể xem thông tin.</p>}
        </div>
        {pending ? <footer className="admin-modal__actions"><button type="button" disabled={saving} onClick={submitRejection}>Từ chối</button><button className="admin-modal__primary" type="button" disabled={saving} onClick={onApprove}><Check aria-hidden="true" />{saving ? 'Đang xử lý...' : 'Xác nhận duyệt đơn'}</button></footer> : null}
      </div>
    </div>
  );
}
```

Thêm trạng thái này và đóng/mở hợp đồng vào phần này:

```jsx
const [selectedApplication, setSelectedApplication] = useState(null);
const [saving, setSaving] = useState(false);
const returnFocusRef = useRef(null);

function openApplication(application, event) {
  returnFocusRef.current = event.currentTarget;
  setSelectedApplication(application);
}

function closeApplication() {
  setSelectedApplication(null);
  window.requestAnimationFrame(() => returnFocusRef.current?.focus());
}
```

Sử dụng các trình xử lý này:

```jsx
async function approveSelected() {
  if (!selectedApplication || saving) return;
  setSaving(true);
  try {
    const result = await membershipApi.approve(selectedApplication.applicationId);
    closeApplication();
    await loadApplications();
    const feedback = getMembershipDecisionFeedback('approve', result.notificationStatus);
    notify(feedback.type, feedback.message);
  } catch (actionError) {
    notify('error', actionError.message);
    await loadApplications();
    closeApplication();
  } finally {
    setSaving(false);
  }
}

async function rejectSelected(reason) {
  if (!selectedApplication || saving) return;
  const cleanReason = reason.trim();
  if (!cleanReason || cleanReason.length > 500) return;
  setSaving(true);
  try {
    const result = await membershipApi.reject(selectedApplication.applicationId, cleanReason);
    closeApplication();
    await loadApplications();
    const feedback = getMembershipDecisionFeedback('reject', result.notificationStatus);
    notify(feedback.type, feedback.message);
  } catch (actionError) {
    notify('error', actionError.message);
    await loadApplications();
    closeApplication();
  } finally {
    setSaving(false);
  }
}
```

Thay thế trình kết xuất hàng/thẻ Nhiệm vụ 2 bằng các phiên bản nhận biết hành động bằng cách sử dụng
hành động chính xác này:

```jsx
function MembershipRowAction({ application, onOpen }) {
  const label = isPendingMembershipApplication(application) ? 'Xử lý' : 'Chi tiết';
  return <AdminActionButton icon={Eye} label={label} tone={label === 'Xử lý' ? 'primary' : 'neutral'} onClick={(event) => onOpen(application, event)} />;
}
```

Thêm một cột hành động vào bảng, hiển thị `<MembershipRowAction application={application}
onOpen={openApplication} />` trong mỗi hàng/thẻ và chuyển `Eye`, `AdminActionButton`,
`isPendingMembershipApplication` và `openApplication` thông qua phạm vi/nhập chính xác hiện có. Kết
xuất phương thức bằng trình xử lý đóng khôi phục tiêu điểm:

```jsx
{selectedApplication ? <AdminMembershipReviewModal application={selectedApplication} saving={saving} onClose={closeApplication} onApprove={approveSelected} onReject={rejectSelected} /> : null}
```

Thêm phong cách:

```css
.admin-toast--warning { background: #8a5a12; }
.admin-membership-detail p { display: grid; gap: 4px; margin: 0; }
.admin-membership-detail p > span { overflow-wrap: anywhere; }
```

- [ ] **Bước 4: Xác minh GREEN**

Chạy:

```powershell
node --test frontend/test/adminConsolePresentation.test.js frontend/test/adminConsoleStructure.test.js frontend/test/membershipFrontend.test.js
npm.cmd --prefix frontend run lint
```

Dự kiến: tất cả các kiểm thử đều vượt qua và ESLint không báo cáo kết quả nào.

- [ ] **Bước 5: Ghi điểm kiểm tra**

Chạy `git diff --check`; xác nhận không có tệp sản xuất backend/API/schema nào được thay đổi và giữ
nguyên chênh lệch cho H2.

---

### Nhiệm vụ 4: Chấp nhận trình duyệt được xác thực đáp ứng

**Tệp:**
- Sửa đổi: `frontend/src/page/admin/admin-console.css`
- Sửa đổi: `backend/tests/helpers/systemIntegrationHarness.js`
- Tạo: `tests/e2e/fe04-admin-membership-review.spec.js`
- Sửa đổi: `tests/e2e/fe11-admin-request-management.spec.js`

**Giao diện:**
- Tiêu thụ: Các lớp thành viên quản trị DOM và điểm cuối FE04 thực.
- Tạo ra: `E2E-FE04-ADM01` cộng với ảnh chụp màn hình ở 1440, 1366, 1280 và 390.

- [ ] **Bước 1: Thêm FE04 vào bộ khai thác hệ thống chỉ dành cho kiểm thử**

Mặt khác, máy chủ trình duyệt hiện tại sẽ chuyển sang dịch vụ thành viên được hỗ trợ bởi SQL. Chỉ mở
rộng `backend/tests/helpers/systemIntegrationHarness.js` với phần phụ thuộc FE04 trong bộ nhớ đã
được `membershipRoutes.test.js` sử dụng:

```js
const { createMembershipService } = require('../../src/services/membershipService');
const { makeInMemoryMembershipDependencies } = require('./inMemoryMembershipRepositories');
```

Sau khi xây dựng `notificationService`, hãy tạo:

```js
const membershipDependencies = makeInMemoryMembershipDependencies(authDependencies.state);
const membershipService = createMembershipService({
  membershipRepository: membershipDependencies.membershipRepository,
  auditLogRepository: authDependencies.auditLogRepository,
  notificationRequester: notificationService.createSourceNotificationRequester('FE04'),
});
```

Thêm `membershipService` vào `services` và `membershipDependencies` vào `dependencies`. Không sửa
đổi `backend/src/**`, hợp đồng điểm cuối FE04 hoặc `createVerifiedActor`; Người nộp đơn E2E vẫn phải
nộp qua `POST /api/membership/applications`.

- [ ] **Bước 2: Viết không được chấp nhận trên trình duyệt thực**

Tạo đặc tả mới với trình trợ giúp đăng nhập/thiết lập hiện có và luồng chính xác này:

```js
const { randomUUID } = require('crypto');
const { test, expect } = require('@playwright/test');

const FRONTEND_URL = process.env.E2E_FRONTEND_URL || `http://127.0.0.1:${process.env.E2E_FRONTEND_PORT || 4173}`;
const BACKEND_URL = process.env.E2E_BACKEND_URL || `http://127.0.0.1:${process.env.E2E_BACKEND_PORT || 3100}`;

async function login(page, email, password, expectedPath) {
  await page.goto(`${FRONTEND_URL}/login`);
  await page.getByLabel('Tài khoản của bạn').fill(email);
  await page.getByRole('textbox', { name: 'Mật khẩu', exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe(expectedPath);
}

async function storedAccessToken(page) {
  return page.evaluate(() => localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken'));
}

// @spec FR-FE04-014 AC-FE04-013 BR-FE11-016 AC-FE11-016
test('[E2E-FE04-ADM01] Admin reviews Membership inside the responsive Admin Console', async ({ page, request }) => {
  const runId = randomUUID();
  const password = `E2e-${runId}!A1`;
  const memberEmail = `membership-member-${runId}@example.test`;
  const librarianEmail = `membership-librarian-${runId}@example.test`;
  const adminEmail = `membership-admin-${runId}@example.test`;
  const setup = await request.post(`${BACKEND_URL}/__e2e__/setup`, { data: { memberEmail, librarianEmail, adminEmail, password } });
  expect(setup.status()).toBe(201);

  await login(page, memberEmail, password, '/home');
  const memberHeaders = { Authorization: `Bearer ${await storedAccessToken(page)}` };
  const applied = await request.post(`${BACKEND_URL}/api/membership/applications`, { headers: memberHeaders, data: {} });
  expect(applied.status()).toBe(201);
  const rejectedApplicationId = (await applied.json()).currentApplication.applicationId;

  await login(page, adminEmail, password, '/admin/users');
  await expect(page.locator('.admin-shell__sidebar .admin-shell__nav-item')).toHaveCount(8);
  await expect(page.locator('.admin-shell__sidebar').getByRole('button', { name: 'Phân quyền', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Duyệt hội viên', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Duyệt hội viên', exact: true })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Danh sách đơn đăng ký hội viên' })).toContainText(memberEmail);

  await page.setViewportSize({ width: 1600, height: 900 });
  await expect(page.locator('.admin-membership-table')).toBeVisible();
  await expect(page.locator('.admin-membership-cards')).toBeHidden();
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1366, height: 768 }, { width: 1280, height: 720 }]) {
    await page.setViewportSize(viewport);
    await expect(page.locator('.admin-membership-table')).toBeHidden();
    await expect(page.locator('.admin-membership-cards')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    await page.screenshot({ path: `output/playwright/admin-membership-${viewport.width}.png`, fullPage: true });
  }

  await page.getByRole('button', { name: 'Xử lý', exact: true }).click();
  const rejectionDialog = page.getByRole('dialog');
  await rejectionDialog.getByRole('button', { name: 'Từ chối', exact: true }).click();
  await expect(rejectionDialog.getByText('Lý do từ chối là bắt buộc.', { exact: true })).toBeVisible();
  await rejectionDialog.getByLabel('Lý do từ chối').fill('Thông tin đăng ký chưa đầy đủ.');
  const rejectResponse = page.waitForResponse((response) => response.request().method() === 'PATCH' && response.url().endsWith(`/api/membership/applications/${rejectedApplicationId}/reject`));
  await rejectionDialog.getByRole('button', { name: 'Từ chối', exact: true }).click();
  expect((await rejectResponse).status()).toBe(200);
  await expect(page.getByText('Đã từ chối đơn đăng ký hội viên.', { exact: true })).toBeVisible();

  const reapplied = await request.post(`${BACKEND_URL}/api/membership/applications`, { headers: memberHeaders, data: {} });
  expect(reapplied.status()).toBe(201);
  const approvedApplicationId = (await reapplied.json()).currentApplication.applicationId;
  const pendingReload = page.waitForResponse((response) => response.request().method() === 'GET' && response.url().includes('/api/membership/applications'));
  await page.getByRole('button', { name: 'Làm mới', exact: true }).click();
  expect((await pendingReload).status()).toBe(200);
  await page.getByRole('button', { name: 'Xử lý', exact: true }).click();
  const approveResponse = page.waitForResponse((response) => response.request().method() === 'PATCH' && response.url().endsWith(`/api/membership/applications/${approvedApplicationId}/approve`));
  await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận duyệt đơn' }).click();
  expect((await approveResponse).status()).toBe(200);
  await expect(page.getByText('Đã duyệt đơn đăng ký hội viên.', { exact: true })).toBeVisible();

  await page.getByLabel('Lọc trạng thái hội viên').selectOption('ALL');
  await page.getByRole('button', { name: 'Áp dụng', exact: true }).click();
  await page.getByRole('button', { name: 'Chi tiết', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toContainText('Chỉ có thể xem');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Đóng' }).click();
  await page.getByRole('button', { name: 'Mở menu quản trị', exact: true }).click();
  await page.getByRole('button', { name: 'Duyệt hội viên', exact: true }).click();
  await expect(page.locator('.admin-membership-cards')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await page.screenshot({ path: 'output/playwright/admin-membership-390.png', fullPage: true });
});
```

Thay đổi số lượng điều hướng của thông số FE11 hiện có từ 7 thành 8.

- [ ] **Bước 3: Xác minh RED**

Chạy:

```powershell
$env:E2E_FRONTEND_PORT='48173'
$env:E2E_BACKEND_PORT='43100'
npx.cmd playwright test tests/e2e/fe04-admin-membership-review.spec.js --project=chromium
```

Dự kiến: THẤT BẠI trước khi hợp đồng hành động/mô-đun đáp ứng hoàn tất.

- [ ] **Bước 4: Hoàn thành CSS đáp ứng**

```css
@media (max-width: 1440px) {
  .admin-membership-table { display: none; }
  .admin-membership-cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
}

@media (max-width: 900px) {
  .admin-membership-cards { grid-template-columns: 1fr; }
  .admin-membership-card .admin-action-button { width: 100%; justify-content: center; }
}
```

Giữ mọi thẻ/chiều rộng điều khiển linh hoạt và thực hiện hành động bên trong mỗi thẻ.

- [ ] **Bước 5: Xác minh GREEN và kiểm tra hình ảnh**

Chạy:

```powershell
npx.cmd playwright test tests/e2e/fe04-admin-membership-review.spec.js tests/e2e/fe11-admin-request-management.spec.js --project=chromium
node --test frontend/test/adminConsolePresentation.test.js frontend/test/adminConsoleStructure.test.js frontend/test/membershipFrontend.test.js frontend/test/appShellFrontend.test.js frontend/test/userManagementFrontend.test.js
```

Dự kiến: Chrome 2/2 và mọi kiểm thử Node tập trung đều vượt qua. Mở mọi hình ảnh được tạo và xác
nhận không có thanh bên bị cắt bớt, không tràn trang, danh tính/liên hệ có thể đọc được, hành động
có thể truy cập, phương thức bên trong khung nhìn và thẻ di động một cột.

- [ ] **Bước 6: Ghi điểm kiểm tra**

Chạy `git diff --check`; giữ lại ảnh chụp màn hình làm bằng chứng địa phương và giữ nguyên các thay
đổi về sản phẩm trong khi chờ H2.

---

### Nhiệm vụ 5: Xác thực L1-L4, Cam kết H2, Đẩy và Giai đoạn Azure

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-membership-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-membership-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-membership-management/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-membership-management/CHANGELOG.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- Tạo: `.sdd/reviews/admin-membership-review-integration-validation-2026-07-22.md`

**Giao diện:**
- Tiêu thụ: hoàn thành Nhiệm vụ 1-4 khác biệt và bằng chứng.
- Sản xuất: xem xét việc triển khai/bằng chứng cam kết, chạy theo giai đoạn và mở cổng chấp nhận của con người.

- [ ] **Bước 1: Chạy ma trận xác thực mới**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/membershipRoutes.test.js tests/systemIntegration.test.js
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
$env:E2E_FRONTEND_PORT='48173'
$env:E2E_BACKEND_PORT='43100'
npx.cmd playwright test tests/e2e/fe04-admin-membership-review.spec.js tests/e2e/fe11-admin-request-management.spec.js --project=chromium
git diff --check
```

Dự kiến: cả hai bộ máy chủ tập trung đều vượt qua; giao diện người dùng không có lỗi nào; kiểm tra mã/xây
dựng thẻ; mọi chức năng được triển khai vẫn ở mức trên 70%; crom 2/2; không có lỗi khác biệt.

- [ ] **Bước 2: Thực hiện đánh giá H2**

Ghi lại tất cả bốn lớp:

```text
L1 Tự động: mọi lệnh ở Bước 1 đều đạt.
L2 Đặc tả: FR-FE04-014, AC-FE04-013, BR-FE11-016, AC-FE11-016 ánh xạ tới mã nguồn/kiểm thử.
L3 An toàn: phân quyền máy chủ FE04 vẫn có thẩm quyền; không thay đổi máy chủ production/API/lược đồ/thông tin xác thực/HTML không an toàn; khác biệt duy nhất phía máy chủ là phần nối bộ công cụ E2E trong bộ nhớ.
L4 Nghiệm thu: Chromium/ảnh có xác thực cục bộ đạt; việc con người rà soát Azure vẫn để mở.
```

Từ chối mọi thay đổi sản xuất bên ngoài ranh giới trình bày thành viên Quản trị viên/lớp bao.

- [ ] **Bước 3: Viết bằng chứng và đồng bộ hóa nhiệm vụ**

Bản ghi xác thực phải bao gồm số lượng chính xác, lệnh, đường dẫn ảnh chụp màn hình, quyền sở hữu
lõi/lớp bao và câu lệnh cổng mở này:

```text
FE04-ADM05 và FE11-UXR09 vẫn để mở cho đến khi người rà soát phê duyệt rõ ràng việc rà soát môi trường tiền sản xuất Azure có xác thực.
```

- [ ] **Bước 4: Cam kết sau H2**

```powershell
git add -- frontend/src/page/admin frontend/test backend/tests/helpers/systemIntegrationHarness.js tests/e2e/fe04-admin-membership-review.spec.js tests/e2e/fe11-admin-request-management.spec.js
git commit -m "feat: integrate membership review into admin console"
git add -- .sdd/specs/feat-membership-management .sdd/specs/feat-user-role-management .sdd/reviews/admin-membership-review-integration-validation-2026-07-22.md
git commit -m "docs: record admin membership review validation"
```

Dự kiến: sản phẩm/kiểm thử và bằng chứng là những cam kết được xem xét riêng biệt; cây làm việc sạch sẽ.

- [ ] **Bước 5: Đẩy và triển khai HEAD đã được đánh giá**

```powershell
git push origin chore/release-closeout-reconciliation
gh workflow run deploy-staging.yml --ref chore/release-closeout-reconciliation
gh run list --workflow deploy-staging.yml --branch chore/release-closeout-reconciliation --event workflow_dispatch --limit 1
```

Xem quá trình chạy được trả về cho đến khi các công việc máy chủ, giao diện người dùng và kiểm thử nhanh là
`success`, sau đó xác minh:

```powershell
Invoke-WebRequest -Uri 'https://app-library-api-staging-nhat714.azurewebsites.net/health' -UseBasicParsing
Invoke-WebRequest -Uri 'https://lemon-wave-04db51100.7.azurestaticapps.net/admin/users' -UseBasicParsing
```

Dự kiến: quy trình làm việc SHA tương đương với HEAD đã được đánh giá và cả hai URL đều trả về HTTP 200.

- [ ] **Bước 6: Ghi lại quá trình triển khai và yêu cầu sự chấp nhận của con người**

Thêm URL/ID chạy chính xác và SHA đã triển khai vào xác thực/TASKS/CHANGELOG, cam kết và đẩy bản cập
nhật chỉ có tài liệu đó, sau đó yêu cầu người đánh giá xác minh `Duyệt hội viên` trên máy tính để
bàn/thiết bị di động. Giữ FE04-ADM05 và FE11-UXR09 mở cho đến khi được phê duyệt rõ ràng.
